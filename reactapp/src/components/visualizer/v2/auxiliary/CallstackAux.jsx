import * as React from "react";

const STATUS = {
  active: { label: "running", cls: "border-2 border-accent-ink bg-accent-soft text-fg", mark: ">" },
  waiting: { label: "waiting", cls: "border border-dashed border-border-strong bg-elevated text-fg", mark: "..." },
  returned: { label: "returned", cls: "border border-border bg-surface text-fg-dim", mark: "<" },
};
const show = (v) => {
  if (v == null) return "";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch (_e) {
      return String(v);
    }
  }
  return String(v);
};
const clean = (x) => (Array.isArray(x) ? x.filter((e) => e != null) : []);
const fmt = (v) => (Array.isArray(v) ? v.map(show).join(", ") : show(v));

/**
 * CallstackAux (callstack). Frames are supplied outermost first and the newest is drawn on top, as in CallstackStage. Status is
 * shown by text, border style and a mark, never colour alone.
 *
 * @param {{ fn: string, args: *, ret?: *, status: "active"|"waiting"|"returned" }[]} frames
 */
export default function CallstackAux({ frames: rawFrames }) {
  const frames = clean(rawFrames);
  if (!frames.length) return <p className="font-mono text-small text-fg-muted">No active calls.</p>;
  return (
    <ol role="list" aria-label="Call stack" className="grid gap-1">
      {frames.map((f, depth) => ({ f, depth })).reverse().map(({ f, depth: i }) => {
        const s = STATUS[f.status] || STATUS.waiting;
        const hasRet = f.ret !== undefined && f.ret !== null;
        return (
          <li
            key={i}
            data-frame={i}
            data-status={STATUS[f.status] ? f.status : "waiting"}
            aria-label={`${f.fn}(${fmt(f.args)}) ${s.label}${hasRet ? `, returns ${fmt(f.ret)}` : ""}`}
            className={`flex min-w-0 items-baseline gap-2 px-2 py-1 font-mono text-small ${s.cls}`}
          >
            <span aria-hidden="true" className="text-micro font-bold">{s.mark}</span>
            <span className="min-w-0 flex-1 truncate">{f.fn}({fmt(f.args)})</span>
            {hasRet ? <span data-ret className="tabular-nums">= {fmt(f.ret)}</span> : null}
            <span className="text-micro uppercase">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
