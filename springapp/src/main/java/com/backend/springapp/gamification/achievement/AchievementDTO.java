package com.backend.springapp.gamification.achievement;

import java.time.LocalDateTime;

/**
 * DTO for returning achievement data to the frontend.
 *
 * @param id          achievement catalog ID
 * @param key         machine key (e.g. "FIRST_SOLVE")
 * @param name        display name (or "???" if hidden and not earned)
 * @param description how to earn (or "???" if hidden and not earned)
 * @param iconUrl     badge icon path
 * @param category    PROBLEM / STREAK / BATTLE / SPECIAL
 * @param coinReward  coins awarded on unlock
 * @param xpReward    XP awarded on unlock
 * @param isHidden    whether the badge is a hidden/surprise badge
 * @param earned      whether the current user has earned this badge
 * @param earnedAt    when it was earned (null if not earned)
 * @param progress    current progress towards the target (e.g. 7 out of 10)
 * @param target      target count to earn the badge (e.g. 10 for SOLVE_10)
 */
public record AchievementDTO(
        Long id,
        String key,
        String name,
        String description,
        String iconUrl,
        String category,
        int coinReward,
        int xpReward,
        boolean isHidden,
        boolean earned,
        LocalDateTime earnedAt,
        int progress,
        int target
) {}
