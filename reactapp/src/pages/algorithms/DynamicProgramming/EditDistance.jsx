import { defineVisualizer, fieldError } from "@/components/visualizer";

const CODE = [
  "#include <bits/stdc++.h>",
  "using namespace std;",
  "",
  "int editDistance(string s1, string s2) {",
  "    int m = s1.length(), n = s2.length();",
  "    vector<vector<int>> dp(m+1, vector<int>(n+1));",
  "    for (int i = 0; i <= m; ++i) dp[i][0] = i;",
  "    for (int j = 0; j <= n; ++j) dp[0][j] = j;",
  "    for (int i = 1; i <= m; ++i) {",
  "        for (int j = 1; j <= n; ++j) {",
  "            if (s1[i-1] == s2[j-1]) {",
  "                dp[i][j] = dp[i-1][j-1];",
  "            } else {",
  "                dp[i][j] = 1 + min({dp[i-1][j],",
  "                    dp[i][j-1], dp[i-1][j-1]});",
  "            }",
  "        }",
  "    }",
  "    return dp[m][n];",
  "}",
];

function parse(raw) {
  const s1 = String(raw.s1).trim();
  const s2 = String(raw.s2).trim();
  if (!s1) throw fieldError("s1", "Enter a non-empty string.");
  if (!s2) throw fieldError("s2", "Enter a non-empty string.");
  return { s1, s2 };
}

function generate({ s1, s2 }) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const steps = [];
  const addState = (props) =>
    steps.push({
      dp: dp.map((row) => [...row]),
      i: null,
      j: null,
      line: null,
      decision: null,
      result: dp[m][n],
      ...props,
    });

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  addState({ msg: "Initialize: dp[i][0] = i (deletions), dp[0][j] = j (insertions)", line: 7, phase: "info" });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      addState({
        i,
        j,
        line: 11,
        decision: "consider",
        phase: "compare",
        msg: `Comparing s1[${i - 1}]='${s1[i - 1]}' with s2[${j - 1}]='${s2[j - 1]}'.`,
      });

      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        addState({
          i,
          j,
          line: 12,
          decision: "match",
          phase: "write",
          msg: `Characters match! No operation needed. dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}`,
        });
      } else {
        const replace = dp[i - 1][j - 1];
        const deleteOp = dp[i - 1][j];
        const insert = dp[i][j - 1];
        dp[i][j] = 1 + Math.min(replace, deleteOp, insert);

        let operation = "Replace";
        if (dp[i][j] === deleteOp + 1) operation = "Delete";
        else if (dp[i][j] === insert + 1) operation = "Insert";

        addState({
          i,
          j,
          line: 14,
          decision: "no-match",
          phase: "write",
          msg: `No match. ${operation}: dp[${i}][${j}] = 1 + min(${replace}, ${deleteOp}, ${insert}) = ${dp[i][j]}`,
        });
      }
    }
  }

  addState({
    i: m,
    j: n,
    line: 19,
    decision: "done",
    phase: "success",
    msg: `DP complete. Minimum edit distance = ${dp[m][n]}`,
  });
  return steps;
}

function mapStage(s, input) {
  const { s1 = "", s2 = "" } = input;
  const done = s.decision === "done";
  const cells = s.dp.map((row, r) =>
    row.map((value, c) => {
      let tone = "idle";
      if (r === 0 || c === 0 || (s.i != null && (r < s.i || (r === s.i && c < s.j)))) tone = "done";
      if (done && r === s.i && c === s.j) tone = "success";
      return { value, tone };
    }),
  );
  const working = s.i != null && !done;
  let deps;
  if (working && s.decision === "match") deps = [[s.i - 1, s.j - 1]];
  else if (working) deps = [[s.i - 1, s.j - 1], [s.i - 1, s.j], [s.i, s.j - 1]];
  return {
    cells,
    rowHeaders: ["", ...s1],
    colHeaders: ["", ...s2],
    active: working ? [s.i, s.j] : undefined,
    deps,
  };
}

export default defineVisualizer({
  meta: {
    title: "Edit Distance",
    category: "Dynamic Programming",
    difficulty: "medium",
    summary: "Fill a table where each cell is the fewest insert, delete or replace operations to turn one prefix into another.",
    leetcode: 72,
  },
  inputs: [
    { key: "s1", kind: "string", label: "String 1 (source)", default: "HORSE", transform: "upper", maxLen: 10 },
    { key: "s2", kind: "string", label: "String 2 (target)", default: "ROS", transform: "upper", maxLen: 10 },
  ],
  examples: [
    { label: "HORSE to ROS", values: { s1: "HORSE", s2: "ROS" } },
    { label: "Identical", values: { s1: "CODE", s2: "CODE" } },
    { label: "Empty to full", values: { s1: "A", s2: "ABCD" } },
    { label: "Intention", values: { s1: "INTENTION", s2: "EXECUTION" } },
  ],
  parse,
  modes: {
    iterative: {
      label: "Iterative DP",
      generate,
      code: { lang: "cpp", lines: CODE },
      complexity: { time: { avg: "O(M × N)" }, space: "O(M × N)", note: "M = length of string 1, N = length of string 2." },
    },
  },
  defaultMode: "iterative",
  legend: [
    { tone: "active", label: "cell being filled" },
    { tone: "done", label: "filled" },
    { tone: "success", label: "answer" },
  ],
  view: { stage: "matrix", map: mapStage },
  stats: (s) => [
    { label: "result", value: s.result, tone: "success" },
    { label: "decision", value: s.decision || "-" },
  ],
});
