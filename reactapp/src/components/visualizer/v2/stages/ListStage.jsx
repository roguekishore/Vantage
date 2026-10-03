import * as React from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleClass, toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * ListStage (list): linked lists, doubly linked lists, cycles. Nodes sit on
 * one row; edges are SVG paths computed from node order (no DOM measurement):
 * adjacent forward edges run straight above the midline, adjacent backward
 * edges below it, longer or `curved` edges arc over (forward) or under
 * (backward) the row. The whole figure scales with the stage width (nodes
 * are percentage-positioned HTML so text stays a fixed readable size);
 * horizontal scroll is the last resort below the minimum width.
 *
 * @param {{ id, value, tone?: string }[]} nodes
 * @param {{ from, to, tone?: string, curved?: boolean }[]} edges
 * @param {{ nodeId, label: string, role: 1|2|3 }[]} [pointers]
 */
const NODE_W = 60;
const NODE_H = 44;
const GAP = 44;
const MIN_NODE_PX = 44; // narrowest rendered node before scrolling
const MIN_SCALE = MIN_NODE_PX / NODE_W; // viewBox -> px at the minimum width

/** Edge tone -> SVG stroke colour (CSS vars only) and dash pattern. */
const EDGE_STROKE = {
  idle: "var(--fg-dim)",
  active: "var(--accent-ink)",
  compare: "var(--warn)",
  write: "var(--viz-write)",
  done: "var(--fg-dim)",
  success: "var(--ok)",
  error: "var(--err)",
  window: "var(--info)",
  dim: "var(--fg-dim)",
};
const EDGE_DASH = { compare: "6 3", error: "2 3" };

function edgePath(ai, bi, curved, n) {
  const cx = (i) => i * (NODE_W + GAP) + NODE_W / 2;
  const left = (i) => i * (NODE_W + GAP);
  const right = (i) => left(i) + NODE_W;
  if (ai === bi) {
    // self loop above the node
    const x = cx(ai);
    return { d: `M ${x - 10} 0 C ${x - 22} -26, ${x + 22} -26, ${x + 10} 0`, dir: -1, depth: 26 };
  }
  const fwd = bi > ai;
  const span = Math.abs(bi - ai);
  if (span === 1 && !curved) {
    const y = fwd ? NODE_H / 2 - 7 : NODE_H / 2 + 7;
    const x1 = fwd ? right(ai) : left(ai);
    const x2 = fwd ? left(bi) : right(bi);
    return { d: `M ${x1} ${y} L ${x2} ${y}`, dir: 0, depth: 0 };
  }
  // arc: forward over the top, backward under the bottom
  const depth = Math.min(22 + span * 12, 22 + Math.max(1, n) * 12);
  const x1 = cx(ai);
  const x2 = cx(bi);
  if (fwd) return { d: `M ${x1} 0 C ${x1} ${-depth}, ${x2} ${-depth}, ${x2} 0`, dir: -1, depth };
  return { d: `M ${x1} ${NODE_H} C ${x1} ${NODE_H + depth}, ${x2} ${NODE_H + depth}, ${x2} ${NODE_H}`, dir: 1, depth };
}

