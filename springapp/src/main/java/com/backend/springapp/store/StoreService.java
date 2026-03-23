package com.backend.springapp.store;

import com.backend.springapp.gamification.GamificationService;
import com.backend.springapp.gamification.coins.InsufficientCoinsException;
import com.backend.springapp.gamification.coins.TransactionSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Store & inventory logic - browse, buy, own, consume items.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreItemRepository storeItemRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final GamificationService gamificationService;

    /* ═══════════════════════════════════════════════════════════
     * STORE CATALOGUE
     * ═══════════════════════════════════════════════════════════ */

    /**
     * List all active store items, enriched with how many the given user owns.
     */
    public List<StoreItemDTO> getStoreItems(Long userId) {
        List<StoreItem> items = storeItemRepository.findByIsActiveTrueOrderByCostAsc();
        return items.stream().map(item -> {
            int owned = 0;
            if (userId != null) {
                owned = inventoryItemRepository.findByUserIdAndStoreItem(userId, item)
                        .map(InventoryItem::getQuantity)
                        .orElse(0);
            }
            return new StoreItemDTO(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getType().name(),
                item.getCost(),
                item.getIconUrl(),
                item.getMaxOwnable(),
                owned
            );
        }).toList();
    }

    /* ═══════════════════════════════════════════════════════════
     * BUY ITEM
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Purchase an item from the store.
     *
     * @param userId   buyer
     * @param itemId   the StoreItem PK
     * @param quantity how many to buy (≥ 1)
     * @return response with new totals
     */
    @Transactional
    public BuyItemResponse buyItem(Long userId, Long itemId, int quantity) {
        if (quantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }

        StoreItem item = storeItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));

        if (!item.isActive()) {
            throw new IllegalArgumentException("Item is not currently available: " + item.getName());
        }

        // Check max-ownable limit
        int currentlyOwned = inventoryItemRepository.findByUserIdAndStoreItem(userId, item)
                .map(InventoryItem::getQuantity)
                .orElse(0);

        if (item.getMaxOwnable() > 0 && currentlyOwned + quantity > item.getMaxOwnable()) {
            throw new IllegalArgumentException(
                "Cannot own more than " + item.getMaxOwnable() + " of " + item.getName()
                + ". You already have " + currentlyOwned + ".");
        }

        // Total cost
        int totalCost = item.getCost() * quantity;

        // Debit coins (throws InsufficientCoinsException if not enough)
        gamificationService.debitCoins(userId, totalCost, TransactionSource.STORE_PURCHASE, item.getId());

        // Upsert inventory
        InventoryItem inv = inventoryItemRepository.findByUserIdAndStoreItem(userId, item)
                .orElseGet(() -> {
                    InventoryItem fresh = new InventoryItem();
                    fresh.setUserId(userId);
                    fresh.setStoreItem(item);
                    fresh.setQuantity(0);
                    return fresh;
                });

        inv.setQuantity(inv.getQuantity() + quantity);
        inventoryItemRepository.saveAndFlush(inv);

        int coinsRemaining = gamificationService.getOrCreateStats(userId).getCoins();

        log.info("User {} bought {}× {} for {} coins (remaining: {})",
                userId, quantity, item.getName(), totalCost, coinsRemaining);

        return new BuyItemResponse(
            item.getName(),
            quantity,
            inv.getQuantity(),
            totalCost,
            coinsRemaining
        );
    }

    /* ═══════════════════════════════════════════════════════════
     * INVENTORY
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Get all inventory entries for a user, with item details.
     */
    public List<InventoryItemDTO> getInventory(Long userId) {
        return inventoryItemRepository.findByUserId(userId).stream()
                .filter(inv -> inv.getQuantity() > 0)
                .map(inv -> {
                    StoreItem item = inv.getStoreItem();
                    return new InventoryItemDTO(
                        inv.getId(),
                        item.getId(),
                        item.getName(),
                        item.getDescription(),
                        item.getType().name(),
                        item.getIconUrl(),
                        inv.getQuantity(),
                        inv.getAcquiredAt(),
                        inv.getLastUsedAt()
                    );
                }).toList();
    }

    /**
     * Get the quantity of a specific item a user owns.
     */
    public int getItemQuantity(Long userId, Long storeItemId) {
        return inventoryItemRepository.findByUserIdAndStoreItemId(userId, storeItemId)
                .map(InventoryItem::getQuantity)
                .orElse(0);
    }

    /**
     * Consume one unit of an item from a user's inventory.
     * Used internally (e.g. streak shield activation, battle powerups).
     *
     * @param userId     the owner
     * @param storeItemId the StoreItem PK
     * @throws IllegalStateException if quantity is 0 or item not found
     */
    @Transactional
    public void consumeItem(Long userId, Long storeItemId) {
        InventoryItem inv = inventoryItemRepository.findByUserIdAndStoreItemId(userId, storeItemId)
                .orElseThrow(() -> new IllegalStateException("User does not own item " + storeItemId));

        if (inv.getQuantity() <= 0) {
            throw new IllegalStateException("No remaining quantity for item " + storeItemId);
        }

        inv.setQuantity(inv.getQuantity() - 1);
        inv.setLastUsedAt(LocalDateTime.now());
        inventoryItemRepository.saveAndFlush(inv);

        log.info("User {} consumed 1× item {} (remaining: {})",
                userId, inv.getStoreItem().getName(), inv.getQuantity());
    }
}
