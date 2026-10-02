import { useEffect, useState, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, Puzzle, VolumeX, UserRoundPlus, Swords, LogOut, User, ShoppingBag, Package } from "lucide-react";
import useUserStore from "@/stores/useUserStore";
import useGamificationStore from "@/stores/useGamificationStore";
import useFriendsStore from "@/stores/useFriendsStore";
import BrandLogo from "@/components/common/Logo";
import { topicConfig } from "@/routes/config";
import { cn } from "@/lib/utils";
// Direct ds file imports (not the barrel): the shell is in the main chunk,
// same reasoning as App.jsx.
import { Button } from "@/components/ds/Button";
import { IconButton } from "@/components/ds/IconButton";
import { Sheet, SheetContent } from "@/components/ds/Dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ds/Popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ds/DropdownMenu";
import { Avatar } from "@/components/ds/Stat";
import { toast as showToast } from "@/components/ds/Toast";
import { ThemeToggle } from "@/components/common/ThemeToggle";

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const TOPIC_PATHS = Object.values(topicConfig).map((t) => t.path);

// `match` lists the route prefixes that light the item up, so nested
// routes (a topic page, a visualizer, a battle result) map to their section.
const NAV_ITEMS = [
  { label: "Visualizers", to: "/visualizers", match: ["/visualizers", "/explore", ...TOPIC_PATHS] },
  { label: "Problems", to: "/problems", match: ["/problems", "/problem"] },
  { label: "Battle", to: "/battle", match: ["/battle", "/group"] },
  { label: "Map", to: "/map", match: ["/map"] },
  { label: "Leaderboard", to: "/leaderboard", match: ["/leaderboard"] },
  { label: "Achievements", to: "/achievements", match: ["/achievements"] },
  { label: "Friends", to: "/friends", match: ["/friends"] },
];

const matchesPath = (pathname, prefixes) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

const EXTENSION_ZIP_DEMO_URL = "https://github.com/roguekishore/Vantage/releases/download/v1.0/VantageCode.zip";

const FOCUS = "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus";
const COLOR_T = "transition-colors duration-[120ms] ease-out";

/**
 * Extension download: fetches the ZIP, then brings the user to the home
 * page's setup section. Shared by the Navbar and the Footer.
 */
export function useExtensionDownload() {
  const location = useLocation();
  const navigate = useNavigate();

  return useCallback((e) => {
    e.preventDefault();

    const dl = document.createElement("a");
    dl.href = EXTENSION_ZIP_DEMO_URL;
    dl.setAttribute("download", "algovisualizer-extension.zip");
    dl.setAttribute("target", "_blank");
    dl.setAttribute("rel", "noreferrer");
    document.body.appendChild(dl);
    dl.click();
    dl.remove();

    if (location.pathname === "/") {
      const setupSection = document.getElementById("extension-setup");
      if (setupSection) {
        setupSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.hash = "extension-setup";
      }
    } else {
      navigate("/#extension-setup");
    }
  }, [location.pathname, navigate]);
}

