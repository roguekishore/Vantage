package com.backend.springapp.gamification.achievement;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Record of an achievement earned by a player.
 */
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "player_achievements",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_player_achievement",
                columnNames = {"userId", "achievementId"}
        ),
        indexes = @Index(name = "idx_pa_user", columnList = "userId"))
public class PlayerAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long achievementId;

    @Column(nullable = false)
    private LocalDateTime earnedAt;

    @PrePersist
    void prePersist() {
        if (earnedAt == null) earnedAt = LocalDateTime.now();
    }
}
