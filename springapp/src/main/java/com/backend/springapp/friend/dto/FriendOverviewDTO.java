package com.backend.springapp.friend.dto;

import java.util.List;

public record FriendOverviewDTO(
        List<FriendUserDTO> friends,
        List<FriendRequestDTO> incomingRequests,
        List<FriendRequestDTO> outgoingRequests,
        long incomingCount
) {}
