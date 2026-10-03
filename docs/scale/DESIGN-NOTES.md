# Scale-out design notes

Why each piece of the scale-out work is built the way it is. The proof for each is in `GUARANTEES.md`; the measurements
are in `RESULTS-ec2.md`.

## Test safety, dependencies, `ScaleConfig`

Plain `mvn test` used to boot the whole app against whatever database the local config pointed at, which could be
production. Now unit tests (surefire) skip everything under `it/`, and the one test that boots Spring lives in `it/`,
runs only with `-Pit` (failsafe), and talks to a throwaway MySQL 8.0 Testcontainer. Real MySQL is used rather than H2
because `SKIP LOCKED` and conditional-`UPDATE` races behave differently on H2 and would prove nothing.

New defaults sit in a committed `vantage-scale.properties` loaded by `ScaleConfig`, because `application.properties`
is gitignored and missing from clones; `@PropertySource` has lower precedence, so the real file and env vars still
win. Every feature flag defaults to the previous behaviour (queue off, Redis off, experiments off), so the code deploys
to a single box with no new infrastructure. Dependencies are frozen in one pom change: Boot-managed artifacts stay
unpinned; ShedLock 7.10.1 and the AWS SDK BOM 2.55.11 are pinned exactly for reproducible builds. The SQS client uses the
lightweight url-connection HTTP client (apache and netty excluded) to keep the native image small.

## Seams first

`BattleService` had grown into one 1,900-line class that did matchmaking, lobbies, judging, completion, ELO and every
WebSocket broadcast. Every scaling feature (Redis bridge, async judging, idempotent completion) would have had to edit
that same file, so no two people could work in parallel without conflicts.

So before adding any feature it was cut along its natural joints, moving code only, changing no logic:

- `RealtimePublisher`: the one class allowed to send STOMP or SSE messages. By default it delivers locally; with the
  flag on it bridges to Redis without touching any caller.
- `MatchmakingService`: the queue and pairing.
- `BattleJudgingService`: submitting code and scoring it.
- `BattleLifecycleService`: finishing a battle (winner, ELO, rewards, forfeit, timers).
- `BattleService`: what is left, the lobby, state, results, history and group rooms.

Dependencies only point one way (Judging -> Lifecycle -> BattleService, Matchmaking -> BattleService), so there are no
circular beans. Pure helpers (`determineWinner`, group rewards) are static so `BattleService` can use them without
depending on Lifecycle. Transaction boundaries and broadcast order are unchanged.

Broadcast blocks (try/catch inside outer transactions) previously self-called the state and result builders. After the
split they went through the `BattleService` proxy, so a caught exception would mark the outer transaction
rollback-only. The bodies of `getBattleState`, `getBattleResult`, `getGroupBattleState` and `getGroupBattleResult` now
live in non-transactional `BattleViews` (judge-id resolution in `JudgeProblemIdResolver`); `BattleService` keeps its
`@Transactional` methods as delegates for controllers, and the new services call `BattleViews` directly.

## Race-free terminal transitions

A battle can end in several ways at the same moment (both players finish, someone forfeits, the timer fires). The old
code read the state, saw "ACTIVE", and then changed it, so two threads could both see ACTIVE and both pay out ELO and
coins. Now every ending first runs one conditional `UPDATE` in the database
(`UPDATE battles SET state=... WHERE id=? AND state IN (...)`). The database lets exactly one of them change the row;
that caller gets "1 row affected" and is the only one that applies ELO, rewards and broadcasts. Everyone else gets 0
and quietly stops. This was chosen over `@Version` because `ddl-auto=update` would add a version column that existing
rows cannot satisfy.

A 1v1 that hits the timer now completes through `determineWinner` (a tie is a draw, ELO at 0.5 each) instead of being
silently cancelled, and a cancelled battle's result endpoint returns 200 with `state="CANCELLED"` instead of 409.
`ended_reason` (nullable) records why the battle ended. A sweep in the 5-second timer job also completes any ACTIVE 1v1
where both players already solved everything.

How the test is built: `BattleTransitionRaceIT` pre-creates `PlayerStats` and `WeeklyStats` for both players (xp 100,
coins 500) and asserts exact xp, coins, weekly xp/coins and `BATTLE_WIN` transaction counts (winner 75xp/60c, loser
15xp/10c, forfeiter nothing, plus the one-time first-win achievement). `battleRating` is assigned an absolute value
computed from `ratingBefore`, so a double-apply of ELO is idempotent on that column and cannot be detected through it;
"applied once" is proven by xp, coins, weekly stats and transaction counts instead.

