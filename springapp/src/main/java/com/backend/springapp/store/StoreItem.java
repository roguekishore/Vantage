package com.backend.springapp.store;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A purchasable item in the store.
 * Seeded on startup; admin-managed in the future.
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "store_items")
public class StoreItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ItemType type;

    /** Price in coins. */
    @Column(nullable = false)
    private int cost;

    /** Optional icon asset path. */
    @Column
    private String iconUrl;

    /** Max a player can hold at once. -1 = unlimited. */
    @Column(nullable = false)
    private int maxOwnable = -1;

    /** Whether this item can currently be purchased. */
    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
