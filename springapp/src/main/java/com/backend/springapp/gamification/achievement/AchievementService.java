package com.backend.springapp.gamification.achievement;

import com.backend.springapp.gamification.*;
import com.backend.springapp.gamification.battle.Battle;
import com.backend.springapp.gamification.battle.BattleParticipant;
import com.backend.springapp.gamification.battle.BattleParticipantRepository;
import com.backend.springapp.gamification.battle.BattleRepository;
import com.backend.springapp.gamification.battle.BattleSubmission;
import com.backend.springapp.gamification.battle.BattleSubmissionRepository;
import com.backend.springapp.gamification.coins.CoinTransactionRepository;
import com.backend.springapp.gamification.coins.TransactionSource;
import com.backend.springapp.problem.ProblemRepository;
import com.backend.springapp.problem.Tag;
import com.backend.springapp.user.Status;
import com.backend.springapp.user.UserProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Achievement evaluation engine.
 *
 * Called from three integration points:
 *   1. After a problem is solved  → checkProblemAchievements(userId)
 *   2. After a streak milestone   → checkStreakAchievements(userId)
 *   3. After a battle completes   → checkBattleAchievements(userId, battleId)
 *
 * Each method queries the current user state, compares it against the
 * achievement catalog, and awards any newly-met badges.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepo;
    private final PlayerAchievementRepository playerAchievementRepo;
    private final PlayerStatsRepository statsRepo;
    private final CoinTransactionRepository txRepo;
    private final UserProgressRepository progressRepo;
    private final ProblemRepository problemRepo;
    private final BattleRepository battleRepo;
    private final BattleParticipantRepository participantRepo;
    private final BattleSubmissionRepository submissionRepo;
    private final GamificationService gamificationService;

    /* ═══════════════════════════════════════════════════════════
     * CHECK & AWARD - PROBLEM ACHIEVEMENTS
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Evaluate all PROBLEM-category achievements for the given user.
     * Returns a list of newly awarded achievement DTOs (empty if none).
     */
    @Transactional
    public List<AchievementDTO> checkProblemAchievements(Long userId) {
        long solvedCount = progressRepo.countByUserIdAndStatus(userId, Status.SOLVED);

        List<AchievementDTO> awarded = new ArrayList<>();

        awarded.addAll(tryAward(userId, "FIRST_SOLVE", () -> solvedCount >= 1));
        awarded.addAll(tryAward(userId, "SOLVE_10",    () -> solvedCount >= 10));
        awarded.addAll(tryAward(userId, "SOLVE_50",    () -> solvedCount >= 50));
        awarded.addAll(tryAward(userId, "SOLVE_100",   () -> solvedCount >= 100));

        // ALL_EASY / ALL_MEDIUM - compare solved vs total per difficulty
        awarded.addAll(tryAward(userId, "ALL_EASY", () -> {
            long totalEasy = problemRepo.countByTag(Tag.EASY);
            if (totalEasy == 0) return false;
            long solvedEasy = countSolvedByTag(userId, Tag.EASY);
            return solvedEasy >= totalEasy;
        }));

        awarded.addAll(tryAward(userId, "ALL_MEDIUM", () -> {
            long totalMedium = problemRepo.countByTag(Tag.MEDIUM);
            if (totalMedium == 0) return false;
            long solvedMedium = countSolvedByTag(userId, Tag.MEDIUM);
            return solvedMedium >= totalMedium;
        }));

        return awarded;
    }

    private long countSolvedByTag(Long userId, Tag tag) {
        return progressRepo.findAllByUserId(userId).stream()
                .filter(up -> up.getStatus() == Status.SOLVED)
                .filter(up -> up.getProblem().getTag() == tag)
                .count();
    }

    /* ═══════════════════════════════════════════════════════════
     * CHECK & AWARD - STREAK ACHIEVEMENTS
     * ═══════════════════════════════════════════════════════════ */

    @Transactional
    public List<AchievementDTO> checkStreakAchievements(Long userId) {
        PlayerStats stats = gamificationService.getOrCreateStats(userId);
        int streak = stats.getCurrentStreak();

        List<AchievementDTO> awarded = new ArrayList<>();
        awarded.addAll(tryAward(userId, "STREAK_7",   () -> streak >= 7));
        awarded.addAll(tryAward(userId, "STREAK_30",  () -> streak >= 30));
        awarded.addAll(tryAward(userId, "STREAK_100", () -> streak >= 100));
        return awarded;
    }

    /* ═══════════════════════════════════════════════════════════
     * CHECK & AWARD - BATTLE ACHIEVEMENTS
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Evaluate all BATTLE-category achievements after a battle completes.
     *
     * @param userId   the player to check
     * @param battleId the just-completed battle
     */
    @Transactional
    public List<AchievementDTO> checkBattleAchievements(Long userId, Long battleId) {
        List<AchievementDTO> awarded = new ArrayList<>();

        // Count total battle wins
        long totalWins = countBattleWins(userId);

        awarded.addAll(tryAward(userId, "FIRST_BATTLE_WIN", () -> totalWins >= 1));
        awarded.addAll(tryAward(userId, "BATTLE_WIN_5",     () -> totalWins >= 5));
        awarded.addAll(tryAward(userId, "BATTLE_WIN_20",    () -> totalWins >= 20));

        // SPEED_DEMON - solved a battle problem in under 5 minutes
        awarded.addAll(tryAward(userId, "SPEED_DEMON", () -> hasSpeedDemonSolve(userId, battleId)));

        // UNDERDOG - beat someone 200+ BR above you
        awarded.addAll(tryAward(userId, "UNDERDOG", () -> isUnderdogWin(userId, battleId)));

        return awarded;
    }

    private long countBattleWins(Long userId) {
        return battleRepo.findAll().stream()
                .filter(b -> b.getState() != null && b.getState().name().equals("COMPLETED"))
                .filter(b -> userId.equals(b.getWinnerId()))
                .count();
    }

    /**
     * Check if the user solved any problem in this battle within 5 minutes
     * of the battle starting.
     */
    private boolean hasSpeedDemonSolve(Long userId, Long battleId) {
        Battle battle = battleRepo.findById(battleId).orElse(null);
        if (battle == null || battle.getStartedAt() == null) return false;

        return submissionRepo.findByBattleIdAndUserId(battleId, userId).stream()
                .filter(s -> s.getVerdict() != null && s.getVerdict().name().equals("ACCEPTED"))
                .anyMatch(s -> {
                    long solveMs = Duration.between(battle.getStartedAt(), s.getSubmittedAt()).toMillis();
                    return solveMs < 5 * 60 * 1000; // 5 minutes
                });
    }

    /**
     * Check if the user won this battle against an opponent 200+ BR above them.
     */
    private boolean isUnderdogWin(Long userId, Long battleId) {
        Battle battle = battleRepo.findById(battleId).orElse(null);
        if (battle == null || !userId.equals(battle.getWinnerId())) return false;

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        BattleParticipant me = participants.stream()
                .filter(p -> p.getUserId().equals(userId)).findFirst().orElse(null);
        BattleParticipant opp = participants.stream()
                .filter(p -> !p.getUserId().equals(userId)).findFirst().orElse(null);

        if (me == null || opp == null) return false;
        return (opp.getRatingBefore() - me.getRatingBefore()) >= 200;
    }

    /* ═══════════════════════════════════════════════════════════
     * CORE AWARD LOGIC
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Try to award an achievement if:
     *   1. The achievement exists in the catalog
     *   2. The user hasn't already earned it
     *   3. The condition is met
     *
     * Returns a singleton list with the awarded DTO, or empty list.
     */
    private List<AchievementDTO> tryAward(Long userId, String key, java.util.function.BooleanSupplier condition) {
        Achievement achievement = achievementRepo.findByKey(key).orElse(null);
        if (achievement == null) return List.of();

        // Already earned?
        if (playerAchievementRepo.existsByUserIdAndAchievementId(userId, achievement.getId())) {
            return List.of();
        }

        // Condition met?
        if (!condition.getAsBoolean()) return List.of();

        // Award it
        PlayerAchievement pa = new PlayerAchievement();
        pa.setUserId(userId);
        pa.setAchievementId(achievement.getId());
        playerAchievementRepo.saveAndFlush(pa);

        // Credit coin + XP rewards
        if (achievement.getCoinReward() > 0) {
            gamificationService.creditCoins(userId, achievement.getCoinReward(),
                    TransactionSource.ACHIEVEMENT_REWARD, achievement.getId());
        }
        if (achievement.getXpReward() > 0) {
            PlayerStats stats = gamificationService.getOrCreateStats(userId);
            stats.setXp(stats.getXp() + achievement.getXpReward());
            stats.setLevel(GamificationService.calculateLevel(stats.getXp()));
            statsRepo.saveAndFlush(stats);
        }

        log.info("🏆 User {} earned achievement: {} (+{} coins, +{} XP)",
                userId, achievement.getName(), achievement.getCoinReward(), achievement.getXpReward());

        return List.of(toDTO(achievement, true, pa.getEarnedAt(), achievement.getTarget(), achievement.getTarget()));
    }

    /* ═══════════════════════════════════════════════════════════
     * QUERY METHODS
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Get all achievements with the user's progress + earned status.
     * Hidden badges show "???" if not yet earned.
     */
    @Transactional(readOnly = true)
    public List<AchievementDTO> getAllAchievements(Long userId) {
        List<Achievement> catalog = achievementRepo.findAll();
        Map<Long, PlayerAchievement> earned = playerAchievementRepo.findByUserId(userId).stream()
                .collect(Collectors.toMap(PlayerAchievement::getAchievementId, pa -> pa));

        return catalog.stream().map(a -> {
            PlayerAchievement pa = earned.get(a.getId());
            boolean hasEarned = pa != null;
            int progress = calculateProgress(userId, a);
            int target = resolveTarget(a);
            return toDTO(a, hasEarned, hasEarned ? pa.getEarnedAt() : null, progress, target);
        }).toList();
    }

    /**
     * Get only the user's earned achievements.
     */
    @Transactional(readOnly = true)
    public List<AchievementDTO> getPlayerAchievements(Long userId) {
        List<PlayerAchievement> earned = playerAchievementRepo.findByUserId(userId);
        return earned.stream().map(pa -> {
            Achievement a = achievementRepo.findById(pa.getAchievementId()).orElse(null);
            if (a == null) return null;
            return toDTO(a, true, pa.getEarnedAt(), a.getTarget(), a.getTarget());
        }).filter(Objects::nonNull).toList();
    }

    /* ═══════════════════════════════════════════════════════════
     * PROGRESS CALCULATOR
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Resolve the real target for achievements whose target depends on DB data.
     * ALL_EASY/ALL_MEDIUM targets depend on the current problem catalog size.
     */
    private int resolveTarget(Achievement a) {
        return switch (a.getKey()) {
            case "ALL_EASY" -> (int) problemRepo.countByTag(Tag.EASY);
            case "ALL_MEDIUM" -> (int) problemRepo.countByTag(Tag.MEDIUM);
            default -> a.getTarget();
        };
    }

    private int calculateProgress(Long userId, Achievement a) {
        return switch (a.getKey()) {
            case "FIRST_SOLVE", "SOLVE_10", "SOLVE_50", "SOLVE_100" ->
                    (int) progressRepo.countByUserIdAndStatus(userId, Status.SOLVED);
            case "ALL_EASY" ->
                    (int) countSolvedByTag(userId, Tag.EASY);
            case "ALL_MEDIUM" ->
                    (int) countSolvedByTag(userId, Tag.MEDIUM);
            case "STREAK_7", "STREAK_30", "STREAK_100" -> {
                PlayerStats stats = gamificationService.getOrCreateStats(userId);
                yield stats.getCurrentStreak();
            }
            case "FIRST_BATTLE_WIN", "BATTLE_WIN_5", "BATTLE_WIN_20" ->
                    (int) countBattleWins(userId);
            case "SPEED_DEMON", "UNDERDOG" -> {
                // Binary achievements - 0 or 1
                boolean earned = playerAchievementRepo.existsByUserIdAndAchievementId(userId, a.getId());
                yield earned ? 1 : 0;
            }
            default -> 0;
        };
    }

    /* ═══════════════════════════════════════════════════════════
     * DTO MAPPING
     * ═══════════════════════════════════════════════════════════ */

    private AchievementDTO toDTO(Achievement a, boolean earned, LocalDateTime earnedAt,
                                  int progress, int target) {
        // Hidden badges: mask name/description until earned
        String name = (a.isHidden() && !earned) ? "???" : a.getName();
        String desc = (a.isHidden() && !earned) ? "Hidden achievement" : a.getDescription();
        String icon = (a.isHidden() && !earned) ? null : a.getIconUrl();

        return new AchievementDTO(
                a.getId(), a.getKey(), name, desc, icon,
                a.getCategory().name(),
                a.getCoinReward(), a.getXpReward(),
                a.isHidden(), earned, earnedAt,
                Math.min(progress, target), target
        );
    }
}
