package com.backend.springapp.gamification.battle;

/**
 * Request body for POST /api/battle/{id}/submit
 */
public record SubmitCodeRequest(
        Long userId,
        int problemIndex,
        String language,
        String code
) {}
