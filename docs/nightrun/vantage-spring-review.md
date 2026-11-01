# Nightrun Vantage-Spring: Phase P4 Review and Fix Report

Date: 2026-11-01  
Repository: `VANTAGE`  
Branch: `chore/stack-spring`  
Baseline commit: `034391da4fd8ba7cce01862cc91a6f8df827b0dc`  
Reviewer: Senior Engineer (Nightrun unattended P4 phase)

---

## 1. Executive Summary & Diff Review

The diff on branch `chore/stack-spring` relative to baseline `034391d` covers:
- `springapp/pom.xml`:
  - Upgraded `<parent>` Spring Boot parent from `4.0.2` to `4.1.2` (`spring-boot-starter-parent`).
  - Switched Jackson dependency from `com.fasterxml.jackson.core:jackson-databind` to `tools.jackson.core:jackson-databind` (Jackson 3 alignment).
  - Updated `<java.version>` from `17` to `25` (stage C2).
- `springapp/Dockerfile`:
  - Updated build stage base image: `eclipse-temurin:17-jdk` -> `eclipse-temurin:25-jdk`.
  - Updated runtime stage base image: `eclipse-temurin:17-jre` -> `eclipse-temurin:25-jre`.

All gate stages (G1, G2, G3, G4, G7, G8, V) run and pass on Java 25.

---

## 2. Line-by-Line Spec Verification (SPEC.md)

### 2.1 Section 2: Hard Rules
| Rule | Requirement | Verification | Status |
|---|---|---|---|
| Rule 1 | Work only inside `repo/`. Read-only access to progress/reports/gates. | Changes confined strictly to `springapp/` and `docs/nightrun/`. | Verified |
| Rule 2 | Only gate MySQL database (`../gate.env`). No AWS calls. | Connected only to gate MySQL (`127.0.0.1:33310`). No AWS calls or credentials used. | Verified |
| Rule 3 | Invariants preserved: `ddl-auto`, entity mappings, endpoint paths, HTTP methods, JSON shapes, status codes, security rules, CORS, `application.properties`. | Schema drift checked by G8 (290 rows identical). All 38 smoke endpoints matched key shapes (G3). Security rules and CORS unchanged. | Verified |
| Rule 4 | No `git commit`, `reset`, `checkout`, `stash`, `clean`, `rebase`, `push`. | No git mutations executed. | Verified |
| Rule 5 | Do not weaken, skip, delete or `@Disabled` tests. | All unit and integration tests active and passing (3 test classes). None disabled. | Verified |
| Rule 6 | New dependencies only when build cannot work without one. | No new dependencies added to `pom.xml`. | Verified |
| Rule 7 | Never print or copy secrets. | No secrets logged or persisted. | Verified |
| Rule 8 | Each gate run and verified before stopping. | `spring-gate.sh current` and `spring-gate.sh run25` executed and passed. | Verified |

### 2.2 Section 3: Spring Stage C1 & C2 Traps
| Trap / Area | Spec Requirement | Codebase Implementation | Status |
|---|---|---|---|
| Modular starters | `web` -> `webmvc`, sliced test starters | Uses `spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa-test`, `spring-boot-starter-webmvc-test`. | Verified |
| Jackson 3 | Jackson 3 databind (`tools.jackson.core`), Jackson 2 only for JJWT | Managed `tools.jackson.core:jackson-databind` in `pom.xml`. Application code uses records and standard Jackson annotations. No direct `com.fasterxml.jackson.databind` calls in Java sources. | Verified |
| Spring Framework 7 / testing | `@MockBean`/`@SpyBean` removed (`@MockitoBean`/`@MockitoSpyBean`), `HttpHeaders` not a `MultiValueMap` | Neither `@MockBean` nor `@SpyBean` used. `HttpHeaders` usages in `WebSocketHandshakeAuthInterceptor` and `AuthController` comply with Spring 7 API. | Verified |
| Spring Security 7 | Lambda DSL, `authorizeHttpRequests`, `UserDetailsService` constructor | Application utilizes custom servlet filters (`CsrfOriginFilter`, `JwtAuthFilter`) registered via `FilterRegistrationBean` in `SecurityConfig`. No deprecated chained DSLs present. | Verified |
| Hibernate 7 | Remove deprecated dialect pins; detect MySQL automatically | No dialect pinned in `application.properties`. Hibernate ORM 7.4.13 auto-detects `MySQLDialect`. G8 schema verification reports 290 rows matching baseline schema. | Verified |
| Renamed properties | Remove `spring-boot-properties-migrator` before stopping | Not present in `pom.xml`. No deprecated property keys used. | Verified |
| Native image | Native builder `ghcr.io/graalvm/native-image-community:25` | `Dockerfile.native` uses `ghcr.io/graalvm/native-image-community:25`. Profile `native` compiles AOT processing successfully (G4 PASS). | Verified |
| Lombok | Drop explicit version pins | `pom.xml` dependency and compiler plugin annotation processor have no `<version>` tags; Boot manages Lombok. | Verified |
| Target Java & Docker | Java 25, Temurin 25 images | `pom.xml` sets `<java.version>25</java.version>`. `Dockerfile` uses `eclipse-temurin:25-jdk` and `eclipse-temurin:25-jre`. | Verified |

