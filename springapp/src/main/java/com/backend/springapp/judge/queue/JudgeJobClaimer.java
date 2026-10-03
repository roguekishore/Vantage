package com.backend.springapp.judge.queue;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.OptionalInt;

/** Step 1 of consuming: the claim, in its own short transaction. */
@Component
@RequiredArgsConstructor
public class JudgeJobClaimer {

    private final JudgeJobRepository jobs;
    private final JudgeQueueSettings settings;

    /**
     * @return the attempt number this claim owns, or empty if the job is finished or another worker holds a live lease.
     * The attempts value is read in the same transaction that holds the row lock, so it is exactly ours.
     */
    @Transactional
    public OptionalInt claim(Long jobId) {
        if (jobs.claim(jobId, settings.getLeaseSeconds()) != 1) return OptionalInt.empty();
        return OptionalInt.of(jobs.findById(jobId).orElseThrow().getAttempts());
    }
}
