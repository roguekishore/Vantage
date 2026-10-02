/**
 * Type scale constants for inline styles (POLISH_PLAN §3.3).
 *
 * Single source of truth: ./typeScale.json, which tailwind.config.js also
 * reads to build the `text-display|h1|h2|h3|body|small|label|micro` and
 * `font-mono|display` utilities. Edit the JSON, never these objects.
 *
 *   import { TYPE } from "@/styles/typeScale";
 *   <h1 style={TYPE.h1}>…</h1>
 *
 * Each entry is a complete React style object (font family, size, line
 * height, weight, tracking, case). Display steps read --display-weight.
 */
import data from "./typeScale.json";

export const FONT_MONO = data.fonts.mono.join(", ");
export const FONT_DISPLAY = data.fonts.display.join(", ");

const FAMILY = { mono: FONT_MONO, display: FONT_DISPLAY };

export const TYPE = Object.freeze(
  Object.fromEntries(
    Object.entries(data.scale).map(([step, { font, ...style }]) => [
      step,
      Object.freeze({
        fontFamily: FAMILY[font],
        ...style,
        // Never let the browser fake a bold Monument (§3.3).
        ...(font === "display" ? { fontSynthesis: "none" } : null),
        fontVariantNumeric: "tabular-nums",
      }),
    ])
  )
);

export const TYPE_STEPS = Object.freeze(Object.keys(data.scale));
