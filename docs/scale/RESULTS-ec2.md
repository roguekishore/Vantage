# Scale-test results: EC2 ARM validation (2026-10-03)

One disposable instance, `ap-south-1`: **c7g.2xlarge** (Graviton, 8 vCPU, 16 GiB), Ubuntu 24.04 arm64, Docker 29, JDK 17,
k6 v2.3.0. Code under test: the `polish` branch at the time of the run. Everything below ran on that
one box, **with the load generator (k6) on the same machine as the system under test**, against the local stack in
`deploy/scale-test/` (nginx, two JVM springapp instances, MySQL 8.0, Redis, ElasticMQ, catalog, **stub judge**). These are
numbers for that setup. They are not a production capacity claim, and the judge was a stub, not the Lambda.

## 1. Tests on Linux/ARM

| Suite | Result |
|---|---|
| Spring unit tests (`mvnw test`) | 39 / 39 pass |
| Spring integration tests (`mvnw -Pit verify`, Testcontainers MySQL) | 28 / 28 pass (final run on the committed code, clean build) |
| judge `npm test` (4 environment-gated tests skip locally) | 91 pass, 0 fail, 4 skipped |
| reactapp jest | 185 / 185 |
| reactapp production build | passes, main bundle 200.4 kB gzip |
| contrast gate | 64 / 64 pairs |

New integration tests added in this run: `AuthMatrixIT.extensionTokenReadsOnlyItsOwnSyncProfile`, `TimeConsistencyIT` (2),
`StartupSeedRaceIT`, `ReadyUpRaceIT`; unit: `TimeConsistencyCheckTest` (3).

## 2. Scenario A: real-time 1v1 battles (k6 `loadtest/k6/battle.js`)

Each virtual user logs in, opens a STOMP-over-SockJS socket, joins the 1v1 queue, is matched, readies up and forfeits or
finishes. Every step is its own k6 run (2 minutes of hold, `STEPS=<n> STEP_MINUTES=2`) against a database that carries all
earlier steps. No code submissions in this scenario.

| Users | Player sessions | HTTP requests | p95 latency | HTTP failures | WS connect OK | time-to-match avg / p95 | `verify.sql` |
|---|---|---|---|---|---|---|---|
| 10 (smoke) | 58 | 414 | 101 ms | 0% | 100% | 3.0 s / 4.8 s | 4/4 PASS |
| 25 | 157 | 1,200 | 97 ms | 0% | 100% | 3.2 s / 6.5 s | 4/4 PASS |
| 50 | 342 | 2,469 | 97 ms | 0% | 100% | 2.7 s / 4.8 s | 4/4 PASS |
| 100 | 676 | 4,988 | 96 ms | 0% | 100% | 3.0 s / 5.0 s | 4/4 PASS |
| 200 | 1,338 | 9,937 | 100 ms | 0% | 100% | 2.9 s / 4.9 s | 4/4 PASS |
| **400** | **2,626** | **19,732** | **239 ms** | **0%** | **100%** | 3.1 s / 5.1 s | **4/4 PASS** |
| 600 | 3,459 | 27,065 | **2,422 ms** | 0% | 100% | 3.3 s / 5.8 s | 4/4 PASS |

- SLOs: p95 under 500 ms, HTTP failures under 1%, WS connects at 99% or better, unmatched users 0. All held through
  **400 users**. At **600 the p95 SLO breaks** (2.4 s) while errors stay at 0% and integrity checks still pass, so the
  ceiling on this box is between 400 and 600.
- Step 25 shows one unmatched user and step 600 one: an odd number of users always leaves one without a partner, so the
  `users_left_unmatched == 0` threshold fails there by construction. It is not a fault.
- `time_to_match` includes the up-to-5-second matchmaking tick by design; report it separately from latency.
- Peak container usage (10 s samples): at 400 users each springapp instance reached ~260-285% of one core and ~700 MiB
  (of its 1 GiB limit), MySQL ~166% and 441 MiB. At 600: ~307-359% and ~790-830 MiB, MySQL ~195%. No container restarted,
  no OOM kill, in any step.
- A "user" here is a k6 VU looping login, queue, match, ready, forfeit with no think time, so it is heavier than a human.

The `verify.sql` checks (no user in two active battles; per-user ELO chain; no duplicate idempotency keys; DONE judge jobs
match submissions 1:1) were run after every step.

## 3. Scenario B: judge submissions through the queue (`loadtest/k6/judge.js`, ElasticMQ, stub judge)

The queue path is live in this run (`vantage.judge.queue.enabled=true`): `POST /submit` returns 202, 8 consumers (4 per
instance) pull from ElasticMQ, and the client polls `GET /submissions/{jobId}`.

- 180 submissions, **180 DONE, 0 FAILED** (job failure rate 0%), `verify.sql` 4/4 PASS (checks 3 and 4 are the queue's
  idempotency and 1:1 guarantees).
- Enqueue latency (HTTP 202): p95 117 ms at 1 concurrent submitter (cold start), 19 ms at 5, 17 ms at 10.
- End-to-end submit to DONE: avg 1.33 s, median 1.03 s, p95 2.03 s, max 2.06 s. The stub judge itself sleeps 1.5 s for a
  catalog hit and the app answers instantly for a catalog miss, so the queue adds little on top.
