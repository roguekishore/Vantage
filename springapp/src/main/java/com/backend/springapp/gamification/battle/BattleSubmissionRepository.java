package com.backend.springapp.gamification.battle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BattleSubmissionRepository extends JpaRepository<BattleSubmission, Long> {

    List<BattleSubmission> findByBattleIdAndUserId(Long battleId, Long userId);

    /** Most recent submission by a user in a battle (for rate limiting). */
    Optional<BattleSubmission> findTopByBattleIdAndUserIdOrderBySubmittedAtDesc(Long battleId, Long userId);

    /** Check if user has already solved a specific problem in this battle. */
    @Query("SELECT COUNT(bs) > 0 FROM BattleSubmission bs " +
           "WHERE bs.battleId = :battleId AND bs.userId = :userId " +
           "AND bs.problemIndex = :problemIndex AND bs.verdict = 'ACCEPTED'")
    boolean hasAcceptedSubmission(@Param("battleId") Long battleId,
                                  @Param("userId") Long userId,
                                  @Param("problemIndex") int problemIndex);

    /** Count wrong (non-ACCEPTED) submissions per problem for FFA scoring accuracy. */
    @Query("SELECT COUNT(bs) FROM BattleSubmission bs " +
           "WHERE bs.battleId = :battleId AND bs.userId = :userId " +
           "AND bs.problemIndex = :problemIndex AND bs.verdict <> 'ACCEPTED'")
    int countWrongSubmissions(@Param("battleId") Long battleId,
                              @Param("userId") Long userId,
                              @Param("problemIndex") int problemIndex);
}
