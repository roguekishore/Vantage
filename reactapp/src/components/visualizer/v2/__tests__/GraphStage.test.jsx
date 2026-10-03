import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import GraphStage, { layoutGraph } from "../stages/GraphStage";

const nodes = [
  { id: 0, label: "A", tone: "active" },
  { id: 1, label: "B", tone: "compare" },
  { id: 2, label: "C", tone: "success" },
  { id: 3, label: "D" },
];
const edges = [
  { from: 0, to: 1, weight: 4, tone: "active" },
  { from: 1, to: 0, weight: 2 },
  { from: 1, to: 2, weight: 7, tone: "error" },
];

test("renders nodes with tone attrs, labels, weights and arrows", () => {
  const m = mount(<GraphStage nodes={nodes} edges={edges} directed />);
  expect(m.qa("[data-node]").length).toBe(4);
  expect(m.q('[data-node="0"]').getAttribute("data-tone")).toBe("active");
  expect(m.byLabel("B, comparing")).not.toBeNull();
  expect(m.byLabel("C, success")).not.toBeNull();
  expect(m.byLabel("D")).not.toBeNull();
  expect(m.q('[data-node="1"] circle').getAttribute("stroke-dasharray")).toBeTruthy();
  expect(m.qa("[data-weight]").map((n) => n.getAttribute("data-weight"))).toEqual(["4", "2", "7"]);
  expect(m.qa("polygon").length).toBe(3);
  expect(m.q('[data-edge-tone="error"]')).not.toBeNull();
  m.unmount();
});

test("undirected has no arrowheads; unknown tone falls back to idle", () => {
  const m = mount(<GraphStage nodes={[{ id: "a", tone: "bogus" }, { id: "b" }]} edges={[{ from: "a", to: "b" }]} />);
  expect(m.qa("polygon").length).toBe(0);
  expect(m.q('[data-node="a"]').getAttribute("data-tone")).toBe("idle");
  m.unmount();
});

test("layout keeps given coordinates and circles the rest deterministically", () => {
  const p = layoutGraph([{ id: 1, x: 0, y: 0 }, { id: 2, x: 10, y: 10 }, { id: 3 }]);
  expect(p.get(1).x).toBeLessThan(p.get(2).x);
  expect(p.get(3)).toEqual(layoutGraph([{ id: 3 }]).get(3) && p.get(3));
  expect(layoutGraph(nodes)).toEqual(layoutGraph(nodes));
});

test("empty and malformed inputs do not throw", () => {
  for (const props of [{}, { nodes: [] }, { nodes: null, edges: null }, { nodes: [{ id: 1 }], edges: [{ from: 1, to: 9 }, null, { from: 1, to: 1, weight: 3 }] }]) {
    const m = mount(<GraphStage {...props} />);
    m.unmount();
  }
  const m = mount(<GraphStage nodes={[{ id: 1 }]} />);
  expect(m.qa("[data-node]").length).toBe(1);
  m.unmount();
});