## Matchmaking with `SKIP LOCKED`

Every app instance runs the matchmaker every 5 seconds. Instead of electing one instance with a lock (which makes the
others idle and adds a lock service that can itself fail or expire mid-run), each instance claims its own batch of queue
rows with `SELECT ... FOR UPDATE SKIP LOCKED`. The database hands each instance rows nobody else holds, silently
skipping rows another instance already claimed. So two instances can never pair the same user, and a crashed instance
just releases its row locks when its transaction dies. More instances means more matching throughput, not less.

How it works: one transaction per (mode, difficulty). Claim up to `vantage.matchmaking.batch-size` rows sorted by
rating, walk the sorted list pairing each player with the first rating-adjacent compatible one (stop scanning once the
rating gap exceeds the widest band, so it is no longer O(n squared)), create the battle and delete both queue rows in
the same transaction, then broadcast after commit. Compatibility rules are unchanged (casual 300; ranked 200 plus 50
per 30 s of the longer wait; duration must match). A batch can miss a partner sitting in another instance's claimed
rows; they are simply paired on the next tick.

Why the first version deadlocked and what fixed it: the leaver ran `DELETE ... WHERE user_id = ?`, which InnoDB
executes by locking the unique `user_id` index entry first and then the primary-key row. The matcher had already
locked that PK row (and the (mode, difficulty) index entry) through its claim, and then deleted by `user_id`, which
needs the `user_id` index entry the leaver held, so each side waited for the other: a classic opposite-order deadlock.
The fix makes the two sides never wait on each other: the matcher deletes by primary key
(`DELETE ... WHERE id IN (...)`), and `leaveQueue` first runs `SELECT id ... WHERE user_id = ? FOR UPDATE SKIP LOCKED`,
so if a claim holds the row it is skipped and the leave is a no-op (the user is being matched), otherwise it deletes by
that id. Because the leaver never blocks on a row the matcher owns, no wait cycle can form, and no retry is needed.

## ShedLock for scheduled jobs

Every instance runs every scheduled job, so with two instances the battle timer, queue cleanup, streak reset and
friend-challenge expiry all ran twice. A database lock now wraps each job: the first instance to insert or update a row
in the `shedlock` table owns that job's window, the others skip. ShedLock is called programmatically (a
`LockingTaskExecutor` bean wrapped around the job body) instead of through `@SchedulerLock`, because the annotation
needs AOP proxies, which is the thing that hurts in a GraalVM native image. Expiry uses the database clock
(`usingDbTime`), so two servers with drifting clocks cannot both think the lock is free. `lockAtLeast` stops a fast job
from being re-run by a second instance right after the first finishes. The table is made by a JPA entity so `ddl-auto`
creates it.

The duplicate `QueueTimeoutJob` was deleted since it did the same cleanup as `BattleTimerJob.cleanupQueue`. The battle
timer used to resolve every expired battle in one transaction, so one bad battle rolled back all of them; now each
battle gets its own `REQUIRES_NEW` transaction and a failure is logged and skipped. ShedLock 7.10.1 compiles and works
against Spring Framework 7 / Boot 4 with no fallback needed.

## Redis realtime bridge

With two app instances, a battle event raised on instance A must reach a browser connected to instance B, but each
instance only knows its own WebSocket and SSE connections. So every send goes through one class, `RealtimePublisher`.
With the flag off it just delivers locally, exactly as before. With the flag on it publishes a small JSON envelope
(version, origin, kind, destination, user, payload) to one Redis channel, and every instance, including the one that
published, listens on that channel and delivers locally. Because the origin also delivers from the channel, local and
remote clients get the same bytes through the same path. Plain Redis pub/sub was chosen over a RabbitMQ broker relay
because the topics are plain `/topic` names with the user id in them, so a bridge is exact, and Redis is tiny enough for
a free-tier box. If Redis is down, the publish fails, a warning is logged and the event is delivered locally, so the
origin never silently loses a message. SSE publishes after the transaction commits, as before.

