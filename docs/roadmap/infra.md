# Infrastructure and validation

Everything here needs an account, a box or a credential, so it cannot be done from the repository alone. The code is
ready for all of it; each item lists what it unlocks.

## Before turning the new features on

1. **SQS queue.** Create the queue and a dead-letter queue (visibility timeout 180 s, `maxReceiveCount` 3). Grant the
   instance role `sqs:SendMessage`, `ReceiveMessage`, `DeleteMessage` and `GetQueueAttributes` on both. Set
   `VANTAGE_JUDGE_QUEUE_URL`, then `VANTAGE_JUDGE_QUEUE_ENABLED=true`. The queue is off by default; the SQS client region
   defaults to `ap-south-1`.
2. **Redis.** Run `redis:7-alpine` (about 10 MB) on the box before setting `vantage.realtime.redis.enabled=true`.
3. **Lambda concurrency.** Request a quota increase, then set the `ReservedConcurrency` SAM parameter (default 0 leaves it
   unset). The account's total of 10 must keep 10 unreserved, so any reservation fails the deploy until the quota rises.
   `sam validate` has not been run.
4. **Secrets.** Rotate the database password and the JWT secret, then update the box environment. The app refuses to
   start with a blank or under-32-byte `JWT_SECRET`, so set it before deploying.
5. **Clock.** Do not override `TZ` or `-Duser.timezone` in the deployment; the app pins the JVM and the database session
   to UTC and refuses to start if they disagree by more than 60 seconds.
6. **Docker Hub.** Make `roguekishore/vantage-catalog` and `roguekishore/judge` private: they hold hidden tests and
   solutions. Check whether `roguekishore/vantage:graal` is public, because earlier images baked in configuration fallbacks.
7. **Extension release.** Deploy the backend's `GET /api/sync/profile` first, then publish the extension build whose popup
   reads it.

## Native image

The native image builds and runs on ARM (`RESULTS-ec2.md`). Still to do:

- Rebuild and push `roguekishore/vantage:graal` from the current code. The tag has not been rebuilt since the scale-out
  work; always verify the live digest with `docker inspect -f '{{.RepoDigests}}' roguekishore/vantage:graal`.
- Turn the queue and Redis flags on in a native build and exercise them: Lettuce (Netty), the AWS SDK v2 SQS client with
  its HTTP client service-loader entries, ShedLock's `JdbcTemplateLockProvider`, and `BattleExperiment` with its
  `@IdClass` `BattleExperimentId`. The SQS client is built lazily and needs native hints before the queue can be enabled in
  a native image.
- Record the image size again after those hints are added (the last measurement was a 227 MB binary, 106 MB compressed).

## Validation that has not been done

| Not yet measured | How |
|---|---|
| Real SQS and the Lambda judge | Run scenario B (`loadtest/k6/judge.js`) against a real queue and the deployed Lambda. The real ceiling is Lambda concurrency, which the stub-judge run never touched |
| Sustained submission throughput | The k6 script paces each user at the app's own 10 s per-user submit limit and leaves the battle after one verdict, so it cannot saturate the consumers. Use many more users; do not quote submissions per minute from the stub run as a capacity figure |
| Load generator on a separate machine | Re-run scenario A with k6 on a second small instance in the same region; the last run had k6 on the system under test |
| Production instance type | The last run used a c7g.2xlarge. Repeat on the production instance type with the production `-Xmx` and `mem_limit` |
| Route smoke after the scale-out merges | Last run was 366 of 370 routes (the 4 known MinStack and ImplementTrie failures) |

Use a spare cloud account, tear everything down afterwards, and never point the scale-test stack at production. The
commands are in `loadtest/README.md`; the scenarios and the SLO are in `docs/scale/K6-SCENARIOS.md`.
