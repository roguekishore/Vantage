package com.backend.springapp.gamification;

/**
 * DTO returned after a problem solve to show the reward breakdown.
 */
public record RewardSummaryDTO(
    int coinsEarned,
    int xpEarned,
    int totalCoins,
    int totalXp,
    int level,
    String title,
    boolean accuracyBonus,
    boolean speedBonus,
    /* ── Phase 1: Streak fields ── */
    int streakDay,
    double streakMultiplier,
    int streakMilestoneCoins,
    int streakMilestoneXp
) {}
