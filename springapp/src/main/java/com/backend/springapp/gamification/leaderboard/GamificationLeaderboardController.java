package com.backend.springapp.gamification.leaderboard;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for gamification leaderboards.
 *
 * These are SEPARATE from the existing /api/leaderboard/* endpoints
 * (which rank by problem-solving rating). These rank by XP, coins, and streaks.
 */
@RestController
@RequestMapping("/api/gamification/leaderboard")
@RequiredArgsConstructor
public class GamificationLeaderboardController {

    private final GamificationLeaderboardService service;

    /** All-time XP rankings. GET /api/gamification/leaderboard/global-xp?page=0&size=20 */
    @GetMapping("/global-xp")
    public ResponseEntity<Page<GamificationLeaderboardEntryDTO>> globalXP(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(service.getGlobalXPLeaderboard(pageable));
    }

    /** This week's XP earnings. GET /api/gamification/leaderboard/weekly-xp?page=0&size=20 */
    @GetMapping("/weekly-xp")
    public ResponseEntity<Page<GamificationLeaderboardEntryDTO>> weeklyXP(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(service.getWeeklyXPLeaderboard(pageable));
    }

    /** This week's coin earnings. GET /api/gamification/leaderboard/weekly-coins?page=0&size=20 */
    @GetMapping("/weekly-coins")
    public ResponseEntity<Page<GamificationLeaderboardEntryDTO>> weeklyCoins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(service.getWeeklyCoinsLeaderboard(pageable));
    }

    /** Active streak rankings. GET /api/gamification/leaderboard/streaks?page=0&size=20 */
    @GetMapping("/streaks")
    public ResponseEntity<Page<GamificationLeaderboardEntryDTO>> streaks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(service.getStreakLeaderboard(pageable));
    }

    /** Battle rating (ELO) rankings. GET /api/gamification/leaderboard/battle-rating?page=0&size=20 */
    @GetMapping("/battle-rating")
    public ResponseEntity<Page<GamificationLeaderboardEntryDTO>> battleRating(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(service.getBattleRatingLeaderboard(pageable));
    }

    /** Institution XP leaderboard. GET /api/gamification/leaderboard/institution/{id}?page=0&size=20 */
    @GetMapping("/institution/{institutionId}")
    public ResponseEntity<Page<GamificationLeaderboardEntryDTO>> institutionXP(
            @PathVariable Long institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return ResponseEntity.ok(service.getInstitutionXPLeaderboard(institutionId, pageable));
    }

    /** My rank in a specific leaderboard. GET /api/gamification/leaderboard/me?userId=1&type=global-xp */
    @GetMapping("/me")
    public ResponseEntity<GamificationRankDTO> myRank(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "global-xp") String type) {
        return ResponseEntity.ok(service.getMyRank(userId, type));
    }
}
