import { useEffect, useState } from "react";

/** "wide" >= 1440, "mid" 1024-1439, "narrow" < 1024. jsdom (no matchMedia) -> "mid". */
const WIDE = "(min-width: 1440px)";
const MID = "(min-width: 1024px)";

function read() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "mid";
  if (window.matchMedia(WIDE).matches) return "wide";
  return window.matchMedia(MID).matches ? "mid" : "narrow";
}

export default function useLayoutMode() {
  const [mode, setMode] = useState(read);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const qs = [window.matchMedia(WIDE), window.matchMedia(MID)];
    const on = () => setMode(read());
    qs.forEach((q) => (q.addEventListener ? q.addEventListener("change", on) : q.addListener(on)));
    on();
    return () => qs.forEach((q) => (q.removeEventListener ? q.removeEventListener("change", on) : q.removeListener(on)));
  }, []);
  return mode;
}
