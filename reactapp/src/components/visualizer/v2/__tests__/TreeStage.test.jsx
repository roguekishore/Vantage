import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import TreeStage, { layoutTree } from "../stages/TreeStage";

const n = (val, left = null, right = null) => ({ val, left, right });
const tree = n(5, n(3, n(1), null), n(8, null, n(9)));

test("renders nodes, edges, tones and badges", () => {
  const m = mount(
    <TreeStage
      root={tree}
      nodeTone={(x) => (x.val === 5 ? "active" : x.val === 3 ? "success" : x.val === 9 ? "error" : x.val === 1 ? "dim" : "idle")}
      edgeTone={(x) => (x.val === 3 ? "success" : "idle")}
      badges={(x) => (x.val === 5 ? "(-inf, inf)" : "")}
    />
  );
  expect(m.qa('[role="treeitem"]').length).toBe(5);
  expect(m.qa("line").length).toBe(4);
  expect(m.byLabel("5, active, (-inf, inf)").getAttribute("data-tone")).toBe("active");
  expect(m.byLabel("3, success").querySelector("div").className).toMatch(/border-ok/);
  expect(m.byLabel("9, error").querySelector("div").className).toMatch(/border-dotted/);
  expect(m.byLabel("1, discarded").querySelector("div").className).toMatch(/opacity/);
  expect(m.q('[data-badge]').textContent).toBe("(-inf, inf)");
  expect(m.q('line[data-edge-tone="success"]').getAttribute("stroke")).toBe("var(--ok)");
  m.unmount();
});

test("in-order layout keeps BST order left to right", () => {
  const { nodes } = layoutTree(tree);
  const order = [...nodes].sort((a, b) => a.x - b.x).map((r) => r.node.val);
  expect(order).toEqual([1, 3, 5, 8, 9]);
});

test("empty, single, n-ary and malformed inputs do not throw", () => {
  expect(() => mount(<TreeStage />).unmount()).not.toThrow();
  const e = mount(<TreeStage root={null} />);
  expect(e.host.textContent).toMatch(/Empty tree/);
  e.unmount();
  const s = mount(<TreeStage root={{ val: 1 }} />);
  expect(s.qa('[role="treeitem"]').length).toBe(1);
  s.unmount();
  const k = mount(<TreeStage root={{ key: "a", children: [{ key: "b" }, { key: "c" }, { key: "d" }] }} />);
  expect(k.qa('[role="treeitem"]').length).toBe(4);
  k.unmount();
  const g = mount(<TreeStage root={{ id: 1, kids: [{ id: 2 }] }} getChildren={(x) => x.kids || []} nodeTone={() => { throw new Error("x"); }} />);
  expect(g.qa('[role="treeitem"]').length).toBe(2);
  g.unmount();
  const cyc = n(1); cyc.left = cyc;
  const c = mount(<TreeStage root={cyc} nodeTone={() => "bogus"} />);
  expect(c.qa('[role="treeitem"]').length).toBe(1);
  expect(c.q('[role="treeitem"]').getAttribute("data-tone")).toBe("idle");
  c.unmount();
});
