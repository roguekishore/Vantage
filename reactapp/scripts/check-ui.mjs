#!/usr/bin/env node
/**
 * check-ui.mjs - design-system enforcement.
 *
 *   node scripts/check-ui.mjs [paths...] [--strict] [--json <file>]
 *
 * Warning mode by default: always exits 0. `--strict` exits 1 on any violation.
 * Scans src/** (js, jsx, ts, tsx, css). Skips src/pages/algorithms/** in this run.
 * Fully allow-listed: src/styles/tokens.css, src/components/ds/**, src/lib/canvasTheme.js.
 *
 * Visual-effect rules (gradient, shadow, loop) are allowed only in visual modules
 * (components/animations, components/signature, components/ui/globe.jsx, src/map) or on a
 * line carrying `ui-allow: visual`. Every allowed exception is printed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");
const SRC = path.join(ROOT, "src");
const EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".css"]);

const FULL_ALLOW = [
  "src/styles/tokens.css",
  "src/components/ds/",
  "src/lib/canvasTheme.js",
];
const SKIP = ["src/pages/algorithms/"];
const VISUAL = [
  "src/components/animations/",
  "src/components/signature/",
  "src/components/ui/globe.jsx",
  "src/map/",
];
const VISUAL_RULES = new Set(["gradient", "shadow", "loop"]);

const startsWithAny = (rel, list) => list.some((p) => rel === p || rel.startsWith(p));

/** Replace comments with spaces (keeps line numbers and columns). */
export function stripComments(text, isCss) {
  let out = "";
  let i = 0;
  let q = null; // quote char
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (q) {
      out += c;
      if (c === "\\" && !isCss) { out += d ?? ""; i += 2; continue; }
      if (c === q) q = null;
      else if (c === "\n" && q !== "`") q = null;
      i++;
      continue;
    }
    if (c === "/" && d === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
      continue;
    }
    if (!isCss && c === "/" && d === "/" && text[i - 1] !== ":") {
      let stop = text.indexOf("\n", i);
      if (stop === -1) stop = n;
      out += " ".repeat(stop - i);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'" || (c === "`" && !isCss)) q = c;
    out += c;
    i++;
  }
  return out;
}

