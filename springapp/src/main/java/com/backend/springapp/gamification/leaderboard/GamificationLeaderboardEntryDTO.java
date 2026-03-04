package com.backend.springapp.gamification.leaderboard;

/**
 * A single row in a gamification leaderboard.
 * Used for Global XP, Weekly XP, Weekly Coins, and Streak leaderboards.
 */
public record GamificationLeaderboardEntryDTO(
    int rank,
    Long userId,
    String username,
    int value,       // The metric being ranked (XP, coins, streak days)
    int level,
    int currentStreak
) {}
