# Handoff: VANTAGE full UI redesign

Paste this file (or point the agent at its path) to start the run. You are the **orchestrator**. You plan, dispatch, gate, commit and log. Subagents do the reading and writing. You never redesign a page yourself.

Repo: `https://github.com/roguekishore/Vantage.git`. The repo root is wherever you cloned it; every path in these docs is relative to that root (POLISH_PLAN paths are relative to `reactapp/`). Always give subagents absolute paths built from your actual clone root. Frontend: `reactapp/` (React 19.1, Tailwind 3.4.1, CRA via craco, JS). Branch: `polish`. Commands below are PowerShell; translate them to your shell if you're not on Windows.

## Goal

A complete redesign of every surface in `reactapp/` (app shell, every page, all 145 visualizer files) into one consistent, professional terminal-brutalist system, in both dark and light themes. There is no cutline: run until every phase in `POLISH_PLAN.md` §7 is accepted, or a stop condition below is hit.

Design direction is fixed: terminal-brutalist as specified in `POLISH_PLAN.md` §3. Creative freedom applies to execution quality within that system: composition, hierarchy, spacing, copy and how each page tells its story. It does not extend to new colours, radii, effects, fonts or one-off components.

## Read order (you and every subagent)

1. `docs/polish/HANDOFF.md` (this file)
2. `docs/polish/POLISH_PLAN.md`: the spec. §0 guardrails, §3 design system, §4 shell, §5 visualizer shell, §6 pages, §7 phases and acceptance.
3. `docs/polish/DESIGN_SYSTEM.md`: created at the end of Phase 1. From then on, it is the frozen source of truth and outranks §3 wherever they differ.
4. `docs/polish/VISUALIZER_MIGRATION_PROMPT.md` and `docs/polish/visualizer-manifest.json`: for visualizer units.
5. `docs/polish/evidence/*.md`: file:line evidence. Check here before re-investigating anything.
6. `docs/polish/PROGRESS.md`: the run log (you create it).

## Why this shape

A single long session drifts after context compaction, and drift is what made the current UI inconsistent. So:
- **State lives in files, not in your memory.** The manifest, `PROGRESS.md` and `DESIGN_SYSTEM.md` are the record. After any compaction, re-read this file, `PROGRESS.md` and the manifest before dispatching the next unit.
- **Every unit gets a fresh subagent** with a self-contained brief. Subagents know only what the brief says, so always include the paths above plus the unit-specific facts.
- **Subagent reports stay short**: at most 12 lines (what changed, gate results, anything blocked). Details go into `PROGRESS.md` or the manifest, not your context.

## Units

| Phase (§7) | Unit | Parallel? |
|---|---|---|
| 1 Foundation | One subagent per concern, in this order: tokens + Tailwind config + radius reset (with §3.4 exclusions); fonts; theme mechanics; `ds/*` primitives + `/__ds` route; app shell; dependency removal + route lazy-loading; `check-ui.mjs`; `route-smoke.mjs`; demo-data mode; `components.json` cleanup; `DESIGN_SYSTEM.md` | Serial |
| 2 Visualizer shell | Shell + stage kinds + aux panels; `check-visualizer.mjs`; then one unit per pilot (10); then freeze the API in `VISUALIZER_MIGRATION_PROMPT.md` §2–§3 | Serial |
| 3 Bulk visualizers | One file per unit, manifest order, waves 2→6 | Batches of up to 5 |
| 4 App pages | One page per unit, in the §7 Phase 4 order | Serial |
| 5 Tracks B + C | One file per unit, then the remap-layer removal unit | Serial |
| 6 Demo polish | Demo path, copy pass, screenshots, Lighthouse | Serial |

Phase 1 must be fully accepted before anything else starts; everything depends on it. Each phase's acceptance list in §7 is the contract.

## Per-unit loop

