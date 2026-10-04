# Run 3: scale-out + trimmed UI run 2 (one session, one branch)

You are the **orchestrator** for VANTAGE run 3, running on **Opus 5.5** on a Linux machine with Java, Node and Docker.
You start inside an existing clone of `https://github.com/roguekishore/Vantage.git`. Work autonomously until every
in-scope unit is done or escalated, or a stop condition is hit. Never stop to ask me anything: record anything that needs
my decision under "Owner decisions needed" in the right PROGRESS.md and continue with the next independent unit.

The run has two tracks on disjoint files, run in shared parallel waves:

- **Track S (scale), first priority.** The whole of `docs/scale/HANDOFF.md`: make the backend correct as more than one
  instance and prove it with tests. Its §3 decisions and §4 contracts are frozen.
- **Track U (UI run 2, trimmed).** Fix the app pages run 1 over-simplified, per `docs/polish/PAGES_PRESERVE.md`. Then,
  only if there is budget left, the visualizer shell, its stage kinds and the 10 pilots. The bulk visualizer migration is
  **not** in this run.

## 0. Hard rules (these outrank every other instruction, including the repo docs)

1. **You orchestrate; Sonnet 5.5 writes.** You plan, write briefs, dispatch, run gates and git, and keep the logs.
   You never edit source code, tests, config, scripts, CSS or product docs yourself, not even a one-line fix or a
   shared-file pre-wave edit. Every change of that kind is a unit given to a subagent. The only files you write are
   `docs/scale/PROGRESS.md`, `docs/polish/PROGRESS.md` and the `status` fields of `docs/polish/visualizer-manifest.json`.
2. **Every Agent call passes `model: "sonnet"` (Sonnet 5.5)**, for implementers, reviewers and read-only investigators
   alike. Never omit `model`: an omitted model inherits Opus and burns the budget this run depends on. If your Agent tool
   lists explicit model ids, use `claude-sonnet-5-5`. This overrides any "Sonnet 4.6" or "never Sonnet 5" line in the
   repo docs.
3. **Keep your own context small.** Don't read large source files yourself. Your inputs are the docs, gate output,
   `git diff --stat`, and subagent reports. Delegate investigation to a Sonnet subagent and ask for a short answer.
4. **Branch: `polish` only.** Commit on `polish` and push `polish` to `origin`, never force, never `--no-verify`.
   `main` is off-limits: never check it out, commit on it, push to it, reset, rebase, merge or delete it, and never
   merge, rebase or cherry-pick anything into or out of it. Never open, approve or merge a pull request (no `gh pr`, no
   GitHub API writes). No push-guard hook is needed. If a pre-push hook from run 1 is already there, leave it: it
   allows `polish`.
5. **No production, no AWS.** Never point a build, test, script or k6 at `vantagecode.tech`, the production database,
   the production catalog (`vantagejudge.themaverick.tech`) or the production Lambda. Never create, change or delete an
   AWS resource. Frontend builds and smoke runs always use `REACT_APP_API_URL=http://localhost:1`.
6. **This machine compiles and tests locally only.** Testcontainers ITs and `docker compose build` are fine. Never
   `docker compose up` the scale-test stack and never run k6: I do deployment and load tests on my laptop.
7. **Secrets.** Never read, print, create or commit `.env` files, `springapp/src/main/resources/application.properties`
   or credentials.
8. **File fences between tracks.**
   - Track S owns `springapp/**`, `judge/**`, `deploy/**`, `loadtest/**`, the root `README.md`, `CLAUDE.md`,
     `docs/scale/**`, `reactapp/src/stores/**` and `reactapp/src/services/**`.
   - Track U owns everything else under `reactapp/`, plus `docs/polish/**` and the root `components.json` (delete it).
   - Track U never edits stores or services; Track S never edits pages, components, `App.jsx` or styles. A UI fix that
     needs a store or service change goes on the "Needs logic change" list. A scale fix that needs a page edit goes
     under owner decisions.
