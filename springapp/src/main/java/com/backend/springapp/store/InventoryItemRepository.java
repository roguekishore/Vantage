package com.backend.springapp.store;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByUserId(Long userId);

    Optional<InventoryItem> findByUserIdAndStoreItem(Long userId, StoreItem storeItem);

    Optional<InventoryItem> findByUserIdAndStoreItemId(Long userId, Long storeItemId);
}
