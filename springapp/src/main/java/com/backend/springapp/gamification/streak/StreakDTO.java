package com.backend.springapp.gamification.streak;

import java.time.LocalDate;

/**
 * DTO returned from GET /api/me/streak.
 * Gives the frontend everything it needs for the streak widget.
 */
public record StreakDTO(
    int currentStreak,
    int longestStreak,
    /** Coin multiplier from streak: min(1.5, 1 + currentStreak × 0.01) */
    double multiplier,
    /** Whether the user has already solved at least one problem today */
    boolean solvedToday,
    /** The next milestone day count (3, 7, 14, 30, 100, 365), or -1 if all reached */
    int nextMilestone,
    /** Coin bonus at that milestone */
    int nextMilestoneCoins,
    /** XP bonus at that milestone */
    int nextMilestoneXp,
    LocalDate lastActivityDate,
    /** Number of Streak Shields the user currently owns (Phase 3) */
    int shieldCount,
    /** Whether a Streak Shield was consumed today (used for toast notification) */
    boolean shieldUsedToday
) {}
