# Visualizer contract (`defineVisualizer`)

How an algorithm visualizer is written, what the shell guarantees, and how a file is checked. The shell lives in
`src/components/visualizer/v2/`; the migrated reference files are `Sorting/BubbleSort.jsx` and the other pilots listed in
`docs/visualizer-manifest.json`.

Approach in one line: **keep the algorithm (step generator), delete the view.** A visualizer file becomes a pure config
object and the shell renders everything. Consistency, dual theme and zero radius come from the shell, not from per-file
styling. Change the contract only together with a shell change that updates this file.

---

## 1. File shape

Reference file: `Sorting/BubbleSort.jsx`. Copy its structure.

```js
// src/pages/algorithms/<Category>/<Name>.jsx   (path and filename unchanged → routes unchanged)
import { defineVisualizer } from "@/components/visualizer";

/* ── model: pure, no React ── */
function generate(input) {            // input = what parse returned
  const arr = input.nums.map((value, id) => ({ value, id }));
  const hist = [];
  let comparisons = 0, swaps = 0;
  const snap = (extra) => hist.push({ array: arr.map((o) => ({ ...o })), comparisons, swaps, ...extra });
  snap({ line: 1, msg: "Initialize Bubble Sort.", phase: "info" });
  /* ... loops push snapshots with line, msg, phase ... */
  snap({ line: 9, finished: true, msg: `Complete. ${comparisons} comparisons, ${swaps} swaps.`, phase: "success" });
  return hist;
}

/* ── config ── */
export default defineVisualizer({
  meta: { title: "Bubble Sort", category: "Sorting", difficulty: "easy",
          summary: "Swap adjacent out-of-order pairs, pass after pass, until nothing moves.", leetcode: 912 },
  inputs: [{ key: "nums", kind: "numberList", label: "Array", default: [8, 5, 2, 9, 5, 6, 3], minLen: 1, maxLen: 16 }],
  examples: [{ label: "Default", values: { nums: [8, 5, 2, 9, 5, 6, 3] } },
             { label: "Already sorted", values: { nums: [1, 2, 3, 4, 5] } }],
  parse: ({ nums }) => ({ nums: nums.slice() }),     // receives coerced field values keyed by input key
  generate,
  code: { lang: "cpp", lines: ["void bubbleSort(vector<int>& arr) {", /* ... */ "}"] },
  complexity: { time: { best: "O(n)", avg: "O(n^2)", worst: "O(n^2)" }, space: "O(1)", note: "Early exit when a pass makes no swaps." },
  legend: [{ tone: "compare", label: "comparing" }, { tone: "write", label: "swapping" }, { tone: "success", label: "sorted" }],
  view: {
    stage: "array",
    map: (s) => ({
      cells: s.array.map((item, k) => ({ value: item.value,
        tone: s.finished ? "success" : s.j != null && (k === s.j || k === s.j + 1) ? (s.phase === "write" ? "write" : "compare") : "idle" })),
      pointers: s.j != null && !s.finished ? [{ index: s.j, label: "j", role: 1 }, { index: s.j + 1, label: "j+1", role: 2 }] : [],
    }),
  },
  stats: (s) => [{ label: "Comparisons", value: s.comparisons ?? 0 }, { label: "Swaps", value: s.swaps ?? 0 }],
});
```

No JSX, no `className`, no `style`, no colours, no hooks, no event listeners in the file. (Files that need a custom stage may use `view.render`.)

---

## 2. Contract (as shipped in `src/components/visualizer/v2/`)