- Throughput scaled with the offered load and never saturated the consumers: about 5-6 submissions/min at 1 submitter, ~18 at
  5, ~38 at 10. **That is the script's pacing, not a system limit.** Each user is limited to one submission per ~11 s (the
  app's own 10 s per-user rate limit) and the script leaves a battle after its first verdict, so it cannot drive the queue
  to saturation. A real throughput number needs many more users, and the real limit is the Lambda judge's concurrency, which
  this run did not touch. Do not quote submissions per minute as a capacity figure.
- 70% of verdicts were `RUNTIME_ERROR`. Not a queue fault: the catalog returned 404 for the problem, see section 6.

## 4. Native image (ARM, built on the same instance)

`docker build -f springapp/Dockerfile.native` with `ghcr.io/graalvm/native-image-community:25`.

| | |
|---|---|
| Build time | ~9 min total; `native-image` itself 4m13s; peak RSS 9.2 GB |
| Binary | 227 MB (was 176 MB before Redis, AWS SDK and ShedLock) |
| Image | 106 MB compressed (what Docker Hub stores/pulls), 345 MB of layers on disk (binary 227 MB + `debian:bookworm-slim`) |
| Start | 3.6 s cold (first boot, creating and seeding the schema), 0.8 s warm |
| Run | `-Xmx160m`, `mem_limit 320m`, `memswap_limit 320m`, MySQL server set to IST (+05:30) |
| Memory (cgroup `anon`, not `docker stats`) | peak 105 MiB under the 10-user smoke, 83 MiB afterwards, 0 OOM kills |
| End-to-end | same k6 smoke as the JVM stack: 26 / 26 battles COMPLETED, p95 96 ms, 0% HTTP failures, `verify.sql` 4/4 PASS |
| Empty database | seeds 27 stages, 158 problems, 9 store items, 255 institutions (`cbe.csv`), 14 achievements and stays up |

Not covered: this run had the queue and Redis flags off, so the AWS SDK (SQS) and Lettuce (Redis) code paths are **not**
exercised under native yet (the SQS client is built lazily and needs native hints before the queue can be turned on in a
native image). The Docker Hub tag `roguekishore/vantage:graal` was not rebuilt or pushed.

## 5. One clock (UTC) and the ap-south-1 hosting question

`battles.started_at` is written by the JVM; `judge_jobs.created_at` is written by MySQL (`NOW(3)`); solve time subtracts one
from the other. They now cannot disagree, whatever zone the host or the MySQL server (EC2, RDS in `ap-south-1`) is in:

1. `SpringappApplication.main` sets the JVM default zone to UTC; the images set `TZ=UTC` and `-Duser.timezone=UTC`.
2. `vantage-time.properties` sets `connection-init-sql=SET time_zone = '+00:00'` on every pooled connection and
   `hibernate.jdbc.time_zone=UTC`.
3. `config/TimeConsistencyCheck` runs first at startup and refuses to boot if `SELECT NOW(3)` and the JVM clock differ by
   more than 60 s.

Proven with a MySQL server deliberately set to IST: the unpinned DB is 5.5 h ahead of the JVM; the pinned session agrees
within 5 s; with the pin removed the app refuses to start. The JVM and native images both passed this, including a cold
native boot against the IST server. The SQS client region already defaults to `ap-south-1`.

## 6. Bugs found by running it, and one data gap

Found on the first real 2-instance run, fixed, each with a test that fails without the fix:

1. **First boot of two instances on an empty database crashed one of them** (`Duplicate entry 'Absolute Programming Basics'`):
   every seeder is check-then-insert. Fixed with a MySQL named lock (`StartupSeedLock`); `StartupSeedRaceIT`.
2. **Both players readying up at the same instant left the battle in WAITING until the lobby timeout cancelled it** (5 of 5
   battles in the first smoke; nearly all of 40 in `ReadyUpRaceIT`). Fixed with a row lock at the start of `readyUp`.
3. **Native image failed to start on an empty database** (`cbe.csv` not in the native resources): hint added.
4. **Extension regression from the auth-matrix change** (401 wiped the saved login): the popup now reads `GET /api/sync/profile` with the
   scoped extension token and only clears state on a 404.

Not fixed:

- **26 of 113 seeded problems have no test cases in the catalog**, so a submission to them can never be Accepted and returns
  `RUNTIME_ERROR` (e.g. `binary-search`, `fibonacci-number`, `valid-palindrome`, `move-zeroes`, `course-schedule`,
  `first-unique-character-in-a-string`, `top-k-frequent-elements`, `sort-an-array`, `powx-n`). This is the catalog image in
  this repo; check whether production has the same gap. If it does, about one battle in five is unwinnable.
- Concurrent first-touch creation of a user's `player_stats` row can deadlock (seen while writing `ReadyUpRaceIT`; the
  existing race tests pre-create the rows for the same reason). Not hit by k6 here.
- A request to an unknown `/api/...` path returns 500 (`NoResourceFoundException` is caught by the global handler), not 404.

## 7. Not measured

Real AWS SQS and the Lambda judge; sustained submission throughput; the AWS SDK and Lettuce under native; behaviour with
the load generator on a separate machine; route smoke (366/370 at the last run) was not re-run.
