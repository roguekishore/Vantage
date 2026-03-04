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

    void deleteByUserId(Long userId);

    /** Find queue entries with same mode + difficulty, ordered by join time. */
    List<MatchmakingQueue> findByModeAndDifficultyOrderByJoinedAtAsc(BattleMode mode, Tag difficulty);

    /** Remove stale entries older than a given timestamp. */
    @Modifying
    @Query("DELETE FROM MatchmakingQueue mq WHERE mq.joinedAt < :cutoff")
    int deleteStaleEntries(@Param("cutoff") LocalDateTime cutoff);
}
