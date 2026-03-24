package com.backend.springapp.friend.challenge.dto;

import com.backend.springapp.gamification.battle.BattleMode;
import com.backend.springapp.problem.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FriendChallengeCreateDTO(
        @NotNull Long targetUserId,
        @NotNull BattleMode mode,
        @NotNull Tag difficulty,
        @Min(1) @Max(3) int problemCount,
        @Size(min = 6, max = 6) String roomCode,
        Integer durationMinutes
) {}
