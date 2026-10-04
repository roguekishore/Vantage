# Handoff: VANTAGE scale-out run

Paste `docs/RUN3_PROMPT.md` to start the run. You are the **orchestrator**. You plan, dispatch, gate, commit and log.
Subagents do the reading and writing. This file is the spec. Every decision in it is frozen. If something here turns out
to be impossible, record it under "Owner decisions needed" in `docs/scale/PROGRESS.md`, skip that unit, and continue. Do
not substitute your own design.

Repo: `https://github.com/roguekishore/Vantage.git`. This file lives on `polish`, and the run commits on **`polish`**
(owner direction 2026-10-04: one branch, no `scale` branch). It runs alongside the UI run 2 work, launched by
`docs/RUN3_PROMPT.md`, whose rules win where they conflict with this file. `polish` differs from `main` (`0613347`) only in
UI and docs; `springapp/`, `judge/`, `reactapp/src/stores/` and `reactapp/src/services/` are identical. Paths are
relative to the repo root. Java paths are relative to `springapp/src/main/java/com/backend/springapp/` unless they start
with `springapp/`.

---

## 0. Hard rules (these outrank everything below)

1. **`main` is off-limits.** Commit only on `polish`. Never check out, commit on, push to, merge, rebase, reset or
   delete `main`, and never merge or rebase anything into or out of it. Never open, approve or merge a pull request.
   Push only `polish`, never force, never `--no-verify`. Merging is the owner's job.
2. **No production.** Never point a build, test, k6 run or script at `vantagecode.tech`, the production database, the
   production catalog (`vantagejudge.themaverick.tech`) or the production Lambda. Everything runs against local
   containers or the stub judge.
3. **No AWS writes.** Do not create, change or delete any AWS resource (SQS, IAM, Lambda, EC2, quotas). Infrastructure
   changes are written as files (SAM template, compose, docs) and listed for the owner.
4. **Secrets never go into git.** `springapp/src/main/resources/application.properties` is gitignored (pattern
   `application.properties` in `springapp/.gitignore`) and absent from a fresh clone. Do not create it in the repo. All
   new config goes through the frozen keys in §4.1, with safe defaults.
5. **Frontend edits are restricted to `reactapp/src/stores/**` and `reactapp/src/services/**`.** The `polish` branch
   is redesigning every page and component; touching them would make the two branches impossible to merge. If a fix
   seems to need a page or component edit, record it as an owner decision instead.
6. **Subagents use Sonnet 5.5** (owner direction 2026-10-04). The orchestrator (Opus 5.5) writes no code.

---

## 1. Goal and why

VANTAGE is a gamified DSA platform: Spring Boot 4.0.2 backend (GraalVM native image), React frontend, a Node problem
catalog, and an AWS Lambda code executor. It currently assumes **one backend instance**: an in-memory STOMP broker,
in-memory SSE emitters, scheduled jobs that would run on every instance, a matchmaker that loads the whole queue, and
judge calls made synchronously inside a database transaction.

This run makes the backend **correct when scaled horizontally, and provably so**. It is resume material for a backend
internship at Booking Holdings: every feature below maps to a resume claim (§11), and every claim must be backed by a
test or measurement an interviewer could ask about. The owner will defend this code in interviews, so:

- **Prefer the boring, explainable mechanism.** Every unit's acceptance criteria include a one-paragraph "why this
  design" entry in `docs/scale/DESIGN-NOTES.md`, written for an interviewer.
- **Correctness is proven by tests, not claimed.** Concurrency features need a concurrency test that fails without
  the feature.

### Features in scope

| ID | Feature | Proves |
|---|---|---|
| F-MM | Matchmaking with `SELECT … FOR UPDATE SKIP LOCKED` and rating-ordered pairing; every instance may run it | Row-level locking, no double-matching |
| F-JQ | Battle submissions through SQS with idempotency keys and a lease-claimed job table | At-least-once delivery made exactly-once in effect |
| F-RT | Redis pub/sub fan-out for STOMP and SSE across instances | Horizontal scaling of realtime |
| F-LK | ShedLock (DB time) on every scheduled job except matchmaking | Single-runner jobs in a cluster |
| F-AB | Deterministic A/B bucketing for one battle rule, with a per-variant report | Experimentation |
| F-CO | Race-free battle terminal transitions; 1v1 battles always resolve with ELO | Exactly-once ELO and rewards |
| F-FE | Frontend STOMP client fixes (one shared client, resubscribe on reconnect, bounded retry) | Clients survive instance failover |
| F-LT | 2-instance test environment behind nginx, k6 scripts, post-run SQL verification | Measurable, reproducible proof |
| F-HK | Judge housekeeping: 404 catch-all, optional reserved-concurrency fuse, README fix | Operational hygiene |
| F-SEC | Security fixes S1–S4 and S8 (Appendix A) | Safe to link publicly |

Out of scope: page/component redesign, new product features, ELO formula changes, practice-mode judging (`/api/judge/*`
stays synchronous), anything in Appendix A not listed above.

---

## 2. Code map (verified on `main` @ `0613347`; unchanged on `polish`)

