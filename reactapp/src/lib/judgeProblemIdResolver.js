import { ALL_PROBLEMS } from "../data/dsa-conquest-map";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const stripRomanSuffix = (slug) =>
  normalize(slug).replace(/-(i|ii|iii|iv|v)$/, "");

const byJudgeId = new Map();
const byLcSlug = new Map();
const byTitle = new Map();

ALL_PROBLEMS.forEach((p) => {
  const judgeId = normalize(p?.judgeId);
  const lcSlug = normalize(p?.lcSlug);
  const title = normalize(p?.title);

  if (judgeId && !byJudgeId.has(judgeId)) byJudgeId.set(judgeId, p);
  if (lcSlug && !byLcSlug.has(lcSlug)) byLcSlug.set(lcSlug, p);
  if (title && !byTitle.has(title)) byTitle.set(title, p);
});

/**
 * Resolves a backend/sync problem reference to a judge problem id.
 * Handles lcslug ↔ judgeId mismatch (e.g. "next-greater-element-i" → "next-greater-element").
 */
export function resolveJudgeProblemId({ judgeProblemId, lcslug, lcSlug, title, fallbackId } = {}) {
  const candidates = [judgeProblemId, lcslug, lcSlug]
    .map(normalize)
    .filter(Boolean);

  for (const candidate of candidates) {
    if (byJudgeId.has(candidate)) return byJudgeId.get(candidate).judgeId;
    if (byLcSlug.has(candidate)) return byLcSlug.get(candidate).judgeId;

    const noRoman = stripRomanSuffix(candidate);
    if (noRoman && byLcSlug.has(noRoman)) return byLcSlug.get(noRoman).judgeId;
    if (noRoman && byJudgeId.has(noRoman)) return byJudgeId.get(noRoman).judgeId;
  }

  const normalizedTitle = normalize(title);
  if (normalizedTitle && byTitle.has(normalizedTitle)) {
    return byTitle.get(normalizedTitle).judgeId;
  }

  return candidates[0] || fallbackId || null;
}
