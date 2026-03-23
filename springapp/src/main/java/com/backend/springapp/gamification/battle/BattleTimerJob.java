package com.backend.springapp.gamification.battle;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs every 5 seconds - checks for expired active battles, lobby timeouts,
 * and stale matchmaking queue entries.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BattleTimerJob {

    private final BattleService battleService;

    @Scheduled(fixedRate = 5000)
    public void run() {
        try {
            battleService.checkExpiredBattles();
            battleService.cancelExpiredLobbies();
        } catch (Exception e) {
            log.error("Battle timer job error: {}", e.getMessage(), e);
        }
    }

    /** Cleanup stale queue entries every 30 seconds. */
    @Scheduled(fixedRate = 30000)
    public void cleanupQueue() {
        try {
            battleService.cleanupStaleQueue();
        } catch (Exception e) {
            log.error("Queue cleanup job error: {}", e.getMessage(), e);
        }
    }
}
