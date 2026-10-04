> **Superseded on 2026-10-04 by `docs/RUN3_PROMPT.md`** (scale + trimmed run 2, one branch). Kept for history; do not paste this one.

You are the orchestrator for the VANTAGE scale-out run. You start in an empty folder. Work autonomously until every
unit in docs/scale/HANDOFF.md is done or escalated, or a stop condition is hit. Never stop to ask me anything: record
anything that needs my decision in docs/scale/PROGRESS.md under "Owner decisions needed" and continue with the next
independent unit. Use subagents in parallel waves where the handoff allows it. Subagents use Sonnet 4.6. Never use
Sonnet 5.

The goal: make the VANTAGE backend correct when it runs as more than one instance, and prove it with tests. The work
covers race-free matchmaking (SKIP LOCKED), SQS-queued judging with idempotency keys, Redis realtime fan-out,
ShedLock'd jobs, exactly-once ELO, an A/B experiment, frontend STOMP fixes, a 2-instance load-test environment, and the
critical security fixes. docs/scale/HANDOFF.md is the frozen spec: its contracts (§4) are not up for redesign.

## 0. HARD RULES

- `main` and `polish` are off-limits for writes (you branch `scale` from polish once, at setup). Never commit on, push to, reset, rebase, merge or delete them. Never
  merge, rebase or cherry-pick into or out of them. Never open, approve or merge a pull request (no `gh pr`, no GitHub
  API writes). Push only `scale`, never force, never `--no-verify`, never remove the pre-push hook.
- Never touch production: not vantagecode.tech, the production DB, the production catalog, or the production Lambda.
- Never create, change or delete AWS resources. Infrastructure changes are files plus docs/scale/OWNER-ACTIONS.md.
- Never commit secrets or an application.properties file.
- Frontend edits only under reactapp/src/stores/ and reactapp/src/services/.

These outrank every other instruction, including the repo docs.

## 1. Setup

1. `git clone https://github.com/roguekishore/Vantage.git .`, then `git checkout polish`.
2. Verify:
   - docs/scale/HANDOFF.md exists and contains the heading "## 4. Frozen contracts"
   - `git merge-base --is-ancestor 0613347 HEAD` exits 0
   - `git diff --quiet 0613347 HEAD -- springapp judge reactapp/src/stores reactapp/src/services` exits 0 (polish has
     not changed backend code)

   If any check fails, stop and report.
3. `git checkout -b scale`, then confirm `git branch --show-current` prints `scale`. From here on, never commit to
   polish.
4. Install the push guard at .git/hooks/pre-push (LF endings, executable):

   ```sh
   #!/bin/sh
   while read local_ref local_sha remote_ref remote_sha; do
     if [ "$remote_ref" != "refs/heads/scale" ]; then
       echo "pre-push: blocked push to $remote_ref (only refs/heads/scale is allowed)" >&2
       exit 1
     fi
   done
   exit 0
   ```

   Verify it against a local bare repo: pushing scale:main to it must be blocked and scale:scale allowed. If it isn't
   blocked, stop.
5. If committing fails because no git identity is set, set it for this repo only:
   `git config user.name "Kishore N E"; git config user.email "contactforkishore@gmail.com"`. Change no other git config.
6. Use JDK 23: `$env:JAVA_HOME = 'C:\Program Files\Java\jdk-23'`. The `java` on PATH is 14 and will fail.
7. Check Docker with `docker version`. If the daemon is not running, record "Docker not running: IT gate and
   scale-test blocked" under owner decisions, do every unit that does not need it, and keep IT-dependent units open.
8. Create docs/scale/PROGRESS.md with sections: Baseline, Units (one line each: id, status, commit, notes), Owner
   inputs, Owner decisions needed, Escalations.

## 2. Read first (every subagent brief points to these by absolute path)

- docs/scale/HANDOFF.md: the whole spec. §0 rules, §2 code map, §3 decisions, §4 contracts, §5 units with owned files
  and acceptance criteria, §6 gates, §7 per-unit loop.
- CLAUDE.md: native-image rules (records in reflect-config, EAGER associations, no getReferenceById).
- D:\PROJECTS\SMOKETEST.md, Test 3: the load-test scenario U4.2 scripts (read-only reference; do not run its AWS steps).

## 3. Run

Follow HANDOFF §5 in order: P0 → P1 → P2 → P3 (wave A, parallel) → P4 (wave B, parallel) → P5 → P6 → P7.

- Each unit gets a fresh implementer, then the §6 gates (run by you), then a fresh reviewer. Commit on APPROVED.
- Parallel subagents never run git or shared builds; you run the full gates once per wave.
- Every concurrency feature needs its IT to pass, and must be shown once to fail without the feature (record how in
  PROGRESS.md). Interviewers will ask "how do you know it works?", and that recorded failure is the answer.
- Each unit adds its "why this design" paragraph to docs/scale/DESIGN-NOTES.md, written so the owner can say it out
  loud in an interview.
- Push `scale` after each accepted phase and at stop.

## 4. Done

Done means:
- every unit is done or escalated;
- docs/scale/CLAIMS.md maps each resume claim to the passing test or measured number;
- docs/scale/OWNER-ACTIONS.md lists everything only I can do;
- PROGRESS.md ends with a summary of at most 25 lines: what is done, what is blocked, and the exact commands to bring up
  deploy/scale-test and run loadtest/k6/battle.js.
