# Load tests (local scale-test environment)

Everything here targets the local stack in `deploy/scale-test/` (nginx -> two springapp instances, MySQL, Redis,
ElasticMQ, catalog, stub judge). Never point it at production or AWS. Run these on your own machine; the build
machine only checks that the images build and the scripts parse.

Requirements: Docker with Compose v2, Node 18+, k6, a `mysql` client.

## 1. Bring-up

```bash
cd ~/Vantage
docker compose -f deploy/scale-test/docker-compose.yml build
docker compose -f deploy/scale-test/docker-compose.yml up -d
# wait until both instances answer (about 60-90 s):
until curl -sf http://localhost:8080/actuator/health >/dev/null; do sleep 3; done
docker compose -f deploy/scale-test/docker-compose.yml ps
# the two instances must both be up:
docker compose -f deploy/scale-test/docker-compose.yml logs springapp-a springapp-b | grep -i "Started SpringappApplication"
```

Entry point is `http://localhost:8080`. MySQL is on `127.0.0.1:3307` (root / `local-only-change-me`, database
`vantage`). Tear down with `docker compose -f deploy/scale-test/docker-compose.yml down -v`.

Stub judge knobs (edit `environment` of `stub-judge` in the compose file, then `up -d stub-judge`):
`STUB_DELAY_MS` (default 1500), `STUB_FAIL_RATE` (0 to 1, returns 503).

## 2. Seed users

```bash
node loadtest/seed-users.mjs --count 44 --base http://localhost:8080 --origin http://localhost:3000   # smoke (10 + 10%, rounded up)
node loadtest/seed-users.mjs --count 440                                                               # full run (400 + 10%)
```

Users are `lt00001..`, password `LoadTest!234`. Re-running is safe (existing users count as "already-existed").

## 3. Smoke: 10 users, 2 minutes, then verify

```bash
SMOKE=1 k6 run --summary-export=loadtest/smoke-summary.json loadtest/k6/battle.js
mysql -h127.0.0.1 -P3307 -uroot -plocal-only-change-me vantage < loadtest/verify.sql
```

All four verify rows must say `PASS`. In the k6 output check `ws_connect_ok` >= 99%, `http_req_failed` < 1%,
`http_req_duration p(95)` < 500 ms and `users_left_unmatched` = 0.

## 4. Scenario A: real-time battles (steps 25, 50, 100, 200, 400; 5 minutes each)

```bash
k6 run --summary-export=loadtest/battle-summary.json loadtest/k6/battle.js
mysql -h127.0.0.1 -P3307 -uroot -plocal-only-change-me vantage < loadtest/verify.sql
```

`STEP_MINUTES=1` shortens each hold. Stop at the first step that breaks an SLO (k6 thresholds mark this).
`time_to_match` includes the up-to-5 s matchmaking tick by design; report it separately from latency.
Check no restarts: `docker compose -f deploy/scale-test/docker-compose.yml ps` and `docker stats --no-stream`.

## 5. Scenario B: judge throughput (concurrency 1, 5, 10)

```bash
STAGE_SECONDS=180 k6 run --summary-export=loadtest/judge-summary.json loadtest/k6/judge.js
mysql -h127.0.0.1 -P3307 -uroot -plocal-only-change-me vantage < loadtest/verify.sql
```

Uses users 1..20 (two per VU). Read `judge_submit_latency` (p95) and `judge_submissions_done` per concurrency tag;
submissions per minute = done / (STAGE_SECONDS / 60).

## verify.sql checks

1. no user in two ACTIVE battles; 2. per-user ELO chain (`rating_before` = previous `rating_after`);
3. no duplicate `(user_id, idempotency_key)`; 4. DONE `judge_jobs` match `battle_submissions` 1:1 per
(battle, user, problem).

## Files

- `stub-judge/server.js`: dependency-free judge stand-in (`node loadtest/stub-judge/server.js`, port 9000).
- `seed-users.mjs`, `k6/common.js`, `k6/battle.js`, `k6/judge.js`, `verify.sql`.
