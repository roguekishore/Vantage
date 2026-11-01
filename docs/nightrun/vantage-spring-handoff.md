# Nightrun Vantage-Spring: Phase P5 Handoff Report

- **Run**: `vantage-spring`
- **Repository**: `VANTAGE`
- **Branch**: `chore/stack-spring`
- **Baseline Commit**: `034391da4fd8ba7cce01862cc91a6f8df827b0dc`
- **Date**: 2026-11-01

---

## 1. Phases Passed (from `../PROGRESS.md`)

| Phase | Status | Attempts | Commit | Description |
|---|---|---|---|---|
| **P1** | done | 0 | `58c07d093e` | Boot 4.1.2 compiles and tests pass on Java 17 |
| **P2** | done | 0 | *(clean on P1)* | Boot 4.1.2 runtime parity on Java 17 |
| **P3** | done | 0 | `26e2cc0c77` | Java 25 (stage C2) |
| **P4** | done | 0 | `e7248229ca` | Review and fix |
| **P5** | done | 0 | *(this commit)* | Handoff report |

All prerequisite migration and review phases completed with 0 retries and clean gate passes.

---

## 2. Gate Results (from `../gate-reports/*.txt`)

### 2.1 Stage C1 Gate Results (Java 17, `../gate-reports/run17.runtime.txt`)
Quoted G3 and G8 lines:
```
G3 PASS: 38 requests match
G8 PASS: schema identical (290 rows)
```
Full runtime gate output:
```
G2 PASS: migrated jar booted (ERROR lines: baseline 3, migrated 3)
G3 PASS: 38 requests match
G8 PASS: schema identical (290 rows)
INFO (report only): fresh-install schema of the migrated jar vs baseline: identical
```

### 2.2 Stage C2 Gate Results (Java 25, `../gate-reports/run25.runtime.txt`)
Quoted G3 and G8 lines:
```
G3 PASS: 38 requests match
G8 PASS: schema identical (290 rows)
```
Full runtime gate output:
```
G2 PASS: migrated jar booted (ERROR lines: baseline 3, migrated 3)
G3 PASS: 38 requests match
G8 PASS: schema identical (290 rows)
INFO (report only): fresh-install schema of the migrated jar vs baseline: identical
```

### 2.3 Additional Gate Results Summary
- **G1 (Build & Test Parity)**: PASS on both JDK 17 (`run17.mvn.log`) and JDK 25 (`run25.mvn.log`). All unit and integration test suites pass without disabling or modifying any tests.
- **G2 (Boot Check)**: PASS. Migrated application boots against empty gate DB with 3 benign baseline ERROR log lines (matching baseline exactly).
- **G3 (Differential HTTP Smoke)**: PASS. All 38 requests in `requests.txt` returned matching HTTP status codes and identical JSON key shapes between baseline and migrated jars.
- **G4 (Spring AOT Processing)**: PASS on both JDK 17 (`run17.aot.log`) and JDK 25 (`run25.aot.log`) via `mvn -B -Pnative -DskipTests -DskipNativeBuild=true package`.
- **G7 (Scope Conformance)**: PASS (`web-gate.sh - scope`). All changes strictly confined to `springapp/**` and `docs/nightrun/**`.
- **G8 (Hibernate Schema Parity)**: PASS. Schema matches baseline schema with zero column, index, or constraint drift across 290 information schema rows; fresh install schema identical.
- **V (Version Assertions)**: PASS. Spring Boot parent `4.1.2`, `java.version` is `25`, Temurin Docker images are `25-jdk` and `25-jre`, and native builder image is `ghcr.io/graalvm/native-image-community:25`.

---

## 3. Files Changed and Why (`git diff --stat $(cat ../baseline/sha)`)

### 3.1 Diff Stat
```
 docs/nightrun/vantage-spring-handoff.md | <new file>
 docs/nightrun/vantage-spring-review.md  | 132 +++++++++++++++++++++++++++++++++
 springapp/Dockerfile                   |   6 +-
 springapp/pom.xml                      |   6 +-
 4 files changed, 144 insertions(+), 6 deletions(-)
```

### 3.2 Change Rationale by File
1. `springapp/pom.xml`:
   - Upgraded Spring Boot parent from `4.0.2` to `4.1.2` (`spring-boot-starter-parent`) to meet SPEC.md §1 target version.
   - Replaced Jackson 2 artifact `com.fasterxml.jackson.core:jackson-databind` with Jackson 3 artifact `tools.jackson.core:jackson-databind` to align with Spring Boot 4.1.2 defaults per SPEC.md §3.
   - Updated `<java.version>` from `17` to `25` for Stage C2 per SPEC.md §1 and §4.
2. `springapp/Dockerfile`:
   - Updated build stage base image: `FROM eclipse-temurin:17-jdk AS build` -> `FROM eclipse-temurin:25-jdk AS build` per SPEC.md §1 and §4.
   - Updated runtime stage base image: `FROM eclipse-temurin:17-jre` -> `FROM eclipse-temurin:25-jre` per SPEC.md §1 and §4.
   - Updated Dockerfile comment to reference Java 25.
3. `docs/nightrun/vantage-spring-review.md`:
   - Created in Phase P4; detailed line-by-line review against SPEC.md, hard rules, behavior checklist, and gate proofs.
4. `docs/nightrun/vantage-spring-handoff.md`:
   - Created in Phase P5; formal morning handoff report summarizing verification, diffs, dependencies, and owner next steps.

---

## 4. Dependencies Added or Removed

- **New Dependencies**: None.
- **Dependencies Replaced / Aligned**:
  - `com.fasterxml.jackson.core:jackson-databind` was replaced with `tools.jackson.core:jackson-databind` (managed under Spring Boot 4.1.2 parent).
- **Dependency Pins**:
  - No explicit version pins introduced; Lombok and Jackson remain parent-managed.
  - Temporary dependencies (such as `spring-boot-properties-migrator`) were not retained.

---

## 5. Anything in `docs/nightrun/vantage-spring-left.md`

`docs/nightrun/vantage-spring-left.md` does not exist. Nothing was left undone or blocked during any phase of this run.

---

## 6. What the Owner Must Still Do

Per SPEC.md §8, the following actions belong to the owner and must be completed before and after merging:
1. **Push the branch**:
   ```bash
   git push origin chore/stack-spring
   ```
2. **Run GitHub Actions native build**:
   - Run or trigger the CI native build workflow to verify the GraalVM native binary compilation on GitHub Actions infrastructure.
3. **Flip `mise.toml` to temurin-25**:
   - Update the developer toolchain in `mise.toml` to set Java to `temurin-25` (untracked file).
4. **Merge**:
   - Merge `chore/stack-spring` into `main`.
5. **Deploy**:
   - Trigger the deployment pipeline with the updated Java 25 container images.
