import * as React from "react";
import { cn } from "@/lib/utils";
import { toneClass } from "../tones";

/**
 * CallstackStage (callstack): main-stage call stack, same `{ frames }` shape
 * as the callstack aux panel. `frames` run in call order (first = outermost);
 * the newest frame is drawn at the top. Status is shown as text as well as
 * tone: active -> active tone, waiting -> idle, returned -> done.
 *
 * @param {{ fn: string, args: *, ret?: *, status: "active"|"waiting"|"returned" }[]} frames
 */
const STATUS_TONE = { active: "active", waiting: "idle", returned: "done" };
const STATUS_LABEL = { active: "running", waiting: "waiting", returned: "returned" };

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
const argsText = (a) => (Array.isArray(a) ? a.map(show).join(", ") : show(a));

export default function CallstackStage({ frames }) {
  const list = Array.isArray(frames) ? frames.filter((f) => f != null) : [];
  const shown = list.map((f, depth) => ({ f, depth })).reverse();
  return (
    <div className="overflow-x-auto" data-stage="callstack">
      <div className="mx-auto grid w-full max-w-[480px] gap-1 px-1 py-3">
        {list.length === 0 ? (
          <p className="font-mono text-small text-fg-muted" data-empty="true">
            No calls yet.
          </p>
        ) : (
          <ol aria-label="Call stack, newest call first" className="grid max-h-[480px] gap-1 overflow-y-auto">
            {shown.map(({ f, depth }, i) => {
              const status = STATUS_TONE[f.status] ? f.status : "waiting";
              const tone = STATUS_TONE[status];
              const hasRet = f.ret !== undefined && f.ret !== null && f.ret !== "";
              const call = `${f.fn == null ? "" : String(f.fn)}(${argsText(f.args)})`;
              return (
                <li
                  key={depth}
                  data-tone={tone}
                  data-status={status}
                  data-depth={depth}
                  data-top={i === 0 ? "true" : undefined}
                  aria-label={`${call}, ${STATUS_LABEL[status]}${hasRet ? `, returns ${show(f.ret)}` : ""}`}
                  className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-2"
                >
                  <span className="text-right font-mono text-micro tabular-nums text-fg-dim">{depth}</span>
                  <div className={cn("grid min-w-0 gap-0.5 px-2 py-1.5 font-mono", toneClass(tone))}>
                    <span className="truncate text-body leading-tight" title={call}>
                      {call}
                    </span>
                    <span className="flex min-w-0 items-baseline justify-between gap-2 text-micro uppercase leading-none opacity-80">
                      <span>{STATUS_LABEL[status]}</span>
                      {hasRet ? (
                        <span data-ret="true" className="truncate normal-case" title={show(f.ret)}>
                          {"-> "}
                          {show(f.ret)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {list.length > 0 ? <div aria-hidden="true" className="ml-10 h-0 border-t-2 border-border-strong" data-base="true" /> : null}
      </div>
    </div>
  );
}
