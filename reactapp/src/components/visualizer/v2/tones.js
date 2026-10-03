/*
 * One semantic tone map for every stage and aux panel.
 * Tailwind class strings, tokens only. State is never colour alone:
 * active = 2px inner border, compare = dashed, error = dotted, done = dim
 * text, dim = 35% opacity.
 */

const INNER_ACTIVE = "outline outline-2 -outline-offset-2 outline-on-accent";

export const CELL_TONE = {
  idle: "bg-elevated border border-border text-fg",
  active: `bg-accent text-on-accent border border-accent-edge ${INNER_ACTIVE}`,
  compare: "bg-warn-soft text-fg border-2 border-dashed border-warn",
  write: "bg-elevated text-viz-write border-2 border-viz-write font-bold",
  done: "bg-surface text-fg-dim border border-border",
  success: "bg-ok-soft text-fg border-2 border-ok",
  error: "bg-err-soft text-fg border-2 border-dotted border-err",
  window: "bg-info-soft text-fg border border-info",
  dim: "bg-elevated text-fg border border-border opacity-[0.35]",
};

export const TONES = Object.keys(CELL_TONE);
export const toneClass = (tone) => CELL_TONE[tone] || CELL_TONE.idle;
export const toneName = (tone) => (CELL_TONE[tone] ? tone : "idle");

/** Band behind cells (`window` by default): soft fill with 2px edges. */
export const BAND_TONE = {
  window: "bg-info-soft border-x-2 border-info",
  compare: "bg-warn-soft border-x-2 border-warn",
  success: "bg-ok-soft border-x-2 border-ok",
  error: "bg-err-soft border-x-2 border-err",
  write: "bg-[rgb(var(--viz-write-rgb)/0.14)] border-x-2 border-viz-write",
  active: "bg-accent-soft border-x-2 border-accent-ink",
  done: "bg-surface border-x-2 border-border-strong",
};
export const bandClass = (tone) => BAND_TONE[tone] || BAND_TONE.window;

/** Pointer role -> text colour: P1 accent-ink, P2 info, P3 viz-write. */
export const ROLE_TEXT = { 1: "text-accent-ink", 2: "text-info", 3: "text-viz-write" };
export const roleClass = (role) => ROLE_TEXT[role] || ROLE_TEXT[1];

export const TONE_LABEL = {
  idle: "untouched",
  active: "active",
  compare: "comparing",
  write: "write",
  done: "done",
  success: "success",
  error: "error",
  window: "window",
  dim: "discarded",
};
