package com.backend.springapp.judge.queue;

import tools.jackson.databind.ObjectMapper;
import com.backend.springapp.gamification.battle.Battle;
import com.backend.springapp.gamification.battle.BattleRepository;
import com.backend.springapp.gamification.battle.BattleState;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/** Step 3 of consuming: one transaction that either records the verdict or marks the job FAILED. */
@Component
@RequiredArgsConstructor
public class JudgeJobFinalizer {

    public static final String BATTLE_ENDED = "battle ended before judging completed";
    public static final String JUDGE_UNAVAILABLE = "judge unavailable";

    /** recorded is empty unless the job ended DONE; the caller broadcasts it after commit. */
    public record Result(boolean won, Optional<BattleSubmissionRecorder.Outcome> recorded) {}

    private final JudgeJobRepository jobs;
    private final BattleRepository battleRepo;
    private final BattleSubmissionRecorder recorder;
    private final ObjectMapper mapper;

    @Transactional
    public Result finish(JudgeJob job, int claimedAttempts, JudgeResult judged) {
        // The guard: only the attempt that still owns the claim gets 1 row. Anyone else stops here.
        if (jobs.markDone(job.getId(), claimedAttempts) != 1) return new Result(false, Optional.empty());

        Battle battle = battleRepo.findById(job.getBattleId()).orElse(null);
        Optional<BattleSubmissionRecorder.Outcome> outcome = (battle == null || battle.getState() != BattleState.ACTIVE)
                ? Optional.empty()
                // solve time counts from when the player pressed submit (job created_at), not from now
                : recorder.record(job.getBattleId(), job.getUserId(), job.getProblemIndex(), job.getLanguage(),
                        job.getCode(), judged, job.getCreatedAt());
        if (outcome.isEmpty()) {
            jobs.fail(job.getId(), claimedAttempts, BATTLE_ENDED);
            return new Result(true, Optional.empty());
        }
        jobs.setResult(job.getId(), toJson(outcome.get().result()));
        return new Result(true, outcome);
    }

    /** Gives up on a job after the judge stayed unreachable for max-attempts claims. Records no submission. */
    @Transactional
    public boolean failUnavailable(Long jobId, int claimedAttempts) {
        return jobs.fail(jobId, claimedAttempts, JUDGE_UNAVAILABLE) == 1;
    }

    /** For a job that can never be judged (e.g. its problem index no longer exists). */
    @Transactional
    public void failPermanently(Long jobId, int claimedAttempts, String reason) {
        jobs.fail(jobId, claimedAttempts, reason.length() > 255 ? reason.substring(0, 255) : reason);
    }

    private String toJson(Object o) {
        return mapper.writeValueAsString(o);
    }
}
