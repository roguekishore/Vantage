# VANTAGE redesign: run log

## Status

- Phase: 1 Foundation (in progress, next 1.4a ds part 1)
- Units: 3 approved-or-pending / 0 escalated
- Last green commit: f78cbea
- Bundle: main 525.5 kB gzip (baseline 524.2)
- Blockers: push 403 (owner decision 1)

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

## Needs logic change

(none yet)

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
