package com.backend.springapp.judge.queue;

import com.backend.springapp.gamification.battle.*;
import com.backend.springapp.problem.Problem;
import com.backend.springapp.problem.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Objects;

/** The synchronous checks that run before any judging: battle ACTIVE, time left, participant, not forfeited, not solved, 10 s rate limit. */
@Component
@RequiredArgsConstructor
public class JudgePrecheck {

    public static final int RATE_LIMIT_SECONDS = 10;

    /** at = the moment the checks passed; the sync path measures solve time from it (the queue path uses the job's created_at). */
    public record Passed(String judgeProblemId, LocalDateTime at) {}

    private final BattleRepository battleRepo;
    private final BattleParticipantRepository participantRepo;
    private final BattleProblemRepository battleProblemRepo;
    private final BattleSubmissionRepository submissionRepo;
    private final ProblemRepository problemRepo;
    private final JudgeProblemIdResolver judgeIdResolver;

    @Transactional
    public Passed run(Long battleId, Long userId, int problemIndex) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));
        if (battle.getState() != BattleState.ACTIVE) {
            throw new IllegalStateException("Battle is not active");
        }
        LocalDateTime now = LocalDateTime.now();
        long elapsed = Duration.between(battle.getStartedAt(), now).toMillis();
        if (elapsed >= (long) battle.getDurationMinutes() * 60_000) {
            throw new IllegalStateException("Battle time has expired");
        }
        BattleParticipant me = participantRepo.findByBattleIdAndUserId(battleId, userId)
                .orElseThrow(() -> new IllegalStateException("Not in this battle"));
        if (battle.getMode() == BattleMode.GROUP_FFA && me.isForfeited()) {
            throw new IllegalStateException("You forfeited this group battle");
        }
        if (submissionRepo.hasAcceptedSubmission(battleId, userId, problemIndex)) {
            throw new IllegalStateException("You already solved this problem");
        }
        submissionRepo.findTopByBattleIdAndUserIdOrderBySubmittedAtDesc(battleId, userId).ifPresent(last -> {
            long secsSince = Duration.between(last.getSubmittedAt(), now).getSeconds();
            if (secsSince < RATE_LIMIT_SECONDS) {
                throw new IllegalStateException("Rate limit: wait " + (RATE_LIMIT_SECONDS - secsSince) + " seconds");
            }
        });

        BattleProblem bp = findProblem(battleId, problemIndex);
        String resolved = resolve(bp);
        if (!Objects.equals(resolved, bp.getJudgeProblemId())) { // self-heal the stored id for later state payloads
            bp.setJudgeProblemId(resolved);
            battleProblemRepo.saveAndFlush(bp);
        }
        return new Passed(resolved, now);
    }

    /** Judge problem id for a queued job (read-only; the consumer calls this just before judging). */
    @Transactional(readOnly = true)
    public String resolveJudgeId(Long battleId, int problemIndex) {
        return resolve(findProblem(battleId, problemIndex));
    }

    private BattleProblem findProblem(Long battleId, int problemIndex) {
        return battleProblemRepo.findByBattleIdOrderByProblemIndex(battleId).stream()
                .filter(p -> p.getProblemIndex() == problemIndex)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid problem index"));
    }

    private String resolve(BattleProblem bp) {
        Problem springProblem = problemRepo.findById(bp.getProblemId()).orElse(null);
        return judgeIdResolver.resolveJudgeProblemId(bp.getJudgeProblemId(), springProblem);
    }
}
