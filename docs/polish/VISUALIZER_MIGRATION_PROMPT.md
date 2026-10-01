# Visualizer Rebuild — `defineVisualizer` Contract + Per-File Job Spec

Part of `POLISH_PLAN.md` (§2 decision, §5 shell spec, Phases 2/3/5). One job = one manifest entry in `visualizer-manifest.json`.

**Execution note (2026-10-02):** every job now runs on an Opus subagent (see `HANDOFF.md`). Read "cheap model" and "strong model" below as "implementer subagent" and "reviewer subagent". The prompt, the forbidden list and the acceptance checks are unchanged. If temperature can't be set for a subagent, ignore that line; the harness still enforces determinism.

**Status: DRAFT API.** Phase 2 (strong model) implements the shell and the 10 wave-1 pilots, then **replaces §2–§3 with the shipped types** before any cheap job runs. Cheap jobs never see a draft API.

Approach in one line: **keep the algorithm (step generator), delete the view.** A visualizer file becomes a pure config object; the shell renders everything. Consistency, dual theme and zero radius come from the shell, not from per-file styling.

---

## 1. File shape after migration

```js
// src/pages/algorithms/<Category>/<Name>.jsx   (path and filename unchanged → routes unchanged)
import { defineVisualizer } from "@/components/visualizer";

// ── model: pure functions, no React, no DOM, no alert() ──
function parseInput(raw) { /* returns input object or throws fieldError(key, msg) */ }
function generateSteps(input) { /* returns Step[] */ }

// ── config ──
export default defineVisualizer({
  meta: { title: "Maximum Subarray", category: "Arrays", difficulty: "medium",
          summary: "Kadane's algorithm keeps the best sum ending here and the best sum overall.",
          leetcode: 53 },
  inputs: [{ key: "nums", kind: "numberList", label: "Array", default: [-2,1,-3,4,-1,2,1,-5,4], maxLen: 16 }],
  examples: [{ label: "Classic", values: { nums: [-2,1,-3,4,-1,2,1,-5,4] } },
             { label: "All negative", values: { nums: [-3,-1,-2] } }],
  parse: parseInput,
  generate: generateSteps,
  code: { lang: "cpp", lines: [
    "int maxSubArray(vector<int>& nums) {",
    "  int best = nums[0], cur = nums[0];",
    "  for (int i = 1; i < nums.size(); i++) {",
    "    cur = max(nums[i], cur + nums[i]);",
    "    best = max(best, cur);",
    "  }",
    "  return best;",
    "}",
  ]},
  complexity: { time: { avg: "O(n)" }, space: "O(1)" },
  legend: [{ tone: "active", label: "i" }, { tone: "window", label: "current subarray" },
           { tone: "success", label: "best subarray" }],
  view: {
    stage: "array",
    map: (s) => ({
      cells: s.arr.map((v, k) => ({ value: v,
        tone: k === s.currentIndex ? "active" : (s.finished && k >= s.subarrayStart && k <= s.subarrayEnd) ? "success" : "idle" })),
      pointers: s.currentIndex != null ? [{ index: s.currentIndex, label: "i", role: 1 }] : [],
      band: s.subarrayStart != null ? { from: s.subarrayStart, to: s.subarrayEnd, tone: "window" } : null,
    }),
  },
  stats: (s) => [{ label: "cur", value: s.currentSum }, { label: "best", value: s.maxSum, tone: "success" }],
});
```

No JSX, no `className`, no `style`, no colours, no hooks, no event listeners in the file. (Track C files may use `view.render` — strong model only.)

---

## 2. Contract (DRAFT — Phase 2 freezes it)

