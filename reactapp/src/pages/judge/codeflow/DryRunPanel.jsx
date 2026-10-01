import React, { useMemo } from "react";
import { T, MONO, LABEL } from "./cfTheme";
import { toValueModel } from "./valueModel";
import DataStructureView from "./ds/DataStructureView";
import InputRibbon from "./InputRibbon";
import FlowControlBar, {
  FlowIdleState,
  FlowLoading,
  FlowError,
  StaticOnlyNotice,
} from "./FlowControlBar";

/**
 * DryRunPanel — Parallel dry-run worksheet window.
 *
 * Renders the captured data structures graphically in a window shown beside the
 * Monaco editor (not only the bottom Flow tab). For the current step it maps each
 * in-scope variable snapshot through {@link toValueModel} and renders a
 * {@link DataStructureView} per variable in a scrollable, worksheet-style grid —
 * exactly how a person dry-running code on paper lays out each variable's evolving
 * value. Stepping/playing updates every structure to reflect the current step
 *
 * Unlike {@link CodeFlowPanel}, this panel does NOT own the playback state. It
 * accepts the {@link useCodeFlow} state + trace as props so JudgePage can share a
 * single `useCodeFlow` instance between the Flow tab and this parallel window
 *: stepping in one is reflected in the other. It reuses
 * {@link FlowControlBar} for play/step/reset so it remains usable standalone beside
 * the editor, and renders the idle/loading/error/StaticOnly states consistently
 * with `CodeFlowPanel`.
 *
 * @typedef {import("./flowResolvers").TraceStep} TraceStep
 * @typedef {import("./valueModel").ValueModel} ValueModel
 *
 * @param {Object} props
 * @param {Object | null} props.trace      - the loaded TraceResult (provides steps, inputTokens, status)
 * @param {"idle"|"loading"|"ready"|"error"} props.status - playback/load status from useCodeFlow
 * @param {string | null} [props.error]    - error detail when status is "error"
 * @param {number} props.step              - current step index (0-based)
 * @param {number} props.totalSteps        - total number of steps
 * @param {boolean} props.playing          - whether auto-play is active
 * @param {number} props.speed             - current auto-play interval (ms; lower = faster)
 * @param {Function} props.onForward       - step forward
 * @param {Function} props.onBackward      - step backward
 * @param {Function} props.onPlayPause     - toggle play/pause
 * @param {Function} props.onReset         - reset playback to step 0
 * @param {Function} props.onSpeedChange   - speed slider change handler
 */
export default function DryRunPanel({
  trace,
  status,
  error = null,
  step,
  totalSteps,
  playing,
  speed,
  onForward,
  onBackward,
  onPlayPause,
  onReset,
  onSpeedChange,
}) {
  // Idle/loading/error states mirror CodeFlowPanel so the parallel window stays
  // consistent with the Flow tab.
  if (status === "idle") return <FlowIdleState />;
  if (status === "loading") return <FlowLoading />;
  if (status === "error" || !trace?.blockTree)
    return <FlowError message={error || trace?.error} />;

  const currentStep = trace?.steps?.[step] ?? null;
  const isStaticOnly = trace.status === "StaticOnly";

  return (
    <DryRunWorksheet
      trace={trace}
      currentStep={currentStep}
      isStaticOnly={isStaticOnly}
      step={step}
      totalSteps={totalSteps}
      playing={playing}
      speed={speed}
      onForward={onForward}
      onBackward={onBackward}
      onPlayPause={onPlayPause}
      onReset={onReset}
      onSpeedChange={onSpeedChange}
    />
  );
}

/**
 * Inner worksheet view (rendered once a trace is ready). Lays out the playback
 * controls, the current line/iteration context + input ribbon at the top, and the
 * scrollable grid of per-variable data-structure renderers below.
 */
