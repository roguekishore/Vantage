#!/usr/bin/env node
/**
 * check-visualizer.mjs - acceptance checks for migrated visualizer files
 * This is the acceptance gate for each migration.
 *
 *   node scripts/check-visualizer.mjs [options] <file...>
 *
 *   --json <out>          write the full result as JSON
 *   --rev <rev>           legacy snapshot for the parity check (default viz-legacy)
 *   --legacy-file <path>  read the legacy source from a file instead of `git show` (single file; for tests)
 *   --legacy-input <json> input passed to the legacy generator (default: guessed, see below)
 *   --allow-renumber      ignore `line` in the parity check (also on when manifest notes mention "renumber")
 *   --ignore a,b          extra step fields ignored by parity (default list: msg, line*, x, y, layout fields)
 *   --no-manifest         file is not in the manifest: check 6 is SKIP and manifest-bound rules are not applied
 *   --skip-parity         parity SKIP "hand-verified" (automatic when manifest track is B, D or alias)
 *   --track <X>           override the manifest track (tests / ad-hoc)
 *   --timeout-ms <n>      check 7 child-process timeout (default 20000)
 *   --track-c             exempt JSX (check 4); also implied by manifest track "C"
 *
 * Checks 1-5 are static (Babel AST). Check 6 reads docs/visualizer-manifest.json by repo-relative
 * path. Check 7 executes the config WITHOUT React: the file is transpiled with @babel/core into a temp dir,
 * `@/components/visualizer` is a stub (defineVisualizer(config) returns config; fieldError is the REAL one),
 * and the shell's pure modules (v2/inputModel.js, fieldError.js, tones.js) are transpiled from src and used
 * directly, so the shell's coercion (draftsFromValues -> coerceAll round trip) and assertSteps are the real
 * code, not a reimplementation. Check 8 is parity vs the legacy generator (heuristic described at
 * `extractLegacy` below); extraction failure is MANUAL, not FAIL. Check 9 is the orchestrator's build.
 * Check 10: a file that is a single `ESCALATE:` line is reported ESCALATED (counts as a failure for exit).
 *
 * SECURITY: check 8 executes TRUSTED legacy code from git history (or --legacy-file) in a node:vm context. It is
 * NOT a security sandbox (node:vm never is). The context gets its own realm builtins and only JSON strings cross
 * the boundary, so `Array.constructor("return typeof process")()` is "undefined" inside it, but do not point
 * --rev / --legacy-file at untrusted source.
 *
 * Output per file: one line per check (PASS / FAIL / MANUAL / SKIP) + a summary. Exit 1 on any FAIL/ESCALATED.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const ROOT = path.resolve(APP, "..");
const require = createRequire(path.join(APP, "package.json"));
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

const V2 = path.join(APP, "src/components/visualizer/v2");
const MANIFEST = path.join(ROOT, "docs/visualizer-manifest.json");
const ALLOWED_IMPORT = "@/components/visualizer";

/* ───────────────────────── helpers ───────────────────────── */
const R = (status, reason = "") => ({ status, reason });
const PASS = (r) => R("PASS", r);
const FAIL = (r) => R("FAIL", r);
const MANUAL = (r) => R("MANUAL", r);
const SKIP = (r) => R("SKIP", r);
const short = (a, n = 4) => (a.length > n ? [...a.slice(0, n), `(+${a.length - n} more)`] : a).join("; ");
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const clone = (v) => (v === undefined ? v : structuredClone(v));

function parseCode(code, file) {
  return parser.parse(code, { sourceType: "module", plugins: ["jsx"], errorRecovery: false, sourceFilename: file });
}

function transpile(code, filename) {
  return babel.transformSync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceType: "module",
    presets: [
      [require.resolve("@babel/preset-env"), { targets: { node: "current" }, modules: "commonjs" }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
  }).code;
}

