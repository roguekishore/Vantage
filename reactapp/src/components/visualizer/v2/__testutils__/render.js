import * as React from "react";
const { act } = React;
import { createRoot } from "react-dom/client";

global.IS_REACT_ACT_ENVIRONMENT = true;

/** Minimal render helper (no @testing-library in this repo). */
export function mount(element) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(element));
  return {
    host,
    rerender: (el) => act(() => root.render(el)),
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
    q: (sel) => host.querySelector(sel),
    qa: (sel) => [...host.querySelectorAll(sel)],
    byLabel: (label) => host.querySelector(`[aria-label="${label}"]`),
  };
}

export const click = (el) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });

export function setValue(el, value) {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
  act(() => { el.dispatchEvent(new Event("input", { bubbles: true })); });
}

export function key(target, k, init = {}) {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init });
  act(() => { target.dispatchEvent(e); });
  return e;
}

export { act };
