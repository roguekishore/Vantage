package com.backend.springapp.judge.queue;

import com.backend.springapp.gamification.battle.Verdict;
import com.backend.springapp.judge.JudgeProxyService;
import com.backend.springapp.judge.JudgeUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Calls the judge and maps its JSON to a JudgeResult. Never opens a transaction.
 * An unreachable judge throws JudgeUnavailableException (not a verdict); any other failure stays a RUNTIME_ERROR as before.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeCaller {

    private final JudgeProxyService judgeProxyService;

    public JudgeResult judge(String problemId, String language, String code) {
        try {
            return map(judgeProxyService.submit(problemId, language, code));
        } catch (JudgeUnavailableException e) {
            throw e;
        } catch (Exception e) {
            log.error("Judge call failed for problem {}: {}", problemId, e.getMessage());
            return new JudgeResult(Verdict.RUNTIME_ERROR, 0L, null, null, null, null);
        }
    }

    private static JudgeResult map(Map<?, ?> body) {
        String status = String.valueOf(body.get("status"));
        Long execTime = body.get("time") != null ? ((Number) body.get("time")).longValue() : 0L;
        Verdict verdict = switch (status) {
            case "Accepted" -> Verdict.ACCEPTED;
            case "Wrong Answer" -> Verdict.WRONG_ANSWER;
            case "Time Limit Exceeded" -> Verdict.TIME_LIMIT;
            case "Compilation Error" -> Verdict.COMPILE_ERROR;
            default -> Verdict.RUNTIME_ERROR;
        };
        String in = null, expected = null, actual = null, err = null;
        if (body.get("results") instanceof List<?> results) {
            for (Object item : results) {
                if (item instanceof Map<?, ?> tc && Boolean.FALSE.equals(tc.get("passed"))) {
                    in = str(tc.get("input"));
                    expected = str(tc.get("expected"));
                    actual = str(tc.get("actual"));
                    err = str(tc.get("error"));
                    break;
                }
            }
        }
        return new JudgeResult(verdict, execTime, in, expected, actual, err);
    }

    private static String str(Object o) {
        return o != null ? String.valueOf(o) : null;
    }
}
