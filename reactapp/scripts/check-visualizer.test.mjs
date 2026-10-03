import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkFile, extractLegacy } from "./check-visualizer.mjs";

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
  const r = checkFile(fx("legacy-good.jsx"), { ...base, noManifest: true });
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

const parity = (r) => r.checks.find((c) => c.id === 8);
test("view.map is called as map(step, input, mode); stats as (step, index, total)", () => {
  assert.equal(status(checkFile(fx("mapsig.jsx"), base), 7), "PASS");
  assert.equal(status(checkFile(fx("stats.jsx"), base), 7), "PASS");
});
test("multi-mode parity is per mode (name match, msg aliases ignored)", () => {
  const c = parity(checkFile(fx("multi.jsx"), { ...base, legacyFile: fx("legacy-multi.jsx") }));
  assert.equal(c.status, "PASS");
  assert.match(c.reason, /\[brute\].*\[optimal\]/);
});
test("multi-mode parity FAILs only the differing mode and names it", () => {
  const c = parity(checkFile(fx("multi.jsx"), { ...base, legacyFile: fx("legacy-multi-diff.jsx") }));
  assert.equal(c.status, "FAIL");
  assert.match(c.reason, /PASS \[brute\]/);
  assert.match(c.reason, /FAIL \[optimal\]/);
});
test("a mode with no legacy generator is MANUAL, not FAIL", () => {
  const c = parity(checkFile(fx("multi.jsx"), { ...base, legacyFile: fx("legacy-multi-brute-only.jsx") }));
  assert.equal(c.status, "MANUAL");
  assert.match(c.reason, /MANUAL \[/);
});
test("explanation/message/desc/description are aliases of msg for single-mode parity too", () => {
  assert.equal(status(checkFile(fx("good.jsx"), { ...base, legacyFile: fx("legacy-alias.jsx") }), 8), "PASS");
});
test("legacy extraction: component-state closure (useState stubbed from examples, useCallback unwrapped, window.BigInt, alert)", () => {
  const c = parity(checkFile(fx("state.jsx"), { ...base, legacyFile: fx("legacy-state.jsx") }));
  assert.equal(c.status, "PASS", c.reason);
});
test("legacy extraction: ops-script input is passed as parsed (capacity, commands)", () => {
  const c = parity(checkFile(fx("ops.jsx"), { ...base, legacyFile: fx("legacy-ops.jsx") }));
  assert.equal(c.status, "PASS", c.reason);
});

test("check 8 vm exposes no host process (constructor escape yields undefined)", () => {
  const src = fs.readFileSync(fx("legacy-escape.jsx"), "utf8");
  const gens = extractLegacy(src, { nums: [1, 2, 3] }, undefined);
  assert.deepEqual(gens[0].results[0], [{ probe: ["undefined", "undefined", "undefined", "undefined", "undefined"], n: 3 }]);
});
