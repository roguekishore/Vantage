import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/*
 * Square sun/moon icon button (POLISH_PLAN §3.9). Flips the resolved theme
 * and stores the explicit choice. Token colours only, no motion beyond a
 * 120ms border-colour hover. The ds unit moves this onto ds/IconButton and
 * swaps `title` for the ds Tooltip.
 */
const SIZES = { sm: "h-7 w-7", md: "h-9 w-9" }; // 28 / 36px (§3.8 Button sizes)

export function ThemeToggle({ size = "md", className = "", ...props }) {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;
  const Icon = resolvedTheme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      data-theme-toggle=""
      className={`inline-flex shrink-0 items-center justify-center rounded-none border border-border bg-transparent text-fg transition-colors duration-[120ms] hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

export default ThemeToggle;
