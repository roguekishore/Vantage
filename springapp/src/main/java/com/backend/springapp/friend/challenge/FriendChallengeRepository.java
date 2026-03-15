package com.backend.springapp.friend.challenge;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FriendChallengeRepository extends JpaRepository<FriendChallenge, Long> {

    List<FriendChallenge> findByChallengeeIdAndStatusOrderByCreatedAtDesc(Long challengeeId, FriendChallengeStatus status);

    Optional<FriendChallenge> findByIdAndChallengeeId(Long id, Long challengeeId);

    Optional<FriendChallenge> findByIdAndChallengerId(Long id, Long challengerId);

    List<FriendChallenge> findByStatusAndExpiresAtBefore(FriendChallengeStatus status, LocalDateTime now);
}
