# VANTAGE

Spring Boot 4.0.2 + React + Node catalog + AWS Lambda judge.

## Native image status

DONE. Tag: `roguekishore/vantage:graal`
Always verify the live digest — the tag has moved several times:
```bash
docker inspect -f '{{.RepoDigests}}' roguekishore/vantage:graal
```

Compose settings:
```yaml
command: ["-Xmx160m"]
mem_limit: 320m
memswap_limit: 320m
```

Catalog service: `roguekishore/vantage-catalog:latest` — separate Node container, port 3001.
Catalog compose: no heap flag needed (Node). Requires `JUDGE_TOKEN` env var — guard fails CLOSED (missing = 403).

## Project-specific native gotchas

- Boot 4.x → GraalVM 25 mandatory. Build image: `ghcr.io/graalvm/native-image-community:25`. Maven tarball must be 3.9.11+.
- JJWT version: **0.12.6** (539 classes — adds `FieldElementConverter`). Never copy reflect-config from argus (0.12.3).
- Records: 50 records registered in reflect-config. All nested records use `$` binary name. Regenerate from source before builds.
- `getReferenceById` fix already applied at `UserProgressService.createUserReference` → uses `findById().orElseThrow()`.
- WebSocket/SockJS: handled via `SockJsRuntimeHints.java`, wired with `@ImportRuntimeHints` on `SpringappApplication`. `@ImportRuntimeHints` is in `org.springframework.context.annotation`, not `org.springframework.aot.hint.annotation`.
- All `@ManyToOne`/`@OneToOne` are EAGER.

## Frontend redesign

Branch `polish` carries the full UI redesign. Start at `docs/polish/HANDOFF.md`, then `docs/polish/POLISH_PLAN.md`. Once Phase 1 lands, `docs/polish/DESIGN_SYSTEM.md` is the frozen source of truth for every UI change.

## Judge architecture

Main-tree `judge/` is the Lambda judge (the old `.claude/worktrees/judge-lambda` worktree was merged; `.claude/worktrees/` is empty).
See `judge/README.md` before touching submission logic.
Full test cases only via token-guarded `GET /api/internal/problems/:id`.
Never grade against `sampleTestCases` — wrong solutions that pass 2 samples get marked Accepted.

## GraalVM shared lessons

@../.claude/graalvm-lessons.md
