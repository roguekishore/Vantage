package com.backend.springapp.gamification.battle;

import com.backend.springapp.judge.queue.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Code submission when the judge queue is OFF: pre-check transaction, then the judge call with no transaction open
 * (B2: a slow judge no longer pins a DB connection), then one finalize transaction. The queue-on path lives in
 * judge/queue (JudgeJobSubmitter + JudgeJobProcessor) and shares the same pre-check and recorder.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BattleJudgingService {

    private final JudgePrecheck precheck;
    private final JudgeCaller judgeCaller;
    private final BattleSubmissionRecorder recorder;
    private final BattleStateBroadcaster broadcaster;

    /** Not @Transactional on purpose: each step owns its own short transaction. */
    public SubmitResultDTO submitCode(Long battleId, Long userId, int problemIndex, String language, String code) {
        JudgePrecheck.Passed passed = precheck.run(battleId, userId, problemIndex);
        // A judge outage throws JudgeUnavailableException here; nothing is recorded (it used to become RUNTIME_ERROR).
        JudgeResult judged = judgeCaller.judge(passed.judgeProblemId(), language, code);
        Optional<BattleSubmissionRecorder.Outcome> outcome =
                recorder.record(battleId, userId, problemIndex, language, code, judged, passed.at());
        BattleSubmissionRecorder.Outcome o = outcome.orElseThrow(
                () -> new IllegalStateException("Battle ended before judging completed"));
        if (o.broadcast()) broadcaster.broadcast(battleId, o.mode());
        return o.result();
    }
}
