/*
 * Shared class fragments for ds/* (POLISH_PLAN §3.4, §3.6, §3.8).
 *
 * `ds-hover:` / `ds-focus:` are custom Tailwind variants (tailwind.config.js):
 * :hover on an enabled, non-busy element and :focus-visible, plus
 * data-force="hover" / data-force="focus" for the static /__ds examples.
 */

/** 2px --focus outline, 2px offset. Outline, never box-shadow (§3.4). */
export const focusRing =
  "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus";

/** Hover is a colour or border change of at most 120ms (§3.6). */
export const colorTransition = "transition-colors duration-[120ms] ease-out";

/** Lucide icon sizes per control size (§3.7); stroke is always 1.5. */
export const ICON_PX = Object.freeze({ sm: 14, md: 16, lg: 20 });
export const ICON_STROKE = 1.5;

/** Label type step: Mono 11px / 700 / 0.12em, upper case (§3.3). */
export const labelType = "font-mono text-label uppercase";

/** Micro type step: Mono 10px / 500 / 0.08em, upper case, tabular nums (§3.3). */
export const microType = "font-mono text-micro uppercase tabular-nums";
