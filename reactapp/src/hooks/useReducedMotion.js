import { useSyncExternalStore } from "react";

/*
 * Reduced motion. With `prefers-reduced-motion: reduce`,
 * GSAP timelines are skipped, canvases draw one static frame and visualizer
 * transitions drop to 0ms. CSS animations/transitions are already zeroed
 * globally in src/styles/tokens.css.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

const getMql = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(QUERY) : null);

/** Non-React check, for draw loops and GSAP setup code. */
export function prefersReducedMotion() {
  return !!getMql()?.matches;
}

function subscribe(cb) {
  const mql = getMql();
  if (!mql) return () => {};
  if (mql.addEventListener) mql.addEventListener("change", cb);
  else mql.addListener?.(cb);
  return () => {
    if (mql.removeEventListener) mql.removeEventListener("change", cb);
    else mql.removeListener?.(cb);
  };
}

/** true while the user prefers reduced motion; updates live. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

export default useReducedMotion;
