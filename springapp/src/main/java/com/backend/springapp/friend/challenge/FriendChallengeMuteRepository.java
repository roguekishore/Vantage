package com.backend.springapp.friend.challenge;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FriendChallengeMuteRepository extends JpaRepository<FriendChallengeMute, Long> {

    Optional<FriendChallengeMute> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
