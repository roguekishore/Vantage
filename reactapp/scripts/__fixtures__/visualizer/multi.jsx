import { defineVisualizer, fieldError } from "@/components/visualizer";

function parseInput(raw) {
  if (!Array.isArray(raw.nums) || raw.nums.length < 2) throw fieldError("nums", "Enter at least 2 numbers.");
  return { nums: raw.nums.slice() };
}
function brute(input) {
  const a = input.nums.slice();
  const steps = [{ msg: "Start brute.", line: 1, arr: a.slice(), j: null }];
  for (let j = 0; j < a.length; j++) steps.push({ msg: `Scan ${j}.`, line: 2, arr: a.slice(), j });
  steps.push({ msg: "Done.", line: 3, arr: a.slice(), j: null });
  return steps;
}
function optimal(input) {
  const a = input.nums.slice();
  const steps = [{ msg: "Start optimal.", line: 1, arr: a.slice(), j: null }];
  steps.push({ msg: "Single sweep.", line: 2, arr: a.slice(), j: 0 });
  steps.push({ msg: "Done.", line: 3, arr: a.slice(), j: null });
  return steps;
}
const code = { lang: "cpp", lines: ["void f() {", "  scan();", "}"] };
const complexity = { time: { avg: "O(n)" }, space: "O(1)" };

export default defineVisualizer({
  meta: { title: "Two Modes", category: "Arrays", difficulty: "easy", summary: "Brute and optimal." },
  inputs: [{ key: "nums", kind: "numberList", label: "Array", default: [3, 1, 2], maxLen: 8 }],
  examples: [{ label: "Shuffled", values: { nums: [3, 1, 2] } }],
  parse: parseInput,
  defaultMode: "optimal",
  modes: {
    brute: { label: "Brute force", generate: brute, code, complexity },
    optimal: { label: "Optimal", generate: optimal, code, complexity },
  },
  legend: [{ tone: "compare", label: "comparing" }],
  view: {
    stage: "array",
    map: (s) => ({ cells: s.arr.map((v) => ({ value: v, tone: "idle" })), pointers: s.j != null ? [{ index: s.j, label: "j", role: 1 }] : [] }),
  },
});
