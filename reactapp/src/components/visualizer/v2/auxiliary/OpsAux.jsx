import * as React from "react";

const clean = (x) => (Array.isArray(x) ? x.filter((e) => e != null) : []);

/**
 * OpsAux (ops). Operation list; the running op carries a marker and accent
 * rule, finished ops show their result when one exists.
 *
 * @param {string[]} ops
 * @param {number} active  index of the running op
 * @param {string[]} [results]
 */
export default function OpsAux({ ops: rawOps, active = -1, results: rawResults }) {
  const ops = clean(rawOps);
  const results = Array.isArray(rawResults) ? rawResults : [];
  if (!ops.length) return <p className="font-mono text-small text-fg-muted">No operations.</p>;
  return (
    <ol role="list" aria-label="Operations" className="grid gap-px">
      {ops.map((op, i) => {
        const isActive = i === active;
        const res = results[i];
        const hasRes = res !== undefined && res !== null && res !== "";
        return (
          <li
            key={i}
            data-op={i}
            data-active={isActive ? "true" : undefined}
            aria-current={isActive ? "step" : undefined}
            className={`flex min-w-0 items-baseline gap-2 border-l-2 px-2 py-0.5 font-mono text-small ${
              isActive ? "border-accent-ink bg-accent-soft text-fg" : i < active ? "border-transparent text-fg-dim" : "border-transparent text-fg"
            }`}
          >
            <span aria-hidden="true" className="w-3 text-micro font-bold text-accent-ink">{isActive ? ">" : ""}</span>
            <span className="min-w-0 flex-1 truncate">{String(op)}</span>
            {hasRes ? <span data-result className="tabular-nums text-fg-muted">{"-> "}{String(res)}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
