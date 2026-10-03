# k6 scenarios

The load scenarios behind `loadtest/k6/*.js`, `loadtest/seed-users.mjs` and `loadtest/verify.sql`. Run them against
`deploy/scale-test/` first (see `loadtest/README.md`); only use a spare cloud account after that. Never point them at
production.

## Facts from the code that shape the test

In `springapp/src/main/java/com/backend/springapp/`:

- **Auth:** `POST /api/auth/signup` and `/api/auth/login` return a JWT in a **cookie**. `CsrfOriginFilter` rejects
  state-changing requests whose `Origin` is not in `cors.allowed-origins`, so k6 must send a matching `Origin` header.
- **WebSocket:** STOMP over SockJS at `/ws` (`WebSocketConfig`), simple broker `/topic`, app prefix `/app`. k6 can use
  SockJS's raw transport (`/ws/{server}/{session}/websocket`) and speak STOMP frames. The handshake authenticates from
  the cookie or a `?token=` query parameter (`WebSocketHandshakeAuthInterceptor`).
- **Battle flow** (`gamification/battle/BattleController`, base `/api/battle`): `POST /queue` -> server pushes
  `/topic/queue/{userId}/matched` -> `POST /{id}/ready` -> state on `/topic/battle/{id}/state/{userId}` ->
  `POST /{id}/submit` -> result on `/topic/battle/{id}/result/{userId}`. The scripts copy the React client's polling
  cadence.
- **Matchmaking runs every 5 s** (`MatchmakingJob`). Time-to-match therefore includes up to 5 s by design; report it
  separately, not as latency.
- **The judge is bounded by Lambda concurrency** (the account's total limit may be 10). Submissions are measured in
  their own scenario. Locally, `loadtest/stub-judge/` stands in for the Lambda.

## Test users

`loadtest/seed-users.mjs` creates N + 10% users through `/api/auth/signup` with the correct `Origin` (watch for rate
limits). It refuses non-local hosts.

## Scenarios

- **A, real-time battles (`loadtest/k6/battle.js`).** Each virtual user logs in, opens a STOMP connection, subscribes
  to its match topic, joins the 1v1 queue, gets matched, readies up, follows the battle state at the client's cadence,
  and finishes or forfeits. It uses the shortest battle duration and makes **no code submissions**. Steps of
  25 -> 50 -> 100 -> 200 -> 400 concurrent users, 5 minutes each; stop at the first step that breaks the SLO.
  `SMOKE=1` runs 10 users for 2 minutes instead, and `STEPS=<n>` runs a single step.
- **B, judge throughput (`loadtest/k6/judge.js`).** Battle submissions at concurrency 1, 5 and 10. Records
  submissions per minute and p95 submit latency. With the queue enabled, a submission is done when its
  `GET /api/battle/{id}/submissions/{jobId}` reaches `DONE` or `FAILED`.

**SLO for a step to pass** (encoded as k6 thresholds where k6 can measure it): HTTP p95 < 500 ms, HTTP error rate < 1%,
WebSocket connect success >= 99%, no matched user left without a battle, no container OOM or restart.

## Output

- The k6 summary JSON per run (`--summary-export`).
- Custom trends for time-to-match and WebSocket connect time.
- `mysql < loadtest/verify.sql` after a run checks the four integrity invariants. `loadtest/README.md` has the exact
  commands.
