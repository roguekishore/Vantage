import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import MatrixStage from "../stages/MatrixStage";

const cells = [
  [{ value: 0 }, { value: 1 }, { value: 2 }],
  [{ value: 1 }, { value: 1, tone: "compare" }, { value: 2, tone: "success" }],
];

test("renders cells, headers and tone attributes", () => {
  const m = mount(<MatrixStage cells={cells} rowHeaders={["a", "b"]} colHeaders={["", "x", "y"]} />);
  expect(m.qa('[role="cell"]').length).toBe(6);
  expect(m.q('[data-r="1"][data-c="1"]').getAttribute("data-tone")).toBe("compare");
  expect(m.q('[data-r="1"][data-c="1"]').className).toMatch(/border-dashed/);
  expect(m.q('[data-r="1"][data-c="2"]').className).toMatch(/border-ok/);
  expect(m.q('[data-r="0"][data-c="0"]').getAttribute("data-tone")).toBe("idle");
  expect(m.q('[data-row-header="1"]').textContent).toBe("b");
  expect(m.q('[data-col-header="2"]').textContent).toBe("y");
  m.unmount();
});

test("active cell and deps are marked by text and attributes", () => {
  const m = mount(<MatrixStage cells={cells} active={[1, 1]} deps={[[0, 0], [0, 1], [1, 0], [9, 9], null]} />);
  const a = m.q('[data-active="true"]');
  expect(a.getAttribute("data-tone")).toBe("active");
  expect(a.textContent).toContain("now");
  expect(a.className).toMatch(/bg-accent/);
  const deps = m.qa('[data-dep="true"]');
  expect(deps.length).toBe(3);
  expect(deps[0].textContent).toContain("dep");
  expect(deps[0].className).toMatch(/outline-dashed/);
  m.unmount();
});

test("empty, ragged and malformed inputs do not throw", () => {
  [{}, { cells: [] }, { cells: [[]] }, { cells: [[{ value: 1 }], [{ value: 1 }, { value: 2 }]] }, { cells: [[null, 5, undefined]], active: "x", deps: "y" }, { cells: [[{ value: 1, tone: "bogus" }]], rowHeaders: [] }].forEach((p) => {
    const m = mount(<MatrixStage {...p} />);
    m.unmount();
  });
  const m = mount(<MatrixStage cells={[[{ value: 1, tone: "bogus" }]]} />);
  expect(m.q('[data-r="0"][data-c="0"]').getAttribute("data-tone")).toBe("idle");
  m.unmount();
});