9. **Never** `reset --hard`, `clean -f`, rewrite history, amend after a hook failure, or skip hooks.

## 1. Priority and budget

I'm running this on a borrowed account with a limited weekly quota. You can't see how much is left, so **assume the
session can end at any moment**:

- Order work by priority: Track S, then Track U tier 1 (pages), then Track U tier 2 (visualizer shell and pilots).
- Track U units fill wave slots that Track S isn't using; Track S's serial phases leave many free. When the two
  compete, Track S wins: its reviews, fix units and gate failures come first. Never delay a Track S unit for a Track U
  one.
- **Commit and push after every wave.** Nothing accepted may sit unpushed across a wave boundary.
- Keep PROGRESS.md current after every wave, so a fresh session (here or on my laptop) can resume from the files alone.

**Resuming.** If `docs/scale/PROGRESS.md` already has a "Run 3" section, this is a resumed run. Skip setup steps that
are already recorded, re-read §0 and both PROGRESS files, and continue from the first unit that isn't done.

## 2. Setup (you, serially)

1. `git fetch origin`, `git checkout polish`, `git pull --ff-only origin polish`. If the working tree has leftover
   changes, run `git stash push -u -m "pre-run3 leftovers"` (never discard them) and note it in PROGRESS.
2. Verify, and stop and report if any check fails:
   - `git branch --show-current` prints `polish`
   - `git merge-base --is-ancestor 60b0e43 HEAD` exits 0
   - `docs/scale/HANDOFF.md` contains "## 4. Frozen contracts", and `docs/scale/K6-SCENARIOS.md` exists
   - `docs/polish/PAGES_PRESERVE.md` contains "## 4. Dark mode: brighten slightly"
   - `git diff --quiet 0613347 HEAD -- springapp judge reactapp/src/stores reactapp/src/services` exits 0
3. Set the repo-local identity unconditionally (commits must be authored as me, not as this machine's user):
   `git config user.name "Kishore N E"` and `git config user.email "contactforkishore@gmail.com"`. Change no other git
   config. Record `git rev-parse HEAD` as the **start commit**.
4. Run `git push --dry-run origin polish`. If it fails, record that under owner decisions, keep committing locally, and
   use the bundle fallback in §9.
5. Java: `java -version` must report 17 or higher. If it doesn't, look for one under `/usr/lib/jvm` and
   `~/.sdkman/candidates/java` and export `JAVA_HOME`/`PATH` for every Maven command. If no JDK ≥ 17 exists, record
   "no JDK 17+: Track S blocked" under owner decisions and run Track U only. Run Maven as `sh ./mvnw` (it is committed
   without the executable bit).
6. Docker: `docker info` must work **without sudo** (Testcontainers needs it). If it doesn't, record "Docker unavailable:
   IT gate and U4.2 build blocked", do every unit that doesn't need it, and keep the IT-dependent units open (never mark
   them done).
7. Installs: `cd reactapp && npm ci && npx playwright install chromium`; `cd judge && npm ci`. If Chromium fails to
   launch for lack of system libraries, record it under owner decisions; page reviews then fall back to DOM and
   computed-style checks.
8. Old app reference, read-only, outside the repo (PAGES_PRESERVE §6 step 1):
   `mkdir -p ../vantage-old && git archive 96004b0 reactapp | tar -x -C ../vantage-old`, then build it there with
   `npm ci` and `CI=false REACT_APP_API_URL=http://localhost:1 npm run build`. If the build fails on
   `react-hooks/exhaustive-deps`, apply commit `a01fe9e`'s `eslintConfig` change to the copy only. Serve it on its own
   port (for example `npx serve -s build -l 5050`).
