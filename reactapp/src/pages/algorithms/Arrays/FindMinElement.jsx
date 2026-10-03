import { defineVisualizer, fieldError } from "@/components/visualizer";

/* ── model: pure, no React ── */
function parseInput(raw) {
  if (!Array.isArray(raw.nums) || raw.nums.length === 0) throw fieldError("nums", "Enter at least one number.");
  return { nums: raw.nums.slice() };
}

function generate(input) {
  const a = input.nums;
  const n = a.length;
  const hist = [];
  let best = 0;
  let comparisons = 0;

  const snap = (extra) => hist.push({ array: a.slice(), best, comparisons, ...extra });

  snap({ line: 2, msg: `Start with min_index = 0 (value ${a[0]}).` });

  for (let i = 1; i < n; i++) {
    comparisons++;
    snap({ line: 4, i, msg: `Compare arr[${i}] (${a[i]}) with the current minimum arr[${best}] (${a[best]}).` });
    if (a[i] < a[best]) {
      best = i;
      snap({ line: 5, i, updated: true, msg: `${a[i]} is smaller, so min_index = ${i}.` });
    }
  }

  snap({ line: 8, finished: true, msg: `Minimum: ${a[best]} at index ${best}.` });
  return hist;
}

/* ── config ── */
export default defineVisualizer({
  meta: {
    title: "Find Min Element",
    category: "Arrays",
    difficulty: "easy",
    summary: "Scan once, keeping the index of the minimum value seen so far.",
  },
  inputs: [{ key: "nums", kind: "numberList", label: "Array", default: [3, 1, 4, 1, 5, 9, 2, 6], maxLen: 12 }],
  examples: [
    { label: "Default", values: { nums: [3, 1, 4, 1, 5, 9, 2, 6] } },
    { label: "Single element", values: { nums: [7] } },
    { label: "Duplicates", values: { nums: [4, 9, 2, 9, 1, 9] } },
    { label: "Negatives", values: { nums: [-3, -8, -1, -5] } },
  ],
  parse: parseInput,
  generate,
  code: {
    lang: "cpp",
    lines: [
      "int findMin(vector<int>& arr) {",
      "  int min_index = 0;",
      "  for (int i = 1; i < arr.size(); i++) {",
      "    if (arr[i] < arr[min_index]) {",
      "      min_index = i;",
      "    }",
      "  }",
      "  return arr[min_index];",
      "}",
    ],
  },
  complexity: {
    time: { best: "O(n)", avg: "O(n)", worst: "O(n)" },
    space: "O(1)",
    note: "One pass, comparing each element with the running minimum. Only the index and loop variable are stored.",
  },
  legend: [
    { tone: "compare", label: "checking" },
    { tone: "write", label: "new minimum" },
    { tone: "active", label: "minimum so far" },
    { tone: "success", label: "answer" },
  ],
  view: {
    stage: "array",
    map: (s) => ({
      cells: s.array.map((value, k) => ({
        value,
        sub: k === s.best ? "MIN" : "",
        tone: s.finished
          ? k === s.best ? "success" : "idle"
          : k === s.i ? (s.updated ? "write" : "compare") : k === s.best ? "active" : "idle",
      })),
      pointers: s.i != null && !s.finished ? [{ index: s.i, label: "i", role: 1 }] : [],
    }),
  },
  stats: (s) => [
    { label: "Comparisons", value: s.comparisons },
    { label: "Minimum", value: s.array[s.best], tone: s.finished ? "success" : undefined },
    { label: "Index", value: s.best },
  ],
  embed: { fromExternalArray: (arr) => (arr && arr.length ? { nums: arr.slice(0, 12) } : {}) },
});
