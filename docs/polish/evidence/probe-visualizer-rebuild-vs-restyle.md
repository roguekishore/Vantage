<!-- Recovered from crashed Kiro session sess_35b51775, sub-agent output at 2026-09-30T07:55:55.237Z. -->
# Re-run the aborted visualizer strategy probe with a narrower scope to decide rebuild vs restyle.

## Prompt given to the probe

Project: d:\PROJECTS\APPS\VANTAGE\reactapp. 145 algorithm visualizers in src/pages/algorithms/<Category>/*.jsx. Only the 12 Sorting files use the shared library src/components/visualizer (reference: src/pages/algorithms/Sorting/BubbleSort.jsx). Decision needed: (a) restyle each legacy file in place, or (b) rebuild each as: keep only its algorithm step-generator + input parsing, and render through shared declarative archetype templates via something like defineVisualizer({meta, code, legend, inputs, examples, generate, view}). Goal: maximal visual consistency, dual theme, strict zero radius, with most per-file work done by cheaper models. Read-only; file:line evidence; be concise.

1. Pick these 10 files and for each report (short table): generator function name + line range; is it a pure function of inputs (no React state/refs/closures over component state)? could it be lifted verbatim into `generate(input) => steps[]`? snapshot fields present; does the snapshot contain what a good view needs (active code line, pointer indices, highlighted cells)? lines of JSX render section today; estimated lines of a view-mapping adapter under (b).
   Files: Arrays/MaximumSubarray.jsx, BinarySearch/BinarySearchBasic.jsx, DynamicProgramming/EditDistance.jsx, LinkedList/ReverseLinkedList.jsx, Trees/ValidateBST.jsx, Graphs/Dijkstra.jsx, Design/LRUCache.jsx, Stack/NextGreaterElement.jsx, SlidingWindows/LongestSubstring.jsx, Hashing/ValidAnagram.jsx.
2. Colour semantics: across those 10 plus 8 more of your choosing (spread across categories), tabulate colours used for: current/active, comparing, found/success, visited/done, pointers (L/R/mid/i/j), window/range, error/conflict. Summarise divergence and propose one canonical state→token mapping.
3. Input UX: how inputs are entered in those 18 files (comma strings, selects, random, presets, painting) and validation style (alert/inline/silent). Propose one `inputs` schema and list files that don't fit.
4. Code listing conventions in those 18 files: language shown (C++/Java/JS/pseudocode), single vs multi-language tabs, whether line highlighting is driven by the snapshot. Recommend one convention.
5. Critique the TARGET design (BubbleSort + library components) as a senior product designer: hierarchy, density, idle state, header, ControlBar discoverability, layout at 1280/1440/1920/mobile, usefulness of stat blocks and complexity footer. List concrete changes that would make it look like a professional product.
6. Recommendation (a / b / hybrid) with rationale, risks, and estimated per-file output size for a cheap model under each. If (b), give a precise defineVisualizer API sketch (field types; how multi-mode pages like brute/optimal are handled; how the judge drawer contract embedded/externalArray in src/pages/judge/VisualizerDrawer.jsx is honored).

## Findings

=== Context Gathering Summary ===
FOUND: Generators, snapshot fields and render ranges for all 10 files. The shared library (theme.js, ControlBar, VisualizerHeader, IdleState, ArrayBox, StatBlock, ComplexityFooter, CodePanel, VisualizerShell). The judge drawer contract (embedded, externalArray, navigate, 360px box). The useModeHistorySwitch hook. Colour logic in 8 extra files (FindMaxElement, AStar, NQueens, Heapify, PalindromeCheck, CircularQueue, CountingBits, JobScheduling). The app accent variable in index.css:329 against theme.js accent. Line-number mismatches in MaximumSubarray, NextGreaterElement, EditDistance and ValidAnagram; LRUCache has no line field.
NOT FOUND: Cell-colour functions in MaximumSubarray (≈253) and BinarySearchBasic (≈383) were not read. The exact Dijkstra node-state mapping at 743-753 and LRU colours at 380/408 are only partly read. The full `.dark` variable block in index.css was not confirmed. Render JSX sizes are estimates from the component's `return (` line to `export`.
====================================

=== CONTEXT GATHERING COMPLETE ===

ANSWER:
I recommend option (b): shared declarative templates, with a custom-view escape hatch for the few pages that don't fit. Most legacy files already have a nearly pure `generateXHistory` that builds a `history[]` of snapshots with a `line` field. That is the `generate(input) => steps[]` contract, so the per-file work is mechanical. Unless a line is marked "not read", every claim below comes from code I read.

## 1. The 10 legacy files

| File | Generator (lines) | Pure? | Lift as-is? | Snapshot fields | Enough for a good view? | Render JSX today | Adapter under (b) |
|---|---|---|---|---|---|---|---|
| Arrays/MaximumSubarray | `generateKadaneHistory` 11-93 | Yes, apart from `setHistory` / `setCurrentStep` at 91-92 | Yes, swap those two calls for `return` | arr, maxSum, currentSum, line, currentIndex, subarrayStart/End, reset, newMax, finished, explanation | Mostly. **The `line` values don't match the code listing**: generator uses 1-6, listing at 143-155 uses 1-11, so line 2 highlights "maxSum=…" instead of the loop. The final step has no index. The message at 55 prints the new sum, not the old one. | about 160 (159-318) | about 25 (array) |
| BinarySearch/BinarySearchBasic | inline in `load` 98-177 | No: `useCallback([arrInput,targetInput])`, parsing and generation mixed, `setHistory` plus early return at 144 and 174 | Needs about 10 lines of extraction | array, target, left, right, mid, foundIndex, message, line | Yes. Lines 2/4/5/6/7/9 match the C++ at 232-241. It silently sorts the input (105). | about 250 (251-500) | about 20 |
| DynamicProgramming/EditDistance | `generateHistory` 88-164 | Yes, apart from setters | Yes | dp (copied), i, j, line, decision, explanation, result | Yes for the grid. But lines are keyed to the C++ tab, and the same `state.line===line.l` check (367-370) runs on the Python and Java tabs, so their highlights are wrong. | about 230 (242-469) | about 35 (matrix) |
| LinkedList/ReverseLinkedList | iterative 114-212, recursive 214-298 | Yes (nested functions) | Yes | nodes (with **x/y layout baked in**, 118-121), edges, prev, curr, nextTemp, line, finished | Yes. Pointers prev/curr/next are present. The adapter should ignore the baked x/y. | about 310 (375-685) | about 40 (list) |
| Trees/ValidateBST | `generateHistory` 406-605 | **No**: reads `treeInput`, calls `alert` and `setIsLoaded`. The inner recursion `isValidBST` (428-587) is pure. `buildTreeFromLevelOrder` (386-404) is pure. | Needs extraction | tree, currentNode, processingNode, currentRange{min,max}, isValid, comparison, line, callStack, depth, side, isComplete | Rich; everything a view needs | about 700 (36-375 helper components plus 786-1143) | about 45 (tree + range side panel) |
| Graphs/Dijkstra | `generateHistory` 74-327 | **No**: closes over five input states and has side effects on `isDemo`/`demoInterval`. `parseGraphInput` (5-43) is already module-level and pure. | Needs extraction | nodes, edges, adj, positions, line, distances, previous, visited, pq, current, exploringEdge, relaxingEdge, finalPath, explanation | Excellent | about 400 (465-867) | about 50 (graph + PQ/distance tables) |
| Design/LRUCache | optimal 41-150, brute 152-210; `parseOperations` 22-39 | Yes, apart from setters | Yes | cache, list, outputLog, commandIndex, movedKey, evictedKey, newKey, getResult, finished, explanation | **No `line` field at all**, so there is no code highlight today. `line` has to be added. | about 200 (261-461) | about 40 (ops + hashmap + list) |
| Stack/NextGreaterElement | brute 19-74, optimal 76-147 | Yes | Yes | nums, results, i, j / stack, line, explanation, finished | Yes, but **the `line` values are off in both modes**: optimal emits 3/4/5/9/11/14/16 against a listing where 5 is the `for`, 7 is the `pop` and 15 is the `push`. `top` is never set. | about 145 (195-339) | about 30 (array + stack + results) |
| SlidingWindows/LongestSubstring | brute 98-226, optimal 229-323 | Yes, apart from setters and `setIsLoaded` | Yes | s[], maxLength, left, right, charIndexMap (a Map), duplicateChar/Index, justAddedToMap, justUpdatedMax, line, step. Brute force uses currentStart/currentEnd instead. | Yes. The window overlay is measured from the DOM in a `useEffect` (≈430-466) and keys off brute-force fields only. | about 520 (553-1072, plus the Pointer component 29-86) | about 35 |
| Hashing/ValidAnagram | `generateHistory` 82-183 | Yes, apart from three `setHistory` calls with early returns | Yes, after rewriting those returns | freq, currentChar, phase, result, line, explanation, charIndex | Mostly. `charIndex` is shared between s and t; `phase` tells them apart. Lines are keyed to C++ but applied to all three tabs (274-293). | about 330 (323-653) | about 35 |

Seven of the ten can be lifted almost verbatim. Three need parsing pulled out (BinarySearchBasic, ValidateBST, Dijkstra). Four have wrong or missing `line` data (MaximumSubarray, NextGreaterElement, LRUCache, and the non-C++ tabs in EditDistance and ValidAnagram). A dev-mode check that every `step.line` exists in `code` would catch all of these.

## 2. Colour semantics (10 files plus FindMaxElement, AStar, NQueens, Heapify, PalindromeCheck, CircularQueue, CountingBits, JobScheduling)

| File | Current / active | Comparing | Found / success | Visited / done | Pointers | Window / range | Error | Code-line highlight |
|---|---|---|---|---|---|---|---|---|
| BubbleSort (target) | – | amber | green (sorted) | green | amber j, j+1 | – | – | accent yellow |
| MaximumSubarray | not read | – | – | – | VisualizerPointer | not read | – | accent-primary-light |
| BinarySearchBasic | not read | – | – | – | blue / purple / red (35-44) | – | – | teal/10 |
| EditDistance | purple/80 | – | – | success700/60 | – | – | – | success-light |
| ReverseLinkedList | accent-primary/80 (556) | – | – | – | accent-primary | – | – | accent-primary-light |
| ValidateBST | **green #10b981** (49) | amber #f59e0b | green #22c55e | – | – | orange border | red #ef4444 | success-light |
| Dijkstra | orange→danger gradient (743) | – | success | warning/orange gradients | – | – | danger→pink | orangelight |
| LRUCache | orange (get) | – | – | – | – | – | danger (evict) | none |
| NextGreaterElement | orange (i) | teal (j) | – | – | amber i, cyan j | – | – | teallight |
| LongestSubstring | – | – | – | – | green L, warning/orange R | accent-primary border plus sky-blue overlay | danger→pink (duplicate) | accent-primary-light |
| ValidAnagram | accent-primary/80 | – | – | success-hover/60 | – | – | – | success-light |
| FindMaxElement | warning | – | success | accent-primary-light; embedded mode uses raw emerald / amber / indigo | – | – | – | accent-primary-light |
| AStar | – | – | accent-primary (path) | teal | green start, red end | – | – | – |
| NQueens | its own local `C` palette (hard-coded hex) | – | – | – | – | – | – | C.accent |
| Heapify | accent-primary | warning | success | – | – | – | – | teallight |
| PalindromeCheck | accent-primary / purple (L/R) | – | success | – | – | – | danger | driven by flags |
| CircularQueue | – | – | – | – | – | – | danger border (472) | pinklight |
| CountingBits | purple→pink gradient | – | success (set bits) | – | – | – | – | purple |
| JobScheduling | warning | – | success | – | – | – | – | success-light |

**Divergence:**
- "Current" appears as green, purple, orange, accent-primary or amber depending on the file.
- Green means current in ValidateBST, but success and done elsewhere.
- The code-line highlight uses six different colours.
- There are two brand accents: `V.accent` is #EDFF66 (theme.js:22), while app `--color-accent-primary` is #5542FF (index.css:329).
- Gradients and shadows are common.
- ArrayBox duplicates variants: active equals current, and found equals sorted (ArrayBox.jsx 22-33).

**Proposed canonical mapping.** Each state gets a `--viz-*` variable with light and dark values, and every state uses the same fill and border form:

| State | Token | Notes |
|---|---|---|
| idle | `neutral` (elevated / border) | |
| active / current | `accent` | Brand colour; needs a darker light-theme value because yellow fails on white |
| compare / probe | `amber` | |
| write / swap / move | `purple` | |
| found / success / result | `green` | Final answers only |
| visited / processed | `muted` (neutral-2 text, faint fill) | No longer green, so it can't be confused with success |
| discarded / out of range | `dim` (opacity .35) | |
| window / range | `cyan` fill + cyan border | Applied as a band behind the cells, not per cell |
| error / conflict / evict / invalid | `red` | |

Pointers are coloured by role, not by variable name: P1 (i, L, curr, slow) is accent, P2 (j, R, next, fast) is cyan, P3 (mid, pivot, prev) is purple. Labels always show the variable name. The code-line highlight always uses accent.

## 3. Input UX

- **Comma-separated number strings:** MaximumSubarray, BinarySearchBasic (plus a target field), ReverseLinkedList and NextGreaterElement (plus a mode toggle), Heapify (plus random and a mode select), JobScheduling (flat start,end,profit triplets plus random), ValidateBST (level order with `null`, plus random), FindMaxElement (shuffle or `externalArray`).
- **Strings:** EditDistance (two, upper-cased), ValidAnagram (two, lower-cased), LongestSubstring (plus random and a mode select), PalindromeCheck (a select plus six example buttons, 160-175).
- **Scalars:** CountingBits (n from 0 to 20, random, bit-width select), NQueens (n).
- **Operation scripts:** LRUCache (multiline `LRUCache(2)\nput(1,1)`, parsed by regex), CircularQueue (capacity plus `enqueue 5, dequeue`).
- **Graph:** Dijkstra (node CSV, edges as `u-v-w`, start/end selects, directed toggle, demo mode).
- **Painting:** AStar (mouse-drag walls, start and end, grid modal).

**Validation is `alert()` almost everywhere:** MaximumSubarray 98, BinarySearchBasic 107, EditDistance 169, ReverseLinkedList 79, ValidateBST 418, Dijkstra 79/85/89, LRUCache 215, NextGreaterElement 158, LongestSubstring 357, ValidAnagram 190, Heapify 176, CircularQueue 134/140/154/168, CountingBits 247, JobScheduling 143/149.

**Some input is changed or dropped silently:**
- `filter(!isNaN)` drops bad tokens in MaximumSubarray and BinarySearchBasic.
- The LRU regex drops lines it can't match.
- BinarySearchBasic sorts the array.
- EditDistance and ValidAnagram change the case.

Only CircularQueue reports an error inline, during the run (472).

**Proposed `inputs` schema:**
```ts
type InputSpec =
 | { key; kind:'numberList'; label; default:number[]; min?; max?; minLen?; maxLen?; sorted?:'require'|'auto' }
 | { key; kind:'string'; label; default; charset?:RegExp; maxLen?; transform?:'upper'|'lower' }
 | { key; kind:'number'; label; default; min; max; step? }
 | { key; kind:'select'; label; options:{value,label}[]; default }
 | { key; kind:'toggle'; label; default:boolean }
 | { key; kind:'tree'; label; default:(number|null)[] }                          // level order
 | { key; kind:'ops'; label; grammar:{ name; args:('int'|'str')[] }[]; default:string }
 | { key; kind:'tuples'; label; arity:number; fields:string[]; default:number[][] }
 | { key; kind:'graph'; label; default:{ nodes; edges:[u,v,w][]; directed } }
 | { key; kind:'custom'; render:(value,onChange)=>ReactNode; default };           // escape hatch
// every kind also accepts: random?: () => value
// examples: { label, values: Record<key, value> }[]
// validate?: (values) => { [key]: string } | null   → errors shown inline under the field, never alert()
```

**Files that don't fit the simple kinds:** AStar (painting, needs `custom`), Dijkstra (`graph`), LRUCache and CircularQueue (`ops`), ValidateBST (`tree`), JobScheduling (`tuples`), and CountingBits' bit-width select, which is a view option rather than an input.

## 4. Code listing conventions

- **C++:** BinarySearchBasic, NextGreaterElement (in both modes), LongestSubstring, Dijkstra, and the default tab of EditDistance and ValidAnagram.
- **JS-like pseudocode:** MaximumSubarray and BubbleSort ("pseudocode.js").
- **Multi-language tabs (C++, Python, Java):** EditDistance and ValidAnagram. Their highlights are wrong on the non-C++ tabs.
- **Token formats:** listings use four different shapes (`{l,c:[{t,c}]}`, `{l,t}`, `{line,content}`, and an object map), none of which match CodePanel's `{n,tokens:[{t,k}]}`.
- **What drives the highlight:** the snapshot `line` in every step-history file. PalindromeCheck (325-346) and FindMaxElement (310-328) instead drive it from ad-hoc flags. Those two, and AStar, have no step history, so you can't scrub backward.

**Recommendation:** one listing per mode, in one language (C++, which most files already use and which suits the judge), written as plain strings. Tokenise automatically in CodePanel; hand-written token arrays are where cheap models make mistakes. The step's `line` refers to a 1-based index into `code.lines`, checked in dev. If you add more languages later, each needs an explicit `lineMap`.

## 5. Critique of the target design (BubbleSort plus the library)

- **Header:** the two-line Monument title at `clamp(2rem,4vw,3.5rem)` plus the eyebrow takes about 130px (VisualizerHeader.jsx 38-64). The "BUBBLE / SORT." split is invented per file. Controls sit in the header's right slot and wrap under the title below about 1400px. Change: a single 28-32px title row with category, a difficulty chip and a short description; controls move to a toolbar.
- **Idle state:** a blank page with "AWAITING INPUT" at rgba(255,255,255,.18) (IdleState.jsx 40-46), an 11px dim message, and `dangerouslySetInnerHTML` with inline hex (BubbleSort 170). Change: generate step 0 from the default example on mount so there is no Run gate. Show example chips, the complexity table and the legend before anything plays.
- **ControlBar discoverability:**
  - Once loaded, the input disappears, so you have to Reset to edit (ControlBar 64-90).
  - Icon buttons have no labels, `aria-label`s or tooltips.
  - Reset is a red icon only.
  - The "spd" slider is inverted and unlabelled.
  - There is no first/last step.
  - The ←/→/Space bindings aren't shown anywhere.
  - The step counter is 10px.

  Change: keep inputs editable, with Apply regenerating in place. Add a timeline scrubber (drag to any step), buttons for ⏮ ◀ ▶/⏸ ▶ ⏭, speed presets (0.5×, 1×, 2×, 4×) and a keyboard-hint popover.
- **Density and contrast:** text is 9-12px mono throughout. `V.dim` is rgba(255,255,255,.28) on #09090b, about 2.4:1, which fails WCAG AA; LABEL_STYLE uses it at 9px. The base size should be 12-13px, with labels at 10-11px and at least 4.5:1 contrast.
- **Layout:** the grid is fixed at `300px 1fr 220px` with no breakpoints (BubbleSort 181), and the shell padding is a fixed 32px 48px (VisualizerShell 21). Array cells are absolutely positioned at `index*4.5rem`, so about 14 or more elements overflow at 1280.
  - At 1280 the stage is about 620px.
  - At 1920 the width is wasted.
  - On mobile it breaks, because nothing collapses.

  Proposed layout:
  - At 1440 and up: code (360) | stage | inspector (280: variables, stats, legend).
  - At 1280: code | stage, with the inspector as a strip under the stage.
  - Below 1024: a single column with the stage first, a sticky bottom control bar, and code in a collapsible tab.
  - Embedded: stage plus mini-controls only.

  Stage cells should scale to fit, with horizontal scroll as a last resort.
- **Stat blocks:** 28px Monument numbers in a 220px column take prime space. "Progress %" repeats the ProgressBar and the step counter. Change: a compact inline stat strip under the stage, with algorithm variables (i, j, maxSum…) shown next to the counters.
- **Narration:** the current step's message only appears inside a cumulative log. Change: a prominent one-line caption directly under the stage, with the log collapsible.
- **Complexity footer:** it only appears after load and is static prose at 10.5px. Change: a best/avg/worst table for time and space, visible in the idle state, placed in an About tab or the inspector.
- **Other issues:**
  - `CustomCursor` plus `cursor:none` hurts accessibility; drop it.
  - The theme is dark-only hard-coded hex, so there is no light mode.
  - Panel titles like "pseudocode.js" vary by file.
  - Legend variants duplicate each other.

For dual theme: make theme.js `V` export `var(--viz-*)` strings, so the existing inline styles keep working, and define the variables under `:root` and `.dark`. For zero radius: add `.viz-root *{border-radius:0!important}` plus a lint or grep check that bans `rounded` in `pages/algorithms`.

## 6. Recommendation: (b), with a custom-view escape hatch

**Why:** the step-history pattern already exists in almost every file, so moving to templates is mostly moving code, not redesigning it. Under (a), a cheap model rewrites 350-700 lines of hand-written JSX and state plumbing per file. That is exactly how the current drift (radius, gradients, colours) came about, and it would recur in all 145 files. Under (b), consistency is enforced by the archetypes: array, array plus side structures (stack, map, results), matrix, linked list, tree, graph, grid, and ops/design.

**Per-file output for a cheap model:**
- (a): about 350-700 lines, a full-file rewrite.
- (b): about 70-130 new lines (meta 10, code 15-25, legend 5-8, inputs and examples 10-20, view adapter 20-50, stats 5), plus the generator copied almost verbatim (60-250 lines). That's about 150-350 lines in total, most of it copied.

**Risks with (b):**
1. Unusual pages need `view.render` custom: AStar, NetworkFlow, Kruskal, TowerOfHanoi, Sudoku, possibly Trees/AVLTree.
2. Files without a step history (FindMaxElement, PalindromeCheck, AStar) need a new generator. Give those to a stronger model.
3. `line` mismatches and missing `line` (MaximumSubarray, NextGreaterElement, LRUCache, EditDistance and ValidAnagram tabs) must be fixed; the dev assert makes them visible.
4. Some snapshots bake in layout (ReverseLinkedList x/y), so adapters have to ignore it.
5. The default export must stay a React component so routes and lazy imports don't change.

**API sketch:**
```ts
type Tone = 'neutral'|'active'|'compare'|'write'|'success'|'visited'|'dim'|'window'|'error';
type Step = { line?: number; msg: string; phase?: 'info'|'try'|'place'|'success'|'fail'|'done'; [k: string]: unknown };

interface ModeSpec<I> {
  label: string;                              // "Brute force" | "Optimal"
  generate: (input: I) => Step[];             // pure; no React
  code: { lang: 'cpp'|'java'|'python'|'pseudo'; lines: string[]; title?: string };
  complexity: { time: { best?; avg; worst }; space: string; note?: string };
}

defineVisualizer<I>({
  meta: { id: string; title: string; category: string; difficulty?: 'easy'|'medium'|'hard'; summary: string };
  inputs: InputSpec[];                          // see §3
  examples: { label: string; values: Partial<I> }[];   // [0] auto-loads on mount
  parse?: (raw: Record<string, unknown>) => I;  // throw FieldError(key, msg) → shown inline
  validate?: (input: I) => Record<string, string> | null;
  // single mode: generate + code + complexity at top level; OR
  modes?: Record<string, ModeSpec<I>>;          // shared inputs; switching regenerates from the same
  defaultMode?: string;                         // parsed input and resets to step 0 (replaces useModeHistorySwitch)
  legend: { tone: Tone; label: string }[];
  view: {
    archetype: 'array'|'arrayAux'|'matrix'|'list'|'tree'|'graph'|'grid'|'ops';
    map: (step: Step, input: I, mode: string) => ArchetypeProps;   // e.g. array:
    // { cells: { value, tone, sub? }[]; pointers: { index, label, role: 1|2|3 }[];
    //   band?: { from, to, tone: 'window'|'error' }; aux?: { title, kind: 'stack'|'map'|'list'|'kv', items }[] }
  } | { render: (step: Step, input: I, mode: string) => ReactNode };   // escape hatch
  stats?: (step: Step, i: number, total: number) => { label: string; value: string|number; tone?: Tone }[];
  embed?: {                                     // judge drawer contract
    fromExternalArray: (arr: number[]) => Partial<I>;   // e.g. arr => ({ nums: arr })
    compact?: true;                             // stage + mini ControlBar + caption; no header/code/log/footer
  };
}): React.FC<{ embedded?: boolean; externalArray?: number[]; navigate?: Function }>;
```

**Judge drawer contract:** VisualizerDrawer renders `<VisualizerComponent embedded externalArray={testArray} navigate={() => {}} />` inside an `h-[360px]` box. The component `defineVisualizer` returns will:
1. Accept those same three props.
2. When `externalArray` is set and `embed` is defined, merge `embed.fromExternalArray(arr)` into the inputs, regenerate, and reset to step 0 in a `useEffect([externalArray])`. This matches FindMaxElement 14-20.
3. When `embedded` is true, render the compact layout at `height:100%`, with the stage fitted to the 360px height.
4. Ignore `externalArray` if `embed` is absent.

The drawer uses shadcn tokens and `dark:` classes, so the `--viz-*` variables have to follow the same `.dark` switch for both themes to work there.

The shell owns everything else: playback, keyboard, scrubber, autoplay, speed, layout breakpoints, idle-as-example, inline errors, tokenisation, the line-range assert and zero radius. That's why the per-file work stays small.

RELEVANT FILES (ranked by importance):
  1. src/pages/algorithms/Sorting/BubbleSort.jsx — The target pattern: generator-to-history structure, library usage, the fixed grid layout under critique
  2. src/pages/judge/VisualizerDrawer.jsx — Defines the embedded / externalArray / navigate contract and the 360px box that defineVisualizer must honour
  3. src/components/visualizer/ControlBar.jsx — Playback UX being critiqued: input hidden after load, no labels, inverted speed slider
  4. src/components/visualizer/theme.js — Dark-only hard-coded tokens, the yellow accent that conflicts with #5542FF, the basis for the --viz-* token mapping
  5. src/pages/algorithms/Stack/NextGreaterElement.jsx — Typical legacy multi-mode file: pure generators that lift as-is, plus the line-number mismatch a dev assert would catch

NOTE: Line ranges have been extended by ~50 lines to provide additional surrounding context.