---

## 3. Behaviour Changes Gate Cannot See

### 3.1 Authenticated Endpoints
- **Filter**: `JwtAuthFilter` (`springapp/src/main/java/com/backend/springapp/common/JwtAuthFilter.java:36`).
  - Correctly intercepts `/api/*`.
  - Distinguishes public endpoints (`/api/auth/*`, `/api/problems*`, `/api/judge/problems*`, `/api/stages*`, `/api/users/*`, `/api/institutions*`, non-me `/api/gamification/leaderboard/*`) from protected endpoints.
  - Rejects unauthenticated access with HTTP 401 (`{"error":"Authentication required"}`).
  - Resolves token from `Authorization: Bearer <jwt>`, query param `token` (for EventSource/SSE), or HttpOnly cookie `vantage_at`.
  - Wraps request in `JwtRequestWrapper` to transparently provide `userId` and `kickerId` to `@RequestParam` controller arguments.
  - Enforces `ext` scope restrictions on extension-minted tokens.

### 3.2 Write Paths & CSRF Protection
- **Filter**: `CsrfOriginFilter` (`springapp/src/main/java/com/backend/springapp/common/CsrfOriginFilter.java:28`).
  - Enforces origin validation on mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) for cookie-authenticated sessions.
  - Safely exempts Bearer token requests (not susceptible to cross-site cookie forgery).
  - Transaction boundaries verified on all write services (`BattleService`, `StoreService`, `FriendService`, `FriendChallengeService`, `UserService`, `UserProgressService`).

### 3.3 Scheduled Jobs
- `@EnableScheduling` enabled on `SpringappApplication`.
- `StreakResetJob` (`com/backend/springapp/gamification/streak/StreakResetJob.java:40`): Runs at `0 0 0 * * *` (midnight), resets stale streaks, consumes Streak Shield if owned.
- `BattleTimerJob` (`com/backend/springapp/gamification/battle/BattleTimerJob.java:19, 30`): Fixed rate 5000ms for active battle expiration and lobby timeouts; fixed rate 30000ms for stale queue cleanup.
- `QueueTimeoutJob` (`com/backend/springapp/gamification/battle/QueueTimeoutJob.java:18`): Fixed rate 30000ms for removing players waiting > 5 minutes.
- `MatchmakingJob` (`com/backend/springapp/gamification/battle/MatchmakingJob.java:18`): Fixed rate 5000ms for matchmaking pairing.
- `FriendChallengeService` (`com/backend/springapp/friend/challenge/FriendChallengeService.java:300`): Fixed rate 30000ms for expiring pending challenges older than 5 minutes.

### 3.4 WebSocket and SockJS Configuration
- `WebSocketConfig` (`springapp/src/main/java/com/backend/springapp/common/WebSocketConfig.java:32`):
  - In-memory simple broker on `/topic`.
  - STOMP endpoint registered at `/ws` with SockJS fallback and CORS origins matching configuration.
  - Interceptors registered: `WebSocketHandshakeAuthInterceptor` (extracts user token from query param or auth cookie during HTTP handshake) and `StompAuthChannelInterceptor` (enforces authorization on `CONNECT` and user-scoped `SUBSCRIBE` destinations).
  - `SockJsRuntimeHints` and `AppRuntimeHints` registered for native GraalVM compatibility.

