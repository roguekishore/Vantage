package com.backend.springapp.gamification.battle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BattleParticipantRepository extends JpaRepository<BattleParticipant, Long> {

    List<BattleParticipant> findByBattleId(Long battleId);

    Optional<BattleParticipant> findByBattleIdAndUserId(Long battleId, Long userId);

    /** All battles a user participated in, newest first. */
    List<BattleParticipant> findByUserIdOrderByBattleIdDesc(Long userId);

    /** Count how many ranked battles a user has participated in. */
    @Query("SELECT COUNT(bp) FROM BattleParticipant bp " +
           "JOIN Battle b ON b.id = bp.battleId " +
           "WHERE bp.userId = :userId AND b.mode = 'RANKED_1V1' AND b.state = 'COMPLETED'")
    long countCompletedRankedBattles(@Param("userId") Long userId);

    List<BattleParticipant> findByUserId(Long userId);
}
