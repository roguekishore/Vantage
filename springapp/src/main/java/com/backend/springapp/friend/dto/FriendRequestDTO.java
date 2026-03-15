package com.backend.springapp.friend.dto;

import java.time.LocalDateTime;

public record FriendRequestDTO(
        Long id,
        FriendUserDTO requester,
        FriendUserDTO addressee,
        String status,
        LocalDateTime createdAt,
        LocalDateTime respondedAt
) {}
