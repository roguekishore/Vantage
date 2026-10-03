import { useCallback, useEffect, useMemo, useState } from "react";

export const SPEEDS = [0.5, 1, 2, 4];
export const BASE_DELAY_MS = 900;

/**
 * Step player. `resetKey` changing (new steps) returns to step 0, paused.
 * Playing at the last step stops; pressing play there restarts from 0.
 */
export function usePlayer(total, resetKey) {
  const [state, setState] = useState({ index: 0, playing: false });
  const [speed, setSpeed] = useState(1);
  const last = Math.max(0, total - 1);
  const index = Math.min(state.index, last);

  useEffect(() => {
    setState({ index: 0, playing: false });
  }, [resetKey]);

  useEffect(() => {
    if (!state.playing) return undefined;
    if (index >= last) {
      setState((s) => ({ ...s, playing: false }));
      return undefined;
    }
    const id = setTimeout(
      () => setState((s) => ({ index: Math.min(s.index + 1, last), playing: s.playing })),
      BASE_DELAY_MS / speed
    );
    return () => clearTimeout(id);
  }, [state.playing, index, last, speed]);

  const go = useCallback((i) => setState((s) => ({ ...s, index: Math.max(0, Math.min(i, last)) })), [last]);
  const pause = useCallback(() => setState((s) => ({ ...s, playing: false })), []);
  const toggle = useCallback(
    () =>
      setState((s) => {
        if (s.playing) return { ...s, playing: false };
        const at = Math.min(s.index, last);
        return { index: at >= last ? 0 : at, playing: last > 0 };
      }),
    [last]
  );

  return useMemo(
    () => ({
      index,
      total,
      playing: state.playing,
      speed,
      setSpeed,
      atStart: index <= 0,
      atEnd: index >= last,
      first: () => setState({ index: 0, playing: false }),
      last: () => setState({ index: last, playing: false }),
      next: () => setState((s) => ({ index: Math.min(s.index + 1, last), playing: false })),
      prev: () => setState((s) => ({ index: Math.max(s.index - 1, 0), playing: false })),
      scrub: go,
      play: () => setState((s) => ({ index: Math.min(s.index, last) >= last ? 0 : s.index, playing: last > 0 })),
      pause,
      toggle,
    }),
    [index, total, state.playing, speed, last, go, pause, toggle]
  );
}