### 3.5 CORS
- `WebConfig` (`springapp/src/main/java/com/backend/springapp/common/WebConfig.java:20`):
  - Configures `allowedOrigins` from property `cors.allowed-origins`.
  - Supports credentialed requests (`allowCredentials(true)`).
  - Permits wide-open CORS for `/api/sync/**` (Chrome extension requests without Origin headers).
  - `JwtAuthFilter` applies CORS headers to 401/403 rejection responses so browser clients receive readable error responses.

### 3.6 Exception Handlers
- `GlobalExceptionHandler` (`springapp/src/main/java/com/backend/springapp/common/GlobalExceptionHandler.java:22`):
  - Catches `EntityNotFoundException` and `NoSuchElementException` -> 404 NOT FOUND.
  - Catches `IllegalStateException` -> 409 CONFLICT.
  - Catches `IllegalArgumentException` and `MethodArgumentNotValidException` -> 400 BAD REQUEST.
  - Gracefully ignores `AsyncRequestNotUsableException` (client SSE disconnects).
  - Catches unhandled `Exception` -> 500 INTERNAL SERVER ERROR with generic error message to prevent stack trace leaks.
  - `StoreController` defines specific `@ExceptionHandler` for `InsufficientCoinsException` (400 BAD REQUEST).

### 3.7 Date and Number Formats in JSON
- Temporal fields (`LocalDate`, `LocalDateTime`, `Instant`) in entities and DTOs serialize via Jackson's standard ISO-8601 representation.
- Numerical fields (IDs, coin balances, ratings) retain primitive/wrapper types without format degradation.

### 3.8 Lazy-Loading and Session Management
- `spring.jpa.open-in-view` defaults to enabled, ensuring views and serializers accessing lazy associations during request handling succeed without `LazyInitializationException`.

---

## 4. Findings and Observations Table

| Severity | File:Line | Finding / Observation | Resolution / Status |
|---|---|---|---|
| Info | `springapp/pom.xml:8` | Upgraded Boot parent `4.0.2` -> `4.1.2`. | Confirmed matching SPEC.md §1. Fixed in P1. |
| Info | `springapp/pom.xml:30` | Updated `java.version` `17` -> `25`. | Confirmed matching SPEC.md §1 & §4. Fixed in P3. |
| Info | `springapp/pom.xml:42-44` | Replaced Jackson 2 group with `tools.jackson.core:jackson-databind`. | Confirmed matching SPEC.md §3 Jackson 3 rules. Fixed in P1. |
| Info | `springapp/Dockerfile:24,43` | Updated Temurin base images to `25-jdk` and `25-jre`. | Confirmed matching SPEC.md §1 & §4. Fixed in P3. |
| Minor | `c.b.s.g.l.InstitutionDataInitializer:47` | When run on an empty test database, `InstitutionDataInitializer` seeds 255 records via a `@Transactional` CommandLineRunner. If HTTP smoke requests execute concurrently before runner commit, queries to `/api/institutions` read an empty table until committed. | Timing race condition observed during concurrent gate probe; both baseline and migrated behave identically once runner commits. All 38 smoke endpoints pass on repeatable runs. No spec change required. |

---

## 5. Gate Verification Summary

- **G1 (mvn verify on Java 25)**: PASS (Build success, all 3 test suites pass).
- **G2 (Boot test)**: PASS (Application boots cleanly with zero unexpected errors).
- **G3 (Differential smoke test)**: PASS (All 38 endpoints return identical HTTP status codes and matching JSON response shapes between baseline and migrated jars).
- **G4 (AOT native processing)**: PASS (Spring AOT compilation completes successfully with all runtime hints).
- **G7 (Scope conformance)**: PASS (Diff is confined strictly to allowed directories `springapp/` and `docs/nightrun/`).
- **G8 (Hibernate schema drift)**: PASS (All 290 information schema rows match baseline schema exactly; fresh install schema identical).
- **V (Version assertions)**: PASS (Boot parent `4.1.2`, Java `25`, Temurin `25` Dockerfile images, native builder `:25`).
