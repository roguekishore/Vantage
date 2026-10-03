import * as React from "react";
import { toneName, TONE_LABEL } from "../tones";

/**
 * GraphStage (graph): nodes and weighted edges drawn as SVG on a fixed
 * viewBox that scales to the stage width (no DOM measurement). Layout is
 * deterministic and local: nodes with numeric x/y keep them (rescaled into the
 * box), the rest sit on a circle in input order. State is never colour alone:
 * active = inner ring, compare = dashed, error = dotted, write = bold,
 * done = dim text, dim = 35% opacity; every node carries an aria-label.
 *
 * @param {{ id, label, tone?: string, x?: number, y?: number }[]} nodes
 * @param {{ from, to, weight?: number, tone?: string }[]} edges
 * @param {boolean} directed
 */
const W = 480;
const H = 360;
const R = 28; // fits 6 mono chars at 14 units (50.4 < 56 diameter)
const MIN_W = 360; // svg min px width: scale >= 0.75, so 14-unit text >= 10.5px, 15-unit weights >= 11.25px
const PAD = R + 14;

const NODE = {
  idle: { fill: "var(--elevated)", stroke: "var(--border-strong)", text: "var(--fg)", sw: 1 },
  active: { fill: "var(--accent)", stroke: "var(--accent-edge)", text: "var(--on-accent)", sw: 1 },
  compare: { fill: "var(--warn-soft)", stroke: "var(--warn)", text: "var(--fg)", sw: 2, dash: "4 3" },
  write: { fill: "var(--elevated)", stroke: "var(--viz-write)", text: "var(--viz-write)", sw: 2, bold: true },
  done: { fill: "var(--surface)", stroke: "var(--border)", text: "var(--fg-dim)", sw: 1 },
  success: { fill: "var(--ok-soft)", stroke: "var(--ok)", text: "var(--fg)", sw: 2 },
  error: { fill: "var(--err-soft)", stroke: "var(--err)", text: "var(--fg)", sw: 2, dash: "1.5 3" },
  window: { fill: "var(--info-soft)", stroke: "var(--info)", text: "var(--fg)", sw: 1 },
  dim: { fill: "var(--elevated)", stroke: "var(--border)", text: "var(--fg)", sw: 1, opacity: 0.35 },
};
const EDGE = {
  idle: { stroke: "var(--fg-dim)", sw: 1 },
  active: { stroke: "var(--accent-ink)", sw: 2 },
  compare: { stroke: "var(--warn)", sw: 2, dash: "4 3" },
  write: { stroke: "var(--viz-write)", sw: 2 },
  done: { stroke: "var(--border-strong)", sw: 1 },
  success: { stroke: "var(--ok)", sw: 2 },
  error: { stroke: "var(--err)", sw: 2, dash: "1.5 3" },
  window: { stroke: "var(--info)", sw: 1 },
  dim: { stroke: "var(--fg-dim)", sw: 1, opacity: 0.35 },
};

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/** Deterministic layout: given coords (rescaled) else circular. Returns Map id -> {x, y}. */
export function layoutGraph(nodes) {
  const pos = new Map();
  const placed = nodes.filter((n) => isNum(n.x) && isNum(n.y));
  let minX = 0, maxX = 1, minY = 0, maxY = 1;
  if (placed.length) {
    minX = Math.min(...placed.map((n) => n.x));
    maxX = Math.max(...placed.map((n) => n.x));
    minY = Math.min(...placed.map((n) => n.y));
    maxY = Math.max(...placed.map((n) => n.y));
  }
  const spanX = maxX - minX, spanY = maxY - minY;
  const kx = spanX > 0 ? (W - 2 * PAD) / spanX : Infinity;
  const ky = spanY > 0 ? (H - 2 * PAD) / spanY : Infinity;
  const k = Math.min(kx, ky); // one uniform scale keeps the given aspect
  const cxm = (minX + maxX) / 2, cym = (minY + maxY) / 2;
  const free = nodes.filter((n) => !(isNum(n.x) && isNum(n.y)));
  nodes.forEach((n) => {
    if (isNum(n.x) && isNum(n.y)) {
      pos.set(n.id, { x: Number.isFinite(k) ? W / 2 + (n.x - cxm) * k : W / 2, y: Number.isFinite(k) ? H / 2 + (n.y - cym) * k : H / 2 });
    }
  });
  free.forEach((n, k) => {
    if (free.length === 1 && !placed.length) return pos.set(n.id, { x: W / 2, y: H / 2 });
    const a = -Math.PI / 2 + (2 * Math.PI * k) / free.length;
    pos.set(n.id, { x: W / 2 + (W / 2 - PAD) * Math.cos(a), y: H / 2 + (H / 2 - PAD) * Math.sin(a) });
  });
  return pos;
}

