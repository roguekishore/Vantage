import * as React from "react";
import { cn } from "@/lib/utils";
import { toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * IntervalsStage (intervals): one lane per interval on a shared numeric axis.
 * Bars are positioned in percent of the (min..max) span, no DOM measurement.
 * The lane label always carries the text "[start, end]" so state and values
 * never depend on colour or bar width alone.
 *
 * @param {{ start: number, end: number, label?: string, tone?: string }[]} intervals
 * @param {number} min
 * @param {number} max
 */
const LABEL_W = 88;
const MIN_TRACK = 200;

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export default function IntervalsStage({ intervals, min, max }) {
  const list = (Array.isArray(intervals) ? intervals : [])
    .filter((iv) => iv && num(iv.start) != null && num(iv.end) != null)
    .map((iv) => ({ ...iv, lo: Math.min(iv.start, iv.end), hi: Math.max(iv.start, iv.end) }));

  if (!list.length) {
    return (
      <div data-stage="intervals" className="px-1 py-3">
        <p className="font-mono text-small text-fg-muted">Nothing to show.</p>
      </div>
    );
  }

  let lo = num(min) != null ? min : Math.min(...list.map((iv) => iv.lo));
  let hi = num(max) != null ? max : Math.max(...list.map((iv) => iv.hi));
  if (hi < lo) [lo, hi] = [hi, lo];
  const span = hi - lo || 1;
  const pct = (v) => Math.min(100, Math.max(0, ((v - lo) / span) * 100));

  // Axis ticks: min, max and up to three evenly spaced integers between.
  const ticks = [...new Set([lo, lo + span / 4, lo + span / 2, lo + (3 * span) / 4, hi].map((t) => Math.round(t * 100) / 100))];

  return (
    <div className="overflow-x-auto" data-stage="intervals">
      <div className="mx-auto grid gap-1 px-1 py-3" style={{ minWidth: LABEL_W + MIN_TRACK, maxWidth: 960 }}>
        <div className="grid items-end gap-2" style={{ gridTemplateColumns: `${LABEL_W}px minmax(${MIN_TRACK}px, 1fr)` }} aria-hidden="true">
          <span />
          <div className="relative h-4 border-b border-border font-mono text-micro tabular-nums text-fg-dim" data-axis="">
            {ticks.map((t, k) => (
              <span
                key={k}
                data-tick={t}
                className="absolute top-0"
                style={{ left: `${pct(t)}%`, transform: k === 0 ? "none" : k === ticks.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div role="list" aria-label="Intervals" className="grid gap-1">
          {list.map((iv, i) => {
            const tone = toneName(iv.tone);
            const left = pct(iv.lo);
            const width = Math.max(1.5, pct(iv.hi) - left);
            const range = `[${iv.start}, ${iv.end}]`;
            const name = iv.label != null && iv.label !== "" ? String(iv.label) : "";
            return (
              <div
                key={i}
                role="listitem"
                data-index={i}
                data-tone={tone}
                aria-label={`${name ? `${name} ` : ""}${range}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}`}
                className="grid items-center gap-2"
                style={{ gridTemplateColumns: `${LABEL_W}px minmax(${MIN_TRACK}px, 1fr)` }}
              >
                <span className={cn("min-w-0 truncate font-mono text-small tabular-nums", tone === "dim" ? "opacity-[0.35] text-fg" : tone === "done" ? "text-fg-dim" : "text-fg")} title={`${name} ${range}`.trim()}>
                  {name ? <span className="text-fg-muted">{name} </span> : null}
                  {range}
                </span>
                <div className="relative h-7 border-b border-border bg-surface">
                  <div
                    data-bar=""
                    className={cn("absolute inset-y-0.5 flex items-center justify-center overflow-hidden font-mono text-micro", toneClass(tone))}
                    style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                  >
                    <span className="truncate px-0.5">{tone !== "idle" ? TONE_LABEL[tone] : ""}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