```ts
type Tone = "idle" | "active" | "compare" | "write" | "done" | "success" | "error" | "window" | "dim";
type Role = 1 | 2 | 3;                        // pointer colour by role 

type Step = {
  msg: string;                                // caption; required on every step (dev-asserted)
  line?: number;                              // 1-based index into code.lines (dev-asserted)
  phase?: "compare" | "write" | "success" | "fail" | "done" | "info";  // caption rule: warn / viz-write / ok / err / border-strong / accent-ink (default info)
  vars?: Record<string, unknown>;             // optional; the Inspector shows it as a "Variables" block
  [field: string]: unknown;                   // whatever the generator records
};

type InputSpec =
  | { key: string; kind: "numberList"; label: string; default: number[]; min?: number; max?: number; minLen?: number /* default 1 */; maxLen?: number }
  | { key: string; kind: "number";     label: string; default: number; min: number; max: number; step?: number }
  | { key: string; kind: "string";     label: string; default: string; charset?: string; maxLen?: number; transform?: "upper" | "lower" }
  | { key: string; kind: "select";     label: string; default: string; options: { value: string; label: string }[] }
  | { key: string; kind: "toggle";     label: string; default: boolean }
  | { key: string; kind: "tree";       label: string; default: (number | null)[] }                 // level order
  | { key: string; kind: "matrix";     label: string; default: (number | string)[][]; maxRows?: number; maxCols?: number }
  | { key: string; kind: "tuples";     label: string; arity: number; fields: string[]; default: number[][] }
  | { key: string; kind: "graph";      label: string; default: { nodes: string[]; edges: [string, string, number?][]; directed: boolean } }
  | { key: string; kind: "ops";        label: string; grammar: { name: string; args: ("int" | "str")[] }[]; default: string };
// every InputSpec may add  random?: () => value   (shows a Random button; value has the coerced shape below)
// `sorted` is NOT supported. Reject unsorted input in parse/validate with fieldError(key, "array must be sorted").
```

**Coercion (what `parse` receives).** The user types drafts (strings); the shell coerces each field to a typed value and `parse(values)` gets an object keyed by input key. `examples[].values` and `embed.fromExternalArray(arr)` use the SAME typed shape (the shell round-trips them through the draft form).

| kind | typed value | rules |
|---|---|---|
| `numberList` | `number[]` | split on commas/whitespace; non-numbers, `minLen` (default 1), `maxLen`, `min`, `max` are field errors |
| `number` | `number` | must be finite and within `min..max`; an integer `step` requires a whole number |
| `string` | `string` | `transform` applied first, then `maxLen`, then `charset` (every char must be in the charset string) |
| `select` | `string` (one of `options[].value`) | applied immediately on change |
| `toggle` | `boolean` | applied immediately on change |
| `tree` | `(number \| null)[]` | level order; `null`, `nil`, `none`, `#`, `-`, `x` mean missing; root may not be null |
| `matrix` | `(number \| string)[][]` | one row per line, equal row lengths, numeric tokens become numbers; `maxRows`/`maxCols` |
| `tuples` | `number[][]` | rows split on newline or `;`, brackets stripped; each row exactly `arity` numbers |
| `graph` | `{ nodes: string[]; edges: [a, b, w?][]; directed: boolean }` | text syntax below |
| `ops` | `string` (raw text, stays a string) | validated against `grammar` (`name(arg, ...)`, `int` args must be integers); `parse` splits it |

Graph text: one edge per line (or `;`), `A-B`, `A-B:3` (undirected, optional weight) or `A->B`, `A->B:3` (directed); a bare name adds an isolated node. Directedness is inferred from the arrows and must not be mixed (field error). Node names are non-empty and cannot contain whitespace, `-`, `:` or `>`. With no edges, `directed` falls back to `default.directed`.

**Errors.** `parse` (or `validate`) reports bad input with `throw fieldError(key, "short message")`, shown inline under that field. Never `alert()`. Any other throw becomes a general "Could not generate steps" line; a `generate` that returns no steps shows "This input produced no steps."

**Dev assertion.** After `generate`, outside production the shell checks that every step has a non-empty `msg` and every `line` is an integer in `[1, code.lines.length]`. It throws under `NODE_ENV=test` (jest) and `console.error`s in dev.

