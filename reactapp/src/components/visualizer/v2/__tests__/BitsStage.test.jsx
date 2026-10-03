import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import BitsStage from "../stages/BitsStage";

const bitsOf = (m, label) => [...m.host.querySelectorAll(`[data-row="${label}"] [data-bit]`)];

test("renders MSB-first digits, positions and values", () => {
  const m = mount(<BitsStage rows={[{ label: "result", value: 5, bits: 8 }]} />);
  const cells = bitsOf(m, "result");
  expect(cells).toHaveLength(8);
  expect(cells.map((c) => c.getAttribute("data-bit")).join("")).toBe("00000101");
  expect(cells[0].getAttribute("data-pos")).toBe("7");
  expect(cells[7].getAttribute("data-pos")).toBe("0");
  expect(m.host.textContent).toContain("result");
  expect(m.q('[data-testid="bits-value"]').textContent).toBe("5");
});

test("bitTone maps by bit position to tone classes and attributes", () => {
  const m = mount(
    <BitsStage rows={[{ label: "x", value: 6, bits: 4, bitTone: (i) => (i === 0 ? "active" : i === 1 ? "error" : "bogus") }]} />
  );
  const cells = bitsOf(m, "x");
  const byPos = (p) => cells.find((c) => c.getAttribute("data-pos") === String(p));
  expect(byPos(0).getAttribute("data-tone")).toBe("active");
  expect(byPos(0).className).toContain("bg-accent");
  expect(byPos(1).getAttribute("data-tone")).toBe("error");
  expect(byPos(1).className).toContain("border-dotted");
  expect(byPos(2).getAttribute("data-tone")).toBe("idle");
  expect(byPos(1).getAttribute("aria-label")).toMatch(/error/);
});

test("multiple rows align; negatives are two's complement; mixed widths right-align", () => {
  const m = mount(
    <BitsStage rows={[{ label: "a", value: -1, bits: 4 }, { label: "b", value: 1, bits: 8 }]} />
  );
  expect(bitsOf(m, "a").map((c) => c.getAttribute("data-bit")).join("")).toBe("1111");
  expect(bitsOf(m, "b")).toHaveLength(8);
  expect(bitsOf(m, "a")[0].getAttribute("data-pos")).toBe("3");
});

test("edge and missing inputs never throw", () => {
  expect(() => mount(<BitsStage />)).not.toThrow();
  expect(mount(<BitsStage rows={[]} />).host.textContent).toContain("Nothing to show");
  expect(() =>
    mount(
      <BitsStage
        rows={[null, { label: "n", value: null }, { label: "z", value: NaN, bits: -3 }, { label: "t", value: 3, bits: 99, bitTone: () => { throw new Error("x"); } }]}
      />
    )
  ).not.toThrow();
  const m = mount(<BitsStage rows={[{ label: "n", value: null, bits: 4 }]} />);
  expect(bitsOf(m, "n").map((c) => c.getAttribute("data-bit")).join("")).toBe("----");
});
