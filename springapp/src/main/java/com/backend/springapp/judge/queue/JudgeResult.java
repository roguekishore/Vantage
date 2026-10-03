package com.backend.springapp.judge.queue;

import com.backend.springapp.gamification.battle.Verdict;

/** What the judge said about one submission, already mapped to our Verdict. */
public record JudgeResult(Verdict verdict, Long executionTimeMs, String firstFailedInput,
                          String firstFailedExpected, String firstFailedActual, String firstFailedError) {}
