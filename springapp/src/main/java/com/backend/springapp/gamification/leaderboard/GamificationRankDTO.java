package com.backend.springapp.gamification.leaderboard;

/**
 * DTO for a user's rank in a specific gamification leaderboard.
 */
public record GamificationRankDTO(
    Long userId,
    String username,
    long rank,
    int value,
    String leaderboardType
) {}
