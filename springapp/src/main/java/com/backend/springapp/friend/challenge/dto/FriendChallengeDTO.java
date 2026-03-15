package com.backend.springapp.friend.challenge.dto;

import java.time.LocalDateTime;

public record FriendChallengeDTO(
        Long id,
        Long challengerId,
        String challengerUsername,
        Long challengeeId,
        String challengeeUsername,
        String mode,
        String difficulty,
        int problemCount,
        String status,
        Long battleId,
        String closeReason,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        LocalDateTime respondedAt
) {}