function Edge({ e, a, b, directed, curved }) {
  const tone = toneName(e.tone);
  const st = EDGE[tone];
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) {
    // self loop above the node
    const d = `M ${a.x - 8} ${a.y - R} C ${a.x - 30} ${a.y - R - 40}, ${a.x + 30} ${a.y - R - 40}, ${a.x + 8} ${a.y - R}`;
    return (
      <g data-edge-tone={tone} opacity={st.opacity}>
        <path d={d} fill="none" stroke={st.stroke} strokeWidth={st.sw} strokeDasharray={st.dash} />
        {e.weight != null ? <text x={a.x} y={a.y - R - 24} textAnchor="middle" className="font-mono" fontSize="15" fill="var(--fg)">{String(e.weight)}</text> : null}
      </g>
    );
  }
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const bend = curved ? 26 : 0;
  const mx = (a.x + b.x) / 2 + nx * bend, my = (a.y + b.y) / 2 + ny * bend;
  // control point so the curve passes through (mx,my)
  const cx = 2 * mx - (a.x + b.x) / 2, cy = 2 * my - (a.y + b.y) / 2;
  const sd = (px, py, qx, qy) => {
    const l = Math.hypot(qx - px, qy - py) || 1;
    return [(qx - px) / l, (qy - py) / l];
  };
  const [sx, sy] = sd(a.x, a.y, cx, cy);
  const [tx, ty] = sd(b.x, b.y, cx, cy);
  const x1 = a.x + sx * R, y1 = a.y + sy * R;
  const tipGap = directed ? R + 1 : R;
  const x2 = b.x + tx * tipGap, y2 = b.y + ty * tipGap;
  const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  let head = null;
  if (directed) {
    const hx = -tx, hy = -ty; // direction of travel at tip
    const hl = 9, hw = 4.5;
    const bx = x2 - hx * hl, by = y2 - hy * hl;
    head = <polygon points={`${x2},${y2} ${bx - hy * hw},${by + hx * hw} ${bx + hy * hw},${by - hx * hw}`} fill={st.stroke} />;
  }
  // label at curve midpoint (t = .5 on a quadratic)
  const lx = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
  const ly = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
  const w = e.weight == null ? "" : String(e.weight);
  return (
    <g data-edge-tone={tone} opacity={st.opacity}>
      <path d={path} fill="none" stroke={st.stroke} strokeWidth={st.sw} strokeDasharray={st.dash} />
      {head}
      {w ? (
        <g data-weight={w}>
          <rect x={lx - 4 - w.length * 4.5} y={ly - 10} width={8 + w.length * 9} height={20} fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
          <text x={lx} y={ly + 5} textAnchor="middle" className="font-mono tabular-nums" fontSize="15" fill="var(--fg)">{w}</text>
        </g>
      ) : null}
    </g>
  );
}

export default function GraphStage({ nodes, edges, directed = false }) {
  const ns = (Array.isArray(nodes) ? nodes : []).filter((n) => n && n.id != null);
  const es = Array.isArray(edges) ? edges : [];
  if (!ns.length) return <p className="py-3 font-mono text-small text-fg-muted" data-stage="graph">Nothing to show.</p>;
  const pos = layoutGraph(ns);
  const has = new Set(es.map((e) => `${e?.from}>${e?.to}`));
  const drawn = es.filter((e) => e && pos.has(e.from) && pos.has(e.to));
  return (
    <div className="mx-auto w-full overflow-x-auto" style={{ maxWidth: 640, minWidth: 0 }} data-stage="graph">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Graph, ${ns.length} nodes, ${drawn.length} edges${directed ? ", directed" : ""}`} className="block h-auto w-full" style={{ minWidth: MIN_W }}>
        <g>
          {drawn.map((e, i) => (
            <Edge key={i} e={e} a={pos.get(e.from)} b={pos.get(e.to)} directed={directed} curved={directed && e.from !== e.to && has.has(`${e.to}>${e.from}`)} />
          ))}
        </g>
        <g>
          {ns.map((n) => {
            const { x, y } = pos.get(n.id);
            const tone = toneName(n.tone);
            const st = NODE[tone];
            const text = n.label == null ? String(n.id) : String(n.label);
            return (
              <g key={String(n.id)} data-node={String(n.id)} data-tone={tone} opacity={st.opacity} role="img" aria-label={`${text}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}`}>
                <circle cx={x} cy={y} r={R} fill={st.fill} stroke={st.stroke} strokeWidth={st.sw} strokeDasharray={st.dash} />
                {tone === "active" ? <circle cx={x} cy={y} r={R - 4} fill="none" stroke="var(--on-accent)" strokeWidth="2" /> : null}
                <text x={x} y={y + 4.5} textAnchor="middle" className="font-mono tabular-nums" fontSize={text.length > 3 ? 14 : 16} fontWeight={st.bold || tone === "active" ? 700 : 400} fill={st.text}>
                  {text.length > 6 ? `${text.slice(0, 5)}…` : text}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
