import "../__testutils__/aliases";
import * as React from "react";
import { mount } from "../__testutils__/render";
import StackAux from "../auxiliary/StackAux";
import QueueAux from "../auxiliary/QueueAux";
import TableAux from "../auxiliary/TableAux";
import CallstackAux from "../auxiliary/CallstackAux";
import OpsAux from "../auxiliary/OpsAux";
import CallstackStage from "../stages/CallstackStage";

test("stack: top first with tones, empty state", () => {
  const m = mount(<StackAux items={[{ value: 7, tone: "active", sub: "idx 2" }, { value: 3 }]} />);
  expect(m.qa("[data-stack-item]")).toHaveLength(2);
  expect(m.q("[data-top]").textContent).toBe("top");
  expect(m.q('[data-stack-item="0"]').className).toContain("bg-accent");
  expect(m.q('[data-stack-item="1"]').getAttribute("data-tone")).toBe("idle");
  expect(m.host.textContent).toContain("idx 2");
  m.rerender(<StackAux items={[]} />);
  expect(m.host.textContent).toContain("Empty stack");
  m.rerender(<StackAux />);
  expect(m.host.textContent).toContain("Empty stack");
});

test("queue: head/tail markers, capacity slots, circular", () => {
  const m = mount(<QueueAux items={[{ value: "A" }, { value: "B", tone: "active" }]} head={0} tail={1} capacity={4} circular />);
  expect(m.qa("[data-slot]")).toHaveLength(4);
  expect(m.qa('[data-empty="true"]')).toHaveLength(2);
  expect(m.q('[data-slot="0"] [data-marks]').textContent).toBe("head");
  expect(m.q('[data-slot="1"] [data-marks]').textContent).toBe("tail");
  expect(m.q("[data-queue-meta]").textContent).toContain("2 / 4");
  expect(m.q("[data-queue-meta]").textContent).toContain("circular");
  m.rerender(<QueueAux items={[{ value: 1 }]} />);
  expect(m.q('[data-slot="0"] [data-marks]').textContent).toBe("head/tail");
  m.rerender(<QueueAux items={[]} />);
  expect(m.host.textContent).toContain("Empty queue");
});

test("table: key/value rows with tones, empty state", () => {
  const m = mount(<TableAux entries={[{ key: 1, value: "a", tone: "success" }, { key: 2, value: 0, tone: "error" }, { key: 3, value: null }]} />);
  expect(m.qa("[data-entry]")).toHaveLength(3);
  expect(m.q('[data-entry="0"]').className).toContain("border-ok");
  expect(m.q('[data-entry="1"]').className).toContain("border-err");
  expect(m.q('[data-entry="1"]').textContent).toBe("20");
  m.rerender(<TableAux entries={[]} />);
  expect(m.host.textContent).toContain("Empty table");
});

test("callstack: status by text and pattern, return values, empty", () => {
  const m = mount(
    <CallstackAux
      frames={[
        { fn: "rev", args: [1], ret: 9, status: "returned" },
        { fn: "rev", args: [2], status: "waiting" },
        { fn: "rev", args: [3], status: "active" },
      ]}
    />
  );
  expect(m.qa("[data-frame]")).toHaveLength(3);
  expect(m.q('[data-frame="2"]').textContent).toContain("running");
  expect(m.q('[data-frame="1"]').className).toContain("border-dashed");
  expect(m.q('[data-frame="0"] [data-ret]').textContent).toContain("9");
  expect(m.q('[data-frame="0"]').getAttribute("aria-label")).toContain("returns 9");
  m.rerender(<CallstackAux frames={[]} />);
  expect(m.host.textContent).toContain("No active calls");
});

test("ops: active highlighted, results shown, empty", () => {
  const m = mount(<OpsAux ops={["put(1,1)", "get(1)", "get(2)"]} active={1} results={["null", "1"]} />);
  expect(m.qa("[data-op]")).toHaveLength(3);
  expect(m.qa('[data-active="true"]')).toHaveLength(1);
  expect(m.q('[data-op="1"]').getAttribute("aria-current")).toBe("step");
  expect(m.q('[data-op="1"]').className).toContain("bg-accent-soft");
  expect(m.q('[data-op="1"] [data-result]').textContent).toContain("1");
  expect(m.q('[data-op="2"] [data-result]')).toBeNull();
  m.rerender(<OpsAux ops={[]} active={0} />);
  expect(m.host.textContent).toContain("No operations");
});

test("callstack aux matches CallstackStage order (newest on top)", () => {
  const frames = [{ fn: "a", args: [1], status: "waiting" }, { fn: "b", args: [2], status: "active" }];
  const a = mount(<CallstackAux frames={frames} />);
  const aux = a.qa("[data-frame]").map((n) => n.getAttribute("data-frame"));
  expect(aux).toEqual(["1", "0"]);
  const s = mount(<CallstackStage frames={frames} />);
  const txt = (h) => h.textContent.indexOf("b(");
  expect(txt(s.host)).toBeLessThan(s.host.textContent.indexOf("a("));
  expect(txt(a.host)).toBeLessThan(a.host.textContent.indexOf("a("));
});

test("malformed input does not throw; null value is an empty queue slot; objects are JSON", () => {
  const bad = [null, undefined, "x", 5, {}];
  for (const v of bad) {
    mount(<StackAux items={v} />); mount(<QueueAux items={v} />); mount(<TableAux entries={v} />);
    mount(<CallstackAux frames={v} />); mount(<OpsAux ops={v} results={v} />);
  }
  mount(<StackAux items={[null, { value: 1 }]} />);
  mount(<TableAux entries={[null, { key: 1 }]} />);
  mount(<CallstackAux frames={[null, { fn: "f", args: 1 }]} />);
  mount(<OpsAux ops={[null, "a"]} />);
  const q = mount(<QueueAux items={[null, { value: null }, { value: 2 }]} />);
  expect(q.host.textContent).not.toContain("null");
  expect(q.qa('[data-empty="true"]')).toHaveLength(1);
  expect(q.q("[data-queue-meta]").textContent).toContain("1 used");
  const st = mount(<StackAux items={[{ value: { a: 1 } }]} />);
  expect(st.host.textContent).toContain('{"a":1}');
  const tb = mount(<TableAux entries={[{ key: [1], value: { b: 2 } }]} />);
  expect(tb.host.textContent).not.toContain("object Object");
});
