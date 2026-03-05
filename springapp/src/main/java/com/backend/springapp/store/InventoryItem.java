package com.backend.springapp.store;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Tracks how many of each store item a user owns.
 * Unique on (userId, storeItem).
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(
    name = "inventory_items",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_inventory_user_item",
        columnNames = {"userId", "store_item_id"}
    ),
    indexes = @Index(name = "idx_inventory_user", columnList = "userId")
)
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "store_item_id", nullable = false)
    private StoreItem storeItem;

    @Column(nullable = false)
    private int quantity = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime acquiredAt;

    @Column
    private LocalDateTime lastUsedAt;

    @PrePersist
    void onCreate() {
        acquiredAt = LocalDateTime.now();
    }
}
