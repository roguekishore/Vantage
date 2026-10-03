package com.backend.springapp.judge.queue;

import com.backend.springapp.gamification.battle.*;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * The post-judge half of a submission, in one transaction: insert the battle_submissions row, update the solved count,
 * solve time, FFA points, and fire the completion triggers (through BattleLifecycleService).
 * Shared by the synchronous path and the queue finalizer so both score identically.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BattleSubmissionRecorder {

    /** broadcast is false when the battle was just completed as a group battle (completion already pushed its own events). */
    public record Outcome(SubmitResultDTO result, BattleMode mode, boolean broadcast) {}

    private final BattleRepository battleRepo;
    private final BattleParticipantRepository participantRepo;
    private final BattleSubmissionRepository submissionRepo;
    private final BattleLifecycleService lifecycleService;
    private final com.backend.springapp.experiments.ExperimentService experimentService;
    @Value("${battle.continueAfterFirstFinisher.enabled:true}")
    private boolean continueAfterFirstFinisherEnabled = true;
    @Autowired(required = false)
    private MeterRegistry meterRegistry;

    /**
     * @param solvedAt when the player submitted (solve time is measured from the battle start to this instant)
     * @return empty when the battle is no longer ACTIVE; nothing is recorded in that case
     */
    @Transactional
    public Optional<Outcome> record(Long battleId, Long userId, int problemIndex, String language, String code,
                                    JudgeResult judged, LocalDateTime solvedAt) {
        Battle battle = battleRepo.findById(battleId).orElse(null);
        if (battle == null || battle.getState() != BattleState.ACTIVE) return Optional.empty();
        BattleParticipant me = participantRepo.findByBattleIdAndUserId(battleId, userId)
                .orElseThrow(() -> new IllegalStateException("Not in this battle"));
        long elapsed = Math.max(0, Duration.between(battle.getStartedAt(), solvedAt).toMillis());

        BattleSubmission sub = new BattleSubmission();
        sub.setBattleId(battleId);
        sub.setUserId(userId);
        sub.setProblemIndex(problemIndex);
        sub.setLanguage(language);
        sub.setCode(code);
        sub.setVerdict(judged.verdict());
        sub.setExecutionTimeMs(judged.executionTimeMs());
        submissionRepo.saveAndFlush(sub);

        me.setTotalSubmissions(me.getTotalSubmissions() + 1);
        boolean allSolved = false;
        boolean groupCompleted = false;
        boolean accepted1v1 = false;
        if (judged.verdict() == Verdict.ACCEPTED) {
            me.setProblemsSolved(me.getProblemsSolved() + 1);
            me.setTotalSolveTimeMs(me.getTotalSolveTimeMs() + elapsed);
            if (battle.getMode() == BattleMode.GROUP_FFA) {
                int ffaPoints = calculateFfaPoints(battle, battleId, userId, problemIndex, elapsed);
                me.setGroupScore(me.getGroupScore() + ffaPoints);
                allSolved = me.getProblemsSolved() >= battle.getProblemCount();
                log.info("FFA: user {} solved problem {} for {} points (total={})",
                        userId, problemIndex, ffaPoints, me.getGroupScore());
            } else {
                accepted1v1 = true;
                allSolved = me.getProblemsSolved() >= battle.getProblemCount();
            }
        }
        participantRepo.saveAndFlush(me);

        if (accepted1v1) {
            if (allSolved) incrementMetric("battle.firstFinisher", "mode", battle.getMode().name());
            if (allSolved && (!continueAfterFirstFinisherEnabled || experimentService.isTreatment(battleId))) {
                incrementMetric("battle.complete.trigger", "reason", "all_solved", "mode", battle.getMode().name());
                lifecycleService.completeBattle(battleId);
            } else {
                // The battle goes on: end it now if both players have solved everything (otherwise only the 5 s sweep would).
                lifecycleService.completeIfAllFinished(battleId);
            }
        }
        if (battle.getMode() == BattleMode.GROUP_FFA) {
            List<BattleParticipant> active = participantRepo.findByBattleId(battleId).stream()
                    .filter(p -> !p.isForfeited()).toList();
            groupCompleted = !active.isEmpty()
                    && active.stream().allMatch(p -> p.getProblemsSolved() >= battle.getProblemCount());
            if (groupCompleted) {
                incrementMetric("battle.complete.trigger", "reason", "all_players_finished", "mode", battle.getMode().name());
                lifecycleService.completeGroupBattle(battleId);
            }
        }

        SubmitResultDTO dto = new SubmitResultDTO(judged.verdict().name(), judged.executionTimeMs(),
                me.getProblemsSolved(), battle.getProblemCount(), allSolved,
                judged.firstFailedInput(), judged.firstFailedExpected(), judged.firstFailedActual(), judged.firstFailedError());
        return Optional.of(new Outcome(dto, battle.getMode(), !groupCompleted));
    }

    /** FFA points = floor(base * (1 + timeRemaining/total * 0.5) * max(0.5, 1 - wrong * 0.1)); base EASY 100, MEDIUM 250, HARD 500. */
    private int calculateFfaPoints(Battle battle, Long battleId, Long userId, int problemIndex, long elapsedMs) {
        int basePoints = switch (battle.getDifficulty()) {
            case BASIC, EASY -> 100;
            case MEDIUM -> 250;
            case HARD -> 500;
        };
        long totalMs = (long) battle.getDurationMinutes() * 60_000;
        double timeBonus = 1.0 + ((double) Math.max(0, totalMs - elapsedMs) / totalMs) * 0.5;
        int wrongSubs = submissionRepo.countWrongSubmissions(battleId, userId, problemIndex);
        double accuracy = Math.max(0.5, 1.0 - wrongSubs * 0.1);
        return (int) Math.floor(basePoints * timeBonus * accuracy);
    }

    private void incrementMetric(String name, String... tags) {
        if (meterRegistry == null) return;
        try {
            meterRegistry.counter(name, tags).increment();
        } catch (Exception ignored) {
            // metrics must never break gameplay
        }
    }
}
