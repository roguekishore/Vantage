import * as React from "react";
import { cn } from "@/lib/utils";

const PHASE_RULE = {
  compare: "border-warn",
  write: "border-viz-write",
  success: "border-ok",
  fail: "border-err",
  done: "border-border-strong",
  info: "border-accent-ink",
};

/** The most important line on the page: current step message, aria-live polite. */
export default function Caption({ step, compact }) {
  return (
    <p
      aria-live="polite"
      aria-atomic="true"
      data-testid="caption"
      className={cn(
        "min-h-12 border-l-2 bg-surface px-4 py-3 font-mono text-body text-fg",
        PHASE_RULE[step?.phase] || PHASE_RULE.info,
        compact && "min-h-10 px-3 py-2"
      )}
    >
      {step?.msg}
    </p>
  );
}