```ts
type Tone = "idle" | "active" | "compare" | "write" | "done" | "success" | "error" | "window" | "dim";
type Role = 1 | 2 | 3;                        // pointer colour by role (POLISH_PLAN §3.2)

type Step = {
  msg: string;                                // caption; required on every step
  line?: number;                              // 1-based index into code.lines (dev-asserted)
  phase?: "info" | "compare" | "write" | "success" | "fail" | "done";
  [field: string]: unknown;                   // whatever the generator records
};

type InputSpec =
  | { key: string; kind: "numberList"; label: string; default: number[]; min?: number; max?: number; minLen?: number; maxLen?: number; sorted?: boolean }
  | { key: string; kind: "number";     label: string; default: number; min: number; max: number; step?: number }
  | { key: string; kind: "string";     label: string; default: string; charset?: string; maxLen?: number; transform?: "upper" | "lower" }
  | { key: string; kind: "select";     label: string; default: string; options: { value: string; label: string }[] }
  | { key: string; kind: "toggle";     label: string; default: boolean }
  | { key: string; kind: "tree";       label: string; default: (number | null)[] }                 // level order
  | { key: string; kind: "matrix";     label: string; default: (number | string)[][]; maxRows?: number; maxCols?: number }
  | { key: string; kind: "tuples";     label: string; arity: number; fields: string[]; default: number[][] }
  | { key: string; kind: "graph";      label: string; default: { nodes: string[]; edges: [string, string, number?][]; directed: boolean } }
  | { key: string; kind: "ops";        label: string; grammar: { name: string; args: ("int" | "str")[] }[]; default: string };
// every InputSpec may add  random?: () => value   (shows a Random button)

interface ModeSpec<I> {
  label: string;                               // "Brute force" | "Optimal"
  generate: (input: I) => Step[];
  code: { lang: "cpp"; lines: string[] };
  complexity: { time: { best?: string; avg: string; worst?: string }; space: string; note?: string };
  legend?: LegendItem[];                       // overrides top-level legend for this mode
}

interface VisualizerConfig<I> {
  meta: { title: string; category: string; difficulty?: "easy" | "medium" | "hard"; summary: string; leetcode?: number };
  inputs: InputSpec[];
  examples: { label: string; values: Partial<I> }[];   // examples[0] auto-loads on mount (no idle screen)
  parse?: (raw: Record<string, unknown>) => I;         // throw fieldError(key, msg) → shown inline under the field
  validate?: (input: I) => Record<string, string> | null;
  // EITHER single mode:
  generate?: (input: I) => Step[];
  code?: { lang: "cpp"; lines: string[] };
  complexity?: ModeSpec<I>["complexity"];
  // OR several modes (replaces useModeHistorySwitch; switching regenerates from the same input, step → 0):
  modes?: Record<string, ModeSpec<I>>;
  defaultMode?: string;
  legend: { tone: Tone; label: string }[];
  view:
    | { stage: StageKind; map: (step: Step, input: I, mode: string) => StageProps; aux?: AuxSpec[] }
    | { render: (step: Step, input: I, mode: string) => React.ReactNode };   // TRACK C ONLY
  stats?: (step: Step, index: number, total: number) => { label: string; value: string | number; tone?: Tone }[];
  embed?: { fromExternalArray: (arr: number[]) => Partial<I> };           // judge drawer
}

defineVisualizer<I>(config: VisualizerConfig<I>):
  React.FC<{ embedded?: boolean; externalArray?: number[]; navigate?: unknown }>;
```

Shell guarantees (per-file code must not re-implement): playback, scrubber, speed, keyboard (typing/Monaco guard), responsive layout, caption + log, tokenised code highlight, inline input errors, theme, zero radius, `aria-live` caption, embedded compact mode, dev assertion that every `step.line` ∈ `[1, code.lines.length]` and every step has `msg`.

Judge drawer contract (`pages/judge/VisualizerDrawer.jsx` renders `<C embedded externalArray={arr} navigate={() => {}} />` in a 360 px box): when `externalArray` changes and `embed` exists, merge `embed.fromExternalArray(arr)` into inputs, regenerate, step 0. `embedded` → stage + caption + mini transport only. `navigate` is accepted and ignored.

---

## 3. Stage kinds and `map` return shapes (DRAFT)

| Stage | Manifest count | `map` returns |
|---|---|---|
| `array` | 76 | `{ cells: { value, tone?, sub? }[]; pointers?: { index, label, role }[]; band?: { from, to, tone }; rows?: { label, cells }[] }` — `rows` for two/three parallel arrays (e.g. input + result) |
| `vars` | 3 | `{ vars: { name, value, tone? }[] }` — scalar-heavy math pages |
| `bars` | 3 | `{ bars: { value, tone?, fill? }[]; max; pointers?; band? }` — histogram / water |
| `bits` | 5 | `{ rows: { label, value, bits, bitTone?: (i) => Tone }[] }` |
| `matrix` | 16 | `{ cells: { value, tone? }[][]; rowHeaders?; colHeaders?; active?: [r, c]; deps?: [r, c][] }` — DP tables, boards, grids |
| `list` | 8 | `{ nodes: { id, value, tone? }[]; edges: { from, to, tone?, curved? }[]; pointers?: { nodeId, label, role }[] }` |
| `tree` | 13 | `{ root: TreeNode \| null; getChildren?; nodeTone?: (node) => Tone; edgeTone?; badges?: (node) => string }` |
| `graph` | 5 | `{ nodes: { id, label, tone?, x?, y? }[]; edges: { from, to, weight?, tone? }[]; directed }` — shell lays out if x/y absent |
| `intervals` | 2 | `{ intervals: { start, end, label?, tone? }[]; min; max }` |
| `stack` / `queue` / `callstack` | 3 / 2 / 1 | as aux shapes below, used as the main stage |

