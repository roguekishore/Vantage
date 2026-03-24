# Phase 6 — Rollout Plan (Feature Flags + Metrics)

## Feature flags

Backend flags are read via Spring properties (with safe defaults):

- `battle.customTimer1v1.enabled` (default: `true`)
- `battle.continueAfterFirstFinisher.enabled` (default: `true`)

### Runtime visibility

- `GET /api/battle/feature-flags`
  - Returns active values + allowed 1v1 duration sets.

## Suggested staged rollout

### Stage 0 (shadow)

- Keep both flags enabled in non-prod.
- Validate metrics ingestion and dashboard integrity.

### Stage 1 (casual-only confidence)

- `battle.customTimer1v1.enabled=true`
- Keep ranked constraints already enforced.
- Monitor:
  - queue split by duration bucket,
  - average wait time,
  - queue cancellation rate.

### Stage 2 (continue-solving policy)

- `battle.continueAfterFirstFinisher.enabled=true`
- Monitor:
  - average submissions per battle,
  - battle duration distribution,
  - completion trigger reasons.

### Stage 3 (full rollout)

- Both flags true globally.
- Keep rollback path ready (toggle-only rollback).

## Metrics emitted

The service emits Micrometer counters:

- `battle.queue.join`
  - tags: `mode`, `durationMinutes`
- `battle.firstFinisher`
  - tags: `mode`
- `battle.complete.trigger`
  - tags: `reason` (`timer`, `forfeit`, `all_solved`), `mode`

## Operational dashboard checklist

Track, at minimum:

1. Queue health
   - Join counts by mode and timer
   - Match wait time (external query over events)

2. Match behavior
   - Completion reason distribution
   - First finisher count vs completed battles

3. Stability
   - API 4xx rate for validation failures
   - 5xx error rate for battle endpoints

## Rollback strategy

If issues appear:

1. Set `battle.continueAfterFirstFinisher.enabled=false` to restore early complete on all solved.
2. Set `battle.customTimer1v1.enabled=false` to force `problemCount * 15` duration behavior.
3. Re-check queue and completion metrics after rollback.

## Verification commands

- Backend compile:
  - `./mvnw -DskipTests compile`
- Targeted tests:
  - `./mvnw -Dtest=BattleServiceDurationValidationTest,BattleServiceQueueGuardTest test`
