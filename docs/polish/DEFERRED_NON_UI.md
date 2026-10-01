# Deferred: non-UI findings (turn-1 audit, 2026-09-30, `main` @ `0613347`)

This file is the full evidence behind Appendix A of `POLISH_PLAN.md`. Paths are relative to the repo root, and Java paths are relative to `springapp/src/main/java/com/backend/springapp/`. The owner deferred all of it in favour of UI work. **S1–S4 are exploitable on the live site.**

Safety notes for whoever picks this up:
- Do not run `mvn test` as-is. `SpringappApplicationTests.contextLoads` boots against the production MySQL defaults with `ddl-auto=update`. Add a test profile first.
- `springapp/src/main/resources/application.properties` is gitignored (`springapp/.gitignore:34`) and contains non-empty secret fallbacks. Never commit it.
- Use JDK 23 or 17 (`JAVA_HOME=C:\Program Files\Java\jdk-23`). The default `java` on this machine is 14.
- Production runs Docker Hub images plus a Lambda stack. Compose and nginx live in `d:\PROJECTS\APPS\.deployment`, which is not a git repo. The native-image rules in `CLAUDE.md` apply.
- The root `CLAUDE.md` "Judge architecture" section is stale. Main-tree `judge/` is the Lambda judge, and `.claude/worktrees/` is empty.

## Security

| ID | Sev | Where | Issue | Fix direction |
|---|---|---|---|---|
| S1 | Critical | `common/CurrentUser.java:35-43`, `user/AuthController.java:90-134`, `common/JwtAuthFilter.java:136` | `/api/auth/**` is public, and `CurrentUser.resolve` falls back to `?userId=`. `POST /api/auth/extension/token?userId=N` mints an extension JWT for any user, and `/api/sync` then grants solves, XP and coins. `GET /api/auth/me?userId=N` returns any profile. | Delete the fallback. Protect `/me` and `/extension/token`. |
| S2 | Critical | `user/UserController.java:50-70`, `JwtAuthFilter.java:140` | The `/api/users/` prefix is public, so unauthenticated `PUT` (email and password) and `DELETE /api/users/{id}` both work. `CsrfOriginFilter` only runs when a cookie is present. `GET /api/users` lists every user with email addresses. | Protect the routes, require `id == jwt uid`, and use a public DTO without email. |
| S3 | Critical | `problem/ProblemController.java:58-100`, `InstitutionController.java:48` | Public create, update and delete of problems (delete cascades to progress), and public create of institutions. | Protect them behind an admin claim. |
| S4 | Critical | `application.properties:5-7,12`, `JwtUtil.java:27` | Non-empty fallback defaults for the DB credentials and the JWT secret. They get baked into images. | Rotate both. Remove the defaults and fail fast. Add `application.properties.example`. |
| S5 | High | `StompAuthChannelInterceptor.java:38-73` | STOMP SEND is not authorised, so clients can spoof `/topic/**`. The room and started topics are readable by any user. | Reject client SEND and check membership. |
| S6 | Medium | `JwtAuthFilter.java:~107`, `WebSocketHandshakeAuthInterceptor.java:~36`, `reactapp/src/stores/useFriendsStore.js:428` | JWT is accepted in the `?token=` query on every endpoint. | Allow it only for SSE and `/ws`, or switch to tickets. |
| S7 | Medium | `reactapp/src/stores/useUserStore.js:70-75`, `services/api.js:14-50` | JWT is stored in localStorage. | Keep only the profile in storage. |
| S8 | Medium | `UserService.java:~140` | A plaintext password fallback lets the stored bcrypt string work as a password. | Remove it. |
| S9 | Medium | app-wide | No rate limiting on login, signup, or judge run and trace. | Add a limiter filter. |
| S10 | Medium | `JwtAuthFilter.java:~63` | An invalid cookie returns 401 even on public paths. | Ignore the token on public paths. |

## Backend correctness