| Thing | Where | Fact |
|---|---|---|
| God class | `gamification/battle/BattleService.java` (1,931 lines) | Matchmaking, lobby, submit, judging, completion, ELO, broadcast |
| Broadcast choke point | `BattleService.java:1235` `broadcastSafe(dest, payload)` | Wraps `messagingTemplate.convertAndSend` |
| Other STOMP senders | `friend/FriendService.java:252`, `friend/challenge/FriendChallengeService.java:376` | Direct `convertAndSend` |
| SSE | `sse/ProgressEventService.java:31` | In-memory `Map<Long, List<SseEmitter>>`. `publish(uid, ProgressEvent)` callers: `sync/SyncService.java:105,184`, `user/UserProgressService.java:90,152` |
| Broker | `common/WebSocketConfig.java:43-58` | `enableSimpleBroker("/topic")`, app prefix `/app`, endpoint `/ws` with SockJS |
| STOMP auth | `common/StompAuthChannelInterceptor.java:38-73` | CONNECT auth, SUBSCRIBE scoping. **SEND is not checked** (S5) |
| Matchmaking | `BattleService.java:196-245` `processMatchmaking()` | `queueRepo.findAll()`, groups by `mode:difficulty`, sorts by `joinedAt`, O(n²) pair scan, broadcasts `/topic/queue/{uid}/matched` after commit |
| Rating rules | `BattleService.java:247-265` | CASUAL: \|Δ\| ≤ 300. Ranked: \|Δ\| ≤ 200 + 50 × ⌊maxWaitSec/30⌋. Duration must match when `customTimer1v1Enabled` |
| Queue entity | `gamification/battle/MatchmakingQueue.java` | Table `matchmaking_queue`; `userId` unique; `mode`, `difficulty`, `problemCount`, `durationMinutes`, `battleRating`, `joinedAt`; index `(mode, difficulty)` |
| Submit | `BattleService.java:527` `submitCode(...)`, `@Transactional` | Pre-checks, then `callJudge` (`:677`, via `judge/JudgeProxyService`), then verdict/solve/FFA scoring/maybe `completeBattle`. **Judge call is inside the transaction** (B2) |
| Submit DTOs | `SubmitCodeRequest(userId, problemIndex, language, code)`, `SubmitResultDTO(verdict, executionTimeMs, problemsSolved, totalProblems, allSolved, firstFailedInput, firstFailedExpected, firstFailedActual, firstFailedError)` | Records |
| Submission entity | `gamification/battle/BattleSubmission.java`, table `battle_submissions` | `verdict` is NOT NULL. Leave this table's schema untouched |
| Completion | `BattleService.java:734` `completeBattle`, `:962` `forfeit`, `:1110-1150` timer paths, `:1248` `abandonBattle` | Check-then-act on `state`; can double-apply ELO (B3) |
| ELO | `BattleService.java:863` `applyElo(p1, p2, winnerId)` | `BattleParticipant.ratingBefore` (default 1200) / `ratingAfter`; `PlayerStats.battleRating` |
| Battle states | `BattleState`: `WAITING, ACTIVE, COMPLETED, CANCELLED` | `Battle.state`, `Battle.winnerId`, `Battle.completedAt`; no `@Version` |
| Feature flags | `BattleService.getBattleFeatureFlags()`; `@Value battle.customTimer1v1.enabled`, `battle.continueAfterFirstFinisher.enabled` | Exposed at `GET /api/battle/feature-flags` |
| Scheduled jobs | `MatchmakingJob` (5 s), `BattleTimerJob.run` (5 s: `checkExpiredBattles`, `cancelExpiredLobbies`), `BattleTimerJob.cleanupQueue` (30 s) **and** `QueueTimeoutJob` (30 s), both calling `cleanupStaleQueue` (B15), `streak/StreakResetJob` (cron midnight), `FriendChallengeService:300` (30 s) | All run on every instance |
| Presence | `friend/presence/*` | DB-backed, already multi-instance safe |
| Frontend STOMP | `reactapp/src/stores/useBattleStore.js`, `useGroupBattleStore.js`, `useFriendsStore.js` | Three `new Client(...)` (F5); see Appendix A F1–F3 |
| Frontend submit | `reactapp/src/services/battleApi.js:77`, `groupBattleApi.js:124` | Both `POST /api/battle/{id}/submit` |
| Judge app | `judge/src/app.js` `createApp()` | No catch-all: unmatched routes become 500 under serverless-express |
| Judge SAM | `judge/template.yaml:45` | `ReservedConcurrentExecutions` removed; the account's total Lambda concurrency is 10 |
| Tests | `springapp/src/test/...`: `SpringappApplicationTests.contextLoads` (**boots against the production DB defaults, so never run it as-is**), two battle unit tests | |
| JDK | Any JDK ≥ 17 (`java.version` is 17). On the owner's Windows box: `C:\Program Files\Java\jdk-23` (PATH `java` is 14 and fails). On Linux: whatever `java -version` reports if ≥ 17, else a JDK under `/usr/lib/jvm` | `springapp/mvnw` is committed without the executable bit: run it as `sh ./mvnw` |
| Config keys today | `spring.datasource.{url,username,password,driver-class-name}`, `spring.jpa.hibernate.ddl-auto` (=update), `spring.jpa.show-sql`, `jwt.secret`, `jwt.expiration-ms`, `auth.cookie.{max-age-seconds,same-site,secure}`, `auth.extension-token.expiration-ms`, `cors.allowed-origins`, `judge.base-url`, `judge.token`, `catalog.base-url`, `battle.*` above | Values are not in git |

Native-image rules (`CLAUDE.md`, "Native image status"): Boot 4 needs GraalVM 25; every record used in a
request/response body needs an entry in `springapp/src/main/resources/META-INF/native-image/com.backend/springapp/reflect-config.json`
(nested records use `$`); all `@ManyToOne`/`@OneToOne` stay EAGER; never use `getReferenceById`.

---

## 3. Frozen decisions

