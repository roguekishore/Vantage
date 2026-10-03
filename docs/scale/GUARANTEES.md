# Guarantees and the evidence behind them

What the scale-out work guarantees, and the test that proves each one. Run the integration tests with
`cd springapp && sh ./mvnw -q -Pit verify` (needs Docker) and the unit tests with `sh ./mvnw -q test`.

For each guarantee the "without it" column records what the test reports when the feature is removed, so the test is
known to fail for the right reason.

| Guarantee | Evidence | Without the feature |
|---|---|---|
| No user is ever paired into two battles, however many instances run matchmaking (`FOR UPDATE SKIP LOCKED`, rating-banded queue) | `MatchmakingSkipLockedIT` 3/3: 3 matcher threads, 400 users, random leaves. Design: `DESIGN-NOTES.md`, matchmaking (includes the InnoDB deadlock that was found and fixed with PK-ordered deletes) | `user 5000230 is in two battles` |
| A battle ends exactly once; ELO, XP and coins are applied once however the endings race (conditional `UPDATE` on the battle row) | `BattleTransitionRaceIT`: 8 threads x 50 iterations, asserts exact xp, coins, weekly stats and `BATTLE_WIN` counts | `iteration 0 u1 weekly xp ==> expected: <0> but was: <75>` (the forfeiter was also paid) |
| Judge submissions are idempotent: a retried submit never creates a second job, and a job is finalised once even with several consumers or a consumer that dies after claiming | `JudgeQueueIT` 7/7 (same key sent 5x concurrently gives one job and one submission; two consumers on one message give one finalise; a dead consumer's message is redelivered and finalises once; the requeuer resends a lost message; judge 503 x3 fails the job and records nothing; a battle ending while queued fails the job), `JudgeQueueDisabledIT` (flag off keeps the synchronous 200 path). Live stack: `verify.sql` checks 3 and 4 pass. Real SQS and the Lambda judge are not exercised. | `only the claim winner judged ==> expected: <1> but was: <2>` |
| Realtime events reach clients on every instance (Redis pub/sub bridge), and clients cannot publish to `/topic/**` | `RealtimeBridgeIT` 3/3 plus `RealtimePublisherFallbackTest` | `subscriber on B got nothing from A`, and client SEND accepted |
| Scheduled jobs run once per window across instances (ShedLock on DB time) and one bad battle cannot abort a batch | `SchedulingLockIT` (ShedLock 7.10.1 works on Spring 7) | `job body must run once per lock window ==> expected: <1> but was: <2>`; a single-transaction batch lets one poison battle abort all |
| A/B bucketing is deterministic: the same battle id gets the same arm on every instance | `ExperimentIT`, `ExperimentHasherTest` 3/3, `BattleJudgingExperimentHookTest`. Frozen vectors: 1 to 8314, 2 to 2444, 42 to 1932, 1000 to 4295, 987654321 to 6912; 10,000 ids gave 50.54% treatment | a broken hash prefix fails the vectors (8314 became 3646) |
| Every API route is authenticated as intended: anonymous, user acting for another user, user acting for self, and admin via the admin token only (33 routes x 4 callers). The extension's scoped token reaches only `/api/sync/**` | `AuthMatrixIT` 5/5, including `extensionTokenReadsOnlyItsOwnSyncProfile` | `auth me / anon: got 200 want 401` (the old `?userId=` fallback restored) |
| One clock: solve time cannot be skewed by JVM and database time zones | `TimeConsistencyIT` 2/2 against a MySQL server in IST (+05:30): the unpinned DB is 5 h or more ahead of the JVM, the pinned session agrees within 5 s, and with the pin removed the app refuses to start. `TimeConsistencyCheckTest` 3/3. The native image also boots with "Time check OK" against the IST server | n/a (the IT demonstrates the bug without the pin) |
| Two instances can boot on an empty database, and two players readying up at the same instant start the battle | `StartupSeedRaceIT` (named lock `StartupSeedLock`) and `ReadyUpRaceIT` (40 simultaneous pairs, row lock). | one instance dies on `Duplicate entry 'Absolute Programming Basics'`; nearly all battles stay WAITING |
| The JWT secret has no fallback, and a stored password hash is not a password | `JwtUtilSecretTest`, `UserServiceLoginTest.storedHashIsNotAPassword` | n/a |

## Measured

| Claim | Evidence |
|---|---|
| 400 concurrent users across 2 instances at p95 239 ms, 0% HTTP errors | `RESULTS-ec2.md`: c7g.2xlarge (ARM, 8 vCPU, 16 GiB), 2 JVM instances behind nginx plus MySQL 8, Redis and ElasticMQ on the same box, **k6 on the same box**, stub judge. Ladder 25/50/100/200/400 at 2 minutes per step: p95 97 / 97 / 97 / 100 / 239 ms, HTTP failures 0%, WebSocket connects 100%, `verify.sql` 4/4 after every step. 600 users breaks the 500 ms p95 SLO (2.4 s) with 0% errors and integrity intact. |
| GraalVM native image: 227 MB binary, 106 MB compressed, 105 MiB peak anon memory under the 10-user smoke | Built in about 9 minutes on the same ARM instance. Boots in 0.8 s warm and 3.6 s cold. Same k6 smoke as the JVM stack passes (26/26 battles completed, p95 96 ms, `verify.sql` 4/4) in a 320 MiB, no-swap container with `-Xmx160m`, 0 OOM kills. The queue and Redis flags were off in that run, so the AWS SDK and Lettuce paths are not yet exercised under native. |

State these with their conditions: one 8-vCPU box with a co-located load generator and a stub judge.
