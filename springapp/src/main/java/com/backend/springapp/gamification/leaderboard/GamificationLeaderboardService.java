package com.backend.springapp.gamification.leaderboard;

import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import com.backend.springapp.gamification.WeeklyStats;
import com.backend.springapp.gamification.WeeklyStatsRepository;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gamification leaderboard logic — XP, weekly stats, streaks.
 * Separate from the existing LeaderboardService (which ranks by problem-solving rating).
 */
@Service
@RequiredArgsConstructor
public class GamificationLeaderboardService {

    private final PlayerStatsRepository statsRepository;
    private final WeeklyStatsRepository weeklyStatsRepository;
    private final UserRepository userRepository;

    /* ═══════════════════════════════════════════════════════════
     * GLOBAL XP LEADERBOARD (all-time)
     * ═══════════════════════════════════════════════════════════ */

    public Page<GamificationLeaderboardEntryDTO> getGlobalXPLeaderboard(Pageable pageable) {
        List<PlayerStats> rows = statsRepository.findTopByXp(pageable);
        long total = statsRepository.countWithXp();
        List<GamificationLeaderboardEntryDTO> entries = toEntries(rows, (int) pageable.getOffset(), ps -> ps.getXp());
        return new PageImpl<>(entries, pageable, total);
    }

    /* ═══════════════════════════════════════════════════════════
     * WEEKLY XP LEADERBOARD
     * ═══════════════════════════════════════════════════════════ */

    public Page<GamificationLeaderboardEntryDTO> getWeeklyXPLeaderboard(Pageable pageable) {
        LocalDate weekStart = currentWeekStart();
        List<WeeklyStats> rows = weeklyStatsRepository.findTopByXp(weekStart, pageable);
        long total = weeklyStatsRepository.countActiveByWeek(weekStart);
        List<GamificationLeaderboardEntryDTO> entries = toWeeklyEntries(rows, (int) pageable.getOffset(), ws -> ws.getXpEarned());
        return new PageImpl<>(entries, pageable, total);
    }

    /* ═══════════════════════════════════════════════════════════
     * WEEKLY COINS LEADERBOARD
     * ═══════════════════════════════════════════════════════════ */

    public Page<GamificationLeaderboardEntryDTO> getWeeklyCoinsLeaderboard(Pageable pageable) {
        LocalDate weekStart = currentWeekStart();
        List<WeeklyStats> rows = weeklyStatsRepository.findTopByCoins(weekStart, pageable);
        long total = weeklyStatsRepository.countActiveByWeekCoins(weekStart);
        List<GamificationLeaderboardEntryDTO> entries = toWeeklyEntries(rows, (int) pageable.getOffset(), ws -> ws.getCoinsEarned());
        return new PageImpl<>(entries, pageable, total);
    }

    /* ═══════════════════════════════════════════════════════════
     * STREAK LEADERBOARD
     * ═══════════════════════════════════════════════════════════ */

    public Page<GamificationLeaderboardEntryDTO> getStreakLeaderboard(Pageable pageable) {
        List<PlayerStats> rows = statsRepository.findTopByStreak(pageable);
        long total = statsRepository.countWithActiveStreak();
        List<GamificationLeaderboardEntryDTO> entries = toEntries(rows, (int) pageable.getOffset(), ps -> ps.getCurrentStreak());
        return new PageImpl<>(entries, pageable, total);
    }

    /* ═══════════════════════════════════════════════════════════
     * BATTLE RATING LEADERBOARD (ELO)
     * ═══════════════════════════════════════════════════════════ */

    public Page<GamificationLeaderboardEntryDTO> getBattleRatingLeaderboard(Pageable pageable) {
        List<PlayerStats> rows = statsRepository.findTopByBattleRating(pageable);
        long total = statsRepository.countAll();
        List<GamificationLeaderboardEntryDTO> entries = toEntries(rows, (int) pageable.getOffset(), ps -> ps.getBattleRating());
        return new PageImpl<>(entries, pageable, total);
    }

    /* ═══════════════════════════════════════════════════════════
     * INSTITUTION XP LEADERBOARD
     * ═══════════════════════════════════════════════════════════ */

    public Page<GamificationLeaderboardEntryDTO> getInstitutionXPLeaderboard(Long institutionId, Pageable pageable) {
        List<PlayerStats> rows = statsRepository.findTopByXpAndInstitution(institutionId, pageable);
        long total = statsRepository.countByInstitution(institutionId);
        List<GamificationLeaderboardEntryDTO> entries = toEntries(rows, (int) pageable.getOffset(), ps -> ps.getXp());
        return new PageImpl<>(entries, pageable, total);
    }

    /* ═══════════════════════════════════════════════════════════
     * MY RANK
     * ═══════════════════════════════════════════════════════════ */