Aux panels (`view.aux: [{ kind, title, map }]`, rendered beside/below the stage):
`stack` → `{ items: { value, sub?, tone? }[] }` (top first) · `queue` → `{ items, head?, tail?, capacity?, circular? }` · `table` → `{ entries: { key, value, tone? }[] }` (hash map / set / freq) · `callstack` → `{ frames: { fn, args, ret?, status: "active" | "waiting" | "returned" }[] }` · `ops` → `{ ops: string[]; active: number; results?: string[] }`.

---

## 4. Per-file job (cheap model, track A, waves 2–6)

### 4.1 Inputs the harness sends (verbatim)
1. `SYSTEM` = §4.2.
2. The frozen contract (§2–§3 as shipped).
3. Two reference files: the **pilot of the same stage kind** + `Sorting/BubbleSort.jsx` (migrated).
4. The manifest entry (`stage`, `aux`, `modes`, `notes`).
5. `TARGET_PATH` + full original file.
6. On retry only: harness failure output.

Temperature 0. Output: the complete new file, or exactly one line `ESCALATE: <reason>`.

### 4.2 System prompt

```
You convert ONE legacy React algorithm visualizer into a defineVisualizer config file.
You keep the algorithm; you delete the view. Output the whole new file, or exactly one line
"ESCALATE: <reason>". No prose, no markdown fences.

ESCALATE if any is true:
 a) There is no step-history generator (a function that builds an array of per-step snapshots).
 b) The algorithm cannot be expressed with the stage kind in the manifest entry plus its aux panels.
 c) You would need to change any other file.
 d) Lifting the generator would require changing what it computes.

MODEL (copy, don't rewrite):
 1. Find the generator(s) (e.g. generate*History, build*Steps). Copy their logic into
    top-level pure functions generate(input) → Step[] (one per mode).
    Allowed edits ONLY:
      - replace setHistory(x)/setSteps(x)/setCurrentStep(...) with `return x` (drop step setters);
      - replace reads of component state (inputs) with fields of the `input` parameter;
      - replace alert()/early-return-on-invalid with validation in parse/validate;
      - add `msg: <existing explanation/message text>` to each pushed snapshot if it lacks `msg`;
      - renumber `line` values ONLY when the manifest notes say so, to match your new code listing;
      - delete fields that only held layout (x, y, width, colours, classNames).
    Everything else — loops, conditions, arithmetic, snapshot field values, message wording — stays.
 2. Copy input parsing into parse(raw). Invalid input → throw fieldError(key, "short message").
    Never sort, dedupe or drop user input silently; reject it with a message instead.

CONFIG:
 3. meta: title (plain name, title case), category (folder display name), difficulty if the
    old page showed one, summary = one sentence, leetcode number if the old page linked one.
 4. inputs/examples: one InputSpec per old input; examples = the old defaults and presets
    (examples[0] = old default). Add random only if the old page had a Random button.
 5. code: ONE C++ listing per mode as plain strings, taken from the old page's C++ code
    (if the old page only has pseudocode/JS, translate it to equivalent C++ line-for-line and keep
    the line count so step.line still points at the right statement). Drop other languages.
 6. complexity: move the old page's complexity text verbatim into the structured fields.
 7. legend: only tones your map() actually emits, labels in sentence case.
 8. view.map: pure function from a step to the stage shape. Use tones exactly as defined:
    active = the element this step is about; compare = being compared; write = being
    swapped/assigned; done = processed; success = final/found/valid; error = conflict/invalid;
    window = a range band; dim = discarded. Pointers: role 1 = i/L/curr/slow, role 2 = j/R/next/fast,
    role 3 = mid/pivot/prev. Never output colours.
 9. stats: 2–4 values the old page showed as counters (not progress %, the shell shows that).
10. modes: if the old page had brute/optimal (or similar) tabs, use `modes`, keyed by a short id.
11. embed: only if the manifest notes mention the judge drawer.

FORBIDDEN in the output: JSX, className, style, colour literals, useState/useEffect/any hook,
addEventListener, alert, console.*, navigate, imports other than "@/components/visualizer".
```

