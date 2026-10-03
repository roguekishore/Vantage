import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkFile } from "./check-visualizer.mjs";

const FX = path.join(path.dirname(fileURLToPath(import.meta.url)), "__fixtures__/visualizer");
const fx = (n) => path.join(FX, n);
const base = { rev: "viz-legacy", ignore: [], noManifest: true, legacyFile: fx("legacy-good.jsx"), allowRenumber: true };
const status = (r, id) => r.checks.find((c) => c.id === id).status;

test("good config passes 1-8 (6 skipped, 9 manual)", () => {
  const r = checkFile(fx("good.jsx"), base);
  for (const id of [1, 2, 3, 4, 5, 7, 8, 10]) assert.equal(status(r, id), "PASS", `check ${id}`);
  assert.equal(status(r, 6), "SKIP");
  assert.equal(status(r, 9), "MANUAL");
});
test("JSX fails check 4", () => assert.equal(status(checkFile(fx("jsx.jsx"), base), 4), "FAIL"));
test("hex colour fails check 5", () => assert.equal(status(checkFile(fx("hex.jsx"), base), 5), "FAIL"));
test("bad line number fails check 7", () => {
  const c = checkFile(fx("badline.jsx"), base).checks.find((x) => x.id === 7);
  assert.equal(c.status, "FAIL");
  assert.match(c.reason, /line 99/);
});
test("non-deterministic generator fails check 7", () => {
  const c = checkFile(fx("nondet.jsx"), base).checks.find((x) => x.id === 7);
  assert.equal(c.status, "FAIL");
  assert.match(c.reason, /not deterministic/);
});
test("parity fails when a non-ignored field differs, and on line without renumber", () => {
  assert.equal(status(checkFile(fx("good.jsx"), { ...base, legacyFile: fx("legacy-diff.jsx") }), 8), "FAIL");
  assert.equal(status(checkFile(fx("good.jsx"), { ...base, allowRenumber: false }), 8), "FAIL");
});
test("missing legacy source is MANUAL, not FAIL", () => {
  assert.equal(status(checkFile(fx("good.jsx"), { ...base, legacyFile: fx("nope.jsx") }), 8), "MANUAL");
});
test("ESCALATE line is reported escalated", () => assert.equal(status(checkFile(fx("escalate.jsx"), base), 10), "ESCALATED"));
test("unmigrated legacy page fails 2-4 cleanly", () => {
  const r = checkFile(path.resolve(FX, "../../../src/pages/algorithms/Sorting/BubbleSort.jsx"), { ...base, noManifest: true });
  for (const id of [2, 3, 4]) assert.equal(status(r, id), "FAIL");
});

test("track B skips parity (hand-verified); --skip-parity too", () => {
  const r = checkFile(fx("good.jsx"), { ...base, track: "B", legacyFile: fx("legacy-diff.jsx") });
  assert.equal(status(r, 8), "SKIP");
  assert.match(r.checks.find((c) => c.id === 8).reason, /hand-verified/);
  assert.equal(status(checkFile(fx("good.jsx"), { ...base, skipParity: true, legacyFile: fx("legacy-diff.jsx") }), 8), "SKIP");
});
test("#123 in a msg string is not a colour; a real hex literal still fails", () => {
  assert.equal(status(checkFile(fx("hashmsg.jsx"), base), 5), "PASS");
  assert.equal(status(checkFile(fx("hex.jsx"), base), 5), "FAIL");
});
test("looping generate fails check 7 with timeout, parity not run", () => {
  const r = checkFile(fx("loop.jsx"), { ...base, timeoutMs: 1500 });
  const c = r.checks.find((x) => x.id === 7);
  assert.equal(c.status, "FAIL");
  assert.match(c.reason, /timeout/);
  assert.equal(status(r, 8), "MANUAL");
});
test("sandbox temp dirs are not leaked", async () => {
  const fs = await import("node:fs");
  const count = () => fs.readdirSync(fs.realpathSync(process.env.TMPDIR || "/tmp")).filter((n) => n.startsWith("checkviz-")).length;
  const before = count();
  checkFile(fx("good.jsx"), base);
  checkFile(fx("loop.jsx"), { ...base, timeoutMs: 1000 });
  assert.equal(count(), before);
});
