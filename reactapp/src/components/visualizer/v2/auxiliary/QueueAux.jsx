import * as React from "react";
import { toneClass, toneName } from "../tones";

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

/**
 * QueueAux (queue). Head and tail are slot indices into items; in circular
 * mode with a capacity, empty slots are drawn so wrap-around is visible.
 *
 * @param {{ value: *, sub?: string, tone?: string }[]} items
 * @param {number} [head]
 * @param {number} [tail]
 * @param {number} [capacity]
 * @param {boolean} [circular]
 */
export default function QueueAux({ items: rawItems, head, tail, capacity, circular }) {
  const items = clean(rawItems);
  const used = items.filter((c) => c.value != null).length;
  const slots = Math.max(items.length, Number.isFinite(capacity) ? capacity : 0);
  const h = Number.isFinite(head) ? head : items.length ? 0 : undefined;
  const t = Number.isFinite(tail) ? tail : items.length ? items.length - 1 : undefined;
  if (!slots) return <p className="font-mono text-small text-fg-muted">Empty queue.</p>;
  return (
    <div className="grid gap-1">
      <p className="font-mono text-micro text-fg-dim" data-queue-meta>
        {used}
        {Number.isFinite(capacity) ? ` / ${capacity}` : ""} used{circular ? " · circular" : ""}
      </p>
      <ol role="list" aria-label="Queue, head to tail" className="flex flex-wrap gap-1">
        {Array.from({ length: slots }, (_, i) => {
          const c = items[i];
          const it = c && c.value != null ? c : null;
          const marks = [i === h ? "head" : null, i === t ? "tail" : null].filter(Boolean);
          return (
            <li
              key={i}
              data-slot={i}
              data-empty={it ? undefined : "true"}
              data-tone={it ? toneName(it.tone) : "empty"}
              aria-label={`slot ${i}: ${it ? show(it.value) : "empty"}${marks.length ? `, ${marks.join(" and ")}` : ""}`}
              className="flex min-w-10 flex-col items-stretch gap-0.5"
            >
              <span className={`px-1.5 py-1 text-center font-mono text-small tabular-nums ${it ? toneClass(it.tone) : "border border-dashed border-border text-fg-dim"}`}>
                {it ? show(it.value) : "-"}
              </span>
              {it && it.sub ? <span className="text-center font-mono text-micro text-fg-dim">{it.sub}</span> : null}
              <span data-marks className="min-h-3 text-center font-mono text-micro font-bold uppercase text-accent-ink">
                {marks.join("/")}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
