import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import ListStage from "../stages/ListStage";

const nodes = [
  { id: "a", value: 1, tone: "done" },
  { id: "b", value: 2, tone: "active" },
  { id: "c", value: 3, tone: "compare" },
  { id: "d", value: 4, tone: "error" },
];
const edges = [
  { from: "a", to: "b" },
  { from: "b", to: "c", tone: "write" },
  { from: "c", to: "b" },
  { from: "d", to: "a", curved: true, tone: "error" },
  { from: "d", to: "d" },
  { from: "d", to: "ghost" },
];

test("renders nodes with tones, edges and pointers", () => {
  const m = mount(
    <ListStage
      nodes={nodes}
      edges={edges}
      pointers={[
        { nodeId: "b", label: "curr", role: 1 },
        { nodeId: "b", label: "prev", role: 3 },
        { nodeId: "zzz", label: "lost", role: 2 },
      ]}
    />
  );
  expect(m.qa("[data-node]").length).toBe(4);
  expect(m.q('[data-node="b"]').getAttribute("data-tone")).toBe("active");
  expect(m.q('[data-node="b"]').className).toContain("bg-accent");
  expect(m.q('[data-node="c"]').className).toContain("border-dashed");
  expect(m.q('[data-node="d"]').className).toContain("border-dotted");
  expect(m.q('[data-node="a"]').className).toContain("text-fg-dim");
  expect(m.qa("path[data-edge]").length).toBe(5); // ghost edge skipped
  expect(m.q('path[data-edge="b->c"]').getAttribute("stroke")).toBe("var(--viz-write)");
  expect(m.q('[data-pointer-node="b"]').textContent).toContain("curr");
  expect(m.q('[data-pointer-node="b"]').textContent).toContain("prev");
  expect(m.q('[data-role="3"]').className).toContain("text-viz-write");
  expect(m.q('[data-pointer-node="zzz"]')).toBeNull();
  m.unmount();
});

test("empty and missing optional fields do not throw", () => {
  for (const props of [{}, { nodes: [] }, { nodes: null, edges: null }, { nodes: [{ id: 1, value: null }] }, { nodes, edges: [null, {}] }]) {
    const m = mount(<ListStage {...props} />);
    expect(m.q('[data-stage="list"]')).not.toBeNull();
    m.unmount();
  }
});

test("explicit null terminal node renders dim and pointers sit outside the scaled box", () => {
  const ns = [
    { id: "a", value: 1, tone: "done" },
    { id: "b", value: 2 },
    { id: "z", value: "null", tone: "dim" },
  ];
  const m = mount(
    <ListStage
      nodes={ns}
      edges={[{ from: "a", to: "b" }, { from: "b", to: "z", tone: "dim" }]}
      pointers={[{ nodeId: "b", label: "prev", role: 1 }, { nodeId: "b", label: "curr", role: 2 }]}
    />
  );
  const z = m.q('[data-node="z"]');
  expect(z.textContent).toBe("null");
  expect(z.getAttribute("data-tone")).toBe("dim");
  expect(m.q('path[data-edge="b->z"]')).not.toBeNull();
  const row = m.q("[data-pointer-row]");
  expect(row).not.toBeNull();
  expect(row.querySelector('[data-pointer-node="b"]')).not.toBeNull();
  expect(m.q('[role="list"]').querySelector("[data-pointer-node]")).toBeNull();
  m.unmount();
});
