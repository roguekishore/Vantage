import { useMemo, useSyncExternalStore } from "react";
import { getThemeTokens, subscribeTheme, themeSnapshot } from "../lib/canvasTheme";

/*
 * Resolved design-token values for canvas, Monaco and other code that can't
 * use CSS (POLISH_PLAN §3.9). Re-renders whenever the <html> theme class
 * changes, i.e. after ThemeProvider (or the pre-paint script) has applied it,
 * so the values are always the ones on screen.
 *
 * Returns { theme: "dark" | "light", bg, surface, elevated, border,
 * borderStrong, fg, fgMuted, fgDim, accent, onAccent, accentEdge, accentInk,
 * accentSoft, focus, ok, warn, err, info, okSoft, warnSoft, errSoft,
 * infoSoft, vizWrite, backdrop, rgb: { bg, surface, elevated, fg, accent,
 * onAccent, accentEdge, accentInk, focus, ok, warn, err, info, vizWrite } }
 * where rgb.* are "r,g,b" strings, e.g. `rgba(${t.rgb.fg},0.4)`.
 *
 * Draw loops that run every frame should call canvasTheme.js helpers
 * (rgba('fg', 0.4)) instead, so a toggle applies without a re-render.
 */
export function useThemeTokens() {
  const snapshot = useSyncExternalStore(subscribeTheme, themeSnapshot, () => "");
  return useMemo(() => getThemeTokens(), [snapshot]);
}

export default useThemeTokens;
