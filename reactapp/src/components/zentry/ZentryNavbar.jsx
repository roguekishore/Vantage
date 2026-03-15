import { useRef, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sun, Moon, Eye, BookOpen, Scale, Map as MapIcon,
  Swords, Trophy, Award, Bell, UserRoundPlus,
  Coins, Sparkles, Flame, Shield, Menu, X, VolumeX,
} from "lucide-react";
import { useTheme } from "../theme-provider";
import useUserStore from "@/stores/useUserStore";
import useGamificationStore from "@/stores/useGamificationStore";
import useAchievementStore from "@/stores/useAchievementStore";
import useFriendsStore from "@/stores/useFriendsStore";
import AppToast from "@/components/ui/app-toast";

const ZentryNavbar = ({ controls, allowTransparency = false }) => {
  const { scrollProgress } = controls;
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const navContainerRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentUser = useUserStore((s) => s.user);
  const stats = useGamificationStore((s) => s.stats);
  const streak = useGamificationStore((s) => s.streak);
  const shieldToast = useGamificationStore((s) => s.shieldToast);
  const dismissShieldToast = useGamificationStore((s) => s.dismissShieldToast);
  const earnedCount = useAchievementStore((s) => s.earnedCount);
  const incomingFriendCount = useFriendsStore((s) => s.incomingCount);
  const friendNotification = useFriendsStore((s) => s.lastNotification);
  const challengeMuteUntil = useFriendsStore((s) => s.challengeMuteUntil);
  const clearFriendNotification = useFriendsStore((s) => s.clearNotification);

  const mutedUntilTs = challengeMuteUntil ? new Date(challengeMuteUntil).getTime() : 0;
  const isDndMuted = Boolean(mutedUntilTs && mutedUntilTs > Date.now());
  const mutedUntilLabel = isDndMuted
    ? new Date(challengeMuteUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  useEffect(() => {
    if (shieldToast) {
      const t = setTimeout(dismissShieldToast, 5000);
      return () => clearTimeout(t);
    }
  }, [shieldToast, dismissShieldToast]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  useEffect(() => {
    const nav = navContainerRef.current;
    if (!nav) return;
    if (allowTransparency && scrollProgress < 0.01) {
      nav.classList.remove("floating-nav");
      nav.classList.add("border-transparent");
    } else {
      nav.classList.add("floating-nav");
      nav.classList.remove("border-transparent");
    }
  }, [scrollProgress, allowTransparency]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const navItems = [
    { label: "Visualize", path: "/visualizers" },
    { label: "Problems", path: "/problems" },
    { label: "Battle", path: "/battle" },
    { label: "Friends", path: "/friends", badge: currentUser && incomingFriendCount > 0 ? incomingFriendCount : null },
    { label: "Ranks", path: "/leaderboard" },
    { label: "Badges", path: "/achievements", badge: currentUser && earnedCount > 0 ? earnedCount : null },
    { label: "Map", path: "/map" },
  ];

  const mobileNavItems = [
    { label: "Visualize", path: "/visualizers", icon: Eye },
    { label: "Problems", path: "/problems", icon: BookOpen },
    { label: "Battle", path: "/battle", icon: Swords },
    { label: "Friends", path: "/friends", icon: UserRoundPlus, badge: currentUser && incomingFriendCount > 0 ? incomingFriendCount : null },
    { label: "Ranks", path: "/leaderboard", icon: Trophy },
    { label: "Badges", path: "/achievements", icon: Award},
    { label: "Map", path: "/map", icon: MapIcon },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div
      ref={navContainerRef}
      className="fixed inset-x-0 top-3 z-50 mx-3 sm:mx-6 border border-transparent transition-all duration-500 rounded-xl"
    >
      <header className="w-full">
        <nav className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#5542FF] to-[#B28EF2] grid place-items-center shadow-sm shadow-[#5542FF]/20">
              <span className="text-white text-[11px] font-bold tracking-tight">V</span>
            </div>
            <span className="font-semibold text-[15px] text-foreground tracking-tight">
              Vantage
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-[#5542FF]" />
                )}
                {/* {item.badge != null && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#5542FF] text-[9px] font-bold text-white flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )} */}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* Gamification compact pills */}
            {currentUser && stats && (
              <div className="hidden lg:flex items-center gap-0.5 mr-1">
                <Link
                  to="/store"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  title="Coins"
                >
                  <Coins size={12} className="text-amber-500" />
                  <span className="tabular-nums font-medium">{stats.coins.toLocaleString()}</span>
                </Link>
                <div className="w-px h-3 bg-border mx-0.5" />
                <span className="flex items-center gap-1 px-2 py-1 text-[12px] text-muted-foreground">
                  <Sparkles size={12} className="text-[#B28EF2]" />
                  <span className="tabular-nums font-medium">Lv.{stats.level}</span>
                </span>
                {streak && streak.currentStreak > 0 && (
                  <>
                    <div className="w-px h-3 bg-border mx-0.5" />
                    <span
                      className="flex items-center gap-1 px-2 py-1 text-[12px] text-muted-foreground"
                      title={`${streak.currentStreak}-day streak`}
                    >
                      <Flame size={12} className="text-orange-500" />
                      <span className="tabular-nums font-medium">{streak.currentStreak}</span>
                      {streak.shieldCount > 0 && (
                        <Shield size={10} className="text-cyan-500" />
                      )}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Theme toggle */}
            {currentUser && isDndMuted && (
              <div className="relative group hidden sm:flex items-center justify-center w-8 h-8 rounded-lg text-[#B28EF2] bg-[#5542FF]/15 border border-[#5542FF]/30">
                <VolumeX size={14} />
                <div className="pointer-events-none absolute top-full right-0 mt-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 px-3 py-2 rounded-lg bg-card border border-border shadow-lg min-w-max">
                  <p className="text-xs font-medium text-foreground">DND mode enabled</p>
                  <p className="text-[11px] text-muted-foreground">Muted until {mutedUntilLabel}</p>
                </div>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              <Sun className="h-[15px] w-[15px] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[15px] w-[15px] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            </button>

            {currentUser && (
              <Link
                to="/friends"
                className="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Friend requests"
                title="Friend requests"
              >
                <Bell size={15} />
                {incomingFriendCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#5542FF] text-[9px] font-bold text-white flex items-center justify-center leading-none">
                    {incomingFriendCount > 99 ? "99+" : incomingFriendCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth */}
            {currentUser ? (
              <Link to="/profile" title={currentUser.username}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5542FF] to-[#B28EF2] grid place-items-center text-white text-[11px] font-bold uppercase hover:opacity-90 transition-opacity">
                  {currentUser.username?.charAt(0) || "U"}
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
              >
                Sign in
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border/50 px-4 py-3 space-y-0.5 bg-background/95 backdrop-blur-xl rounded-b-xl">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-foreground bg-muted/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon size={16} className="opacity-50" />
                  {item.label}
                  {item.badge != null && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#5542FF] text-[10px] font-bold text-white flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {currentUser && stats && (
              <div className="pt-3 mt-2 border-t border-border/50 flex items-center gap-4 px-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Coins size={12} className="text-amber-500" />
                  <span className="tabular-nums font-medium">{stats.coins.toLocaleString()}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles size={12} className="text-[#B28EF2]" />
                  <span className="tabular-nums font-medium">Lv.{stats.level}</span>
                </span>
                {streak && streak.currentStreak > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame size={12} className="text-orange-500" />
                    <span className="tabular-nums font-medium">{streak.currentStreak}d</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Shield toast */}
      <AppToast
        message={shieldToast}
        onDismiss={dismissShieldToast}
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg z-50 animate-in fade-in slide-in-from-top-2 min-w-[240px] max-w-[90vw]"
        messageClassName="text-sm font-medium text-foreground pr-1 break-words"
        dismissButtonClassName="shrink-0 h-6 w-6 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center justify-center"
      />

      <AppToast
        message={friendNotification}
        onDismiss={clearFriendNotification}
        className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl bg-[#5542FF] border border-[#5542FF] shadow-xl shadow-[#5542FF]/45 z-[140] animate-in fade-in slide-in-from-top-2 min-w-[320px] max-w-[92vw]"
        messageClassName="text-sm font-semibold text-white pr-1 break-words"
        dismissButtonClassName="shrink-0 h-6 w-6 rounded-md border border-white/35 text-white hover:bg-white/15 inline-flex items-center justify-center"
        dismissLabel="Dismiss notification"
      />
    </div>
  );
};

export default ZentryNavbar;
