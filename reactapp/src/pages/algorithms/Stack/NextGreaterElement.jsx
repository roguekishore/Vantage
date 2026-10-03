import { defineVisualizer, fieldError } from "@/components/visualizer";

const BRUTE_CODE = [
  "vector<int> nextGreater(vector<int>& nums) {",
  "  vector<int> res(n, -1);",
  "  for (int i=0; i<n; ++i) {",
  "    for (int j=i+1; j<n; ++j) {",
  "      if (nums[j] > nums[i]) {",
  "        res[i] = nums[j];",
  "        break;",
  "      }",
  "    }",
  "  }",
  "  return res;",
  "}",
];

const OPTIMAL_CODE = [
  "vector<int> nextGreater(vector<int>& nums) {",
  "  int n = nums.size();",
  "  vector<int> res(n, -1);",
  "  stack<int> s;",
  "  for (int i=n-1; i>=0; --i) {",
  "    while (!s.empty() && nums[s.top()] <= nums[i]) {",
  "      s.pop();",
  "    }",
  "    if (!s.empty()) {",
  "      res[i] = nums[s.top()];",
  "    }",
  "    else {",
  "      res[i] = -1;",
  "    }",
  "    s.push(i);",
  "  }",
  "  return res;",
  "}",
];

function parseInput(raw) {
  if (!Array.isArray(raw.nums) || raw.nums.length === 0) throw fieldError("nums", "Enter at least one number.");
  return { nums: raw.nums.slice() };
}

function generateBruteForce({ nums }) {
  const n = nums.length;
  const steps = [];
  const results = new Array(n).fill(-1);
  const addState = (props) =>
    steps.push({ nums, results: [...results], i: null, j: null, msg: "", ...props });

  addState({ line: 2, msg: "Initialize results array with -1." });
  for (let i = 0; i < n; i++) {
    addState({ line: 3, i, msg: `Finding Next Greater Element (NGE) for nums[${i}] = ${nums[i]}.` });
    for (let j = i + 1; j < n; j++) {
      addState({ line: 4, i, j, msg: `Comparing nums[${i}] (${nums[i]}) with nums[${j}] (${nums[j]}).` });
      if (nums[j] > nums[i]) {
        results[i] = nums[j];
        addState({ line: 6, i, j, msg: `Found NGE for ${nums[i]}: ${nums[j]}. Breaking inner loop.` });
        break;
      }
    }
    if (results[i] === -1) {
      addState({ line: 8, i, msg: `No NGE found for ${nums[i]} after scanning. Result remains -1.` });
    }
  }
  addState({ line: 11, finished: true, msg: "Algorithm finished. All NGEs have been computed." });
  return steps;
}

function generateOptimal({ nums }) {
  const n = nums.length;
  const steps = [];
  const results = new Array(n).fill(-1);
  const stack = []; // indices
  const addState = (props) =>
    steps.push({ nums, results: [...results], stack: [...stack], i: null, top: null, msg: "", ...props });

  addState({ line: 3, msg: "Initialize results array and an empty stack." });
  for (let i = n - 1; i >= 0; i--) {
    addState({ line: 5, i, msg: `Processing element nums[${i}] = ${nums[i]}.` });
    while (stack.length > 0 && nums[stack[stack.length - 1]] <= nums[i]) {
      const topIndex = stack[stack.length - 1];
      addState({
        line: 7,
        i,
        msg: `Stack top nums[${topIndex}] (${nums[topIndex]}) <= current nums[${i}] (${nums[i]}). Popping.`,
      });
      stack.pop();
    }
    if (stack.length > 0) {
      const topIndex = stack[stack.length - 1];
      results[i] = nums[topIndex];
      addState({
        line: 10,
        i,
        msg: `Stack is not empty. NGE for ${nums[i]} is stack top nums[${topIndex}] = ${nums[topIndex]}.`,
      });
    } else {
      addState({ line: 13, i, msg: `Stack is empty. No NGE found for ${nums[i]}. Result is -1.` });
    }
    stack.push(i);
    addState({ line: 15, i, msg: `Pushing index ${i} onto the stack.` });
  }
  addState({ line: 17, finished: true, msg: "Algorithm finished. All NGEs have been computed." });
  return steps;
}

const resultCells = (s) =>
  s.results.map((value, k) => ({
    value,
    tone: s.finished ? "success" : k === s.i ? "active" : "idle",
  }));

const SAMPLE = [4, 5, 2, 10, 8];

export default defineVisualizer({
  meta: {
    title: "Next Greater Element",
    category: "Stack",
    difficulty: "medium",
    summary: "Find the next larger value to the right of every element, by rescanning or with a monotonic stack.",
    leetcode: 496,
  },
  inputs: [{ key: "nums", kind: "numberList", label: "Array", default: SAMPLE, minLen: 1, maxLen: 16 }],
  examples: [
    { label: "Classic", values: { nums: SAMPLE } },
    { label: "Descending", values: { nums: [9, 7, 5, 3, 1] } },
    { label: "Ascending", values: { nums: [1, 3, 5, 7, 9] } },
    { label: "Duplicates", values: { nums: [2, 2, 3, 1, 3] } },
  ],
  parse: parseInput,
  modes: {
    "brute-force": {
      label: "Brute force",
      generate: generateBruteForce,
      code: { lang: "cpp", lines: BRUTE_CODE },
      complexity: { time: { avg: "O(n^2)" }, space: "O(1)", note: "Extra space beyond the result array." },
    },
    optimal: {
      label: "Optimal (stack)",
      generate: generateOptimal,
      code: { lang: "cpp", lines: OPTIMAL_CODE },
      complexity: { time: { avg: "O(n)" }, space: "O(n)", note: "Each index is pushed and popped at most once." },
    },
  },
  defaultMode: "brute-force",
  legend: [
    { tone: "active", label: "current i" },
    { tone: "compare", label: "compared j / popped top" },
    { tone: "success", label: "final result" },
  ],
  view: {
    stage: "array",
    map: (s) => ({
      cells: s.nums.map((value, k) => ({
        value,
        tone: k === s.i ? "active" : k === s.j ? "compare" : "idle",
      })),
      pointers: [
        ...(s.i != null ? [{ index: s.i, label: "i", role: 1 }] : []),
        ...(s.j != null ? [{ index: s.j, label: "j", role: 2 }] : []),
      ],
      rows: [{ label: "Result (NGE)", cells: resultCells(s) }],
    }),
    aux: [
      {
        kind: "stack",
        title: "Stack (indices)",
        map: (s) => ({
          items: (s.stack || [])
            .map((idx, pos, all) => ({
              value: idx,
              sub: `(${s.nums[idx]})`,
              tone: pos === all.length - 1 && s.line === 7 ? "compare" : "idle",
            }))
            .reverse(),
        }),
      },
    ],
  },
  stats: (s) => [
    ...(s.i != null ? [{ label: "i", value: s.i }] : []),
    ...(s.j != null ? [{ label: "j", value: s.j }] : []),
    ...(s.stack ? [{ label: "stack size", value: s.stack.length }] : []),
  ],
});
