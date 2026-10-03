import * as React from "react";
import { cn } from "@/lib/utils";
import { toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * StackStage (stack): main-stage stack, same `{ items }` shape as the stack
 * aux panel. Items are top first; the top is drawn at the top of the column
 * and marked with a TOP label (text, not colour). Width fits the stage, the
 * column scrolls vertically only for very tall stacks.
 *
 * @param {{ value: *, sub?: string, tone?: string }[]} items  top first
 */
export default function StackStage({ items }) {
  const list = Array.isArray(items) ? items.filter((it) => it != null) : [];
  return (
    <div className="overflow-x-auto" data-stage="stack">
      <div className="mx-auto grid w-full max-w-[360px] gap-1 px-1 py-3">
        {list.length === 0 ? (
          <p className="font-mono text-small text-fg-muted" data-empty="true">
            Stack is empty.
          </p>
        ) : (
          <ol aria-label="Stack, top first" className="grid max-h-[480px] gap-1 overflow-y-auto">
            {list.map((it, i) => {
              const tone = toneName(it.tone);
              const text = it.value == null ? "" : String(it.value);
              const top = i === 0;
              return (
                <li
                  key={i}
                  data-tone={tone}
                  data-index={i}
                  data-top={top ? "true" : undefined}
                  aria-label={`${text}${top ? ", top" : ""}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}`}
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2"
                >
                  <span className="text-right font-mono text-micro uppercase tabular-nums text-fg-dim">
                    {top ? "top" : list.length - 1 - i}
                  </span>
                  <div
                    title={text}
                    className={cn(
                      "flex min-h-10 min-w-0 flex-col items-center justify-center px-2 py-1 font-mono text-body tabular-nums",
                      toneClass(tone)
                    )}
                  >
                    <span className="max-w-full truncate leading-tight">{text}</span>
                    {it.sub != null && it.sub !== "" ? (
                      <span className="max-w-full truncate text-micro leading-none opacity-80">{it.sub}</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {list.length > 0 ? (
          <div aria-hidden="true" className="ml-[4rem] h-0 border-t-2 border-border-strong" data-base="true" />
        ) : null}
      </div>
    </div>
  );
}
