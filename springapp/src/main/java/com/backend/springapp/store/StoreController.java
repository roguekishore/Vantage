package com.backend.springapp.store;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.backend.springapp.gamification.coins.InsufficientCoinsException;

import java.util.List;
import java.util.Map;

/**
 * REST API for the store and inventory.
 */
@RestController
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    /**
     * List all active store items.
     * If userId is provided, includes the user's owned count per item.
     * GET /api/store?userId=1
     */
    @GetMapping("/api/store")
    public ResponseEntity<List<StoreItemDTO>> listStore(
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(storeService.getStoreItems(userId));
    }

    /**
     * Buy an item from the store.
     * POST /api/store/buy?userId=1  body: { "itemId": 1, "quantity": 1 }
     */
    @PostMapping("/api/store/buy")
    public ResponseEntity<BuyItemResponse> buyItem(
            @RequestParam Long userId,
            @RequestBody BuyItemRequest request) {
        BuyItemResponse response = storeService.buyItem(userId, request.itemId(), request.quantity());
        return ResponseEntity.ok(response);
    }

    /**
     * Current user's inventory.
     * GET /api/inventory?userId=1
     */
    @GetMapping("/api/inventory")
    public ResponseEntity<List<InventoryItemDTO>> myInventory(@RequestParam Long userId) {
        return ResponseEntity.ok(storeService.getInventory(userId));
    }

    /* ── Error handlers ── */

    @ExceptionHandler(InsufficientCoinsException.class)
    public ResponseEntity<Map<String, String>> handleInsufficientCoins(InsufficientCoinsException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleStateError(IllegalStateException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
