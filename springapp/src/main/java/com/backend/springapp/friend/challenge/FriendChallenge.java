package com.backend.springapp.friend.challenge;

import com.backend.springapp.gamification.battle.BattleMode;
import com.backend.springapp.problem.Tag;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "friend_challenges")
public class FriendChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long challengerId;

    @Column(nullable = false)
    private Long challengeeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BattleMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Tag difficulty;

    @Column(nullable = false)
    private int problemCount;

    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FriendChallengeStatus status = FriendChallengeStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime respondedAt;

    private Long battleId;

    @Column(length = 6)
    private String roomCode;

    private String closeReason;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = FriendChallengeStatus.PENDING;
    }
}
