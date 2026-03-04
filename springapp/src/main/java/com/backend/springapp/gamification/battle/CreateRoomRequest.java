package com.backend.springapp.gamification.battle;

/**
 * Request body for creating a new group battle room.
 */
public record CreateRoomRequest(
        /** Must be GROUP_FFA. */
        String mode,
        /** EASY | MEDIUM | HARD */
        String difficulty,
        int problemCount,
        /** 3–8 players. */
        int maxPlayers,
        /** Duration in minutes. 0 = auto (problemCount × 15). */
        int durationMinutes
) {}
