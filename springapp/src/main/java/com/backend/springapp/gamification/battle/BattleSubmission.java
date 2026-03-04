package com.backend.springapp.gamification.battle;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Records each code submission within a battle.
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "battle_submissions", indexes = {
        @Index(name = "idx_bsub_battle_user", columnList = "battleId, userId")
})
public class BattleSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private Long battleId;

    @Column(nullable = false)
    private Long userId;

    /** Which problem in the battle (0, 1, 2). */
    @Column(nullable = false)
    private int problemIndex;

    @Column(nullable = false)
    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Verdict verdict;

    private Long executionTimeMs;

    @Column(nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @PrePersist
    void onCreate() {
        submittedAt = LocalDateTime.now();
    }
}
