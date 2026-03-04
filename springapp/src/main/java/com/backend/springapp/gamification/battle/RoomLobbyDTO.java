package com.backend.springapp.gamification.battle;

import java.util.List;

/**
 * Snapshot of a group room's lobby state — sent to all participants.
 */
public record RoomLobbyDTO(
        Long battleId,
        String roomCode,
        String mode,
        String difficulty,
        int problemCount,
        int maxPlayers,
        int durationMinutes,
        String state,
        Long creatorId,
        List<ParticipantInfo> participants
) {
    public record ParticipantInfo(
            Long userId,
            String username,
            int battleRating,
            int level
    ) {}
}
