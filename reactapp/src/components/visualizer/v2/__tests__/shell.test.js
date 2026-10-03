import "../__testutils__/aliases";
import * as React from "react";
import { mount, click, setValue, key, act } from "../__testutils__/render";
import Bubble, { generateSteps } from "../__examples__/BubbleSortExample";
import { defineVisualizer, fieldError } from "../index";
import * as barrel from "../../index";
import { isTypingTarget } from "../keyboard";
import { isVisualizerV2 } from "../../../../pages/visualizer/legacyViz";

const counter = (m) => m.q('[data-testid="step-counter"]').textContent;
const caption = (m) => m.q('[data-testid="caption"]').textContent;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("isVisualizerV2 flag and barrel exports", () => {
  expect(Bubble.isVisualizerV2).toBe(true);
  expect(isVisualizerV2(Bubble)).toBe(true);
  expect(barrel.defineVisualizer).toBe(defineVisualizer);
  expect(barrel.fieldError).toBe(fieldError);
  expect(typeof barrel.VisualizerShell).toBe("function"); // v1 exports kept
});

test("examples[0] auto-loads at step 0, paused, never idle", () => {
  const m = mount(<Bubble />);
  const first = generateSteps({ nums: [5, 2, 4, 1, 3] }, false);
  expect(counter(m)).toBe(`1 / ${first.length}`);
  expect(caption(m)).toBe(first[0].msg);
  expect(m.byLabel("Pause")).toBeNull();
  expect(m.byLabel("Play")).not.toBeNull();
  expect(m.q('[aria-label="Examples"] [aria-pressed="true"]').textContent).toBe("Shuffled");
  expect(m.q('[data-testid="caption"]').getAttribute("aria-live")).toBe("polite");
  m.unmount();
});

test("transport buttons and keyboard step the player", () => {
  const m = mount(<Bubble />);
  click(m.byLabel("Next step"));
  expect(counter(m).startsWith("2 /")).toBe(true);
  click(m.byLabel("Last step"));
  const total = Number(counter(m).split("/")[1]);
  expect(counter(m)).toBe(`${total} / ${total}`);
  key(document.body, "Home");
  expect(counter(m).startsWith("1 /")).toBe(true);
  key(document.body, "ArrowRight");
  key(document.body, "ArrowRight");
  key(document.body, "ArrowLeft");
  expect(counter(m).startsWith("2 /")).toBe(true);
  key(document.body, "End");
  expect(counter(m).startsWith(`${total} /`)).toBe(true);
  key(document.body, " ");
  expect(m.byLabel("Pause")).not.toBeNull();
  m.unmount();
});

test("keyboard guard: ignored in input, textarea, contentEditable, .monaco-editor, and when embedded", () => {
  const m = mount(<Bubble />);
  const input = m.q("input[type=text], input:not([type])");
  key(input, "ArrowRight");
  expect(counter(m).startsWith("1 /")).toBe(true);
  const ta = document.createElement("textarea");
  const ce = document.createElement("div");
  ce.setAttribute("contenteditable", "true");
  Object.defineProperty(ce, "isContentEditable", { value: true });
  const monaco = document.createElement("div");
  monaco.className = "monaco-editor";
  const inner = document.createElement("span");
  monaco.appendChild(inner);
  [ta, ce, monaco].forEach((n) => document.body.appendChild(n));
  [ta, ce, inner].forEach((n) => {
    expect(isTypingTarget(n)).toBe(true);
    key(n, "ArrowRight");
  });
  expect(counter(m).startsWith("1 /")).toBe(true);
  [ta, ce, monaco].forEach((n) => n.remove());
  m.unmount();

  const e = mount(<Bubble embedded />);
  key(document.body, "ArrowRight");
  expect(counter(e).startsWith("1 /")).toBe(true);
  e.unmount();
});

