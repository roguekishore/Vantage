# UI roadmap

The design system, the app shell and every app page are shipped (`docs/design-system.md`). What remains is the
visualizers, the cleanup that depends on them, and the demo path.

## Visualizer migration

State, from `docs/visualizer-manifest.json`:

| Track | Files | Done | What it involves |
|---|---|---|---|
| A | 119 | 10 | Lift the existing step generator, write the config |
| B | 18 | 2 | No step history (imperative timers): write `generate()` first, then the config |
| C | 4 | 0 | Custom stage through the `view.render` escape hatch: AStar, Pathfinding/BFS, NetworkFlow, TowerOfHanoi |
| D | 3 | 0 | Delete: `Arrays/4Sum.jsx`, `Trees/validBST.jsx`, `Arrays/VizualiserPointer.tsx` |
| alias | 1 | 0 | `Stack/SubarrayRanges.jsx` becomes `export { default } from "../Arrays/SubarrayRanges";` |

The 12 done files are the 10 pilots (one per stage kind) plus `FindMaxElement` and `FindMinElement`.

**Before starting:** `check-visualizer` compares each new file against the legacy generator from git history. Create the
tag it reads, on the last commit that still has the legacy files untouched (the commit that added the redesigned app
shell, before the first migration):

```sh
git tag viz-legacy <that-commit>
```

**The job, per file** (the contract is in `docs/visualizer-contract.md`; copy `Sorting/BubbleSort.jsx` and the pilot with
the same stage kind):

1. Find the generator (`generate*History`, `build*Steps`). Copy its logic into a top-level pure `generate(input)`
   returning `Step[]`. Allowed edits only: replace `setHistory(x)` with `return x`; read inputs from the `input`
   parameter instead of component state; turn `alert()` and invalid-input early returns into validation in `parse`
   (`throw fieldError(key, "...")`); add `msg` to snapshots that lack one; renumber `line` only when the manifest note
   says so; drop layout-only fields (`x`, `y`, widths, colours, class names). Loops, conditions, arithmetic, snapshot
   values and message wording stay.
2. Move input parsing into `parse`. Never sort, dedupe or drop user input silently; reject it with a message.
3. Fill `meta`, `inputs`, `examples` (the old defaults first), one C++ listing per mode as plain strings (translate
   pseudocode line for line if that is all the old page had), `complexity`, `legend` (only tones the map emits), `view.map`
   and 2 to 4 `stats`. Use `modes` if the old page had brute-force and optimal tabs. Add `embed` only for the judge drawer.
4. The file must contain no JSX, `className`, `style`, colour literals, hooks, listeners, `alert`, `console` or imports other
   than `@/components/visualizer`. If the algorithm cannot be expressed with the manifest's stage kind plus its aux
   panels, or lifting the generator would change what it computes, stop and mark the entry `escalated`.
5. Run `node scripts/check-visualizer.mjs <file>`, then `npm run build`, then look at it in the browser in both themes.
   Update the manifest `status`.

Note: running the parity check with default flags on two already-migrated pilots (`Sorting/BubbleSort`, `Graphs/Dijkstra`) reports differences (step count 10 vs 42; `phase` added to the first step). The pilots were migrated with enriched steps, so treat parity as a check for the straight lift of a legacy generator, and use `--allow-renumber`, `--ignore` or `--legacy-input` (see `docs/visualizer-contract.md`) when a difference is intentional.

Known per-file hazards (also in manifest `notes`):

- `Arrays/MaximumSubarray`, `Stack/NextGreaterElement`: `line` values do not match the listing; renumbering is allowed.
- `Design/LRUCache`: snapshots have no `line`; add it.
- `DynamicProgramming/EditDistance`, `Hashing/ValidAnagram`: the multi-language tabs share C++ line numbers; keep C++ only.
- `LinkedList/ReverseLinkedList`: snapshots bake `x`/`y`; drop them, the `list` stage lays out.
- `Graphs/Dijkstra`, `Trees/ValidateBST`, `BinarySearch/BinarySearchBasic`: the generator reads component state or is
  inlined in `load()`. `BinarySearchBasic`'s silent sort becomes a validation error ("array must be sorted") plus a "Sort
  for me" example.
- `Arrays/FindMaxElement`, `Arrays/FindMinElement`: must define `embed.fromExternalArray`.
- 64 legacy files have titles that are invisible in production (`metrics.titleInvisibleInProd`); that is a quick way to
  find pages that look broken today.

Order: waves 2 to 6 of track A in manifest order, then track B (18 generators, with expected output checked by hand
because there is no legacy generator to compare), then track C, then the track D deletions and the alias.

