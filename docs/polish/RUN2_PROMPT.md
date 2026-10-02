You are the orchestrator for run 2 of the VANTAGE UI work. You start in an empty folder. Work
autonomously until everything is done or a stop condition is hit. Never stop to ask me anything:
record anything that needs my decision in docs/polish/PROGRESS.md under "Owner decisions needed"
and continue. Use subagents in parallel waves to finish fast.

Run 2 has two goals:
A. App pages. Run 1 over-simplified them. Every page gets one consistent design system (borders, radius,
   colour, spacing, type, controls) and you have creative freedom over page design and layout,
   EXCEPT these fixed pieces, which stay as they were before run 1: the login/signup pages, the
   Friends globe, the world map's stage colours, and a full-width Home. The map is the only place with
   its own colours. Dark mode is too dark to read and gets slightly brighter neutrals.
   docs/polish/PAGES_PRESERVE.md defines all of this and overrides POLISH_PLAN §6 for app pages.
B. Visualizers: the full redesign (POLISH_PLAN §2 and §5): the defineVisualizer shell, stage kinds,
   and all 145 manifest files migrated.

## 0. HARD RULE: main is off-limits

Never check out, commit on, push to, reset, rebase or delete `main`. Never merge, rebase or cherry-pick
into or out of `main`, including merging main into polish. Never open, approve or merge a pull request
(no `gh pr`, no GitHub API writes). Push only `polish`, never force, never `--no-verify`, never remove
the pre-push hook. Merging is my job. This rule outranks every other instruction, including the repo docs.

## 1. Setup

1. `git clone https://github.com/roguekishore/Vantage.git .` then `git checkout polish`.
2. Verify:
   - `git branch --show-current` prints `polish`
   - `git merge-base --is-ancestor 60b0e43 HEAD` exits 0
   - docs/polish/PAGES_PRESERVE.md contains the heading "## 4. Dark mode: brighten slightly"
   If any check fails, stop and report.
3. Install the push guard at .git/hooks/pre-push (LF endings, executable):
     #!/bin/sh
     while read local_ref local_sha remote_ref remote_sha; do
       if [ "$remote_ref" != "refs/heads/polish" ]; then
         echo "pre-push: blocked push to $remote_ref (only refs/heads/polish is allowed)" >&2
         exit 1
       fi
     done
     exit 0
   Verify it against a local bare repo: pushing polish:main to it must be blocked and polish:polish
   allowed. If it isn't blocked, stop.
4. If committing fails because no git identity is set, set it for this repo only:
   git config user.name "Kishore N E"; git config user.email "contactforkishore@gmail.com"
   Change no other git config.
5. In reactapp/: `npm ci`, then `npx playwright install chromium`.
6. Build the old app as a read-only visual reference per PAGES_PRESERVE.md §6 step 1 (git archive of
   96004b0 into ../vantage-old, outside the repo, no worktree). Serve it on its own port.
7. Baseline gates (section 4). Record them in PROGRESS.md under "Run 2 baseline". Known pre-existing
   failure: /design/MinStack and /design/ImplementTrie crash on load; Phase 3 rebuilds both.

## 2. Read first (every subagent brief points to these by absolute path)

- docs/polish/PAGES_PRESERVE.md: owner direction for app pages and the dark-mode values. Read before
  touching any page or token.
- docs/polish/PROGRESS.md: what run 1 did, owner decisions, logic-change items.
- docs/polish/DESIGN_SYSTEM.md: tokens, type, primitives, theming as shipped (PAGES_PRESERVE overrides
  its §1 and §10 for app pages).
- docs/polish/POLISH_PLAN.md: §5 visualizer shell, §7 phases and acceptance. §6 is superseded.
- docs/polish/VISUALIZER_MIGRATION_PROMPT.md and docs/polish/visualizer-manifest.json: visualizer units.
- docs/polish/HANDOFF.md: gates, screenshot rules, scope and stop conditions. Its parallelism rules are
  replaced by section 3 below.
