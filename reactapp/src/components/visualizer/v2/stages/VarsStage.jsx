import * as React from "react";
import { cn } from "@/lib/utils";
import { toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * VarsStage (vars): scalar-heavy math pages. One tile per variable, laid out
 * in an auto-fit grid (no DOM measurement) so it reads in the 360px embedded
 * mode and at full width. Long values truncate with the full text in `title`.
 *
 * @param {{ name: string, value: *, tone?: string }[]} vars
 */
function fmt(v) {
  if (v == null) return "-";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch (_e) {
      return String(v);
    }
  }
  return String(v);
}

export default function VarsStage({ vars }) {
  const list = (Array.isArray(vars) ? vars : []).filter((v) => v && typeof v === "object");
  return (
    <div className="px-1 py-3" data-stage="vars">
      {list.length === 0 ? (
        <p className="font-mono text-small text-fg-muted">Nothing to show.</p>
      ) : (
        <div role="list" aria-label="Variables" className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))" }}>
          {list.map((v, i) => {
            const tone = toneName(v.tone);
            const text = fmt(v.value);
            const name = v.name == null ? "" : String(v.name);
            return (
              <div
                key={`${name}-${i}`}
                role="listitem"
                data-var={name}
                data-tone={tone}
                aria-label={`${name} = ${text}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}`}
                title={`${name} = ${text}`}
                className={cn("flex min-w-0 flex-col gap-1 px-3 py-2 font-mono", toneClass(tone))}
              >
                <span className="max-w-full truncate text-label uppercase opacity-80">{name}</span>
                <span className="max-w-full truncate text-h3 font-bold leading-tight tabular-nums">{text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