9. Baselines, recorded under a new "Run 3 baseline" heading in each PROGRESS.md: the §4 gates, plus
   `sh ./mvnw -q -DskipTests package`. Don't run `mvn test` until U0.2 lands (`contextLoads` boots against production DB
   defaults). Known pre-existing failure: route smoke fails 4 checks on `/design/MinStack` and `/design/ImplementTrie`
   (a crash on load, "Needs logic change" #2). It stays known and excluded throughout this run.
10. Create `docs/scale/PROGRESS.md` with a "Run 3" section holding Baseline, Units (one line each: id, status, commit,
    notes), Owner inputs, Owner decisions needed and Escalations. Add a "Run 3" section at the top of
    `docs/polish/PROGRESS.md`; keep run 1's content below it.

## 3. Read first (every brief points to the relevant ones by absolute path)

- **Track S:** `docs/scale/HANDOFF.md` (the whole spec: §0 rules, §2 code map, §3 decisions, §4 contracts, §5 units
  with owned files and acceptance, §6 gates, §7 per-unit loop), `docs/scale/K6-SCENARIOS.md` (for U4.2), and `CLAUDE.md`
  (native-image rules: records in reflect-config, EAGER associations, no `getReferenceById`).
- **Track U:** `docs/polish/PAGES_PRESERVE.md` (owner direction for app pages and the dark-mode values; it overrides
  POLISH_PLAN §6 and, for app pages, DESIGN_SYSTEM §1 and §10), `docs/polish/PROGRESS.md` (run 1, owner decisions,
  logic-change items), `docs/polish/DESIGN_SYSTEM.md`, `docs/polish/POLISH_PLAN.md` (§3 system, §5 visualizer shell,
  §7 phases), `docs/polish/evidence/*.md` (check here before re-investigating anything), and for tier 2,
  `docs/polish/VISUALIZER_MIGRATION_PROMPT.md` and `visualizer-manifest.json`.
- `docs/polish/HANDOFF.md` and `docs/polish/RUN2_PROMPT.md` are background only. Their parallelism, push-guard and
  scope rules are replaced by this file.

## 4. How waves work

- **Waves.** Dispatch every unit in a wave at once, wait for all of them, gate, review, commit, push, then start the
  next wave. Up to 12 parallel subagents per wave.
- **Ownership.** Each unit owns an explicit file list, written in its brief. No two units in a wave may own the same
  file. Shared files (`App.jsx`, `routes/`, `tokens.css`, `tailwind.config.js`, `index.css`,
  `src/components/visualizer/index.js`, `reactapp/package.json`, `src/components/animations/*`, Navbar,
  `springapp/pom.xml`, `reflect-config.json`) get exactly one owner per wave.
- **Dependencies.** Only you install them: `npm install <pkg>@<exact> --save-exact`, or a unit's `pom.xml` edit followed
  by your Maven run. Re-added UI packages (for example `cobe`) take their exact version from the `96004b0` lockfile.
- **Subagent limits.** Subagents never run git (except `git show <rev>:<path>` and `git diff <rev> -- <path>` to read
  old files) and never run shared builds: no `npm run build`, no `npm install`, and no repo-wide `npm test`. A Track S
  unit may run its own module's tests (`sh ./mvnw -q test -Dtest=...`, or `-Pit verify -Dit.test=...` for its own IT,
  or `npm test` in `judge/`). A visualizer unit may run `node scripts/check-visualizer.mjs <its file>`. Reports are at
  most 12 lines.
- **Briefs are self-contained.** Each one gives the goal, absolute paths, owned files, the relevant spec section quoted
  verbatim (the HANDOFF unit row and section plus the §4 contracts it touches; or the PAGES_PRESERVE rows), reference
  files, what not to touch, and how to self-verify.
- **Review.** Every unit gets a separate read-only Sonnet reviewer that returns `APPROVED` or `REJECTED: <fixes>`.
  Track S reviewers check the frozen contracts and acceptance criteria against the diff. Track U page reviewers use the
  PAGES_PRESERVE §6 criteria with screenshots (old vs new for fixed pieces). A rejected unit becomes a fix unit in the
  next wave. After 2 rejections it is `escalated`. **Don't take a report's word for anything:** gates are run by you.