const RULES = [
  { id: "color", re: /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?)\(\s*[\d.]/g,
    ok: (line, m) => !/^#[0-9a-fA-F]{3,4}$/.test(m[0]) || /['"`(:\s,]#/.test(line) },
  { id: "radius", re: /(?<![\w-])rounded(?:-(?!none(?![\w-]))[\w\[\]\/.%-]+)?(?![\w-])|\bborderRadius\s*:\s*(?!0\b|['"`]?0(?:px)?['"`]?\s*[,}\n])|border-radius\s*:\s*(?!0(?:px)?\s*(?:[;!}]|$)|none)/g,
    ok: (line, m) => !(m[0] === "rounded" && !/className|class=|cn\(|clsx|["'`]/.test(line)) },
  { id: "gradient", re: /\bbg-gradient[\w-]*|\b(?:linear|radial|conic)-gradient\s*\(/g },
  { id: "shadow", re: /\b(?:boxShadow|textShadow|box-shadow|text-shadow|backdropFilter|backdrop-filter|shadowBlur|shadowColor)\b|(?<![\w.$-])(?:[a-z0-9-]+:)*(?:backdrop-blur|drop-shadow)(?:-[\w\[\]]+)?|(?<![\w.$-])(?:[a-z0-9-]+:)*shadow-(?!none(?![\w-]))[\w\[\]\/.,()%#-]+|(?<=["'`\s])shadow(?=["'`\s])/g,
    ok: (line, m) => m[0] !== "shadow" || /className|class=|cn\(|clsx/.test(line) },
  { id: "loop", re: /\banimate-(?:pulse|spin|ping|bounce)\b|\banimation(?:-iteration-count)?\s*:[^;\n]*\binfinite\b|\brepeat\s*:\s*-1\b|\binfinite\b(?=\s*[;'"`,}])/g },
  { id: "font-size", re: null }, // custom
  { id: "cursor-none", re: /\bcursor-none\b|\bcursor\s*:\s*['"`]?none\b/g },
  { id: "banned-import", re: /(?:from\s*|import\s*\(?\s*|require\(\s*)['"](?:@mui[^'"]*|framer-motion|motion\/react|motion|react-icons[^'"]*|@tabler[^'"]*)['"]/g },
  { id: "font-weight-900", re: /\bfontWeight\s*:\s*['"`]?900\b|\bfont-black\b|\bfont-weight\s*:\s*900\b/g,
    ok: (line) => !/monument|font-display/i.test(line) },
  { id: "emoji", re: /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu, noCss: true },
];

function fontSizeHits(line) {
  const hits = [];
  const px = (v) => parseFloat(v);
  let m;
  const a = /\bfontSize\s*:\s*['"`]?(\d+(?:\.\d+)?)(px|rem|em)?['"`]?/g;
  while ((m = a.exec(line))) {
    const v = m[2] === "rem" || m[2] === "em" ? px(m[1]) * 16 : px(m[1]);
    if (v > 0 && v < 10) hits.push(m[0]);
  }
  const b = /\bfont-size\s*:\s*(\d+(?:\.\d+)?)(px|rem|em)/g;
  while ((m = b.exec(line))) {
    const v = m[2] === "px" ? px(m[1]) : px(m[1]) * 16;
    if (v > 0 && v < 10) hits.push(m[0]);
  }
  const c = /(?<![\w-])text-\[(\d+(?:\.\d+)?)(px|rem|em)\]/g;
  while ((m = c.exec(line))) {
    const v = m[2] === "px" ? px(m[1]) : px(m[1]) * 16;
    if (v > 0 && v < 10) hits.push(m[0]);
  }
  const d = /\bfont\s*=\s*[`'"][^`'"\n]*?(?<![\d.])(\d+(?:\.\d+)?)px/g;
  while ((m = d.exec(line))) if (px(m[1]) < 10 && px(m[1]) > 0) hits.push(m[0]);
  return hits;
}

/** Scan one file's text. Returns { violations, allowed }. */
export function scanText(rel, text) {
  const isCss = rel.endsWith(".css");
  const rawLines = text.split("\n");
  const lines = stripComments(text, isCss).split("\n");
  const visualModule = startsWithAny(rel, VISUAL);
  const violations = [];
  const allowed = [];
  const isPage = rel.startsWith("src/pages/") && /\.(jsx|tsx)$/.test(rel);
  let h1Count = 0;

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (!line.trim()) return;
    const marked = /ui-allow:\s*visual/.test(rawLines[idx]);
    const near = [rawLines[idx - 2], rawLines[idx - 1], rawLines[idx]].join("\n");
    const push = (rule, match) => {
      if (VISUAL_RULES.has(rule) && (visualModule || marked)) {
        allowed.push({ file: rel, line: lineNo, rule, match, reason: visualModule ? "visual module" : "ui-allow: visual" });
      } else if (rule === "radius" && /data-shape\s*=\s*["{']*round/.test(near)) {
        allowed.push({ file: rel, line: lineNo, rule, match, reason: 'data-shape="round"' });
      } else {
        violations.push({ file: rel, line: lineNo, rule, match });
      }
    };
    for (const r of RULES) {
      if (r.noCss && isCss) continue;
      if (r.id === "font-size") {
        for (const h of fontSizeHits(line)) push("font-size", h);
        continue;
      }
      r.re.lastIndex = 0;
      let m;
      while ((m = r.re.exec(line))) {
        if (m[0] === "") { r.re.lastIndex++; continue; }
        if (r.ok && !r.ok(line, m)) continue;
        push(r.id, m[0].trim());
      }
    }
    if (isPage) {
      const hm = line.match(/<h1(?![\w-])/g);
      if (hm) {
        h1Count += hm.length;
        if (h1Count > 1) push("multiple-h1", "<h1>");
      }
    }
  });
  return { violations, allowed };
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      walk(p, out);
    } else if (EXTS.has(path.extname(e.name)) && !/\.(test|spec)\.[jt]sx?$/.test(e.name)) out.push(p);
  }
}

export function collectFiles(targets) {
  const files = [];
  for (const t of targets.length ? targets : [SRC]) {
    const abs = path.resolve(t);
    if (!fs.existsSync(abs)) { console.error(`check-ui: path not found: ${t}`); continue; }
    if (fs.statSync(abs).isDirectory()) walk(abs, files);
    else files.push(abs);
  }
  return [...new Set(files)]
    .map((abs) => ({ abs, rel: path.relative(ROOT, abs).split(path.sep).join("/") }))
    .filter(({ rel }) => rel.startsWith("src/") && !startsWithAny(rel, FULL_ALLOW) && !startsWithAny(rel, SKIP))
    .sort((a, b) => a.rel.localeCompare(b.rel));
}

function tally(items, key) {
  const m = new Map();
  for (const it of items) m.set(it[key], (m.get(it[key]) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  let jsonOut = null;
  const targets = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--strict") continue;
    if (argv[i] === "--json") { jsonOut = argv[++i]; continue; }
    targets.push(argv[i]);
  }
  const files = collectFiles(targets);
  const violations = [];
  const allowed = [];
  for (const f of files) {
    const r = scanText(f.rel, fs.readFileSync(f.abs, "utf8"));
    violations.push(...r.violations);
    allowed.push(...r.allowed);
  }
  const byRule = tally(violations, "rule");
  const byFile = tally(violations, "file");

  console.log(`check-ui: ${files.length} files scanned (${strict ? "strict" : "warning mode"})\n`);
  console.log("Violations by rule");
  byRule.forEach(([k, v]) => console.log(`  ${String(v).padStart(6)}  ${k}`));
  console.log("\nViolations by file");
  byFile.forEach(([k, v]) => console.log(`  ${String(v).padStart(6)}  ${k}`));
  console.log(`\nTOTAL violations: ${violations.length} in ${byFile.length} files`);
  console.log(`\nAllowed exceptions (${allowed.length})`);
  allowed.forEach((a) => console.log(`  ${a.file}:${a.line}  ${a.rule}  [${a.reason}]  ${a.match}`));

  if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify({
      total: violations.length,
      byRule: Object.fromEntries(byRule),
      byFile: Object.fromEntries(byFile),
      violations,
      allowed,
    }, null, 2));
  }
  process.exit(strict && violations.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
