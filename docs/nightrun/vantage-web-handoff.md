# vantage-web — Handoff Report (Phase H)

## 1. Migration Phases Status

From `../PROGRESS.md`:

| Phase | Description | Status | Commit |
|---|---|---|---|
| W1 | `reactapp`: CRA to Vite 8, Tailwind 4, React 19.3 | Done | `4c66aba7c3` |
| W2 | `judge`: Node 24 and Express 5 | Done | `d33176fc86` |
| R | Review and fix | Done | `e34fb940ba` |
| H | Handoff report | Done | current |

---

## 2. Gate Results

Both application directories and the scope gate pass all requirements:

### `reactapp` (`GATE PASS [reactapp]`)
- **Version assertions**: Vite 8.3.5 (`^8.3`), React 19.3.0 (`^19.3`), React DOM 19.3.0 (`^19.3`), Tailwind CSS 4.3.3 (`^4.3`), `@tailwindcss/vite` 4.3.3; `react-scripts` completely removed.
- **Clean install**: `npm ci` succeeds cleanly (502 packages installed).
- **Production build**: `npm run build` succeeds in 1.79s and outputs to `build/` (`build/index.html` present).
- **Unit test suite**: `npm test` runs Vitest with jsdom; all 15 test files and 109 tests pass (0 failures, 0 skipped).
- **Route validation**: All 36 routes in `baseline/reactapp/routes.txt` were loaded in Chromium via Playwright. 0 uncaught errors occurred. Rich DOM content was captured and 36 screenshots were recorded into `../gate-reports/reactapp-after/`.

### `judge` (`GATE PASS [judge]`)
- **Version assertions**: Express 5.0.0 (`^5.0.0`), `engines.node` `>=24`; Dockerfiles (`Dockerfile`, `Dockerfile.catalog`, `Dockerfile.lambda`) upgraded to Node 24 (`node:24-slim` and `public.ecr.aws/lambda/nodejs:24`).
- **Clean install**: `npm ci` succeeds cleanly (77 packages installed, native `tree-sitter` bindings built for Node 24).
- **Unit test suite**: `npm test` passes all 94 unit and property-based tests via Node test runner (0 failed, 0 skipped).
- **Server startup**: `node src/index.js` successfully initializes, loads 157 problems, binds to port, and cleanly runs.

### Scope (`GATE PASS [scope]`)
- G7 verification passes: all changes are strictly within allowed directories (`reactapp/**`, `judge/**`, `docs/nightrun/**`).

---

## 3. Files Changed

Output of `git diff --stat $(cat ../baseline/sha)`:

```text
 docs/nightrun/vantage-web-review.md                |    67 +
 judge/Dockerfile                                   |     2 +-
 judge/Dockerfile.catalog                           |     4 +-
 judge/Dockerfile.lambda                            |     4 +-
 judge/package-lock.json                            |   581 +-
 judge/package.json                                 |     9 +-
 reactapp/craco.config.js                           |     9 -
 reactapp/{public => }/index.html                   |     6 +-
 reactapp/package-lock.json                         | 24752 +++++--------------
 reactapp/package.json                              |    31 +-
 reactapp/postcss.config.js                         |     6 -
 ...{useDSAConquestMap.js => useDSAConquestMap.jsx} |     0
 reactapp/src/index.css                             |    35 +-
 reactapp/src/{index.js => index.jsx}               |     0
 .../src/pages/algorithms/LinkedList/SwapPairs.jsx  |     2 +-
 reactapp/src/pages/auth/AuthPage.jsx               |     2 +-
 reactapp/src/pages/home/HomePage.jsx               |    32 +-
 .../{CodeFlowContext.js => CodeFlowContext.jsx}    |     0
 ...lowContext.test.js => CodeFlowContext.test.jsx} |     0
 .../{DryRunPanel.test.js => DryRunPanel.test.jsx}  |     0
 .../ds/{ArrayGrid.test.js => ArrayGrid.test.jsx}   |     0
 ...tSetMapView.test.js => ListSetMapView.test.jsx} |     0
 .../ds/{QueueView.test.js => QueueView.test.jsx}   |     0
 .../ds/{ScalarChip.test.js => ScalarChip.test.jsx} |     0
 .../ds/{StackView.test.js => StackView.test.jsx}   |     0
 .../codeflow/useCodeFlow.clamping.pbt.test.js      |    12 +-
 .../src/pages/judge/codeflow/useCodeFlow.test.js   |    12 +-
 .../judge/codeflow/useMonacoHighlight.test.js      |     8 +-
 reactapp/src/services/api.js                       |     2 +-
 reactapp/src/services/battleApi.js                 |     2 +-
 reactapp/src/services/groupBattleApi.js            |     2 +-
 reactapp/src/services/judgeApi.test.js             |     4 +-
 reactapp/src/services/realtimeUrls.js              |     2 +-
 reactapp/src/stores/useUserStore.js                |     4 +-
 reactapp/vite.config.js                            |    39 +
 35 files changed, 6134 insertions(+), 19495 deletions(-)
```

