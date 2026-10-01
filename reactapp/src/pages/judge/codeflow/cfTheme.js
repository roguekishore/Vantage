/*
 * Code-flow view tokens. Every colour is a CSS
 * custom property from src/styles/tokens.css, so the Flow tab and the dry-run
 * window follow the active theme. Inline styles only reference these.
 */
export const MONO = "'JetBrains Mono','Fira Code','Cascadia Code',monospace";

export const T = Object.freeze({
  bg: "var(--bg)",
  surface: "var(--surface)",
  elevated: "var(--elevated)",
  border: "var(--border)",
  borderStrong: "var(--border-strong)",
  fg: "var(--fg)",
  fgMuted: "var(--fg-muted)",
  fgDim: "var(--fg-dim)",
  accentInk: "var(--accent-ink)",
  accentSoft: "var(--accent-soft)",
  ok: "var(--ok)",
  okSoft: "var(--ok-soft)",
  warn: "var(--warn)",
  warnSoft: "var(--warn-soft)",
  err: "var(--err)",
  errSoft: "var(--err-soft)",
  info: "var(--info)",
});

/* Label type step: Mono 11px / 700 / 0.12em, upper case (§3.3). */
export const LABEL = Object.freeze({
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: T.fgMuted,
});

/* Micro type step: Mono 10px / 500 / 0.08em, upper case, tabular nums. */
export const MICRO = Object.freeze({
  fontFamily: MONO,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontVariantNumeric: "tabular-nums",
  color: T.fgDim,
});
