import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import CallstackStage from "../stages/CallstackStage";

test("renders frames newest first with status tones, args and ret", () => {
  const m = mount(
    <CallstackStage
      frames={[
        { fn: "fib", args: [4], status: "waiting" },
        { fn: "fib", args: [3], status: "returned", ret: 2 },
        { fn: "fib", args: [2, "x"], status: "active" },
      ]}
    />
  );
  const rows = m.qa("li[data-depth]");
  expect(rows.length).toBe(3);
  expect(rows[0].getAttribute("data-depth")).toBe("2");
  expect(rows[0].getAttribute("data-top")).toBe("true");
  expect(rows[0].getAttribute("data-tone")).toBe("active");
  expect(rows[0].innerHTML).toContain("bg-accent");
  expect(rows[0].textContent).toContain("fib(2, x)");
  expect(rows[0].textContent).toContain("running");
  expect(rows[1].getAttribute("data-status")).toBe("returned");
  expect(rows[1].innerHTML).toContain("text-fg-dim");
  expect(rows[1].querySelector("[data-ret]").textContent).toContain("2");
  expect(rows[2].getAttribute("data-tone")).toBe("idle");
  expect(rows[2].textContent).toContain("waiting");
});

test("empty and malformed inputs do not throw", () => {
  expect(mount(<CallstackStage />).q("[data-empty]")).toBeTruthy();
  expect(mount(<CallstackStage frames={[]} />).q("[data-empty]")).toBeTruthy();
  const m = mount(<CallstackStage frames={[null, {}, { fn: "f", args: { a: 1 }, status: "bogus", ret: 0 }]} />);
  expect(m.qa("li[data-depth]").length).toBe(2);
  expect(m.q("[data-ret]").textContent).toContain("0");
});
