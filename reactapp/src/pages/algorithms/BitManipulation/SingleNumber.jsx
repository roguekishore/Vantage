import { defineVisualizer, fieldError } from "@/components/visualizer";

const CODE = [
  "int singleNumber(vector<int>& nums) {",
  "    int result = 0;",
  "    for (int x : nums) {",
  "        result ^= x;",
  "    }",
  "    return result;",
  "}",
];

function parseInput(raw) {
  const nums = raw.nums;
  if (!nums.every(Number.isInteger)) throw fieldError("nums", "Use whole numbers only.");
  const freq = new Map();
  nums.forEach((n) => freq.set(n, (freq.get(n) || 0) + 1));
  const singles = [...freq.values()].filter((c) => c === 1).length;
  if (singles !== 1) throw fieldError("nums", "Exactly one number must appear once (the others twice).");
  return { nums: nums.slice(), bits: Number(raw.bits) };
}

function generateSteps({ nums: arr, bits }) {
  const steps = [];
  const n = arr.length;
  let accumulator = 0;
  const snap = (extra) => ({ bits, count: n, step: steps.length, ...extra });

  steps.push(snap({
    index: null, before: accumulator, current: null, after: accumulator,
    msg: "Starting XOR algorithm. Initialize the accumulator to 0.",
    line: 2, status: "initial",
  }));

  for (let i = 0; i < n; i++) {
    const currentNum = arr[i];
    steps.push(snap({
      index: i, before: accumulator, current: currentNum, after: null,
      msg: `Checking element at index ${i}. Accumulator: ${accumulator}, current: ${currentNum}. Ready to XOR.`,
      line: 3, status: "before",
    }));

    const result = accumulator ^ currentNum;
    steps.push(snap({
      index: i, before: accumulator, current: currentNum, after: result,
      msg: `XOR operation: ${accumulator} ^ ${currentNum} = ${result}.`,
      line: 4, status: "operation",
    }));
    accumulator = result;

    if (i < n - 1) {
      steps.push(snap({
        index: i, before: accumulator, current: null, after: accumulator,
        msg: `Intermediate result: ${accumulator}. Moving to the next element.`,
        line: 3, status: "intermediate",
      }));
    }
  }

  steps.push(snap({
    index: n - 1, before: accumulator, current: null, after: accumulator,
    msg: `Algorithm complete. The single number is ${accumulator}. All pairs cancelled out through XOR.`,
    line: 6, status: "final",
  }));
  return steps;
}

const bitAt = (v, i) => (BigInt(v) >> BigInt(i)) & 1n;

function randomNums() {
  const pairs = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => 1 + Math.floor(Math.random() * 50));
  const used = new Set(pairs);
  let single;
  do single = 1 + Math.floor(Math.random() * 50); while (used.has(single));
  const arr = [...pairs.flatMap((p) => [p, p]), single];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default defineVisualizer({
  meta: {
    title: "Single Number",
    category: "Bit Manipulation",
    difficulty: "easy",
    summary: "XOR every element together: equal pairs cancel to 0 and only the single number survives.",
    leetcode: 136,
  },
  inputs: [
    { key: "nums", kind: "numberList", label: "Array", default: [2, 2, 1, 3, 3, 4, 4], minLen: 1, maxLen: 15, random: randomNums },
    {
      key: "bits",
      kind: "select",
      label: "Bit width",
      default: "8",
      options: [
        { value: "8", label: "8-bit" },
        { value: "16", label: "16-bit" },
        { value: "32", label: "32-bit" },
        { value: "64", label: "64-bit" },
      ],
    },
  ],
  examples: [
    { label: "Classic", values: { nums: [2, 2, 1, 3, 3, 4, 4], bits: "8" } },
    { label: "Interleaved", values: { nums: [4, 1, 2, 1, 2], bits: "8" } },
    { label: "Negatives", values: { nums: [-3, 5, -3, 7, 5], bits: "8" } },
    { label: "Only one", values: { nums: [9], bits: "8" } },
  ],
  parse: parseInput,
  modes: {
    xor: {
      label: "XOR",
      generate: generateSteps,
      code: { lang: "cpp", lines: CODE },
      complexity: { time: { avg: "O(n)" }, space: "O(1)", note: "One pass; a single accumulator." },
    },
  },
  defaultMode: "xor",
  legend: [
    { tone: "active", label: "current element bits set" },
    { tone: "write", label: "bits flipped by XOR" },
    { tone: "success", label: "single number" },
  ],
  view: {
    stage: "bits",
    map: (s) => {
      const shown = s.after ?? s.before;
      const done = s.status === "final";
      return {
        rows: [
          { label: "Accumulator", value: s.before, bits: s.bits },
          {
            label: "Current element",
            value: s.current,
            bits: s.bits,
            bitTone: (i) => (s.current != null && bitAt(s.current, i) === 1n ? "active" : "idle"),
          },
          {
            label: done ? "Single number" : "After XOR",
            value: shown,
            bits: s.bits,
            bitTone: (i) => {
              if (done) return bitAt(shown, i) === 1n ? "success" : "idle";
              return s.after != null && s.status === "operation" && bitAt(s.before, i) !== bitAt(s.after, i) ? "write" : "idle";
            },
          },
        ],
      };
    },
  },
  stats: (s) => [
    { label: "index", value: s.index ?? "-" },
    { label: "accumulator", value: s.after ?? s.before },
    { label: "processed", value: `${s.index !== null ? s.index + 1 : 0}/${s.count}` },
  ],
});
