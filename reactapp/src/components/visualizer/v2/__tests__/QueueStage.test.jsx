import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import QueueStage from "../stages/QueueStage";

test("renders items with tones, head and tail markers", () => {
  const m = mount(<QueueStage items={[{ value: 4, tone: "active" }, { value: 7, sub: "x" }, { value: 9, tone: "done" }]} />);
  expect(m.qa('[role="listitem"]')).toHaveLength(3);
  expect(m.q('[data-index="0"]').getAttribute("data-tone")).toBe("active");
  expect(m.q('[data-index="0"]').className).toContain("bg-accent");
  expect(m.q('[data-index="2"]').className).toContain("text-fg-dim");
  expect(m.q('[data-index="1"]').textContent).toContain("x");
  expect(m.q('[data-pointer-index="0"]').textContent).toBe("head");
  expect(m.q('[data-pointer-index="2"] [data-role="2"]').textContent).toBe("tail");
  expect(m.q("[data-queue-meta]").textContent).toContain("3");
});

test("capacity pads empty slots; circular uses given head and tail", () => {
  const m = mount(
    <QueueStage items={[{ value: 5 }, null, null, { value: 1 }]} head={3} tail={0} capacity={5} circular />
  );
  expect(m.qa('[role="listitem"]')).toHaveLength(5);
  expect(m.qa('[data-empty="true"]')).toHaveLength(3);
  expect(m.q('[data-pointer-index="3"]').textContent).toBe("head");
  expect(m.q('[data-pointer-index="0"]').textContent).toBe("tail");
  expect(m.q("[data-queue-meta]").textContent).toContain("2 / 5 circular");
});

test("empty and malformed inputs do not throw", () => {
  expect(() => mount(<QueueStage />)).not.toThrow();
  expect(() => mount(<QueueStage items={[]} capacity={0} head={9} tail={-1} />)).not.toThrow();
  const m = mount(<QueueStage items={[{ value: 1 }]} head={50} tail={50} />);
  expect(m.qa("[data-pointer-index]")).toHaveLength(1);
  const e = mount(<QueueStage />);
  expect(e.host.textContent).toContain("empty");
});
