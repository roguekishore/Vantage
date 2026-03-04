package com.backend.springapp.gamification.streak;

import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import com.backend.springapp.store.StoreItemRepository;
import com.backend.springapp.store.StoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Midnight scheduled job that resets broken streaks.
 *
 * A streak is "broken" if the user's lastActivityDate is before yesterday
 * (i.e. they missed an entire day) and their currentStreak is still > 0.
 *
 * Phase 3: Before resetting, the job checks whether the user owns a
 * Streak Shield. If they do, one shield is consumed and the streak is preserved.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StreakResetJob {

    private final PlayerStatsRepository statsRepository;
    private final StoreService storeService;
    private final StoreItemRepository storeItemRepository;

    /**
     * Runs every day at midnight server time.
     * For each user with a broken streak, checks for a Streak Shield
     * before resetting. If a shield is present, it is consumed and the
     * streak is preserved.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetBrokenStreaks() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<PlayerStats> staleUsers = statsRepository.findStaleStreaks(yesterday);

        if (staleUsers.isEmpty()) {
            log.debug("StreakResetJob: no broken streaks to reset");
            return;
        }

        // Look up the Streak Shield store item ID by name (safe even if IDs shift)
        Long shieldItemId = storeItemRepository.findByName(StreakService.SHIELD_ITEM_NAME)
                .map(item -> item.getId())
                .orElse(null);

        int resetCount    = 0;
        int shieldedCount = 0;

        for (PlayerStats stats : staleUsers) {
            Long userId = stats.getUserId();

            if (shieldItemId != null && storeService.getItemQuantity(userId, shieldItemId) > 0) {
                // Consume one shield and preserve the streak
                try {
                    storeService.consumeItem(userId, shieldItemId);
                    stats.setLastShieldUsedDate(LocalDate.now());
                    statsRepository.saveAndFlush(stats);
                    shieldedCount++;
                    log.info("🛡️ StreakResetJob: Streak Shield consumed for user {} — {}-day streak preserved!",
                            userId, stats.getCurrentStreak());
                } catch (IllegalStateException e) {
                    // Race condition fallback — treat as no shield
                    log.warn("StreakResetJob: Failed to consume shield for user {} — resetting streak: {}",
                            userId, e.getMessage());
                    stats.setCurrentStreak(0);
                    statsRepository.saveAndFlush(stats);
                    resetCount++;
                }
            } else {
                // No shield — reset the streak
                stats.setCurrentStreak(0);
                statsRepository.saveAndFlush(stats);
                resetCount++;
            }
        }

        log.info("🔥 StreakResetJob: {} streak(s) reset, {} saved by shield (lastActivity < {})",
                resetCount, shieldedCount, yesterday);
    }
}
