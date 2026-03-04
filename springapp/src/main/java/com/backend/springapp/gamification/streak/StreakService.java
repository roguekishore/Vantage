package com.backend.springapp.gamification.streak;

import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.coins.CoinTransaction;
import com.backend.springapp.gamification.coins.CoinTransactionRepository;
import com.backend.springapp.gamification.coins.TransactionSource;
import com.backend.springapp.store.InventoryItemRepository;
import com.backend.springapp.store.StoreItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * All streak-related business logic:
 * <ul>
 *   <li>Daily streak tracking (increment / reset)</li>
 *   <li>Milestone bonus detection and crediting</li>
 *   <li>Coin multiplier calculation</li>
 *   <li>StreakDTO assembly for the REST layer</li>
 * </ul>
 *
 * Called by {@link com.backend.springapp.gamification.GamificationService}
 * after every problem solve, and referenced by {@link StreakResetJob} at midnight.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StreakService {

    private final CoinTransactionRepository txRepository;
    private final StoreItemRepository storeItemRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /* ═══════════════════════════════════════════════════════════
     * CONSTANTS
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Milestone table: each row is {@code { dayCount, coinBonus, xpBonus }}.
     * A user who reaches exactly {@code dayCount} consecutive days earns the bonus.
     */
    public static final int[][] MILESTONES = {
        {   3,    50,     0 },
        {   7,   150,   100 },
        {  14,   300,   200 },
        {  30,   500,   400 },
        { 100,  2000,  1000 },
        { 365, 10000,     0 },
    };

    /** Name of the Streak Shield store item — used by {@link StreakResetJob}. */
    public static final String SHIELD_ITEM_NAME = "Streak Shield";

    /* ═══════════════════════════════════════════════════════════
     * MULTIPLIER
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Coin multiplier earned by the given streak.
     * Formula: {@code min(1.5, 1.0 + streak × 0.01)} — caps at 1.5× after 50 days.
     */
    public static double multiplierFor(int currentStreak) {
        return Math.min(1.5, 1.0 + currentStreak * 0.01);
    }

    /* ═══════════════════════════════════════════════════════════
     * STREAK UPDATE
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Advances (or resets) the streak based on today vs the last activity date.
     * <ul>
     *   <li>Same day  → no change (already solved today)</li>
     *   <li>Yesterday → consecutive day, streak + 1</li>
     *   <li>Older / null → missed ≥ 1 day, reset to 1</li>
     * </ul>
     * Updates {@code longestStreak} and {@code lastActivityDate} in-memory.
     * Does <b>not</b> persist — the caller is responsible for saving {@code PlayerStats}.
     *
     * @return the new {@code currentStreak} value
     */
    public int updateStreak(PlayerStats stats) {
        LocalDate today = LocalDate.now();
        LocalDate last  = stats.getLastActivityDate();

        if (last != null && last.equals(today)) {
            return stats.getCurrentStreak(); // already solved today — no change
        }

        if (last != null && last.equals(today.minusDays(1))) {
            stats.setCurrentStreak(stats.getCurrentStreak() + 1); // consecutive day
        } else {
            stats.setCurrentStreak(1); // first solve ever, or missed ≥ 1 day
        }

        if (stats.getCurrentStreak() > stats.getLongestStreak()) {
            stats.setLongestStreak(stats.getCurrentStreak());
        }
        stats.setLastActivityDate(today);
        return stats.getCurrentStreak();
    }

    /* ═══════════════════════════════════════════════════════════
     * MILESTONE CHECK
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Checks whether the current streak has hit a milestone.
     * If it has, credits the bonus coins/XP directly onto {@code stats}
     * and persists a {@code STREAK_BONUS} {@link CoinTransaction} record.
     * Does <b>not</b> save {@code PlayerStats} — the caller handles that.
     *
     * @return {@code int[]{coinBonus, xpBonus}} — both 0 when no milestone was hit
     */
    @Transactional
    public int[] checkAndCreditMilestones(PlayerStats stats) {
        int streak = stats.getCurrentStreak();
        for (int[] m : MILESTONES) {
            if (streak == m[0]) {
                int coinBonus = m[1];
                int xpBonus   = m[2];

                if (coinBonus > 0) stats.setCoins(stats.getCoins() + coinBonus);
                if (xpBonus   > 0) stats.setXp(stats.getXp() + xpBonus);

                if (coinBonus > 0) {
                    CoinTransaction tx = new CoinTransaction();
                    tx.setUserId(stats.getUserId());
                    tx.setAmount(coinBonus);
                    tx.setSource(TransactionSource.STREAK_BONUS);
                    tx.setBalanceAfter(stats.getCoins());
                    tx.setReferenceId((long) streak); // reference = milestone day count
                    txRepository.saveAndFlush(tx);
                }

                log.info("🔥 User {} hit {}-day streak milestone! +{} coins, +{} XP",
                        stats.getUserId(), streak, coinBonus, xpBonus);
                return new int[]{ coinBonus, xpBonus };
            }
        }
        return new int[]{ 0, 0 };
    }

    /* ═══════════════════════════════════════════════════════════
     * STREAK DTO
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Assembles a {@link StreakDTO} for the REST endpoint.
     * Reads shield inventory count (Phase 3) and whether a shield was used today.
     */
    public StreakDTO buildStreakDTO(PlayerStats stats) {
        boolean solvedToday = stats.getLastActivityDate() != null
                && stats.getLastActivityDate().equals(LocalDate.now());

        double mult = multiplierFor(stats.getCurrentStreak());
        int[]  next = nextMilestone(stats.getCurrentStreak());

        // Phase 3: count Streak Shields currently in the user's inventory
        int shieldCount = storeItemRepository.findByName(SHIELD_ITEM_NAME)
                .flatMap(item -> inventoryItemRepository.findByUserIdAndStoreItemId(
                        stats.getUserId(), item.getId()))
                .map(inv -> inv.getQuantity())
                .orElse(0);

        boolean shieldUsedToday = stats.getLastShieldUsedDate() != null
                && stats.getLastShieldUsedDate().equals(LocalDate.now());

        return new StreakDTO(
            stats.getCurrentStreak(),
            stats.getLongestStreak(),
            mult,
            solvedToday,
            next != null ? next[0] : -1,
            next != null ? next[1] : 0,
            next != null ? next[2] : 0,
            stats.getLastActivityDate(),
            shieldCount,
            shieldUsedToday
        );
    }

    /* ═══════════════════════════════════════════════════════════
     * STATIC HELPERS
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Returns the next milestone row {@code {days, coinBonus, xpBonus}} for the given streak,
     * or {@code null} if all milestones have already been passed.
     */
    public static int[] nextMilestone(int currentStreak) {
        for (int[] m : MILESTONES) {
            if (currentStreak < m[0]) return m;
        }
        return null;
    }
}