/* ───────────────────────── static checks ───────────────────────── */
function staticChecks(ast, trackC) {
  const imports = [];
  const defaults = [];
  const jsx = [];
  const bad = { className: [], style: [], hooks: [], alert: [], console: [], navigate: [] };
  const colours = [];
  const HEX = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/;
  const FN = /\b(?:rgba?|hsla?)\s*\(/i;
  const lineOf = (n) => (n.loc ? n.loc.start.line : "?");
  const HEXV = "#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})";
  const WHOLE_HEX = new RegExp(`^\\s*${HEXV}\\s*$`);
  const CSS_HEX = new RegExp(`(?:\\b(?:color|background(?:-color)?|fill|stroke|border(?:-\\w+)?|outline|box-shadow|text-shadow)\\s*:|gradient\\([^)]*?)\\s*${HEXV}(?![\\w-])`, "i");
  const scanText = (text, node) => {
    // "Problem #123 step" is prose, not a colour: only a wholly-hex string or a hex in a CSS-ish context counts
    if (WHOLE_HEX.test(text) || CSS_HEX.test(text)) colours.push(`line ${lineOf(node)}: hex ${(text.match(HEX) || ["#?"])[0]}`);
    else if (FN.test(text)) colours.push(`line ${lineOf(node)}: ${text.match(FN)[0].trim()}`);
  };
  traverse(ast, {
    ImportDeclaration(p) {
      imports.push({ src: p.node.source.value, line: lineOf(p.node) });
    },
    ExportAllDeclaration(p) {
      imports.push({ src: p.node.source.value, line: lineOf(p.node) });
    },
    ExportNamedDeclaration(p) {
      if (p.node.source) imports.push({ src: p.node.source.value, line: lineOf(p.node) });
    },
    ExportDefaultDeclaration(p) {
      defaults.push(p.node);
    },
    JSXElement(p) {
      jsx.push(lineOf(p.node));
    },
    JSXFragment(p) {
      jsx.push(lineOf(p.node));
    },
    JSXAttribute(p) {
      const n = p.node.name.name;
      if (n === "className") bad.className.push(lineOf(p.node));
      if (n === "style") bad.style.push(lineOf(p.node));
    },
    Identifier(p) {
      if (p.node.name !== "className" && p.node.name !== "style") return;
      // property keys, member properties and bare references all count
      bad[p.node.name].push(lineOf(p.node));
    },
    StringLiteral(p) {
      scanText(p.node.value, p.node);
      if (p.node.value === "className" || p.node.value === "style") bad[p.node.value].push(lineOf(p.node));
    },
    TemplateElement(p) {
      scanText(p.node.value.cooked ?? p.node.value.raw, p.node);
    },
    CallExpression(p) {
      const c = p.node.callee;
      const l = lineOf(p.node);
      if (c.type === "Identifier") {
        if (/^use[A-Z]/.test(c.name)) bad.hooks.push(`${c.name} (line ${l})`);
        if (c.name === "alert") bad.alert.push(l);
        if (c.name === "navigate") bad.navigate.push(l);
        if (c.name === "require") imports.push({ src: p.node.arguments[0] && p.node.arguments[0].value, line: l });
      } else if (c.type === "MemberExpression" && !c.computed && c.property.type === "Identifier") {
        if (/^use[A-Z]/.test(c.property.name)) bad.hooks.push(`${c.property.name} (line ${l})`);
        if (c.object.type === "Identifier") {
          if (c.object.name === "console") bad.console.push(l);
          if (c.object.name === "window" && c.property.name === "alert") bad.alert.push(l);
        }
      } else if (c.type === "Import") {
        imports.push({ src: p.node.arguments[0] && p.node.arguments[0].value, line: l });
      }
    },
    MemberExpression(p) {
      const o = p.node.object;
      if (o.type === "Identifier" && o.name === "console") bad.console.push(lineOf(p.node));
    },
  });
  const uniq = (a) => [...new Set(a)];
  const res = {};

  const wrong = imports.filter((i) => i.src !== ALLOWED_IMPORT);
  res.imports = wrong.length ? FAIL(`only "${ALLOWED_IMPORT}" may be imported; found ${short(wrong.map((i) => `"${i.src}" (line ${i.line})`))}`) : imports.length ? PASS(`${imports.length} import(s), all ${ALLOWED_IMPORT}`) : FAIL(`no import of ${ALLOWED_IMPORT}`);

  let cfg = null;
  if (defaults.length !== 1) res.defaultExport = FAIL(defaults.length ? "multiple default exports" : "no default export");
  else {
    const d = defaults[0].declaration;
    if (d.type === "CallExpression" && d.callee.type === "Identifier" && d.callee.name === "defineVisualizer") {
      if (d.arguments.length === 1 && d.arguments[0].type === "ObjectExpression") {
        cfg = d.arguments[0];
        res.defaultExport = PASS("export default defineVisualizer({...})");
      } else res.defaultExport = FAIL("defineVisualizer must be called with one ObjectExpression");
    } else res.defaultExport = FAIL(`default export is ${d.type}${d.type === "CallExpression" && d.callee.name ? ` (${d.callee.name}(...))` : ""}, expected defineVisualizer({...})`);
  }

  const problems = [];
  if (jsx.length && !trackC) problems.push(`${jsx.length} JSX element(s) (lines ${uniq(jsx).slice(0, 5).join(",")})`);
  for (const [k, label] of [["className", "className"], ["style", "style"], ["alert", "alert("], ["console", "console."], ["navigate", "navigate("]]) {
    if (bad[k].length) problems.push(`${bad[k].length} ${label} (lines ${uniq(bad[k]).slice(0, 5).join(",")})`);
  }
  if (bad.hooks.length) problems.push(`${bad.hooks.length} hook call(s): ${short(uniq(bad.hooks), 3)}`);
  res.noViewCode = problems.length ? FAIL(problems.join("; ")) : PASS(trackC ? "clean (JSX exempt, track C)" : "clean");
  res.noColour = colours.length ? FAIL(`${colours.length} colour literal(s): ${short(colours, 3)}`) : PASS("no hex / rgb( / hsl( literals");
  res.cfgNode = cfg;
  return res;
}

/* ───────────────────── temp dir + real shell modules ───────────────────── */
function buildSandbox(file, code) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "checkviz-"));
  try {
    return buildSandboxIn(tmp, file, code);
  } catch (err) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw err;
  }
}
function buildSandboxIn(tmp, file, code) {
  fs.writeFileSync(path.join(tmp, "package.json"), '{"type":"commonjs"}');
  for (const f of ["fieldError.js", "inputModel.js", "tones.js"]) {
    fs.writeFileSync(path.join(tmp, f), transpile(fs.readFileSync(path.join(V2, f), "utf8"), f));
  }
  const stubDir = path.join(tmp, "node_modules/@/components/visualizer");
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(
    path.join(stubDir, "index.js"),
    `const fe = require(${JSON.stringify(path.join(tmp, "fieldError.js"))});
exports.defineVisualizer = (config) => config;
exports.fieldError = fe.fieldError;
exports.isFieldError = fe.isFieldError;
`
  );
  // ad-hoc configs (v2/__examples__) import ../defineVisualizer and ../fieldError: serve them from tmp/
  fs.writeFileSync(path.join(tmp, "defineVisualizer.js"), 'exports.defineVisualizer = (config) => config;\n');
  fs.mkdirSync(path.join(tmp, "sub"));
  const entry = path.join(tmp, "sub", "config.js");
  fs.writeFileSync(entry, transpile(code, path.basename(file)));
  return { tmp, entry };
}

/* ───────────────────── shape validation (§3) ───────────────────── */
const tonesOK = (tone, TONES, at, errs) => {
  if (tone == null) return;
  if (typeof tone !== "string") errs.push(`${at}: tone must be a string`);
  else if (!TONES.includes(tone)) errs.push(`${at}: unknown tone "${tone}" (known: ${TONES.join(", ")})`);
};
const isIdx = (n) => Number.isInteger(n) && n >= 0;
const isPair = (p) => Array.isArray(p) && p.length === 2 && isIdx(p[0]) && isIdx(p[1]);

