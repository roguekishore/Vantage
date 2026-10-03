import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import StackStage from "../stages/StackStage";

test("renders items top first with tones and top marker", () => {
  const m = mount(
    <StackStage
      items={[
        { value: 5, tone: "active", sub: "push" },
        { value: 3, tone: "compare" },
        { value: 1, tone: "error" },
        { value: 0, tone: "done" },
        { value: 9, tone: "bogus" },
      ]}
    />
  );
  const rows = m.qa("li[data-index]");
  expect(rows.length).toBe(5);
  expect(rows[0].getAttribute("data-top")).toBe("true");
  expect(rows[0].textContent).toContain("top");
  expect(rows[0].textContent).toContain("push");
  expect(rows[0].getAttribute("data-tone")).toBe("active");
  expect(rows[0].innerHTML).toContain("bg-accent");
  expect(rows[1].innerHTML).toContain("border-dashed");
  expect(rows[2].innerHTML).toContain("border-dotted");
  expect(rows[3].innerHTML).toContain("text-fg-dim");
  expect(rows[4].getAttribute("data-tone")).toBe("idle");
  expect(m.qa("[data-top]").length).toBe(1);
});

test("empty and missing inputs do not throw", () => {
  expect(mount(<StackStage />).q("[data-empty]")).toBeTruthy();
  expect(mount(<StackStage items={[]} />).q("[data-empty]")).toBeTruthy();
  const m = mount(<StackStage items={[null, { value: null }, {}]} />);
  expect(m.qa("li[data-index]").length).toBe(2);
});
