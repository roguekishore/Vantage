import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

/*
 * Theme mechanics.
 * - theme: the stored choice, "dark" | "light" | "system" (default "system").
 * - resolvedTheme: what is applied, "dark" | "light". With "system" it follows
 *   prefers-color-scheme live.
 * - Applies `dark` / `light` on <html> plus `color-scheme`, so native controls
 *   and scrollbars follow. public/index.html runs the same logic before React
 *   loads (no flash); keep the two in sync.
 */
export const THEME_STORAGE_KEY = "vantage-theme";
const THEMES = ["dark", "light", "system"];
const DARK_QUERY = "(prefers-color-scheme: dark)";

const getSystemTheme = () =>
  typeof window !== "undefined" && window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";

const ThemeProviderContext = createContext({
  theme: "system",
  resolvedTheme: "dark",
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
  ...props
}) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return THEMES.includes(stored) ? stored : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Follow OS changes live (only affects the result while theme === "system").
  useEffect(() => {
    const mql = window.matchMedia?.(DARK_QUERY);
    if (!mql) return undefined;
    const onChange = () => setSystemTheme(mql.matches ? "dark" : "light");
    onChange();
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener?.(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener?.(onChange);
    };
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  // Layout effect: the class flips before paint, so nothing renders a frame
  // in the old theme.
  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(resolvedTheme === "dark" ? "light" : "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback(
    (next) => {
      try { localStorage.setItem(storageKey, next); } catch { /* quota/private mode */ }
      setThemeState(next);
    },
    [storageKey]
  );

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
