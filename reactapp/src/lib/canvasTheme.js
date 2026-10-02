/* ==========================================================================
   canvasTheme: token access for non-React code (POLISH_PLAN §3.9)

   Canvas draw loops, Monaco and other imperative code read colours here
   instead of hard-coding them. Values come from the CSS custom properties in
   src/styles/tokens.css via getComputedStyle(document.documentElement).

   - Reads happen at call time. The cache is keyed on <html>'s class string,
     so a theme toggle (ThemeProvider swaps `dark` / `light`) is picked up by
     the very next call, i.e. within the current or next frame, without a
     remount.
   - rgba('fg', 0.4)   -> "rgba(245,245,244,0.4)" built from --fg-rgb
     rgba('#f59e0b', 1) -> hex still works, for legacy per-algorithm colours
     cssVar('--accent') -> "#EDFF66" (trimmed computed value)

   This file is on the check-ui allow-list for colour literals: the fallback
   table below mirrors the dark tokens and is only used before tokens.css has
   applied (or in jsdom, which does not resolve custom properties).
   ========================================================================== */

/* Tokens with an `--*-rgb` channel triplet in tokens.css. */
export const RGB_TOKENS = [
  "bg", "surface", "elevated", "fg",
  "accent", "on-accent", "accent-edge", "accent-ink", "focus",
  "ok", "warn", "err", "info", "viz-write",
];

/* Every colour token exposed to canvas / Monaco code. */
export const COLOR_TOKENS = [
  "bg", "surface", "elevated", "border", "border-strong",
  "fg", "fg-muted", "fg-dim",
  "accent", "on-accent", "accent-edge", "accent-ink", "accent-soft", "focus",
  "ok", "warn", "err", "info",
  "ok-soft", "warn-soft", "err-soft", "info-soft",
  "viz-write", "backdrop",
];

/* Dark-theme fallbacks (mirror of tokens.css `:root, html.dark`). */
const FALLBACK = {
  "--bg": "#09090B",
  "--surface": "#0F0F12",
  "--elevated": "#16161A",
  "--border": "rgba(255,255,255,.10)",
  "--border-strong": "rgba(255,255,255,.22)",
  "--fg": "#F5F5F4",
  "--fg-muted": "rgba(255,255,255,.66)",
  "--fg-dim": "rgba(255,255,255,.52)",
  "--accent": "#EDFF66",
  "--on-accent": "#09090B",
  "--accent-edge": "#EDFF66",
  "--accent-ink": "#EDFF66",
  "--accent-soft": "rgba(237,255,102,.12)",
  "--focus": "#EDFF66",
  "--ok": "#34D399",
  "--warn": "#FBBF24",
  "--err": "#F87171",
  "--info": "#67E8F9",
  "--ok-soft": "rgba(52,211,153,.14)",
  "--warn-soft": "rgba(251,191,36,.14)",
  "--err-soft": "rgba(248,113,113,.14)",
  "--info-soft": "rgba(103,232,249,.14)",
  "--viz-write": "#C4B5FD",
  "--backdrop": "rgba(0,0,0,.6)",
  "--bg-rgb": "9 9 11",
  "--surface-rgb": "15 15 18",
  "--elevated-rgb": "22 22 26",
  "--fg-rgb": "245 245 244",
  "--accent-rgb": "237 255 102",
  "--on-accent-rgb": "9 9 11",
  "--accent-edge-rgb": "237 255 102",
  "--accent-ink-rgb": "237 255 102",
  "--focus-rgb": "237 255 102",
  "--ok-rgb": "52 211 153",
  "--warn-rgb": "251 191 36",
  "--err-rgb": "248 113 113",
  "--info-rgb": "103 232 249",
  "--viz-write-rgb": "196 181 253",
};

const hasDOM = typeof window !== "undefined" && typeof document !== "undefined";

let cacheKey = null;
let varCache = new Map();
let rgbCache = new Map();
let styleDecl = null;

