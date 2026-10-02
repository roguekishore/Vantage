# VANTAGE redesign: run log

## Status

- Phase: 1 Foundation (in progress)
- Units: 0 approved / 0 escalated (plus setup unit 0.1, baseline build repair)
- Last green commit: (pending first commit)
- Bundle: main 524.2 kB gzip at baseline
- Blockers: `git push` returns 403 for the local GitHub account (see Owner decisions needed); work is committed locally

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

## Needs logic change

(none yet)

## Escalated

(none yet)

## Log

| When (UTC+5:30) | Unit | Result | Commit | Gates | Notes |
|---|---|---|---|---|---|
| 2026-10-02 07:35 | 0.1 Baseline build repair | applied by orchestrator (setup) | see git log | build PASS (warnings), tests 109/109 | Added `eslintConfig` to `reactapp/package.json`, defining only the `react-hooks` plugin with `exhaustive-deps: warn`. Tried extending `react-app` first: that surfaced 3 `rules-of-hooks` errors (`useFailedAsTestCase` called in callbacks), which would need logic changes, so it was rejected. |
