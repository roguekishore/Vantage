package com.backend.springapp.friend.presence.dto;

import java.time.LocalDateTime;

public record FriendPresenceDTO(
        Long uid,
        String username,
        boolean online,
        LocalDateTime lastActiveAt
) {}
