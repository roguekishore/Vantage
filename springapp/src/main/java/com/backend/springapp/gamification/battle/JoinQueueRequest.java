package com.backend.springapp.gamification.battle;

import com.backend.springapp.problem.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for POST /api/battle/queue
 */
public record JoinQueueRequest(
        @NotNull Long userId,
        @NotNull BattleMode mode,
        @NotNull Tag difficulty,
        @Min(1) @Max(3) int problemCount
) {}