```ts
interface ModeSpec<I> {
  label: string;                               // "Brute force" | "Optimal"
  generate: (input: I) => Step[];
  code: { lang: "cpp"; lines: string[] };
  complexity: { time: { best?: string; avg: string; worst?: string }; space: string; note?: string };
  legend?: LegendItem[];                       // overrides top-level legend for this mode
}

interface VisualizerConfig<I> {
  meta: { title: string; category: string; difficulty?: "easy" | "medium" | "hard"; summary: string; leetcode?: number };  // leetcode -> a LeetCode search URL
  inputs: InputSpec[];
  examples: { label: string; values: Partial<Coerced> }[];   // examples[0] auto-loads on mount (no idle screen)
  parse?: (values: Record<string, Coerced>) => I;            // throw fieldError(key, msg)
  validate?: (input: I) => Record<string, string> | null;    // field-keyed errors, run after parse
  // EITHER single mode:
  generate?: (input: I) => Step[];
  code?: { lang: "cpp"; lines: string[] };
  complexity?: ModeSpec<I>["complexity"];
  // OR several modes (switching regenerates from the same values, step -> 0):
  modes?: Record<string, ModeSpec<I>>;
  defaultMode?: string;                        // default: first key
  legend: { tone: Tone; label: string }[];
  view:
    | { stage: StageKind; map: (step: Step, input: I, mode: string) => StageProps;
        aux?: { kind: AuxKind; title?: string; map: (step: Step, input: I, mode: string) => AuxProps }[] }
    | { render: (step: Step, input: I, mode: string) => React.ReactNode };   // custom stages only
  stats?: (step: Step, index: number, total: number) => { label: string; value: string | number; tone?: Tone }[];
  embed?: { fromExternalArray: (arr: number[]) => Partial<Coerced> };   // judge drawer; same shape as examples[].values
}

defineVisualizer<I>(config): React.FC<{ embedded?: boolean; externalArray?: number[]; navigate?: unknown }>;
```

`input` in `map`/`stats` callers is what `parse` returned (or the coerced values when there is no `parse`). `map` runs per step; a throw inside it renders an inline "This step could not be drawn" line, not a crash. Stage and aux map functions get `(step, input, mode)`; `stats` gets `(step, index, total)` and NO mode.

Shell guarantees (per-file code must not re-implement): playback, scrubber, speed, keyboard (typing/Monaco guard), responsive layout, caption + log, tokenised code highlight, inline input errors, theme, zero radius, `aria-live` caption, embedded compact mode, the dev assertion above. `select` and `toggle` inputs apply immediately; text inputs apply on Apply.

Judge drawer contract (`pages/judge/VisualizerDrawer.jsx` renders `<C embedded externalArray={arr} navigate={() => {}} />` in a 360 px box): when `externalArray` changes and `embed` exists, merge `embed.fromExternalArray(arr)` into the current values, regenerate, step 0. `embedded` renders stage + aux + caption + mini transport only. `navigate` is accepted and ignored.

---

## 3. Stage kinds and `map` return shapes

All stages accept `tone` names from the Tone type (an unknown tone renders `idle`). Cells and nodes carry text labels as well as colour; never rely on colour alone. Out-of-range pointer indices are ignored.