function validateShape(kind, m, TONES) {
  const e = [];
  const T = (t, at) => tonesOK(t, TONES, at, e);
  const arr = (v, at) => {
    if (!Array.isArray(v)) {
      e.push(`${at} must be an array`);
      return [];
    }
    return v;
  };
  const optFn = (v, at) => v != null && typeof v !== "function" && e.push(`${at} must be a function`);
  const pointers = (ps, keyName) =>
    ps != null &&
    arr(ps, "pointers").forEach((p, i) => {
      if (!isObj(p)) return e.push(`pointers[${i}] must be an object`);
      if (keyName === "index" ? !isIdx(p.index) : p.nodeId == null) e.push(`pointers[${i}].${keyName} missing/invalid`);
      if (typeof p.label !== "string") e.push(`pointers[${i}].label must be a string`);
      if (![1, 2, 3].includes(p.role)) e.push(`pointers[${i}].role must be 1, 2 or 3`);
    });
  const band = (b) => {
    if (b == null) return;
    if (!isObj(b) || !isIdx(b.from) || !isIdx(b.to)) e.push("band needs integer from/to");
    else T(b.tone, "band.tone");
  };
  const cellList = (cells, at) =>
    arr(cells, at).forEach((c, i) => {
      if (!isObj(c) || !("value" in c)) return e.push(`${at}[${i}] needs a value`);
      T(c.tone, `${at}[${i}].tone`);
    });
  const itemList = (items, at) =>
    arr(items, at).forEach((c, i) => {
      if (!isObj(c) || !("value" in c)) return e.push(`${at}[${i}] needs a value`);
      T(c.tone, `${at}[${i}].tone`);
    });

  if (!isObj(m)) return [`map must return an object (got ${m === null ? "null" : typeof m})`];
  switch (kind) {
    case "array":
      if (m.cells === undefined && m.rows === undefined) e.push("needs cells (or rows)");
      if (m.cells !== undefined) cellList(m.cells, "cells");
      if (m.rows != null)
        arr(m.rows, "rows").forEach((r, i) => {
          if (!isObj(r) || typeof r.label !== "string") return e.push(`rows[${i}] needs a string label`);
          cellList(r.cells, `rows[${i}].cells`);
        });
      pointers(m.pointers, "index");
      band(m.band);
      break;
    case "vars":
      arr(m.vars, "vars").forEach((v, i) => {
        if (!isObj(v) || typeof v.name !== "string" || !("value" in v)) return e.push(`vars[${i}] needs name:string and value`);
        T(v.tone, `vars[${i}].tone`);
      });
      break;
    case "bars":
      arr(m.bars, "bars").forEach((b, i) => {
        if (!isObj(b) || typeof b.value !== "number") return e.push(`bars[${i}].value must be a number`);
        T(b.tone, `bars[${i}].tone`);
      });
      if (typeof m.max !== "number") e.push("max must be a number");
      pointers(m.pointers, "index");
      band(m.band);
      break;
    case "bits":
      arr(m.rows, "rows").forEach((r, i) => {
        if (!isObj(r) || typeof r.label !== "string" || !("value" in r)) return e.push(`rows[${i}] needs label:string and value`);
        if (!("bits" in r)) e.push(`rows[${i}].bits missing`);
        optFn(r.bitTone, `rows[${i}].bitTone`);
      });
      break;
    case "matrix":
      if (!Array.isArray(m.cells) || m.cells.some((r) => !Array.isArray(r))) e.push("cells must be an array of arrays");
      else m.cells.forEach((r, i) => cellList(r, `cells[${i}]`));
      for (const k of ["rowHeaders", "colHeaders"]) if (m[k] != null && !Array.isArray(m[k])) e.push(`${k} must be an array`);
      if (m.active != null && !isPair(m.active)) e.push("active must be [r, c]");
      if (m.deps != null && (!Array.isArray(m.deps) || !m.deps.every(isPair))) e.push("deps must be [r, c][]");
      break;
    case "list":
      arr(m.nodes, "nodes").forEach((n, i) => {
        if (!isObj(n) || n.id == null || !("value" in n)) return e.push(`nodes[${i}] needs id and value`);
        T(n.tone, `nodes[${i}].tone`);
      });
      arr(m.edges, "edges").forEach((x, i) => {
        if (!isObj(x) || x.from == null || x.to == null) e.push(`edges[${i}] needs from and to`);
        else T(x.tone, `edges[${i}].tone`);
      });
      pointers(m.pointers, "nodeId");
      break;
    case "tree":
      if (m.root === undefined || (m.root !== null && typeof m.root !== "object")) e.push("root must be a node object or null");
      for (const k of ["getChildren", "nodeTone", "edgeTone", "badges"]) optFn(m[k], k);
      break;
    case "graph":
      arr(m.nodes, "nodes").forEach((n, i) => {
        if (!isObj(n) || n.id == null || n.label == null) return e.push(`nodes[${i}] needs id and label`);
        T(n.tone, `nodes[${i}].tone`);
        for (const k of ["x", "y"]) if (n[k] != null && typeof n[k] !== "number") e.push(`nodes[${i}].${k} must be a number`);
      });
      arr(m.edges, "edges").forEach((x, i) => {
        if (!isObj(x) || x.from == null || x.to == null) e.push(`edges[${i}] needs from and to`);
        else {
          T(x.tone, `edges[${i}].tone`);
          if (x.weight != null && typeof x.weight !== "number" && typeof x.weight !== "string") e.push(`edges[${i}].weight must be number|string`);
        }
      });
      if (typeof m.directed !== "boolean") e.push("directed must be a boolean");
      break;
    case "intervals":
      arr(m.intervals, "intervals").forEach((x, i) => {
        if (!isObj(x) || typeof x.start !== "number" || typeof x.end !== "number") return e.push(`intervals[${i}] needs numeric start/end`);
        T(x.tone, `intervals[${i}].tone`);
      });
      if (typeof m.min !== "number" || typeof m.max !== "number") e.push("min and max must be numbers");
      break;
    case "stack":
      itemList(m.items, "items");
      break;
    case "queue":
      itemList(m.items, "items");
      for (const k of ["head", "tail", "capacity"]) if (m[k] != null && typeof m[k] !== "number") e.push(`${k} must be a number`);
      if (m.circular != null && typeof m.circular !== "boolean") e.push("circular must be a boolean");
      break;
    case "table":
      arr(m.entries, "entries").forEach((x, i) => {
        if (!isObj(x) || !("key" in x) || !("value" in x)) return e.push(`entries[${i}] needs key and value`);
        T(x.tone, `entries[${i}].tone`);
      });
      break;
    case "callstack":
      arr(m.frames, "frames").forEach((f, i) => {
        if (!isObj(f) || typeof f.fn !== "string" || !("args" in f)) return e.push(`frames[${i}] needs fn:string and args`);
        if (!["active", "waiting", "returned"].includes(f.status)) e.push(`frames[${i}].status must be active|waiting|returned`);
      });
      break;
    case "ops":
      if (!Array.isArray(m.ops) || !m.ops.every((o) => typeof o === "string")) e.push("ops must be string[]");
      if (!Number.isInteger(m.active)) e.push("active must be an integer");
      if (m.results != null && (!Array.isArray(m.results) || !m.results.every((o) => typeof o === "string"))) e.push("results must be string[]");
      break;
    default:
      e.push(`unknown stage/aux kind "${kind}"`);
  }
  return e;
}

/* ───────────────────── check 6: config shape ───────────────────── */
function checkConfigShape(cfg, entry, noManifest) {
  const p = [];
  if (!isObj(cfg.meta)) p.push("meta missing");
  else for (const k of ["title", "category", "difficulty", "summary"]) if (!cfg.meta[k]) p.push(`meta.${k} missing`);
  if (!Array.isArray(cfg.inputs)) p.push("inputs missing");
  if (!Array.isArray(cfg.examples) || !cfg.examples.length) p.push("examples missing or empty");
  if (typeof cfg.parse !== "function") p.push("parse missing");
  if (!isObj(cfg.view)) p.push("view missing");
  else {
    if (typeof cfg.view.stage !== "string") p.push("view.stage missing");
    if (typeof cfg.view.map !== "function" && typeof cfg.view.render !== "function") p.push("view.map missing");
  }
  const hasModes = isObj(cfg.modes);
  if (hasModes) {
    for (const [k, m] of Object.entries(cfg.modes)) {
      if (typeof m.generate !== "function") p.push(`modes.${k}.generate missing`);
      if (!m.code || !Array.isArray(m.code.lines)) p.push(`modes.${k}.code.lines missing`);
      if (!m.complexity && !cfg.complexity) p.push(`modes.${k}.complexity missing`);
    }
    if (!cfg.defaultMode) p.push("defaultMode missing");
  } else {
    if (typeof cfg.generate !== "function") p.push("generate missing");
    if (!cfg.code || !Array.isArray(cfg.code.lines) || !cfg.code.lines.length) p.push("code.lines missing");
    if (!cfg.complexity) p.push("complexity missing");
  }
  if (!Array.isArray(cfg.legend)) p.push("legend missing");
  if (entry && !noManifest) {
    if (cfg.view && entry.stage && cfg.view.stage !== entry.stage) p.push(`view.stage "${cfg.view.stage}" != manifest stage "${entry.stage}"`);
    const allowed = entry.aux || [];
    const kinds = ((cfg.view && cfg.view.aux) || []).map((a) => a && a.kind);
    const extra = kinds.filter((k) => !allowed.includes(k));
    if (extra.length) p.push(`aux kind(s) ${extra.join(",")} not in manifest aux [${allowed.join(",")}]`);
    if (hasModes !== Boolean(entry.modes)) p.push(`modes ${hasModes ? "present" : "absent"} but manifest modes=${Boolean(entry.modes)}`);
  }
  for (const a of (cfg.view && cfg.view.aux) || []) {
    if (!a || typeof a.kind !== "string" || typeof a.map !== "function") p.push("every view.aux entry needs kind and map");
  }
  return p.length ? FAIL(short(p, 6)) : PASS(`required keys present${entry && !noManifest ? ", matches manifest" : ""}`);
}

