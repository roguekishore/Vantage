package com.backend.springapp.gamification.achievement;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for the achievement / badge system.
 */
@RestController
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    /**
     * Full achievement catalog with the requesting user's progress.
     * Hidden badges show "???" until earned.
     * GET /api/achievements?userId=1
     */
    @GetMapping("/api/achievements")
    public ResponseEntity<List<AchievementDTO>> allAchievements(@RequestParam Long userId) {
        return ResponseEntity.ok(achievementService.getAllAchievements(userId));
    }

    /**
     * Only the requesting user's earned badges.
     * GET /api/me/achievements?userId=1
     */
    @GetMapping("/api/me/achievements")
    public ResponseEntity<List<AchievementDTO>> myAchievements(@RequestParam Long userId) {
        return ResponseEntity.ok(achievementService.getPlayerAchievements(userId));
    }

    /**
     * Another player's earned badges (public profile).
     * GET /api/users/{id}/achievements
     */
    @GetMapping("/api/users/{id}/achievements")
    public ResponseEntity<List<AchievementDTO>> userAchievements(@PathVariable("id") Long userId) {
        return ResponseEntity.ok(achievementService.getPlayerAchievements(userId));
    }
}