| Stage | `map` returns | Decisions |
|---|---|---|
| `array` | `{ cells: { value, tone?, sub? }[]; pointers?: { index, label, role }[]; band?: { from, to, tone }; rows?: { label, cells }[] }` | `rows` are extra parallel arrays on the same column grid (input + result). Pointers and `band` belong to the first row (`cells`). `sub` is a small second line. Index numbers are printed under cells. |
| `vars` | `{ vars: { name, value, tone? }[] }` | one tile per variable; object values are JSON-stringified; long values truncate (full text in `title`). |
| `bars` | `{ bars: { value, tone?, fill? }[]; max; pointers?; band? }` | `fill` is stacked ABOVE the bar (info tone, dashed edge, label `value+n`); `value + fill` is clamped to `max`; max-height bar fills 86% of the plot (headroom for the value label). Negative or non-finite values draw as 0. |
| `bits` | `{ rows: { label, value, bits, bitTone?: (i) => Tone }[] }` | rows are MSB-first; the bit POSITION (0 = LSB) is printed under each column; `bitTone(i)` gets that position `i` (not the column index); `bits` is clamped to 1..64; negatives render as two's complement at that width. |
| `matrix` | `{ cells: (scalar \| { value, tone? })[][]; rowHeaders?; colHeaders?; active?: [r, c]; deps?: [r, c][] }` | cells may be bare scalars. `active` forces the active tone and a "now" tag; `deps` get a dashed info outline and a "dep" tag. Headers are plain labels (no per-header highlight). |
| `list` | `{ nodes: { id, value, tone? }[]; edges: { from, to, tone?, curved? }[]; pointers?: { nodeId, label, role }[] }` | one row; node order = layout order. The null terminator is an EXPLICIT node (give it an id such as `"null"` and value `"null"`); edges to it are ordinary edges. Pointers render in a pointer row under the nodes, stacked when several share a node. Backward or non-adjacent edges arc; `curved` forces an arc. No x/y (the shell lays out). |
| `tree` | `{ root: TreeNode \| null; getChildren?; nodeTone?: (node) => Tone; edgeTone?: (node) => Tone; badges?: (node) => string }` | node label is the first present of `val`, `value`, `key`, `label`, `name`, `data`. Binary nodes (`left`/`right`) use in-order slot layout; `children[]` or `getChildren` gives n-ary layout. `edgeTone(node)` is the tone of the edge INTO that node (from its parent). `badges` is small text under the node (range, balance). |
| `graph` | `{ nodes: { id, label, tone?, x?, y? }[]; edges: { from, to, weight?, tone? }[]; directed }` | fixed 480x360 viewBox scaled to the stage. Circular layout in input order when x/y are absent; given x/y are rescaled into the box. Labels longer than 6 characters are truncated (5 + ellipsis), so put short text (e.g. a Dijkstra distance) in `label`; the full id is in the aria-label. |
| `intervals` | `{ intervals: { start, end, label?, tone? }[]; min; max }` | one lane per interval on a shared axis. Input and output intervals go in ONE list, told apart by `label` and `tone`. The lane label always carries "[start, end]". |
| `stack` | `{ items: { value, sub?, tone? }[] }` | TOP FIRST; the top is marked with a TOP label. |
| `queue` | `{ items: { value, sub?, tone? }[]; head?; tail?; capacity?; circular? }` | front left, rear right. `head`/`tail` are slot indices (default 0 and last item). With `circular`, `items` are the RING SLOTS (`null` value = empty slot) and `head` marks P1, `tail` P2. |
| `callstack` | `{ frames: { fn, args, ret?, status: "active" \| "waiting" \| "returned" }[] }` | frames are OUTERMOST-FIRST (call order); the newest frame is drawn on top. Status is shown as text and tone. |

Aux panels (`view.aux: [{ kind, title?, map }]`, rendered below or beside the stage, same `(step, input, mode)` map signature). Same data shapes and decisions as the matching stages: `stack` → `{ items }` (top first) · `queue` → `{ items, head?, tail?, capacity?, circular? }` · `table` → `{ entries: { key, value, tone? }[] }` (hash map / set / frequency) · `callstack` → `{ frames }` (outermost first, newest on top) · `ops` → `{ ops: string[]; active: number; results?: string[] }`.

Pointer roles: 1 = i / L / curr / slow, 2 = j / R / next / fast, 3 = mid / pivot / prev. The label text is always shown. Tones: active = the element this step is about; compare = being compared; write = swapped or assigned; done = processed; success = final, found or valid; error = conflict or invalid; window = a range; dim = discarded.

---

## 4. Acceptance checks (`scripts/check-visualizer.mjs <file>`)

