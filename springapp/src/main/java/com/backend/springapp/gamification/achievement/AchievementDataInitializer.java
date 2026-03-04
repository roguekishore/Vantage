package com.backend.springapp.gamification.achievement;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the achievement catalog on startup.
 * Existing rows (matched by key) are skipped, so this is idempotent.
 */
@Slf4j
@Component
@Order(10) // run after any other DataInitializers
@RequiredArgsConstructor
public class AchievementDataInitializer implements CommandLineRunner {

    private final AchievementRepository repo;

    @Override
    public void run(String... args) {
        List<AchievementSeed> seeds = List.of(
            // ─── PROBLEM achievements ───
            new AchievementSeed("FIRST_SOLVE", "First Blood",
                    "Solve your first problem", AchievementCategory.PROBLEM,
                    50, 20, false, 1, "🩸"),
            new AchievementSeed("SOLVE_10", "Getting Started",
                    "Solve 10 problems", AchievementCategory.PROBLEM,
                    100, 50, false, 10, "📝"),
            new AchievementSeed("SOLVE_50", "Half Century",
                    "Solve 50 problems", AchievementCategory.PROBLEM,
                    300, 200, false, 50, "🎯"),
            new AchievementSeed("SOLVE_100", "Centurion",
                    "Solve 100 problems", AchievementCategory.PROBLEM,
                    500, 400, false, 100, "💯"),
            new AchievementSeed("ALL_EASY", "Easy Sweep",
                    "Solve all EASY problems", AchievementCategory.PROBLEM,
                    200, 150, false, 1, "🧹"),  // target dynamically resolved
            new AchievementSeed("ALL_MEDIUM", "Medium Mastery",
                    "Solve all MEDIUM problems", AchievementCategory.PROBLEM,
                    500, 400, false, 1, "🧠"),  // target dynamically resolved

            // ─── STREAK achievements ───
            new AchievementSeed("STREAK_7", "Week Warrior",
                    "Maintain a 7-day streak", AchievementCategory.STREAK,
                    150, 100, false, 7, "🔥"),
            new AchievementSeed("STREAK_30", "Monthly Grinder",
                    "Maintain a 30-day streak", AchievementCategory.STREAK,
                    500, 400, false, 30, "📅"),
            new AchievementSeed("STREAK_100", "Centurion Streak",
                    "Maintain a 100-day streak", AchievementCategory.STREAK,
                    2000, 1000, false, 100, "⚡"),

            // ─── BATTLE achievements ───
            new AchievementSeed("FIRST_BATTLE_WIN", "Victorious",
                    "Win your first battle", AchievementCategory.BATTLE,
                    100, 75, false, 1, "🏆"),
            new AchievementSeed("BATTLE_WIN_5", "Fighter",
                    "Win 5 battles", AchievementCategory.BATTLE,
                    200, 150, false, 5, "⚔️"),
            new AchievementSeed("BATTLE_WIN_20", "Warrior",
                    "Win 20 battles", AchievementCategory.BATTLE,
                    500, 400, false, 20, "🛡️"),
            new AchievementSeed("SPEED_DEMON", "Speed Demon",
                    "Solve a battle problem in under 5 minutes", AchievementCategory.BATTLE,
                    150, 100, false, 1, "⏱️"),
            new AchievementSeed("UNDERDOG", "Underdog",
                    "Beat an opponent 200+ BR above you", AchievementCategory.SPECIAL,
                    300, 200, true, 1, "🐺")
        );

        int inserted = 0;
        for (AchievementSeed seed : seeds) {
            if (!repo.existsByKey(seed.key())) {
                Achievement a = new Achievement();
                a.setKey(seed.key());
                a.setName(seed.name());
                a.setDescription(seed.description());
                a.setCategory(seed.category());
                a.setCoinReward(seed.coinReward());
                a.setXpReward(seed.xpReward());
                a.setHidden(seed.isHidden());
                a.setTarget(seed.target());
                a.setIconUrl(seed.iconUrl());
                repo.save(a);
                inserted++;
            }
        }

        if (inserted > 0) {
            log.info("🏆 Seeded {} new achievements into catalog (total: {})", inserted, repo.count());
        }
    }

    private record AchievementSeed(
            String key, String name, String description,
            AchievementCategory category, int coinReward, int xpReward,
            boolean isHidden, int target, String iconUrl
    ) {}
}
