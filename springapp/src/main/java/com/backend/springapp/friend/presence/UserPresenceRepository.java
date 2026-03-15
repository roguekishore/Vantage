package com.backend.springapp.friend.presence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserPresenceRepository extends JpaRepository<UserPresence, Long> {

    Optional<UserPresence> findByUserId(Long userId);

    List<UserPresence> findByUserIdIn(Collection<Long> userIds);
}