    public GamificationRankDTO getMyRank(Long userId, String type) {
        PlayerStats ps = statsRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Player stats not found for userId=" + userId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        long rank;
        int value;

        switch (type) {
            case "global-xp" -> {
                rank  = statsRepository.countWithHigherXp(ps.getXp()) + 1;
                value = ps.getXp();
            }
            case "weekly-xp" -> {
                LocalDate weekStart = currentWeekStart();
                int weeklyXp = weeklyStatsRepository.findByUserIdAndWeekStart(userId, weekStart)
                        .map(WeeklyStats::getXpEarned).orElse(0);
                rank  = weeklyStatsRepository.countWithHigherWeeklyXp(weekStart, weeklyXp) + 1;
                value = weeklyXp;
            }
            case "weekly-coins" -> {
                LocalDate weekStart = currentWeekStart();
                int weeklyCoins = weeklyStatsRepository.findByUserIdAndWeekStart(userId, weekStart)
                        .map(WeeklyStats::getCoinsEarned).orElse(0);
                rank  = weeklyStatsRepository.countWithHigherWeeklyCoins(weekStart, weeklyCoins) + 1;
                value = weeklyCoins;
            }
            case "streaks" -> {
                rank  = statsRepository.countWithHigherStreak(ps.getCurrentStreak()) + 1;
                value = ps.getCurrentStreak();
            }
            case "battle-rating" -> {
                rank  = statsRepository.countWithHigherBattleRating(ps.getBattleRating()) + 1;
                value = ps.getBattleRating();
            }
            default -> throw new IllegalArgumentException("Unknown leaderboard type: " + type);
        }

        return new GamificationRankDTO(userId, user.getUsername(), rank, value, type);
    }

    /* ═══════════════════════════════════════════════════════════
     * HELPERS
     * ═══════════════════════════════════════════════════════════ */

    /** Returns the Monday of the current ISO week. */
    public static LocalDate currentWeekStart() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    /** Convert PlayerStats rows to leaderboard entries with ranks. */
    private List<GamificationLeaderboardEntryDTO> toEntries(
            List<PlayerStats> rows, int offset,
            java.util.function.ToIntFunction<PlayerStats> valueExtractor) {

        List<Long> userIds = rows.stream().map(PlayerStats::getUserId).toList();
        Map<Long, String> usernameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUid, User::getUsername));

        List<GamificationLeaderboardEntryDTO> entries = new ArrayList<>(rows.size());
        for (int i = 0; i < rows.size(); i++) {
            PlayerStats ps  = rows.get(i);
            int val         = valueExtractor.applyAsInt(ps);
            int rank        = offset + i + 1;

            // Competition-style: same value → same rank
            if (i > 0 && val == valueExtractor.applyAsInt(rows.get(i - 1))) {
                rank = entries.get(i - 1).rank();
            }

            entries.add(new GamificationLeaderboardEntryDTO(
                rank,
                ps.getUserId(),
                usernameMap.getOrDefault(ps.getUserId(), "Unknown"),
                val,
                ps.getLevel(),
                ps.getCurrentStreak()
            ));
        }
        return entries;
    }

    /** Convert WeeklyStats rows to leaderboard entries with ranks. */
    private List<GamificationLeaderboardEntryDTO> toWeeklyEntries(
            List<WeeklyStats> rows, int offset,
            java.util.function.ToIntFunction<WeeklyStats> valueExtractor) {

        List<Long> userIds = rows.stream().map(WeeklyStats::getUserId).toList();
        Map<Long, String> usernameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUid, User::getUsername));

        // Batch-fetch PlayerStats for level/streak info
        Map<Long, PlayerStats> statsMap = new HashMap<>();
        for (Long uid : userIds) {
            statsRepository.findByUserId(uid).ifPresent(ps -> statsMap.put(uid, ps));
        }

        List<GamificationLeaderboardEntryDTO> entries = new ArrayList<>(rows.size());
        for (int i = 0; i < rows.size(); i++) {
            WeeklyStats ws = rows.get(i);
            int val        = valueExtractor.applyAsInt(ws);
            int rank       = offset + i + 1;

            if (i > 0 && val == valueExtractor.applyAsInt(rows.get(i - 1))) {
                rank = entries.get(i - 1).rank();
            }

            PlayerStats ps = statsMap.get(ws.getUserId());
            entries.add(new GamificationLeaderboardEntryDTO(
                rank,
                ws.getUserId(),
                usernameMap.getOrDefault(ws.getUserId(), "Unknown"),
                val,
                ps != null ? ps.getLevel() : 1,
                ps != null ? ps.getCurrentStreak() : 0
            ));
        }
        return entries;
    }
}
