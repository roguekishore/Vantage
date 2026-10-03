import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import BarsStage from "../stages/BarsStage";

const bars = [
  { value: 0, tone: "idle" },
  { value: 3, tone: "active", fill: 0 },
  { value: 1, tone: "done", fill: 2 },
  { value: 2, tone: "error" },
];

test("renders bars with tones, fill, pointers and band", () => {
  const m = mount(
    <BarsStage
      bars={bars}
      max={3}
      pointers={[{ index: 1, label: "L", role: 1 }, { index: 3, label: "R", role: 2 }, { index: 99, label: "x", role: 1 }]}
      band={{ from: 1, to: 2, tone: "window" }}
    />
  );
  expect(m.qa('[role="listitem"]')).toHaveLength(4);
  expect(m.q('[data-index="1"]').getAttribute("data-tone")).toBe("active");
  expect(m.q('[data-index="1"] [data-bar]').className).toContain("bg-accent");
  expect(m.q('[data-index="3"] [data-bar]').className).toContain("border-err");
  expect(m.q('[data-index="2"] [data-fill="2"]')).not.toBeNull();
  expect(m.q('[data-index="2"]').getAttribute("aria-label")).toContain("water 2");
  expect(m.q('[data-pointer-index="1"]').textContent).toBe("L");
  expect(m.q('[data-pointer-index="3"] [data-role="2"]').className).toContain("text-info");
  expect(m.qa("[data-pointer-index]")).toHaveLength(2);
  expect(m.q("[data-band]").className).toContain("bg-info-soft");
});

test("bar heights scale against max and never overflow", () => {
  const m = mount(<BarsStage bars={[{ value: 5 }, { value: 2, fill: 9 }]} max={1} />);
  const h = (sel) => parseFloat(m.q(sel).style.height);
  expect(h('[data-index="0"] [data-bar]')).toBeLessThanOrEqual(100);
  expect(h('[data-index="1"] [data-fill]') + h('[data-index="1"] [data-bar]')).toBeLessThanOrEqual(100);
});

test("empty and malformed input does not throw", () => {
  expect(() => mount(<BarsStage />)).not.toThrow();
  expect(() => mount(<BarsStage bars={[]} max={0} />)).not.toThrow();
  expect(() => mount(<BarsStage bars={[null, {}, { value: NaN, tone: "bogus", fill: -2 }, { value: "x" }]} pointers={[null]} band={{ from: 5, to: 1 }} />)).not.toThrow();
  const m = mount(<BarsStage bars={[{ value: 1 }]} band={{ from: 0, to: 0 }} />);
  expect(m.q('[data-index="0"]').getAttribute("data-tone")).toBe("idle");
});
