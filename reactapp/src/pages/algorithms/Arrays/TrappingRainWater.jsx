import { defineVisualizer } from "@/components/visualizer";

/* ── model: pure, no React ── */
function generateBruteForce({ heights }) {
  const n = heights.length;
  const history = [];
  let totalWater = 0;
  const waterLevels = new Array(n).fill(0);

  const addState = (props) =>
    history.push({
      heights,
      totalWater,
      waterLevels: [...waterLevels],
      i: null,
      j: null,
      lmax: 0,
      rmax: 0,
      msg: "",
      ...props,
    });

  addState({ line: 4, msg: "Initialize total trapped water to 0." });
  for (let i = 1; i < n - 1; i++) {
    addState({ line: 5, i, msg: `Start main loop. Evaluating bar at index ${i}.` });
    let lmax = 0;
    addState({ line: 6, i, lmax, msg: `Find max height to the left of index ${i}.` });
    for (let j = i; j >= 0; j--) {
      lmax = Math.max(lmax, heights[j]);
      addState({ line: 7, i, j, lmax, msg: `Scanning left... Current lmax = ${lmax}.` });
    }

    let rmax = 0;
    addState({ line: 10, i, lmax, rmax, msg: `Find max height to the right of index ${i}.` });
    for (let j = i; j < n; j++) {
      rmax = Math.max(rmax, heights[j]);
      addState({ line: 11, i, j, lmax, rmax, msg: `Scanning right... Current rmax = ${rmax}.` });
    }

    const water = Math.min(lmax, rmax) - heights[i];
    if (water > 0) {
      totalWater += water;
      waterLevels[i] = water;
    }
    addState({
      line: 14,
      i,
      lmax,
      rmax,
      msg: `Water at index ${i} = min(${lmax}, ${rmax}) - height[${i}] = ${water > 0 ? water : 0}.`,
    });
    addState({ line: 15, i, lmax, rmax, msg: `Total trapped water is now ${totalWater}.` });
  }
  addState({ line: 18, finished: true, msg: "Finished calculation. Returning total trapped water." });
  return history;
}

function generateOptimal({ heights }) {
  const n = heights.length;
  const history = [];
  const lmax = new Array(n).fill(0);
  const rmax = new Array(n).fill(0);
  let totalWater = 0;
  const waterLevels = new Array(n).fill(0);

  const addState = (props) =>
    history.push({
      heights,
      totalWater,
      waterLevels: [...waterLevels],
      lmax: [...lmax],
      rmax: [...rmax],
      i: null,
      msg: "",
      ...props,
    });

  addState({ line: 4, msg: "Initialize left-max and right-max arrays." });

  lmax[0] = heights[0];
  addState({ line: 7, i: 0, msg: `lmax[0] is set to height[0] = ${lmax[0]}.` });
  for (let i = 1; i < n; i++) {
    lmax[i] = Math.max(lmax[i - 1], heights[i]);
    addState({
      line: 10,
      i,
      msg: `lmax[${i}] = max(lmax[${i - 1}], height[${i}]) = max(${lmax[i - 1]}, ${heights[i]}) = ${lmax[i]}.`,
    });
  }

  rmax[n - 1] = heights[n - 1];
  addState({ line: 13, i: n - 1, msg: `rmax[n-1] is set to height[n-1] = ${rmax[n - 1]}.` });
  for (let i = n - 2; i >= 0; i--) {
    rmax[i] = Math.max(rmax[i + 1], heights[i]);
    addState({
      line: 16,
      i,
      msg: `rmax[${i}] = max(rmax[${i + 1}], height[${i}]) = max(${rmax[i + 1]}, ${heights[i]}) = ${rmax[i]}.`,
    });
  }

  addState({ line: 19, msg: "All prefix and suffix maxes calculated. Now, find the water." });
  for (let i = 0; i < n; i++) {
    const water = Math.min(lmax[i], rmax[i]) - heights[i];
    if (water > 0) {
      totalWater += water;
      waterLevels[i] = water;
    }
    addState({
      line: 20,
      i,
      msg: `Water at index ${i} = min(lmax[${i}], rmax[${i}]) - height[${i}] = min(${lmax[i]}, ${rmax[i]}) - ${heights[i]} = ${water > 0 ? water : 0}. Total = ${totalWater}`,
    });
  }

  addState({ line: 23, finished: true, msg: "Finished calculation. Returning total trapped water." });
  return history;
}

