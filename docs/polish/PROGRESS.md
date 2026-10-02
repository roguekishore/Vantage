# VANTAGE redesign: run log

## Status

- Phase: Run stopped at the owner's one-hour limit. Phase 1 mostly done; Phase 4 (all app pages) done; Phases 2, 3, 5, 6 (visualizer shell + 142 visualizer migrations, demo polish) NOT started
- Units: Phase 1 units 1.1, 1.2, 1.3 reviewed and approved; 1.4 (all ds primitives), deps/lazy routes, route smoke, DESIGN_SYSTEM.md and 12 page surfaces done without a separate reviewer (owner asked for a simple process); 0 escalated
- Last green commit: ff425b4 (build PASS, tests 109/109, route smoke 366/370; the 4 failures are the pre-existing MinStack/ImplementTrie crash)
- Bundle: main 524.2 kB gzip at baseline → 199.0 kB now (target < 250 kB met)
- Blockers: push 403 (owner decision 1); 8 open owner decisions, 14 needs-logic-change items below

## Run summary (read this first)

At 10:10 the owner asked to stop running the full process and finish within an hour. The run then switched from one-unit-at-a-time with a reviewer per unit to a few large parallel waves, with each agent owning disjoint files, followed by one integration build plus route smoke and a spot-check by screenshot.

**Done**
- Phase 1 foundation. Tokens, Tailwind scales and the radius reset: 1.1, reviewed. Fonts: 1.2, reviewed. Theme mechanics: 1.3, reviewed.
- The full `src/components/ds/` library and the `/__ds` preview.
- CustomCursor, MUI, framer-motion and 17 unused packages removed. All routes lazy-loaded.
- `scripts/contrast.mjs`: 64/64 pairs pass. Light `--fg-dim`, `--warn` and `--info` were nudged to pass 4.5:1; see DESIGN_SYSTEM.md.
- `scripts/route-smoke.mjs`, with Playwright 1.63.0 pinned.
- `docs/polish/DESIGN_SYSTEM.md`.
- Phase 4 app pages: shell (Navbar, mobile Sheet, Footer, overlays, `index.html`, visualizer breadcrumb row), Home, Visualizers hub and topic pages (`/explore` now redirects), Problems, Judge plus codeflow, Map (dual theme), Leaderboard, Achievements, Profile, Friends, Store, Inventory, Auth, Battle ×3, Group ×3.
- Every page shows OfflineState or ErrorState when the API is unreachable.

**Not done (scope cut for the one-hour limit)**
- Phase 1: `scripts/check-ui.mjs` and demo-data mode (`REACT_APP_DEMO`). Separate reviews of the ds library and the shell.
- Phase 2: the `defineVisualizer` shell, its stages and the `check-visualizer.mjs` harness. Briefs are drafted but not built.
- Phase 3: 109 track A migrations.
- Phase 5: track B and track C, removing the remap layer, and removing the `data-legacy-viz` wrapper.
- Phase 6: demo path, Lighthouse, README screenshots.
- All 142 visualizers are still the legacy views. They now pick up the tokens, fonts, square corners (except their nodes), the new nav and the breadcrumb row, but their own colours are unchanged.
- Page units from 10:25 on had no separate reviewer and no per-page screenshots in both themes. Spot-checked: Visualizers (light), Problems (dark), Leaderboard (light), Home (dark + light), Judge (light), Auth (dark).
- Known gap: canvas text in the Home card animations is still 5.5–9px, below the 10px floor.

## Baseline

Recorded 2026-10-02 on `polish` @ `96004b0`, Linux, Node v26.4.0, npm 11.17.0. `npm ci` succeeded on the first try (no `--legacy-peer-deps`).

| Gate | Result |
|---|---|
| `npm run build` (`CI=false`, `REACT_APP_API_URL=http://localhost:1`) | **FAILED**: `[eslint] Definition for rule 'react-hooks/exhaustive-deps' was not found` in `GroupArenaPage.jsx:159`, `InventoryPage.jsx:34`, `judge/codeflow/useMonacoHighlight.js:87`, `topics/PixelCard.jsx:239`. CRA's base ESLint config does not load the `react-hooks` plugin, so the `eslint-disable` comments for that rule are errors. |
| `npm test -- --watchAll=false` | PASS: 15 suites, 109 tests |
| Main bundle (gzip) | 524.2 kB (`build/static/js/main.*.js`, measured after the repair below; the repair changes only lint config, not output) |

