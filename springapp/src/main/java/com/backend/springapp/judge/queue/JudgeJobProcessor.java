package com.backend.springapp.judge.queue;

import com.backend.springapp.judge.JudgeUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.NoSuchElementException;
import java.util.OptionalInt;

/**
 * Handles one SQS message: claim, judge (no transaction open), finalize, broadcast.
 * Returns true when the message can be deleted. An exception means "leave it, it will be redelivered".
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeJobProcessor {

    private final JudgeJobClaimer claimer;
    private final JudgeJobRepository jobs;
    private final JudgePrecheck precheck;
    private final JudgeCaller judgeCaller;
    private final JudgeJobFinalizer finalizer;
    private final BattleStateBroadcaster broadcaster;
    private final JudgeQueueSettings settings;

    public boolean process(long jobId) {
        OptionalInt claimed = claimer.claim(jobId);
        if (claimed.isEmpty()) return true; // finished, or another consumer holds a live lease
        int attempts = claimed.getAsInt();
        JudgeJob job = jobs.findById(jobId).orElseThrow();

        JudgeResult judged;
        try {
            judged = judgeCaller.judge(precheck.resolveJudgeId(job.getBattleId(), job.getProblemIndex()),
                    job.getLanguage(), job.getCode());
        } catch (JudgeUnavailableException e) {
            log.warn("Judge unavailable for job {} (attempt {}/{}): {}", jobId, attempts, settings.getMaxAttempts(), e.getMessage());
            if (attempts < settings.getMaxAttempts()) return false; // reappears after the visibility timeout
            finalizer.failUnavailable(jobId, attempts);
            return true;
        } catch (NoSuchElementException | IllegalArgumentException e) {
            finalizer.failPermanently(jobId, attempts, e.getMessage());
            return true;
        }

        JudgeJobFinalizer.Result result = finalizer.finish(job, attempts, judged);
        result.recorded().filter(BattleSubmissionRecorder.Outcome::broadcast)
                .ifPresent(o -> broadcaster.broadcast(job.getBattleId(), o.mode()));
        return true;
    }
}
