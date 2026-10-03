package com.backend.springapp.gamification.battle;

import com.backend.springapp.gamification.GamificationService;
import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import com.backend.springapp.gamification.achievement.AchievementService;
import com.backend.springapp.gamification.coins.TransactionSource;
import com.backend.springapp.problem.Problem;
import com.backend.springapp.problem.ProblemRepository;
import com.backend.springapp.problem.Tag;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserProgressRepository;
import com.backend.springapp.user.UserRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Objects;
import com.backend.springapp.realtime.RealtimePublisher;

/**
 * Code submission: pre-checks, judge call, verdict/solve/FFA scoring, completion triggers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BattleJudgingService {

    private final BattleRepository battleRepo;
    private final BattleParticipantRepository participantRepo;
    private final BattleProblemRepository battleProblemRepo;
    private final BattleSubmissionRepository submissionRepo;
    private final ProblemRepository problemRepo;
    private final com.backend.springapp.judge.JudgeProxyService judgeProxyService;
    private final BattleService battleService;
    private final BattleViews battleViews;
    private final BattleLifecycleService lifecycleService;
    private final RealtimePublisher realtimePublisher;
    private final com.backend.springapp.experiments.ExperimentService experimentService;
    @Value("${battle.continueAfterFirstFinisher.enabled:true}")
    private boolean continueAfterFirstFinisherEnabled = true;
    @Autowired(required = false)
    private MeterRegistry meterRegistry;

    private static final int RATE_LIMIT_SECONDS = 10;

    @Transactional
    public SubmitResultDTO submitCode(Long battleId, Long userId, int problemIndex,
                                       String language, String code) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));

        if (battle.getState() != BattleState.ACTIVE) {
            throw new IllegalStateException("Battle is not active");
        }

        // Verify time hasn't expired
        long elapsed = Duration.between(battle.getStartedAt(), LocalDateTime.now()).toMillis();
        if (elapsed >= (long) battle.getDurationMinutes() * 60_000) {
            throw new IllegalStateException("Battle time has expired");
        }

        BattleParticipant me = participantRepo.findByBattleIdAndUserId(battleId, userId)
                .orElseThrow(() -> new IllegalStateException("Not in this battle"));

        if (battle.getMode() == BattleMode.GROUP_FFA && me.isForfeited()) {
            throw new IllegalStateException("You forfeited this group battle");
        }

        // Already solved this problem?
        if (submissionRepo.hasAcceptedSubmission(battleId, userId, problemIndex)) {
            throw new IllegalStateException("You already solved this problem");
        }

        // Rate limit: 1 submission per 10 seconds
        submissionRepo.findTopByBattleIdAndUserIdOrderBySubmittedAtDesc(battleId, userId)
                .ifPresent(last -> {
                    long secsSince = Duration.between(last.getSubmittedAt(), LocalDateTime.now()).getSeconds();
                    if (secsSince < RATE_LIMIT_SECONDS) {
                        throw new IllegalStateException(
                                "Rate limit: wait " + (RATE_LIMIT_SECONDS - secsSince) + " seconds");
                    }
                });

        // Get judge problem ID
        List<BattleProblem> battleProblems = battleProblemRepo.findByBattleIdOrderByProblemIndex(battleId);
        BattleProblem bp = battleProblems.stream()
                .filter(p -> p.getProblemIndex() == problemIndex)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid problem index"));

        Problem springProblem = problemRepo.findById(bp.getProblemId()).orElse(null);
        String resolvedJudgeId = battleService.resolveJudgeProblemId(bp.getJudgeProblemId(), springProblem);

        // Call the Judge service
        JudgeResult judgeResult = callJudge(resolvedJudgeId, language, code);

        // Self-heal stored judgeProblemId for future requests/battles state payloads
        if (!Objects.equals(resolvedJudgeId, bp.getJudgeProblemId())) {
            bp.setJudgeProblemId(resolvedJudgeId);
            battleProblemRepo.saveAndFlush(bp);
        }

        // Record submission
        BattleSubmission sub = new BattleSubmission();
        sub.setBattleId(battleId);
        sub.setUserId(userId);
        sub.setProblemIndex(problemIndex);
        sub.setLanguage(language);
        sub.setCode(code);
        sub.setVerdict(judgeResult.verdict());
        sub.setExecutionTimeMs(judgeResult.executionTimeMs());
        submissionRepo.saveAndFlush(sub);

        me.setTotalSubmissions(me.getTotalSubmissions() + 1);

        boolean allSolved = false;
        boolean shouldCompleteGroupBattle = false;
        if (judgeResult.verdict() == Verdict.ACCEPTED) {
            me.setProblemsSolved(me.getProblemsSolved() + 1);
            // Add solve time (ms from battle start)
            me.setTotalSolveTimeMs(me.getTotalSolveTimeMs() + elapsed);

            // ── GROUP_FFA: apply FFA scoring formula ──
            if (battle.getMode() == BattleMode.GROUP_FFA) {
                int ffaPoints = calculateFfaPoints(battle, battleId, userId, problemIndex, elapsed);
                me.setGroupScore(me.getGroupScore() + ffaPoints);
                if (me.getProblemsSolved() >= battle.getProblemCount()) {
                    allSolved = true;
                }
                log.info("FFA: user {} solved problem {} for {} points (total={})",
                        userId, problemIndex, ffaPoints, me.getGroupScore());
            } else {
                // 1v1: allSolved is informational; battle continues until timer/forfeit
                if (me.getProblemsSolved() >= battle.getProblemCount()) {
                    allSolved = true;
                    incrementMetric("battle.firstFinisher", "mode", battle.getMode().name());
                    if (!continueAfterFirstFinisherEnabled || experimentService.isTreatment(battleId)) {
                        incrementMetric("battle.complete.trigger", "reason", "all_solved", "mode", battle.getMode().name());
                        lifecycleService.completeBattle(battleId);
                    }
                }
            }
        }

        participantRepo.saveAndFlush(me);

        if (battle.getMode() == BattleMode.GROUP_FFA) {
            List<BattleParticipant> activeParticipants = participantRepo.findByBattleId(battleId).stream()
                    .filter(p -> !p.isForfeited())
                    .toList();

            shouldCompleteGroupBattle = !activeParticipants.isEmpty()
                    && activeParticipants.stream().allMatch(p -> p.getProblemsSolved() >= battle.getProblemCount());

            if (shouldCompleteGroupBattle) {
                incrementMetric("battle.complete.trigger", "reason", "all_players_finished", "mode", battle.getMode().name());
                lifecycleService.completeGroupBattle(battleId);
            }
        }

        // ── WebSocket: broadcast updated state to participants ──
        if (!shouldCompleteGroupBattle) {
            try {
                List<BattleParticipant> allParticipants = participantRepo.findByBattleId(battleId);
                if (battle.getMode() == BattleMode.GROUP_FFA) {
                    // Broadcast group scoreboard to each player
                    for (BattleParticipant p : allParticipants) {
                        GroupBattleStateDTO stateDTO = battleViews.getGroupBattleState(battleId, p.getUserId());
                        realtimePublisher.toTopic("/topic/battle/" + battleId + "/group-state/" + p.getUserId(), stateDTO);
                    }
                } else {
                    // Broadcast 1v1 state to each player
                    for (BattleParticipant p : allParticipants) {
                        BattleStateDTO stateDTO = battleViews.getBattleState(battleId, p.getUserId());
                        realtimePublisher.toTopic("/topic/battle/" + battleId + "/state/" + p.getUserId(), stateDTO);
                    }
                }
            } catch (Exception e) {
                log.warn("WebSocket broadcast failed after submission: {}", e.getMessage());
            }
        }

        return new SubmitResultDTO(
                judgeResult.verdict().name(),
                judgeResult.executionTimeMs(),
                me.getProblemsSolved(),
                battle.getProblemCount(),
                allSolved,
                judgeResult.firstFailedInput(),
                judgeResult.firstFailedExpected(),
                judgeResult.firstFailedActual(),
                judgeResult.firstFailedError()
        );
    }

    /** Proxy code to the Judge service via JudgeProxyService (fetches testCases from catalog). */
    private JudgeResult callJudge(String problemId, String language, String code) {
        try {
            Map<?, ?> resBody = judgeProxyService.submit(problemId, language, code);
            if (resBody == null || resBody.isEmpty()) {
                return new JudgeResult(Verdict.RUNTIME_ERROR, 0L, null, null, null, null);
            }

            String status = String.valueOf(resBody.get("status"));
            Long execTime = resBody.get("time") != null
                    ? ((Number) resBody.get("time")).longValue() : 0L;

            Verdict verdict = switch (status) {
                case "Accepted" -> Verdict.ACCEPTED;
                case "Wrong Answer" -> Verdict.WRONG_ANSWER;
                case "Time Limit Exceeded" -> Verdict.TIME_LIMIT;
                case "Compilation Error" -> Verdict.COMPILE_ERROR;
                default -> Verdict.RUNTIME_ERROR;
            };

            String ffInput = null, ffExpected = null, ffActual = null, ffError = null;
            Object rawResults = resBody.get("results");
            if (rawResults instanceof java.util.List<?> resultList) {
                for (Object item : resultList) {
                    if (item instanceof Map<?, ?> tc) {
                        Boolean passed = (Boolean) tc.get("passed");
                        if (Boolean.FALSE.equals(passed)) {
                            ffInput    = tc.get("input")    != null ? String.valueOf(tc.get("input"))    : null;
                            ffExpected = tc.get("expected") != null ? String.valueOf(tc.get("expected")) : null;
                            ffActual   = tc.get("actual")   != null ? String.valueOf(tc.get("actual"))   : null;
                            ffError    = tc.get("error")    != null ? String.valueOf(tc.get("error"))    : null;
                            break;
                        }
                    }
                }
            }

            return new JudgeResult(verdict, execTime, ffInput, ffExpected, ffActual, ffError);
        } catch (Exception e) {
            log.error("Judge service call failed for problem {}: {}", problemId, e.getMessage());
            return new JudgeResult(Verdict.RUNTIME_ERROR, 0L, null, null, null, null);
        }
    }

    private record JudgeResult(
            Verdict verdict,
            Long executionTimeMs,
            String firstFailedInput,
            String firstFailedExpected,
            String firstFailedActual,
            String firstFailedError
    ) {}

    /**
     * FFA scoring formula:
     *   base_points = { EASY: 100, MEDIUM: 250, HARD: 500 }
     *   time_bonus  = 1 + (time_remaining / total_time) × 0.5
     *   accuracy    = max(0.5, 1 − wrong_submissions × 0.1)
     *   points      = floor(base_points × time_bonus × accuracy)
     */
    private int calculateFfaPoints(Battle battle, Long battleId, Long userId,
                                    int problemIndex, long elapsedMs) {
        int basePoints = switch (battle.getDifficulty()) {
            case BASIC, EASY -> 100;
            case MEDIUM       -> 250;
            case HARD         -> 500;
        };

        long totalMs = (long) battle.getDurationMinutes() * 60_000;
        long timeRemainingMs = Math.max(0, totalMs - elapsedMs);
        double timeBonus = 1.0 + ((double) timeRemainingMs / totalMs) * 0.5;

        int wrongSubs = submissionRepo.countWrongSubmissions(battleId, userId, problemIndex);
        double accuracy = Math.max(0.5, 1.0 - wrongSubs * 0.1);

        return (int) Math.floor(basePoints * timeBonus * accuracy);
    }

    private void incrementMetric(String name, String... tags) {
        if (meterRegistry == null) return;
        try {
            meterRegistry.counter(name, tags).increment();
        } catch (Exception ignored) {
            // Keep gameplay path resilient if metrics backend is unavailable.
        }
    }
}
