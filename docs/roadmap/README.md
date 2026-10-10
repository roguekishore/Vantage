# Roadmap

What is left to do, as of 2026-10-06. This is the only place plans live; everything that has shipped is described in
`docs/design-system.md`, `docs/visualizer-contract.md` and `docs/scale/`.

| Area | State | Next |
|---|---|---|
| App UI (design system, shell, every app page) | Shipped | Items blocked on logic changes: [`ui.md`](ui.md#blocked-on-a-logic-change) |
| Algorithm visualizers | 12 of 145 migrated to `defineVisualizer`; 133 legacy files remain | [`ui.md`](ui.md) |
| Battle and judge scale-out | Shipped behind flags, measured on one ARM box | Real-AWS validation: [`infra.md`](infra.md) |
| Security and backend correctness | Critical items fixed; open items remain | [`backend.md`](backend.md) |
| Native image | Built and run on ARM; the new SDK and Redis paths are unverified under native | [`infra.md`](infra.md) |

## Order of work

1. **Fix the unwinnable problems.** 26 of the 113 seeded problems have no catalog test cases, so a submission to them can
   never be Accepted. About one battle in five would be unwinnable if production has the same gap
   ([`backend.md`](backend.md#data-and-content)).
2. **Migrate the visualizers** in manifest order, then remove the legacy compatibility layer
   ([`ui.md`](ui.md#visualizer-migration)).
3. **Close the open security items** (query-string tokens, JWT in `localStorage`, rate limiting, the judge gate that fails
   open) ([`backend.md`](backend.md#security)).
4. **Validate on real AWS**: SQS, the Lambda judge, a separate load generator ([`infra.md`](infra.md)).
5. **Demo polish**: demo-data mode, copy pass, README screenshots ([`ui.md`](ui.md#demo-polish)).

## Gates

A change is done when these pass from the relevant folder:

| Folder | Command |
|---|---|
| `reactapp` | `npm run build` (set `CI=false`, `REACT_APP_API_URL=http://localhost:1` for offline states), `npm test -- --watchAll=false`, `node scripts/contrast.mjs`, `node scripts/check-ui.mjs`, `node scripts/route-smoke.mjs` |
| `reactapp` (visualizers) | `node scripts/check-visualizer.mjs <file>` |
| `judge` | `npm test` |
| `springapp` | `sh ./mvnw -q test`; with Docker, `sh ./mvnw -q -Pit verify` |
