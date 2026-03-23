package com.backend.springapp.gamification.battle;

import java.time.LocalDateTime;

/**
 * Compact battle history item - returned from GET /api/battle/history
 */
public record BattleHistoryDTO(
        Long battleId,
        String mode,           // "RANKED_1V1" or "CASUAL_1V1"
        String state,          // "COMPLETED", "CANCELLED", "ACTIVE", "WAITING"
        String outcome,        // "WIN", "LOSS", "DRAW", "CANCELLED", "IN_PROGRESS"
        String difficulty,     // "EASY", "MEDIUM", "HARD"
        int problemCount,
        int durationMinutes,
        Long opponentId,
        String opponentUsername,
        int yourSolved,
        int opponentSolved,
        int yourSubmissions,
        long yourSolveTimeMs,
        int ratingBefore,
        Integer ratingAfter,
        int ratingChange,
        LocalDateTime createdAt,
        LocalDateTime completedAt
) {}
