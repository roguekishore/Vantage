import React from "react";
// V.accent stays on changed values only because the *.test.js files pin that
// hex; Judge.css maps it to --accent-ink in the light theme.
import { V } from "../../../../components/visualizer/theme";
import { T, MONO } from "../cfTheme";

/**
 * ScalarChip — single-value renderer for the Code Flow dry-run window.
 *
 * Renders a `scalar`, `string`, or `object` value model as a compact
 * `name = value` chip. When the variable changed in the current step
 * (`model.changed`), the chip flashes with the acid-yellow accent so scalar
 * changes between steps are visible.
 *
 * `data` follows the value-model convention: for `scalar`/`string`/`object` it
 * is a single display string (objects arrive as a string summary). The
 * component coerces any other shape into a string and never throws on garbled
 * input.
 *
 * @typedef {import("../valueModel").ValueModel} ValueModel
 *
 * @param {Object} props
 * @param {ValueModel} props.model - value model (kind `scalar`, `string`, or `object`)
 */
export default function ScalarChip({ model }) {
  const name = toDisplayString(model?.name);
  const value = toDisplayString(model?.data);
  const isChanged = model?.changed === true;
  const isString = model?.kind === "string";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 30,
        padding: "0 10px",
        fontFamily: MONO,
        fontSize: 12,
        color: isChanged ? V.accent : T.fg,
        background: isChanged ? T.accentSoft : T.elevated,
        border: `1px solid ${isChanged ? T.accentInk : T.border}`,
        boxShadow: "none",
        transition: "background-color 120ms ease-out, color 120ms ease-out, border-color 120ms ease-out",
      }}
      title={value}
    >
      {name && (
        <>
          <span style={{ color: T.fgMuted, fontWeight: 500 }}>{name}</span>
          <span style={{ color: T.fgDim, userSelect: "none" }}>=</span>
        </>
      )}
      <span style={{ fontWeight: isChanged ? 700 : 500 }}>
        {isString ? `"${value}"` : value}
      </span>
    </div>
  );
}

/**
 * Coerce an arbitrary value into a display string without throwing.
 *
 * @param {*} value
 * @returns {string}
 */
function toDisplayString(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch {
    return "";
  }
}
