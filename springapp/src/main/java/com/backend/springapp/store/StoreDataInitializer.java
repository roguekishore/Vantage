package com.backend.springapp.store;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeds the store_items table on startup with the initial catalogue.
 * Runs after the main DataInitializer (Order 2 vs Order 1).
 * With ddl-auto=create this runs fresh every time.
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class StoreDataInitializer implements CommandLineRunner {

    private final StoreItemRepository storeItemRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (storeItemRepository.count() > 0) {
            log.info("Store already seeded. Skipping.");
            return;
        }

        List<StoreItem> items = List.of(
            item("Streak Shield",
                 "Automatically protects your streak for one missed day. Consumed when the midnight reset detects a gap.",
                 ItemType.STREAK_POWERUP, 50, 5, "🛡️"),
            item("Streak Freeze",
                 "Pauses your streak counter for 24 hours. Activate before you know you'll miss a day.",
                 ItemType.STREAK_POWERUP, 120, 3, "🧊"),
            item("XP Surge (24h)",
                 "Doubles all XP earned for 24 hours after activation.",
                 ItemType.BOOST, 120, 3, "⚡"),
            item("Coin Rush (10 problems)",
                 "Doubles coin rewards for the next 10 problems solved.",
                 ItemType.BOOST, 100, 3, "💰"),
            item("Hint Token",
                 "Reveals a hint during a battle round. Use wisely!",
                 ItemType.BATTLE_POWERUP, 75, 5, "💡"),
            item("Time Extend (+3 min)",
                 "Adds 3 extra minutes to your battle timer.",
                 ItemType.BATTLE_POWERUP, 100, 3, "⏱️"),
            item("Focus Mode",
                 "Hides opponent's progress during a battle, reducing pressure.",
                 ItemType.BATTLE_POWERUP, 80, 5, "🎯"),
            item("Shield",
                 "Blocks one rating deduction from a battle loss.",
                 ItemType.BATTLE_POWERUP, 80, 5, "🔰"),
            item("Double or Nothing",
                 "Doubles your rating gain if you win, but doubles the loss if you lose.",
                 ItemType.BATTLE_POWERUP, 200, 3, "🎲")
        );

        storeItemRepository.saveAll(items);
        log.info("Seeded {} store items.", items.size());
    }

    private static StoreItem item(String name, String description, ItemType type, int cost, int maxOwnable, String icon) {
        StoreItem si = new StoreItem();
        si.setName(name);
        si.setDescription(description);
        si.setType(type);
        si.setCost(cost);
        si.setMaxOwnable(maxOwnable);
        si.setIconUrl(icon);
        si.setActive(true);
        return si;
    }
}
