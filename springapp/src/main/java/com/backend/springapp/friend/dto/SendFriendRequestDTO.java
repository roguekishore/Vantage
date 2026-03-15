package com.backend.springapp.friend.dto;

import jakarta.validation.constraints.NotNull;

public record SendFriendRequestDTO(
        @NotNull Long targetUserId
) {}
