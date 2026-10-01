/**
 * Vantage Visualizer — Shared Design Tokens
 *
 * All visualizer components pull colors, fonts, and spacing from here.
 * This ensures a consistent look across every algorithm page.
 *
 * ── PALETTE ──────────────────────────────────────────────
 * Neutrals come from the design tokens (styles/tokens.css) so they follow dark/light.
 * Dark, terminal-brutalist aesthetic with acid-yellow accent.
 * Non-accent text is deliberately bright for readability.
 */

export const V = {
    /* ── backgrounds ── */
    bg: "var(--bg)",
    surface: "var(--surface)",
    elevated: "var(--elevated)",

    /* ── borders ── */
    border: "var(--border)",
    borderHi: "var(--border-strong)",

    /* ── accent (acid yellow) ── */
    accent: "#EDFF66",
    accentDim: "var(--accent-soft)",
    accentMid: "rgba(237,255,102,0.30)",

    /* ── text (bright for readability) ── */
    text: "var(--fg)",          // primary – near-white
    textBright: "#FFFFFF",          // headings & stat values
    muted: "var(--fg-muted)", // secondary – still readable
    dim: "var(--fg-dim)", // labels, line numbers

    /* ── semantic colors ── */
    green: "#34d399",
    red: "#f87171",
    amber: "#fbbf24",
    purple: "#c4b5fd",
    cyan: "#67e8f9",
    blue: "#60a5fa",

    /* ── semantic dim variants ── */
    greenDim: "rgba(52,211,153,0.15)",
    redDim: "rgba(248,113,113,0.15)",
    amberDim: "rgba(251,191,36,0.15)",
    purpleDim: "rgba(196,181,253,0.12)",
    cyanDim: "rgba(103,232,249,0.12)",
    blueDim: "rgba(96,165,250,0.12)",
};

/* ── token colors for code syntax ── */
export const TOKEN_COLORS = {
    kw: V.purple,
    fn: V.green,
    var: V.amber,
    str: V.green,
    num: V.amber,
    comment: V.muted,
    dim: V.dim,
    type: V.cyan,
    "": V.text,
};

/* ── fonts ── */
export const MONO = "'JetBrains Mono','Fira Code','Cascadia Code',monospace";
export const MONUMENT = "'Monument Extended',sans-serif";

/* ── common inline-style fragments ── */
export const LABEL_STYLE = {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: V.dim,
};

export const MONO_TEXT = {
    fontFamily: MONO,
    color: V.text,
};
