package com.backend.springapp.gamification.battle;

import java.util.List;

/**
 * Active group battle state - contains a live scoreboard instead of 1v1 progress pair.
 */
public record GroupBattleStateDTO(
        Long battleId,
        String state,
        long timeRemainingMs,
        List<ScoreboardEntry> scoreboard,
        List<ProblemInfo> problems,
        Long myUserId
) {
    public record ScoreboardEntry(
            Long userId,
            String username,
            int groupScore,
            int problemsSolved,
            int totalSubmissions,
            int rank,
            boolean forfeited
    ) {}

    public record ProblemInfo(
            int index,
            String title,
            String description,
            String examples,
            String constraints,
            String judgeProblemId,
            boolean solved
    ) {}
}
