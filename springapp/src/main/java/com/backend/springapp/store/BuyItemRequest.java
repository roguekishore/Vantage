package com.backend.springapp.store;

/**
 * Request body for POST /api/store/buy.
 */
public record BuyItemRequest(
    Long itemId,
    int quantity
) {}
