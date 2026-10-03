package com.backend.springapp.judge.queue;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Entry point for POST /submit when the queue is on. Not transactional itself: if the unique key rejects a duplicate,
 * the failed transaction is already rolled back and we simply return the job the winner created.
 */
@Service
@RequiredArgsConstructor
public class JudgeJobSubmitter {

    private final JudgeJobRepository jobs;
    private final JudgeJobCreator creator;
    private final JudgeJobReader reader;

    public JudgeJobStatusDTO submit(Long battleId, Long userId, int problemIndex, String language, String code, String key) {
        Optional<JudgeJob> existing = jobs.findByUserIdAndIdempotencyKey(userId, key);
        if (existing.isPresent()) return reader.toDto(existing.get());
        try {
            Long id = creator.create(battleId, userId, problemIndex, language, code, key);
            return reader.toDto(jobs.findById(id).orElseThrow());
        } catch (DataIntegrityViolationException | CannotAcquireLockException dup) {
            // Lost the race to a concurrent request with the same key (or was a deadlock victim of that race).
            return reader.toDto(awaitWinner(userId, key, dup));
        }
    }

    private JudgeJob awaitWinner(Long userId, String key, RuntimeException cause) {
        for (int i = 0; i < 40; i++) {
            Optional<JudgeJob> job = jobs.findByUserIdAndIdempotencyKey(userId, key);
            if (job.isPresent()) return job.get();
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        throw cause;
    }
}
