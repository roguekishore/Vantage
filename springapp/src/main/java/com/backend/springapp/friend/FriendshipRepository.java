package com.backend.springapp.friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    boolean existsByUserAIdAndUserBId(Long userAId, Long userBId);

    @Query("""
            SELECT f
            FROM Friendship f
            WHERE f.userAId = :userId OR f.userBId = :userId
            ORDER BY f.createdAt DESC
            """)
    List<Friendship> findAllForUser(@Param("userId") Long userId);
}