| ID | Sev | Where | Issue | Fix direction |
|---|---|---|---|---|
| B1 | Critical (feature) | `gamification/battle/BattleService.java:614-622, 1119-1150` | With the default `continueAfterFirstFinisher=true`, solving everything never completes a 1v1. Timeout sets CANCELLED with no winner and no ELO change, and `getBattleResult` returns 409. | Complete the battle when both players finish, or resolve at timeout. Return a CANCELLED DTO instead of 409. |
| B2 | High | `BattleService.java:527-729`, `WebConfig.java:~72` | The judge call (125 s timeout) runs inside `@Transactional`, which starves the Hikari pool. A judge outage is recorded as RUNTIME_ERROR. | Move the call out of the transaction and don't persist infrastructure failures. |
| B3 | High | `BattleService.java:734-780, 961-1047, 1110-1150` | The completion, forfeit and timer paths race, which can double-apply ELO and rewards. | `@Version`, or a conditional UPDATE. |
| B4 | High | `CoinService.java:~39-63`, `StoreService.java:~67-116` | Coin read-modify-write lets a buyer double-spend. | Atomic conditional UPDATE. |
| B5 | High | `UserProgressService.java:~104-160`, `SyncService.java` | Solves are self-reported, and double rewards are possible. | Award only on a verified accept. |
| B6 | High | `StreakResetJob.java:~58-80`, `StreakService.java:~86-104` | The streak shield never works, and the nightly batch rolls back. | Bump lastActivityDate. Use REQUIRES_NEW per user. |
| B7 | Medium | `GlobalExceptionHandler.java:66-70` | The catch-all turns 4xx into 500 and breaks SSE timeouts. | `ResponseEntityExceptionHandler` + `ProblemDetail`. |
| B8 | Medium | `judge/JudgeProxyService.java:39-121`, `JudgeController.java:39-53` | 5xx → 500, no validation, unencoded path variable, and a blank token fails silently. | Map to 404/502/504, validate, and check the token at startup. |
| B9 | Medium | streak and gamification services | `LocalDate.now()` in UTC, so the streak day rolls over at 05:30 IST. | `Clock` bean + zone. |
| B10 | Medium | entities (all EAGER), `BattleService.java:148-167, 341-345` | N+1 queries on every queue poll. | Targeted queries. |
| B11 | Medium | `application.properties:8-9` | `ddl-auto=update`, `show-sql`, no migrations. | Flyway + validate. |
| B12 | Medium | `UserService.java:~128` | Deleting a user leaves orphaned rows. | Cascade. |
| B13 | Low | `BattleService.java:863-958` | ELO is not zero-sum, and losses are logged as BATTLE_WIN. | Single reward policy. |
| B14 | Low | `GamificationService.java:~64` | Level off-by-one. | Fix the boundary. |
| B15 | Low | Matchmaking, BattleTimer and QueueTimeout jobs | Duplicate cleanup, and one transaction for all battles. | One job, one transaction per battle. |
| B16 | Low | `BattleController.java:144-148` | Kick relies on the injected `kickerId` param. | Resolve it from the principal. |
| Q1 | Quality | `BattleService.java` (1,931 lines) | God class with dead judge-URL code. | Split it. |
| Q2 | Quality | `springapp/.github/java-upgrade/**`, `.vscode/NEWLY_CREATED...`, pom description | Leftovers. | Delete. |
| Q3 | Quality | tests | 2 unit tests, plus a dangerous `contextLoads`. | Test profile, auth-matrix tests, ELO/streak unit tests. |

## Frontend realtime / logic

| ID | Sev | Where | Issue |
|---|---|---|---|
| F1 | High | `pages/battle/BattleLobbyPage.jsx:639-642`, `stores/useBattleStore.js:118,229` | Every 3 s poll adds a STOMP subscription. |
| F2 | High | `useBattleStore.js:60-104`, `useGroupBattleStore.js:49-77` | A failed client reconnects forever and can't be deactivated. |
| F3 | High | same stores | Subscriptions aren't made in `onConnect`, so they are lost on reconnect. |
| F4 | High | `App.jsx:115,122` | Logout resets only the friends store. |
| F5 | Medium | three `new Client` | 3 STOMP connections per tab. |
| F6 | Medium | `index.js:26`, `BattleResultPage.jsx:312`, `GroupLobbyPage.jsx:64,97-99` | StrictMode resets, leaked room subscriptions, and an uncancelled timeout. |
| F7 | Medium | `JudgePage.jsx:142-143,197-202` | No error or login states. The UI part is in Phase 4. |
| F8 | Medium | `api.js`, `battleApi.js`, `groupBattleApi.js`, `useUserStore.js`, `realtimeUrls.js` | Base URL is built 5 ways, with mixed-content risk. |
| F9 | Medium | `api.js:80-85` | Any 401 forces a logout. |
| F10 | Low | `GroupArenaPage.jsx:180-189` | The timer shows 00:00 before the first state arrives. |
| F11 | Low | `.env.example`, `BattleService.java:1745` | Stale `REACT_APP_JUDGE_URL`, and dead helpers. |
| F12 | Low | `.kiro/specs/code-flow-visualizer/tasks.md` | Checkboxes are stale. Task 28 is still outstanding. |

## Judge

