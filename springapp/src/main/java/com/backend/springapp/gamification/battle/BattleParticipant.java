package com.backend.springapp.gamification.battle;

import jakarta.persistence.*;
import lombok.*;

/**
 * Links a user to a battle and tracks per-participant state.
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "battle_participants", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"battleId", "userId"})
}, indexes = {
        @Index(name = "idx_bp_battle", columnList = "battleId"),
        @Index(name = "idx_bp_user", columnList = "userId")
})
public class BattleParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private Long battleId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private boolean isReady = false;

    /** Language chosen during ready-up (cpp / java). */
    private String language;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int problemsSolved = 0;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int totalSubmissions = 0;

    /** Cumulative solve time in milliseconds (from battle start to each accepted solve). */
    @Column(nullable = false, columnDefinition = "bigint default 0")
    private long totalSolveTimeMs = 0;

    /** Snapshot of battle rating at the time the battle was created. */
    @Column(nullable = false, columnDefinition = "int default 1200")
    private int ratingBefore = 1200;

    /** Rating after ELO adjustment - set on battle completion. */
    private Integer ratingAfter;

    /** Points accumulated via FFA scoring formula (group battles only). */
    @Column(name = "group_score", nullable = false, columnDefinition = "int default 0")
    private int groupScore = 0;

    /** Final placement in group battle (1st, 2nd, 3rd...). Null for 1v1. */
    @Column(name = "placement")
    private Integer placement;

        /** True when player surrendered in a group battle. */
        @Column(name = "forfeited", nullable = false, columnDefinition = "boolean default false")
        private boolean forfeited = false;
}
