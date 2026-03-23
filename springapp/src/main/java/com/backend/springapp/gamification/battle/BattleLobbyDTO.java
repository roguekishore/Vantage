package com.backend.springapp.gamification.battle;

import java.util.List;

/**
 * Lobby view - returned from GET /api/battle/{id}
 */
public record BattleLobbyDTO(
        Long battleId,
        String mode,
        String difficulty,
        int problemCount,
        int durationMinutes,
        String state,
        ParticipantInfo you,
        ParticipantInfo opponent,
        long lobbyTimeRemainingMs
) {
    public record ParticipantInfo(
            Long userId,
            String username,
            int battleRating,
            int level,
            boolean isReady,
            String language
    ) {}
}
