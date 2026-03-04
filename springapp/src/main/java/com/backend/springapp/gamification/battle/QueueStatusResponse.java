package com.backend.springapp.gamification.battle;

/**
 * Response for GET /api/battle/queue/status
 */
public record QueueStatusResponse(
        String status,  // "QUEUED" | "MATCHED"
        Long battleId   // non-null when MATCHED
) {}