| # | Decision | Why |
|---|---|---|
| D1 | **Extract seams first** (P1): `RealtimePublisher`, `MatchmakingService`, `BattleJudgingService`, `BattleLifecycleService`, moved out of `BattleService` with no behaviour change | Every feature touches the god class; seams let units own disjoint files and run in parallel |
| D2 | **Every instance runs matchmaking**; correctness comes from `FOR UPDATE SKIP LOCKED`, not from a lock | Shows row-level locking doing real work; ShedLock covers the other jobs |
| D3 | **Battle terminal transitions are conditional UPDATEs** (`… WHERE id=? AND state IN (…)`, rows affected == 1 wins). No `@Version` | `ddl-auto=update` would add a nullable version column that existing rows can't satisfy |
| D4 | **The SQS consumer lives in the Spring app**, calls the existing Lambda function URL, and is capped at `consumers` threads. The Lambda is unchanged | The executor has no catalog and no DB. The queue buffers bursts below the account's 10-concurrency limit, so there's no throttling |
| D5 | **New `judge_jobs` table**; `battle_submissions` is written only when a job finalizes | `battle_submissions.verdict` is NOT NULL, and Hibernate `update` will not relax an existing column |
| D6 | **Redis pub/sub bridge**, not a STOMP broker relay. Each instance keeps its simple broker; every send publishes to Redis; every instance (origin included) delivers locally | Topics are plain `/topic/...{userId}` (no `/user` destinations), so a bridge is exact. Redis is about 10 MB; RabbitMQ is too heavy for the free-tier box |
| D7 | **ShedLock used programmatically** (`DefaultLockingTaskExecutor` + `JdbcTemplateLockProvider.usingDbTime()`), no `@SchedulerLock` AOP. The `shedlock` table is created by a JPA entity | No proxies, so it's native-image safe. `ddl-auto=update` creates the table without `spring.sql.init`. DB time avoids clock skew |
| D8 | **A/B unit is the battle** (hash of experiment key + battle id), 50/50, one experiment: whether a 1v1 ends when the first player finishes | Both players in a battle must see the same rule |
| D9 | **Every new feature has an enable flag defaulting to the current behaviour**: queue off, Redis off, experiments off. ShedLock and SKIP LOCKED are always on (harmless on one instance) | The branch can deploy to today's single box with no new infrastructure |
| D10 | **All new defaults live in a committed `springapp/src/main/resources/vantage-scale.properties`**, loaded by `@PropertySource` on `config/ScaleConfig.java` | `application.properties` is gitignored and absent from clones; `@PropertySource` has lower precedence than it and than env vars |
| D11 | **Integration tests use Testcontainers MySQL 8.0** (plus Redis and ElasticMQ where needed), under `src/test/java/.../it/`, run with `-Pit` | `SKIP LOCKED` and conditional UPDATE races need real MySQL. H2 would prove nothing |
| D12 | **Practice judging stays synchronous**; only battle submissions use the queue | It grants nothing, and the scope stays small |
| D13 | **Local judging uses a stub executor** (`loadtest/stub-judge/`) | Runs without AWS; deterministic for correctness tests |
| D14 | **Dependency versions:** anything the Spring Boot 4.0.2 BOM manages stays unpinned (Boot-managed: data-redis, Testcontainers). ShedLock and the AWS SDK BOM are pinned to exact versions chosen in U0.3 and recorded in `PROGRESS.md` | Reproducible builds |
| D15 | **Fallback for D7:** if ShedLock does not compile or work against Spring Framework 7, implement `config/DbLeaseLock.java` with the same table and semantics (`UPDATE shedlock SET lock_until=?, locked_at=NOW(3), locked_by=? WHERE name=? AND lock_until <= NOW(3)`, plus an insert-if-absent) and record it | Same story, no dependency risk |

---

## 4. Frozen contracts

### 4.1 Config keys (all in `vantage-scale.properties` with these defaults; env vars override)

```properties
vantage.instance-id=${VANTAGE_INSTANCE_ID:${random.uuid}}

vantage.judge.queue.enabled=false
vantage.judge.queue.url=
vantage.judge.queue.endpoint=
vantage.judge.queue.region=ap-south-1
vantage.judge.queue.consumers=4
vantage.judge.queue.visibility-seconds=180
vantage.judge.queue.max-attempts=3
vantage.judge.queue.lease-seconds=170

vantage.realtime.redis.enabled=false
vantage.realtime.redis.channel=vantage:rt:v1
spring.data.redis.host=localhost
spring.data.redis.port=6379
management.health.redis.enabled=${vantage.realtime.redis.enabled}

vantage.matchmaking.batch-size=200

vantage.experiments.enabled=false
vantage.experiments.first-finisher-ends.allocation-bps=5000
vantage.admin.token=
```

`vantage.judge.queue.endpoint` is blank for real SQS and set to `http://elasticmq:9324` locally.
`vantage.admin.token` blank means admin endpoints return 403 (fail closed).

Also create `springapp/src/main/resources/application.properties.example`. It lists every key from the "Config keys
today" row in §2 with placeholder values (`changeme`, never a real value), plus a comment pointing to
`vantage-scale.properties`.

### 4.2 Schema (new tables only, all created by JPA entities under `ddl-auto=update`)

```
judge_jobs
  id               BIGINT PK auto
  battle_id        BIGINT NOT NULL
  user_id          BIGINT NOT NULL
  problem_index    INT NOT NULL
  language         VARCHAR(16) NOT NULL
  code             TEXT NOT NULL
  idempotency_key  VARCHAR(64) NOT NULL
  status           VARCHAR(16) NOT NULL      -- QUEUED | RUNNING | DONE | FAILED
  attempts         INT NOT NULL DEFAULT 0
  lease_until      DATETIME(3) NULL
  result_json      TEXT NULL                 -- serialized SubmitResultDTO when DONE
  error            VARCHAR(255) NULL         -- when FAILED
  created_at       DATETIME(3) NOT NULL
  updated_at       DATETIME(3) NOT NULL
  UNIQUE (user_id, idempotency_key)
  INDEX (battle_id, user_id)

shedlock
  name        VARCHAR(64) PK
  lock_until  TIMESTAMP(3) NOT NULL
  locked_at   TIMESTAMP(3) NOT NULL
  locked_by   VARCHAR(255) NOT NULL

battle_experiments
  battle_id       BIGINT NOT NULL
  experiment_key  VARCHAR(64) NOT NULL
  variant         VARCHAR(16) NOT NULL       -- control | treatment
  assigned_at     DATETIME(3) NOT NULL
  PRIMARY KEY (battle_id, experiment_key)
```

No changes to existing tables, except that U2.1 may add a nullable `ended_reason VARCHAR(24)` to `battles`. Hibernate
can add a nullable column safely.

### 4.3 HTTP

**`POST /api/battle/{id}/submit`.** The body (`SubmitCodeRequest`) is unchanged. There is a new request header,
`Idempotency-Key`, matching `^[A-Za-z0-9-]{8,64}$`.

- **Queue disabled:** behaves as today (200 + `SubmitResultDTO`). The header is optional and ignored, but the judge
  call is still moved out of the transaction (U3.4).
- **Queue enabled, header missing or invalid:** 400 `{"error":"Idempotency-Key header required"}`.
- **Queue enabled, new key:** pre-checks run synchronously, as today (battle ACTIVE, time left, participant, not
  forfeited, not already solved, 10 s rate limit). On pass, insert a `QUEUED` job and send the SQS message after
  commit. Respond **202** with `JudgeJobStatusDTO`.
- **Queue enabled, key already exists for this user:** 202 with the existing job's `JudgeJobStatusDTO`. No new job, no
  new message, and no rate-limit charge.

