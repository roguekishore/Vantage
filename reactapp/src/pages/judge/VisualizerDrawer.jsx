import React, { Suspense, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Badge, Button } from "@/components/ds";
import { lazyVisualizer } from "../visualizer/legacyViz";

/* ── judgeId → visualizer lazy component map ── */
const VISUALIZER_MAP = {
  "find-max-element": lazyVisualizer(() =>
    import("../algorithms/Arrays/FindMaxElement")
  ),
  "find-min-element": lazyVisualizer(() =>
    import("../algorithms/Arrays/FindMinElement")
  ),
};

/**
 * VisualizerDrawer
 *
 * A collapsible panel that sits above the main workspace in the JudgePage.
 * Opens and closes in place (hidden, kept mounted). Renders the
 * algorithm visualizer that corresponds to the current judge problem.
 *
 * Props:
 *   problemId   - judge problem ID (e.g. "find-max-element")
 *   isOpen      - whether the drawer is expanded
 *   onToggle    - callback to toggle open/close
 *   testArray   - optional number[] parsed from the active test case input
 */
export default function VisualizerDrawer({
  problemId,
  isOpen,
  onToggle,
  testArray,
}) {
  const VisualizerComponent = useMemo(
    () => VISUALIZER_MAP[problemId] ?? null,
    [problemId]
  );

  /* No visualizer for this problem - render nothing */
  if (!VisualizerComponent) return null;

  return (
    <div className="flex shrink-0 flex-col border-b border-border bg-bg">
      {/* ── Toggle bar ── */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={[
          "flex h-8 select-none items-center gap-2 px-3 font-mono text-label uppercase text-fg-muted",
          "transition-colors duration-[120ms] ease-out ds-hover:bg-elevated ds-hover:text-fg",
          "ds-focus:outline ds-focus:outline-2 ds-focus:-outline-offset-2 ds-focus:outline-focus",
        ].join(" ")}
      >
        {isOpen ? (
          <EyeOff size={14} strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Eye size={14} strokeWidth={1.5} aria-hidden="true" />
        )}
        <span>Visualizer</span>
        <Badge tone="outline">Interactive</Badge>
        {testArray && isOpen && (
          <span className="ml-auto max-w-[200px] truncate font-mono text-micro normal-case tabular-nums text-fg-dim">
            [{testArray.slice(0, 6).join(", ")}
            {testArray.length > 6 ? ", …" : ""}]
          </span>
        )}
      </button>

      {/* ── Collapsible content (kept mounted, hidden when closed) ── */}
      <div hidden={!isOpen} className="h-[360px] max-h-[50vh] overflow-y-auto border-t border-border bg-bg">
        <Suspense
          fallback={
            <div role="status" className="grid h-full content-center justify-items-center gap-3 px-6">
              <div aria-hidden="true" className="h-0.5 w-40 overflow-hidden bg-border">
                <span className="block h-full w-2/5 animate-ds-indeterminate bg-accent-ink" />
              </div>
              <span className="font-mono text-label uppercase text-fg-muted">Loading visualizer_</span>
            </div>
          }
        >
          <VisualizerComponent
            embedded
            externalArray={testArray}
            navigate={() => {}}
          />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Toggle button for the JudgePage header toolbar.
 * Kept here for co-location with the drawer logic.
 */
export function VisualizerToggleButton({ problemId, isOpen, onToggle }) {
  if (!VISUALIZER_MAP[problemId]) return null;

  return (
    <Button
      variant={isOpen ? "primary" : "secondary"}
      size="sm"
      aria-pressed={isOpen}
      onClick={onToggle}
    >
      {isOpen ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      <span className="hidden sm:inline">Visualizer</span>
      <span className="sr-only sm:hidden">Visualizer</span>
    </Button>
  );
}
