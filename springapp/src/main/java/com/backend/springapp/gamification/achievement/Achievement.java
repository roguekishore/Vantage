package com.backend.springapp.gamification.achievement;

import jakarta.persistence.*;
import lombok.*;

/**
 * Achievement catalog - each row defines a badge that can be earned.
 * Seeded on application startup via AchievementDataInitializer.
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "achievements")
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /** Unique machine key, e.g. "FIRST_SOLVE", "STREAK_7" */
    @Column(name = "`key`", nullable = false, unique = true, length = 64)
    private String key;

    /** Human-readable badge name */
    @Column(nullable = false, length = 100)
    private String name;

    /** How to earn this badge */
    @Column(nullable = false, length = 500)
    private String description;

    /** Badge icon path / URL */
    @Column(length = 500)
    private String iconUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AchievementCategory category;

    /** Coins awarded when badge is earned */
    @Column(nullable = false, columnDefinition = "int default 0")
    private int coinReward = 0;

    /** XP awarded when badge is earned */
    @Column(nullable = false, columnDefinition = "int default 0")
    private int xpReward = 0;

    /** Hidden badges show "???" until earned */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isHidden = false;

    /** Numeric target for progress tracking (e.g. 10 for SOLVE_10) */
    @Column(nullable = false, columnDefinition = "int default 1")
    private int target = 1;
}
