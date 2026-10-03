import * as React from "react";
import { cn } from "@/lib/utils";
import { toneClass, toneName } from "./tones";

function Block({ title, children }) {
  return (
    <section className="grid gap-2 border border-border bg-surface p-3">
      <h2 className="font-mono text-label uppercase text-fg-muted">{title}</h2>
      {children}
    </section>
  );
}

const fmt = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));

export function Legend({ legend }) {
  if (!legend || !legend.length) return null;
  return (
    <Block title="Legend">
      <ul className="grid gap-1.5">
        {legend.map((l, i) => (
          <li key={i} className="flex items-center gap-2 font-mono text-small text-fg">
            <span aria-hidden="true" data-legend-tone={toneName(l.tone)} className={cn("inline-block size-4 shrink-0", toneClass(l.tone))} />
            {l.label}
          </li>
        ))}
      </ul>
    </Block>
  );
}

/** Variables (step.vars, if the generator records them), stats and legend. */
export default function Inspector({ step, stats, legend, strip }) {
  const vars = step && step.vars && typeof step.vars === "object" ? Object.entries(step.vars) : [];
  return (
    <div className={cn("grid content-start gap-3", strip && "sm:grid-cols-3")} data-inspector="">
      {vars.length ? (
        <Block title="Variables">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-small">
            {vars.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-fg-muted">{k}</dt>
                <dd className="min-w-0 break-words text-right tabular-nums text-fg">{fmt(v)}</dd>
              </React.Fragment>
            ))}
          </dl>
        </Block>
      ) : null}
      {stats && stats.length ? (
        <Block title="Stats">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-small">
            {stats.map((s) => (
              <React.Fragment key={s.label}>
                <dt className="text-fg-muted">{s.label}</dt>
                <dd className="flex items-center justify-end gap-2 tabular-nums text-fg">
                  {s.tone && s.tone !== "idle" ? (
                    <span aria-hidden="true" className={cn("inline-block size-2.5", toneClass(s.tone))} />
                  ) : null}
                  {fmt(s.value)}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </Block>
      ) : null}
      <Legend legend={legend} />
    </div>
  );
}