test("fieldError from parse shows inline under the field, never alert", () => {
  const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  const m = mount(<Bubble />);
  const input = m.q("#viz-in-nums");
  setValue(input, "7");
  click(m.q('form button[type="submit"]'));
  act(() => {
    m.q("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(m.q("#viz-in-nums-error")?.textContent).toMatch(/at least 2/i);
  expect(m.q("#viz-in-nums").getAttribute("aria-invalid")).toBe("true");
  setValue(input, "1, x");
  act(() => { m.q("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(m.q("#viz-in-nums-error").textContent).toMatch(/not a number/i);
  expect(counter(m).startsWith("1 /")).toBe(true); // previous steps kept
  expect(alertSpy).not.toHaveBeenCalled();
  setValue(input, "3, 1, 2");
  act(() => { m.q("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(m.q("#viz-in-nums-error")).toBeNull();
  expect(caption(m)).toBe("Start with [3, 1, 2].");
  alertSpy.mockRestore();
  m.unmount();
});

test("mode switch regenerates from the same input at step 0", () => {
  const m = mount(<Bubble />);
  click(m.qa('[aria-label="Examples"] button')[1]); // [1, 2, 3, 4]
  click(m.byLabel("Last step"));
  const tabs = m.qa('[role="tab"]');
  expect(tabs.map((t) => t.textContent)).toEqual(["Plain", "Early exit"]);
  const plainTotal = Number(counter(m).split("/")[1]);
  click(tabs[1]);
  const early = generateSteps({ nums: [1, 2, 3, 4] }, true);
  expect(counter(m)).toBe(`1 / ${early.length}`);
  expect(early.length).not.toBe(plainTotal);
  expect(m.q("#viz-in-nums").value).toBe("1, 2, 3, 4");
  expect(m.q('[aria-label="Playback"] [aria-label="Pause"]')).toBeNull();
  m.unmount();
});

test("example chips load an example at step 0, paused", () => {
  const m = mount(<Bubble />);
  click(m.byLabel("Last step"));
  const chip = m.qa('[aria-label="Examples"] button')[1];
  click(chip);
  expect(caption(m)).toBe("Start with [1, 2, 3, 4].");
  expect(counter(m).startsWith("1 /")).toBe(true);
  m.unmount();
});

test("embedded renders stage + caption + mini transport only and merges externalArray", () => {
  const m = mount(<Bubble embedded externalArray={[9, 8, 7]} />);
  expect(m.q("[data-visualizer-embedded]")).not.toBeNull();
  expect(m.q("[data-mini-transport]")).not.toBeNull();
  expect(m.q('[data-testid="caption"]')).not.toBeNull();
  expect(m.q('[data-stage="array"]')).not.toBeNull();
  expect(m.q("form")).toBeNull();
  expect(m.q("header")).toBeNull();
  expect(m.q('[role="region"][aria-label="C++ code"]')).toBeNull();
  expect(caption(m)).toBe("Start with [9, 8, 7].");
  click(m.byLabel("Next step"));
  m.rerender(<Bubble embedded externalArray={[4, 3]} />);
  expect(caption(m)).toBe("Start with [4, 3].");
  expect(counter(m).startsWith("1 /")).toBe(true);
  m.unmount();
});

test("dev assertion flags a bad step.line and a missing msg", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  const V = defineVisualizer({
    meta: { title: "Bad", category: "Test", summary: "s" },
    inputs: [],
    examples: [{ label: "a", values: {} }],
    generate: () => [{ msg: "ok", line: 1 }, { msg: "off", line: 9 }, { line: 1 }],
    code: { lang: "cpp", lines: ["int x;"] },
    complexity: { time: { avg: "O(1)" }, space: "O(1)" },
    legend: [],
    view: { stage: "array", map: () => ({ cells: [] }) },
  });
  const m = mount(<V />);
  const msg = document.body.textContent;
  expect(msg).toMatch(/Could not generate steps/);
  expect(msg).toMatch(/step 1: line 9 is outside 1\.\.1/);
  expect(msg).toMatch(/step 2: missing msg/);
  spy.mockRestore();
  m.unmount();
});

test("ArrayStage: tones, pointers by role, band, rows", () => {
  const V = defineVisualizer({
    meta: { title: "Arr", category: "Test", summary: "s" },
    inputs: [],
    examples: [{ label: "a", values: {} }],
    generate: () => [{ msg: "m", line: 1 }],
    code: { lang: "cpp", lines: ["int x;"] },
    complexity: { time: { avg: "O(1)" }, space: "O(1)" },
    legend: [{ tone: "active", label: "now" }],
    view: {
      stage: "array",
      map: () => ({
        cells: [{ value: 1, tone: "active" }, { value: 2, tone: "compare" }, { value: 3, tone: "done", sub: "s" }, { value: 4 }],
        pointers: [{ index: 0, label: "i", role: 1 }, { index: 1, label: "j", role: 2 }, { index: 1, label: "mid", role: 3 }],
        band: { from: 1, to: 2, tone: "window" },
        rows: [{ label: "out", cells: [{ value: 9, tone: "success" }] }],
      }),
    },
  });
  const m = mount(<V />);
  expect(m.qa('[data-row="main"] [role="listitem"]').map((c) => c.dataset.tone)).toEqual(["active", "compare", "done", "idle"]);
  expect(m.q('[data-pointer-index="1"]').textContent).toBe("jmid");
  expect(m.q('[data-role="3"]').className).toMatch(/text-viz-write/);
  expect(m.q('[data-role="2"]').className).toMatch(/text-info/);
  expect(m.q("[data-band]").style.gridColumn).toBe("2 / 4");
  expect(m.q('[data-row="out"] [data-tone="success"]')).not.toBeNull();
  m.unmount();
});
