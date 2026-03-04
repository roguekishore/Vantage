package com.backend.springapp.gamification.battle;

import com.backend.springapp.problem.Tag;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A 1-v-1 battle instance.
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "battles", indexes = {
        @Index(name = "idx_battle_state", columnList = "state"),
        @Index(name = "idx_battle_state_started", columnList = "state, startedAt")
})
public class Battle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BattleMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BattleState state = BattleState.WAITING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Tag difficulty;

    @Column(nullable = false)
    private int problemCount;

    /** Duration in minutes (derived from problemCount × 15). */
    @Column(nullable = false)
    private int durationMinutes;

    private Long winnerId;

    /** Room code for group battles (6-char alphanumeric, unique). Null for 1v1. */
    @Column(name = "room_code", unique = true, length = 6)
    private String roomCode;

    /** Maximum number of players (2 for 1v1, 3-8 for group). */
    @Column(name = "max_players", nullable = false)
    private int maxPlayers = 2;

    /** The user who created the room (group battles only). */
    @Column(name = "creator_id")
    private Long creatorId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Set when both players ready up → battle goes ACTIVE. */
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
