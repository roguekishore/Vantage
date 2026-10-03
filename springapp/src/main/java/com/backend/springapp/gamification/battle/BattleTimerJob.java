package com.backend.springapp.gamification.battle;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.core.LockConfiguration;
import net.javacrumbs.shedlock.core.LockingTaskExecutor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * Battle timer (5 s) and stale-queue cleanup (30 s). Each run takes a cluster-wide ShedLock so only one
 * instance does the work per window.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BattleTimerJob {

    private final BattleLifecycleService lifecycleService;
    private final MatchmakingService matchmakingService;
    private final LockingTaskExecutor lockExecutor;

    @Scheduled(fixedRate = 5000)
    public void run() {
        try {
            lockExecutor.executeWithLock((Runnable) () -> {
                lifecycleService.checkExpiredBattles();
                lifecycleService.cancelExpiredLobbies();
            }, new LockConfiguration(Instant.now(), "battle-timer", Duration.ofSeconds(30), Duration.ofSeconds(2)));
        } catch (Exception e) {
            log.error("Battle timer job error: {}", e.getMessage(), e);
        }
    }

    /** The single stale-queue cleanup job (the duplicate QueueTimeoutJob is gone, B15). */
    @Scheduled(fixedRate = 30000)
    public void cleanupQueue() {
        try {
            lockExecutor.executeWithLock((Runnable) matchmakingService::cleanupStaleQueue,
                    new LockConfiguration(Instant.now(), "queue-cleanup", Duration.ofSeconds(60), Duration.ofSeconds(5)));
        } catch (Exception e) {
            log.error("Queue cleanup job error: {}", e.getMessage(), e);
        }
    }
}