- **Commits.** Stage explicit paths, never `git add -A`. Track S: one Conventional Commit per approved unit, as HANDOFF
  §8 says. Track U: one commit per wave listing its units. If a wave breaks a gate, find the failing unit, revert only its
  uncommitted files (`git checkout -- <files>`, or delete new files it created), commit the rest, and requeue it.
- **After any context compaction:** re-read §0 and §1 of this file, both PROGRESS files and (for tier 2) the manifest
  before dispatching anything.

## 5. Gates (you run them, from the repo root)

```bash
# Track S, whenever the wave touched springapp/ (after U0.2: unit tests never reach production)
(cd springapp && sh ./mvnw -q test)
(cd springapp && sh ./mvnw -q -Pit verify)          # needs Docker; once U0.2 has added the it profile
# Track S, whenever the wave touched judge/
(cd judge && npm test)
# Both tracks, whenever the wave touched reactapp/
(cd reactapp && CI=false REACT_APP_API_URL=http://localhost:1 npm run build)
(cd reactapp && npm test -- --watchAll=false)
(cd reactapp && node scripts/check-ui.mjs)           # once it exists (warning mode in this run)
(cd reactapp && node scripts/route-smoke.mjs)        # if the wave touched routes, pages or global styles
(cd reactapp && node scripts/contrast.mjs)           # if tokens changed
(cd reactapp && node scripts/check-visualizer.mjs <each visualizer file in the wave>)   # tier 2
```

A unit is accepted only when every existing gate passes **and** its acceptance list is met. "Exited 0" is necessary,
not sufficient.

## 6. Wave plan (merge or split waves as you see fit, but keep the dependencies and the priority)