/* Invalidate when <html>'s class changes (one string compare per call). */
function sync() {
  const key = hasDOM ? document.documentElement.className : "";
  if (key !== cacheKey) {
    cacheKey = key;
    varCache = new Map();
    rgbCache = new Map();
    styleDecl = hasDOM ? window.getComputedStyle(document.documentElement) : null;
  }
}

const toVarName = (name) => (name.startsWith("--") ? name : `--${name}`);

/** Computed value of a custom property, e.g. cssVar('--accent') or cssVar('accent'). */
export function cssVar(name) {
  sync();
  const prop = toVarName(name);
  let v = varCache.get(prop);
  if (v !== undefined) return v;
  v = styleDecl ? styleDecl.getPropertyValue(prop).trim() : "";
  if (!v) return FALLBACK[prop] || ""; // tokens.css not applied yet: don't cache
  varCache.set(prop, v);
  return v;
}

/** Resolved theme from the <html> class: "dark" | "light". */
export function currentTheme() {
  return hasDOM && document.documentElement.classList.contains("light") ? "light" : "dark";
}

function parseHex(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  const out = [n(0), n(2), n(4)];
  return out.some(Number.isNaN) ? null : out;
}

function parseChannels(str) {
  const parts = str.match(/-?[\d.]+/g);
  if (!parts || parts.length < 3) return null;
  return parts.slice(0, 3).map((p) => Math.round(Number(p)));
}

/**
 * [r, g, b] for a token name ('fg', '--accent', 'viz-write'), a hex colour
 * ('#f59e0b', '#fff') or an rgb()/rgba() string.
 */
export function toRgb(color) {
  sync();
  const cached = rgbCache.get(color);
  if (cached) return cached;
  let out = null;
  let cacheable = true;
  const s = String(color).trim();
  if (s.startsWith("#")) out = parseHex(s);
  else if (s.startsWith("rgb")) { out = parseChannels(s); cacheable = false; }
  else {
    const name = s.replace(/^--/, "");
    const prop = RGB_TOKENS.includes(name) ? `--${name}-rgb` : `--${name}`;
    out = parseChannels(cssVar(prop));
    cacheable = varCache.has(prop); // false while falling back
  }
  if (!out) out = parseChannels(FALLBACK["--fg-rgb"]);
  if (cacheable) {
    if (rgbCache.size > 512) rgbCache.clear(); // computed colours: stay bounded
    rgbCache.set(color, out);
  }
  return out;
}

/** "r,g,b" string for a token (or hex), for `rgba(${rgbString('fg')},0.4)`. */
export function rgbString(color) {
  return toRgb(color).join(",");
}

/** rgba() string: rgba('fg', 0.4), rgba('accent-ink', 1), rgba('#f59e0b', 0.3). */
export function rgba(color, alpha = 1) {
  const [r, g, b] = toRgb(color);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Opaque rgb() string for a token or hex. */
export function rgb(color) {
  const [r, g, b] = toRgb(color);
  return `rgb(${r},${g},${b})`;
}

const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Snapshot of every colour token for the current theme:
 * { theme, bg, surface, ..., borderStrong, fgMuted, accentInk, vizWrite, ...,
 *   rgb: { bg: "9,9,11", fg: "245,245,244", accent: ..., vizWrite: ... } }
 */
export function getThemeTokens() {
  const out = { theme: currentTheme(), rgb: {} };
  for (const t of COLOR_TOKENS) out[camel(t)] = cssVar(`--${t}`);
  for (const t of RGB_TOKENS) out.rgb[camel(t)] = rgbString(t);
  return out;
}

/* ---- Theme change subscription (one shared MutationObserver) ---- */
const listeners = new Set();
let observer = null;

/** Call `cb` whenever <html>'s class changes. Returns an unsubscribe function. */
export function subscribeTheme(cb) {
  listeners.add(cb);
  if (!observer && hasDOM && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => listeners.forEach((fn) => fn()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

/** <html> class string: a cheap, stable snapshot for useSyncExternalStore. */
export function themeSnapshot() {
  return hasDOM ? document.documentElement.className : "";
}
