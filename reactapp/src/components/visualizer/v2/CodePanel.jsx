import * as React from "react";
import { cn } from "@/lib/utils";
import { tokenizeLines, TOKEN_CLASS } from "./tokenizeCpp";

/** Tokenised C++ listing. Active line: accent-soft fill + 2px accent-ink left rule. */
export default function CodePanel({ lines, activeLine }) {
  const tokens = React.useMemo(() => tokenizeLines(lines), [lines]);
  const activeRef = React.useRef(null);
  React.useEffect(() => {
    const el = activeRef.current;
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [activeLine]);
  return (
    <div role="region" aria-label="C++ code" className="max-h-[70vh] overflow-auto py-2 font-mono text-small">
      <ol className="min-w-max">
        {tokens.map((toks, i) => {
          const n = i + 1;
          const active = activeLine === n;
          return (
            <li
              key={n}
              ref={active ? activeRef : undefined}
              data-line={n}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex h-6 items-center border-l-2",
                active ? "border-accent-ink bg-accent-soft" : "border-transparent"
              )}
            >
              <span aria-hidden="true" className="w-9 shrink-0 select-none pr-2 text-right text-micro tabular-nums text-fg-dim">
                {n}
              </span>
              <code className="whitespace-pre pr-3">
                {toks.length ? toks.map((t, k) => <span key={k} className={TOKEN_CLASS[t.k]}>{t.t}</span>) : " "}
              </code>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
