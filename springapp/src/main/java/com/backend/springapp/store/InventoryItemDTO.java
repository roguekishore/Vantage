package com.backend.springapp.store;

import java.time.LocalDateTime;

/**
 * DTO for a user's inventory entry.
 */
public record InventoryItemDTO(
    Long id,
    Long storeItemId,
    String name,
    String description,
    String type,
    String iconUrl,
    int quantity,
    LocalDateTime acquiredAt,
    LocalDateTime lastUsedAt
) {}