**Acceptance for the migration:** the manifest shows every entry `done`; `grep -rl "className=" src/pages/algorithms` is
empty; route smoke passes on all 142 visualizer routes in both themes and every migrated route renders the new stage;
back-stepping works on every page that used to be imperative.

Shell gaps found by the pilots (fix in the shell, not per file) are listed at the end of `docs/visualizer-contract.md`.

## Cleanup after the last visualizer migrates

Not before: legacy visualizers depend on all of this.

- Delete the light-mode remap layer: `ZINC_LIGHT_SCOPE_PATHS` and `MAP_DARK_LOCK_PATHS` in `App.jsx`, the matching rules
  in `index.css`, and the `.battle-page` purple variables.
- Delete `LegacyVizRoot` / `[data-legacy-viz]` and the radius-reset exclusion that goes with it.
- Delete the Monument faux-bold shim in `fonts.css`, the legacy `--color-*` and `theme-*` aliases, and
  `src/components/ui/*` once its last importer has moved to `ds/`.
- Switch `scripts/check-ui.mjs` from warning to error mode for `src/**`, including `src/pages/algorithms/**`.
- Fix the 11 legacy visualizers whose Back button calls an undefined `navigate` prop (they disappear with migration).

## Demo polish

- **Demo-data mode.** `REACT_APP_DEMO=1` was planned and not built: fixtures in `src/demo/` for stats, leaderboard, map
  progress, problems and a fake signed-in user, so protected pages (Profile, Battle, Friends, Store, Inventory) can be
  built and checked with the backend down. The switch must sit in one place in the API layer and change nothing when off.
- **A 15-minute demo path** that works with the backend down: Home, Visualizers, Dijkstra, Problems, Judge (run plus
  code flow), Map, Battle lobby, Leaderboard. Extend the fixtures wherever it still shows an empty state.
- Copy pass: sentence case, no hype, real counts. Re-shoot the README screenshots and GIFs in both themes.
- Lighthouse accessibility of at least 90 on Home, Problems, one visualizer and Judge, in both themes.
- Home canvas text is still 5.5 to 9px in places, below the 10px floor.
- Fix the topics catalog gaps (Graphs shows 1 card, Heaps 3, 11 routed visualizers are unlisted, 5 cards are dead, Sudoku
  appears twice) when the Topic page is next touched.

## Blocked on a logic change

Found while redesigning the pages. Each needs a store, hook or API change, not a styling change.

1. **Inventory "Equipped" badges:** `InventoryItemDTO` and `storeApi` have no `equipped` field and there is no equip endpoint.
2. **MinStack and ImplementTrie crash on load** (`/design/MinStack`, `/design/ImplementTrie`): `useModeHistorySwitch()` is
   called without arguments and the destructure of `mode` throws. Route smoke excludes them (366 of 370 pass).
3. **Leaderboard delta column:** the entry DTO has no rank delta.
4. **Achievements offline detection** matches the browser's network-error text because the store keeps only `err.message`;
   keep the error object or an `offline` flag.
5. **Auth mode switch does not change the URL** (`setMode` only); real `/login` and `/signup` links need a routing change.
6. **Friends store has one shared `error` field** for every action, so a failed search can show the friends panel's
   failed-load state; add a separate overview error.
7. **Map:** "Content coming soon" countries are hidden from the popup but still clickable; locking them changes how the
   progress store derives problem state.
8. **Group arena offline state:** `useGroupBattleStore` swallows polling and socket errors, so with the API down the arena
   shows `PageLoader` forever, and judge problem fetches end in `.catch(() => {})`. The store needs to expose an error.
9. **Group lobby and arena still use `window.alert` / `window.confirm`** (kicked, log-in, forfeit); moving them to the ds
   `Dialog` or toast changes control flow. Battle forfeit also uses `window.confirm`.
10. **Battle:** `BattleResultDTO` has no per-problem data (the result page shows a per-player table instead);
    `startBattlePolling` swallows fetch errors (the arena infers offline after 10 s); `fetchPlayerStats` failures are
    ignored.
11. **Judge:** `judgeApi` returns the same error for 404 and 500, so not-found and server error share one state. The
    `codeflow/ds/*.test.js` files compare against the `V.accent` hex, which forces five views to keep it inline; a jest
    `moduleNameMapper` for `@/` would let them import ds directly.
12. **Profile load errors:** an unreachable API now shows an offline state with Retry instead of logging out; revert if
    the old behaviour is preferred.

Light-theme token values that were nudged to pass 4.5:1 (`--fg-dim`, `--warn`, `--info`) are recorded in
`docs/design-system.md`; confirm or choose other values.
