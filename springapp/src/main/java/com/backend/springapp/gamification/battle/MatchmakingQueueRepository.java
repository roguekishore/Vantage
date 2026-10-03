package com.backend.springapp.gamification.battle;

import com.backend.springapp.problem.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MatchmakingQueueRepository extends JpaRepository<MatchmakingQueue, Long> {

    Optional<MatchmakingQueue> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    /** Bulk delete: never throws if a concurrent matcher already removed the row (0 rows is fine). */
    @Modifying
    @Query("DELETE FROM MatchmakingQueue mq WHERE mq.userId = :userId")
    int deleteByUserId(@Param("userId") Long userId);

    /** Matcher-side delete by primary key (same lock order as the claim: PK only, no user_id index probe first). */
    @Modifying
    @Query(value = "DELETE FROM matchmaking_queue WHERE id IN (:ids)", nativeQuery = true)
    int deleteByIds(@Param("ids") List<Long> ids);

    /** Leaver-side: locks the row's PK unless an in-flight claim holds it, in which case the row is skipped. */
    @Query(value = "SELECT id FROM matchmaking_queue WHERE user_id = :userId FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<Long> lockIdsByUserIdSkipLocked(@Param("userId") Long userId);

    /** Distinct (mode, difficulty) pairs currently queued: one matching transaction per pair. */
    @Query("SELECT DISTINCT mq.mode, mq.difficulty FROM MatchmakingQueue mq")
    List<Object[]> findQueuedPairs();

    /**
     * Claims up to {@code batch} rows of one pair, rating-sorted. FOR UPDATE SKIP LOCKED means rows already claimed
     * by another instance's open transaction are silently skipped instead of waited on.
     */
    @Query(value = "SELECT * FROM matchmaking_queue WHERE mode = :mode AND difficulty = :difficulty "
            + "ORDER BY battle_rating, joined_at LIMIT :batch FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<MatchmakingQueue> claimBatch(@Param("mode") String mode, @Param("difficulty") String difficulty,
                                      @Param("batch") int batch);

    /** Find queue entries with same mode + difficulty, ordered by join time. */
    List<MatchmakingQueue> findByModeAndDifficultyOrderByJoinedAtAsc(BattleMode mode, Tag difficulty);

    /** Remove stale entries older than a given timestamp. */
    @Modifying
    @Query("DELETE FROM MatchmakingQueue mq WHERE mq.joinedAt < :cutoff")
    int deleteStaleEntries(@Param("cutoff") LocalDateTime cutoff);
}
