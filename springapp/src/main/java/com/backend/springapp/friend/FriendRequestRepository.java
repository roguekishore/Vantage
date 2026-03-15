package com.backend.springapp.friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    List<FriendRequest> findByAddresseeIdAndStatusOrderByCreatedAtDesc(Long addresseeId, FriendRequestStatus status);

    List<FriendRequest> findByRequesterIdAndStatusOrderByCreatedAtDesc(Long requesterId, FriendRequestStatus status);

    Optional<FriendRequest> findByIdAndAddresseeId(Long id, Long addresseeId);

    Optional<FriendRequest> findByIdAndRequesterId(Long id, Long requesterId);

    long countByAddresseeIdAndStatus(Long addresseeId, FriendRequestStatus status);

    @Query("""
            SELECT fr
            FROM FriendRequest fr
            WHERE fr.status = com.backend.springapp.friend.FriendRequestStatus.PENDING
              AND ((fr.requesterId = :a AND fr.addresseeId = :b)
                OR (fr.requesterId = :b AND fr.addresseeId = :a))
            ORDER BY fr.createdAt DESC
            """)
    List<FriendRequest> findPendingBetween(@Param("a") Long a, @Param("b") Long b);
}
