import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useExtensionDownload } from "./Navbar";

/*
 * Site footer (POLISH_PLAN §4): Mono 11px label type.
 * © 2026 Vantage · GitHub · Extension · theme toggle.
 * Mounted once in App.jsx on every page that shows the Navbar.
 */
const GITHUB_URL = "https://github.com/roguekishore/Vantage";

const LINK =
  "text-fg-muted transition-colors duration-[120ms] ease-out ds-hover:text-fg " +
  "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus";

export default function Footer() {
  const handleExtensionDownload = useExtensionDownload();

  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex w-full max-w-[var(--container)] flex-wrap items-center gap-x-3 gap-y-2 px-[var(--gutter)] py-6 font-mono text-label uppercase text-fg-muted">
        <span>© 2026 Vantage</span>
        <span aria-hidden="true">·</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={LINK}>
          GitHub
        </a>
        <span aria-hidden="true">·</span>
        <a href="/#extension-setup" onClick={handleExtensionDownload} className={LINK}>
          Extension
        </a>
        <ThemeToggle size="sm" className="ml-auto" />
      </div>
    </footer>
  );
}
