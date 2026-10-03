package com.backend.springapp.judge.queue;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.core.LockConfiguration;
import net.javacrumbs.shedlock.core.LockingTaskExecutor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * Safety net for a failed SQS send (the job was committed, the message was not). Every 30 s, under the ShedLock
 * "judge-requeue" lock so only one instance runs it, it re-sends jobs still QUEUED with updated_at older than 60 s
 * (DB clock). Re-sends are unbounded and idempotent (the claim guard drops duplicates); a job waiting behind a long
 * backlog is never failed here.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeJobRequeuer {

    private static final int STALE_SECONDS = 60;

    private final JudgeJobRepository jobs;
    private final JudgeJobProducer producer;
    private final JudgeQueueSettings settings;
    private final LockingTaskExecutor lockingTaskExecutor;

    @Scheduled(fixedDelay = 30_000, initialDelay = 30_000)
    public void run() {
        if (!settings.isEnabled()) return;
        lockingTaskExecutor.executeWithLock((Runnable) this::requeue,
                new LockConfiguration(Instant.now(), "judge-requeue", Duration.ofSeconds(60), Duration.ofSeconds(5)));
    }

    /** Public so the IT can run one pass without waiting for the schedule. */
    public void requeue() {
        for (Long id : jobs.findRequeueable(STALE_SECONDS)) {
            if (jobs.touchForResend(id, STALE_SECONDS) == 1) producer.send(id);
        }
    }
}
