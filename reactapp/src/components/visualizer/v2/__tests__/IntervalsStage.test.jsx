import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import IntervalsStage from "../stages/IntervalsStage";

const intervals = [
  { start: 1, end: 3, label: "a", tone: "done" },
  { start: 2, end: 6, tone: "active" },
  { start: 8, end: 10, tone: "compare" },
  { start: 15, end: 18, tone: "success" },
];

test("renders lanes with tones, ranges and positions", () => {
  const m = mount(<IntervalsStage intervals={intervals} min={0} max={20} />);
  expect(m.qa('[role="listitem"]')).toHaveLength(4);
  expect(m.q('[data-index="1"]').getAttribute("data-tone")).toBe("active");
  expect(m.q('[data-index="1"] [data-bar]').className).toContain("bg-accent");
  expect(m.q('[data-index="2"] [data-bar]').className).toContain("border-warn");
  expect(m.q('[data-index="3"] [data-bar]').className).toContain("border-ok");
  expect(m.q('[data-index="0"]').textContent).toContain("a [1, 3]");
  expect(m.q('[data-index="1"]').getAttribute("aria-label")).toContain("active");
  expect(m.q('[data-index="1"] [data-bar]').style.left).toBe("10%");
  expect(m.q('[data-index="1"] [data-bar]').style.width).toBe("20%");
  expect(m.q('[data-tick="20"]')).not.toBeNull();
});

test("empty, missing and malformed input does not throw", () => {
  expect(() => mount(<IntervalsStage />)).not.toThrow();
  expect(mount(<IntervalsStage intervals={[]} />).host.textContent).toContain("Nothing");
  expect(() => mount(<IntervalsStage intervals={[null, { start: "x" }, { start: 5, end: 5 }]} />)).not.toThrow();
  const m = mount(<IntervalsStage intervals={[{ start: 5, end: 2 }, { start: 4, end: 4, tone: "bogus" }]} min={3} max={3} />);
  expect(m.qa('[role="listitem"]')).toHaveLength(2);
  expect(m.q('[data-index="1"]').getAttribute("data-tone")).toBe("idle");
});
