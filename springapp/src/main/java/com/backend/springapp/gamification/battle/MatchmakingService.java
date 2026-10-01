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
 * Matchmaking queue: join/leave/status, pairing, stale-queue cleanup, battle creation from a pair.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private final MatchmakingQueueRepository queueRepo;
    private final BattleRepository battleRepo;
    private final GamificationService gamificationService;
    private final BattleService battleService;
    private final RealtimePublisher realtimePublisher;
    @Value("${battle.customTimer1v1.enabled:true}")
    private boolean customTimer1v1Enabled = true;
    @Autowired(required = false)
    private MeterRegistry meterRegistry;

    @Transactional
    public Map<String, Object> joinQueue(Long userId, BattleMode mode, Tag difficulty, int problemCount,
                                          Integer durationMinutes) {
        if (mode != BattleMode.CASUAL_1V1 && mode != BattleMode.RANKED_1V1) {
            throw new IllegalArgumentException("Queue supports only 1v1 modes");
        }
        if (problemCount < 1 || problemCount > 3) {
            throw new IllegalArgumentException("problemCount must be between 1 and 3");
        }

        // Auto-clean stale entry if user is already in queue (e.g. page refresh, app restart)
        if (queueRepo.existsByUserId(userId)) {
            queueRepo.deleteByUserId(userId);
            queueRepo.flush();
            log.info("Cleaned stale queue entry for user {} before re-queuing", userId);
        }

        // If user is in a group battle (WAITING/ACTIVE), block 1v1 queue entry.
        Optional<Battle> activeGroupBattle = battleService.findRecentActiveGroupBattleForUser(userId);
        if (activeGroupBattle.isPresent()) {
            throw new IllegalStateException("You are currently in a group battle. Leave/forfeit it before joining 1v1 queue.");
        }

        // If user is already in a WAITING/ACTIVE 1v1 battle, return it for rejoin.
        // Group rooms are handled via the /group flow and must not be surfaced here.
        Optional<Battle> existingBattle = battleService.findRecentOneVsOneBattleForUser(userId);
        if (existingBattle.isPresent()) {
            Battle b = existingBattle.get();
            return Map.of(
                    "status", "ACTIVE_BATTLE",
                    "battleId", b.getId(),
                    "battleState", b.getState().name()
            );
        }

        PlayerStats stats = gamificationService.getOrCreateStats(userId);

        MatchmakingQueue entry = new MatchmakingQueue();
        entry.setUserId(userId);
        entry.setMode(mode);
        entry.setDifficulty(difficulty);
        entry.setProblemCount(problemCount);
        entry.setDurationMinutes(battleService.resolveOneVsOneDurationMinutes(mode, problemCount, durationMinutes));
        entry.setBattleRating(stats.getBattleRating());
        queueRepo.saveAndFlush(entry);
        incrementMetric("battle.queue.join", "mode", mode.name(), "durationMinutes", String.valueOf(entry.getDurationMinutes()));

        log.info("⚔️ User {} joined {} queue (difficulty={}, count={}, duration={}m, BR={})",
            userId, mode, difficulty, problemCount, entry.getDurationMinutes(), stats.getBattleRating());

        return Map.of("status", "QUEUED", "queueId", entry.getId());
    }

    @Transactional(readOnly = true)
    public QueueStatusResponse getQueueStatus(Long userId) {
        // If user is no longer in queue, they might have been matched
        Optional<MatchmakingQueue> queueEntry = queueRepo.findByUserId(userId);
        if (queueEntry.isPresent()) {
            return new QueueStatusResponse("QUEUED", null);
        }

        // Search for a WAITING/ACTIVE 1v1 battle where this user is a participant
        return battleService.findRecentOneVsOneBattleForUser(userId)
                .map(b -> new QueueStatusResponse("MATCHED", b.getId()))
                .orElse(new QueueStatusResponse("NOT_QUEUED", null));
    }

    @Transactional
    public void leaveQueue(Long userId) {
        queueRepo.deleteByUserId(userId);
        log.info("User {} left matchmaking queue", userId);
    }

    /* ═══════════════════════════════════════════════════════════
     * MATCHMAKING (called by scheduled job)
     * ═══════════════════════════════════════════════════════════ */

    @Transactional
    public void processMatchmaking() {
        // Group queue entries by mode + difficulty
        List<MatchmakingQueue> all = queueRepo.findAll();
        Map<String, List<MatchmakingQueue>> groups = all.stream()
                .collect(Collectors.groupingBy(e -> e.getMode() + ":" + e.getDifficulty()));

        for (var group : groups.values()) {
            if (group.size() < 2) continue;

            // Sort by join time
            group.sort(Comparator.comparing(MatchmakingQueue::getJoinedAt));

            Set<Long> matched = new HashSet<>();
            for (int i = 0; i < group.size(); i++) {
                if (matched.contains(group.get(i).getId())) continue;
                MatchmakingQueue a = group.get(i);

                for (int j = i + 1; j < group.size(); j++) {
                    if (matched.contains(group.get(j).getId())) continue;
                    MatchmakingQueue b = group.get(j);

                    if (isRatingCompatible(a, b) && isDurationCompatible(a, b)) {
                        // Use the smaller problem count (both must agree on count)
                        int count = Math.min(a.getProblemCount(), b.getProblemCount());
                        Battle battle = createBattle(a, b, count, a.getDurationMinutes());
                        matched.add(a.getId());
                        matched.add(b.getId());

                        // ── WebSocket: notify both users AFTER transaction commits ──
                        // This prevents clients from fetching a battle that isn't committed yet
                        final Long userA = a.getUserId();
                        final Long userB = b.getUserId();
                        final Long bId = battle.getId();
                        TransactionSynchronizationManager.registerSynchronization(
                                new TransactionSynchronization() {
                                    @Override
                                    public void afterCommit() {
                                        Map<String, Object> matchPayload = Map.of(
                                                "status", "MATCHED", "battleId", bId);
                                        realtimePublisher.toTopic("/topic/queue/" + userA + "/matched", matchPayload);
                                        realtimePublisher.toTopic("/topic/queue/" + userB + "/matched", matchPayload);
                                    }
                                });
                        break;
                    }
                }
            }
        }
    }

    private boolean isRatingCompatible(MatchmakingQueue a, MatchmakingQueue b) {
        int diff = Math.abs(a.getBattleRating() - b.getBattleRating());
        if (a.getMode() == BattleMode.CASUAL_1V1) {
            return diff <= 300;
        }
        // Ranked: base ±200, widens by 50 every 30 seconds
        long aWaitSec = Duration.between(a.getJoinedAt(), LocalDateTime.now()).getSeconds();
        long bWaitSec = Duration.between(b.getJoinedAt(), LocalDateTime.now()).getSeconds();
        long maxWait = Math.max(aWaitSec, bWaitSec);
        int widening = (int) (maxWait / 30) * 50;
        return diff <= (200 + widening);
    }

    private boolean isDurationCompatible(MatchmakingQueue a, MatchmakingQueue b) {
        if (!customTimer1v1Enabled) {
            return true;
        }
        return a.getDurationMinutes() == b.getDurationMinutes();
    }

    @Transactional
    public Battle createBattle(MatchmakingQueue a, MatchmakingQueue b, int problemCount, int durationMinutes) {
        // Create battle
        Battle battle = new Battle();
        battle.setMode(a.getMode());
        battle.setDifficulty(a.getDifficulty());
        battle.setProblemCount(problemCount);
        battle.setDurationMinutes(battleService.resolveOneVsOneDurationMinutes(a.getMode(), problemCount, durationMinutes));
        battle.setState(BattleState.WAITING);
        battleRepo.saveAndFlush(battle);

        // Create participants
        battleService.createParticipant(battle.getId(), a.getUserId(), a.getBattleRating());
        battleService.createParticipant(battle.getId(), b.getUserId(), b.getBattleRating());

        // Select problems
        battleService.selectProblems(battle.getId(), a.getDifficulty(), problemCount,
                List.of(a.getUserId(), b.getUserId()));

        // Remove both from queue
        queueRepo.deleteByUserId(a.getUserId());
        queueRepo.deleteByUserId(b.getUserId());

        log.info("⚔️ Battle {} created: user {} vs user {} (mode={}, diff={}, problems={})",
                battle.getId(), a.getUserId(), b.getUserId(),
                a.getMode(), a.getDifficulty(), problemCount);

        return battle;
    }

    /** Called by QueueTimeoutJob every 30s - remove stale queue entries (>5 min). */
    @Transactional
    public void cleanupStaleQueue() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(5);
        int removed = queueRepo.deleteStaleEntries(cutoff);
        if (removed > 0) {
            log.info("🧹 Removed {} stale matchmaking queue entries", removed);
        }
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
