package com.backend.springapp.friend.dto;

public record FriendSearchResultDTO(
        Long uid,
        String username,
        String relationStatus,
        Long pendingRequestId
) {}
