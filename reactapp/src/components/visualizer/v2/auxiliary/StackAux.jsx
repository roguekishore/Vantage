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
 * StackAux (stack). Items are passed top first; the top is labelled in text.
 *
 * @param {{ value: *, sub?: string, tone?: string }[]} items  top first
 */
export default function StackAux({ items: rawItems }) {
  const items = clean(rawItems);
  if (!items.length) return <p className="font-mono text-small text-fg-muted">Empty stack.</p>;
  return (
    <ol role="list" aria-label="Stack, top first" className="grid gap-1">
      {items.map((it, i) => (
        <li
          key={i}
          data-stack-item={i}
          data-tone={toneName(it.tone)}
          aria-label={`${i === 0 ? "top, " : ""}${show(it.value)}${it.sub ? `, ${it.sub}` : ""}`}
          className={`flex min-w-0 items-center gap-2 px-2 py-1 font-mono text-small tabular-nums ${toneClass(it.tone)}`}
        >
          <span className="min-w-0 flex-1 truncate">{show(it.value)}</span>
          {it.sub ? <span className="text-micro opacity-80">{it.sub}</span> : null}
          {i === 0 ? <span data-top className="text-micro font-bold uppercase">top</span> : null}
        </li>
      ))}
    </ol>
  );
}