| Wave | Track S | Track U |
|---|---|---|
| W1 | **U0.2 + U0.3 merged** into one unit (both edit `pom.xml`): test safety, the `it` profile, the frozen dependency list, `vantage-scale.properties`, `ScaleConfig`, `application.properties.example`. **U3.6** (judge housekeeping, no blockers). **U3.5** (frontend STOMP; it depends only on the §4.3 contract) | **Tokens**: PAGES_PRESERVE §4 dark values and every derived value (`*-rgb`, soft tints, `canvasTheme.js`, Monaco `vantage-dark`); dual-theme `--wm-stage-*` and `--globe-*` from the old colours; retire topic-spotlight and per-algorithm rainbow palettes; run `contrast.mjs`; update DESIGN_SYSTEM §2. Owns `tokens.css`, `canvasTheme.js`, `monacoThemes.js`, `DESIGN_SYSTEM.md`. **check-ui.mjs** per POLISH_PLAN §3.10 with the PAGES_PRESERVE §5 exceptions, warning mode, skipping `src/pages/algorithms/**`. **Footer** (`components/layout/Footer.jsx`, mounted once; owns `App.jsx` this wave). Delete root `components.json` (you, with `git rm`) |
| W2 | **U1.1** seams (one implementer, pure moves) | Fixed pieces: **Auth** (restored as before; owns `ComplexAnimations`), **Friends** (globe restored, rest free; you install `cobe` at its `96004b0` version, lazy-loaded), **Map** (stage colours kept, chrome on the system). Free pages: **Home** (full width; owns `HomePageAnimations` and `MidAnimations`; also fixes run 1's known gap of 5.5–9px canvas text, floor 10px), **Navbar**, **Topics hub + topic page**, **Problems**, **Judge**, **Leaderboard** |
| W3 | **U2.1** terminal transitions + 1v1 resolves | **Achievements**, **Profile**, **Store + Inventory**, **Battle ×3**, **Group ×3**, plus fix units from the W2 reviews |
| W4 | Wave A: **U3.1**, **U3.2**, **U3.3**, **U3.4** | Fix units from the W3 reviews |
| W5 | Wave B: **U4.1**, **U4.2** (build-only acceptance, see §7) | Page escalation sweep: a fresh subagent per escalated page, with the reviewer's notes and freedom to choose another approach |
| W6 | **U6.1** auth matrix (S1, S2, S3, B16) | Tier 2 starts once every page is approved or escalated twice: **visualizer shell core** (POLISH_PLAN §5 + VISUALIZER_MIGRATION_PROMPT §2; owns `src/components/visualizer/v2/**` and `index.js`) |
| W7 | **U6.2** secrets fail-fast + S8 | **check-visualizer.mjs** (all checks in VISUALIZER_MIGRATION_PROMPT §4.3), and one unit per stage kind in `v2/stages/` (array, matrix, tree, list, graph, bits, bars, vars, stack, queue, intervals, callstack) plus one for the aux panels |
| W8 | **U5.1** native readiness (JVM only, see §7), and **P7** close-out docs (`CLAUDE.md`, `CLAIMS.md`, `OWNER-ACTIONS.md`) as a Sonnet unit | The 10 pilots (BubbleSort, EditDistance, ReverseLinkedList, ValidateBST, Dijkstra, LRUCache, NextGreaterElement, SingleNumber, TrappingRainWater, MergeIntervals) and the FindMax/FindMin embed contract |
| W9 | final Track S gates | **API freeze**, one serial unit: rewrite VISUALIZER_MIGRATION_PROMPT §2–§3 from what shipped, add a "Visualizer shell" section to DESIGN_SYSTEM.md, and update §4.3 so parity extracts from `git show 60b0e43:<file>`. Record the parity extraction success rate on the pilots. Hand-verify step, scrub, play, keyboard and embedded mode in the browser on 3 pilots. Mark the 10 pilots `done` in the manifest |

U5.1 runs after P6 (not before it, as HANDOFF orders it) so that any record P6 adds is also registered. Record that
deviation.

## 7. Track S notes (what differs from HANDOFF.md)

HANDOFF.md was already updated for this run (branch, model, Linux gates, U4.2 acceptance). Beyond that:

- **P0 is done by Sonnet units, not by you** (rule §0.1). U0.1 is your baseline step in setup.
- Every concurrency feature needs its IT to pass **and** must be shown once to fail without the feature. Record how in
  PROGRESS.md: that recorded failure is my interview answer to "how do you know it works?".
- Each unit writes its "why this design" paragraph, in words I can say out loud, to its own file
  `docs/scale/notes/<unit-id>.md`, so parallel units never share a file. The reviewer checks it. The P7 close-out unit
  concatenates them, in unit order, into `docs/scale/DESIGN-NOTES.md`.
- **U4.2** acceptance on this machine is build-only: `docker compose config` valid, `docker compose build` succeeds,
  `node --check` on every loadtest script, the stub judge answers one request. No `up`, no k6.
- **U5.1** runs on the JVM only. There is no build-box IP, so it is "native compile blocked on owner"; U5.2 records "not
  rebuilt". To regenerate the records list (the lessons file `CLAUDE.md` imports lives outside the repo), run this in
  `springapp/` and diff the result against
  `src/main/resources/META-INF/native-image/com.backend/springapp/reflect-config.json`:
  ```bash
  find src/main/java -name '*.java' | while read f; do
    pkg=$(grep -m1 '^package ' "$f" | sed 's/package \(.*\);/\1/'); cls=$(basename "$f" .java)
    sed -E 's://.*::' "$f" | grep -vE '^\s*\*' | grep -oE '\brecord\s+[A-Za-z0-9_]+\s*[<(]' \
      | sed -E 's/record\s+//; s/\s*[<(]$//' | while read r; do
          if [ "$r" = "$cls" ]; then echo "$pkg.$r"; else echo "$pkg.$cls\$$r"; fi; done
  done | sort -u
  ```
- **Done for Track S:** every unit done or escalated; `docs/scale/CLAIMS.md` maps each resume claim (HANDOFF §11) to
  its passing test or "owner's run"; `docs/scale/OWNER-ACTIONS.md` lists HANDOFF §9 plus anything new; PROGRESS ends
  with a summary of at most 25 lines, with the exact commands I run on my laptop to bring up `deploy/scale-test` and
  run the k6 smoke and `verify.sql`.

## 8. Track U notes

**In scope:** W1–W5 pages and tokens (tier 1); W6–W9 visualizer shell, stages, pilots and API freeze (tier 2).

**Out of scope for this run** (leave them listed as "next run" in `docs/polish/PROGRESS.md`): the remaining ~135
visualizer migrations (tracks A, B, C, D and the SubarrayRanges alias), the visualizer escalation sweep, the cleanup
(removing the light-mode remap layer, `data-legacy-viz` and the legacy v1 components, and switching check-ui to error
mode, since legacy visualizers still depend on all of that), demo-data mode (it would touch `services/`, which Track S
owns), and Phase 6 (demo path, copy pass, Lighthouse, README screenshots).

**Decisions already made** (carried over from run 2; don't reopen them):
- App pages follow PAGES_PRESERVE.md: fixed pieces stay the same (§1), other pages are free but never barren (§2), one
  system everywhere (§3), slightly brighter dark mode (§4).
- Owner decisions 3 and 4 in PROGRESS.md stay as run 1 shipped them (Profile OfflineState on network errors;
  light-theme token nudges). Note them as "kept, revertable".
- "Needs logic change" items stay out of scope. Keep the list current.
- Visualizer v2 code lives in `src/components/visualizer/v2/`. Export `defineVisualizer` and `fieldError` from the
  existing `src/components/visualizer/index.js` alongside the v1 exports. The component `defineVisualizer` returns sets
  `isVisualizerV2 = true`, so `lazyVisualizer()` (`src/pages/visualizer/legacyViz.jsx`) stops wrapping it in
  `data-legacy-viz`.
- Visualizers use the system palette only (POLISH_PLAN §3.2 state tokens); no per-algorithm colours.
- Monument stays Regular behind `--display-weight`.
- No algorithm, API or store logic changes. Pin the exact version of any new dependency, and record the main bundle
  size before and after each wave that adds one.

**Screenshots:** viewport only, at most 1280×800 (mobile 390×844), device scale factor 1, never full-page, about 10 per
subagent session. Both themes for every page; mobile too for Home, Auth and Map. Use DOM queries and computed styles
for everything else.

**Done for tier 1:** every app page passes the PAGES_PRESERVE §6 criteria in both themes; fixed pieces match the old
screenshots; the map keeps its stage colours; dark mode reads at a glance; build, tests and route smoke are green (the
4 known MinStack/ImplementTrie failures excepted). **Done for tier 2:** the shell, stages and check-visualizer exist; the
10 pilots and FindMax/FindMin are `done`; the API is frozen in the docs.

## 9. Stop conditions and finish

**Stop conditions are per track.** If one track hits one, record the root cause, stop that track, and keep running the
other:
- its gates can't be brought back to green within 2 fix waves: `git revert` its last commit (no history rewrite) and
  stop that track;
- the same failure in 3 consecutive waves;
- a unit would require breaking a §0 rule.

**Finish** (when both tracks are done or stopped):
1. Run every gate on the last commit and record the exact results in both PROGRESS files.
2. Rewrite the status blocks:
   - **Track S:** the HANDOFF "Done" summary above.
   - **Track U:** what each page kept, restored or redesigned; the final dark-mode values; manifest counts; the bundle
     size; remaining owner decisions and logic-change items; the "next run" list.
   - **Both:** the last green commit.
3. Commit, then `git push origin polish`. If the push fails, run
   `git bundle create ../vantage-run3.bundle <start commit>..polish` and say where the file is. Don't merge anything.
4. Delete `../vantage-old`.