The app defines no `@MessageMapping` handlers, so the STOMP interceptor now rejects every client SEND; before, a client
could SEND to `/topic/**` and spoof events to other users. New config beans exist only when
`vantage.realtime.redis.enabled=true`. The Redis-failure fallback runs inside `afterCommit`, where the old `deliverLocal`
would register a synchronisation that never fires and drop the event; it now calls the non-deferring
`ProgressEventService.deliverLocalNow` (covered by `RealtimePublisherFallbackTest`).

## Frontend STOMP client and idempotent submit

Before, each of the three stores opened its own WebSocket, reconnected forever every 5 seconds, and subscribed after
connecting once, so a dropped connection lost every topic and the 3-second lobby poll stacked a fresh subscription each
time. Now one shared client per tab (`services/stompClient.js`) owns the connection. Stores ask it to
`subscribe(destination, handler)`; asking twice for the same destination only swaps the handler, so polling can never
pile up subscriptions. The client remembers every destination and re-applies them in `onConnect`, so a reconnect
restores everything. Reconnect backs off from 1 s up to 30 s and stops after 10 failures instead of hammering the
server; the next `connect()` starts it again. When the user store goes to null (logout), every store resets itself and
the shared client is deactivated, so the next user inherits nothing.

For submit, the browser makes one random `Idempotency-Key` per click and reuses it on network retries, so a retry after
a lost response can never create a second judge job. If the server answers 202 the client polls the job once a second
(up to 130 s) and hands the page the same result object it got from the old synchronous 200 response.

Files: `services/stompClient.js`, `services/idempotentSubmit.js` (shared by `battleApi` and `groupBattleApi`), the three
stores, with tests next to them. Jest cannot resolve the `@/` alias, so the stores test mocks `friendsApi` virtually and
`useFriendsStore` imports `stompClient` relatively.

## Judge queue

Battle submissions return 202 and are written to a `judge_jobs` row (unique `(user_id, idempotency_key)`) and sent to
SQS. A capped pool of consumers in the Spring app claims a job with a conditional `UPDATE`, calls the existing Lambda,
and finalises the job and the `battle_submissions` row once, so retries cannot double-award XP or ELO. A stale-job
sweeper re-queues expired leases without failing a backlog, and everything sits behind
`vantage.judge.queue.enabled=false`; with it off a submit judges inline and returns 200.

## One clock

`battles.started_at` is written by the JVM and `judge_jobs.created_at` by MySQL (`NOW(3)`); solve time subtracts one
from the other, so the two clocks must agree whatever zone the host or the MySQL server is in. `SpringappApplication.main`
sets the JVM default zone to UTC, the images set `TZ=UTC`, `vantage-time.properties` sets the pooled connection's session
to `+00:00` and Hibernate to UTC, and `config/TimeConsistencyCheck` runs first at startup and refuses to boot if
`SELECT NOW(3)` and the JVM clock differ by more than 60 seconds. The rule that falls out: never write a time with the
JVM clock and compare it with a database clock.

## Auth matrix

`AuthMatrixIT` calls 33 routes four ways (anonymous, user acting for another user, user acting for self, admin via the admin token). Getting
it to pass meant removing the `?userId=` fallback in `CurrentUser` and making `/api/auth/` non-public, which turned
`GET /api/users/{id}` into a 401 without a token. The browser extension called it without one and would have wiped its
linked state, so the extension token now has scope `ext`, reaches only `/api/sync/**`, and the popup reads its account
from `GET /api/sync/profile`, clearing saved state only on a 404. Any logged-in user can still read another user's
`/stats` and `/achievements`; that visibility is a product decision, not an oversight.

## First-finisher-ends A/B experiment

The question: should a 1v1 end the moment the first player solves every problem? The unit of the experiment is the
battle, not the user, because both players in a battle must play under the same rule; if the rule followed the user, one
player could be racing a clock the other does not have. So the variant is a hash of the experiment key and the battle id:
SHA-256 of `first-finisher-ends:<battleId>`, first 8 bytes as an unsigned number, mod 10000, and anything below the
allocation (5000 basis points by default) is treatment. The same battle id always gives the same answer on any instance
with no coordination, and five frozen vectors computed independently in Python guard against drift.

The variant is written once, when the battle is created, into `battle_experiments`, and the first-finisher check reads
that row. Control is whatever the global `continueAfterFirstFinisher` flag does; treatment ends the battle when the first
player has solved everything. With experiments disabled (the default) no row is written and every battle is control.