### 4.3 Acceptance checks (`scripts/check-visualizer.mjs <file>`; model self-report is ignored)

| # | Check | Rule |
|---|---|---|
| 1 | Parse | file parses (Babel, jsx) |
| 2 | Imports | only `@/components/visualizer` |
| 3 | Default export | `defineVisualizer(<ObjectExpression>)` |
| 4 | No view code | 0 `JSXElement`, 0 `className`, 0 `style`, 0 hook calls (`/^use[A-Z]/`), 0 `alert(`, 0 `console.`, 0 `navigate(` (track C exempt from JSX only) |
| 5 | No colour | 0 hex / `rgb(` / `hsl(` literals |
| 6 | Config shape | required keys present; `view.stage` equals manifest `stage`; `aux` kinds ⊆ manifest `aux`; `modes` present iff manifest `modes` |
| 7 | Execution | for every example (× every mode): `parse` → `generate` returns ≥1 step; every step has non-empty `msg`; every `line` ∈ `[1, lines.length]`; `generate` is deterministic (two runs deep-equal); `view.map` returns the declared shape for every step without throwing |
| 8 | Parity | harness extracts the legacy generator from `git show HEAD:<file>` (stubbing `setHistory`/`setSteps` to capture), runs it on examples[0], and deep-compares with the new steps **ignoring** `msg`, `line` (when renumbering is allowed) and removed layout fields. Step count and every other field must match. If legacy extraction fails, record `parity: "manual"` and route to strong review |
| 9 | Build | batch `npm run build` passes |
| 10 | Escalation | a single `ESCALATE:` line → manifest `status: "escalated"`, no retry |

Fail → one retry with the failure text appended → fail again → `escalated`. Strong model reviews all escalations, the first 3 files of each stage kind, then 1 in 5 (≤ 6 screenshots per review session, viewport only).

---

## 5. Strong-model tracks

- **Wave 1 pilots** (10, one per stage kind; list in `POLISH_PLAN.md` Phase 2): written by the strong model with this same contract; they become the reference files for §4.1.
- **Track B** (18, wave 7): no step history. Write `generate()` from the algorithm (mirroring the old page's behaviour and messages), then the config. Parity check #8 is replaced by a hand-verified expected output for each example (final answer equals the old page's final answer).
- **Track C** (4, wave 8): `view.render` escape hatch — AStar (grid painting + pathfinding), Pathfinding/BFS (grid painting), NetworkFlow (residual graph), TowerOfHanoi (pegs). Render must use only shell primitives and tokens; `check-ui.mjs` still applies.
- **Track D / alias** (waves 0 and 9): delete `Arrays/4Sum.jsx`, `Trees/validBST.jsx`, `Arrays/VizualiserPointer.tsx`; make `Stack/SubarrayRanges.jsx` `export { default } from "../Arrays/SubarrayRanges";`.

---

## 6. Known per-file hazards (also in manifest `notes`)

- `Arrays/MaximumSubarray`, `Stack/NextGreaterElement`: `line` values don't match the listing — renumber allowed.
- `Design/LRUCache`: snapshots have no `line` — add `line` (allowed enrichment; strong review).
- `DynamicProgramming/EditDistance`, `Hashing/ValidAnagram`: multi-language tabs share C++ line numbers — keep C++ only.
- `LinkedList/ReverseLinkedList`: snapshots bake x/y — drop them; the `list` stage lays out.
- `Graphs/Dijkstra`, `Trees/ValidateBST`, `BinarySearch/BinarySearchBasic`: generator reads component state / is inlined in `load()` — lift into `generate(input)`; BinarySearchBasic's silent sort becomes a validation error ("array must be sorted") plus a "Sort for me" example.
- `Arrays/FindMaxElement`, `Arrays/FindMinElement` (track B): must define `embed.fromExternalArray`.
- 64 legacy files have titles that are invisible in production (`metrics.titleInvisibleInProd`) — irrelevant after migration, but a quick way to find pages that look broken today.
