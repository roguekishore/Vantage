import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { IconButton } from "../ds/IconButton";

/*
 * Square sun/moon theme toggle (POLISH_PLAN §3.9) on ds/IconButton
 * (secondary variant: 1px border, hover inverts). Flips the resolved theme
 * and stores the explicit choice. Also exported from "@/components/ds".
 */
export function ThemeToggle({ size = "md", variant = "secondary", ...props }) {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <IconButton
      icon={resolvedTheme === "dark" ? Sun : Moon}
      size={size}
      variant={variant}
      aria-label={label}
      data-theme-toggle=""
      onClick={() => setTheme(next)}
      {...props}
    />
  );
}

export default ThemeToggle;
