import * as React from "react";
import { cn } from "@/lib/utils";
import { toneClass, toneName, TONE_LABEL } from "../tones";

/**
 * TreeStage (tree): binary or n-ary trees. Layout is computed from the tree
 * shape only (in-order slots for binary nodes, centred over children
 * otherwise); positions are percentages, so there is no DOM measurement. The
 * stage scales to its width, with horizontal scroll as the last resort once
 * slots reach the minimum width.
 *
 * @param {TreeNode|null} root  node with `val | value | key | label | name`
 *        and `left`/`right` (or `children`)
 * @param {(node) => TreeNode[]} [getChildren]  overrides the child lookup
 * @param {(node) => string} [nodeTone]  returns a Tone
 * @param {(node) => string} [edgeTone]  tone of the edge from parent to node
 * @param {(node) => string} [badges]    small text under the node (range, balance)
 */
const NODE = 40;
const LEVEL_H = 72;
const MIN_SLOT = 44;
const MAX_SLOT = 72;
const MAX_DEPTH = 64;
const MAX_NODES = 600;

const EDGE_STROKE = {
  idle: "var(--border-strong)",
  active: "var(--accent-ink)",
  compare: "var(--warn)",
  write: "var(--viz-write)",
  done: "var(--fg-dim)",
  success: "var(--ok)",
  error: "var(--err)",
  window: "var(--info)",
  dim: "var(--border-strong)",
};
const EDGE_DASH = { compare: "5 3", error: "2 3" };

export function nodeLabel(node) {
  if (node == null) return "";
  if (typeof node !== "object") return String(node);
  for (const k of ["val", "value", "key", "label", "name", "data"]) {
    if (node[k] != null) return String(node[k]);
  }
  return "";
}

const safe = (fn, arg, fallback) => {
  if (typeof fn !== "function") return fallback;
  try {
    const r = fn(arg);
    return r == null ? fallback : r;
  } catch {
    return fallback;
  }
};

/** Child list (may hold null placeholders only for the default left/right shape). */
function childrenOf(node, getChildren) {
  if (typeof getChildren === "function") {
    const r = safe(getChildren, node, []);
    return { kids: Array.isArray(r) ? r.filter((c) => c != null) : [], binary: false };
  }
  if (Array.isArray(node.children)) return { kids: node.children.filter((c) => c != null), binary: false };
  return { kids: [node.left, node.right], binary: true };
}

/** Flatten into nodes/edges with slot (x) and depth (y). */
export function layoutTree(root, getChildren) {
  const nodes = [];
  const edges = [];
  const seen = new Set();
  let slot = 0;
  let maxDepth = 0;

  const walk = (node, depth, parent) => {
    if (node == null || depth > MAX_DEPTH || nodes.length >= MAX_NODES || seen.has(node)) return null;
    seen.add(node);
    const rec = { node, depth, x: 0, id: nodes.length };
    nodes.push(rec);
    maxDepth = Math.max(maxDepth, depth);
    if (parent) edges.push({ from: parent, to: rec });
    const { kids, binary } = childrenOf(node, getChildren);
    if (binary) {
      const l = walk(kids[0], depth + 1, rec);
      rec.x = slot++;
      walk(kids[1], depth + 1, rec);
      void l;
    } else {
      const placed = kids.map((c) => walk(c, depth + 1, rec)).filter(Boolean);
      rec.x = placed.length ? (placed[0].x + placed[placed.length - 1].x) / 2 : slot++;
    }
    return rec;
  };
  walk(root, 0, null);
  return { nodes, edges, slots: Math.max(1, slot), depth: maxDepth + 1 };
}

export default function TreeStage({ root = null, getChildren, nodeTone, edgeTone, badges } = {}) {
  if (root == null) {
    return (
      <div data-stage="tree" className="px-1 py-3">
        <p className="font-mono text-small text-fg-muted">Empty tree.</p>
      </div>
    );
  }
  const { nodes, edges, slots, depth } = layoutTree(root, getChildren);
  const px = (x) => `${((x + 0.5) / slots) * 100}%`;
  const cy = (d) => d * LEVEL_H + NODE / 2 + 2;
  const height = (depth - 1) * LEVEL_H + NODE + 28;

  return (
    <div className="overflow-x-auto" data-stage="tree">
      <div className="mx-auto px-1 py-3" style={{ width: "100%", maxWidth: slots * MAX_SLOT + 16 }}>
        <div role="tree" aria-label="Tree" className="relative" style={{ height, minWidth: slots * MIN_SLOT }}>
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: "visible" }}>
            {edges.map((e) => {
              const tone = toneName(safe(edgeTone, e.to.node, "idle"));
              return (
                <line
                  key={e.to.id}
                  data-edge-tone={tone}
                  x1={px(e.from.x)}
                  y1={cy(e.from.depth)}
                  x2={px(e.to.x)}
                  y2={cy(e.to.depth)}
                  stroke={EDGE_STROKE[tone]}
                  strokeWidth={tone === "idle" || tone === "dim" ? 1 : 2}
                  strokeDasharray={EDGE_DASH[tone]}
                  opacity={tone === "dim" ? 0.35 : 1}
                />
              );
            })}
          </svg>
          {nodes.map((n) => {
            const tone = toneName(safe(nodeTone, n.node, "idle"));
            const text = nodeLabel(n.node);
            const badge = safe(badges, n.node, "");
            return (
              <div
                key={n.id}
                role="treeitem"
                aria-level={n.depth + 1}
                data-tone={tone}
                data-depth={n.depth}
                aria-label={`${text}${tone !== "idle" ? `, ${TONE_LABEL[tone]}` : ""}${badge ? `, ${badge}` : ""}`}
                className="absolute flex flex-col items-center"
                style={{ left: px(n.x), top: n.depth * LEVEL_H + 2, transform: "translateX(-50%)", maxWidth: MAX_SLOT }}
              >
                <div
                  title={text}
                  className={cn(
                    "flex items-center justify-center overflow-hidden px-0.5 font-mono text-body tabular-nums",
                    toneClass(tone)
                  )}
                  style={{ width: NODE, height: NODE }}
                >
                  <span className="max-w-full truncate leading-none">{text}</span>
                </div>
                {badge ? (
                  <span data-badge className="mt-0.5 max-w-[72px] truncate whitespace-nowrap font-mono text-micro leading-none text-fg-dim">
                    {String(badge)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
