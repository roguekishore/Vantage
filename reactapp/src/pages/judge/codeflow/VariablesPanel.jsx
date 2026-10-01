import React from "react";
import { T, MONO, LABEL } from "./cfTheme";

/**
 * VariablesPanel — Renders the variable snapshots visible at the current step,
 * highlighting those that changed relative to the previous step.
 *
 * Each {@link VarSnapshot} carries a `changed` flag computed during trace parsing;
 * changed variables get accent styling so the user can track state evolution while
 * stepping through playback.
 *
 * @typedef {Object} VarSnapshot
 * @property {string} name      variable name
 * @property {string} type      best-effort type, e.g. "int", "String"
 * @property {string} value     stringified value
 * @property {string} scope     owning blockId or function name
 * @property {boolean} changed  changed vs the previous step
 *
 * @typedef {import("./flowResolvers").TraceStep} TraceStep
 *
 * @param {Object} props
 * @param {TraceStep | null} [props.currentStep] the current step (provides `vars`)
 */
export default function VariablesPanel({ currentStep = null }) {
  const vars = currentStep && Array.isArray(currentStep.vars) ? currentStep.vars : [];

  return (
    <div
      style={{
        padding: 12,
        background: T.surface,
        borderTop: `1px solid ${T.border}`,
        flexShrink: 0,
        maxHeight: "40%",
        overflowY: "auto",
      }}
      className="cf-vars"
    >
      <div style={{ ...LABEL, marginBottom: 8 }}>Variables</div>

      {vars.length === 0 ? (
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.fgDim }}>
          No variables in scope.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {vars.map((v) => (
            <div
              key={`${v.scope}:${v.name}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 8px",
                background: v.changed ? T.accentSoft : T.elevated,
                border: `1px solid ${v.changed ? T.accentInk : T.border}`,
                transition: "background-color 120ms ease-out, border-color 120ms ease-out",
              }}
            >
              {/* type */}
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  color: T.fgMuted,
                  flexShrink: 0,
                }}
              >
                {v.type}
              </span>

              {/* name */}
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  color: v.changed ? T.accentInk : T.fg,
                  flexShrink: 0,
                }}
              >
                {v.name}
              </span>

              <span style={{ fontFamily: MONO, fontSize: 12, color: T.fgDim }}>=</span>

              {/* value */}
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: T.fg,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}
                title={v.value}
              >
                {v.value}
              </span>

              {/* scope tag */}
              {v.scope && (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: T.fgDim,
                    flexShrink: 0,
                  }}
                  title={`scope: ${v.scope}`}
                >
                  {v.scope}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
