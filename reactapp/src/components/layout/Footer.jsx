import { Link } from "react-router-dom";
import { Github, Puzzle } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useExtensionDownload } from "./Navbar";

/*
 * Site footer: Mono label type.
 * Section links, © 2026 Vantage, GitHub, Extension, theme toggle.
 * Mounted once in App.jsx on every page that shows the Navbar
 * (so never on arenas, judge, map or auth).
 */
const GITHUB_URL = "https://github.com/roguekishore/Vantage";

const SECTIONS = [
  { label: "Visualizers", to: "/visualizers" },
  { label: "Problems", to: "/problems" },
  { label: "Battle", to: "/battle" },
  { label: "Map", to: "/map" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "Achievements", to: "/achievements" },
  { label: "Friends", to: "/friends" },
];

const LINK =
  "inline-flex items-center gap-1 text-fg-muted transition-colors duration-[120ms] ease-out ds-hover:text-fg " +
  "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus";

export default function Footer() {
  const handleExtensionDownload = useExtensionDownload();

  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex w-full max-w-[var(--container)] flex-col gap-4 px-[var(--gutter)] py-6 font-mono text-label uppercase text-fg-muted">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {SECTIONS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className={LINK}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-4">
          <span>&copy; 2026 Vantage</span>
          <span aria-hidden="true">&middot;</span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={LINK}>
            <Github size={14} aria-hidden="true" />
            GitHub
          </a>
          <span aria-hidden="true">&middot;</span>
          <a href="/#extension-setup" onClick={handleExtensionDownload} className={LINK}>
            <Puzzle size={14} aria-hidden="true" />
            Extension
          </a>
          <ThemeToggle size="sm" className="ml-auto" />
        </div>
      </div>
    </footer>
  );
}
