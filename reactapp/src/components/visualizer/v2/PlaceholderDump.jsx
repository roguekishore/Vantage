import * as React from "react";

/*
 * Readable fallback for stage and aux kinds that are not built yet (W7 units
 * replace each placeholder's body). Token-styled mono dump of the props.
 */
function replacer(_k, v) {
  return typeof v === "function" ? "[function]" : v;
}

export default function PlaceholderDump({ kind, props }) {
  let text;
  try {
    text = JSON.stringify(props, replacer, 1);
  } catch (e) {
    text = String(props);
  }
  return (
    <div data-stage-placeholder={kind} className="grid gap-2 border border-dashed border-border-strong bg-surface p-3">
      <p className="font-mono text-label uppercase text-fg-muted">{kind} (placeholder)</p>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-small text-fg">{text}</pre>
    </div>
  );
}
