package com.backend.springapp.gamification.battle;

/**
 * Final results - returned from GET /api/battle/{id}/result
 */
public record BattleResultDTO(
        Long battleId,
        String mode,
        String outcome,       // "WIN", "LOSS", "DRAW"
        Long winnerId,
        ResultStats you,
        ResultStats opponent,
        int coinsEarned,
        int xpEarned,
        int ratingBefore,
        int ratingAfter
) {
    public record ResultStats(
            Long userId,
            String username,
            int problemsSolved,
            int totalSubmissions,
            long totalSolveTimeMs,
            int ratingBefore,
            Integer ratingAfter
    ) {}
}
