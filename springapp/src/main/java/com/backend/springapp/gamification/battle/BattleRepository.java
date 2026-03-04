package com.backend.springapp.gamification.battle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BattleRepository extends JpaRepository<Battle, Long> {

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
}
