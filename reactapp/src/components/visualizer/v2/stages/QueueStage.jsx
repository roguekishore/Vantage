import * as React from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleClass, toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * QueueStage (queue): a queue as the main stage. Front on the left, rear on
 * the right. Slots scale to fit (grid columns, no DOM measurement); horizontal
 * scroll is the last resort. When `capacity` exceeds the items, the remaining
 * slots render as dashed empties; with `circular`, items are read as the ring
 * buffer slots (null/undefined value = empty slot) and a wrap note is shown.
 *
 * @param {{ value: *, sub?: string, tone?: string }[]} items
 * @param {number} [head]  slot index of the front (default 0)
 * @param {number} [tail]  slot index of the rear (default last item)
 * @param {number} [capacity]
 * @param {boolean} [circular]
 */
const MIN_CELL = 36;
const MAX_CELL = 76;
const GAP = 4;

const validIdx = (i, n) => Number.isInteger(i) && i >= 0 && i < n;

export default function QueueStage({ items, head, tail, capacity, circular }) {
  const list = Array.isArray(items) ? items.filter((x) => x !== undefined) : [];
  const cap = Number.isInteger(capacity) && capacity > 0 ? capacity : 0;
  const n = Math.max(list.length, cap);
  const isEmpty = (c) => !c || c.value == null;
  const h = validIdx(head, n) ? head : !circular && list.length ? 0 : null;
  const t = validIdx(tail, n) ? tail : !circular && list.length ? list.length - 1 : null;
  const count = list.filter((c) => !isEmpty(c)).length;
  const dense = n > 14;

  if (n === 0) {
    return (
      <div data-stage="queue" className="px-1 py-3">
        <p className="font-mono text-small text-fg-muted">Queue is empty.</p>
      </div>
    );
  }

  const markers = [];
  if (h != null) markers.push({ at: h, label: h === t ? "head/tail" : "head", role: 1 });
  if (t != null && t !== h) markers.push({ at: t, label: "tail", role: 2 });
  const byIndex = new Map();
  markers.forEach((m) => byIndex.set(m.at, [...(byIndex.get(m.at) || []), m]));

  return (
    <div className="overflow-x-auto" data-stage="queue">
      <div className="mx-auto grid gap-2 px-1 py-3" style={{ width: "100%", maxWidth: n * (MAX_CELL + GAP) + 16 }}>
        <p className="flex justify-between font-mono text-label uppercase text-fg-muted">
          <span>front</span>
          <span data-queue-meta>
            {count}
            {cap ? ` / ${cap}` : ""} {circular ? "circular" : "items"}
          </span>
          <span>rear</span>
        </p>
        <div
          role="list"
          aria-label="Queue"
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${n}, minmax(${MIN_CELL}px, 1fr))`,
            columnGap: GAP,
            minWidth: n * (MIN_CELL + GAP),
          }}
        >
          {Array.from({ length: n }, (_, i) => {
            const c = list[i];
            if (isEmpty(c)) {
              return (
                <div
                  key={i}
                  role="listitem"
                  data-empty="true"
                  data-index={i}
                  aria-label="empty slot"
                  className="flex h-12 min-w-0 items-center justify-center border border-dashed border-border-strong font-mono text-small text-fg-dim"
                  style={{ gridRow: 1, gridColumn: i + 1 }}
                >
                  empty
                </div>
              );
            }
            const tone = toneName(c.tone);
            const text = String(c.value);
            return (
              <div
                key={i}
                role="listitem"
                data-tone={tone}
                data-index={i}
                aria-label={`${text}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}`}
                title={text}
                className={cn(
                  "relative flex h-12 min-w-0 flex-col items-center justify-center overflow-hidden px-0.5 font-mono tabular-nums",
                  dense ? "text-small" : "text-body",
                  toneClass(tone)
                )}
                style={{ gridRow: 1, gridColumn: i + 1 }}
              >
                <span className="max-w-full truncate leading-tight">{text}</span>
                {c.sub != null && c.sub !== "" ? <span className="max-w-full truncate text-micro leading-none opacity-80">{c.sub}</span> : null}
              </div>
            );
          })}
          {Array.from({ length: n }, (_, i) => (
            <span
              key={`i${i}`}
              aria-hidden="true"
              className="pt-1 text-center font-mono text-micro tabular-nums text-fg-dim"
              style={{ gridRow: 2, gridColumn: i + 1 }}
            >
              {i}
            </span>
          ))}
          {[...byIndex.entries()].map(([i, ms]) => (
            <div key={`p${i}`} data-pointer-index={i} className="flex min-w-0 flex-col items-center pt-0.5" style={{ gridRow: 3, gridColumn: i + 1 }}>
              {ms.map((m, k) => (
                <span key={k} data-role={m.role} className={cn("flex flex-col items-center font-mono text-small font-bold leading-tight", roleClass(m.role))}>
                  {k === 0 ? <ChevronUp size={14} strokeWidth={2} aria-hidden="true" /> : null}
                  <span className="max-w-full truncate">{m.label}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
