package com.backend.springapp.friend.challenge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ChallengeMuteRequestDTO(
        @Min(1) @Max(1440) int minutes
) {}
