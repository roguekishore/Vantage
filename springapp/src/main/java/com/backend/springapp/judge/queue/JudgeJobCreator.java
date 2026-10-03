package com.backend.springapp.judge.queue;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** One transaction: run the pre-checks, insert the QUEUED job, and schedule the SQS send for after the commit. */
@Component
@RequiredArgsConstructor
public class JudgeJobCreator {

    private final JudgePrecheck precheck;
    private final JudgeJobRepository jobs;
    private final JudgeJobProducer producer;

    /** A duplicate (user, key) surfaces as DataIntegrityViolationException when the INSERT is flushed. */
    @Transactional
    public Long create(Long battleId, Long userId, int problemIndex, String language, String code, String key) {
        precheck.run(battleId, userId, problemIndex);
        // Rate limit also covers jobs that have not produced a battle_submissions row yet. Same-key jobs are
        // excluded, so a concurrent duplicate of this very request is not mistaken for a second submission.
        if (jobs.existsRecentOther(battleId, userId, JudgePrecheck.RATE_LIMIT_SECONDS, key)) {
            throw new IllegalStateException("Rate limit: wait " + JudgePrecheck.RATE_LIMIT_SECONDS + " seconds");
        }
        // created_at/updated_at are written by the database clock (NOW(3)), like every other time on this table
        jobs.insertQueued(battleId, userId, problemIndex, language, code, key);
        Long id = jobs.findByUserIdAndIdempotencyKey(userId, key).orElseThrow().getId();
        producer.sendAfterCommit(id);
        return id;
    }
}
