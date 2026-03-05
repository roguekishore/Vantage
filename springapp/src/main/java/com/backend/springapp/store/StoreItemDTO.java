package com.backend.springapp.store;

/**
 * DTO for a store item listing.
 */
public record StoreItemDTO(
    Long id,
    String name,
    String description,
    String type,
    int cost,
    String iconUrl,
    int maxOwnable,
    /** How many the requesting user already owns (0 if not logged in). */
    int owned
) {}
