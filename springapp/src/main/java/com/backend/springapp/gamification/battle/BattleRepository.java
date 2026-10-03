package com.backend.springapp.gamification.battle;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface BattleRepository extends JpaRepository<Battle, Long> {

    /**
     * The battle row with a write lock (SELECT ... FOR UPDATE). Used where two requests decide something from each
     * other's committed rows: it must be the first statement of the transaction, so the plain reads that follow
     * take their snapshot only after the other request has committed.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Battle b WHERE b.id = :id")
    Optional<Battle> findByIdForUpdate(@Param("id") Long id);

    /** Find all battles by state. */
    List<Battle> findByState(BattleState state);

    /** Find a group room by its 6-char code. */
    Optional<Battle> findByRoomCode(String roomCode);

    /** Find active battles that have exceeded their duration. */
    @Query("SELECT b FROM Battle b WHERE b.state = 'ACTIVE' " +
           "AND TIMESTAMPADD(MINUTE, b.durationMinutes, b.startedAt) < CURRENT_TIMESTAMP")
    List<Battle> findExpiredActiveBattles();

    /** Find lobby battles that have exceeded the 60-second ready timeout. */
    @Query("SELECT b FROM Battle b WHERE b.state = 'WAITING' " +
           "AND TIMESTAMPADD(SECOND, 60, b.createdAt) < CURRENT_TIMESTAMP")
    List<Battle> findExpiredLobbyBattles();

    /**
     * Race-free terminal transition (D3): a conditional UPDATE. Exactly one concurrent caller sees 1 row affected;
     * everyone else sees 0 and must not apply ELO, rewards or broadcasts. Flushes pending changes first and clears
     * the persistence context afterwards so later reads in the same transaction see the new state.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Battle b SET b.state = :to, b.completedAt = :now, b.winnerId = :winnerId, b.endedReason = :reason " +
           "WHERE b.id = :id AND b.state IN :from")
    int transition(@Param("id") Long id,
                   @Param("from") Set<BattleState> from,
                   @Param("to") BattleState to,
                   @Param("now") LocalDateTime now,
                   @Param("winnerId") Long winnerId,
                   @Param("reason") String reason);

    /** ACTIVE 1v1 battles where both players have already solved every problem (safety-net sweep). */
    @Query("SELECT b FROM Battle b WHERE b.state = 'ACTIVE' AND b.mode <> 'GROUP_FFA' " +
           "AND (SELECT COUNT(p) FROM BattleParticipant p WHERE p.battleId = b.id " +
           "AND p.problemsSolved >= b.problemCount) >= 2")
    List<Battle> findActiveBattlesWithAllFinished();
}
