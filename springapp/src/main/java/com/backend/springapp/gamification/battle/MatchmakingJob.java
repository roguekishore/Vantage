package com.backend.springapp.gamification.battle;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs every 5 seconds - pairs compatible players in the matchmaking queue.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatchmakingJob {

    private final BattleService battleService;

    @Scheduled(fixedRate = 5000)
    public void run() {
        try {
            battleService.processMatchmaking();
        } catch (Exception e) {
            log.error("Matchmaking job error: {}", e.getMessage(), e);
        }
    }
}
