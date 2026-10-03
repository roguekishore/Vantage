import * as React from "react";
import { cn } from "@/lib/utils";
import { toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * MatrixStage (matrix): DP tables, boards and grids. Columns scale to fit the
 * stage (grid tracks, no DOM measurement); horizontal scroll is the last
 * resort once cells hit the minimum width.
 *
 * @param {{ value: *, tone?: string }[][]} cells
 * @param {*[]} [rowHeaders]
 * @param {*[]} [colHeaders]
 * @param {[number, number]} [active]  [r, c] the cell the step writes; shown
 *        as the active tone with a "now" marker
 * @param {[number, number][]} [deps]  [r, c] cells this one depends on; shown
 *        with a dashed info outline and a "dep" marker
 */
const MIN_CELL = 32;
const MAX_CELL = 64;
const GAP = 2;
const HEAD_W = 36;

const isPos = (p) => Array.isArray(p) && Number.isInteger(p[0]) && Number.isInteger(p[1]);
const txt = (v) => (v == null ? "" : String(v));

export default function MatrixStage({ cells, rowHeaders, colHeaders, active, deps }) {
  const grid = Array.isArray(cells) ? cells.map((r) => (Array.isArray(r) ? r : [])) : [];
  const rows = grid.length;
  const cols = Math.max(0, ...grid.map((r) => r.length), Array.isArray(colHeaders) ? colHeaders.length : 0);
  if (rows === 0 || cols === 0) {
    return (
      <div data-stage="matrix">
        <p className="px-1 py-3 font-mono text-small text-fg-muted">Nothing to show.</p>
      </div>
    );
  }
  const hasRowH = Array.isArray(rowHeaders) && rowHeaders.length > 0;
  const hasColH = Array.isArray(colHeaders) && colHeaders.length > 0;
  const act = isPos(active) ? active : null;
  const depKey = new Set((Array.isArray(deps) ? deps : []).filter(isPos).map((d) => `${d[0]},${d[1]}`));
  const dense = cols > 10 || rows > 10;
  const offset = hasRowH ? 2 : 1; // grid column of the first cell
  const top = hasColH ? 2 : 1; // grid row of the first cell

  return (
    <div className="overflow-x-auto" data-stage="matrix">
      <div
        className="mx-auto px-1 py-3"
        style={{ width: "100%", maxWidth: cols * (MAX_CELL + GAP) + (hasRowH ? HEAD_W : 0) + 16 }}
      >
        <div
          role="table"
          aria-label="Matrix"
          className="grid"
          style={{
            gridTemplateColumns: `${hasRowH ? `${HEAD_W}px ` : ""}repeat(${cols}, minmax(${MIN_CELL}px, 1fr))`,
            gap: GAP,
            minWidth: cols * (MIN_CELL + GAP) + (hasRowH ? HEAD_W : 0),
          }}
        >
          {hasColH
            ? Array.from({ length: cols }, (_x, c) => (
                <span
                  key={`c${c}`}
                  role="columnheader"
                  data-col-header={c}
                  className="truncate pb-0.5 text-center font-mono text-micro tabular-nums text-fg-dim"
                  style={{ gridRow: 1, gridColumn: c + offset }}
                  title={txt(colHeaders[c])}
                >
                  {txt(colHeaders[c])}
                </span>
              ))
            : null}
          {hasRowH
            ? Array.from({ length: rows }, (_x, r) => (
                <span
                  key={`r${r}`}
                  role="rowheader"
                  data-row-header={r}
                  className="flex items-center justify-end truncate pr-1 font-mono text-micro tabular-nums text-fg-dim"
                  style={{ gridRow: r + top, gridColumn: 1 }}
                  title={txt(rowHeaders[r])}
                >
                  {txt(rowHeaders[r])}
                </span>
              ))
            : null}
          {grid.map((row, r) =>
            Array.from({ length: cols }, (_x, c) => {
              const cell = row[c];
              if (cell === undefined) return null;
              const isObj = cell !== null && typeof cell === "object";
              const isActive = !!act && act[0] === r && act[1] === c;
              const isDep = depKey.has(`${r},${c}`);
              const tone = isActive ? "active" : toneName(isObj ? cell.tone : undefined);
              const text = txt(isObj ? cell.value : cell);
              const flag = isActive ? "now" : isDep ? "dep" : "";
              return (
                <div
                  key={`${r}-${c}`}
                  role="cell"
                  data-tone={tone}
                  data-r={r}
                  data-c={c}
                  data-active={isActive ? "true" : undefined}
                  data-dep={isDep ? "true" : undefined}
                  aria-label={`row ${r + 1}, column ${c + 1}: ${text}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}${isDep ? ", dependency" : ""}`}
                  title={text}
                  className={cn(
                    "relative flex h-10 min-w-0 items-center justify-center overflow-hidden px-0.5 font-mono tabular-nums",
                    dense ? "text-small" : "text-body",
                    toneClass(tone),
                    isDep && !isActive && "outline outline-2 -outline-offset-2 outline-dashed outline-info"
                  )}
                  style={{ gridRow: r + top, gridColumn: c + offset }}
                >
                  <span className="max-w-full truncate leading-tight">{text}</span>
                  {flag ? (
                    <span aria-hidden="true" className="absolute right-0.5 top-0 text-micro leading-none opacity-80">
                      {flag}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
