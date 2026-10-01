package com.backend.springapp.gamification.battle;

import com.backend.springapp.problem.Problem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/** Resolves battle judge problem ids against the (cached) judge catalog. Non-transactional. */
@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeProblemIdResolver {

    private final com.backend.springapp.judge.JudgeProxyService judgeProxyService;

    private static final long JUDGE_PROBLEM_CACHE_TTL_MS = 5 * 60 * 1000;
    private volatile List<BattleService.JudgeProblemSummary> judgeProblemCatalogCache = List.of();
    private volatile long judgeProblemCatalogCachedAtMs = 0L;

    public String resolveJudgeProblemId(String currentJudgeProblemId, Problem springProblem) {
        String candidate = normalizeId(currentJudgeProblemId);
        if (candidate.isBlank()) return currentJudgeProblemId;

        List<BattleService.JudgeProblemSummary> catalog = getJudgeProblemCatalog();
        if (catalog.isEmpty()) return candidate;

        if (catalogContainsId(catalog, candidate)) return candidate;

        String withoutRomanSuffix = candidate.replaceFirst("-(i|ii|iii|iv|v)$", "");
        if (!withoutRomanSuffix.isBlank() && catalogContainsId(catalog, withoutRomanSuffix)) {
            return withoutRomanSuffix;
        }

        String normalizedTitle = normalizeTitle(springProblem != null ? springProblem.getTitle() : null);
        if (!normalizedTitle.isBlank()) {
            for (BattleService.JudgeProblemSummary jp : catalog) {
                if (normalizedTitle.equals(normalizeTitle(jp.title()))) {
                    return jp.id();
                }
            }
        }

        return candidate;
    }

    private boolean catalogContainsId(List<BattleService.JudgeProblemSummary> catalog, String id) {
        for (BattleService.JudgeProblemSummary jp : catalog) {
            if (id.equalsIgnoreCase(jp.id())) return true;
        }
        return false;
    }

    private List<BattleService.JudgeProblemSummary> getJudgeProblemCatalog() {
        long now = System.currentTimeMillis();
        if (!judgeProblemCatalogCache.isEmpty() && (now - judgeProblemCatalogCachedAtMs) < JUDGE_PROBLEM_CACHE_TTL_MS) {
            return judgeProblemCatalogCache;
        }

        try {
            List<Map<String, Object>> rows = judgeProxyService.fetchProblems();
            if (rows == null || rows.isEmpty()) return judgeProblemCatalogCache;

            List<BattleService.JudgeProblemSummary> parsed = new ArrayList<>();
            for (Map<String, Object> m : rows) {
                Object idObj = m.get("id");
                if (idObj == null) continue;
                String id = String.valueOf(idObj).trim();
                if (id.isBlank()) continue;
                String title = m.get("title") != null ? String.valueOf(m.get("title")) : "";
                parsed.add(new BattleService.JudgeProblemSummary(id, title));
            }

            if (!parsed.isEmpty()) {
                judgeProblemCatalogCache = parsed;
                judgeProblemCatalogCachedAtMs = now;
            }
        } catch (Exception e) {
            log.debug("Could not refresh judge problem catalog: {}", e.getMessage());
        }

        return judgeProblemCatalogCache;
    }

    private String normalizeId(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeTitle(String value) {
        if (value == null) return "";
        return value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").replaceAll("\\s+", " ");
    }
}
