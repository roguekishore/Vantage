#!/usr/bin/env node
/*
 * Route smoke (POLISH_PLAN §7 Phase 1). Headless Playwright, no screenshots.
 *
 * Serves a production build with an SPA fallback, derives every route from
 * source (src/App.jsx, src/routes/index.jsx, src/routes/config.js) and visits
 * each route in each theme at 1280x800, asserting:
 *   - no `pageerror` (uncaught exception / unhandled rejection)
 *   - <html> carries the theme class (`dark` / `light`)
 *   - a visible <h1> with width > 0
 *   - visualizer routes contain `[data-legacy-viz]` or `[data-viz-stage]`
 *
 * Usage: node scripts/route-smoke.mjs [--build build] [--routes <substring>]
 *          [--themes dark,light] [--json <path>] [--concurrency 8]
 * Env:   PLAYWRIGHT_PATH  module path/dir to import instead of `playwright`.
 * Exit:  1 on any failed check (or if fewer than 130 visualizer routes found).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIN_VISUALIZERS = 130;
const VIEWPORT = { width: 1280, height: 800 };
const CHECK_TIMEOUT = 15000;
const IDLE_TIMEOUT = 1500;
const SETTLE_TIMEOUT = 2000; // grace for lazy chunks to render after idle
const PARAMS = { problemId: "1", battleId: "1", roomCode: "ABC123" };

// ---------- args ----------
function parseArgs(argv) {
  const opts = { build: "build", routes: null, themes: ["dark", "light"], json: null, concurrency: 8 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`missing value for ${a}`);
      return v;
    };
    if (a === "--build") opts.build = next();
    else if (a === "--routes") opts.routes = next();
    else if (a === "--themes") opts.themes = next().split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--json") opts.json = next();
    else if (a === "--concurrency") opts.concurrency = Math.max(1, Number(next()) || 8);
    else if (a === "-h" || a === "--help") {
      console.log("node scripts/route-smoke.mjs [--build dir] [--routes substr] [--themes dark,light] [--json path] [--concurrency n]");
      process.exit(0);
    } else throw new Error(`unknown argument: ${a}`);
  }
  for (const t of opts.themes) if (t !== "dark" && t !== "light") throw new Error(`unknown theme: ${t}`);
  return opts;
}

// ---------- route discovery ----------
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function topicPaths(configSrc) {
  // `key: { ... path: "/x", ... }` — topic blocks have no nested braces.
  const map = {};
  const re = /(\w+)\s*:\s*\{[^{}]*?\bpath\s*:\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(configSrc))) map[m[1]] = m[2];
  return map;
}

function localAliases(indexSrc) {
  // `const { sorting, foo: bar } = topicConfig;` -> { sorting: "sorting", bar: "foo" }
  const aliases = {};
  const re = /const\s*\{([^}]*)\}\s*=\s*topicConfig\b/g;
  let m;
  while ((m = re.exec(indexSrc))) {
    for (const part of m[1].split(",")) {
      const p = part.trim();
      if (!p) continue;
      const [key, local] = p.split(":").map((s) => s.trim());
      aliases[local || key] = key;
    }
  }
  return aliases;
}

function substitute(route) {
  return route.replace(/:(\w+)\??/g, (_, name) => PARAMS[name] ?? "1");
}

function discoverRoutes() {
  const appSrc = read("src/App.jsx");
  const indexSrc = read("src/routes/index.jsx");
  const topics = topicPaths(read("src/routes/config.js"));
  const aliases = localAliases(indexSrc);
  const resolveTopic = (expr) => {
    // `sorting.path` or `topicConfig.sorting.path`
    const m = /^(?:topicConfig\s*\.\s*)?(\w+)\s*\.\s*path$/.exec(expr.trim());
    if (!m) return null;
    const key = expr.trim().startsWith("topicConfig") ? m[1] : aliases[m[1]] ?? m[1];
    return topics[key] ?? null;
  };

  const found = new Map(); // url -> { route, kind, source }
  const unresolved = [];
  const add = (route, kind, source) => {
    if (!route || route.includes("*")) return;
    const url = substitute(route);
    if (!found.has(url)) found.set(url, { route: url, pattern: route, kind, source });
  };

  for (const [src, file] of [[appSrc, "App.jsx"], [indexSrc, "routes/index.jsx"]]) {
    // path="..." / path='...'
    for (const m of src.matchAll(/\bpath\s*=\s*"([^"]*)"|\bpath\s*=\s*'([^']*)'/g)) {
      add(m[1] ?? m[2], "page", file);
    }
    // path={`${x.path}/Name`}
    for (const m of src.matchAll(/\bpath\s*=\s*\{\s*`\$\{([^}]+)\}([^`]*)`\s*\}/g)) {
      const base = resolveTopic(m[1]);
      if (base == null) { unresolved.push(`${file}: ${m[0]}`); continue; }
      add(base + m[2], m[2] && m[2] !== "/" ? "visualizer" : "topic", file);
    }
    // path={x.path} / path={topicConfig.x.path}
    for (const m of src.matchAll(/\bpath\s*=\s*\{\s*([\w.\s]+?)\s*\}/g)) {
      const base = resolveTopic(m[1]);
      if (base == null) { unresolved.push(`${file}: ${m[0]}`); continue; }
      add(base, "topic", file);
    }
  }
  return { routes: [...found.values()], unresolved };
}

// ---------- static server ----------
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".map": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".mp4": "video/mp4", ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8", ".wasm": "application/wasm",
};

function serve(buildDir) {
  const indexHtml = path.join(buildDir, "index.html");
  const server = http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    let file = path.join(buildDir, path.normalize(pathname));
    if (!file.startsWith(buildDir)) { res.writeHead(403).end(); return; }
    let stat = null;
    try { stat = fs.statSync(file); } catch {}
    if (stat?.isDirectory()) {
      file = path.join(file, "index.html");
      try { stat = fs.statSync(file); } catch { stat = null; }
    }
    if (!stat?.isFile()) {
      // SPA fallback for route-like paths; real 404 for missing assets.
      if (path.extname(pathname) && !pathname.endsWith(".html")) { res.writeHead(404).end(); return; }
      file = indexHtml;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

// ---------- playwright ----------
async function loadChromium() {
  const override = process.env.PLAYWRIGHT_PATH;
  let spec = "playwright";
  if (override) {
    let p = path.resolve(override);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      const mjs = path.join(p, "index.mjs");
      p = fs.existsSync(mjs) ? mjs : path.join(p, "index.js");
    }
    spec = pathToFileURL(p).href;
  }
  const mod = await import(spec);
  const chromium = mod.chromium ?? mod.default?.chromium;
  if (!chromium) throw new Error(`no chromium export in ${spec}`);
  return chromium;
}

// Runs in the page: returns the list of failed assertions.
function pageProbe({ theme, isViz }) {
  const out = [];
  const html = document.documentElement;
  if (!html.classList.contains(theme)) out.push(`no-theme-class (html class="${html.className}")`);
  const h1s = [...document.querySelectorAll("h1")];
  const visible = h1s.some((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) !== 0;
  });
  if (!visible) out.push(h1s.length ? `h1-not-visible (${h1s.length} h1)` : "no-h1");
  if (isViz && !document.querySelector("[data-legacy-viz], [data-viz-stage]")) out.push("no-viz-root");
  return out;
}

async function runCheck(browser, base, entry, theme) {
  const started = Date.now();
  const result = { route: entry.route, theme, kind: entry.kind, ok: false, reasons: [], finalUrl: null, ms: 0 };
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
  const pageErrors = [];
  let timer;
  try {
    await context.addInitScript((t) => {
      try { localStorage.setItem("vantage-theme", t); } catch {}
    }, theme);
    const page = await context.newPage();
    page.on("pageerror", (err) => pageErrors.push(String(err?.message ?? err).split("\n")[0]));
    const work = (async () => {
      await page.goto(base + entry.route, { waitUntil: "load", timeout: CHECK_TIMEOUT });
      await page.waitForLoadState("networkidle", { timeout: IDLE_TIMEOUT }).catch(() => {});
      const arg = { theme, isViz: entry.kind === "visualizer" };
      await page.waitForFunction((a) => {
        const html = document.documentElement;
        if (!html.classList.contains(a.theme)) return false;
        if (a.isViz && !document.querySelector("[data-legacy-viz], [data-viz-stage]")) return false;
        return [...document.querySelectorAll("h1")].some((el) => el.getBoundingClientRect().width > 0);
      }, arg, { timeout: SETTLE_TIMEOUT, polling: 100 }).catch(() => {});
      result.finalUrl = page.url().replace(base, "");
      return page.evaluate(pageProbe, arg);
    })();
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout after ${CHECK_TIMEOUT}ms`)), CHECK_TIMEOUT);
    });
    const failed = await Promise.race([work, timeout]);
    result.reasons.push(...failed);
  } catch (err) {
    result.reasons.push(`error: ${String(err?.message ?? err).split("\n")[0]}`);
  } finally {
    clearTimeout(timer);
    for (const e of pageErrors) result.reasons.unshift(`pageerror: ${e}`);
    await context.close().catch(() => {});
  }
  result.ok = result.reasons.length === 0;
  result.ms = Date.now() - started;
  return result;
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ---------- main ----------
async function main() {
  const t0 = Date.now();
  const opts = parseArgs(process.argv.slice(2));
  const buildDir = path.resolve(ROOT, opts.build);
  if (!fs.existsSync(path.join(buildDir, "index.html"))) {
    console.error(`route-smoke: no index.html in ${buildDir} (build first or pass --build <dir>)`);
    process.exit(1);
  }

  const { routes: all, unresolved } = discoverRoutes();
  const counts = all.reduce((acc, r) => ((acc[r.kind] = (acc[r.kind] || 0) + 1), acc), {});
  console.log(`route-smoke: ${all.length} routes (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")})`);
  for (const u of unresolved) console.log(`route-smoke: unresolved path expression ${u}`);
  if ((counts.visualizer || 0) < MIN_VISUALIZERS) {
    console.error(`route-smoke: only ${counts.visualizer || 0} visualizer routes found (expected >= ${MIN_VISUALIZERS}); route parsing is broken`);
    process.exit(1);
  }

  const routes = opts.routes ? all.filter((r) => r.route.includes(opts.routes)) : all;
  const checks = routes.flatMap((r) => opts.themes.map((theme) => ({ entry: r, theme })));
  if (!checks.length) {
    console.error(`route-smoke: no routes match "${opts.routes}"`);
    process.exit(1);
  }

  const server = await serve(buildDir);
  const base = `http://127.0.0.1:${server.address().port}`;
  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  let results;
  try {
    results = await pool(checks, opts.concurrency, ({ entry, theme }) => runCheck(browser, base, entry, theme));
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of failed) console.log(`${r.route} ${r.theme} ${r.reasons.join("; ")}`);
  const durationMs = Date.now() - t0;
  console.log(`route-smoke: ${results.length - failed.length} passed, ${failed.length} failed of ${results.length} checks (${(durationMs / 1000).toFixed(1)}s)`);

  if (opts.json) {
    const out = path.resolve(process.cwd(), opts.json);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({
      build: buildDir, themes: opts.themes, filter: opts.routes, durationMs, routeCounts: counts,
      passed: results.length - failed.length, failed: failed.length, total: results.length, checks: results,
    }, null, 2));
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(`route-smoke: ${err?.stack ?? err}`);
  process.exit(1);
});
