import { defineVisualizer } from "../defineVisualizer";
import { fieldError } from "../fieldError";

/*
 * Tiny self-contained config proving the defineVisualizer API end to end
 * (two modes, parse + validate, stats, legend, embed). Used by the v2 tests;
 * NOT a routed page.
 */
const CODE = [
  "void bubbleSort(vector<int>& a) {",
  "  int n = a.size();",
  "  for (int i = 0; i < n - 1; i++) {",
  "    bool swapped = false;",
  "    for (int j = 0; j < n - 1 - i; j++) {",
  "      if (a[j] > a[j + 1]) {",
  "        swap(a[j], a[j + 1]);",
  "        swapped = true;",
  "      }",
  "    }",
  "    if (!swapped) break;",
  "  }",
  "}",
];

export function parseInput(raw) {
  if (!Array.isArray(raw.nums) || raw.nums.length < 2) throw fieldError("nums", "Enter at least 2 numbers.");
  return { nums: raw.nums.slice() };
}

export function generateSteps(input, earlyExit) {
  const a = input.nums.slice();
  const n = a.length;
  const steps = [];
  const snap = (extra) => ({ arr: a.slice(), ...extra });
  steps.push(snap({ msg: `Start with [${a.join(", ")}].`, line: 1, phase: "info", sorted: n }));
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push(snap({ msg: `Compare ${a[j]} and ${a[j + 1]}.`, line: 6, phase: "compare", i, j, sorted: n - i, vars: { i, j, swapped } }));
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        steps.push(snap({ msg: `Swap: ${a[j + 1]} is larger, so it moves right.`, line: 7, phase: "write", i, j, wrote: true, sorted: n - i, vars: { i, j, swapped } }));
      }
    }
    if (earlyExit && !swapped) {
      steps.push(snap({ msg: "No swaps in this pass, so the array is sorted.", line: 11, phase: "success", sorted: 0, vars: { i, swapped } }));
      return steps;
    }
  }
  steps.push(snap({ msg: `Sorted: [${a.join(", ")}].`, line: 13, phase: "success", sorted: 0 }));
  return steps;
}

export default defineVisualizer({
  meta: { title: "Bubble Sort", category: "Sorting", difficulty: "easy", summary: "Swap adjacent out-of-order pairs until nothing moves.", leetcode: 912 },
  inputs: [
    {
      key: "nums",
      kind: "numberList",
      label: "Array",
      default: [5, 2, 4, 1, 3],
      maxLen: 12,
      random: () => Array.from({ length: 6 }, (_, k) => ((k * 7 + 3) % 9) + 1),
    },
  ],
  examples: [
    { label: "Shuffled", values: { nums: [5, 2, 4, 1, 3] } },
    { label: "Sorted", values: { nums: [1, 2, 3, 4] } },
  ],
  parse: parseInput,
  modes: {
    plain: { label: "Plain", generate: (i) => generateSteps(i, false), code: { lang: "cpp", lines: CODE }, complexity: { time: { best: "O(n^2)", avg: "O(n^2)", worst: "O(n^2)" }, space: "O(1)" } },
    early: { label: "Early exit", generate: (i) => generateSteps(i, true), code: { lang: "cpp", lines: CODE }, complexity: { time: { best: "O(n)", avg: "O(n^2)", worst: "O(n^2)" }, space: "O(1)", note: "Stops when a pass makes no swap." } },
  },
  defaultMode: "plain",
  legend: [
    { tone: "compare", label: "comparing" },
    { tone: "write", label: "swapped" },
    { tone: "done", label: "in place" },
  ],
  view: {
    stage: "array",
    map: (s) => ({
      cells: s.arr.map((v, k) => ({
        value: v,
        tone: s.j != null && (k === s.j || k === s.j + 1) ? (s.wrote ? "write" : "compare") : s.sorted != null && k >= s.sorted ? "done" : "idle",
      })),
      pointers: s.j != null ? [{ index: s.j, label: "j", role: 1 }, { index: s.j + 1, label: "j+1", role: 2 }] : [],
    }),
  },
  stats: (s, index, total) => [{ label: "step", value: `${index + 1}/${total}` }],
  embed: { fromExternalArray: (arr) => ({ nums: arr.slice(0, 12) }) },
});
