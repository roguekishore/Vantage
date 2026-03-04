package com.backend.springapp.gamification.battle;

import java.util.List;

/**
 * Battle state — returned from GET /api/battle/{id}/state during ACTIVE phase.
 */
public record BattleStateDTO(
        Long battleId,
        String state,
        long timeRemainingMs,
        ProgressInfo myProgress,
        ProgressInfo opponentProgress,
        List<ProblemInfo> problems
) {
    public record ProgressInfo(
            int problemsSolved,
            int totalSubmissions
    ) {}

    public record ProblemInfo(
            int index,
            String title,
            String description,
            String examples,
            String constraints,
            String judgeProblemId,
            boolean isSolved
    ) {}
}
