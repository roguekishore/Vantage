package com.backend.springapp.gamification.battle;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs every 30 seconds — removes players who've been in queue > 5 minutes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class QueueTimeoutJob {

    private final BattleService battleService;

    @Scheduled(fixedRate = 30000)
    public void run() {
        try {
            battleService.cleanupStaleQueue();
        } catch (Exception e) {
            log.error("Queue timeout job error: {}", e.getMessage(), e);
        }
    }
}