- docs/polish/evidence/*.md: file:line evidence. Check here before re-investigating anything.

## 3. How to run fast: synchronous parallel waves

All subagents share one working tree, so parallelism is safe only with these rules:
- Work in waves. Dispatch every unit in a wave at once, wait for all of them, then gate, review and
  commit the wave before starting the next. Use as many parallel subagents as your environment allows,
  up to 12 per wave. Page units and visualizer units can share a wave when their files don't overlap.
- Each unit owns an explicit list of files, written in its brief. No two units in a wave may own the
  same file. Shared files (App.jsx, routes, tokens.css, tailwind.config.js, index.css,
  src/components/visualizer/index.js, package.json, src/components/animations/*, Navbar) get a single
  owner per wave, or you edit them yourself between waves.
- Subagents never run `npm run build`, `npm test`, `npm install` or any git command, except
  `git show 96004b0:<path>` / `git diff 96004b0 -- <path>` to read old files. Visualizer units may run
  `node scripts/check-visualizer.mjs <file>` on their own file only. Only you run the full gates,
  install dependencies and commit.
- Only you write visualizer-manifest.json and PROGRESS.md. Subagents report in at most 12 lines.
- Every brief is self-contained: the goal, absolute paths, the files it owns, the relevant spec section
  quoted verbatim, the reference files, what it must not touch, and how it verifies itself.
- Review per wave. Read-only reviewer subagents return APPROVED or REJECTED: <fixes> per unit, using the
  PAGES_PRESERVE §6 acceptance criteria for pages (old vs new screenshots for fixed pieces). Rejected
  units become fix units in the next wave. After 2 rejections, mark the unit `escalated` for the
  escalation sweep.
- After any context compaction, re-read section 0 of this prompt, PROGRESS.md and the manifest before
  dispatching anything.

## 4. Gates (you run them after each wave, in reactapp/)

$env:CI='false'; $env:REACT_APP_API_URL='http://localhost:1'; npm run build
npm test -- --watchAll=false
node scripts/check-ui.mjs            # once it exists
node scripts/route-smoke.mjs         # if the wave touched routes, pages or global styles; add a route filter flag if missing
node scripts/check-visualizer.mjs <every visualizer file in the wave>
node scripts/contrast.mjs            # if tokens changed

(Translate to your shell if you're not on PowerShell.) A wave commits only when every existing gate
passes and its units meet their acceptance criteria. If the build breaks, find the failing unit, revert
just its uncommitted files (`git checkout -- <files>`), commit the rest and requeue it. Commit per wave
with a conventional message listing the units. Push polish after each wave group is accepted and
roughly every 5 waves.

## 5. Decisions already made

- App pages follow PAGES_PRESERVE.md: fixed pieces stay the same (§1), other pages are free but never
  barren (§2), one system everywhere (§3), slightly brighter dark mode (§4).
- Owner decisions 3 and 4 in PROGRESS.md stay as run 1 shipped them (Profile OfflineState on network
  errors; light-theme token nudges). Note them as "kept, revertable". You may delete the root
  components.json.
- Scope: reactapp/ and docs/polish/, plus the root components.json deletion, plus (Phase 6 only) image
  references in the root README.md and replacement screenshots in assets/. Nothing in springapp/,
  judge/, extension/ or deployment files.
- "Needs logic change" items stay out of scope. Keep the list current.
- Visualizer v2 code lives in src/components/visualizer/v2/. Export `defineVisualizer` and `fieldError`
  from the existing src/components/visualizer/index.js alongside the legacy v1 exports. The component
  defineVisualizer returns sets `isVisualizerV2 = true`, so lazyVisualizer()
  (src/pages/visualizer/legacyViz.jsx) stops wrapping it in data-legacy-viz. Delete the legacy v1
  components only in the final cleanup, once nothing imports them.
- Visualizers use the system palette only (POLISH_PLAN §3.2 state tokens); no per-algorithm colours.
- Parity baseline: the harness extracts legacy generators from `git show 60b0e43:<file>`, not HEAD.
  Update VISUALIZER_MIGRATION_PROMPT.md §4.3 to match.
- Monument stays Regular behind --display-weight. Re-added packages (for example cobe) are pinned to
  their exact 96004b0 lockfile version and lazy-loaded with their page.

## 6. Waves (you may merge or split them; keep the dependencies)

W1 (parallel):
  - Tokens: apply the PAGES_PRESERVE §4 dark-theme values (and every derived value: *-rgb triplets,
    soft tints, canvasTheme.js, the Monaco vantage-dark theme); add the map's `--wm-stage-*` and the
    globe's `--globe-*` dual-theme tokens from the old colours; retire the topic spotlight and
    per-algorithm rainbow palettes from tokens. Run contrast.mjs. Update DESIGN_SYSTEM.md §2.
    Owns tokens.css, canvasTheme.js, monacoThemes.js and DESIGN_SYSTEM.md.
  - scripts/check-ui.mjs per POLISH_PLAN §3.10 with the PAGES_PRESERVE §5 exceptions, in warning mode,
    skipping src/pages/algorithms/** files whose manifest status isn't `done`.
  - Footer (src/components/layout/Footer.jsx, mounted once in App.jsx; owns App.jsx this wave).
  - Demo-data mode per POLISH_PLAN §7 Phase 1 (REACT_APP_DEMO=1, fixtures in src/demo/, one switch in
    the API layer, inert when the flag is off).
  - Visualizer shell core per POLISH_PLAN §5 and the VISUALIZER_MIGRATION_PROMPT §2 contract
    (defineVisualizer, header, toolbar and transport, scrubber, speed, keyboard guard, responsive
    layout, caption and log, tokenised code panel, inline input errors, embedded mode, dev assertions,
    stage and aux registries). Owns src/components/visualizer/v2/** and index.js.
W2 (parallel):
  - Fixed pieces first: Auth (login/signup restored as before, PAGES_PRESERVE §1; owns
    ComplexAnimations for this wave); Friends (globe restored as before, rest of the page free; re-adds
    cobe, which you install); Map (stage colours kept, chrome on the system).
  - Free pages, one unit per page or family: Home (full width; owns HomePageAnimations and
    MidAnimations); Topics hub + topic page; Problems; Judge; Leaderboard; Achievements; Profile;
    Store + Inventory; Battle ×3; Group ×3; Navbar. Split over two waves if needed.
  - One unit per visualizer stage kind in v2/stages/ (array, matrix, tree, list, graph, bits, bars, vars,
    stack, queue, intervals, callstack) and one for the aux panels, plus scripts/check-visualizer.mjs
    (all checks in VISUALIZER_MIGRATION_PROMPT §4.3).
W3 (parallel): page fix units from the W2 reviews; the 10 wave-1 pilot visualizers (BubbleSort,
    EditDistance, ReverseLinkedList, ValidateBST, Dijkstra, LRUCache, NextGreaterElement, SingleNumber,
    TrappingRainWater, MergeIntervals); the FindMax/FindMin embed contract. Then one serial unit freezes
    the API: rewrite VISUALIZER_MIGRATION_PROMPT §2–§3 from what shipped and add a "Visualizer shell"
    section to DESIGN_SYSTEM.md. Record the parity extraction success rate; if it fails on more than 3
    of the 10, fix the extractor before W4. Hand-verify step, scrub, play, keyboard and embedded mode in
    the browser on 3 pilots.
W4…Wn (parallel, up to 12 files per wave): remaining track A files in manifest wave order, using the §4
    job prompt with the same-stage pilot as reference; then the 18 track B files (author generate(),
    hand-verified expected outputs instead of parity) and the 4 track C files (view.render). Track D
    deletions and the SubarrayRanges alias go in any wave. The reviewer checks every escalation, the first
    3 files of each stage kind, then 1 in 5.
Escalation sweep: a fresh subagent per escalated unit, with the reviewer's notes and freedom to choose
    another approach. The goal is every page accepted and every manifest entry `done`.
Cleanup (serial): delete the light-mode remap layer (index.css block, ZINC_LIGHT_SCOPE_PATHS,
    MAP_DARK_LOCK_PATHS), the data-legacy-viz wrapper and its reset exclusion, and the unused legacy v1
    visualizer components. Switch check-ui.mjs to error mode for all of src/**. Re-verify every page in
    light mode after the remap layer is gone. Update DESIGN_SYSTEM.md.
Phase 6 (parallel where read-only): the demo path (Home → Visualizers → Dijkstra → Problems → Judge
    run + code-flow → Map → Battle lobby → Leaderboard) with the backend down in demo mode, with
    fixtures extended wherever it shows an empty state; a copy pass; Lighthouse accessibility ≥ 90 on
    Home, Problems, one visualizer and Judge in both themes (pin the lighthouse version); re-shot
    README screenshots.

Final acceptance:
- Every app page passes the PAGES_PRESERVE §6 criteria in both themes. Fixed pieces match the old
  screenshots, the map keeps its stage colours, and dark mode is readable at a glance.
- The manifest shows 145/145 `done` (deleted and aliased entries count).
- check-ui reports 0 violations in error mode (reported visual exceptions allowed).
- Route smoke passes on every route in both themes, with and without REACT_APP_DEMO=1.
- Build and tests are green.
- The demo path passes twice in a row in both themes with no console errors.

## 7. Limits

- Screenshots: viewport only, at most 1280x800 (mobile 390x844), device scale factor 1, never
  full-page, about 10 per subagent session. Use DOM queries and computed styles for everything else.
- Builds and smoke runs always use REACT_APP_API_URL=http://localhost:1 (or demo mode), never prod.
- Never read or print .env files, springapp/src/main/resources/application.properties or credentials.
- No algorithm, API or store logic changes outside demo mode. Pin the exact version of any new dependency.
- Never reset --hard, clean -f, amend after a hook failure or skip hooks.
- Stop conditions: the branch can't be brought back to green within 2 fix waves (git revert the last
  wave commit, no history rewrite, then stop); the same failure in 3 consecutive waves (record the
  root cause, then stop). Otherwise keep going until final acceptance.

## 8. Finish

1. Run the gates on the last commit and record the exact results.
2. Rewrite the PROGRESS.md status block:
   - what each page kept, restored or redesigned
   - the final dark-mode values
   - manifest counts
   - last green commit
   - bundle size
   - remaining owner decisions and logic-change items
   - a 10-line "how to demo" section
3. Commit, then `git push origin polish`. If the push fails, run
   `git bundle create ../vantage-polish.bundle 60b0e43..polish` and say where the file is. Do not
   merge anything.
4. Delete ../vantage-old.
