package com.backend.springapp.gamification.battle;

import com.backend.springapp.problem.Tag;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A user waiting in the matchmaking queue.
 * One row per user (userId is UNIQUE).
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "matchmaking_queue", indexes = {
        @Index(name = "idx_mq_mode_diff", columnList = "mode, difficulty")
})
public class MatchmakingQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BattleMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Tag difficulty;

    @Column(nullable = false)
    private int problemCount;

    /** Requested duration in minutes. */
    @Column(nullable = false)
    private int durationMinutes;

    /** Snapshot of the player's battle rating at join time. */
    @Column(nullable = false)
    private int battleRating;

    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
