import React from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Layers,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

/*
 * Code-flow playback chrome on design tokens. These
 * views are imported by DryRunPanel.test.js, and jest has no "@/" alias, so
 * they mirror the ds Button / EmptyState / ErrorState classes here instead of
 * importing "@/components/ds".
 */
const FOCUS = "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus";
const ICON_BTN = [
  "inline-flex h-7 w-7 shrink-0 items-center justify-center border border-border-strong bg-transparent text-fg",
  "transition-colors duration-[120ms] ease-out ds-hover:border-fg ds-hover:bg-fg ds-hover:text-bg",
  "disabled:cursor-not-allowed disabled:opacity-50",
  FOCUS,
].join(" ");
const LABEL = "font-mono text-label uppercase";
const ICON = { size: 14, strokeWidth: 1.5, "aria-hidden": true };

/**
 * FlowControlBar — Playback controls for the Code Flow Visualizer.
 *
 * Same semantics as the shared visualizer ControlBar in its post-load mode:
 * prev / play-pause / next / speed / step counter / reset. Prev and next are
 * disabled at the range edges; the speed slider is inverted (right = faster)
 * and reports the interval in ms through `onSpeedChange`.
 *
 * @param {Object} props
 * @param {boolean} props.playing      - whether auto-play is active
 * @param {number} props.step          - current step index (0-based)
 * @param {number} props.totalSteps    - total number of steps
 * @param {number} props.speed         - current auto-play interval (ms; lower = faster)
 * @param {Function} props.onForward   - step forward
 * @param {Function} props.onBackward  - step backward
 * @param {Function} props.onPlayPause - toggle play/pause
 * @param {Function} props.onReset     - reset playback to step 0
 * @param {Function} props.onSpeedChange - speed slider change handler
 * @param {number} [props.minSpeed=20]
 * @param {number} [props.maxSpeed=400]
 */
export default function FlowControlBar({
  playing,
  step,
  totalSteps,
  speed,
  onForward,
  onBackward,
  onPlayPause,
  onReset,
  onSpeedChange,
  minSpeed = 20,
  maxSpeed = 400,
}) {
  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2"
      role="toolbar"
      aria-label="Flow playback"
    >
      <span className={`${LABEL} mr-1 text-fg-muted`}>Flow</span>

      <div className="flex items-center gap-1">
        <button type="button" className={ICON_BTN} onClick={onBackward} disabled={step <= 0} aria-label="Previous step" title="Previous step">
          <ChevronLeft {...ICON} />
        </button>
        <button
          type="button"
          className={`${ICON_BTN} ${playing ? "border-accent-edge bg-accent text-on-accent" : ""}`}
          onClick={onPlayPause}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause {...ICON} /> : <Play {...ICON} />}
        </button>
        <button
          type="button"
          className={ICON_BTN}
          onClick={onForward}
          disabled={step >= totalSteps - 1}
          aria-label="Next step"
          title="Next step"
        >
          <ChevronRight {...ICON} />
        </button>
      </div>

      <label className="flex min-w-0 items-center gap-2">
        <span className="font-mono text-micro uppercase text-fg-dim">Speed</span>
        <input
          type="range"
          min={minSpeed}
          max={maxSpeed}
          value={maxSpeed - speed + minSpeed}
          onChange={(e) => onSpeedChange(maxSpeed - parseInt(e.target.value) + minSpeed)}
          className={`h-1 w-24 cursor-pointer ${FOCUS}`}
          style={{ accentColor: "var(--accent-ink)" }}
          aria-label="Playback speed"
        />
      </label>

      <span className="ml-auto font-mono text-small tabular-nums text-fg" aria-live="polite">
        {step + 1}
        <span className="text-fg-dim">/{totalSteps}</span>
      </span>

      <button type="button" className={ICON_BTN} onClick={onReset} aria-label="Reset playback" title="Reset playback">
        <RotateCcw {...ICON} />
      </button>
    </div>
  );
}

/* Shared frame for the idle / loading / error states (ds StateBox look). */
function StateFrame({ icon: Icon, iconClassName = "text-fg-muted", title, children, role }) {
  return (
    <div role={role} className="grid justify-items-center gap-3 px-6 py-12 text-center">
      {Icon ? <Icon size={20} strokeWidth={1.5} aria-hidden="true" className={iconClassName} /> : null}
      {title ? <h2 className="font-mono text-h3 text-fg">{title}</h2> : null}
      {children}
    </div>
  );
}

/**
 * FlowIdleState — Shown before any trace has been requested.
 * Prompts the user to trigger a flow visualization.
 */
export function FlowIdleState() {
  return (
    <StateFrame icon={GitBranch} title="No flow yet">
      <p className="max-w-[48ch] font-mono text-body text-fg-muted">
        Use <span className="text-fg">Visualize flow</span> to capture and replay your program's execution.
      </p>
    </StateFrame>
  );
}

/**
 * FlowLoading — Loading state shown while a trace request is in progress.
 * Rendered inside the Flow panel only; it never blocks the Run/Submit controls
 */
export function FlowLoading() {
  return (
    <div role="status" aria-live="polite" className="grid justify-items-center gap-3 px-6 py-12 text-center">
      <div aria-hidden="true" className="h-0.5 w-40 overflow-hidden bg-border">
        <span className="block h-full w-2/5 animate-ds-indeterminate bg-accent-ink" />
      </div>
      <div className={`${LABEL} text-fg`}>Capturing flow</div>
      <p className="font-mono text-small text-fg-muted">Instrumenting and running your program.</p>
    </div>
  );
}

/**
 * FlowError — Error state shown when the trace request fails or the backend
 * returns a `Trace Error` status.
 *
 * @param {Object} props
 * @param {string} [props.message] - human-readable error detail
 */
export function FlowError({ message }) {
  return (
    <StateFrame icon={AlertTriangle} iconClassName="text-err" title="Trace failed" role="alert">
      {message && (
        <pre className="max-w-[60ch] whitespace-pre-wrap break-words font-mono text-small text-fg-muted">{message}</pre>
      )}
    </StateFrame>
  );
}

/**
 * StaticOnlyNotice — Banner shown when the backend returns the `StaticOnly`
 * status: the block tree was built but no execution trace is available because
 * instrumentation or compilation failed. The static block
 * view is still rendered alongside this notice.
 *
 * @param {Object} props
 * @param {string} [props.message] - optional detail (e.g. compiler stderr)
 */
export function StaticOnlyNotice({ message }) {
  return (
    <div role="status" className="m-3 flex shrink-0 items-start gap-3 border border-warn border-l-[3px] bg-warn-soft px-3 py-2">
      <Layers size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-warn" />
      <div className="min-w-0">
        <div className={`${LABEL} text-warn`}>Static view only</div>
        <div className="mt-1 whitespace-pre-wrap break-words font-mono text-small text-fg-muted">
          {message ||
            "The block structure was parsed, but execution could not be traced (compilation or instrumentation failed). Playback is unavailable."}
        </div>
      </div>
    </div>
  );
}
