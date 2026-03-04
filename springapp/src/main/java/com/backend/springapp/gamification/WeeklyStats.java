package com.backend.springapp.gamification;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Tracks weekly gamification progress for leaderboard purposes.
 * A new row is created (or upserted) for each user per ISO week.
 * WeekStart is always the Monday of that week.
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "weekly_stats",
       uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "weekStart"}),
       indexes = {
           @Index(name = "idx_weekly_week", columnList = "weekStart"),
           @Index(name = "idx_weekly_xp", columnList = "weekStart, xpEarned"),
           @Index(name = "idx_weekly_coins", columnList = "weekStart, coinsEarned")
       })
public class WeeklyStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private Long userId;

    /** Monday of the ISO week this row covers. */
    @Column(nullable = false)
    private LocalDate weekStart;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int xpEarned = 0;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int coinsEarned = 0;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int problemsSolved = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