| # | Check | Rule |
|---|---|---|
| 1 | Parse | file parses (Babel, jsx) |
| 2 | Imports | only `@/components/visualizer` |
| 3 | Default export | `defineVisualizer(<ObjectExpression>)` |
| 4 | No view code | 0 `JSXElement`, 0 `className`, 0 `style`, 0 hook calls (`/^use[A-Z]/`), 0 `alert(`, 0 `console.`, 0 `navigate(` (track C exempt from JSX only) |
| 5 | No colour | 0 hex / `rgb(` / `hsl(` literals |
| 6 | Config shape | required keys present; `view.stage` equals manifest `stage`; `aux` kinds ⊆ manifest `aux`; `modes` present iff manifest `modes` |
| 7 | Execution | for every example (× every mode): `parse` → `generate` returns ≥1 step; every step has non-empty `msg`; every `line` ∈ `[1, lines.length]`; `generate` is deterministic (two runs deep-equal); `view.map` returns the declared shape for every step without throwing |
| 8 | Parity | harness extracts the legacy generator(s) from `git show viz-legacy:<file>` (default `--rev viz-legacy`, a tag on the last pre-migration commit; NOT `HEAD`, which is already migrated), stubbing `setHistory`/`setSteps` to capture, runs it on examples[0], and deep-compares with the new steps **ignoring** `msg` and its aliases (`explanation`, `message`, `desc`, `description`), `line` (when renumbering is allowed) and layout fields (`x`, `y`, ...). Step count and every other field must match. Multi-mode files are compared per mode (each mode against its matching legacy generator; the detail lists each mode's status). If legacy extraction fails or no legacy generator matches a mode, record `parity: "manual"` and route to manual review |
| 9 | Build | batch `npm run build` passes |
| 10 | Escalation | a file that is a single `ESCALATE: <reason>` line is reported ESCALATED and the manifest `status` becomes `escalated` |

**Flags** (`node scripts/check-visualizer.mjs [options] <file...>`; exit 1 on any FAIL or ESCALATED):

| Flag | Effect |
|---|---|
| `--json <out>` | write the full result as JSON |
| `--rev <rev>` | legacy snapshot for check 8 (default `viz-legacy`) |
| `--legacy-file <path>` | read the legacy source from a file instead of `git show` (single file; tests) |
| `--legacy-input <json>` | input passed to the legacy generator (default: guessed from the legacy code) |
| `--allow-renumber` | ignore `line` in parity (also on when the manifest notes mention "renumber") |
| `--ignore a,b` | extra step fields ignored by parity (use for intentionally dropped legacy fields) |
| `--skip-parity` | check 8 reports SKIP "hand-verified" |
| `--no-manifest` | file is not in the manifest: check 6 is SKIP and manifest-bound rules are not applied |
| `--track <X>` | override the manifest track (tests, ad-hoc) |
| `--track-c` | exempt JSX from check 4 (implied by manifest track C) |
| `--timeout-ms <n>` | check 7 child-process timeout (default 20000) |

Check 8 is SKIP "hand-verified" automatically for manifest tracks B, D and alias. Check 7 runs without React: the config is transpiled and executed with the real `inputModel`/`fieldError`/`tones` modules, so the draft round trip (examples -> drafts -> coerced values) and `assertSteps` are the shell's own code. Check 9 is the batch `npm run build`.

**Trusted code only.** Check 8 executes legacy code from git history (or `--legacy-file`) in a `node:vm` context. That is not a security sandbox. Never point `--rev` or `--legacy-file` at untrusted source.

**Pilot results (the 10 pilots).** Legacy extraction succeeded on 10/10 after the extractor was improved (6/10 before). Parity PASS on 8. ValidateBST and SingleNumber differ only on intentionally dropped legacy fields (`step`, `binBefore`); their final answers were hand-verified equal.

---

## 5. Known shell gaps

Found while migrating the pilots. Work around them in the config; fix them in the shell, not per file.

- Aux panels are not mode-conditional: a mode that does not use an aux panel still shows it, empty. Return an empty `items`/`entries` list or put a note in the panel title until the shell supports `aux` per mode.
- `stats(step, index, total)` gets no `mode`; branch on a field you recorded in the step instead.
- Graph stage has no start/end node markers; use `label` text or `tone`.
- Matrix stage has no per-header highlight (headers are plain labels).
- List stage has no sentinel HEAD/TAIL boxes; use the pointer row and an explicit `null` node.
- End and Home are consumed by a focused mode tab (they move between tabs instead of seeking the player).
- The step counter is briefly stale right after a mode switch (it settles on the next render).
