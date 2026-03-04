package com.backend.springapp.gamification.coins;

import java.time.LocalDateTime;

/**
 * DTO for paginated coin history (GET /api/me/coin-history).
 */
public record CoinHistoryDTO(
    Long id,
    int amount,
    String source,
    int balanceAfter,
    Long referenceId,
    LocalDateTime createdAt
) {}