export default function ListStage({ nodes, edges, pointers }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const list = Array.isArray(nodes) ? nodes.filter(Boolean) : [];
  if (list.length === 0) {
    return (
      <div data-stage="list" className="px-1 py-3">
        <p className="font-mono text-small text-fg-muted">Nothing to show.</p>
      </div>
    );
  }
  const index = new Map();
  list.forEach((nd, i) => index.set(nd.id, i));
  const n = list.length;

  const drawn = [];
  (Array.isArray(edges) ? edges : []).forEach((e, k) => {
    if (!e || !index.has(e.from) || !index.has(e.to)) return;
    const p = edgePath(index.get(e.from), index.get(e.to), !!e.curved, n);
    drawn.push({ ...p, e, k, tone: toneName(e.tone) });
  });
  const top = 8 + drawn.reduce((m, p) => (p.dir < 0 ? Math.max(m, p.depth) : m), 0);
  const bottom = 8 + drawn.reduce((m, p) => (p.dir > 0 ? Math.max(m, p.depth) : m), 0);

  const ptrs = (Array.isArray(pointers) ? pointers : []).filter((p) => p && index.has(p.nodeId));
  const byNode = new Map();
  ptrs.forEach((p) => byNode.set(p.nodeId, [...(byNode.get(p.nodeId) || []), p]));

  const W = n * NODE_W + (n - 1) * GAP;
  const H = top + NODE_H + bottom;
  const maxStack = [...byNode.values()].reduce((m, g) => Math.max(m, g.length), 0);
  // pointer row is in normal flow: fixed px, 14px chevron + 16px per label
  const pointerRowH = maxStack ? 14 + maxStack * 16 + 4 : 0;
  const pct = (v, total) => `${(v / total) * 100}%`;
  const dense = n > 12;

  return (
    <div className="overflow-x-auto" data-stage="list">
      <div className="mx-auto px-1 py-3" style={{ width: "100%", minWidth: Math.ceil(n * (MIN_NODE_PX + GAP * MIN_SCALE)) + 8, maxWidth: W * 1.4 }}>
        <div role="list" aria-label="Linked list" className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg
            aria-hidden="true"
            viewBox={`0 ${-top} ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              {Object.keys(EDGE_STROKE).map((t) => (
                <marker key={t} id={`${uid}-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_STROKE[t]} />
                </marker>
              ))}
            </defs>
            {drawn.map((p) => (
              <path
                key={p.k}
                d={p.d}
                fill="none"
                data-edge={`${p.e.from}->${p.e.to}`}
                data-tone={p.tone}
                stroke={EDGE_STROKE[p.tone]}
                strokeWidth={p.tone === "active" || p.tone === "write" || p.tone === "success" ? 2.5 : 1.5}
                strokeDasharray={EDGE_DASH[p.tone]}
                opacity={p.tone === "dim" ? 0.35 : 1}
                markerEnd={`url(#${uid}-${p.tone})`}
              />
            ))}
          </svg>
          {list.map((nd, i) => {
            const tone = toneName(nd.tone);
            const text = nd.value == null ? "" : String(nd.value);
            return (
              <div
                key={`${nd.id}-${i}`}
                role="listitem"
                data-node={String(nd.id)}
                data-tone={tone}
                aria-label={`${text}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}`}
                title={text}
                className={cn(
                  "absolute flex min-w-0 items-center justify-center overflow-hidden px-0.5 font-mono tabular-nums",
                  dense ? "text-small" : "text-body",
                  toneClass(tone)
                )}
                style={{
                  left: pct(i * (NODE_W + GAP), W),
                  width: pct(NODE_W, W),
                  top: pct(top, H),
                  height: pct(NODE_H, H),
                }}
              >
                <span className="max-w-full truncate">{text}</span>
              </div>
            );
          })}
        </div>
        {pointerRowH > 0 ? (
          <div className="relative w-full" style={{ height: pointerRowH }} data-pointer-row>
          {[...byNode.entries()].map(([id, group]) => {
            const i = index.get(id);
            return (
              <div
                key={`p${String(id)}`}
                data-pointer-node={String(id)}
                className="absolute flex flex-col items-center"
                style={{
                  left: pct(i * (NODE_W + GAP) - 10, W),
                  width: pct(NODE_W + 20, W),
                  top: 0,
                }}
              >
                {group.map((p, k) => (
                  <span key={k} data-role={p.role} className={cn("flex flex-col items-center font-mono text-small font-bold leading-tight", roleClass(p.role))}>
                    {k === 0 ? <ChevronUp size={14} strokeWidth={2} aria-hidden="true" /> : null}
                    <span className="max-w-full truncate">{p.label}</span>
                  </span>
                ))}
              </div>
            );
          })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
