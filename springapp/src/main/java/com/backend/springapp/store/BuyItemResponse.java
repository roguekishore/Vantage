package com.backend.springapp.store;

/**
 * Response after a successful purchase.
 */
public record BuyItemResponse(
    String itemName,
    int quantityBought,
    int totalOwned,
    int coinsSpent,
    int coinsRemaining
) {}
