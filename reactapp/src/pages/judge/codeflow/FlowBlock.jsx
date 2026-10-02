import React from "react";
import { T, MONO } from "./cfTheme";
import { useCodeFlowContext } from "./CodeFlowContext";

/**
 * FlowBlock — Recursive visual block for the Code Flow Visualizer.
 *
 * Renders a single {@link BlockNode} and (recursively) its children, indenting by
 * `depth`. Blocks are styled by their {@link BlockType} using the shared visualizer
 * theme tokens, and receive active styling when their id is in `activeBlockIds`
 * (the current step's block plus its ancestors). Hovering a block emits the
 * bidirectional highlight signal through {@link CodeFlowContext} so the Monaco
 * editor highlights the corresponding source range.
 *
 * @typedef {import("./flowResolvers").BlockNode} BlockNode
 * @typedef {import("./flowResolvers").TraceStep} TraceStep
 *
 * @param {Object} props
 * @param {BlockNode} props.node                  - block to render
 * @param {Set<string>} props.activeBlockIds      - ids active at the current step
 * @param {number} props.depth                    - nesting depth (drives indentation)
 * @param {TraceStep | null} [props.currentStep]  - current step, for loop iteration counts
 */
export default function FlowBlock({ node, activeBlockIds, depth = 0, currentStep = null }) {
  const { setHovered } = useCodeFlowContext();

  if (!node) return null;

  const isActive = activeBlockIds instanceof Set && activeBlockIds.has(node.id);
  const style = BLOCK_STYLES[node.type] || BLOCK_STYLES.block;

  // Iteration count is shown for loop blocks: prefer the live count carried on the
  // current step when it targets this loop, otherwise omit it.
  const iteration =
    node.type === "loop" &&
    currentStep &&
    currentStep.blockId === node.id &&
    typeof currentStep.iteration === "number"
      ? currentStep.iteration
      : null;

  const handleEnter = () => setHovered({ source: "block", blockId: node.id });
  const handleLeave = () => setHovered(null);

  const children = Array.isArray(node.children) ? node.children : [];

  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          marginBottom: 4,
          cursor: "pointer",
          background: isActive ? T.accentSoft : style.bg,
          border: `1px solid ${isActive ? T.accentInk : T.border}`,
          borderLeft: `3px solid ${isActive ? T.accentInk : style.border}`,
          transition: "background-color 120ms ease-out, border-color 120ms ease-out",
        }}
      >
        {/* type tag */}
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isActive ? T.accentInk : style.tag,
            flexShrink: 0,
          }}
        >
          {node.type}
        </span>

        {/* label */}
        <span
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: T.fg,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
          }}
          title={node.label}
        >
          {node.label}
        </span>

        {/* loop iteration count */}
        {iteration != null && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: T.accentInk,
              background: T.accentSoft,
              border: `1px solid ${T.accentInk}`,
              padding: "1px 6px",
              flexShrink: 0,
            }}
          >
            ×{iteration}
          </span>
        )}
      </div>

      {children.length > 0 && (
        <div>
          {children.map((child) => (
            <FlowBlock
              key={child.id}
              node={child}
              activeBlockIds={activeBlockIds}
              depth={depth + 1}
              currentStep={currentStep}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Per-BlockType visual tokens. Mono by design (status colours carry meaning
 * only, §3.1): the type tag names the block, the active path is accent-ink.
 * @type {Record<string, {bg: string, border: string, tag: string}>}
 */
const BASE = { bg: T.surface, border: T.borderStrong, tag: T.fgMuted };
const BLOCK_STYLES = {
  program: { bg: T.bg, border: T.border, tag: T.fgDim },
  function: BASE,
  loop: BASE,
  conditional: BASE,
  declaration: BASE,
  assignment: BASE,
  call: BASE,
  io: BASE,
  return: BASE,
  block: { bg: T.surface, border: T.border, tag: T.fgDim },
};
