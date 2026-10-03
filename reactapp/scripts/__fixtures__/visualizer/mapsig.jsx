import { defineVisualizer, fieldError } from "@/components/visualizer";

function parseInput(raw) {
  if (!Array.isArray(raw.nums) || raw.nums.length < 2) throw fieldError("nums", "Enter at least 2 numbers.");
  return { nums: raw.nums.slice() };
}

function generateSteps(input) {
  const a = input.nums.slice();
  const steps = [{ msg: `Start with [${a.join(", ")}].`, line: 1, arr: a.slice(), j: null }];
  for (let j = 0; j < a.length - 1; j++) {
    steps.push({ msg: `Compare ${a[j]} and ${a[j + 1]}.`, line: 2, arr: a.slice(), j });
    if (a[j] > a[j + 1]) {
      [a[j], a[j + 1]] = [a[j + 1], a[j]];
      steps.push({ msg: `Swap at ${j}.`, line: 3, arr: a.slice(), j });
    }
  }
  steps.push({ msg: "Done.", line: 4, arr: a.slice(), j: null });
  return steps;
}

export default defineVisualizer({
  meta: { title: "One Pass", category: "Sorting", difficulty: "easy", summary: "One bubble pass." },
  inputs: [{ key: "nums", kind: "numberList", label: "Array", default: [3, 1, 2], maxLen: 8 }],
  examples: [{ label: "Shuffled", values: { nums: [3, 1, 2] } }, { label: "Sorted", values: { nums: [1, 2, 3] } }],
  parse: parseInput,
  generate: generateSteps,
  code: { lang: "cpp", lines: ["void pass(vector<int>& a) {", "  for (j...) if (a[j] > a[j+1])", "    swap(a[j], a[j+1]);", "}"] },
  complexity: { time: { avg: "O(n)" }, space: "O(1)" },
  legend: [{ tone: "compare", label: "comparing" }],
  view: {
    stage: "array",
    map: (s, input, mode) => ({
      cells: (mode === "default" && input.nums.length >= 2 ? s.arr : null).map((v, k) => ({ value: v, tone: s.j != null && (k === s.j || k === s.j + 1) ? "compare" : "idle" })),
      pointers: s.j != null ? [{ index: s.j, label: "j", role: 1 }] : [],
    }),
  },
});
