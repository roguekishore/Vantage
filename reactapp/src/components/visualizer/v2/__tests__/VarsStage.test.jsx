import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import VarsStage from "../stages/VarsStage";

test("renders one tile per var with tone attributes and classes", () => {
  const m = mount(
    <VarsStage
      vars={[
        { name: "n", value: 12 },
        { name: "gcd", value: 4, tone: "success" },
        { name: "r", value: 0, tone: "active" },
        { name: "bad", value: "x", tone: "error" },
        { name: "odd", value: 1, tone: "nope" },
      ]}
    />
  );
  expect(m.qa('[role="listitem"]')).toHaveLength(5);
  expect(m.q('[data-var="gcd"]').getAttribute("data-tone")).toBe("success");
  expect(m.q('[data-var="gcd"]').className).toContain("border-ok");
  expect(m.q('[data-var="r"]').className).toContain("bg-accent");
  expect(m.q('[data-var="bad"]').className).toContain("border-err");
  expect(m.q('[data-var="odd"]').getAttribute("data-tone")).toBe("idle");
  expect(m.q('[data-var="gcd"]').getAttribute("aria-label")).toBe("gcd = 4, success");
  expect(m.q('[data-var="n"]').textContent).toContain("12");
  expect(m.q('[data-var="r"]').textContent).toContain("0");
});

test("edge inputs do not throw", () => {
  expect(() => mount(<VarsStage />)).not.toThrow();
  expect(mount(<VarsStage vars={[]} />).host.textContent).toContain("Nothing to show");
  const m = mount(<VarsStage vars={[null, { name: "a" }, { value: [1, 2] }, { name: "o", value: { k: 1 } }]} />);
  expect(m.qa('[role="listitem"]')).toHaveLength(3);
  expect(m.q('[data-var="o"]').textContent).toContain('{"k":1}');
});
