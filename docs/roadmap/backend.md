# Backend, judge, extension and repo backlog

Status as of 2026-10-06, checked against the code. **Fixed** items name the test or file that proves them. **Open** items
were confirmed in the code. **Unchecked** items come from the original audit and have not been re-verified since.

Paths are relative to `springapp/src/main/java/com/backend/springapp/` unless they start with another top-level folder.

## Security

| ID | Item | Status | Notes |
|---|---|---|---|
| S1 | `?userId=` fallback let any caller act as any user (mint extension tokens, read profiles) | Fixed | `CurrentUser` never treats `?userId=` as identity; `AuthMatrixIT` |
| S2 | Public `/api/users/` allowed unauthenticated `PUT`/`DELETE` and listed every user's email | Fixed | `AuthMatrixIT` (33 routes x 4 callers) |
| S3 | Public problem and institution writes | Fixed | Writes are admin-checked in the controllers; `AuthMatrixIT` |
| S4 | Secret fallbacks | Partly fixed | `JwtUtil` refuses to start with a blank or under 32-byte `JWT_SECRET` (`JwtUtilSecretTest`). Still to do: rotate the database password and JWT secret in the deployed environment |
| S5 | STOMP `SEND` was not authorised, so clients could spoof `/topic/**` | Fixed | The interceptor rejects every client `SEND`; `RealtimeBridgeIT` |
| S6 | JWT accepted as `?token=` on every endpoint | **Open** | `JwtAuthFilter` reads it for all paths. EventSource and the `/ws` handshake need it; restrict it to those, or use short-lived tickets |
| S7 | JWT kept in `localStorage` | **Open** | `useUserStore` persists `token` inside the `user` object. Keep only the profile in storage and rely on the HttpOnly cookie |
| S8 | A stored bcrypt hash worked as a password | Fixed | `UserServiceLoginTest.storedHashIsNotAPassword` |
| S9 | No rate limiting on login, signup, judge run or trace | **Open** | Only the per-user judge submit limit exists. Add a limiter filter |
| S10 | An invalid cookie returns 401 even on public paths | Unchecked | |

## Backend correctness

| ID | Item | Status | Notes |
|---|---|---|---|
| B1 | 1v1 battles never completed when both finished; timeout cancelled with no winner | Fixed | `BattleTransitionRaceIT`; timer resolves through `determineWinner` |
| B2 | Judge call (125 s timeout) inside a database transaction | Fixed | `BattleJudgingService` steps own short transactions; with the queue on, judging is off the request thread |
| B3 | Completion, forfeit and timer paths raced and could double-apply ELO | Fixed | Conditional `UPDATE` in `BattleRepository.transition()` |
| B4 | Coin read-modify-write allows a double spend | Unchecked | `CoinService` has `@Transactional` but no conditional update was found. Use an atomic `UPDATE ... WHERE balance >= ?` |
| B5 | Solves are self-reported and can be rewarded twice | Unchecked | Award only on a verified accept |
| B6 | Streak shield never works and the nightly batch rolls back | Unchecked | Bump `lastActivityDate` and use `REQUIRES_NEW` per user |
| B7 | The catch-all handler turns every unhandled exception into 500, including unknown `/api/...` paths | **Open** | Handle `NoResourceFoundException` as 404 and use `ResponseEntityExceptionHandler` with `ProblemDetail` |
| B8 | Judge proxy: 5xx maps to 500, no validation, unencoded path variable | Unchecked | Map to 404, 502 and 504 and validate |
| B9 | `LocalDate.now()` in streak and gamification services | Unchecked | The JVM is now pinned to UTC, so the streak day rolls over at 05:30 IST. Decide the intended zone and inject a `Clock` |
| B10 | N+1 queries on every queue poll | Unchecked | Associations must stay `EAGER` for native image, so fix with targeted queries |
| B11 | `ddl-auto=update`, `show-sql`, no migrations | **Open** | Move to Flyway with `validate` |
| B12 | Deleting a user leaves orphaned rows | **Open** | `UserService.deleteUser` removes progress only |
| B13 | ELO is not zero-sum, and losses are logged as `BATTLE_WIN` | Unchecked | One reward policy |
| B14 | Level off-by-one | Unchecked | |
| B15 | Duplicate cleanup jobs, one transaction for all battles | Fixed | `QueueTimeoutJob` removed; each battle is its own `REQUIRES_NEW` transaction |
| B16 | Kick trusted a client-supplied `kickerId` | Likely fixed | The auth filter now keeps the raw parameter apart from the identity; confirm in `AuthMatrixIT` |

## Realtime (frontend)

| ID | Item | Status |
|---|---|---|
| F1 to F5 | Lobby poll stacked subscriptions, clients reconnected forever, subscriptions lost on reconnect, logout reset one store, three STOMP connections per tab | Fixed by the shared `stompClient` (`services/stompClient.js`) |
| F6 | StrictMode resets, leaked room subscriptions, an uncancelled timeout | Unchecked |
| F7 | Judge page error and login states | Unchecked |
| F8 | The base URL is built in six places (`AuthPage`, `api.js`, `battleApi.js`, `groupBattleApi.js`, `realtimeUrls.js`, `useUserStore.js`), with mixed-content risk | **Open** |
| F9 | Any 401 forces a logout (`api.js`) | **Open** |
| F10, F11 | Timer shows 00:00 before the first state; stale `REACT_APP_JUDGE_URL` and dead helpers | Unchecked |

