import React from "react";
import { T, MONO, LABEL } from "./cfTheme";

/**
 * InputRibbon — Visualizes the stdin forwarded to the traced program and how it is
 * consumed during playback (Requirement 6.4).
 *
 * Each {@link InputToken} is rendered as a chip. A token's relationship to the
 * current step is one of three states:
 *  - **consumed**: it was read at or before the current step (`consumedAtStep <= step`)
 *  - **current**:  it was read exactly at the current step (`consumedAtStep === step`)
 *  - **pending**:  it has not been read yet at the current step, or is never read
 *
 * @typedef {import("./flowResolvers").TraceStep} TraceStep
 * @typedef {Object} InputToken
 * @property {number} index           position in the input stream (contiguous from 0)
 * @property {string} raw             the token text
 * @property {number|null} consumedAtStep step index that read it, or null if unused
 *
 * @param {Object} props
 * @param {InputToken[]} [props.inputTokens] tokenized stdin from the TraceResult
 * @param {number} [props.step]              current (0-based) step index
 */
export default function InputRibbon({ inputTokens, step = 0 }) {
  const tokens = Array.isArray(inputTokens) ? inputTokens : [];

  return (
    <div
      style={{
        padding: 12,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
        maxHeight: 120,
        overflowY: "auto",
      }}
    >
      <div style={{ ...LABEL, marginBottom: 8 }}>Input</div>

      {tokens.length === 0 ? (
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.fgDim }}>
          No input forwarded.
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {tokens.map((token) => {
            const state = tokenState(token, step);
            const style = TOKEN_STYLES[state];

            return (
              <span
                key={token.index}
                title={
                  token.consumedAtStep == null
                    ? `token ${token.index} — not read`
                    : `token ${token.index} — read at step ${token.consumedAtStep}`
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: MONO,
                  fontSize: 12,
                  padding: "3px 8px",
                  background: style.bg,
                  color: style.fg,
                  border: `1px solid ${style.border}`,
                  transition: "background-color 120ms ease-out, border-color 120ms ease-out",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                    color: T.fgDim,
                    flexShrink: 0,
                  }}
                >
                  {token.index}
                </span>
                <span
                  style={{
                    whiteSpace: "pre",
                    textDecoration:
                      state === "consumed" || state === "current" ? "none" : "none",
                    opacity: state === "pending" ? 0.7 : 1,
                  }}
                >
                  {token.raw}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Classify a token relative to the current step.
 * @param {{consumedAtStep: number|null}} token
 * @param {number} step current 0-based step index
 * @returns {"current"|"consumed"|"pending"}
 */
function tokenState(token, step) {
  const at = token.consumedAtStep;
  if (at == null) return "pending";
  if (at === step) return "current";
  if (at < step) return "consumed";
  return "pending";
}

/** Visual tokens per consumption state, sourced from the shared visualizer theme. */
const TOKEN_STYLES = {
  current: { bg: T.accentSoft, fg: T.accentInk, border: T.accentInk },
  consumed: { bg: T.surface, fg: T.fgDim, border: T.border },
  pending: { bg: T.elevated, fg: T.fg, border: T.borderStrong },
};