1. **Implement.** Dispatch an implementer subagent. Its brief contains: the goal, exact absolute paths, the relevant plan section (quote the page row or manifest entry verbatim), `DESIGN_SYSTEM.md`, one finished reference file, the gates and the constraints below.
2. **Gate.** Run the gates yourself (or have the implementer run them; you verify the output). See below.
3. **Review.** Dispatch a separate reviewer subagent with the same brief plus the diff. It checks the work against the spec and `DESIGN_SYSTEM.md`, verifies visually (screenshot rules below) for UI units, and returns `APPROVED` or `REJECTED: <specific fixes>`. The reviewer always has the final word.
4. On rejection, send the fixes to a fresh implementer, then gate and review again. After 2 rejections, mark the unit `escalated` in `PROGRESS.md` (and the manifest for visualizers) with the reason, revert only that unit's uncommitted changes, and move on to the next independent unit.
5. **Commit** on approval (see Git). Update the manifest `status` and append to `PROGRESS.md`.

Phase 3 batches: up to 5 implementer subagents in parallel, each on a different file. Parallel subagents **must not** run `npm run build`, `npm test`, or any git command, because they share one working tree and one `build/` directory. Each runs only `node scripts/check-visualizer.mjs <file>`. When the batch is done, you run the full gates once and commit the batch.

## Gates

Run from `reactapp/` in PowerShell:

```powershell
$env:CI = 'false'; $env:REACT_APP_API_URL = 'http://localhost:1'; npm run build
npm test -- --watchAll=false
node scripts/check-ui.mjs          # once it exists (Phase 1)
node scripts/route-smoke.mjs       # once it exists (Phase 1); serves build/ itself
node scripts/check-visualizer.mjs <file>   # visualizer units (Phase 2+)
```

A unit passes only when every gate that exists passes. "Exited 0" is necessary, not sufficient: confirm the acceptance criteria for the unit's phase. Never point a build at the production API. Any new dev dependency (for example Playwright for route smoke) is pinned to an exact version.

## Screenshots (hard limits, every session)

Viewport only, at most 1280×800 (mobile 390×844), device scale factor 1, never full-page. About 10 per subagent session at most. Use DOM queries, computed styles and test assertions for everything else. Check both themes for UI units.

## Git

- Work only on `polish` in the main working tree. Before the first unit, confirm `git branch --show-current` prints `polish`.
- Push only `polish` to `origin`, never force, and only if your launch prompt allows it (a cloned run does: push after every phase is accepted and at stop). Never switch to, commit on or push `main`. Never `reset --hard`, `clean -f`, force anything, amend after a hook failure or use `--no-verify`.
- Only you commit (subagents don't, except a serial implementer you explicitly allow). Stage specific paths, never `git add -A`.
- One commit per approved unit (or per Phase 3 batch), conventional commits, e.g. `feat(ds): add Button, IconButton and Panel primitives`, `refactor(viz): migrate Sorting/BubbleSort to defineVisualizer`.

## Constraints

- Only `reactapp/` and `docs/polish/` change. `springapp/`, `judge/`, `extension/` and deployment files are out of scope.
- UI work must not change algorithm behaviour, API calls or store logic (§0.1). If a UI change needs a logic change, log it in `PROGRESS.md` under "Needs logic change" and continue without it. Demo-data mode is the one sanctioned API-layer addition, and it must be inert when the flag is off.
- Never read or print `.env` files, `springapp/src/main/resources/application.properties` or any credentials.
- No new colours, radii, shadows, gradients, fonts, icon libraries, animation libraries or shadcn registries. A missing primitive gets its own design-system unit, which updates `DESIGN_SYSTEM.md`, before any page uses it.

## Stop conditions

- A Phase 1 unit is escalated: stop the run; everything downstream depends on it.
- The branch fails the build or tests and two fix units don't recover it: revert the last unit's commit with `git revert` (no history rewrite) and stop.
- The same failure repeats across 3 consecutive units: stop and record the root cause.
- Otherwise keep going until every phase is accepted.

## PROGRESS.md format

Top: a 5-line status summary (current phase, units done/escalated, last green commit, blockers), rewritten after every unit. Below: an append-only log, one entry per unit: date-time, unit, result (approved / escalated), commit hash, gate summary, notes. Keep sections for "Escalated", "Needs logic change" and "Owner decisions needed". The owner reads this first in the morning.
