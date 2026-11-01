# vantage-web — Review and Fix Report (Phase R)

## Overview
Comprehensive review of the migration diff against `SPEC.md` (sections 2, 6, and 7), covering `reactapp` (CRA to Vite 8, React 19.3, Tailwind 4) and `judge` (Node 24, Express 5).

---

## Findings and Fixes

### 1. [HIGH / CRITICAL] Uncaught `ReferenceError: global is not defined` broke all 36 routes in Chromium
- **Severity**: Critical (High)
- **Location**: `reactapp/vite.config.js:8`, `reactapp/index.html:13`
- **Why**: `sockjs-client` (imported by `useBattleStore.js`, `useFriendsStore.js`, `useGroupBattleStore.js`) accesses the Node identifier `global` (`global.crypto`, `global.chrome`). In CRA/Webpack, `global` was automatically shimmed to `window`. In Vite, Node globals are not provided by default in the browser. When the production build was served in Chromium, an uncaught `ReferenceError: global is not defined` was thrown immediately upon bundle execution. This halted script execution across all 36 routes, resulting in `text: 0` and blank rendered screens.
- **Fix**: 
  - Added `define: { global: 'globalThis' }` to `reactapp/vite.config.js`.
  - Added inline fallback `<script>window.global ||= window;</script>` to `reactapp/index.html`.
- **Verification**: Rebuilt and evaluated all 36 routes with Playwright/Chromium via `routes.mjs`. All 36 routes now load with 0 uncaught errors and render complete DOM contents (e.g., root route `/` renders 6,160 characters). Full gate passes cleanly.

### 2. [LOW] Malformed `@import` placement in CSS causing CSS optimization warning
- **Severity**: Low
- **Location**: `reactapp/src/index.css:2`
- **Why**: `@import url('https://fonts.googleapis.com/...');` was placed after `@layer base` declarations. Standard CSS specifications require `@import` statements to precede all other rules aside from `@charset` and `@layer`. During Vite CSS optimization, this triggered a build warning (`@import rules must precede all rules aside from @charset and @layer statements`).
- **Fix**: Moved `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');` to the very top of `reactapp/src/index.css` before `@import "tailwindcss";`.
- **Verification**: `npm run build` now completes cleanly without any CSS optimization warnings.

### 3. [INFO] Environment variable access (`process.env` vs `import.meta.env`)
- **Severity**: Info (Pass)
- **Location**: `reactapp/src/services/api.js:11`, `battleApi.js:3`, `groupBattleApi.js:3`, `realtimeUrls.js:11`, `stores/useUserStore.js:97,131`, `pages/auth/AuthPage.jsx:8`
- **Why**: Checked against SPEC 6.1 requirement: `Replace process.env.REACT_APP_X with import.meta.env.REACT_APP_X`.
- **Result**: All 7 baseline references to `process.env.REACT_APP_API_URL` were cleanly replaced with `import.meta.env.REACT_APP_API_URL`. Zero occurrences of `process.env` remain in `reactapp`. In `judge/`, `process.env` is correctly used as standard Node backend environment access.

### 4. [INFO] Assets and `public/` directory paths
- **Severity**: Info (Pass)
- **Location**: `reactapp/index.html:10,16`, `reactapp/public/`, `reactapp/src/index.css:28-36`
- **Why**: Checked against SPEC 6.1 requirement: Move `public/index.html` to root, eliminate `%PUBLIC_URL%`, add `<script type="module" src="/src/index.jsx"></script>`.
- **Result**: `public/index.html` was moved to root `index.html`. `%PUBLIC_URL%` was replaced with absolute root-relative paths (`/algo.svg`). Assets in `reactapp/public/` (`_redirects`, `algo.svg`, `audio/`, `fonts/`, `img/`, `videos/`) remain intact. Font references in `src/index.css` (`MonumentExtended-Regular.otf`, `zentry-regular.woff2`) are properly resolved and bundled by Vite into `build/assets/`.

### 5. [INFO] Routing and base path configuration
- **Severity**: Info (Pass)
- **Location**: `reactapp/vite.config.js:28-34`, `judge/src/routes/`
- **Why**: Checked against SPEC 6.1 and 7.
- **Result**: `vite.config.js` sets `server.port: 3000`, `build.outDir: 'build'`, `envPrefix: ['VITE_', 'REACT_APP_']`, and alias `@` -> `src`. Judge routes (`/problems`, `/problems/:id`, `/internal/problems/:id`, `/submit`, `/run`, `/trace`) are fully compatible with Express 5, avoiding deprecated wildcards or parameter syntax.

### 6. [INFO] Tailwind 4 visual comparison
- **Severity**: Info (Pass)
- **Location**: `reactapp/src/index.css:7-17`, `../gate-reports/reactapp-after/`
- **Why**: Checked against SPEC 6.3: Tailwind 4 defaults for button cursors and placeholder colors.
- **Result**: Compatibility CSS for `button:not(:disabled) { cursor: pointer; }` and `input::placeholder { color: #9ca3af; }` was correctly preserved. Baseline CRA build had failed in bootstrap due to an ESLint rule error (`react-hooks/exhaustive-deps`), preventing baseline screenshot generation. With the `global` fix applied, all 36 routes now render rich DOM content and generate screenshots in `../gate-reports/reactapp-after/`.

### 7. [INFO] Test suite integrity
- **Severity**: Info (Pass)
- **Location**: `reactapp/src/**/*.test.jsx?`, `judge/src/**/*.test.js`
- **Why**: Checked against SPEC 2.5: No tests weakened, skipped, deleted, or disabled.
- **Result**: All 15 test files (109 tests) in `reactapp` pass under Vitest. All Jest APIs (`jest.fn`, `jest.mock`, `jest.useFakeTimers`, `jest.advanceTimersByTime`) were cleanly converted to `vi.*`. All judge tests pass under Node test runner (`node --test`). Zero tests were skipped, deleted, or weakened.

### 8. [INFO] Lockfile and target versions
- **Severity**: Info (Pass)
- **Location**: `reactapp/package-lock.json`, `judge/package-lock.json`
- **Why**: Checked against SPEC 1: Target versions exact.
- **Result**: Clean `npm ci` succeeds on both `reactapp` and `judge`. Versions verified:
  - React / React DOM: `^19.3.0` (installed `19.3.1`)
  - Vite: `^8.3.5` (installed `8.3.5`)
  - Tailwind CSS: `^4.3.3` (installed `4.3.3`)
  - @tailwindcss/vite: `^4.3.3` (installed `4.3.3`)
  - Vitest: `^5.0.5` (installed `5.0.5`)
  - Judge Node: `>=24` (Dockerfiles use `node:24-slim` and `nodejs:24`)
  - Express: `^5.0.0` (installed `5.0.0`)
