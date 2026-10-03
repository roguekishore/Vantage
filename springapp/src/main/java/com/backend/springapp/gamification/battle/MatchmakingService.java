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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
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
    private final com.backend.springapp.experiments.ExperimentService experimentService;
    @Value("${battle.customTimer1v1.enabled:true}")
    private boolean customTimer1v1Enabled = true;
    @Value("${vantage.matchmaking.batch-size:200}")
    private int batchSize = 200;
    @Autowired(required = false)
    private PlatformTransactionManager txManager;
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
        List<Long> ids = queueRepo.lockIdsByUserIdSkipLocked(userId);
        if (ids.isEmpty()) {
            // Either not queued, or a matcher's open claim holds the row: the user is being matched, leave is a no-op.
            log.info("User {} leave: nothing to remove (not queued or currently being matched)", userId);
            return;
        }
        queueRepo.deleteByIds(ids);
        log.info("User {} left matchmaking queue", userId);
    }

    /* ═══════════════════════════════════════════════════════════
     * MATCHMAKING (called by scheduled job)
     * ═══════════════════════════════════════════════════════════ */

    /** Each instance runs this every 5 s; correctness comes from FOR UPDATE SKIP LOCKED, not from a lock. */
    public void processMatchmaking() {
        processPairs(true);
    }

    /** Same pass, but rethrows the first per-pair failure (e.g. a deadlock). Used by the concurrency IT. */
    public void processMatchmakingStrict() {
        processPairs(false);
    }

    private void processPairs(boolean swallow) {
        for (Object[] pair : queueRepo.findQueuedPairs()) {
            BattleMode mode = (BattleMode) pair[0];
            Tag difficulty = (Tag) pair[1];
            try {
                inTransaction(() -> matchPair(mode, difficulty));
            } catch (RuntimeException e) {
                if (!swallow) throw e;
                log.warn("Matchmaking for {}:{} failed, will retry next tick: {}", mode, difficulty, e.getMessage());
            }
        }
    }

    private void inTransaction(Runnable work) {
        if (txManager == null) {
            work.run();
            return;
        }
        new TransactionTemplate(txManager).executeWithoutResult(status -> work.run());
    }

    /** One transaction: claim a rating-sorted batch (skipping rows other instances hold), pair, create, delete. */
    private void matchPair(BattleMode mode, Tag difficulty) {
        List<MatchmakingQueue> claimed = queueRepo.claimBatch(mode.name(), difficulty.name(), batchSize);
        for (MatchmakingQueue[] pair : findPairs(claimed, LocalDateTime.now())) {
            MatchmakingQueue a = pair[0];
            MatchmakingQueue b = pair[1];
            // Use the smaller problem count (both must agree on count)
            int count = Math.min(a.getProblemCount(), b.getProblemCount());
            Battle battle = createBattle(a, b, count, a.getDurationMinutes());

            // Notify both users AFTER the transaction commits, so clients never fetch an uncommitted battle.
            final Long userA = a.getUserId();
            final Long userB = b.getUserId();
            final Long bId = battle.getId();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    Map<String, Object> matchPayload = Map.of("status", "MATCHED", "battleId", bId);
                    realtimePublisher.toTopic("/topic/queue/" + userA + "/matched", matchPayload);
                    realtimePublisher.toTopic("/topic/queue/" + userB + "/matched", matchPayload);
                }
            });
        }
    }

    /**
     * Pure pairing over a claimed batch. Sorts by rating then join time, then for each unmatched entry scans only
     * rating-adjacent successors while the rating gap is inside the widest possible band, pairing with the first
     * one that passes the unchanged compatibility rules.
     */
    List<MatchmakingQueue[]> findPairs(List<MatchmakingQueue> claimed, LocalDateTime now) {
        List<MatchmakingQueue> sorted = new ArrayList<>(claimed);
        sorted.sort(Comparator.comparingInt(MatchmakingQueue::getBattleRating)
                .thenComparing(MatchmakingQueue::getJoinedAt));
        List<MatchmakingQueue[]> pairs = new ArrayList<>();
        if (sorted.size() < 2) return pairs;

        // Widest band any pair in this batch could be allowed (ranked widens with the longest wait).
        long longestWait = 0;
        for (MatchmakingQueue e : sorted) {
            longestWait = Math.max(longestWait, Duration.between(e.getJoinedAt(), now).getSeconds());
        }
        int widest = sorted.get(0).getMode() == BattleMode.CASUAL_1V1 ? 300 : rankedBand(longestWait);

        boolean[] used = new boolean[sorted.size()];
        for (int i = 0; i < sorted.size(); i++) {
            if (used[i]) continue;
            MatchmakingQueue a = sorted.get(i);
            for (int j = i + 1; j < sorted.size(); j++) {
                if (used[j]) continue;
                MatchmakingQueue b = sorted.get(j);
                if (b.getBattleRating() - a.getBattleRating() > widest) break;
                if (isRatingCompatible(a, b, now) && isDurationCompatible(a, b)) {
                    used[i] = true;
                    used[j] = true;
                    pairs.add(new MatchmakingQueue[]{a, b});
                    break;
                }
            }
        }
        return pairs;
    }

    static int rankedBand(long maxWaitSec) {
        return 200 + (int) (maxWaitSec / 30) * 50;
    }

    boolean isRatingCompatible(MatchmakingQueue a, MatchmakingQueue b, LocalDateTime now) {
        int diff = Math.abs(a.getBattleRating() - b.getBattleRating());
        if (a.getMode() == BattleMode.CASUAL_1V1) {
            return diff <= 300;
        }
        // Ranked: base +-200, widens by 50 every 30 seconds of the longer wait
        long aWaitSec = Duration.between(a.getJoinedAt(), now).getSeconds();
        long bWaitSec = Duration.between(b.getJoinedAt(), now).getSeconds();
        return diff <= rankedBand(Math.max(aWaitSec, bWaitSec));
    }

    boolean isDurationCompatible(MatchmakingQueue a, MatchmakingQueue b) {
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

        experimentService.assignOnCreate(battle.getId(), battle.getMode());

        // Remove both from queue
        queueRepo.deleteByIds(List.of(a.getId(), b.getId()));

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
