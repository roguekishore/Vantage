package com.backend.springapp.gamification.battle;

import com.backend.springapp.gamification.GamificationService;
import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import com.backend.springapp.gamification.achievement.AchievementService;
import com.backend.springapp.gamification.coins.TransactionSource;
import com.backend.springapp.problem.Problem;
import com.backend.springapp.problem.ProblemRepository;
import com.backend.springapp.problem.Tag;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserProgressRepository;
import com.backend.springapp.user.UserRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Objects;
import com.backend.springapp.realtime.RealtimePublisher;

/**
 * Battle completion: winner, ELO, rewards, forfeit, abandon, timer expiry, lobby expiry.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BattleLifecycleService {

    private final BattleRepository battleRepo;
    private final BattleParticipantRepository participantRepo;
    private final PlayerStatsRepository statsRepo;
    private final GamificationService gamificationService;
    private final AchievementService achievementService;
    private final BattleService battleService;
    private final BattleViews battleViews;
    private final RealtimePublisher realtimePublisher;
    @Autowired(required = false)
    private MeterRegistry meterRegistry;

    @Transactional
    public void completeBattle(Long battleId) {
        Battle battle = battleRepo.findById(battleId).orElse(null);
        if (battle == null || battle.getState() == BattleState.COMPLETED
                         || battle.getState() == BattleState.CANCELLED) return;

        // Route group battles to their own completion handler
        if (battle.getMode() == BattleMode.GROUP_FFA) {
            completeGroupBattle(battleId);
            return;
        }

        battle.setState(BattleState.COMPLETED);
        battle.setCompletedAt(LocalDateTime.now());

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        if (participants.size() != 2) {
            battle.setState(BattleState.CANCELLED);
            battleRepo.saveAndFlush(battle);
            return;
        }

        BattleParticipant p1 = participants.get(0);
        BattleParticipant p2 = participants.get(1);

        // Determine winner using tiebreaker chain
        Long winnerId = determineWinner(p1, p2);
        battle.setWinnerId(winnerId);
        battleRepo.saveAndFlush(battle);

        // Calculate and apply rating changes + rewards
        boolean isRanked = battle.getMode() == BattleMode.RANKED_1V1;
        applyBattleOutcome(p1, p2, winnerId, isRanked);

        log.info("⚔️ Battle {} completed. Winner: {}", battleId,
                winnerId != null ? winnerId : "DRAW");

        // ── WebSocket: broadcast completion + result to both players ──
        broadcastBattleCompletion(battleId, participants);
    }

    /**
     * Tiebreaker chain:
     * 1) More problems solved → wins
     * 2) Equal → faster total solve time → wins
     * 3) Equal → fewer submissions → wins
     * 4) Full tie → DRAW (null)
     */
    public static Long determineWinner(BattleParticipant p1, BattleParticipant p2) {
        // 1. Problems solved
        if (p1.getProblemsSolved() != p2.getProblemsSolved()) {
            return p1.getProblemsSolved() > p2.getProblemsSolved()
                    ? p1.getUserId() : p2.getUserId();
        }
        // 2. Total solve time (lower wins)
        if (p1.getTotalSolveTimeMs() != p2.getTotalSolveTimeMs()) {
            return p1.getTotalSolveTimeMs() < p2.getTotalSolveTimeMs()
                    ? p1.getUserId() : p2.getUserId();
        }
        // 3. Fewer submissions
        if (p1.getTotalSubmissions() != p2.getTotalSubmissions()) {
            return p1.getTotalSubmissions() < p2.getTotalSubmissions()
                    ? p1.getUserId() : p2.getUserId();
        }
        // 4. Draw
        return null;
    }

    public static String determineLeaderReason(BattleParticipant p1, BattleParticipant p2) {
        if (p1.getProblemsSolved() != p2.getProblemsSolved()) {
            return "PROBLEMS_SOLVED";
        }
        if (p1.getTotalSolveTimeMs() != p2.getTotalSolveTimeMs()) {
            return "SOLVE_TIME";
        }
        if (p1.getTotalSubmissions() != p2.getTotalSubmissions()) {
            return "SUBMISSIONS";
        }
        return "TIED";
    }

    private void applyBattleOutcome(BattleParticipant p1, BattleParticipant p2,
                                     Long winnerId, boolean isRanked) {
        if (isRanked) {
            applyElo(p1, p2, winnerId);
        }

        // Reward coins + XP
        rewardParticipant(p1, winnerId, isRanked);
        rewardParticipant(p2, winnerId, isRanked);

        // ── Phase 7: Check battle achievements for both players ──
        try {
            achievementService.checkBattleAchievements(p1.getUserId(), p1.getBattleId());
            achievementService.checkBattleAchievements(p2.getUserId(), p2.getBattleId());
        } catch (Exception e) {
            log.warn("Achievement check failed after battle: {}", e.getMessage());
        }
    }

    private void applyElo(BattleParticipant p1, BattleParticipant p2, Long winnerId) {
        long p1Battles = participantRepo.countCompletedRankedBattles(p1.getUserId());
        long p2Battles = participantRepo.countCompletedRankedBattles(p2.getUserId());

        int k1 = kFactor(p1Battles);
        int k2 = kFactor(p2Battles);

        double expected1 = expectedScore(p1.getRatingBefore(), p2.getRatingBefore());
        double expected2 = 1.0 - expected1;

        double actual1, actual2;
        if (winnerId == null) {
            actual1 = 0.5;
            actual2 = 0.5;
        } else if (winnerId.equals(p1.getUserId())) {
            actual1 = 1.0;
            actual2 = 0.0;
        } else {
            actual1 = 0.0;
            actual2 = 1.0;
        }

        int newRating1 = (int) Math.round(p1.getRatingBefore() + k1 * (actual1 - expected1));
        int newRating2 = (int) Math.round(p2.getRatingBefore() + k2 * (actual2 - expected2));

        // Floor at 0
        newRating1 = Math.max(0, newRating1);
        newRating2 = Math.max(0, newRating2);

        p1.setRatingAfter(newRating1);
        p2.setRatingAfter(newRating2);
        participantRepo.saveAndFlush(p1);
        participantRepo.saveAndFlush(p2);

        // Update PlayerStats
        PlayerStats s1 = gamificationService.getOrCreateStats(p1.getUserId());
        s1.setBattleRating(newRating1);
        statsRepo.saveAndFlush(s1);

        PlayerStats s2 = gamificationService.getOrCreateStats(p2.getUserId());
        s2.setBattleRating(newRating2);
        statsRepo.saveAndFlush(s2);

        log.info("ELO: user {} {} → {}, user {} {} → {}",
                p1.getUserId(), p1.getRatingBefore(), newRating1,
                p2.getUserId(), p2.getRatingBefore(), newRating2);
    }

    private int kFactor(long battlesPlayed) {
        if (battlesPlayed < 10) return 40;
        if (battlesPlayed < 30) return 20;
        return 15;
    }

    private double expectedScore(int myRating, int oppRating) {
        return 1.0 / (1.0 + Math.pow(10, (oppRating - myRating) / 400.0));
    }

    private void rewardParticipant(BattleParticipant bp, Long winnerId, boolean isRanked) {
        int coins, xp;
        boolean isWinner = bp.getUserId().equals(winnerId);
        boolean isDraw = winnerId == null;

        if (isDraw) {
            coins = 15;
            xp = 25;
        } else if (isWinner) {
            coins = isRanked ? 60 : 30;
            xp = isRanked ? 75 : 40;
        } else {
            coins = isRanked ? 10 : 5;
            xp = isRanked ? 15 : 10;
        }

        // Safety guard: skip if no rewards to give
        if (coins <= 0 && xp <= 0) return;

        PlayerStats stats = gamificationService.getOrCreateStats(bp.getUserId());
        stats.setXp(stats.getXp() + xp);
        stats.setLevel(GamificationService.calculateLevel(stats.getXp()));
        statsRepo.saveAndFlush(stats);

        if (coins > 0) {
            gamificationService.creditCoins(bp.getUserId(), coins, TransactionSource.BATTLE_WIN, bp.getBattleId());
        }

        // Track battle XP + coins on the weekly leaderboard
        gamificationService.addWeeklyBattleReward(bp.getUserId(), coins, xp);

        log.info("Battle reward: user {} gets {} coins + {} XP ({})",
                bp.getUserId(), coins, xp,
                isDraw ? "DRAW" : isWinner ? "WIN" : "LOSS");
    }

    @Transactional
    public void forfeit(Long battleId, Long userId) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));

        // Graceful no-op if battle already resolved (e.g. timer expired between UI check and click)
        if (battle.getState() == BattleState.COMPLETED || battle.getState() == BattleState.CANCELLED) {
            log.info("Forfeit request for already resolved battle {} by user {} — ignoring", battleId, userId);
            return;
        }

        // Group FFA: mark forfeiter, keep room running for others.
        // Early-complete only when <=1 non-forfeited player remains.
        if (battle.getMode() == BattleMode.GROUP_FFA) {
            incrementMetric("battle.complete.trigger", "reason", "forfeit", "mode", battle.getMode().name());
            if (battle.getState() != BattleState.ACTIVE) {
                throw new IllegalStateException("Cannot forfeit before group battle starts");
            }

            List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
            BattleParticipant forfeiter = participants.stream()
                    .filter(p -> p.getUserId().equals(userId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Not in this battle"));

            if (forfeiter.isForfeited()) {
                return;
            }

            // Keep forfeiter at the bottom and disable further submissions.
            forfeiter.setForfeited(true);
            forfeiter.setGroupScore(Math.min(forfeiter.getGroupScore(), -1_000_000));
            participantRepo.saveAndFlush(forfeiter);

            long activePlayers = participants.stream().filter(p -> !p.isForfeited()).count();
            if (activePlayers <= 1) {
                completeGroupBattle(battleId);
            } else {
                for (BattleParticipant p : participants) {
                    try {
                        GroupBattleStateDTO stateDTO = battleViews.getGroupBattleState(battleId, p.getUserId());
                        realtimePublisher.toTopic("/topic/battle/" + battleId + "/group-state/" + p.getUserId(), stateDTO);
                    } catch (Exception e) {
                        log.warn("Failed to broadcast group forfeit state to user {}: {}", p.getUserId(), e.getMessage());
                    }
                }
            }

            log.info("🏟️ User {} forfeited group battle {}", userId, battleId);
            return;
        }

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        BattleParticipant forfeiter = participants.stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Not in this battle"));
        incrementMetric("battle.complete.trigger", "reason", "forfeit", "mode", battle.getMode().name());

        BattleParticipant opponent = participants.stream()
                .filter(p -> !p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow();

        // Set winner as opponent
        battle.setWinnerId(opponent.getUserId());
        battle.setState(BattleState.COMPLETED);
        battle.setCompletedAt(LocalDateTime.now());
        battleRepo.saveAndFlush(battle);

        boolean isRanked = battle.getMode() == BattleMode.RANKED_1V1;

        // Apply ELO (opponent wins)
        if (isRanked) {
            applyElo(forfeiter, opponent, opponent.getUserId());
        }

        // Reward opponent as winner, forfeiter gets nothing
        rewardParticipant(opponent, opponent.getUserId(), isRanked);

        log.info("⚔️ User {} forfeited battle {}. Winner: {}",
                userId, battleId, opponent.getUserId());

        // ── WebSocket: broadcast forfeit result to both players ──
        broadcastBattleCompletion(battleId, participants);
    }

    /* ═══════════════════════════════════════════════════════════
     * SCHEDULED JOB HELPERS
     * ═══════════════════════════════════════════════════════════ */

    /** Called by BattleTimerJob every 5s - complete expired active battles. */
    @Transactional
    public void checkExpiredBattles() {
        List<Battle> expired = battleRepo.findExpiredActiveBattles();
        for (Battle b : expired) {
            log.info("⏰ Battle {} timer expired, resolving...", b.getId());
            incrementMetric("battle.complete.trigger", "reason", "timer", "mode", b.getMode().name());
            completeTimedOutBattle(b.getId());
        }
    }

    /**
     * Timer-expired handling:
     * - 1v1: cancel with no winner and no result payload / no ELO movement.
     * - Group FFA: keep existing completion behavior.
     */
    @Transactional
    public void completeTimedOutBattle(Long battleId) {
        Battle battle = battleRepo.findById(battleId).orElse(null);
        if (battle == null || battle.getState() == BattleState.COMPLETED
                         || battle.getState() == BattleState.CANCELLED) return;

        if (battle.getMode() == BattleMode.GROUP_FFA) {
            completeGroupBattle(battleId);
            return;
        }

        battle.setState(BattleState.CANCELLED);
        battle.setWinnerId(null);
        battle.setCompletedAt(LocalDateTime.now());
        battleRepo.saveAndFlush(battle);

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        for (BattleParticipant p : participants) {
            try {
                BattleStateDTO stateDTO = battleViews.getBattleState(battleId, p.getUserId());
                realtimePublisher.toTopic("/topic/battle/" + battleId + "/state/" + p.getUserId(), stateDTO);
            } catch (Exception e) {
                log.warn("Failed to broadcast timeout-cancel state to user {}: {}", p.getUserId(), e.getMessage());
            }
        }
    }

    /** Called by lobby timeout check - cancel 1v1 waiting battles past 60s. Group rooms have no auto-cancel. */
    @Transactional
    public void cancelExpiredLobbies() {
        List<Battle> expired = battleRepo.findExpiredLobbyBattles();
        for (Battle b : expired) {
            // Group rooms stay open until creator starts - never auto-cancel
            if (b.getMode() == BattleMode.GROUP_FFA) continue;

            b.setState(BattleState.CANCELLED);
            b.setCompletedAt(LocalDateTime.now());
            battleRepo.saveAndFlush(b);
            log.info("⏰ Battle {} lobby expired, cancelled.", b.getId());

            // ── WebSocket: notify players the lobby was cancelled ──
            List<BattleParticipant> lobbyParticipants = participantRepo.findByBattleId(b.getId());
            for (BattleParticipant p : lobbyParticipants) {
                realtimePublisher.toTopic("/topic/battle/" + b.getId() + "/lobby/" + p.getUserId(),
                        Map.of("state", "CANCELLED", "battleId", b.getId()));
            }
        }
    }

    /* ═══════════════════════════════════════════════════════════
     * WEBSOCKET BROADCAST HELPERS
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Broadcast battle completion/result to both participants.
     * Sends to /topic/battle/{id}/state (with COMPLETED state)
     * and /topic/battle/{id}/result for each player's personalized result.
     */
    private void broadcastBattleCompletion(Long battleId, List<BattleParticipant> participants) {
        // Broadcast per-user state + result so each player sees their own perspective
        for (BattleParticipant p : participants) {
            try {
                BattleStateDTO stateDTO = battleViews.getBattleState(battleId, p.getUserId());
                realtimePublisher.toTopic("/topic/battle/" + battleId + "/state/" + p.getUserId(), stateDTO);
            } catch (Exception e) {
                log.warn("Failed to broadcast state to user {}: {}", p.getUserId(), e.getMessage());
            }
            try {
                BattleResultDTO result = battleViews.getBattleResult(battleId, p.getUserId());
                realtimePublisher.toTopic("/topic/battle/" + battleId + "/result/" + p.getUserId(), result);
            } catch (Exception e) {
                log.warn("Failed to broadcast result to user {}: {}", p.getUserId(), e.getMessage());
            }
        }
    }

    @Transactional
    public void abandonBattle(Long battleId, Long userId) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));

        if (battle.getState() == BattleState.COMPLETED || battle.getState() == BattleState.CANCELLED) {
            return; // already done
        }

        // Group FFA abandon: forfeit if not already, then return.
        // The battle keeps running for other players.
        if (battle.getMode() == BattleMode.GROUP_FFA) {
            BattleParticipant me = participantRepo.findByBattleIdAndUserId(battleId, userId).orElse(null);
            if (me != null && me.getProblemsSolved() >= battle.getProblemCount()) {
                log.info("🏟️ User {} left group battle {} after finishing all problems", userId, battleId);
                return;
            }
            if (me != null && !me.isForfeited()) {
                forfeit(battleId, userId);
            }
            log.info("🏟️ User {} abandoned group battle {}", userId, battleId);
            return;
        }

        // If WAITING (lobby) - just cancel
        if (battle.getState() == BattleState.WAITING) {
            battle.setState(BattleState.CANCELLED);
            battle.setCompletedAt(LocalDateTime.now());
            battleRepo.saveAndFlush(battle);
            log.info("⚔️ Battle {} abandoned (was WAITING) by user {}", battleId, userId);
            return;
        }

        // ACTIVE - treat as forfeit by this user
        forfeit(battleId, userId);
        log.info("⚔️ Battle {} abandoned (was ACTIVE) by user {}", battleId, userId);
    }

    @Transactional
    public void completeGroupBattle(Long battleId) {
        Battle battle = battleRepo.findById(battleId).orElse(null);
        if (battle == null || battle.getState() == BattleState.COMPLETED
                         || battle.getState() == BattleState.CANCELLED) return;

        battle.setState(BattleState.COMPLETED);
        battle.setCompletedAt(LocalDateTime.now());
        battleRepo.saveAndFlush(battle);

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        if (participants.isEmpty()) {
            battle.setState(BattleState.CANCELLED);
            battleRepo.saveAndFlush(battle);
            return;
        }

        // Rank non-forfeited players first, then by score desc, tie-break by solved/submissions.
        participants.sort(Comparator
            .comparing(BattleParticipant::isForfeited)
            .thenComparingInt(p -> -p.getGroupScore())
            .thenComparingInt(p -> -p.getProblemsSolved())
                .thenComparingInt(BattleParticipant::getTotalSubmissions));

        for (int i = 0; i < participants.size(); i++) {
            participants.get(i).setPlacement(i + 1);
            participantRepo.saveAndFlush(participants.get(i));
        }

        for (BattleParticipant p : participants) {
            rewardGroupParticipant(p);
        }

        // Broadcast completion to each player
        for (BattleParticipant p : participants) {
            try {
                GroupBattleStateDTO stateDTO = battleViews.getGroupBattleState(battleId, p.getUserId());
                realtimePublisher.toTopic("/topic/battle/" + battleId + "/group-state/" + p.getUserId(), stateDTO);
                GroupBattleResultDTO result = battleViews.getGroupBattleResult(battleId, p.getUserId());
                realtimePublisher.toTopic("/topic/battle/" + battleId + "/group-result/" + p.getUserId(), result);
            } catch (Exception e) {
                log.warn("Failed to broadcast group completion to user {}: {}", p.getUserId(), e.getMessage());
            }
        }

        log.info("🏟️ Group battle {} completed.", battleId);
    }

    private void rewardGroupParticipant(BattleParticipant bp) {
        int placement = bp.getPlacement() != null ? bp.getPlacement() : 99;
        int[] cxp = rewardForGroupParticipant(bp);
        int coins = cxp[0];
        int xp = cxp[1];

        // Skip reward for forfeited players (they get 0/0 which would crash creditCoins)
        if (coins <= 0 && xp <= 0) {
            log.info("Group reward: user {} (rank={}, forfeited={}) → skipped (0 coins, 0 XP)",
                    bp.getUserId(), placement, bp.isForfeited());
            return;
        }

        PlayerStats stats = gamificationService.getOrCreateStats(bp.getUserId());
        stats.setXp(stats.getXp() + xp);
        stats.setLevel(GamificationService.calculateLevel(stats.getXp()));
        statsRepo.saveAndFlush(stats);

        if (coins > 0) {
            gamificationService.creditCoins(bp.getUserId(), coins, TransactionSource.BATTLE_WIN, bp.getBattleId());
        }
        gamificationService.addWeeklyBattleReward(bp.getUserId(), coins, xp);

        log.info("Group reward: user {} (rank={}, forfeited={}) → {} coins + {} XP",
                bp.getUserId(), placement, bp.isForfeited(), coins, xp);
    }

    public static int[] rewardForGroupParticipant(BattleParticipant bp) {
        if (bp.isForfeited()) {
            return new int[]{0, 0};
        }
        int placement = bp.getPlacement() != null ? bp.getPlacement() : 99;
        return placementRewards(placement);
    }

    /** Returns [coins, xp] for a given placement. */
    public static int[] placementRewards(int placement) {
        return switch (placement) {
            case 1  -> new int[]{80, 100};
            case 2  -> new int[]{50,  60};
            case 3  -> new int[]{30,  35};
            default -> new int[]{10,  15};
        };
    }


    private void incrementMetric(String name, String... tags) {
        if (meterRegistry == null) return;
        try {
            meterRegistry.counter(name, tags).increment();
        } catch (Exception ignored) {
            // Keep gameplay path resilient if metrics backend is unavailable.
        }
    }
}
