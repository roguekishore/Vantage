# Phase 5 — Battle Feature Test Matrix

This matrix validates the implemented feature set:

- Custom timers for 1v1 and group battles
- Continue solving during 1v1 until timer/forfeit completion
- Mode-aware duration validation and anti-abuse guards

## 1) Backend Automated Coverage

### Unit tests added

- `BattleServiceDurationValidationTest`
  - Casual allows `10m`
  - Ranked rejects `10m`
  - Ranked allows `15m`
  - Fallback duration resolves to `problemCount * 15`
  - Invalid `problemCount` rejected
  - Non-1v1 mode rejected for 1v1 duration resolver

- `BattleServiceQueueGuardTest`
  - Queue rejects `GROUP_FFA`
  - Queue rejects `problemCount < 1`
  - Queue rejects `problemCount > 3`

## 2) API Validation Matrix (manual / Postman)

### 1v1 Queue

- `POST /api/battle/queue`
  - ✅ `CASUAL_1V1`, `durationMinutes=10`
  - ✅ `RANKED_1V1`, `durationMinutes=15`
  - ❌ `RANKED_1V1`, `durationMinutes=10` (expect 4xx)
  - ❌ `mode=GROUP_FFA` (expect 4xx)
  - ❌ `problemCount=0` or `4` (expect 4xx)

### Friend challenge

- `POST /api/friends/challenges`
  - ✅ 1v1 challenge with valid per-mode duration
  - ❌ Ranked challenge with `10m`
  - ✅ Group invite where provided `durationMinutes` matches room duration
  - ❌ Group invite where provided `durationMinutes` differs from room duration

### Group room

- `POST /api/battle/room`
  - ✅ `problemCount` in `1..3`
  - ✅ `durationMinutes` in `10..180`
  - ❌ `durationMinutes < 10` or `> 180`

## 3) Frontend Flow Matrix

### Battle Lobby (1v1)

- Duration options visible and selectable.
- Ranked mode excludes `10m`.
- Switching mode auto-corrects invalid selected timer.
- Queue request includes selected `durationMinutes`.

### Friends challenge modal

- Duration options visible.
- Ranked excludes `10m`.
- Submit sends selected `durationMinutes`.

### Group Lobby

- Problem count selection does not force timer change.
- Timer has explicit control.
- Room creation payload includes selected duration.

### Battle Arena (1v1)

- Live leader badge shown (`You lead`, `Opp lead`, `Tied`).
- Leader updates during active battle.

## 4) End-to-End Battle Scenarios

### 1v1 continue-solving behavior

1. Start 1v1 with `3` problems.
2. Player A solves all first.
3. Confirm battle remains `ACTIVE`.
4. Player B can continue submitting accepted solutions.
5. Battle completes only at timer expiry or forfeit.
6. Final result uses standard tiebreak chain.

### Timer completion behavior

1. Start 1v1 with custom timer (`20m` / `45m`).
2. Ensure countdown and expiry align with configured duration.
3. Ensure backend completion job finalizes battle at timeout.

### Group duration behavior

1. Create room with custom duration.
2. Start battle and verify countdown uses room duration.
3. Verify completion at timeout with placement reward logic intact.

## 5) Regression checks

- Existing forfeit flow still ends battle correctly.
- Existing websocket updates still deliver state/result payloads.
- Battle history still shows `durationMinutes`.
- No compile errors in backend or frontend after changes.
