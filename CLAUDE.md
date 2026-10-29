# VANTAGE

Coding-practice platform: Spring Boot API (`springapp/`), React app (`reactapp/`), judge/catalog Node service (`judge/`).
Two images run on the box. Boot 4 needs JDK 25 at runtime, see `../.claude/graalvm-lessons.md`.

## What runs on MaverickInstance (live, checked 2026-10-11)

| Service | Image the box pulls | mem_limit | command | Idle mem | Host |
|---|---|---|---|---|---|
| vantage | `roguekishore/vantage:graal` | 320m | `-Xmx160m` | ~62 MiB | vantageapi.themaverick.tech -> 8080 |
| catalog | `roguekishore/vantage-catalog:latest` | 96m | (node) | ~22 MiB | vantagejudge.themaverick.tech -> 3001 |

- `vantage` and `catalog` share `VANTAGE_JUDGE_TOKEN` (compose `JUDGE_TOKEN`). The judge token guard fails
  CLOSED: if it is missing, every judge call is a 403.
- Env names in the box's `.env`: `VANTAGE_*` (+ `CATALOG_ALLOWED_ORIGIN`). Real values live only on the box.

## Build and push (GitHub Actions)

Two separate workflows, so each image has its own Run workflow button and tag box
(Actions tab: "Build and Push (vantage)" and "Build and Push (catalog)"). Pick the branch, type a tag:
- **Build and Push (vantage)**: `roguekishore/vantage:<tag>` from `springapp/Dockerfile.native` (smoke-tested). Box pulls `:graal`.
- **Build and Push (catalog)**: `roguekishore/vantage-catalog:<tag>` from `judge/Dockerfile.catalog`. Box pulls `:latest`.

So: API change -> run "(vantage)" with `graal`; catalog change -> run "(catalog)" with `latest`. Then on the box
`sudo docker-compose pull <service> && sudo docker-compose up -d <service>`.

State 2026-10-11: the split is committed locally (`ci: build vantage and catalog images in separate workflows`,
dated 2026-09-25 at the user's request) and NOT pushed; GitHub still has the single combined workflow until
`main` is pushed. No run has happened yet. Details: `../.deployment/ci/RUNBOOK.md`; the box: `../.deployment/CLAUDE.md`.