/* ─────────────────────────────────────────────────────────
   LOGO: acid tile + VANTAGE wordmark
───────────────────────────────────────────────────────── */
function Logo() {
  return (
    <Link to="/" aria-label="Vantage home" className={cn("flex shrink-0 items-center gap-2", FOCUS)}>
      <span className="block size-7 shrink-0 border border-accent-edge">
        <BrandLogo size={26} alt="" />
      </span>
      <span
        className="font-display text-body uppercase leading-none text-fg"
        style={{ fontWeight: "var(--display-weight)", fontSynthesis: "none" }}
      >
        Vantage
      </span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   NOTIFICATIONS: what the friends store already holds
───────────────────────────────────────────────────────── */
function NotificationsPopover({ open, onOpenChange, incomingCount, incomingRequests, incomingChallenges, isDnd, dndLabel }) {
  const challenges = incomingChallenges || [];
  const requests = incomingRequests || [];
  const total = (incomingCount || 0) + challenges.length;
  const label = total > 0 ? `Notifications, ${total} new` : "Notifications";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <IconButton aria-label={label} title="Notifications">
          <Bell aria-hidden="true" />
          {total > 0 ? (
            <span
              aria-hidden="true"
              className="absolute right-0.5 top-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center border border-accent-edge bg-accent px-0.5 font-mono text-micro leading-none tabular-nums text-on-accent"
            >
              {total > 9 ? "9+" : total}
            </span>
          ) : null}
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3 font-mono text-label uppercase text-fg-muted">Notifications</div>

        {isDnd ? (
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-fg-muted">
            <VolumeX size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
            <span>Challenges muted until {dndLabel}</span>
          </div>
        ) : null}

        {total === 0 ? (
          <p className="px-4 py-6 text-fg-muted">No new notifications.</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto">
            {challenges.map((c) => (
              <li key={`c-${c.id}`} className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Swords size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-accent-ink" />
                <span className="min-w-0 truncate">
                  <span className="text-fg">{c.challengerUsername || "A friend"}</span>
                  <span className="text-fg-muted"> challenged you</span>
                </span>
              </li>
            ))}
            {requests.map((r) => (
              <li key={`r-${r.id}`} className="flex items-center gap-2 border-b border-border px-4 py-3">
                <UserRoundPlus size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-fg-muted" />
                <span className="min-w-0 truncate">
                  <span className="text-fg">{r.requester?.username || "Someone"}</span>
                  <span className="text-fg-muted"> wants to connect</span>
                </span>
              </li>
            ))}
            {requests.length === 0 && incomingCount > 0 ? (
              <li className="border-b border-border px-4 py-3 text-fg-muted">
                <span className="tabular-nums">{incomingCount}</span> pending friend {incomingCount === 1 ? "request" : "requests"}
              </li>
            ) : null}
          </ul>
        )}

        <div className="flex justify-end px-4 py-3">
          <Button size="sm" variant="secondary" asChild>
            <Link to="/friends" onClick={() => onOpenChange(false)}>Open friends</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────── */
const Navbar = ({ controls, allowTransparency = false }) => {
  const { scrollProgress } = controls;
  const location           = useLocation();
  const navigate           = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  const user      = useUserStore(s => s.user);
  const isAuthenticated = Boolean(user?.uid);
  const stats     = useGamificationStore(s => s.stats);
  const streak    = useGamificationStore(s => s.streak);
  const toast     = useGamificationStore(s => s.shieldToast);
  const dToast    = useGamificationStore(s => s.dismissShieldToast);
  const incoming  = useFriendsStore(s => s.incomingCount);
  const incomingRequests   = useFriendsStore(s => s.incomingRequests);
  const incomingChallenges = useFriendsStore(s => s.incomingChallenges);
  const fNotif    = useFriendsStore(s => s.lastNotification);
  const muteUntil = useFriendsStore(s => s.challengeMuteUntil);
  const clearF    = useFriendsStore(s => s.clearNotification);

  const isDnd    = Boolean(muteUntil && new Date(muteUntil).getTime() > Date.now());
  const dndLabel = isDnd ? new Date(muteUntil).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : null;

  useEffect(() => { if (toast) { const t=setTimeout(dToast,5000); return ()=>clearTimeout(t); } }, [toast,dToast]);
  useEffect(() => setScrolled(scrollProgress > 0.01), [scrollProgress]);
  useEffect(() => { setMobileOpen(false); setNotifOpen(false); }, [location.pathname]);

  // Store notifications -> ds toasts (same triggers as the old AppToasts).
  useEffect(() => {
    if (!toast) return;
    const days = streak?.currentStreak;
    showToast({
      tone: "ok",
      title: "Streak shield used",
      description: days ? `Your streak shield saved your ${days}-day streak.` : "Your streak shield saved your streak.",
    });
    // streak is read only for the copy; the trigger is the shield toast itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  useEffect(() => {
    if (!fNotif) return;
    showToast({ tone: "info", title: fNotif });
    // The message now lives in the toast queue; clear it so a repeat shows again.
    clearF();
  }, [fNotif, clearF]);

  const handleExtensionDownload = useExtensionDownload();

  const handleSignOut = useCallback(() => {
    useUserStore.getState().clearUser();
    window.postMessage({ type: "VANTAGE_LOGOUT" }, "*");
    navigate("/login");
  }, [navigate]);

  const transparent = allowTransparency && !scrolled;

  const itemClass = (active) =>
    cn(
      "inline-flex h-8 items-center border px-2 font-mono text-label uppercase xl:px-3",
      COLOR_T,
      FOCUS,
      active
        ? "border-accent-edge bg-accent text-on-accent"
        : "border-transparent text-fg-muted ds-hover:text-fg"
    );

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-nav h-[var(--nav-h)] border-b",
          COLOR_T,
          transparent ? "border-transparent bg-transparent" : "border-border bg-surface"
        )}
      >
        <div className="flex h-full items-center gap-3 px-[var(--gutter)] xl:gap-4">
          <Logo />

          {/* DESKTOP LINKS */}
          <nav aria-label="Main" className="hidden min-w-0 flex-1 justify-center lg:flex">
            <ul className="flex items-center">
              {NAV_ITEMS.map(({ label, to, match }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => itemClass(isActive || matchesPath(location.pathname, match))}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* RIGHT */}
          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
            <ThemeToggle variant="ghost" />

            {isAuthenticated && (
              <NotificationsPopover
                open={notifOpen}
                onOpenChange={setNotifOpen}
                incomingCount={incoming}
                incomingRequests={incomingRequests}
                incomingChallenges={incomingChallenges}
                isDnd={isDnd}
                dndLabel={dndLabel}
              />
            )}

            <IconButton
              icon={Puzzle}
              aria-label="Download browser extension"
              title="Download extension (demo link)"
              onClick={handleExtensionDownload}
            />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Account menu for ${user.username || "you"}`}
                    className={cn("ml-1 inline-flex", FOCUS)}
                  >
                    <Avatar name={user.username || "U"} size="md" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuLabel>
                    <span className="block truncate normal-case text-fg">{user.username}</span>
                    {stats ? (
                      <span className="mt-1 block tabular-nums">
                        Lv {stats.level} · {Number(stats.coins || 0).toLocaleString()} coins
                        {streak?.currentStreak > 0 ? ` · ${streak.currentStreak}d streak` : ""}
                      </span>
                    ) : null}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile"><User aria-hidden="true" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/store"><ShoppingBag aria-hidden="true" />Store</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/inventory"><Package aria-hidden="true" />Inventory</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem tone="danger" onSelect={handleSignOut}>
                    <LogOut aria-hidden="true" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="primary" size="sm" asChild className="ml-1">
                <Link to="/login">Sign in</Link>
              </Button>
            )}

            <IconButton
              icon={Menu}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* MOBILE SHEET (< 1024) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" title="Menu" bodyClassName="px-0 py-0">
          <nav aria-label="Main">
            <ul>
              {NAV_ITEMS.map(({ label, to, match }) => (
                <li key={to} className="border-b border-border">
                  <NavLink
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between px-6 py-4 font-mono text-[24px] uppercase leading-none",
                        COLOR_T,
                        "ds-focus:outline ds-focus:outline-2 ds-focus:-outline-offset-2 ds-focus:outline-focus",
                        isActive || matchesPath(location.pathname, match)
                          ? "bg-accent text-on-accent"
                          : "text-fg ds-hover:bg-fg ds-hover:text-bg"
                      )
                    }
                  >
                    {label}
                    {to === "/friends" && incoming > 0 ? (
                      <span className="font-mono text-label tabular-nums" aria-label={`${incoming} pending requests`}>
                        {incoming}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Navbar;