---

## 4. Dependencies Added or Removed

### `reactapp`
- **Removed**:
  - `react-scripts`: `^5.0.1` (replaced by Vite 8)
  - `@craco/craco`: `^7.1.0` (CRA override layer no longer needed)
  - `postcss`: `^8.4.32` (replaced by `@tailwindcss/vite`)
  - `autoprefixer`: `^10.4.16` (replaced by `@tailwindcss/vite`)
- **Added**:
  - `vite`: `^8.3.5` (Vite 8 build tool)
  - `@vitejs/plugin-react`: `^6.1.2` (React plugin for Vite)
  - `@tailwindcss/vite`: `^4.3.3` (Tailwind 4 Vite integration plugin)
  - `vitest`: `^5.0.5` (test runner replacing Jest)
  - `jsdom`: `^30.1.3` (DOM simulation environment for Vitest)
  - `vite-plugin-svgr`: `^5.2.0` (SVG component import support)
- **Updated**:
  - `react`: `^19.1.1` -> `^19.3.0`
  - `react-dom`: `^19.1.1` -> `^19.3.0`
  - `@types/react`: `^19.1.16` -> `^19.3.0`
  - `@types/react-dom`: `^19.1.9` -> `^19.3.0`
  - `tailwindcss`: `^3.4.1` -> `^4.3.3`
  - `@react-three/fiber`: `^9.5.0` -> `^9.8.2` (React 19 support)

### `judge`
- **Updated**:
  - `express`: `^4.21.2` -> `^5.0.0`
  - `tree-sitter`: `0.21.1` -> `0.22.4` (Node 24 native ABI compatibility)
  - `engines.node`: `">=18.0.0"` -> `">=24"`
- **Overrides**:
  - `tree-sitter`: `"$tree-sitter"` (pins transitive tree-sitter bindings across language parsers)

---

## 5. Environment-Variable and Build-Output Decisions

- **Environment variables (`reactapp`)**:
  - Vite does not expose `REACT_APP_*` by default. Configured `envPrefix: ['VITE_', 'REACT_APP_']` in `reactapp/vite.config.js`. This preserves 100% backward compatibility for all hosting environments injecting `REACT_APP_*` (e.g. `REACT_APP_API_URL`).
  - Source code accesses migrated from `process.env.REACT_APP_API_URL` to `import.meta.env.REACT_APP_API_URL` across 7 files (`api.js`, `battleApi.js`, `groupBattleApi.js`, `realtimeUrls.js`, `useUserStore.js`, `AuthPage.jsx`).
- **Build output (`reactapp`)**:
  - Configured `build.outDir: 'build'` in `reactapp/vite.config.js`. Deployments, Dockerfiles, and web servers expecting CRA's `build/` directory continue to locate `build/index.html` and bundled assets without configuration changes.
  - Path alias `@` resolved to `<appDir>/src` matching prior CRA/craco configuration.
  - Browser runtime shim: `define: { global: 'globalThis' }` and `window.global ||= window` configured to resolve `sockjs-client` references to Node `global`.
- **Backend runtime (`judge`)**:
  - Continues using standard Node `process.env` access.
  - Node base images pinned to `node:24-slim` and `public.ecr.aws/lambda/nodejs:24`.

---

## 6. Left Items (`docs/nightrun/vantage-web-left.md`)

- No left file was generated (`docs/nightrun/vantage-web-left.md` does not exist).
- Zero pending items, zero skipped migrations, and zero unresolved blockers.

---

## 7. Actions for Owner

1. **Review screenshots**: Inspect route rendering screenshots stored in `../gate-reports/reactapp-after/` to verify visual layout and styles under Tailwind 4.
2. **Hosting environment variables**: Confirm that deployment pipelines continue providing existing `REACT_APP_API_URL` (or any `REACT_APP_*` / `VITE_*` variables) during `npm run build`.
3. **Merge**: Merge branch `chore/stack-web` into the primary branch.
4. **Deploy**:
   - `reactapp`: Build with `npm run build` (outputs to `build/`) and deploy static bundle.
   - `judge`: Build and deploy Node 24 Docker images (`Dockerfile`, `Dockerfile.catalog`, `Dockerfile.lambda`).