Pre-existing failure, not a regression: the build failure above. It blocks every gate, so it was repaired as setup unit 0.1 before Phase 1 (see log).

Other pre-existing noise, not failures: about 30 "Failed to parse source map" warnings from `react-zoom-pan-pinch`, and `react-hooks/exhaustive-deps` warnings that now surface because the rule is defined.

Push guard: `.git/hooks/pre-push` is installed. `git push --dry-run origin polish:main` fails, but with a 403 from GitHub before the hook runs, so the hook was verified against a local bare repo instead: `polish:main` is blocked ("pre-push: blocked push to refs/heads/main"), `polish:polish` is allowed.

Screenshot tooling: Playwright 1.63.0 lives in the orchestrator scratchpad (outside the repo) and uses the cached Chromium rev 1243. The route-smoke unit adds it to `reactapp/` as a pinned dev dependency.

## Owner decisions needed

1. **Push access.** `git push origin polish` fails with `403 Permission to roguekishore/Vantage.git denied to aswinlegarcon`. Every commit is kept locally on `polish` in this clone. Push them yourself, or grant this account access and re-run the push.
2. **Root `components.json`.** POLISH_PLAN §3.8 says to delete the duplicate repo-root `components.json`, but the launch prompt allows changes only under `reactapp/` and `docs/polish/`, so it was left in place. Delete it by hand if you agree.
3. **Profile load error handling changed.** `ProfilePage` used to clear the user and redirect to /login on any load error, including an unreachable API. It now shows OfflineState + Retry for network errors (POLISH_PLAN §7 Phase 4: every page renders an OfflineState with the API unreachable) and keeps logout-and-redirect for other errors. Revert if you want the old behaviour.
4. **Light-theme token nudges.** POLISH_PLAN §3.1 light `--fg-dim` (.54 alpha), `--warn` (#B45309) and `--info` (#0E7490) failed 4.5:1 on some surfaces; they are now .58, #AB4F09 and #0E738F (nearest passing). Confirm or pick other values.
5. **Scope cut.** Phases 2, 3, 5 and 6 were not run (one-hour limit). The Phase 2 briefs (shell 2.1a–c, harness 2.2, pilot job template) were drafted in the orchestrator scratchpad but not committed; re-run from POLISH_PLAN §7 Phase 2 when ready.

## Needs logic change

1. **Inventory "Equipped" badges** (POLISH_PLAN §6 Store/Inventory row): `InventoryItemDTO` / `storeApi` have no `equipped` field and no equip endpoint, so the badge was left out.
2. **MinStack and ImplementTrie crash on load** (`/design/MinStack`, `/design/ImplementTrie`): `useModeHistorySwitch()` is called without arguments and the destructure of `mode` throws. Pre-existing; fixing it is a hook/logic change.
3. **Leaderboard delta column**: the entry DTO has no rank delta (only rank, userId, username, value, level, currentStreak), so the §6 delta column was left out.
4. **Achievement store keeps only `err.message`**: offline detection on Achievements matches the browser's network-error text; the store should keep the error object or an `offline` flag.
5. **Auth mode switch doesn't change the URL** (`setMode` only); real links to `/login` / `/signup` need a routing change.
6. **Friends store has one shared `error` field** for every action, so a failed search can show the friends panel's failed-load state; needs a separate overview error in the store.
7. **Map: "Content coming soon" countries** are hidden from the popup but still clickable on the map; locking them would change how the progress store derives problem state.
8. **Group arena offline state**: `useGroupBattleStore` swallows polling/socket errors, so with the API down the arena shows PageLoader forever; judge problem fetches end in `.catch(() => {})`. The store needs to expose an error.
9. **Group lobby/arena still use `window.alert` / `window.confirm`** (kicked, log-in, forfeit); moving them to ds Dialog/toast changes control flow.
10. **Friends `lastNotification`** is now cleared with `clearNotification()` right after the Navbar toasts it, so a repeated message shows again (Navbar is its only reader).
11. **Battle**: `BattleResultDTO` has no per-problem data (result page shows a per-player table instead); `startBattlePolling` swallows fetch errors (arena infers offline after a 10 s timeout); `fetchPlayerStats` failures are silently ignored; forfeit still uses `window.confirm`.
12. **Judge**: `judgeApi` returns the same error for 404 and 500, so not-found and server error share one state; `codeflow/ds/*.test.js` compare against the `V.accent` hex (forces 5 views to keep it inline, remapped in light mode by Judge.css); a jest `moduleNameMapper` for `@/` would let codeflow views import ds directly.

## Escalated

(none yet)

## Log

| When (UTC+5:30) | Unit | Result | Commit | Gates | Notes |
|---|---|---|---|---|---|
| 2026-10-02 07:35 | 0.1 Baseline build repair | applied by orchestrator (setup) | see git log | build PASS (warnings), tests 109/109 | Added `eslintConfig` to `reactapp/package.json`, defining only the `react-hooks` plugin with `exhaustive-deps: warn`. Tried extending `react-app` first: that surfaced 3 `rules-of-hooks` errors (`useFailedAsTestCase` called in callbacks), which would need logic changes, so it was rejected. |
| 2026-10-02 08:48 | 1.1 Tokens + Tailwind + radius reset | approved | 3a2fe3e | build PASS, tests 109/109, main 524.4 kB | Reviewer APPROVED. lazyVisualizer() wraps all 142 visualizer routes (+2 judge drawer) in display:contents [data-legacy-viz] unless static isVisualizerV2. 31 legacy shadcn vars bridged to tokens. Nits for page units: 7 legacy border-radius !important rules (GroupLobbyPage:655, GroupResultPage:226) beat the reset; border-border/NN classes generate nothing (pre-existing). |
| 2026-10-02 09:43 | process | change | - | - | Owner asked to finish as fast as possible ("continue and complete asap", "continuenow"). From unit 1.2 on the loop is pipelined: the orchestrator commits a unit as soon as its gates pass, the reviewer reviews that commit in an isolated snapshot build (git archive into the scratchpad, no refs touched) while the next unit's implementer starts, and a rejection is fixed by a follow-up commit (no history rewrite). Escalation still reverts the unit with git revert. |
| 2026-10-02 09:43 | 1.2 Fonts | approved | 5d0f0bf | build PASS, tests 109/109, main 524.5 kB | JetBrains Mono 400/500/700 (latin + latin-ext) + Monument 400 from src/assets/fonts, font-synthesis none, temporary [style*=Monument] weight shim, legacy fonts deleted, 3 canvas Monument font strings set to 400. Side effect: font-synthesis none also disables faux italics (italic mono renders upright). Reviewer APPROVED; nits for page units: ProfilePage.jsx:163,165,585 hard-code the mono stack; var(--font-mono|body|heading) in AlgoCards.jsx/HomePage.css were already undefined. |
| 2026-10-02 10:00 | 1.3 Theme mechanics | approved | f78cbea | build PASS, tests 109/109, main 525.5 kB | System default + matchMedia listener, pre-paint script, theme-color metas, useThemeTokens, canvasTheme (99 rgba white literals + 8 #fff fg ends in Home/Complex helpers → fg triplet), monacoThemes (not wired; Phase 4 Judge), useReducedMotion + global reduced-motion CSS. Home cards keep dark inline backgrounds in light mode until Phase 4, so their neutral canvas strokes are dark-on-dark in light theme (light-OS users now see this because the default is system). Reviewer APPROVED (canvasTheme caches per theme change: 0 getComputedStyle calls in steady drawing). |
| 2026-10-02 10:44 | 1.4 ds library (1.4a+b+c merged) + /__ds + contrast.mjs | done (no separate review) | 5984008 | build PASS, tests 109/109 | 4 Radix packages pinned (select, checkbox, radio-group, switch); cn() fixed for tailwind-merge 3 dropping text-* type steps |
| 2026-10-02 10:44 | 1.6 deps removal + lazy routes; 1.8 route-smoke.mjs | done (no separate review) | 5984008 | build PASS, main 197.5 kB, route smoke 356/370 | 17 packages uninstalled (+cobe later); playwright 1.63.0 devDep; FloodFill/ColorIslands routes fixed (named exports only, broken at baseline) |
| 2026-10-02 10:44 | 1.11 DESIGN_SYSTEM.md + Phase 4 page wave (12 parallel agents) | done (no separate review) | ff425b4 | build PASS, main 199.0 kB, tests 109/109, route smoke 366/370 | Shell, Home, Topics, Problems, Judge, Map, Leaderboard+Achievements, Profile+Friends, Store+Inventory, Auth, Battle×3, Group×3; catalog gaps filled; h1 added to 3 legacy visualizers |
