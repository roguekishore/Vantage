package com.backend.springapp.gamification.battle;

/**
 * Submission feedback — returned from POST /api/battle/{id}/submit
 */
public record SubmitResultDTO(
        String verdict,
        Long executionTimeMs,
        int problemsSolved,
        int totalProblems,
        boolean allSolved,
        // First failed test case (null when accepted or compile error)
        String firstFailedInput,
        String firstFailedExpected,
        String firstFailedActual,
        String firstFailedError
) {}