function DryRunWorksheet({
  trace,
  currentStep,
  isStaticOnly,
  step,
  totalSteps,
  playing,
  speed,
  onForward,
  onBackward,
  onPlayPause,
  onReset,
  onSpeedChange,
}) {
  const vars = useMemo(
    () => (currentStep && Array.isArray(currentStep.vars) ? currentStep.vars : []),
    [currentStep],
  );

  // Map each in-scope variable snapshot through the value-model normalizer so each
  // renders graphically via the renderer dispatcher.
  const models = useMemo(() => vars.map((v) => toValueModel(v)), [vars]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: T.bg,
      }}
    >
      <FlowControlBar
        playing={playing}
        step={step}
        totalSteps={totalSteps}
        speed={speed}
        onForward={onForward}
        onBackward={onBackward}
        onPlayPause={onPlayPause}
        onReset={onReset}
        onSpeedChange={onSpeedChange}
      />

      {isStaticOnly && <StaticOnlyNotice message={trace.error} />}

      <StepContextRibbon currentStep={currentStep} step={step} totalSteps={totalSteps} />

      <InputRibbon inputTokens={trace.inputTokens} step={step} />

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 12 }}>
        {models.length === 0 ? (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: T.fgDim,
              padding: "32px 0",
              textAlign: "center",
            }}
          >
            No variables in scope at this step.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))",
              gap: 12,
              alignItems: "start",
            }}
          >
            {models.map((model, i) => (
              <WorksheetCell
                key={`${model.scope}:${model.name}:${i}`}
                model={model}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StepContextRibbon — current line / iteration / step context shown at the top of
 * the worksheet so the user knows where execution is.
 *
 * @param {Object} props
 * @param {TraceStep | null} props.currentStep
 * @param {number} props.step
 * @param {number} props.totalSteps
 */
function StepContextRibbon({ currentStep, step, totalSteps }) {
  const line = currentStep && typeof currentStep.line === "number" ? currentStep.line : null;
  const iteration =
    currentStep && typeof currentStep.iteration === "number" ? currentStep.iteration : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        padding: "10px 12px",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <span style={LABEL}>Dry run</span>

      <ContextChip label="step" value={`${totalSteps > 0 ? step + 1 : 0} / ${totalSteps}`} />

      {line != null && <ContextChip label="line" value={line} />}

      {iteration != null && (
        <ContextChip label="iter" value={`×${iteration}`} accent />
      )}
    </div>
  );
}

/**
 * Small labeled value chip used by the step-context ribbon.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {boolean} [props.accent]
 */
function ContextChip({ label, value, accent = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: MONO,
        fontSize: 11,
        padding: "3px 8px",
        background: accent ? T.accentSoft : T.elevated,
        border: `1px solid ${accent ? T.accentInk : T.border}`,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: T.fgDim,
        }}
      >
        {label}
      </span>
      <span style={{ color: accent ? T.accentInk : T.fg, fontWeight: 700 }}>
        {value}
      </span>
    </span>
  );
}

/**
 * WorksheetCell — one variable's slot in the dry-run worksheet: a header carrying
 * the variable's type/name/scope, then the structured renderer for its value.
 *
 * @param {Object} props
 * @param {ValueModel} props.model
 */
function WorksheetCell({ model }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 10,
        background: T.surface,
        border: `1px solid ${model.changed ? T.accentInk : T.border}`,
        transition: "border-color 120ms ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {model.type && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 700,
              color: T.fgMuted,
              flexShrink: 0,
            }}
          >
            {model.type}
          </span>
        )}

        <span
          style={{
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 700,
            color: model.changed ? T.accentInk : T.fg,
          }}
        >
          {model.name || "(anonymous)"}
        </span>

        {model.scope && (
          <span
            style={{ fontFamily: MONO, fontSize: 10, color: T.fgDim, marginLeft: "auto" }}
            title={`scope: ${model.scope}`}
          >
            {model.scope}
          </span>
        )}
      </div>

      <DataStructureView model={model} />
    </div>
  );
}