**`GET /api/battle/{id}/submissions/{jobId}?userId={uid}`** returns 200 `JudgeJobStatusDTO`. It returns 404 if the
job does not exist, or if it belongs to a different user or battle.

```java
public record JudgeJobStatusDTO(Long jobId, String status, SubmitResultDTO result, String error) {}
// status: QUEUED | RUNNING | DONE | FAILED; result non-null only when DONE; error non-null only when FAILED
```

**`GET /api/experiments/first-finisher-ends/report`** requires header `X-Admin-Token: <vantage.admin.token>` (403 on
blank or mismatch):

```java
public record ExperimentReportDTO(String experimentKey, boolean enabled, List<VariantStatsDTO> variants) {}
public record VariantStatsDTO(String variant, long battles, long completed, long cancelled, long forfeited,
                              double meanDurationSeconds, double meanProblemsSolvedPerPlayer) {}
```

Register the three new records (and any nested ones) in `reflect-config.json`.

**`GET /api/battle/{id}/result`** for a `CANCELLED` battle returns 200 with the existing result DTO plus a new
nullable `String state` field ("CANCELLED"), instead of 409 (B1). Adding a field is backward compatible.

### 4.4 SQS message

- Queue: standard, with a DLQ (`maxReceiveCount = 3`) and a visibility timeout of 180 s.
- Body: exactly `{"v":1,"jobId":<long>}`. No message attributes.
- The producer sends **after the DB transaction commits** (`TransactionSynchronization.afterCommit`). If the send
  fails, the job stays `QUEUED` and the `JudgeJobRequeuer` (a ShedLock job `judge-requeue`, every 30 s) re-sends jobs
  that are `QUEUED` with `updated_at` older than 60 s, at most `max-attempts` times.

**Consumer:** `vantage.judge.queue.consumers` threads. Each loops on `ReceiveMessage` (`MaxNumberOfMessages` 1,
`WaitTimeSeconds` 20). For each message:

1. **Claim** (its own transaction):
   `UPDATE judge_jobs SET status='RUNNING', attempts=attempts+1, lease_until=NOW(3)+lease, updated_at=NOW(3)`
   `WHERE id=:id AND (status='QUEUED' OR (status='RUNNING' AND lease_until < NOW(3)))`.
   If 0 rows: delete the message and stop. The job is already done, or another consumer holds a live lease.
2. **Judge**, outside any transaction: `JudgeProxyService.submit(problemId, language, code)` against the Lambda (or
   the stub).
   - **Infrastructure failure** (timeout, connection error, 5xx, empty body): do **not** finalize, and do not record a
     RUNTIME_ERROR (B2). If `attempts >= max-attempts`, set `FAILED` with `error='judge unavailable'` and delete the
     message. Otherwise leave the message to reappear after the visibility timeout.
3. **Finalize** (one transaction):
   1. Conditional `UPDATE judge_jobs SET status='DONE', result_json=?, updated_at=NOW(3) WHERE id=? AND status='RUNNING' AND attempts=:claimedAttempts`.
      If 0 rows, another attempt already finalized: stop.
   2. If the battle is no longer `ACTIVE`, set the job `FAILED` with `error='battle ended before judging completed'`
      instead, and record nothing.
   3. Otherwise insert the `battle_submissions` row and apply exactly today's post-judge logic (solved count, solve
      time measured from **`created_at` of the job**, not now; FFA points; completion triggers through
      `BattleLifecycleService`).
   4. Broadcast state after commit, as today.
4. Delete the message after a successful commit.

### 4.5 Redis realtime message

- Channel: `vantage.realtime.redis.channel`.
- Body: JSON

  ```json
  {"v":1,"origin":"<instance-id>","kind":"stomp|sse","dest":"/topic/...|null","userId":123|null,"payload":<json>}
  ```

**`RealtimePublisher`** is the **only** class allowed to call `SimpMessagingTemplate` or `ProgressEventService`'s
emit methods. It exposes `void toTopic(String dest, Object payload)` and `void toUserSse(long userId, ProgressEvent e)`.

