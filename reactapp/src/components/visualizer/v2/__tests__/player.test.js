import "../__testutils__/aliases";
import * as React from "react";
import { mount, act } from "../__testutils__/render";
import { usePlayer, SPEEDS } from "../usePlayer";

let api;
function Probe({ total, resetKey }) {
  api = usePlayer(total, resetKey);
  return null;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("next / prev / first / last / scrub clamp and pause", () => {
  const m = mount(<Probe total={5} resetKey="a" />);
  expect(api.index).toBe(0);
  act(() => api.next());
  act(() => api.next());
  expect(api.index).toBe(2);
  act(() => api.prev());
  expect(api.index).toBe(1);
  act(() => api.last());
  expect(api.index).toBe(4);
  act(() => api.next());
  expect(api.index).toBe(4);
  act(() => api.first());
  act(() => api.prev());
  expect(api.index).toBe(0);
  act(() => api.scrub(3));
  expect(api.index).toBe(3);
  act(() => api.scrub(99));
  expect(api.index).toBe(4);
  m.unmount();
});

test("play advances on a timer, pause stops, end stops itself", () => {
  const m = mount(<Probe total={3} resetKey="a" />);
  act(() => api.toggle());
  expect(api.playing).toBe(true);
  act(() => jest.advanceTimersByTime(900));
  expect(api.index).toBe(1);
  act(() => api.toggle());
  expect(api.playing).toBe(false);
  act(() => jest.advanceTimersByTime(5000));
  expect(api.index).toBe(1);
  act(() => api.toggle());
  act(() => jest.advanceTimersByTime(900));
  expect(api.index).toBe(2);
  act(() => jest.advanceTimersByTime(900));
  expect(api.playing).toBe(false);
  // play at the end restarts
  act(() => api.toggle());
  expect(api.index).toBe(0);
  expect(api.playing).toBe(true);
  m.unmount();
});

test("speed presets scale the delay", () => {
  expect(SPEEDS).toEqual([0.5, 1, 2, 4]);
  const m = mount(<Probe total={9} resetKey="a" />);
  act(() => api.setSpeed(4));
  act(() => api.toggle());
  act(() => jest.advanceTimersByTime(225));
  act(() => jest.advanceTimersByTime(225));
  expect(api.index).toBe(2);
  act(() => api.toggle());
  act(() => api.setSpeed(0.5));
  act(() => api.toggle());
  act(() => jest.advanceTimersByTime(1800));
  expect(api.index).toBe(3);
  m.unmount();
});

test("new resetKey returns to step 0 paused", () => {
  const m = mount(<Probe total={5} resetKey="a" />);
  act(() => api.last());
  act(() => api.toggle());
  m.rerender(<Probe total={5} resetKey="b" />);
  expect(api.index).toBe(0);
  expect(api.playing).toBe(false);
  m.unmount();
});
