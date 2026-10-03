package com.backend.springapp.judge.queue;

import com.backend.springapp.gamification.battle.SubmitResultDTO;

/** status: QUEUED | RUNNING | DONE | FAILED. result is non-null only when DONE, error only when FAILED. */
public record JudgeJobStatusDTO(Long jobId, String status, SubmitResultDTO result, String error) {}
