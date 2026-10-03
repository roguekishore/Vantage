import { defineVisualizer } from "@/components/visualizer";

/* ── model: pure, no React ── */
function generate(input) {
  const arr = input.nums.map((value, id) => ({ value, id }));
  const n = arr.length;
  const hist = [];
  let comparisons = 0;
  let swaps = 0;

  const snap = (extra) => hist.push({ array: arr.map((o) => ({ ...o })), comparisons, swaps, ...extra });

  snap({ line: 1, msg: "Initialize Bubble Sort.", phase: "info" });

  for (let i = 0; i < n - 1; i++) {
    let swappedInPass = false;
    snap({ line: 2, i, explanation: `Start Pass ${i + 1}.`, msg: `Pass ${i + 1}`, phase: "info" });

    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      snap({ line: 4, i, j, msg: `Compare arr[${j}] (${arr[j].value}) vs arr[${j + 1}] (${arr[j + 1].value})`, phase: "compare" });

      if (arr[j].value > arr[j + 1].value) {
        swappedInPass = true;
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps++;
        snap({ line: 5, i, j, msg: `Swapped ${arr[j].value} and ${arr[j + 1].value}`, phase: "write" });
      }
    }

    if (!swappedInPass) {
      snap({ line: 8, i, msg: `No swaps in pass ${i + 1}, array sorted early.`, phase: "success" });
      break;
    }
  }

  snap({
    line: 9,
    sortedIndices: Array.from({ length: n }, (_, k) => k),
    finished: true,
    msg: `Complete. ${comparisons} comparisons, ${swaps} swaps.`,
    phase: "success",
  });
  return hist;
}

/* ── config ── */
export default defineVisualizer({
  meta: {
    title: "Bubble Sort",
    category: "Sorting",
    difficulty: "easy",
    summary: "Swap adjacent out-of-order pairs, pass after pass, until nothing moves.",
    leetcode: 912,
  },
  inputs: [{ key: "nums", kind: "numberList", label: "Array", default: [8, 5, 2, 9, 5, 6, 3], minLen: 1, maxLen: 16 }],
  examples: [
    { label: "Default", values: { nums: [8, 5, 2, 9, 5, 6, 3] } },
    { label: "Already sorted", values: { nums: [1, 2, 3, 4, 5] } },
    { label: "Reversed", values: { nums: [6, 5, 4, 3, 2, 1] } },
    { label: "Duplicates", values: { nums: [3, 1, 3, 1, 2] } },
  ],
  parse: ({ nums }) => ({ nums: nums.slice() }),
  generate,
  code: {
    lang: "cpp",
    lines: [
      "void bubbleSort(vector<int>& arr) {",
      "  for (int i = 0; i < n - 1; i++) {",
      "    for (int j = 0; j < n - i - 1; j++) {",
      "      if (arr[j] > arr[j + 1]) {",
      "        swap(arr[j], arr[j + 1]);",
      "      }",
      "    }",
      "  }",
      "}",
    ],
  },
  complexity: {
    time: { best: "O(n)", avg: "O(n^2)", worst: "O(n^2)" },
    space: "O(1)",
    note: "Nested loops compare adjacent elements. Best case O(n) with early termination when a pass makes no swaps. Sorts in place.",
  },
  legend: [
    { tone: "compare", label: "comparing" },
    { tone: "write", label: "swapping" },
    { tone: "success", label: "sorted" },
  ],
  view: {
    stage: "array",
    map: (s) => {
      return {
        cells: s.array.map((item, k) => ({
          value: item.value,
          tone: s.finished ? "success" : s.j != null && (k === s.j || k === s.j + 1) ? (s.phase === "write" ? "write" : "compare") : "idle",
        })),
        pointers: s.j != null && !s.finished ? [{ index: s.j, label: "j", role: 1 }, { index: s.j + 1, label: "j+1", role: 2 }] : [],
      };
    },
  },
  stats: (s) => [
    { label: "Comparisons", value: s.comparisons ?? 0 },
    { label: "Swaps", value: s.swaps ?? 0 },
  ],
});