/* ───────────────────── check 7: execution ───────────────────── */
function runExecution(cfg, sb, entry) {
  const im = sb.require("../inputModel.js");
  const { TONES } = sb.require("../tones.js");
  const p = [];
  const modes = isObj(cfg.modes) ? Object.keys(cfg.modes) : [null];
  const specOf = (mode) => (mode === null ? cfg : cfg.modes[mode]);
  const stats = { runs: 0, steps: 0 };
  const stage = cfg.view && cfg.view.stage;
  const hasMap = cfg.view && typeof cfg.view.map === "function";
  const auxes = (cfg.view && cfg.view.aux) || [];
  (cfg.examples || []).forEach((ex, ei) => {
    const exTag = `example ${ei}${ex.label ? ` "${ex.label}"` : ""}`;
    const values = { ...im.defaultValues(cfg.inputs || []), ...(ex.values || {}) };
    // The shell passes COERCED values to parse. Real round trip: values -> drafts -> coerceAll must succeed.
    try {
      const drafts = im.draftsFromValues(cfg.inputs, values);
      const { errors } = im.coerceAll(cfg.inputs, drafts);
      if (Object.keys(errors).length) p.push(`${exTag}: values do not survive the shell's draft round trip (${short(Object.entries(errors).map(([k, v]) => `${k}: ${v}`), 2)})`);
    } catch (err) {
      p.push(`${exTag}: round trip threw ${err.message}`);
    }
    let input;
    try {
      input = cfg.parse(clone(values));
      if (cfg.validate) {
        const errs = cfg.validate(clone(input));
        if (errs && Object.keys(errs).length) throw new Error(`validate rejected the example: ${JSON.stringify(errs)}`);
      }
    } catch (err) {
      p.push(`${exTag}: parse threw ${err.message}`);
      return;
    }
    for (const mode of modes) {
      const tag = `${exTag}${mode ? ` [${mode}]` : ""}`;
      const spec = specOf(mode);
      let s1, s2;
      try {
        s1 = spec.generate(clone(input));
        s2 = spec.generate(clone(input));
      } catch (err) {
        p.push(`${tag}: generate threw ${err.message}`);
        continue;
      }
      stats.runs += 1;
      if (!Array.isArray(s1) || !s1.length) {
        p.push(`${tag}: generate returned no steps`);
        continue;
      }
      stats.steps += s1.length;
      if (!isDeepStrictEqual(s1, s2)) {
        const i = s1.findIndex((s, k) => !isDeepStrictEqual(s, s2[k]));
        p.push(`${tag}: generate is not deterministic (two runs differ${s1.length !== s2.length ? ` in length ${s1.length}/${s2.length}` : ` at step ${i}`})`);
      }
      const lines = spec.code && spec.code.lines ? spec.code.lines : [];
      im.assertSteps(s1, lines).forEach((x) => p.push(`${tag}: ${x}`));
      if (!hasMap) continue;
      const seen = new Set();
      s1.forEach((st, k) => {
        const check = (kind, fn) => {
          let out;
          try {
            out = fn(st, clone(input), mode || "default");
          } catch (err) {
            const msg = `${tag}: ${kind} map threw ${err.message}`;
            if (!seen.has(msg)) p.push(`${msg} (first at step ${k})`);
            seen.add(msg);
            return;
          }
          for (const x of validateShape(kind, out, TONES)) {
            const msg = `${tag}: ${kind} map shape: ${x}`;
            if (!seen.has(msg)) p.push(`${msg} (first at step ${k})`);
            seen.add(msg);
          }
        };
        // Same call as the shell (StageView): view.map(step, input, mode), aux.map(step, input, mode).
        check(stage, (...a) => cfg.view.map(...a));
        auxes.forEach((a) => check(a.kind, (...x) => a.map(...x)));
        // Same call as defineVisualizer: stats(step, index, total).
        if (typeof cfg.stats === "function") {
          try {
            const sv = cfg.stats(st, k, s1.length);
            if (sv != null && !Array.isArray(sv)) {
              const msg = `${tag}: stats must return an array or null (got ${typeof sv})`;
              if (!seen.has(msg)) p.push(`${msg} (first at step ${k})`);
              seen.add(msg);
            }
          } catch (err) {
            const msg = `${tag}: stats threw ${err.message}`;
            if (!seen.has(msg)) p.push(`${msg} (first at step ${k})`);
            seen.add(msg);
          }
        }
      });
    }
  });
  if (!hasMap && !(cfg.view && cfg.view.render)) p.push("view.map missing");
  return p.length ? FAIL(short(p, 6)) : PASS(`${stats.runs} run(s), ${stats.steps} step(s), deterministic, shapes ok`);
}

/* ───────────────────── check 8: parity ───────────────────── */
/*
 * Legacy extraction heuristic (extractLegacy):
 *  1. Parse the legacy source (jsx). Find every call `setHistory(X)` / `setSteps(X)` where X is not an
 *     empty array, a function, or a literal; the generator is the innermost function containing it.
 *  2. Build a script: all top-level statements that are not imports/exports/React components (i.e. plain
 *     const/function declarations with no JSX inside), then `__gen = <generator source>`.
 *     Free identifiers still unresolved (setStep, setLoaded, ...) are bound to no-ops; setHistory/setSteps
 *     capture the argument. The legacy `V`, `MONO` etc. imports are bound to a permissive Proxy.
 *  3. The generator is called with candidate inputs derived from examples[0] (first input value; first
 *     value wrapped as [{value,id}]; the values object; all values as args). The first call that
 *     captures a non-empty array wins; --legacy-input overrides.
 *  Any failure in 1-3 -> parity: "manual".
 * Comparison ignores msg and its aliases (explanation, message, desc, description), line (with renumber), layout
 * fields (x, y, left, top, pos, position(s), width, height). Everything else must deep-equal, so a legacy
 * field rename shows as FAIL with the diff; the reviewer then decides. If several candidate inputs ran,
 * PASS if any matches, otherwise the diff of the first.
 */
const MSG_ALIASES = ["explanation", "message", "desc", "description"];
const LAYOUT_KEYS = ["x", "y", "left", "top", "pos", "position", "positions", "width", "height"];

