package com.backend.springapp.gamification.battle;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Final result of a group (FFA) battle - sent to each participant after completion.
 */
public record GroupBattleResultDTO(
        Long battleId,
        String mode,
        List<PlacementEntry> placements,
        int myCoins,
        int myXp,
        int myPlacement,
        LocalDateTime completedAt
) {
    public record PlacementEntry(
            int placement,
            Long userId,
            String username,
            int groupScore,
            int problemsSolved,
            int totalSubmissions,
            boolean forfeited,
            int coinsEarned,
            int xpEarned
    ) {}
}
