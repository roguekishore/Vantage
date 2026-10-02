#!/usr/bin/env node
/**
 * WCAG 2.x contrast check for the design tokens (POLISH_PLAN §3.1, §3.2).
 *
 *   node scripts/contrast.mjs          (run from reactapp/)
 *
 * Parses src/styles/tokens.css (dark block `:root, html.dark`, light block
 * `html.light`), composites translucent text tokens (rgba) over each
 * background, and prints the ratio for every text pair that matters:
 *
 *   fg, fg-muted, fg-dim, accent-ink, ok, warn, err, info, viz-write
 *     on bg, surface, elevated
 *   on-accent on accent
 *   ok, warn, err, info on their own *-soft tint (ds Badge), over surface
 *
 * Exits 1 if any pair is below 4.5:1. A failing token value is never
 * changed here: the output names the token and the spec section it comes
 * from so the owner can decide.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MIN = 4.5;
const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(here, "../src/styles/tokens.css");
const css = readFileSync(tokensPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Collect `--name: value;` declarations from the first block whose selector matches. */
function block(selectorRe) {
  const m = css.match(new RegExp(selectorRe.source + String.raw`\s*\{([^}]*)\}`));
  if (!m) throw new Error(`tokens.css: block ${selectorRe} not found`);
  const vars = {};
  for (const [, name, value] of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[name] = value.trim();
  return vars;
}

function parseColor(raw, name) {
  const v = raw.trim();
  let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  m = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?)\s*)?\)$/i);
  if (m) {
    let a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  throw new Error(`tokens.css: cannot parse --${name}: ${raw}`);
}

const over = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});

const channel = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Where each token value is specified (for the failure note).
const SPEC = { "viz-write": "§3.2" };
const specOf = (token) => SPEC[token] || "§3.1";

const TEXT = ["fg", "fg-muted", "fg-dim", "accent-ink", "ok", "warn", "err", "info", "viz-write"];
const BACKS = ["bg", "surface", "elevated"];
const STATUS = ["ok", "warn", "err", "info"];

const dark = block(/:root,\s*html\.dark/);
const themes = { dark, light: { ...dark, ...block(/html\.light/) } };

const rows = [];
for (const [theme, vars] of Object.entries(themes)) {
  const color = (name) => {
    if (!(name in vars)) throw new Error(`tokens.css: --${name} missing in ${theme}`);
    return parseColor(vars[name], name);
  };
  const add = (text, back, backColor, label = `${text} on ${back}`) => {
    const r = ratio(over(color(text), backColor), backColor);
    rows.push({ theme, pair: label, text, ratio: r, pass: r >= MIN });
  };
  for (const back of BACKS) {
    const b = color(back);
    if (b.a !== 1) throw new Error(`--${back} must be opaque`);
    for (const text of TEXT) add(text, back, b);
  }
  add("on-accent", "accent", color("accent"));
  const surface = color("surface");
  for (const s of STATUS) add(s, `${s}-soft`, over(color(`${s}-soft`), surface), `${s} on ${s}-soft/surface`);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`Contrast (WCAG 2.x) from ${tokensPath.replace(process.cwd() + "/", "")}, minimum ${MIN}:1\n`);
console.log(`${pad("theme", 7)}${pad("pair", 30)}${pad("ratio", 9)}result`);
console.log("-".repeat(54));
for (const r of rows) {
  console.log(`${pad(r.theme, 7)}${pad(r.pair, 30)}${pad(r.ratio.toFixed(2), 9)}${r.pass ? "pass" : "FAIL"}`);
}

const fails = rows.filter((r) => !r.pass);
const min = rows.reduce((m, r) => (r.ratio < m.ratio ? r : m));
console.log(
  `\nSummary: ${rows.length - fails.length}/${rows.length} pairs pass; lowest ${min.ratio.toFixed(2)}:1 (${min.theme} ${min.pair}).`
);
if (fails.length) {
  console.log("\nFailures (token values NOT changed; owner decision needed):");
  for (const f of fails) {
    console.log(
      `  ${f.theme} ${f.pair}: ${f.ratio.toFixed(2)}:1 < ${MIN}:1. --${f.text} = ${themes[f.theme][f.text]} is the POLISH_PLAN ${specOf(f.text)} value.`
    );
  }

  // Smallest change that would pass every pair the token appears in
  // (informational only; nothing is written).
  console.log("\nNearest passing values (suggestion only):");
  const seen = new Set();
  for (const f of fails) {
    const key = `${f.theme}:${f.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const vars = themes[f.theme];
    const base = parseColor(vars[f.text], f.text);
    const backs = rows
      .filter((r) => r.theme === f.theme && r.text === f.text)
      .map((r) => {
        const back = r.pair.split(" on ")[1];
        if (back.includes("/")) return over(parseColor(vars[back.split("/")[0]], back), parseColor(vars.surface, "surface"));
        return parseColor(vars[back], back);
      });
    const passesAll = (c) => backs.every((b) => ratio(over(c, b), b) >= MIN);
    let suggestion = "none found";
    if (base.a < 1) {
      for (let a = Math.round(base.a * 100); a <= 100; a++) {
        if (passesAll({ ...base, a: a / 100 })) {
          suggestion = `rgba(${base.r},${base.g},${base.b},${(a / 100).toFixed(2).replace(/^0/, "")})`;
          break;
        }
      }
    } else {
      // Darken (light theme) or lighten (dark theme) in 1% steps.
      const target = f.theme === "light" ? 0 : 255;
      for (let step = 1; step <= 100; step++) {
        const t = step / 100;
        const c = {
          r: Math.round(base.r + (target - base.r) * t),
          g: Math.round(base.g + (target - base.g) * t),
          b: Math.round(base.b + (target - base.b) * t),
          a: 1,
        };
        if (passesAll(c)) {
          suggestion = "#" + [c.r, c.g, c.b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
          break;
        }
      }
    }
    console.log(`  ${f.theme} --${f.text}: ${vars[f.text]} -> ${suggestion}`);
  }
  process.exit(1);
}
