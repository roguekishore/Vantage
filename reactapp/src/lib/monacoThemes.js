/* ==========================================================================
   Monaco themes from design tokens (POLISH_PLAN §3.9)

   defineVantageThemes(monaco, tokens) registers `vantage-dark` and/or
   `vantage-light` and returns the theme name to pass to <Editor theme>.

   `tokens` is either
     - a useThemeTokens() / getThemeTokens() snapshot: defines the theme that
       snapshot belongs to (`vantage-${tokens.theme}`). CSS only exposes the
       active theme's values, so call it again when the theme changes (the
       hook re-renders then), or
     - { dark: snapshot, light: snapshot }: defines both.

   Usage (Phase 4 Judge wires this in):
     const tokens = useThemeTokens();
     <Editor beforeMount={(m) => defineVantageThemes(m, tokens)}
             theme={vantageThemeName(tokens.theme)} ... />
     plus useEffect(() => monacoRef.current && monaco.editor.setTheme(
       defineVantageThemes(monacoRef.current, tokens)), [tokens]);

   Monaco only parses hex, so token values (hex or rgba()) are converted
   here; no colour literals live in this file.
   ========================================================================== */

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));
const hex2 = (n) => clamp255(n).toString(16).padStart(2, "0");

/* "#RGB" | "#RRGGBB" | "#RRGGBBAA" | "rgb(...)" | "rgba(...)" -> [r, g, b, a] */
function parseColor(value) {
  const s = String(value || "").trim();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const parts = s.match(/-?[\d.]+%?/g);
  if (!parts || parts.length < 3) return [0, 0, 0, 1];
  const [r, g, b] = parts.slice(0, 3).map(Number);
  let a = parts[3] === undefined ? 1 : parseFloat(parts[3]);
  if (parts[3] && parts[3].endsWith("%")) a /= 100;
  return [r, g, b, a];
}

/* Hex for Monaco `colors` (keeps alpha as #RRGGBBAA). Optional alpha override. */
function hex(value, alpha) {
  const [r, g, b, a] = parseColor(value);
  const out = alpha === undefined ? a : alpha;
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${out < 1 ? hex2(out * 255) : ""}`;
}

/* Opaque 6-digit hex (no '#') composited over `under`, for token rules. */
function solid(value, under) {
  const [r, g, b, a] = parseColor(value);
  const [ur, ug, ub] = parseColor(under);
  const mix = (c, u) => c * a + u * (1 - a);
  return `${hex2(mix(r, ur))}${hex2(mix(g, ug))}${hex2(mix(b, ub))}`;
}

export const vantageThemeName = (theme) => (theme === "light" ? "vantage-light" : "vantage-dark");

/* Monaco theme data for one token snapshot. */
export function buildVantageTheme(t) {
  const isLight = t.theme === "light";
  const bg = t.surface;
  const ink = solid(t.fg, bg);
  const muted = solid(t.fgMuted, bg);
  const dim = solid(t.fgDim, bg);
  const accentInk = solid(t.accentInk, bg);

  return {
    base: isLight ? "vs" : "vs-dark",
    inherit: true,
    // Mono palette + accent-ink for keywords: status colours stay meaning-only.
    rules: [
      { token: "", foreground: ink, background: solid(bg, bg) },
      { token: "comment", foreground: dim },
      { token: "keyword", foreground: accentInk },
      { token: "keyword.control", foreground: accentInk },
      { token: "storage", foreground: accentInk },
      { token: "string", foreground: muted },
      { token: "string.escape", foreground: ink },
      { token: "number", foreground: ink },
      { token: "type", foreground: ink },
      { token: "type.identifier", foreground: ink },
      { token: "identifier", foreground: ink },
      { token: "delimiter", foreground: muted },
      { token: "operator", foreground: muted },
      { token: "annotation", foreground: muted },
    ],
    colors: {
      "editor.background": hex(bg),
      "editor.foreground": hex(t.fg),
      "editor.lineHighlightBackground": hex(t.accentSoft),
      "editor.lineHighlightBorder": hex(t.accentSoft, 0),
      "editor.selectionBackground": hex(t.accentInk, 0.28),
      "editor.inactiveSelectionBackground": hex(t.accentInk, 0.14),
      "editor.selectionHighlightBackground": hex(t.accentInk, 0.12),
      "editor.wordHighlightBackground": hex(t.accentInk, 0.1),
      "editor.findMatchBackground": hex(t.accentInk, 0.35),
      "editor.findMatchHighlightBackground": hex(t.accentInk, 0.16),
      "editorCursor.foreground": hex(t.accentInk),
      "editorLineNumber.foreground": hex(t.fgDim),
      "editorLineNumber.activeForeground": hex(t.fg),
      "editorGutter.background": hex(bg),
      "editorIndentGuide.background": hex(t.border),
      "editorIndentGuide.background1": hex(t.border),
      "editorIndentGuide.activeBackground": hex(t.borderStrong),
      "editorIndentGuide.activeBackground1": hex(t.borderStrong),
      "editorWhitespace.foreground": hex(t.border),
      "editorBracketMatch.background": hex(t.accentSoft),
      "editorBracketMatch.border": hex(t.accentInk),
      "editorWidget.background": hex(t.elevated),
      "editorWidget.border": hex(t.borderStrong),
      "editorSuggestWidget.background": hex(t.elevated),
      "editorSuggestWidget.border": hex(t.borderStrong),
      "editorSuggestWidget.foreground": hex(t.fg),
      "editorSuggestWidget.selectedBackground": hex(t.accentSoft),
      "editorSuggestWidget.highlightForeground": hex(t.accentInk),
      "editorHoverWidget.background": hex(t.elevated),
      "editorHoverWidget.border": hex(t.borderStrong),
      "editorError.foreground": hex(t.err),
      "editorWarning.foreground": hex(t.warn),
      "editorInfo.foreground": hex(t.info),
      "scrollbarSlider.background": hex(t.border),
      "scrollbarSlider.hoverBackground": hex(t.borderStrong),
      "scrollbarSlider.activeBackground": hex(t.fgDim),
      "focusBorder": hex(t.focus),
    },
  };
}

export function defineVantageThemes(monaco, tokens) {
  if (!monaco?.editor?.defineTheme || !tokens) return vantageThemeName("dark");
  if (tokens.dark || tokens.light) {
    if (tokens.dark) monaco.editor.defineTheme("vantage-dark", buildVantageTheme({ ...tokens.dark, theme: "dark" }));
    if (tokens.light) monaco.editor.defineTheme("vantage-light", buildVantageTheme({ ...tokens.light, theme: "light" }));
    return vantageThemeName(tokens.light && !tokens.dark ? "light" : "dark");
  }
  const name = vantageThemeName(tokens.theme);
  monaco.editor.defineTheme(name, buildVantageTheme(tokens));
  return name;
}
