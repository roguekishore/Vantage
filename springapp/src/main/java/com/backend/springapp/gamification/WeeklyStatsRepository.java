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
public interface WeeklyStatsRepository extends JpaRepository<WeeklyStats, Long> {

    Optional<WeeklyStats> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    /** Top weekly XP earners for a given week, paginated. */
    @Query("SELECT w FROM WeeklyStats w WHERE w.weekStart = :weekStart ORDER BY w.xpEarned DESC")
    List<WeeklyStats> findTopByXp(@Param("weekStart") LocalDate weekStart, Pageable pageable);

    /** Total count of users with activity this week (for pagination metadata). */
    @Query("SELECT COUNT(w) FROM WeeklyStats w WHERE w.weekStart = :weekStart AND w.xpEarned > 0")
    long countActiveByWeek(@Param("weekStart") LocalDate weekStart);

    /** Top weekly coin earners for a given week, paginated. */
    @Query("SELECT w FROM WeeklyStats w WHERE w.weekStart = :weekStart ORDER BY w.coinsEarned DESC")
    List<WeeklyStats> findTopByCoins(@Param("weekStart") LocalDate weekStart, Pageable pageable);

    /** Count of users with coins earned this week. */
    @Query("SELECT COUNT(w) FROM WeeklyStats w WHERE w.weekStart = :weekStart AND w.coinsEarned > 0")
    long countActiveByWeekCoins(@Param("weekStart") LocalDate weekStart);

    /** User's rank (1-based) for weekly XP: count users with higher xp + 1. */
    @Query("SELECT COUNT(w) FROM WeeklyStats w WHERE w.weekStart = :weekStart AND w.xpEarned > :xp")
    long countWithHigherWeeklyXp(@Param("weekStart") LocalDate weekStart, @Param("xp") int xp);

    /** User's rank (1-based) for weekly coins. */
    @Query("SELECT COUNT(w) FROM WeeklyStats w WHERE w.weekStart = :weekStart AND w.coinsEarned > :coins")
    long countWithHigherWeeklyCoins(@Param("weekStart") LocalDate weekStart, @Param("coins") int coins);
}
