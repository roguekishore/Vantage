import * as React from "react";
import { cn } from "@/lib/utils";
import { toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * BitsStage (bits): one binary row per value, most significant bit on the
 * left, with the bit position (0 = least significant) under every column so
 * the alignment between rows reads like a XOR / AND worksheet. Columns are a
 * CSS grid that scales to the stage (no DOM measurement); horizontal scroll
 * is the last resort once cells hit the minimum width.
 *
 * @param {{ label: string, value: number, bits: number, bitTone?: (i: number) => string }[]} rows
 *        `bits` is the width (clamped 1..64). Negative values render as
 *        two's complement at that width. `bitTone(i)` receives the bit
 *        POSITION i (0 = LSB, the same number printed under the column) and
 *        returns a tone name (idle when absent or unknown).
 */
const MIN_BIT = 18;
const MIN_BIT_WIDE = 14;
const MAX_BIT = 44;
const GAP = 2;

/** Binary digits of `value` at `width` bits, MSB first; null when not an integer. */
function toDigits(value, width) {
  if (value == null || value === "" || typeof value === "boolean") return null;
  let big;
  try {
    big = BigInt(typeof value === "number" ? Math.trunc(value) : value);
  } catch (_e) {
    return null;
  }
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  const mask = (1n << BigInt(width)) - 1n;
  return (big & mask).toString(2).padStart(width, "0").split("");
}

function normWidth(b) {
  const n = Math.trunc(Number(b));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 64) : 8;
}

function safeTone(row, pos) {
  if (typeof row.bitTone !== "function") return "idle";
  try {
    return toneName(row.bitTone(pos));
  } catch (_e) {
    return "idle";
  }
}

export default function BitsStage({ rows } = {}) {
  const list = (Array.isArray(rows) ? rows : []).filter(Boolean).map((r) => ({ ...r, width: normWidth(r.bits) }));
  const n = Math.max(1, ...list.map((r) => r.width));
  const min = n > 16 ? MIN_BIT_WIDE : MIN_BIT;
  const cols = `repeat(${n}, minmax(${min}px, 1fr))`;
  const minWidth = n * (min + GAP);

  return (
    <div className="overflow-x-auto" data-stage="bits">
      <div className="mx-auto grid gap-5 px-1 py-3" style={{ width: "100%", maxWidth: n * (MAX_BIT + GAP) + 140 }}>
        {list.map((r, k) => {
          const digits = toDigits(r.value, r.width);
          const pad = n - r.width;
          const text = digits ? digits.join("") : "";
          return (
            <div key={k} className="grid gap-1" data-row={r.label ?? k}>
              <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-small text-fg-muted">
                <span className="uppercase text-label">{r.label}</span>
                <span className="tabular-nums text-fg" data-testid="bits-value">
                  {r.value == null ? "-" : String(r.value)}
                </span>
              </p>
              <div
                role="list"
                aria-label={`${r.label ?? "Bits"}: ${text || "no value"}`}
                className="grid"
                style={{ gridTemplateColumns: cols, columnGap: GAP, minWidth }}
              >
                {Array.from({ length: n }, (_x, c) => {
                  const pos = n - 1 - c; // bit position of this column
                  const inRow = c >= pad;
                  if (!inRow) return <span key={c} aria-hidden="true" style={{ gridRow: 1, gridColumn: c + 1 }} />;
                  const bit = digits ? digits[c - pad] : "-";
                  const tone = safeTone(r, pos);
                  return (
                    <div
                      key={c}
                      role="listitem"
                      data-tone={tone}
                      data-bit={bit}
                      data-pos={pos}
                      aria-label={`bit ${pos} = ${bit}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}`}
                      className={cn(
                        "flex h-10 min-w-0 items-center justify-center overflow-hidden font-mono text-body tabular-nums",
                        bit === "1" && tone === "idle" && "font-bold",
                        toneClass(tone)
                      )}
                      style={{ gridRow: 1, gridColumn: c + 1 }}
                    >
                      {bit}
                    </div>
                  );
                })}
                {Array.from({ length: n }, (_x, c) => (
                  <span
                    key={`p${c}`}
                    aria-hidden="true"
                    className="pt-1 text-center font-mono text-micro tabular-nums text-fg-dim"
                    style={{ gridRow: 2, gridColumn: c + 1 }}
                  >
                    {n - 1 - c}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {list.length === 0 ? <p className="font-mono text-small text-fg-muted">Nothing to show.</p> : null}
      </div>
    </div>
  );
}
