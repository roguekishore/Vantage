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
 * TableAux (table). Hash map / set / frequency table: key then value.
 *
 * @param {{ key: *, value: *, tone?: string }[]} entries
 */
export default function TableAux({ entries: rawEntries }) {
  const entries = clean(rawEntries);
  if (!entries.length) return <p className="font-mono text-small text-fg-muted">Empty table.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-small tabular-nums">
        <thead>
          <tr className="text-left text-micro uppercase text-fg-muted">
            <th scope="col" className="border border-border px-2 py-1 font-normal">key</th>
            <th scope="col" className="border border-border px-2 py-1 font-normal">value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i} data-entry={i} data-tone={toneName(e.tone)} className={toneClass(e.tone)}>
              <td className="px-2 py-1">{show(e.key)}</td>
              <td className="px-2 py-1">{show(e.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
