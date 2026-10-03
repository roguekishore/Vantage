import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Collapsible step log; click a row to jump. Current row is marked and ruled. */
export default function LogPanel({ steps, index, onJump, defaultOpen = false, alwaysOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const shown = alwaysOpen || open;
  const curRef = React.useRef(null);
  React.useEffect(() => {
    const el = curRef.current;
    if (shown && el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [index, shown]);
  return (
    <section aria-label="Step log" className="border border-border bg-surface">
      {alwaysOpen ? null : (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-full items-center gap-2 px-3 text-left font-mono text-label uppercase text-fg-muted ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-[-2px] ds-focus:outline-focus"
        >
          {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
          Log
          <span className="tabular-nums text-fg-dim">{steps.length} steps</span>
        </button>
      )}
      {shown ? (
        <ol className={cn("max-h-64 overflow-y-auto font-mono text-small", alwaysOpen ? "" : "border-t border-border")}>
          {steps.map((s, i) => {
            const cur = i === index;
            return (
              <li key={i} ref={cur ? curRef : undefined} aria-current={cur ? "step" : undefined}>
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className={cn(
                    "flex w-full gap-3 border-l-2 px-3 py-1 text-left ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-[-2px] ds-focus:outline-focus",
                    cur ? "border-accent-ink bg-accent-soft text-fg" : "border-transparent text-fg-muted ds-hover:text-fg"
                  )}
                >
                  <span className="w-8 shrink-0 text-right tabular-nums text-fg-dim">{i + 1}</span>
                  <span className="min-w-0">{s.msg}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