| ID | Sev | Where | Issue |
|---|---|---|---|
| J1 | High | `judge/src/executor.js:~865`, `routes/submission.js:16` | Empty `testCases` returns Accepted. |
| J2 | High | `Stages/Stage 18/s18-p03-avl-tree-visualizer.js` | 0 tests and no Java boilerplate. |
| J3 | High | `executor.js:8-12,604-697`, `app.js:11-12` | Host-mode user code can read `/proc/<ppid>/environ` (token and AWS creds). It also has network access, no C++ memory or pid limits, and grandchild processes outlive the timeout. |
| J4 | High | `.deployment/2gb/docker-compose.yml` catalog service | No `JUDGE_TOKEN`, so the internal route returns 403. Verify on the server. |
| J5 | Medium | `judge/src/app.js:~36-47` | The executor gate fails open when the token is unset. |
| J6 | Medium | `executor.js:~843` | Only whole-string trim is compared, so CRLF differences give a false WA. A non-string `expected` returns 500. |
| J7 | Medium | `Stage 24/Stage 24/design-linked-list.js` | Duplicates the Stage 10 id. |
| J8 | Low | `workerPool.js`, `docker-compose.yml`, `Dockerfile`, `sandboxes/*` | Dead Docker pool (mounts docker.sock). |
| J9 | Low | Stage folders | Double nesting. s18-p05 has only the 2 sample tests. knights-tour has repeated inputs. |
| J10 | Low | `template.yaml:~49` | Comment says 30 s; the timeout is 125 s. |

## Data / content

| ID | Sev | Issue |
|---|---|---|
| D1 | High | 11 visualizers call an undefined `navigate` prop on Back and crash. The rebuild removes this. |
| D2 | Medium | `search/catalog.js`: Graphs shows 1 card, Heaps shows 3, 11 routed visualizers are unlisted, there are 5 dead cards, and Sudoku appears twice. Pulled into the UI plan. |
| D3 | Medium | `data/dsa-conquest-map.js:450-451`: bonusC judge IDs are swapped. |
| D4 | Low | 25 `hasVisualizer:false` entries have routes that don't exist. `VISUALIZER_BASE_PATH='/visualizer'` is wrong, and Stage 20 conquestIds don't match. |
| D5 | Low | Duplicates, empty `Deque/` and `Trie/` folders, `.tsx` files, filename typos. |
| D6 | Low | Stale `reactapp/problems-catalog.json` and a duplicate `reactapp/FRONTEND_ARCHITECTURE.md`. |

## Extension

- **E1 (High):** the page can forge the `lc-vantage-*` events, and `authCheck` fails open.
- **E2 (Medium):** the `postMessage` handler doesn't check the origin (`content-script.js:~184-203`).
- **E3 (Medium):** localhost and unused judge host permissions.
- **E4 (Medium):** `config.js` points at `api.vantagecode.tech`, but nginx serves `vantageapi.themaverick.tech`. The screenshot harness confirmed the web build calls `vantageapi.themaverick.tech`.
- **E5 (Low):** the token is in `storage.local`, `sender` isn't validated, and the popup uses an unloaded Syne font with no mono font.

## Deployment / repo

- **X1:** nginx has no WS `Upgrade`/`Connection` headers and no `proxy_buffering off`. No TLS or security headers (possibly handled by Cloudflare; unverified).
- **X2:** the 4gb compose and the top-level `nginx.conf` predate the catalog. `.env.example` is missing keys, and there are no healthchecks.
- **X3:** tracked binaries: `VantageCode.zip`, about 60 MB of media, and a duplicate gif. `public/videos/hero-1..4.mp4` (about 28 MB) and `public/audio/music_main.mp3` are never referenced.
- **X4:** no LICENSE (the README claims MIT), and no CI.

## README vs reality

| README says | Reality |
|---|---|
| PostgreSQL, Redis, Spring Security | MySQL, no Redis, a custom JWT filter + spring-security-crypto |
| Firebase auth | Spring JWT in the HttpOnly cookie `vantage_at` |
| Docker judge, 3+3 worker pool, port 4000 | Lambda executor, catalog container on :3001, and the Spring proxy |
| 150+ visualizers / 164 problems | 142 routed / 158 map problems (157 unique judge ids) |
| Streak up to 2.5× | `min(1.5, 1 + 0.01×streak)` |
| Battle 20 min–3 h | Minimum is 10 min |
| "Three.js world map" | SVG + react-zoom-pan-pinch |

## Open questions

1. What decides a 1v1 at timeout?
2. Is `roguekishore/vantage:graal` public? If so, S4 is urgent.
3. Is TLS handled by Cloudflare, and does `api.vantagecode.tech` route to the Vantage server block?
4. Delete or keep the legacy Docker judge?
5. Rewrite git history to drop the media, or only stop tracking it going forward?
