import * as React from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { bandClass, roleClass, toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * ArrayStage (array): arrays, strings and scalars. Cells scale to fit the
 * stage (grid columns, no DOM measurement); horizontal scroll is the last
 * resort once cells hit the minimum width.
 *
 * @param {{ value: *, tone?: string, sub?: string }[]} cells
 * @param {{ index: number, label: string, role: 1|2|3 }[]} [pointers]
 *        coloured by role (P1 accent-ink, P2 info, P3 viz-write); the label
 *        is always shown. Pointers belong to the first row.
 * @param {{ from: number, to: number, tone: string }} [band]  range behind the first row
 * @param {{ label: string, cells: { value, tone?, sub? }[] }[]} [rows]
 *        extra parallel arrays (e.g. input + result), same column grid
 */
const MIN_CELL = 30;
const MAX_CELL = 72;
const GAP = 4;

function Row({ label, cells, pointers, band, n, dense }) {
  const inRange = (i) => Number.isInteger(i) && i >= 0 && i < cells.length;
  const ptrs = (pointers || []).filter((p) => p && inRange(p.index));
  const byIndex = new Map();
  ptrs.forEach((p) => byIndex.set(p.index, [...(byIndex.get(p.index) || []), p]));
  const b = band && inRange(band.from) && Number.isInteger(band.to) ? band : null;
  const bFrom = b ? Math.max(0, b.from) : 0;
  const bTo = b ? Math.min(cells.length - 1, b.to) : 0;

  return (
    <div className="grid gap-1" data-row={label || "main"}>
      {label ? <p className="font-mono text-label uppercase text-fg-muted">{label}</p> : null}
      <div
        role="list"
        aria-label={label || "Array"}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${n}, minmax(${MIN_CELL}px, 1fr))`,
          columnGap: GAP,
          minWidth: n * (MIN_CELL + GAP),
        }}
      >
        {b && bTo >= bFrom ? (
          <div
            aria-hidden="true"
            data-band={b.tone || "window"}
            className={cn("-mx-0.5 -my-1.5 pointer-events-none", bandClass(b.tone))}
            style={{ gridRow: 1, gridColumn: `${bFrom + 1} / ${bTo + 2}` }}
          />
        ) : null}
        {cells.map((c, i) => {
          const tone = toneName(c.tone);
          const text = c.value == null ? "" : String(c.value);
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
        {cells.map((_c, i) => (
          <span
            key={`i${i}`}
            aria-hidden="true"
            className="pt-1 text-center font-mono text-micro tabular-nums text-fg-dim"
            style={{ gridRow: 2, gridColumn: i + 1 }}
          >
            {i}
          </span>
        ))}
        {[...byIndex.entries()].map(([i, list]) => (
          <div
            key={`p${i}`}
            data-pointer-index={i}
            className="flex min-w-0 flex-col items-center pt-0.5"
            style={{ gridRow: 3, gridColumn: i + 1 }}
          >
            {list.map((p, k) => (
              <span key={k} data-role={p.role} className={cn("flex flex-col items-center font-mono text-small font-bold leading-tight", roleClass(p.role))}>
                {k === 0 ? <ChevronUp size={14} strokeWidth={2} aria-hidden="true" /> : null}
                <span className="max-w-full truncate">{p.label}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ArrayStage({ cells = [], pointers, band, rows }) {
  const extra = Array.isArray(rows) ? rows : [];
  const primary = cells.length ? { label: "", cells } : null;
  const all = [primary, ...extra.map((r) => ({ label: r.label, cells: r.cells || [] }))].filter(Boolean);
  const n = Math.max(1, ...all.map((r) => r.cells.length));
  const dense = n > 14;
  return (
    <div className="overflow-x-auto" data-stage="array">
      <div className="mx-auto grid gap-5 px-1 py-3" style={{ width: "100%", maxWidth: n * (MAX_CELL + GAP) + 16 }}>
        {all.map((r, k) => (
          <Row
            key={k}
            label={r.label}
            cells={r.cells}
            pointers={k === 0 ? pointers : undefined}
            band={k === 0 ? band : undefined}
            n={n}
            dense={dense}
          />
        ))}
        {all.length === 0 ? <p className="font-mono text-small text-fg-muted">Nothing to show.</p> : null}
      </div>
    </div>
  );
}
