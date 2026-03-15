package com.backend.springapp.friend.challenge.dto;

import java.time.LocalDateTime;

public record ChallengeMuteStatusDTO(
        boolean muted,
        LocalDateTime mutedUntil
) {}
