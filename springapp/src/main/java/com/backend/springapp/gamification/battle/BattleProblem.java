package com.backend.springapp.gamification.battle;

import jakarta.persistence.*;
import lombok.*;

/**
 * Maps a problem to a battle in a specific order (0, 1, 2).
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "battle_problems", indexes = {
        @Index(name = "idx_bproblem_battle", columnList = "battleId")
})
public class BattleProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private Long battleId;

    /** FK → problems.pid */
    @Column(nullable = false)
    private Long problemId;

    /** Judge service problem ID string (e.g. "two-sum"). */
    @Column(nullable = false)
    private String judgeProblemId;

    /** 0-based index within the battle (0, 1, 2). */
    @Column(nullable = false)
    private int problemIndex;
}