function fnName(fnPath) {
  const n = fnPath.node;
  if (n.id && n.id.name) return n.id.name;
  let q = fnPath.parentPath;
  if (q && q.isCallExpression()) q = q.parentPath; // useCallback(fn, deps)
  if (q && q.isVariableDeclarator() && q.node.id.type === "Identifier") return q.node.id.name;
  if (q && (q.isObjectProperty() || q.isClassProperty()) && q.node.key && q.node.key.name) return q.node.key.name;
  return "";
}

/* Component-scope extraction support (check 8). */
const nodeHasJsx = (n) => {
  let has = false;
  traverse({ type: "File", program: { type: "Program", body: [{ type: "ExpressionStatement", expression: n }], directives: [], sourceType: "module" } }, { JSXElement() { has = true; }, JSXFragment() { has = true; } });
  return has;
};
const hookName = (call) => (call && call.type === "CallExpression" && call.callee.type === "Identifier" ? call.callee.name : (call && call.type === "CallExpression" && call.callee.type === "MemberExpression" && call.callee.property.name) || "");

/* Example leaf entries: top-level keys plus one level of plain-object children. */
function exampleEntries(example0) {
  const out = [];
  for (const [k, v] of Object.entries(example0 || {})) {
    out.push({ path: k, key: k, value: v });
    if (isObj(v) && !Array.isArray(v)) for (const [k2, v2] of Object.entries(v)) out.push({ path: `${k}.${k2}`, key: k2, value: v2 });
  }
  return out;
}
const commonPrefix = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
function stateMatchScore(stateName, key) {
  const l = normName(stateName), m = normName(key);
  if (!l || !m) return 0;
  if (l === m) return 100;
  if (l.includes(m) && m.length >= 3) return 50 + m.length;
  if (m.includes(l) && l.length >= 3) return 40 + l.length;
  const cp = commonPrefix(l, m);
  return cp >= 3 ? cp : 0;
}
/* Convert an example value so it has the same shape as the legacy state's initial value. */
function coerceState(init, v) {
  if (typeof init === "string") {
    if (Array.isArray(v)) return v.every(Array.isArray) ? v.map((e) => e.join("-")).join(",") : v.map((e) => (e === null ? "null" : e)).join(",");
    if (typeof v === "string" || typeof v === "number") return String(v);
    return undefined;
  }
  if (typeof init === "number") { const n = Number(v); return (typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(n))) ? n : undefined; }
  if (typeof init === "boolean") return typeof v === "boolean" ? v : undefined;
  if (Array.isArray(init)) return Array.isArray(v) ? clone(v) : undefined;
  if (init === null || init === undefined) return clone(v);
  if (typeof init === "object") return isObj(v) ? clone(v) : undefined;
  return undefined;
}
/* state name -> raw example value. Name similarity first, then the unused string/array example for input-looking strings. */
function assignStates(stateNames, example0) {
  const entries = exampleEntries(example0);
  const used = new Set();
  const map = {};
  const pairs = [];
  for (const s of stateNames) for (const e of entries) { const sc = stateMatchScore(s, e.key); if (sc) pairs.push({ s, e, sc }); }
  pairs.sort((a, b) => b.sc - a.sc);
  for (const { s, e } of pairs) {
    if (s in map || used.has(e.path)) continue;
    map[s] = e.value;
    used.add(e.path);
  }
  for (const s of stateNames) {
    if (s in map || !/input|text|str|data|ops|expr|source|values|nums|arr/i.test(s)) continue;
    const e = entries.find((x) => !used.has(x.path) && (Array.isArray(x.value) || typeof x.value === "string"));
    if (e) { map[s] = e.value; used.add(e.path); }
  }
  return map;
}
/* Ops-script string -> { head: [numbers], commands: [{op, key, value, args}] }. */
function parseOpsScript(str) {
  const lines = String(str).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const call = (l) => { const m = l.match(/^([A-Za-z_]\w*)\((.*)\)\s*;?$/); return m ? { op: m[1], args: m[2].split(",").map((a) => a.trim()).filter(Boolean).map((a) => (a !== "" && !Number.isNaN(Number(a)) ? Number(a) : a.replace(/^["']|["']$/g, ""))) } : null; };
  const parsed = lines.map(call);
  if (parsed.length < 2 || parsed.some((x) => !x)) return null;
  const head = parsed[0].args;
  const commands = parsed.slice(1).map(({ op, args }) => ({ op, key: args[0], value: args[1], args }));
  return { head, commands };
}

/* Returns [{ name, results }]: one entry per legacy generator (every innermost function that calls
 * setHistory/setSteps with a steps array), results = captured step arrays per candidate input. */
function extractLegacy(src, example0, legacyInput) {
  const ast = parseCode(src, "legacy.jsx");
  const found = new Map(); // fn start -> { fn, size }
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee;
      if (c.type !== "Identifier" || (c.name !== "setHistory" && c.name !== "setSteps")) return;
      const a = p.node.arguments[0];
      if (!a || ["ArrowFunctionExpression", "FunctionExpression", "NumericLiteral", "BooleanLiteral", "NullLiteral"].includes(a.type)) return;
      if (a.type === "ArrayExpression" && !a.elements.length) return;
      const fn = p.getFunctionParent();
      if (!fn) return;
      found.set(fn.node.start, { fn, size: fn.node.end - fn.node.start });
    },
  });
  if (!found.size) throw new Error("no setHistory/setSteps(<steps>) call found");

  const helpers = [];
  const importNames = new Set();
  for (const n of ast.program.body) {
    if (n.type === "ImportDeclaration") n.specifiers.forEach((s) => importNames.add(s.local.name));
  }
  for (const n of ast.program.body) {
    if (n.type === "ImportDeclaration" || n.type.startsWith("Export")) continue;
    let hasJsx = false;
    traverse(
      { type: "File", program: { type: "Program", body: [n], directives: [], sourceType: "module" } },
      { JSXElement() { hasJsx = true; }, JSXFragment() { hasJsx = true; } },
    );
    if (!hasJsx && src.slice(n.start, n.end).indexOf("useState") < 0) helpers.push(src.slice(n.start, n.end));
  }
  const noop = () => undefined;
  const permissive = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => "" : permissive()), apply: () => permissive() });
  const vals = Object.values(example0 || {});
  const wrapObj = (a) => (Array.isArray(a) ? a.map((value, id) => ({ value, id })) : a);
  const leafVals = exampleEntries(example0).filter((e) => !(isObj(e.value) && !Array.isArray(e.value))).map((e) => e.value);
  const candidates = legacyInput !== undefined
    ? [[legacyInput]]
    : [[vals[0]], [wrapObj(vals[0])], [example0], vals, vals.map(wrapObj)];
  if (legacyInput === undefined) {
    for (const v of vals) {
      const ops = typeof v === "string" ? parseOpsScript(v) : null;
      if (ops) candidates.push([...ops.head, ops.commands], [ops.commands], [v, ops.commands], [v]);
    }
    if (leafVals.length !== vals.length) candidates.push(leafVals);
    const numify = (v) => (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : v);
    candidates.push(vals.map(numify), leafVals.map(numify));
    candidates.push([]); // closure over component state (stubbed useState)
  }

  const gens = [];
  const errors = [];
  for (const { fn, size } of [...found.values()].sort((x, y) => x.fn.node.start - y.fn.node.start)) {
    let fnNode = fn.node;
    const wrap = fn.parentPath;
    if (wrap && wrap.isCallExpression() && wrap.node.callee.name === "useCallback") fnNode = wrap.node.arguments[0];
    const fnSrc = src.slice(fnNode.start, fnNode.end);
    const name = fnName(fn);
    // component scope: the outermost enclosing function (React component), minus JSX/effects
    let outer = null;
    for (let q = fn.parentPath; q; q = q.parentPath) if (q.isFunction()) outer = q;
    const scopeLines = [];
    const stateNames = [];
    if (outer && outer.node.body && outer.node.body.type === "BlockStatement") {
      for (const st of outer.node.body.body) {
        const text = src.slice(st.start, st.end);
        if (st.type === "FunctionDeclaration") { if (!nodeHasJsx(st)) scopeLines.push(text); continue; }
        if (st.type !== "VariableDeclaration" || st.declarations.length !== 1) continue;
        const d = st.declarations[0];
        const init = d.init;
        const hk = hookName(init);
        if (hk === "useState" && d.id.type === "ArrayPattern" && d.id.elements[0] && d.id.elements[0].type === "Identifier") {
          const sn = d.id.elements[0].name;
          stateNames.push(sn);
          const arg = init.arguments[0];
          scopeLines.push(`const [${sn}] = [__state(${JSON.stringify(sn)}, ${arg ? src.slice(arg.start, arg.end) : "undefined"}), __noop];`);
        } else if ((hk === "useCallback" || hk === "useMemo") && d.id.type === "Identifier" && init.arguments[0] && !nodeHasJsx(init.arguments[0])) {
          const a = src.slice(init.arguments[0].start, init.arguments[0].end);
          scopeLines.push(hk === "useCallback" ? `const ${d.id.name} = ${a};` : `let ${d.id.name}; try { ${d.id.name} = (${a})(); } catch (e) {}`);
        } else if (init && (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") && d.id.type === "Identifier" && !nodeHasJsx(init)) {
          scopeLines.push(`const ${d.id.name} = ${src.slice(init.start, init.end)};`);
        } else if (init && d.id.type === "Identifier" && !hk && !/\buse[A-Z]/.test(src.slice(init.start, init.end)) && !nodeHasJsx(init)) {
          // plain component-level constants (radius, center, ...); failures leave them undefined
          scopeLines.push(`let ${d.id.name}; try { ${d.id.name} = (${src.slice(init.start, init.end)}); } catch (e) {}`);
        }
      }
    }
    const stateRaw = assignStates(stateNames, example0);
    const captured = [];
    // The vm realm supplies its own Array/Object/Function/etc. Only two host functions cross the boundary and
    // both exchange JSON strings, so no host object (and no host Function constructor) is reachable from legacy code.
    const sandbox = {
      __hCap: (s) => { try { captured.push(JSON.parse(s)); } catch { /* not JSON-able */ } },
      __hState: (sn, init) => {
        if (!(sn in stateRaw)) return undefined;
        const c = coerceState(init, stateRaw[sn]);
        if (c === undefined) return undefined;
        try { return JSON.stringify(c); } catch { return undefined; }
      },
    };
    const script = `${helpers.join("\n")}\n;__out.gen = (function () {\n${scopeLines.join("\n")}\nreturn (${fnSrc});\n})();`;
    const setNames = [...new Set(script.match(/\bset[A-Z]\w*/g) || [])].filter((n) => n !== "setHistory" && n !== "setSteps");
    const prelude = `(function (g) {
      var hCap = g.__hCap, hState = g.__hState;
      delete g.__hCap; delete g.__hState;
      var noop = function () {};
      var permissive = function () { return new Proxy(function () {}, { get: function (t, k) { return k === Symbol.toPrimitive ? function () { return ""; } : permissive(); }, apply: function () { return permissive(); } }); };
      g.__out = {};
      g.__noop = noop;
      g.setHistory = g.setSteps = function (v) { var s; try { s = JSON.stringify(v); } catch (e) { return; } if (s !== undefined) hCap(s); };
      g.console = { log: noop, warn: noop, error: noop, info: noop };
      g.alert = noop; g.confirm = function () { return true; }; g.prompt = function () { return null; };
      g.setTimeout = g.setInterval = g.clearTimeout = g.clearInterval = g.requestAnimationFrame = noop;
      g.window = g; g.document = permissive(); g.localStorage = permissive();
      g.__state = function (sn, init) { var r = hState(sn, init); return r === undefined ? init : JSON.parse(r); };
      g.__call = function (s) { return g.__out.gen.apply(undefined, JSON.parse(s)); };
      ${JSON.stringify(setNames)}.forEach(function (n) { g[n] = noop; });
      ${JSON.stringify([...importNames])}.forEach(function (n) { g[n] = permissive(); });
    })(globalThis);`;
    const ctx = vm.createContext(sandbox);
    try {
      vm.runInContext(prelude, ctx, { timeout: 5000 });
      const compiled = transpile(script, "legacy-extract.js").replace(/^"use strict";?/, "");
      vm.runInContext(compiled, ctx, { timeout: 5000 });
    } catch (err) {
      errors.push(`${name || "(anonymous)"}: legacy helpers did not evaluate: ${err.message}`);
      continue;
    }
    const gen = vm.runInContext("typeof __out.gen", ctx);
    if (gen !== "function") { errors.push(`${name || "(anonymous)"}: generator did not evaluate to a function`); continue; }
    const results = [];
    const inputs = [];
    for (const args of candidates) {
      captured.length = 0;
      try {
        vm.runInContext(`__call(${JSON.stringify(JSON.stringify(args))})`, ctx, { timeout: 5000 });
      } catch (e) { if (process.env.CV_DEBUG) console.error("legacy call:", e.message);
        continue;
      }
      const steps = captured.filter((c) => Array.isArray(c) && c.length).pop();
      if (steps) { results.push(JSON.parse(JSON.stringify(steps))); inputs.push(describeArgs(args)); }
    }
    if (results.length) gens.push({ name, size, results, inputs });
    else errors.push(`${name || "(anonymous)"}: produced no steps for any guessed input (pass --legacy-input)`);
  }
  if (!gens.length) throw new Error(errors[0] || "legacy generator produced no steps for any guessed input (pass --legacy-input)");
  gens.errors = errors;
  return gens;
}

function describeArgs(args) {
  let t;
  try { t = JSON.stringify(args); } catch { t = String(args); }
  if (t === undefined) t = String(args);
  return `args=${t.length > 60 ? t.slice(0, 57) + "..." : t}`;
}

function stripFor(step, ignore) {
  if (Array.isArray(step)) return step.map((s) => stripFor(s, ignore));
  if (!isObj(step)) return step;
  const out = {};
  for (const [k, v] of Object.entries(step)) if (!ignore.has(k)) out[k] = stripFor(v, ignore);
  return out;
}

function firstDiff(a, b, p = "") {
  if (isDeepStrictEqual(a, b)) return null;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length && p === "") return `step count legacy ${a.length} vs new ${b.length}`;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const d = firstDiff(a[i], b[i], `${p}[${i}]`);
      if (d) return d;
    }
  }
  if (isObj(a) && isObj(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const d = firstDiff(a[k], b[k], `${p}.${k}`);
      if (d) return d;
    }
  }
  const f = (v) => { const s = JSON.stringify(v); return s === undefined ? "undefined" : s.length > 60 ? s.slice(0, 57) + "..." : s; };
  return `${p || "root"}: legacy ${f(a)} vs new ${f(b)}`;
}

