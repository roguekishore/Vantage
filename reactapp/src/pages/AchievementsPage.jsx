import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award, Trophy, Flame, Swords, Star, Lock,
  ArrowLeft, Loader2, Coins, Sparkles, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/useUserStore";
import useAchievementStore from "@/stores/useAchievementStore";

/* ── Category tabs ── */
const CATEGORIES = [
  { key: "ALL", label: "All Badges", icon: Award },
  { key: "PROBLEM", label: "Problems", icon: Star },
  { key: "STREAK", label: "Streaks", icon: Flame },
  { key: "BATTLE", label: "Battle", icon: Swords },
  { key: "SPECIAL", label: "Special", icon: Trophy },
];

/* ── Category accent config (theme-safe) ── */
const CATEGORY_ACCENT = {
  PROBLEM: {
    ring: "ring-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    shine: ["#10b981", "#34d399"],
  },
  STREAK: {
    ring: "ring-orange-500/30",
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    bar: "bg-orange-500",
    shine: ["#f97316", "#fb923c"],
  },
  BATTLE: {
    ring: "ring-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
    shine: ["#ef4444", "#f87171"],
  },
  SPECIAL: {
    ring: "ring-[#5542FF]/30",
    bg: "bg-[#5542FF]/10",
    text: "text-[#5542FF]",
    bar: "bg-[#5542FF]",
    shine: ["#5542FF", "#B28EF2"],
  },
};

function getAccent(category) {
  return CATEGORY_ACCENT[category] || CATEGORY_ACCENT.SPECIAL;
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-3 w-40 rounded bg-muted" />
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-muted" />
      </CardContent>
    </Card>
  );
}

/* ── Badge Card ── */
function BadgeCard({ badge }) {
  const accent = getAccent(badge.category);
  const earned = badge.earned;
  const pct = badge.target > 0 ? Math.min(100, Math.round((badge.progress / badge.target) * 100)) : 0;
  const isHidden = badge.isHidden && !earned;

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      earned
        ? `ring-2 ${accent.ring} shadow-sm`
        : "hover:shadow-sm"
    )}>
      {/* Shine border for earned badges */}
      {earned && (
        <ShineBorder shineColor={accent.shine} borderWidth={1} duration={10} />
      )}

      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-105",
            earned ? accent.bg : "bg-muted",
            !earned && "grayscale opacity-50"
          )}>
            {isHidden ? (
              <Lock size={22} className="text-muted-foreground" />
            ) : (
              <span role="img" aria-label={badge.name}>{badge.iconUrl}</span>
            )}
            {earned && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-background">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-sm font-medium truncate",
              earned ? "text-foreground" : isHidden ? "text-muted-foreground italic" : "text-foreground/70"
            )}>
              {badge.name}
            </h3>
            <p className={cn(
              "text-xs mt-0.5 line-clamp-2",
              earned ? "text-muted-foreground" : "text-muted-foreground/70"
            )}>
              {badge.description}
            </p>

            {/* Reward chips */}
            {!isHidden && (
              <div className="flex items-center gap-2 mt-2">
                {badge.coinReward > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Coins size={10} /> +{badge.coinReward}
                  </span>
                )}
                {badge.xpReward > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#5542FF]/10 text-[#5542FF]">
                    <Sparkles size={10} /> +{badge.xpReward}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isHidden && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">
                {earned ? "Completed" : `${badge.progress} / ${badge.target}`}
              </span>
              <span className={cn("text-[10px] font-bold", earned ? "text-emerald-500" : accent.text)}>
                {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  earned ? "bg-emerald-500" : accent.bar
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Earned date */}
        {earned && badge.earnedAt && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Earned {new Date(badge.earnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════ Main Page ═══════════════════ */
export default function AchievementsPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  // Read from the global store (populated by useAppInit in App.jsx)
  const badges = useAchievementStore((s) => s.achievements);
  const loading = useAchievementStore((s) => s.loading);
  const loadAchievements = useAchievementStore((s) => s.loadAchievements);

  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    if (!user?.uid) return;
    // loadAchievements is a no-op if the store is already populated for this user
    loadAchievements(user.uid);
  }, [user?.uid, loadAchievements]);

  const filtered = useMemo(
    () => activeCategory === "ALL" ? badges : badges.filter((b) => b.category === activeCategory),
    [badges, activeCategory]
  );

  const earnedCount = useAchievementStore((s) => s.earnedCount);

  return (
    <div className="min-h-screen bg-background pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Achievements
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {earnedCount} of {badges.length} badges earned
            </p>
          </div>
        </div>

        {/* ── Overall progress bar ── */}
        {!loading && badges.length > 0 && (
          <div className="mb-8">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.round((earnedCount / badges.length) * 100)}%`, background: "linear-gradient(to right, #5542FF, #B28EF2)" }}
              />
            </div>
          </div>
        )}

        {/* ── Category tabs ── */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto mb-8">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                activeCategory === key
                  ? "bg-background shadow-sm text-foreground border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={13} />
              {label}
              {key !== "ALL" && (
                <span className="ml-1 text-[10px] tabular-nums text-muted-foreground">
                  {badges.filter((b) => b.category === key && b.earned).length}/
                  {badges.filter((b) => b.category === key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Award size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">No badges in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...filtered]
              .sort((a, b) => (a.earned === b.earned ? 0 : a.earned ? -1 : 1))
              .map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