- **Redis disabled:** deliver locally (today's behaviour).
- **Redis enabled:** serialize with the app's `ObjectMapper` and publish. Every instance's listener, the origin
  included, delivers locally:
  - `stomp` → `convertAndSend(dest, jsonNode)`
  - `sse` → `ProgressEventService.deliverLocal(userId, objectMapper.treeToValue(payload, ProgressEvent.class))`
- **Publish failure:** log at WARN and deliver locally (degraded, never silent loss on the origin).
- Client-visible JSON must be identical between local and bridged delivery (tested in U3.3).

### 4.6 Lock names (ShedLock)

| Name | Job | lockAtMost | lockAtLeast |
|---|---|---|---|
| `battle-timer` | `checkExpiredBattles` + `cancelExpiredLobbies`, every 5 s | 30 s | 2 s |
| `queue-cleanup` | `cleanupStaleQueue`, every 30 s. **Delete `QueueTimeoutJob`** and keep one job (B15) | 60 s | 5 s |
| `streak-reset` | `StreakResetJob`, midnight | 30 min | 5 min |
| `friend-challenge-expiry` | `FriendChallengeService:300`, every 30 s | 60 s | 5 s |
| `judge-requeue` | `JudgeJobRequeuer`, every 30 s | 60 s | 5 s |

Matchmaking has **no** lock (D2). `checkExpiredBattles` processes each battle in its own transaction (`REQUIRES_NEW`,
in a separate bean method) so one bad battle cannot roll back the batch (B15).

### 4.7 Matchmaking algorithm

Each instance runs it every 5 s. For each `(mode, difficulty)` pair present in the queue, use one transaction:

1. `SELECT * FROM matchmaking_queue WHERE mode=:m AND difficulty=:d ORDER BY battle_rating, joined_at LIMIT :batch FOR UPDATE SKIP LOCKED`
   (a native query in `MatchmakingQueueRepository`; `:batch` = `vantage.matchmaking.batch-size`).
2. Walk the rating-sorted list. For each unmatched entry `a`, try the next unmatched entries `b` while
   `b.rating - a.rating` is within the widest possible band (300 for CASUAL; for ranked, the band computed from the
   longer wait among the claimed rows). Pair with the first `b` for which today's `isRatingCompatible(a,b) && isDurationCompatible(a,b)`
   is true. **The compatibility rules are unchanged**; only candidate ordering changes, from O(n²) to rating-adjacent.
3. Create the battle (problem count = the min of the two, as today), and **delete both queue rows in the same
   transaction**.
4. Broadcast `/topic/queue/{uid}/matched` after commit, as today.

`joinQueue`/`leaveQueue` keep their semantics. `leaveQueue` deletes by userId inside a transaction, so it blocks on, or
is skipped by, a concurrent claim. Both outcomes are correct.

### 4.8 Experiment hashing

`bucket = (first 8 bytes of SHA-256(UTF-8 "first-finisher-ends:" + battleId), as unsigned long) mod 10000`.
The variant is `treatment` if `bucket < allocation-bps`, else `control`. Assign at battle creation (1v1 only), insert
into `battle_experiments`, and read it wherever the first-finisher rule is evaluated.

- **control** = the global `battle.continueAfterFirstFinisher.enabled` behaviour.
- **treatment** = the battle completes when the first player solves every problem.

When experiments are disabled, every battle is `control` and no row is written. The unit tests freeze 5 known
`(battleId → bucket)` vectors, computed once and pasted into the test.

---

## 5. Phases and units

Run phases in order. Units inside a wave run in parallel; each owns the files listed and must not edit anything else.
**Before each wave, you (the orchestrator) make the shared-file edits** listed under "Pre-wave" so that parallel units
never touch the same file.

### P0: Setup (serial, orchestrator)

- **U0.1 Baseline.** With a JDK ≥ 17, run `cd springapp && sh ./mvnw -q -DskipTests package`. Run the frontend build and
  tests, and `cd judge && npm ci && npm test`. Record the results in `PROGRESS.md` under "Baseline". Do **not** run
  `mvn test` yet (contextLoads hits the production DB defaults).
- **U0.2 Test safety.**
  - Create `springapp/src/test/resources/application-test.properties`: placeholder datasource, `jwt.secret` = a
    64-char test value, judge/catalog URLs = `http://localhost:1`, `ddl-auto=create-drop`.
  - Move `SpringappApplicationTests` into the `it` package and give it `@ActiveProfiles("test")` with a Testcontainers
    MySQL.
  - Add a `it` Maven profile running `**/it/**` with failsafe; default `mvn test` excludes `it`.
  - Acceptance: `mvn test` passes with no network access to production; `mvn -Pit verify` runs `contextLoads` against
    Testcontainers.
- **U0.3 Dependencies (frozen list).** Add to `springapp/pom.xml` in one commit:
  - `spring-boot-starter-data-redis`
  - `net.javacrumbs.shedlock:shedlock-core` and `shedlock-provider-jdbc-template` (exact version pinned)
  - AWS SDK v2 BOM (pinned) + `software.amazon.awssdk:sqs` + `url-connection-client`, excluding `apache-client` and
    `netty-nio-client` from `sqs`
  - test: `spring-boot-testcontainers`, Testcontainers MySQL and its JUnit integration (Boot-managed names and
    versions)

  Create `vantage-scale.properties` (§4.1), `config/ScaleConfig.java` (`@Configuration @PropertySource`) and
  `application.properties.example`. Acceptance: the package build and `mvn test` both pass.

### P1: Seams (serial, one implementer, pure moves)

- **U1.1 Extract services from `BattleService`. No behaviour change.**
  - `realtime/RealtimePublisher.java`: local-only implementation of §4.5's two methods. Replace `broadcastSafe`, the
    `convertAndSend` calls in `FriendService` and `FriendChallengeService`, and the four `progressEventService.publish`
    callers. `ProgressEventService` gains `deliverLocal(userId, event)`, and `publish` is removed.
  - `gamification/battle/MatchmakingService.java`: `joinQueue`, `leaveQueue`, `getQueueStatus`, `processMatchmaking`,
    `isRatingCompatible`, `isDurationCompatible`, `cleanupStaleQueue`, `createBattle`.
  - `gamification/battle/BattleJudgingService.java`: `submitCode`, `callJudge`, `JudgeResult`, FFA points.
  - `gamification/battle/BattleLifecycleService.java`: `completeBattle`, `completeGroupBattle`, `forfeit`,
    `abandonBattle`, `checkExpiredBattles`, `cancelExpiredLobbies`, `applyElo`, `determineWinner`, rewards.
  - Update the controllers, jobs and existing tests to the new beans. Keep `BattleService` for the lobby, state, result
    and history reads.

  Acceptance: `mvn test` is green; the two existing battle tests pass unchanged in assertions; a grep proves no
  `convertAndSend` exists outside `RealtimePublisher`; `DESIGN-NOTES.md` gets "Why seams first".

### P2: Correctness (serial)

- **U2.1 Race-free terminal transitions + 1v1 always resolves (B1, B3, F-CO).**

  Owns `BattleLifecycleService`, `BattleRepository`, `Battle.java` (optional `endedReason`), `BattleResultDTO`, and
  `BattleService` result read.

  1. Add `BattleRepository.transition(id, Set<BattleState> from, BattleState to, LocalDateTime now, Long winnerId, String reason)`
     as a `@Modifying` JPQL UPDATE returning `int`.
  2. Every terminal path (complete, group complete, forfeit, abandon, timer expiry, lobby cancel) calls it first and
     applies ELO, rewards and broadcasts **only if it returns 1**.
  3. 1v1: complete when **both** players have solved all problems. At timer expiry, an ACTIVE 1v1 **completes** via
     `determineWinner`. A null winner is a draw, with ELO applied at score 0.5 each.
  4. `getBattleResult` on CANCELLED returns 200 with `state="CANCELLED"` (§4.3).

  Acceptance:
  - An IT (`it/BattleTransitionRaceIT`) fires `completeBattle`, `forfeit` and timer expiry concurrently from 8 threads
    on one battle, 50 iterations, and asserts that `ratingAfter` is set exactly once per participant and that
    `PlayerStats.battleRating` changes exactly once.
  - The same test fails if `transition()` is replaced by the old check-then-act (prove it once and record the result).
  - Unit tests cover draw ELO and the both-finished completion.

### P3: Wave A (parallel). Pre-wave: none; P0 and P1 created every shared file

| Unit | Owns (only these) | Blocked by |
|---|---|---|
| U3.1 F-MM | `MatchmakingService`, `MatchmakingQueueRepository`, `MatchmakingJob`, `it/MatchmakingSkipLockedIT` | P1 |
| U3.2 F-LK | `config/SchedulingLockConfig.java`, `config/ShedLockRow.java` (entity), `BattleTimerJob`, delete `QueueTimeoutJob`, `streak/StreakResetJob`, the scheduled method in `FriendChallengeService`, `it/SchedulingLockIT` | P1 |
| U3.3 F-RT | `realtime/**` (Redis config, listener, publisher), `common/StompAuthChannelInterceptor` (S5 SEND rule only), `it/RealtimeBridgeIT` | P1 |
| U3.4 F-JQ | `judge/queue/**` (entity, repo, producer, consumer, requeuer, DTO), `BattleJudgingService`, `BattleController` (submit + new GET only), `judge/JudgeProxyService` (error classification only), `it/JudgeQueueIT` | P1, P2 |
| U3.5 F-FE | `reactapp/src/stores/*.js`, new `reactapp/src/services/stompClient.js`, `reactapp/src/services/battleApi.js`, `groupBattleApi.js` | P1 (contract §4.3 only) |
| U3.6 F-HK | `judge/src/app.js`, `judge/template.yaml`, `judge/test/**`, `README.md` | none |

**U3.1 F-MM: matchmaking (§4.7).**
Acceptance: `MatchmakingSkipLockedIT` starts 3 matchmaker threads (simulating 3 instances) over 400 queued users with
random ratings, plus concurrent random leaves.
- No user appears in two battles.
- Every battle pairs compatible users.
- No queue row survives for a matched user.
- No deadlock exceptions.
- Unit tests cover the band edges (CASUAL 300; ranked 200, then +50 at 30 s and 60 s).
- `DESIGN-NOTES.md` explains "why SKIP LOCKED and not a distributed lock".

**U3.2 F-LK: ShedLock (§4.6, D7, D15).**
Acceptance: `SchedulingLockIT` runs two lock executors against one MySQL. A job body that sleeps runs once per window,
not twice. `checkExpiredBattles` isolates per-battle failures (a battle that throws does not stop the others).

**U3.3 F-RT: Redis bridge (§4.5) + S5.**
1. When `vantage.realtime.redis.enabled=true`, create the listener container and publisher. When false, create no
   Redis beans beyond Boot's lazy connection factory.
2. `StompAuthChannelInterceptor` rejects every client `SEND` whose destination does not start with `/app/`. If a grep
   shows no `@MessageMapping` handlers exist, reject all client `SEND`s.

Acceptance: `RealtimeBridgeIT` boots **two** application contexts (different `vantage.instance-id`) against one Redis
and one MySQL.
- A `toTopic` call on context A reaches a STOMP subscriber connected to context B.
- A `toUserSse` call on A reaches an SSE subscriber on B.
- The JSON received is byte-identical to local delivery.
- A STOMP client `SEND` to `/topic/x` is rejected.

**U3.4 F-JQ: judge queue (§4.2–4.4, D4, D5, D12).**
Also move the judge call out of the DB transaction **in the queue-disabled path** (B2): pre-check transaction → judge
→ finalize transaction.

Acceptance: `JudgeQueueIT` (Testcontainers MySQL + ElasticMQ + an in-test stub judge):
- (a) the same `Idempotency-Key` sent 5 times concurrently produces 1 job and 1 submission;
- (b) a consumer killed after the claim (simulated) leads to redelivery and exactly one finalize;
- (c) a stub returning 503 three times produces FAILED, no `battle_submissions` row, and no RUNTIME_ERROR;
- (d) two consumers on one message produce exactly one finalize;
- (e) a battle ending mid-queue produces FAILED('battle ended…');
- (f) the queue-disabled path still returns 200 `SubmitResultDTO`.

**U3.5 F-FE: frontend.**
1. Create `services/stompClient.js`: one shared `@stomp/stompjs` `Client` per tab, a `subscribe(dest, handler)` that is
   idempotent per destination and re-applied in `onConnect`, exponential backoff reconnect (1 s → 30 s cap, stop after
   10 failures until `activate()` is called again), and a `deactivate()` on logout.
2. The three stores use it (fixes F1, F2, F3, F5). Logout resets every store (F4): each store subscribes to the user
   store and resets itself, and calls `stompClient.deactivate()`, when the user becomes null. Do not edit `App.jsx`.
3. `battleApi.submitCode` and `groupBattleApi` submit generate one `crypto.randomUUID()` per call and send it as
   `Idempotency-Key`; network errors are retried up to 3 times **with the same key**.
   - 200 → return the body.
   - 202 → poll `GET /submissions/{jobId}` every 1 s for up to 130 s, then resolve with `result` when DONE, or reject
     with `error` when FAILED or on timeout.
   - **The resolved value has the same shape the pages receive today.**

Acceptance: the frontend build and tests pass. New tests in `services/` cover the 200 path, the 202→DONE path, retry
with the same key, and subscription dedupe. A grep shows no edits outside `stores/` and `services/`.

**U3.6 F-HK: judge housekeeping.**
1. Add a JSON 404 catch-all before the error handler in `createApp()`.
2. In `template.yaml`, add a `ReservedConcurrency` parameter (default `0` = omitted, via a `Condition`), with a comment
   explaining the account-limit trap.
3. In `README.md`, replace every PostgreSQL/Redis claim with the real stack (MySQL; Redis only for the optional
   realtime bridge).

Acceptance: `judge npm test` passes with a new test asserting 404 JSON for an unknown route; `sam validate` passes if
SAM is installed (otherwise record "not run").

### P4: Wave B (parallel). Pre-wave: none

| Unit | Owns | Blocked by |
|---|---|---|
| U4.1 F-AB | `experiments/**`, the experiment hook in `MatchmakingService.createBattle` (one call) and in `BattleLifecycleService` (first-finisher check), `it/ExperimentIT` | U3.1, U2.1 |
| U4.2 F-LT | `deploy/scale-test/**`, `loadtest/**` | U3.3, U3.4 |

**U4.1 F-AB (§4.8, §4.3 report).**
Acceptance:
- Hash vector unit tests.
- About 50/50 split over 10,000 synthetic battle ids (±2%).
- Disabled means all control and no rows written.
- The report endpoint returns 403 without a token and correct counts in the IT.
- `DESIGN-NOTES.md` covers "why battle-level units, and what metric decides the experiment".

**U4.2 F-LT: 2-instance environment and load scripts.**

Files:
- `deploy/scale-test/docker-compose.yml`: `mysql:8.0`, `redis:7-alpine`, `softwaremill/elasticmq-native` (pinned tag,
  plus an `elasticmq.conf` creating `vantage-judge` and `vantage-judge-dlq`), the catalog built from
  `judge/Dockerfile.catalog`, `stub-judge`, **two** springapp instances built from `springapp/Dockerfile` (JVM, for build
  speed), with `VANTAGE_INSTANCE_ID=a|b`, Redis and queue enabled, and nginx.
- `deploy/scale-test/nginx.conf`: upstream of both instances, WebSocket upgrade headers, SockJS stickiness via
  `map $uri $sockjs_session { ~^/ws/[^/]+/([^/]+)/ $1; default $request_id; }` + `hash $sockjs_session consistent;`.
- `loadtest/stub-judge/`: Node, no dependencies. `POST /api/submit` sleeps `STUB_DELAY_MS` (default 1500) and returns
  `{"status":"Accepted","time":12,"results":[]}`. `STUB_FAIL_RATE` (0–1) returns 503.
- `loadtest/seed-users.mjs`: creates N users through `/api/auth/signup` with the correct `Origin`.
- `loadtest/k6/battle.js`: scenario A from `docs/scale/K6-SCENARIOS.md`. Steps 25→50→100→200→400, 5 min each,
  SockJS raw websocket transport, SLO thresholds: HTTP p95 < 500 ms, errors < 1%, WS connect ≥ 99%.
- `loadtest/k6/judge.js`: scenario B (submissions at concurrency 1, 5, 10).
- `loadtest/verify.sql`:
  1. no user in two simultaneously ACTIVE battles;
  2. per user, chained ELO consistency (each battle's `ratingBefore` equals the previous completed battle's
     `ratingAfter`);
  3. no duplicate `(user_id, idempotency_key)`;
  4. `DONE` jobs with a submission row = 1:1.

  Each check prints `PASS`/`FAIL`.
- `loadtest/README.md`: exact commands.

Acceptance (owner direction 2026-10-04: the run machine compiles and tests locally only; the owner runs the stack and
k6 on their own laptop): `docker compose -f deploy/scale-test/docker-compose.yml config` is valid, `docker compose ...
build` succeeds for every service, `node --check` passes on every `.mjs`/`.js` under `loadtest/`, and the stub judge
answers one local request when started with `node`. **Do not run `docker compose up` for the full stack, and never run
k6.** Write the smoke command (10 users, 2 minutes, then `verify.sql`) into `loadtest/README.md` and list it in
`OWNER-ACTIONS.md`.

### P5: Native image (serial, needs owner)

- **U5.1 Native readiness.**
  - Regenerate the records list with the script in `CLAUDE.md`'s lessons file, and diff it against `reflect-config.json`.
  - Add the new records.
  - Add runtime hints if the AOT build reports missing ones for Lettuce, ShedLock or the AWS SDK.
  - Grep for `getReferenceById`, and for new `@ManyToOne` without EAGER.

  Acceptance: JVM build green; `-Pnative` compile attempted **only if** the owner has written the build-box IP into
  `PROGRESS.md` under "Owner inputs". Otherwise mark it "blocked on owner" and continue.
- **U5.2 Size record.** If a native build ran, record the image size. The resume currently says "459 → 283 MB"; record
  the new number. The AWS SDK and Lettuce will grow it. **Do not claim the old number in any doc.**

### P6: Security (serial). Appendix A S1–S4, S8

- **U6.1** S1, S2, S3 (with B16):
  - Delete the `?userId=` fallback in `CurrentUser.resolve`.
  - Protect `/api/auth/me`, `/api/auth/extension/token`, `/api/users/**` (except signup) and problem/institution
    writes (admin = `X-Admin-Token`, §4.1).
  - `BattleController` resolves the user from the principal; any `userId` param or body field must equal it, or 403.
  - The frontend keeps sending `userId` (no page edits); the server ignores it once validated.

  Acceptance: an auth-matrix IT walks every listed route as anonymous, user A acting for B, and admin, and asserts
  401/403/200 as designed.
- **U6.2** S4 (code part only: remove secret fallbacks from code and `@Value` defaults; fail fast at startup if
  `jwt.secret` is blank or shorter than 32 bytes) and S8 (remove the plaintext-password fallback). Rotation of the real
  secrets is an owner action.

### P7: Close-out (serial, orchestrator)

1. Update `CLAUDE.md`: the judge section (main tree is the Lambda judge), the new services, flags and scale-test env.
2. Write `docs/scale/CLAIMS.md` (§11).
3. Write `docs/scale/OWNER-ACTIONS.md` (§9).
4. Do a final full gate run and push `polish`.

---

## 6. Gates (every unit; run them yourself, do not trust a subagent's word)

```bash
# Linux (the run machine). On the owner's Windows box use mvnw.cmd and JAVA_HOME=C:\Program Files\Java\jdk-23.
(cd springapp && sh ./mvnw -q test)              # unit tests, no network to prod
(cd springapp && sh ./mvnw -q -Pit verify)       # integration tests (needs Docker running)
(cd reactapp && CI=false REACT_APP_API_URL=http://localhost:1 npm run build && npm test -- --watchAll=false)
(cd judge && npm test)
```

- A unit passes only when every gate that exists passes **and** its acceptance list is met.
- If Docker is not running, the `-Pit` gate cannot run: record "IT gate blocked: Docker not running" under owner
  decisions and continue with units that have no IT requirement. Do not mark IT-dependent units done.
- Parallel subagents in a wave run only their own module's tests: no `git`, no shared builds. You run the full gates
  once per wave.

## 7. Per-unit loop

1. **Implement:** a fresh Sonnet 5.5 subagent whose brief contains §0, the unit's row and section verbatim, the
   relevant §4 contracts verbatim, absolute paths, and the gates.
2. **Gate:** run §6.
3. **Review:** a separate Sonnet 5.5 reviewer subagent with the brief plus the diff. It checks the contracts and the
   acceptance criteria, and returns `APPROVED` or `REJECTED: <fixes>`.
4. **On rejection:** give the fixes to a fresh implementer. After 2 rejections, mark the unit `escalated` in
   `PROGRESS.md`, revert only its uncommitted changes, and continue with independent units.
5. **Commit** on approval, then append to `PROGRESS.md`. Subagent reports are at most 12 lines.

State lives in files. After any context compaction, re-read this file and `PROGRESS.md` before dispatching.

## 8. Git

- Only the orchestrator commits. Stage explicit paths, never `git add -A`. One commit per approved unit, using
  Conventional Commits, e.g. `feat(matchmaking): claim queue rows with FOR UPDATE SKIP LOCKED`,
  `fix(battle): make terminal transitions conditional updates`.
- Push `polish` after every committed wave and at stop. Never push any other ref.

## 9. Owner-only actions (write these into `docs/scale/OWNER-ACTIONS.md` at close-out; never do them)

1. Start Docker Desktop before the run (needed for the `-Pit` gate and the scale-test env).
2. Provide the ARM build-box IP for the native build (P5).
3. In AWS:
   - create the SQS queue + DLQ (visibility 180 s, maxReceiveCount 3);
   - grant the EC2 instance role `sqs:SendMessage`, `ReceiveMessage`, `DeleteMessage`, `GetQueueAttributes` on both
     queues;
   - set `VANTAGE_JUDGE_QUEUE_URL`.
4. Run Redis on the box (`redis:7-alpine`, about 10 MB) before enabling `vantage.realtime.redis.enabled`.
5. Request a Lambda concurrency quota increase, then set the `ReservedConcurrency` parameter (U3.6).
6. Make `roguekishore/vantage-catalog` and `roguekishore/judge` private on Docker Hub (they contain hidden tests and
   solutions).
7. Rotate the DB password and the JWT secret (S4), then update the box's env.
8. Run SMOKETEST Test 3 (now 2-instance) in a spare account to produce the resume numbers.
9. Merge `polish`. The scale commits are separate per-unit commits that touch no page or component files, so if the
   UI work is not ready they can be cherry-picked onto `main` on their own.
10. Bring up `deploy/scale-test`, run the k6 smoke (10 users, 2 minutes) and `verify.sql` on the owner's laptop
    (U4.2 only built the images).

## 10. Stop conditions

Stop and push when any of these happens:

- every unit is done or escalated;
- the same gate fails 3 times in a row for reasons outside the current unit;
- a unit would require breaking a §0 rule.

Record the reason in `PROGRESS.md`.

## 11. Claims mapping (write `docs/scale/CLAIMS.md` with the evidence filled in)

| Resume claim | Evidence required |
|---|---|
| "eliminated double-matching with MySQL `SKIP LOCKED` and ELO-banded queues" | `MatchmakingSkipLockedIT` result + `DESIGN-NOTES.md` |
| "SQS queue with idempotent submission keys … retries never double-award XP or ELO" | `JudgeQueueIT` (a)–(e) + `BattleTransitionRaceIT` |
| "Redis-backed realtime fan-out across instances" | `RealtimeBridgeIT` (+ scale-test smoke `verify.sql` PASS, owner's run) |
| "ShedLock-guarded scheduled jobs" | `SchedulingLockIT` |
| "deterministic A/B bucketing" | `ExperimentIT` + hash vectors |
| "k6 at [N] concurrent users across 2 instances (p95 [X] ms)" | Owner's AWS run only; leave `[N]`/`[X]` unfilled |
| "GraalVM native image (… MB)" | U5.2 measured size, or "not rebuilt" |

---

## Appendix A: Audit items in scope (from `docs/polish/DEFERRED_NON_UI.md`, the 2026-09-30 audit; full evidence there)

| ID | Where | Issue | Fix (as frozen above) |
|---|---|---|---|
| S1 | `common/CurrentUser.java:35-43`, `user/AuthController.java:90-134`, `common/JwtAuthFilter.java:136` | `/api/auth/**` is public, and `CurrentUser.resolve` falls back to `?userId=`. `POST /api/auth/extension/token?userId=N` mints a token for any user. `GET /api/auth/me?userId=N` returns any profile | U6.1 |
| S2 | `user/UserController.java:50-70`, `JwtAuthFilter.java:140` | Unauthenticated `PUT`/`DELETE /api/users/{id}`; `GET /api/users` lists emails | U6.1 |
| S3 | `problem/ProblemController.java:58-100`, `InstitutionController.java:48` | Public problem create/update/delete and institution create | U6.1 |
| S4 | `application.properties`, `JwtUtil.java:27` | Secret fallback defaults baked into images | U6.2 (code) + owner rotation |
| S5 | `StompAuthChannelInterceptor.java:38-73` | Client SEND not authorized; can spoof `/topic/**` | U3.3 |
| S8 | `UserService.java:~140` | The stored bcrypt string works as a password | U6.2 |
| B1 | `BattleService.java:614-622, 1119-1150` | With `continueAfterFirstFinisher=true`, a 1v1 never completes. Timeout → CANCELLED, no ELO, result 409 | U2.1 |
| B2 | `BattleService.java:527-729`, `WebConfig.java:~72` | 125 s judge call inside `@Transactional`; judge outage recorded as RUNTIME_ERROR | U3.4 |
| B3 | `BattleService.java:734-780, 961-1047, 1110-1150` | Completion/forfeit/timer race double-applies ELO and rewards | U2.1 |
| B15 | Matchmaking/BattleTimer/QueueTimeout jobs | Duplicate cleanup; one transaction for all battles | U3.2 |
| B16 | `BattleController.java:144-148` | Kick trusts the injected `kickerId` | U6.1 |
| F1 | `BattleLobbyPage.jsx:639-642`, `useBattleStore.js:118,229` | Every 3 s poll adds a STOMP subscription | U3.5 (store-side dedupe; page untouched) |
| F2 | `useBattleStore.js:60-104`, `useGroupBattleStore.js:49-77` | Infinite reconnect, can't deactivate | U3.5 |
| F3 | same stores | Subscriptions not made in `onConnect`; lost on reconnect | U3.5 |
| F4 | `App.jsx:115,122` | Logout resets only the friends store | U3.5 (store resets; `App.jsx` untouched) |
| F5 | three `new Client` | 3 STOMP connections per tab | U3.5 |