const BRUTE_CODE = [
  "int trap(vector<int>& height) {",
  "  int n = height.size();",
  "  // for every bar, water = min(tallest left, tallest right) - its height",
  "  int totalWater = 0;",
  "  for (int i = 1; i < n - 1; i++) {",
  "    int lmax = 0;",
  "    for (int j = i; j >= 0; j--) lmax = max(lmax, height[j]);",
  "    // lmax is the tallest bar at or left of i",
  "",
  "    int rmax = 0;",
  "    for (int j = i; j < n; j++) rmax = max(rmax, height[j]);",
  "    // rmax is the tallest bar at or right of i",
  "",
  "    int water = min(lmax, rmax) - height[i];",
  "    if (water > 0) totalWater += water;",
  "",
  "  }",
  "  return totalWater;",
  "}",
];

const OPTIMAL_CODE = [
  "int trap(vector<int>& height) {",
  "  // precompute prefix and suffix maxima",
  "  int n = height.size();",
  "  vector<int> lmax(n, 0), rmax(n, 0);",
  "",
  "  // prefix maxima from the left",
  "  lmax[0] = height[0];",
  "",
  "  for (int i = 1; i < n; i++) {",
  "    lmax[i] = max(lmax[i-1], height[i]);",
  "  }",
  "  // suffix maxima from the right",
  "  rmax[n-1] = height[n-1];",
  "",
  "  for (int i = n-2; i >= 0; i--) {",
  "    rmax[i] = max(rmax[i+1], height[i]);",
  "  }",
  "  // water above each bar",
  "  int ans = 0;",
  "  for (int i = 0; i < n; i++) ans += min(lmax[i], rmax[i]) - height[i];",
  "",
  "",
  "  return ans;",
  "}",
];

export default defineVisualizer({
  meta: {
    title: "Trapping Rain Water",
    category: "Arrays",
    difficulty: "hard",
    summary: "Water above each bar is limited by the shorter of the tallest walls on its left and right.",
    leetcode: 42,
  },
  inputs: [
    { key: "heights", kind: "numberList", label: "Heights", default: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1], min: 0, minLen: 2, maxLen: 16 },
  ],
  examples: [
    { label: "Classic", values: { heights: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] } },
    { label: "Valley", values: { heights: [4, 2, 0, 3, 2, 5] } },
    { label: "Staircase (no water)", values: { heights: [1, 2, 3, 4, 5] } },
    { label: "Two walls", values: { heights: [3, 0, 3] } },
  ],
  parse: ({ heights }) => ({ heights: heights.slice() }),
  modes: {
    "brute-force": {
      label: "Brute force",
      generate: generateBruteForce,
      code: { lang: "cpp", lines: BRUTE_CODE },
      complexity: {
        time: { avg: "O(n^2)" },
        space: "O(1)",
        note: "For each element we scan left and right for the tallest wall, giving nested loops. Only lmax, rmax and totalWater are stored.",
      },
    },
    optimal: {
      label: "Optimal",
      generate: generateOptimal,
      code: { lang: "cpp", lines: OPTIMAL_CODE },
      complexity: {
        time: { avg: "O(n)" },
        space: "O(n)",
        note: "Three linear passes: prefix maxima, suffix maxima, then the water. Two extra arrays of size n.",
      },
    },
  },
  defaultMode: "brute-force",
  legend: [
    { tone: "active", label: "i, bar being evaluated" },
    { tone: "compare", label: "j, scanning (brute force)" },
    { tone: "success", label: "bar holding water (final)" },
  ],
  view: {
    stage: "bars",
    map: (s, _input, mode) => ({
      bars: s.heights.map((h, k) => ({
        value: h,
        fill: s.waterLevels[k],
        tone:
          s.i === k ? "active"
          : mode === "brute-force" && s.j === k ? "compare"
          : s.finished && s.waterLevels[k] > 0 ? "success"
          : "idle",
      })),
      max: Math.max(...s.heights, 1),
      pointers: [
        ...(s.i != null ? [{ index: s.i, label: "i", role: 1 }] : []),
        ...(mode === "brute-force" && s.j != null ? [{ index: s.j, label: "j", role: 2 }] : []),
      ],
    }),
  },
  // brute-force steps carry scalar lmax/rmax, optimal steps carry the arrays
  stats: (s) => [
    { label: "water", value: s.totalWater, tone: "success" },
    ...(!Array.isArray(s.lmax)
      ? [{ label: "lmax", value: s.lmax }, { label: "rmax", value: s.rmax }]
      : s.i != null
        ? [{ label: "lmax[i]", value: s.lmax[s.i] }, { label: "rmax[i]", value: s.rmax[s.i] }]
        : []),
  ],
});
