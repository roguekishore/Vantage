package com.backend.springapp.gamification;

import com.backend.springapp.gamification.coins.CoinHistoryDTO;
import com.backend.springapp.gamification.coins.CoinService;
import com.backend.springapp.gamification.coins.CoinTransaction;
import com.backend.springapp.gamification.coins.CoinTransactionRepository;
import com.backend.springapp.gamification.coins.TransactionSource;
import com.backend.springapp.gamification.streak.StreakDTO;
import com.backend.springapp.gamification.streak.StreakService;
import com.backend.springapp.problem.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/**
 * Orchestrates all gamification rewards — coins, XP, levels, streaks.
 * <p>
 * Delegates to specialist sub-services:
 * <ul>
 *   <li>{@link StreakService} — streak tracking, multipliers, milestones</li>
 *   <li>{@link CoinService}  — coin credit/debit and audit log</li>
 * </ul>
 * Acts as a single façade for the REST layer and
 * {@link com.backend.springapp.store.StoreService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationService {

    private final PlayerStatsRepository statsRepository;
    private final CoinTransactionRepository txRepository;
    private final WeeklyStatsRepository weeklyStatsRepository;
    private final StreakService streakService;
    private final CoinService coinService;

    /* ═══════════════════════════════════════════════════════════
     * LEVEL BRACKETS
     * ═══════════════════════════════════════════════════════════ */

    private static final int[][] LEVEL_BRACKETS = {
        {     0,   500 },  // Levels 1-10    Initiate
        {   501,  2500 },  // Levels 11-25   Apprentice
        {  2501,  8000 },  // Levels 26-50   Challenger
        {  8001, 20000 },  // Levels 51-75   Veteran
        { 20001, 50000 },  // Levels 76-100  Elite
        { 50001, Integer.MAX_VALUE },  // 100+  Legend
    };

    private static final String[] TITLES = {
        "Initiate", "Apprentice", "Challenger", "Veteran", "Elite", "Legend"
    };

    private static final int[] LEVEL_RANGES = { 10, 25, 50, 75, 100, 200 };

    public static int calculateLevel(int xp) {
        if (xp <= 0) return 1;
        int cumulativeLevel = 0;
        for (int i = 0; i < LEVEL_BRACKETS.length; i++) {
            int bracketMin = LEVEL_BRACKETS[i][0];
            int bracketMax = LEVEL_BRACKETS[i][1];
            int levelsInBracket = (i == 0) ? LEVEL_RANGES[i] : LEVEL_RANGES[i] - LEVEL_RANGES[i - 1];
            if (xp < bracketMin) break;
            int xpInBracket = Math.min(xp, bracketMax) - bracketMin;
            int bracketXpRange = bracketMax - bracketMin;
            int levelsEarned = (int) ((long) xpInBracket * levelsInBracket / bracketXpRange);
            cumulativeLevel += levelsEarned;
            if (xp <= bracketMax) break;
        }
        return Math.max(1, cumulativeLevel + 1);
    }

    public static String getTitle(int level) {
        if (level <= 10)  return TITLES[0];
        if (level <= 25)  return TITLES[1];
        if (level <= 50)  return TITLES[2];
        if (level <= 75)  return TITLES[3];
        if (level <= 100) return TITLES[4];
        return TITLES[5];
    }

    /** XP threshold at the start of the player's current level. */
    public static int xpFloorForLevel(int level) {
        if (level <= 1) return 0;
        int remaining = level - 1;
        int xp = 0;
        int prevMaxLevel = 0;
        for (int i = 0; i < LEVEL_BRACKETS.length; i++) {
            int bracketMin = LEVEL_BRACKETS[i][0];
            int bracketMax = LEVEL_BRACKETS[i][1];
            int levelsInBracket = LEVEL_RANGES[i] - prevMaxLevel;
            if (remaining <= 0) break;
            int used = Math.min(remaining, levelsInBracket);
            int bracketXpRange = bracketMax - bracketMin;
            xp = bracketMin + (int) ((long) used * bracketXpRange / levelsInBracket);
            remaining -= used;
            prevMaxLevel = LEVEL_RANGES[i];
        }
        return xp;
    }

    public static int xpCeilingForLevel(int level) {
        return xpFloorForLevel(level + 1);
    }

    /* ═══════════════════════════════════════════════════════════
     * COIN / XP REWARD TABLE
     * ═══════════════════════════════════════════════════════════ */

    private static int baseCoins(Tag tag) {
        return switch (tag) {
            case BASIC  -> 3;
            case EASY   -> 5;
            case MEDIUM -> 15;
            case HARD   -> 30;
        };
    }

    private static int baseXp(Tag tag) {
        return switch (tag) {
            case BASIC  -> 5;
            case EASY   -> 10;
            case MEDIUM -> 25;
            case HARD   -> 50;
        };
    }

    /* ═══════════════════════════════════════════════════════════
     * MAIN REWARD METHOD
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Called after a problem is marked as solved (first time only).
     * <ol>
     *   <li>Delegates streak tracking to {@link StreakService}</li>
     *   <li>Computes coins (accuracy bonus + streak multiplier) and XP</li>
     *   <li>Checks streak milestones via {@link StreakService}</li>
     *   <li>Persists stats and logs the PROBLEM_SOLVED coin transaction</li>
     *   <li>Updates weekly leaderboard stats</li>
     * </ol>
     */
    @Transactional
    public RewardSummaryDTO rewardProblemSolve(Long userId, Long problemId, Tag tag, boolean isFirstAttempt) {
        PlayerStats stats = getOrCreateStats(userId);

        // 1. Update streak (mutates stats in-memory, does not save)
        int streakDay = streakService.updateStreak(stats);
        double mult   = StreakService.multiplierFor(stats.getCurrentStreak());

        // 2. Calculate coins + XP
        int coins = baseCoins(tag);
        int xp    = baseXp(tag);

        boolean accuracyBonus = isFirstAttempt;
        if (accuracyBonus) coins = (int) Math.ceil(coins * 1.2);
        coins = (int) Math.ceil(coins * mult);

        // 3. Apply to stats
        stats.setCoins(stats.getCoins() + coins);
        stats.setXp(stats.getXp() + xp);
        stats.setLevel(calculateLevel(stats.getXp()));

        // 4. Check streak milestones — may add more coins/XP to stats in-memory
        //    and persists its own STREAK_BONUS transaction
        int[] milestoneBonus = streakService.checkAndCreditMilestones(stats);

        // MUST use saveAndFlush — a downstream @Modifying(clearAutomatically=true)
        // query (e.g. addRating) can evict unflushed dirty entities from the
        // persistence context, silently losing accumulated coins/XP.
        statsRepository.saveAndFlush(stats);

        // 5. Log the PROBLEM_SOLVED coin transaction
        CoinTransaction tx = new CoinTransaction();
        tx.setUserId(userId);
        tx.setAmount(coins);
        tx.setSource(TransactionSource.PROBLEM_SOLVED);
        tx.setBalanceAfter(stats.getCoins());
        tx.setReferenceId(problemId);
        txRepository.saveAndFlush(tx);

        // 6. Update weekly leaderboard stats (Phase 4)
        updateWeeklyStats(userId, coins + milestoneBonus[0], xp + milestoneBonus[1]);

        log.info("Rewarded user {} with {} coins (×{}) + {} XP for problem {} (tag={}, firstAttempt={}, streak={})",
                userId, coins, String.format("%.2f", mult), xp, problemId, tag, isFirstAttempt, streakDay);

        return new RewardSummaryDTO(
            coins, xp,
            stats.getCoins(), stats.getXp(),
            stats.getLevel(), getTitle(stats.getLevel()),
            accuracyBonus, false,
            streakDay, mult,
            milestoneBonus[0], milestoneBonus[1]
        );
    }

    /* ═══════════════════════════════════════════════════════════
     * WEEKLY STATS (Phase 4)
     * ═══════════════════════════════════════════════════════════ */

    @Transactional
    public void updateWeeklyStats(Long userId, int coinsEarned, int xpEarned) {
        LocalDate weekStart = LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        WeeklyStats ws = weeklyStatsRepository.findByUserIdAndWeekStart(userId, weekStart)
                .orElseGet(() -> {
                    WeeklyStats fresh = new WeeklyStats();
                    fresh.setUserId(userId);
                    fresh.setWeekStart(weekStart);
                    return fresh;
                });
        ws.setXpEarned(ws.getXpEarned() + xpEarned);
        ws.setCoinsEarned(ws.getCoinsEarned() + coinsEarned);
        ws.setProblemsSolved(ws.getProblemsSolved() + 1);
        weeklyStatsRepository.saveAndFlush(ws);
    }

    /**
     * Like {@link #updateWeeklyStats} but for battle rewards — does NOT
     * increment the problems-solved counter since no problem was solved.
     */
    @Transactional
    public void addWeeklyBattleReward(Long userId, int coinsEarned, int xpEarned) {
        LocalDate weekStart = LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        WeeklyStats ws = weeklyStatsRepository.findByUserIdAndWeekStart(userId, weekStart)
                .orElseGet(() -> {
                    WeeklyStats fresh = new WeeklyStats();
                    fresh.setUserId(userId);
                    fresh.setWeekStart(weekStart);
                    return fresh;
                });
        ws.setXpEarned(ws.getXpEarned() + xpEarned);
        ws.setCoinsEarned(ws.getCoinsEarned() + coinsEarned);
        weeklyStatsRepository.saveAndFlush(ws);
    }

    /* ═══════════════════════════════════════════════════════════
     * QUERIES / FAÇADE
     * ═══════════════════════════════════════════════════════════ */

    /** Get-or-create stats for a user (auto-provisions on first access). */
    @Transactional
    public PlayerStats getOrCreateStats(Long userId) {
        return statsRepository.findByUserId(userId).orElseGet(() -> {
            PlayerStats fresh = new PlayerStats();
            fresh.setUserId(userId);
            return statsRepository.saveAndFlush(fresh);
        });
    }

    /** Full stats DTO for the player. */
    public PlayerStatsDTO getPlayerStatsDTO(Long userId) {
        PlayerStats s = getOrCreateStats(userId);
        int level = calculateLevel(s.getXp());
        return new PlayerStatsDTO(
            s.getUserId(), s.getCoins(), s.getXp(),
            level, getTitle(level),
            xpFloorForLevel(level), xpCeilingForLevel(level),
            s.getCurrentStreak(), s.getLongestStreak(), s.getBattleRating()
        );
    }

    /** Streak info — delegates to {@link StreakService}. */
    public StreakDTO getStreakDTO(Long userId) {
        return streakService.buildStreakDTO(getOrCreateStats(userId));
    }

    /** Paginated coin history — delegates to {@link CoinService}. */
    public Page<CoinHistoryDTO> getCoinHistory(Long userId, Pageable pageable) {
        return coinService.getCoinHistory(userId, pageable);
    }

    /* ═══════════════════════════════════════════════════════════
     * COIN OPERATIONS (façade for StoreService)
     * ═══════════════════════════════════════════════════════════ */

    public void creditCoins(Long userId, int amount, TransactionSource source, Long referenceId) {
        coinService.creditCoins(userId, amount, source, referenceId);
    }

    public void debitCoins(Long userId, int amount, TransactionSource source, Long referenceId) {
        coinService.debitCoins(userId, amount, source, referenceId);
    }
}