What decides it: completed battles with a natural result versus forfeits and cancellations, mean battle duration, and
mean problems solved per player, all from the admin report endpoint (token guarded, fails closed). If treatment shortens
battles without raising forfeits or cutting problems solved, ending early is the better rule. The report shows outcomes
only; picking a winner needs enough battles, which the report's counts make visible. Battles created outside
matchmaking (friend challenges and rooms) get no experiment row and run as control.

## Scale-test environment

The goal is to run the real application twice, side by side, behind one front door, with every shared service the
scale work added (Redis for realtime fan-out, an SQS-compatible queue for judging) running locally, so a load test
exercises the same code paths production would, without touching production or AWS.

- **Two instances, one nginx.** The instances are identical except for `VANTAGE_INSTANCE_ID` (a and b). A user's
  WebSocket may land on either, so the Redis bridge has to carry every topic message across; matchmaking and the timer
  jobs run on both and must not double-act (`SKIP LOCKED` and ShedLock), which is exactly what the load test checks.
- **SockJS stickiness.** SockJS sends several requests for one session, and they must reach the same instance. nginx
  extracts the session id from `/ws/{server}/{session}/...` and hashes on it; anything else gets a random key so
  ordinary REST traffic spreads evenly.
- **ElasticMQ for SQS, stub judge for Lambda.** ElasticMQ speaks the SQS API with a dead-letter queue, so the queue code
  runs unchanged (`vantage.judge.queue.endpoint` points at it). The stub judge sleeps 1.5 s and says Accepted, so
  throughput numbers measure the queue and database, not a real sandbox. `STUB_FAIL_RATE` forces 503s.
- **Image build.** `deploy/scale-test/springapp.Dockerfile` is a copy of `springapp/Dockerfile` that deletes a local,
  gitignored `application.properties` before building, so no developer secret or production URL can leak into the image;
  all settings come from compose env vars with obviously local placeholder values.
- **`verify.sql`** proves the correctness claims after a run: nobody is in two live battles, ELO chains without gaps, an
  idempotency key never creates two jobs, and each finished job produced exactly one submission row.

## Secrets fail-fast and the login hash

The JWT secret used to have a built-in fallback string, so a deploy that forgot to set it silently signed tokens with a
value anyone can read in the source. Now there is no default: `JwtUtil` refuses to start if `jwt.secret` is missing,
blank or under 32 UTF-8 bytes, and the error says what to set (`JWT_SECRET`). The check lives in one static method so a
unit test can call it directly. `judge.token` and `vantage.admin.token` already default to empty and their guards fail
closed, so they were left alone.

Login used to accept the stored bcrypt string as a password through a legacy "plain text equals stored value" branch,
so anyone who saw a database dump could log in with the hash itself. The branch is gone; only bcrypt matching remains.

## Judge housekeeping

The judge ran behind serverless-express, which turned any unmatched URL into a 500 and made typos look like server
faults, so a JSON 404 catch-all is the last middleware in `createApp()`. The SAM template has a `ReservedConcurrency`
parameter that defaults to 0, and a Condition makes 0 mean the property is left out entirely: the account's total Lambda
concurrency is 10 and AWS insists that 10 stay unreserved, so any reservation fails the deploy and could starve other
functions. The default keeps the current behaviour; raise the quota first. The root README also claimed PostgreSQL and
Redis as core infrastructure, but the app uses MySQL, and Redis only exists as the optional, off-by-default realtime
bridge, so the docs now say that.

## Native image readiness

The native image has no reflection by default, so every record Jackson serialises must be listed in
`reflect-config.json`, and that list is checked against the source rather than trusted. `AppRuntimeHints` also scans for
records at AOT time, so the JSON file is a second safety net.

- `getReferenceById`: none in code (one comment in `UserProgressService` explains why it is avoided).
- `@ManyToOne` / `@OneToOne`: every one is `FetchType.EAGER`.
- ShedLock uses JDBC against the `shedlock` table and needs no reflection hint.
- The native image has been built and run on ARM (see `RESULTS-ec2.md`), including a cold boot on an empty database.

Still to verify under a native build: Lettuce (Netty), the AWS SDK v2 SQS client and its HTTP client service-loader
entries, and `BattleExperiment` with its `@IdClass` `BattleExperimentId`, which Hibernate instantiates by reflection and
Spring AOT may not register.
