import * as React from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { bandClass, roleClass, toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * BarsStage (bars): histogram / trapped-water. Bar heights come from values
 * against `max` (percent of a fixed-height plot, no DOM measurement). `fill`
 * stacks extra height on top of a bar (water above a wall) in the info tone
 * with a dashed edge. Columns scale to fit, horizontal scroll is last resort.
 *
 * @param {{ value: number, tone?: string, fill?: number }[]} bars
 * @param {number} max  value that maps to the top of the plot (value + fill is clamped to it)
 * @param {{ index: number, label: string, role: 1|2|3 }[]} [pointers]
 * @param {{ from: number, to: number, tone: string }} [band]  range behind the bars
 */
const MIN_COL = 26;
const MAX_COL = 64;
const GAP = 4;
const PLOT_H = 176;
const HEADROOM = 86; // percent of the plot a max-height bar fills; the rest holds the value label

const num = (v) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);
const show = (v) => (v == null ? "" : String(v));

export default function BarsStage({ bars, max, pointers, band }) {
  const list = Array.isArray(bars) ? bars.filter((b) => b != null) : [];
  const n = list.length;
  if (n === 0) {
    return (
      <div data-stage="bars" className="px-1 py-3">
        <p className="font-mono text-small text-fg-muted">Nothing to show.</p>
      </div>
    );
  }
  const top = Math.max(num(max), 1e-9, ...list.map((b) => num(b.value) + num(b.fill)));
  const pct = (v) => Math.min(100, (num(v) / top) * HEADROOM);

  const inRange = (i) => Number.isInteger(i) && i >= 0 && i < n;
  const byIndex = new Map();
  (Array.isArray(pointers) ? pointers : [])
    .filter((p) => p && inRange(p.index))
    .forEach((p) => byIndex.set(p.index, [...(byIndex.get(p.index) || []), p]));
  const b = band && inRange(band.from) && Number.isInteger(band.to) ? band : null;
  const bFrom = b ? b.from : 0;
  const bTo = b ? Math.min(n - 1, b.to) : 0;

  return (
    <div className="overflow-x-auto" data-stage="bars">
      <div className="mx-auto px-1 py-3" style={{ width: "100%", maxWidth: n * (MAX_COL + GAP) + 16 }}>
        <div
          role="list"
          aria-label="Bars"
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${n}, minmax(${MIN_COL}px, 1fr))`,
            columnGap: GAP,
            minWidth: n * (MIN_COL + GAP),
          }}
        >
          {b && bTo >= bFrom ? (
            <div
              aria-hidden="true"
              data-band={b.tone || "window"}
              className={cn("-mx-0.5 pointer-events-none", bandClass(b.tone))}
              style={{ gridRow: 1, gridColumn: `${bFrom + 1} / ${bTo + 2}` }}
            />
          ) : null}
          {list.map((bar, i) => {
            const tone = toneName(bar.tone);
            const value = num(bar.value);
            const fill = num(bar.fill);
            const label = `${show(bar.value)}${fill ? `, water ${fill}` : ""}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}`;
            return (
              <div
                key={i}
                role="listitem"
                data-index={i}
                data-tone={tone}
                aria-label={label}
                title={label}
                className="flex min-w-0 flex-col items-center justify-end"
                style={{ gridRow: 1, gridColumn: i + 1, height: PLOT_H }}
              >
                <span className="max-w-full truncate font-mono text-micro leading-none tabular-nums text-fg">
                  {show(bar.value)}
                  {fill ? <span className="text-info">+{fill}</span> : null}
                </span>
                {fill ? (
                  <div
                    data-fill={fill}
                    aria-hidden="true"
                    className="w-full border-x border-t border-dashed border-info bg-info-soft"
                    style={{ height: `${pct(fill)}%`, minHeight: 2 }}
                  />
                ) : null}
                <div
                  data-bar={value}
                  className={cn("w-full", toneClass(tone))}
                  style={{ height: `${pct(value)}%`, minHeight: 2 }}
                />
              </div>
            );
          })}
          <div aria-hidden="true" className="h-px bg-border-strong" style={{ gridRow: 2, gridColumn: `1 / ${n + 1}` }} />
          {list.map((_bar, i) => (
            <span
              key={`i${i}`}
              aria-hidden="true"
              className="pt-1 text-center font-mono text-micro tabular-nums text-fg-dim"
              style={{ gridRow: 3, gridColumn: i + 1 }}
            >
              {i}
            </span>
          ))}
          {[...byIndex.entries()].map(([i, ps]) => (
            <div
              key={`p${i}`}
              data-pointer-index={i}
              className="flex min-w-0 flex-col items-center pt-0.5"
              style={{ gridRow: 4, gridColumn: i + 1 }}
            >
              {ps.map((p, k) => (
                <span key={k} data-role={p.role} className={cn("flex flex-col items-center font-mono text-small font-bold leading-tight", roleClass(p.role))}>
                  {k === 0 ? <ChevronUp size={14} strokeWidth={2} aria-hidden="true" /> : null}
                  <span className="max-w-full truncate">{p.label}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
