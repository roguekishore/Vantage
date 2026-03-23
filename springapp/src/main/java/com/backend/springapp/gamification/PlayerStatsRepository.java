package com.backend.springapp.gamification;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerStatsRepository extends JpaRepository<PlayerStats, Long> {

    Optional<PlayerStats> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    /**
     * Find all users whose streak is broken (lastActivityDate before cutoff
     * and currentStreak > 0). Used by StreakResetJob to iterate per-user
     * and check for Streak Shields before resetting.
     */
    @Query("SELECT p FROM PlayerStats p WHERE p.currentStreak > 0 AND p.lastActivityDate < :cutoff")
    List<PlayerStats> findStaleStreaks(@Param("cutoff") LocalDate cutoff);

    /* ── Phase 4: Leaderboard queries ── */

    /** Global XP leaderboard - all-time XP, descending. */
    @Query("SELECT p FROM PlayerStats p ORDER BY p.xp DESC")
    List<PlayerStats> findTopByXp(Pageable pageable);

    /** Count users with XP > 0 (for pagination total). */
    @Query("SELECT COUNT(p) FROM PlayerStats p WHERE p.xp > 0")
    long countWithXp();

    /** Streak leaderboard - active streaks, descending. */
    @Query("SELECT p FROM PlayerStats p WHERE p.currentStreak > 0 ORDER BY p.currentStreak DESC, p.longestStreak DESC")
    List<PlayerStats> findTopByStreak(Pageable pageable);

    /** Count users with active streaks. */
    @Query("SELECT COUNT(p) FROM PlayerStats p WHERE p.currentStreak > 0")
    long countWithActiveStreak();

    /** User's global XP rank: count users with higher XP + 1. */
    @Query("SELECT COUNT(p) FROM PlayerStats p WHERE p.xp > :xp")
    long countWithHigherXp(@Param("xp") int xp);

    /** User's streak rank: count users with higher current streak + 1. */
    @Query("SELECT COUNT(p) FROM PlayerStats p WHERE p.currentStreak > :streak")
    long countWithHigherStreak(@Param("streak") int streak);

    /** Count total battles played by a user (needed for ELO K-factor in Phase 5). */
    @Query("SELECT COUNT(p) FROM PlayerStats p WHERE p.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    /* ── Battle Rating Leaderboard ── */

    /** Battle rating leaderboard - highest ELO first. */
    @Query("SELECT p FROM PlayerStats p ORDER BY p.battleRating DESC")
    List<PlayerStats> findTopByBattleRating(Pageable pageable);

    /** Count users tracked in battle rating (everyone starts at 1200). */
    @Query("SELECT COUNT(p) FROM PlayerStats p")
    long countAll();

    /** User's battle rating rank. */
    @Query("SELECT COUNT(p) FROM PlayerStats p WHERE p.battleRating > :rating")
    long countWithHigherBattleRating(@Param("rating") int rating);

    /* ── Institution-scoped Leaderboard ── */

    /** Top XP earners within a specific institution. */
    @Query("SELECT p FROM PlayerStats p WHERE p.userId IN " +
           "(SELECT u.uid FROM User u WHERE u.institution.id = :institutionId) " +
           "ORDER BY p.xp DESC")
    List<PlayerStats> findTopByXpAndInstitution(@Param("institutionId") Long institutionId, Pageable pageable);

    /** Count users with XP in a specific institution (for pagination). */
    @Query("SELECT COUNT(p) FROM PlayerStats p WHERE p.userId IN " +
           "(SELECT u.uid FROM User u WHERE u.institution.id = :institutionId)")
    long countByInstitution(@Param("institutionId") Long institutionId);

    /** User's XP rank within their institution. */
    @Query("SELECT COUNT(p) FROM PlayerStats p WHERE p.xp > :xp AND p.userId IN " +
           "(SELECT u.uid FROM User u WHERE u.institution.id = :institutionId)")
    long countWithHigherXpInInstitution(@Param("institutionId") Long institutionId, @Param("xp") int xp);
}
