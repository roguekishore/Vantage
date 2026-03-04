package com.backend.springapp.gamification.battle;

/**
 * Request body for POST /api/battle/{id}/ready
 */
public record ReadyUpRequest(
        Long userId,
        String language
) {}