const normName = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
function nameScore(legacyName, key, label) {
  const l = normName(legacyName);
  if (!l) return 0;
  let best = 0;
  for (const m of [normName(key), normName(label)]) {
    if (!m) continue;
    if (l.includes(m) || m.includes(l)) best = Math.max(best, 2);
    else for (const tok of String(m === normName(key) ? key : label).toLowerCase().split(/[^a-z0-9]+/)) if (tok.length > 2 && l.includes(tok)) best = Math.max(best, 1);
  }
  return best;
}

function checkParity(cfg, im, relFile, opts, entry) {
  let src;
  try {
    src = opts.legacyFile ? fs.readFileSync(opts.legacyFile, "utf8") : execFileSync("git", ["show", `${opts.rev}:${relFile}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 });
  } catch (err) {
    return { parity: "manual", ...MANUAL(`parity: "manual" - legacy source not available (${opts.legacyFile ? "unreadable" : `git show ${opts.rev}:${relFile} failed`})`) };
  }
  let gens;
  const ex0 = cfg.examples && cfg.examples[0] ? { ...im.defaultValues(cfg.inputs), ...cfg.examples[0].values } : {};
  try {
    gens = extractLegacy(src, ex0, opts.legacyInput);
  } catch (err) {
    return { parity: "manual", ...MANUAL(`parity: "manual" - legacy extraction failed: ${err.message}; route to strong review`) };
  }
  const multi = isObj(cfg.modes);
  const modeKeys = multi ? Object.keys(cfg.modes) : [null];
  const defKey = multi ? (cfg.modes[cfg.defaultMode] ? cfg.defaultMode : modeKeys[0]) : null;
  const renumber = opts.allowRenumber || /renumber/i.test(`${entry && entry.notes ? entry.notes : ""}`);
  const ignore = new Set(["msg", ...MSG_ALIASES, ...(renumber ? ["line"] : []), ...LAYOUT_KEYS, ...opts.ignore]);

  // new steps per mode on examples[0]
  const newSteps = {};
  const genErr = {};
  for (const k of modeKeys) {
    const spec = k === null ? cfg : cfg.modes[k];
    try {
      newSteps[k] = spec.generate(clone(cfg.parse(clone(ex0))));
    } catch (err) {
      genErr[k] = err.message;
    }
  }
  const stripped = (steps) => JSON.parse(JSON.stringify(stripFor(steps, ignore)));

  // pairing: single mode -> the largest legacy generator (old behaviour); modes -> name, then step count
  const pairs = new Map(); // mode key -> gen
  if (!multi) {
    pairs.set(null, gens.slice().sort((a, b) => b.size - a.size)[0]);
  } else {
    const used = new Set();
    const cand = [];
    for (const k of modeKeys) for (const g of gens) cand.push({ k, g, sc: nameScore(g.name, k, cfg.modes[k].label) });
    cand.filter((c) => c.sc > 0).sort((a, b) => b.sc - a.sc).forEach((c) => {
      if (pairs.has(c.k) || used.has(c.g)) return;
      pairs.set(c.k, c.g);
      used.add(c.g);
    });
    // step count on examples[0]
    for (const k of modeKeys) {
      if (pairs.has(k) || !newSteps[k]) continue;
      const g = gens.find((x) => !used.has(x) && x.results.some((r) => r.length === newSteps[k].length));
      if (g) { pairs.set(k, g); used.add(g); }
    }
    // a lone legacy generator with nothing else claiming it compares to the default mode
    if (gens.length === 1 && !used.size && !pairs.has(defKey)) pairs.set(defKey, gens[0]);
  }

  const perMode = [];
  for (const k of modeKeys) {
    const label = k === null ? "" : `[${k}] `;
    if (genErr[k] !== undefined) { perMode.push({ k, status: "FAIL", text: `${label}new generator threw on examples[0]: ${genErr[k]}` }); continue; }
    const g = pairs.get(k);
    if (!g) { perMode.push({ k, status: "MANUAL", text: `${label}no legacy generator matched this mode (legacy: ${gens.map((x) => x.name || "anonymous").join(", ")})` }); continue; }
    const nw = stripped(newSteps[k]);
    const diffs = [];
    let ok = false;
    let matched = "";
    for (const [ci, c] of g.results.entries()) {
      const d = firstDiff(stripFor(c, ignore), nw);
      if (!d) { ok = true; matched = g.inputs[ci]; break; }
      diffs.push(d);
    }
    const via = multi ? ` vs legacy ${g.name || "anonymous"}` : "";
    perMode.push(ok
      ? { k, status: "PASS", text: `${label}${newSteps[k].length} steps identical${via}, matched legacy input ${matched}` }
      : { k, status: "FAIL", text: `${label}legacy${via} differs: ${diffs[0]}` });
  }
  const anyFail = perMode.some((m) => m.status === "FAIL");
  const anyManual = perMode.some((m) => m.status === "MANUAL");
  const ign = `ignoring ${[...ignore].join(", ")}`;
  const detail = multi ? perMode.map((m) => `${m.status} ${m.text}`).join("; ") : perMode[0].text;
  const hint = anyFail && !renumber ? " (use --allow-renumber if lines changed)" : "";
  if (anyFail) return { parity: "fail", perMode, ...FAIL(`${detail}${hint}`) };
  if (anyManual) return { parity: "manual", perMode, ...MANUAL(`parity: "manual" - ${detail}; route to strong review`) };
  return { parity: "pass", perMode, ...PASS(`${detail} on examples[0] (${ign})`) };
}

/* Check 7 runs in a child process so a looping generate cannot hang the checker. */
function runExecutionChild(sb, timeoutMs) {
  try {
    const out = execFileSync(process.execPath, [fileURLToPath(import.meta.url), "--exec-child", sb.entry], { encoding: "utf8", timeout: timeoutMs, killSignal: "SIGKILL", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 });
    const line = out.trim().split("\n").pop();
    return JSON.parse(line);
  } catch (err) {
    if (err.code === "ETIMEDOUT" || err.signal === "SIGKILL" || err.signal === "SIGTERM") return FAIL(`timeout: execution exceeded ${timeoutMs} ms (generate/parse/map loops or is too slow)`);
    return FAIL(`harness error: ${String(err.stderr || err.message).split("\n").filter(Boolean).slice(-2).join(" ")}`);
  }
}
function execChild(entryPath) {
  const sb = { entry: entryPath, require: createRequire(entryPath) };
  const cfg = sb.require(entryPath).default;
  process.stdout.write("\n" + JSON.stringify(runExecution(cfg, sb, null)) + "\n");
}

/* ───────────────────── per-file driver ───────────────────── */
let manifestCache;
const loadManifest = () => (manifestCache ??= JSON.parse(fs.readFileSync(MANIFEST, "utf8")));

function checkFile(fileArg, opts) {
  const abs = path.resolve(process.cwd(), fileArg);
  const rel = path.relative(ROOT, abs).split(path.sep).join("/");
  const checks = [];
  const add = (id, name, r, extra = {}) => checks.push({ id, name, ...r, ...extra });
  const out = { file: rel, checks, parity: null };
  let code;
  try {
    code = fs.readFileSync(abs, "utf8");
  } catch (err) {
    add(1, "parse", FAIL(`cannot read file: ${err.message}`));
    return out;
  }
  // 10 first: an escalation file is not code
  const nonEmpty = code.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (nonEmpty.length === 1 && nonEmpty[0].startsWith("ESCALATE:")) {
    add(10, "escalation", R("ESCALATED", nonEmpty[0]));
    return out;
  }
  let ast;
  try {
    ast = parseCode(code, abs);
    add(1, "parse", PASS("parses (babel, jsx)"));
  } catch (err) {
    add(1, "parse", FAIL(err.message));
    return out;
  }
  let entry = null;
  if (!opts.noManifest) entry = loadManifest().files.find((f) => f.file === rel) || null;
  const trackC = opts.trackC || (entry && entry.track === "C");
  const s = staticChecks(ast, trackC);
  add(2, "imports", s.imports);
  add(3, "default export", s.defaultExport);
  add(4, "no view code", s.noViewCode);
  add(5, "no colour", s.noColour);

  let cfg = null;
  let sb = null;
  try {
  const staticOK = checks.every((c) => c.status === "PASS");
  let loadErr = null;
  if (s.defaultExport.status === "PASS" || opts.noManifest) {
    try {
      sb = null;
      sb = buildSandbox(abs, code);
      sb.require = createRequire(sb.entry);
      cfg = sb.require(sb.entry).default;
      if (!isObj(cfg)) throw new Error("default export is not a config object");
    } catch (err) {
      loadErr = err.message.split("\n")[0];
      cfg = null;
    }
  }
  if (opts.noManifest) add(6, "config shape", cfg ? checkConfigShape(cfg, null, true).status === "PASS" ? SKIP("--no-manifest: manifest rules skipped; required keys present") : checkConfigShape(cfg, null, true) : FAIL(loadErr || "config not loadable"));
  else if (!entry) add(6, "config shape", FAIL(`not in manifest (${rel}); use --no-manifest for ad-hoc files`));
  else if (!cfg) add(6, "config shape", FAIL(loadErr ? `config not loadable: ${loadErr}` : "no config (check 3 failed)"));
  else add(6, "config shape", checkConfigShape(cfg, entry, false));

  if (!cfg) add(7, "execution", FAIL(loadErr ? `config not loadable: ${loadErr}` : "not run: no valid defineVisualizer config"));
  else if (!Array.isArray(cfg.inputs) || typeof cfg.parse !== "function") add(7, "execution", FAIL("not run: inputs/parse missing"));
  else {
    try {
      add(7, "execution", runExecutionChild(sb, opts.timeoutMs || 20000));
    } catch (err) {
      add(7, "execution", FAIL(`harness error: ${err.message}`));
    }
  }

  const track = opts.track || (entry && entry.track);
  const c7 = checks.find((c) => c.id === 7);
  if (opts.skipParity || ["B", "D", "alias"].includes(track)) {
    out.parity = "skip";
    add(8, "parity", SKIP(`parity: hand-verified (${opts.skipParity ? "--skip-parity" : `manifest track ${track}`})`));
  } else if (!cfg || !Array.isArray(cfg.inputs) || typeof cfg.parse !== "function") add(8, "parity", MANUAL("not run: no executable config"));
  else if (c7 && c7.status === "FAIL" && /^timeout/.test(c7.reason)) add(8, "parity", MANUAL("not run: check 7 timed out"));
  else {
    const im = sb.require("../inputModel.js");
    try {
      const pr = checkParity(cfg, im, rel, opts, entry);
      out.parity = pr.parity;
      add(8, "parity", { status: pr.status, reason: pr.reason });
    } catch (err) {
      out.parity = "manual";
      add(8, "parity", MANUAL(`parity: "manual" - ${err.message}`));
    }
  }
  add(9, "build", MANUAL("build: run by orchestrator"));
  add(10, "escalation", PASS("no ESCALATE: line"));
  void staticOK;
  return out;
  } finally {
    if (sb) fs.rmSync(sb.tmp, { recursive: true, force: true });
  }
}

/* ───────────────────── CLI ───────────────────── */
function main(argv) {
  const opts = { rev: "viz-legacy", ignore: [], files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = argv[++i];
    else if (a === "--rev") opts.rev = argv[++i];
    else if (a === "--legacy-file") opts.legacyFile = path.resolve(argv[++i]);
    else if (a === "--legacy-input") opts.legacyInput = JSON.parse(argv[++i]);
    else if (a === "--allow-renumber") opts.allowRenumber = true;
    else if (a === "--ignore") opts.ignore = argv[++i].split(",");
    else if (a === "--no-manifest") opts.noManifest = true;
    else if (a === "--skip-parity") opts.skipParity = true;
    else if (a === "--track") opts.track = argv[++i];
    else if (a === "--timeout-ms") opts.timeoutMs = Number(argv[++i]);
    else if (a === "--exec-child") {
      execChild(argv[++i]);
      return 0;
    } else if (a === "--track-c") opts.trackC = true;
    else if (a === "-h" || a === "--help") {
      console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n\/\*\*?/, ""));
      return 0;
    } else opts.files.push(a);
  }
  if (!opts.files.length) {
    console.error("usage: node scripts/check-visualizer.mjs [options] <file...>  (see --help)");
    return 2;
  }
  const results = opts.files.map((f) => checkFile(f, opts));
  let failed = 0;
  for (const r of results) {
    console.log(r.file);
    for (const c of r.checks) console.log(`  ${String(c.id).padStart(2)} ${c.name.padEnd(13)} ${c.status.padEnd(9)} ${c.reason}`);
    const bad = r.checks.filter((c) => c.status === "FAIL" || c.status === "ESCALATED");
    r.ok = !bad.length;
    if (bad.length) failed += 1;
    r.summary = bad.length ? `FAIL (${bad.map((c) => c.id).join(",")})` : "OK";
    console.log(`  => ${r.summary}${r.parity === "manual" ? "  [parity: manual -> strong review]" : ""}`);
  }
  console.log(`\n${results.length} file(s): ${results.length - failed} ok, ${failed} failed`);
  if (opts.json) fs.writeFileSync(opts.json, JSON.stringify({ rev: opts.rev, results }, null, 2));
  return failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
export { checkFile, validateShape, firstDiff, extractLegacy };
