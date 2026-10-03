import { defineVisualizer } from "@/components/visualizer";

function parseInput(raw) {
  return { intervals: raw.intervals.map((iv) => [...iv]) };
}

function generateSteps(input) {
  const intervals = input.intervals.map((iv) => [...iv]);
  const steps = [];
  const merged = [];

  const addState = (props) =>
    steps.push({
      intervals: intervals.map((iv) => [...iv]),
      merged: merged.map((iv) => [...iv]),
      ...props,
    });

  addState({ line: 2, msg: `Sort intervals by start time: ${JSON.stringify(intervals)}.` });

  intervals.sort((a, b) => a[0] - b[0]);

  addState({ line: 2, sorted: true, msg: `After sorting: ${JSON.stringify(intervals)}.` });

  if (intervals.length === 0) {
    addState({ line: 13, finished: true, msg: "No intervals to merge." });
    return steps;
  }

  merged.push(intervals[0]);
  addState({ line: 4, currentIndex: 0, msg: `Initialize: add first interval [${intervals[0]}] to result.` });

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];

    addState({ line: 7, currentIndex: i, comparing: true, msg: `Compare current [${current}] with last merged [${lastMerged}].` });

    if (current[0] <= lastMerged[1]) {
      const before = [...lastMerged];
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
      addState({ line: 8, currentIndex: i, merging: true, msg: `Overlap detected! Merge [${current}] with [${before}] to get [${lastMerged}].` });
    } else {
      merged.push([...current]);
      addState({ line: 10, currentIndex: i, addingNew: true, msg: `No overlap. Add [${current}] as a new interval to the result.` });
    }
  }

  addState({ line: 13, finished: true, msg: `Complete! Merged intervals: ${JSON.stringify(merged)}.` });
  return steps;
}

export default defineVisualizer({
  meta: {
    title: "Merge Intervals",
    category: "Arrays",
    difficulty: "medium",
    summary: "Sort by start, then fold each interval into the last merged one while they overlap.",
    leetcode: 56,
  },
  inputs: [
    {
      key: "intervals",
      kind: "tuples",
      label: "Intervals (start end)",
      arity: 2,
      fields: ["start", "end"],
      default: [[1, 3], [2, 6], [8, 10], [15, 18]],
    },
  ],
  examples: [
    { label: "Classic", values: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] } },
    { label: "Touching ends", values: { intervals: [[1, 4], [4, 5]] } },
    { label: "Unsorted, nested", values: { intervals: [[8, 10], [1, 10], [2, 3], [12, 14]] } },
    { label: "No overlap", values: { intervals: [[1, 2], [4, 5], [7, 8]] } },
  ],
  parse: parseInput,
  generate: generateSteps,
  code: {
    lang: "cpp",
    lines: [
      "vector<vector<int>> merge(vector<vector<int>>& intervals) {",
      "  sort(intervals.begin(), intervals.end());",
      "  vector<vector<int>> merged;",
      "  merged.push_back(intervals[0]);",
      "  for (int i = 1; i < intervals.size(); i++) {",
      "    vector<int>& last = merged.back();",
      "    if (intervals[i][0] <= last[1]) {",
      "      last[1] = max(last[1], intervals[i][1]);",
      "    } else {",
      "      merged.push_back(intervals[i]);",
      "    }",
      "  }",
      "  return merged;",
      "}",
    ],
  },
  complexity: {
    time: { avg: "O(n log n)" },
    space: "O(n)",
    note: "Sorting dominates; the merge pass is O(n). Worst case (no overlaps) the result holds all n intervals.",
  },
  legend: [
    { tone: "active", label: "current interval" },
    { tone: "write", label: "merging" },
    { tone: "success", label: "added or final result" },
    { tone: "done", label: "merged so far" },
  ],
  view: {
    stage: "intervals",
    map: (s) => {
      const tone = s.merging ? "write" : s.addingNew ? "success" : "active";
      const input = s.intervals.map(([start, end], i) => ({
        start,
        end,
        label: s.sorted ? "sorted" : "input",
        tone: i === s.currentIndex ? tone : "idle",
      }));
      const out = s.merged.map(([start, end]) => ({ start, end, label: "merged", tone: s.finished ? "success" : "done" }));
      const all = [...s.intervals, ...s.merged].flat();
      return { intervals: [...input, ...out], min: Math.min(...all), max: Math.max(...all) };
    },
  },
  stats: (s) => [
    { label: "input", value: s.intervals.length },
    { label: "merged", value: s.merged.length, tone: "success" },
  ],
});