## Judge

| ID | Item | Status | Notes |
|---|---|---|---|
| J1 | Empty `testCases` returns Accepted | **Open** | `routes/submission.js` only checks `Array.isArray`. Reject an empty array |
| J2 | `Stage 18/s18-p03-avl-tree-visualizer` has no tests | Unchecked | |
| J3 | Host-mode user code may read the parent's environment through `/proc`, has network access, no C++ memory or pid limits, and grandchild processes outlive the timeout | Unchecked | `executor.js` runs children with `CHILD_ENV`; confirm what it contains and add limits |
| J4 | The catalog service needs `JUDGE_TOKEN` (missing means 403) | Verify on the server | |
| J5 | The executor gate fails open when `JUDGE_TOKEN` is unset | **Open** | `app.js` only installs the check `if (TOKEN)`. Fail closed |
| J6 | Output comparison uses whole-string `trim()`, so CRLF differences give a false Wrong Answer; a non-string `expected` returns 500 | **Open** | |
| J7 | `Stage 24/Stage 24/design-linked-list.js` duplicates the Stage 10 id | Unchecked | |
| J8 to J10 | Dead Docker worker pool, double-nested stage folders, stale comment | Unchecked | |

## Data and content

| ID | Item | Status | Notes |
|---|---|---|---|
| D0 | **26 of the 113 seeded problems have no catalog test cases**, so they always return `RUNTIME_ERROR` (for example `binary-search`, `fibonacci-number`, `valid-palindrome`, `move-zeroes`, `course-schedule`, `first-unique-character-in-a-string`, `top-k-frequent-elements`, `sort-an-array`, `powx-n`) | **Open, highest impact** | Add the missing cases, and check whether production has the same gap. If it does, about one battle in five is unwinnable |
| D1 | 11 visualizers call an undefined `navigate` prop on Back | Goes away with migration | |
| D2 | Catalog gaps in the topics search (`search/catalog.js`) | **Open** | See `ui.md` |
| D3 | `bonusC` judge ids were swapped | Appears fixed | The two rows in `data/dsa-conquest-map.js` now match their titles |
| D4 to D6 | Dead map routes, duplicates and typos, stale `problems-catalog.json` | Unchecked | |

## Extension

| ID | Item | Status |
|---|---|---|
| E1 | The page can forge the `lc-vantage-*` events, and `authCheck` fails open | Unchecked |
| E2 | The `postMessage` handler does not check the origin (`content-script.js`) | Unchecked |
| E3 | `host_permissions` still lists `localhost` and an unused judge host (`extension/manifest.json`) | **Open** |
| E4 | `config.js` points at `api.vantagecode.tech`; confirm it is the host nginx actually serves | Verify |
| E5 | The token is in `storage.local`, `sender` is not validated, and the popup uses an unloaded font | Unchecked |

The popup now reads `GET /api/sync/profile` with its scoped `ext` token. That needs a new extension build and store
release, and the backend endpoint has to be deployed first.

## Repository

| ID | Item | Status |
|---|---|---|
| X1 | nginx lacks WebSocket `Upgrade` and `proxy_buffering off`; no TLS or security headers (possibly handled upstream) | Unchecked (deployment config lives outside this repo) |
| X2 | Compose files predate the catalog split; `.env.example` is missing keys; no healthchecks | Unchecked |
| X3 | About 60 MB of tracked media. `reactapp/public/videos/hero-1.mp4` is referenced; `hero-2` to `hero-4` and `public/audio/music_main.mp3` appear unreferenced (about 20 MB) | **Open** |
| X4 | No `LICENSE` file although the README shows an MIT badge, and no CI | **Open** |
| X5 | A stray `MergeSortAnimation.tsx` at the repository root duplicates the copy in `reactapp/src/components/animations/` | **Open** |

## Decisions still needed

1. Who may read another user's `/stats` and `/achievements`? Today any logged-in user can.
2. `joinQueue` still deletes stale rows by `user_id`, and `deleteStaleEntries` by a `joinedAt` range. Both are rare races
   but use the lock order that deadlocked once; consider locking by id.
3. A `leaveQueue` that loses to an in-flight claim is a logged no-op (still 204) and the user is matched. Accept or change.
4. `BattleJudgingService` should call `lifecycleService.completeIfAllFinished(battleId)` after a 1v1 accepted solve, so
   completion is immediate; today the 5-second timer job completes it.
5. Battles created outside matchmaking (friend challenges, rooms) get no experiment row and run as control.
6. What decides a 1v1 at timeout? (Today a tie is a draw at 0.5 ELO each.)
7. Keep or delete the legacy Docker judge worker pool (J8)?
8. Drop the tracked media from history as well, or only stop tracking it going forward?
9. Concurrent first-touch creation of a user's `player_stats` row can deadlock (seen while writing `ReadyUpRaceIT`; the
   race tests pre-create the rows for the same reason). Not hit by the load test.
