import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import {
  Award, Trophy, Flame, Swords, Star, Lock,
  ArrowLeft, Coins, Sparkles, CheckCircle2, ChevronRight,
} from "lucide-react";
import TiltedCard from "@/components/TiltedCard";
import GradientText from "@/components/GradientText";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/useUserStore";
import useAchievementStore from "@/stores/useAchievementStore";

gsap.registerPlugin(ScrollTrigger);

/* ── Category tabs ── */
const CATEGORIES = [
  { key: "ALL", label: "All", icon: Award },
  { key: "PROBLEM", label: "Problems", icon: Star },
  { key: "STREAK", label: "Streaks", icon: Flame },
  { key: "BATTLE", label: "Battle", icon: Swords },
  { key: "SPECIAL", label: "Special", icon: Trophy },
];

/* ── Category accent config ── */
const CATEGORY_ACCENT = {
  PROBLEM: {
    gradient: "from-emerald-500 to-teal-400",
    bg: "rgba(16, 185, 129, 0.12)",
    text: "text-emerald-400",
    bar: "linear-gradient(90deg, #10b981, #34d399)",
    glow: "rgba(16, 185, 129, 0.3)",
  },
  STREAK: {
    gradient: "from-orange-500 to-amber-400",
    bg: "rgba(249, 115, 22, 0.12)",
    text: "text-orange-400",
    bar: "linear-gradient(90deg, #f97316, #fbbf24)",
    glow: "rgba(249, 115, 22, 0.3)",
  },
  BATTLE: {
    gradient: "from-red-500 to-rose-400",
    bg: "rgba(239, 68, 68, 0.12)",
    text: "text-red-400",
    bar: "linear-gradient(90deg, #ef4444, #fb7185)",
    glow: "rgba(239, 68, 68, 0.3)",
  },
  SPECIAL: {
    gradient: "from-[#5542FF] to-[#B28EF2]",
    bg: "rgba(85, 66, 255, 0.12)",
    text: "text-[#B28EF2]",
    bar: "linear-gradient(90deg, #5542FF, #B28EF2)",
    glow: "rgba(85, 66, 255, 0.3)",
  },
};

function getAccent(category) {
  return CATEGORY_ACCENT[category] || CATEGORY_ACCENT.SPECIAL;
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="badge-glass p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-white/5" />
          <div className="h-3 w-40 rounded bg-white/5" />
        </div>
      </div>
      <div className="mt-5 h-1.5 rounded-full bg-white/5" />
    </div>
  );
}

/* ── Badge Icon Mapping ── */
function BadgeIcon({ badge, className, size = 24 }) {
  // Map based on name first (specific), then category
  const name = badge.name.toLowerCase();

  if (name.includes("first blood") || name.includes("getting started")) return <Award className={className} size={size} />;
  if (name.includes("century") || name.includes("solve")) return <Trophy className={className} size={size} />;
  if (name.includes("warrior") || name.includes("streak")) return <Flame className={className} size={size} />;
  if (name.includes("mastery")) return <Star className={className} size={size} />;
  if (name.includes("battle") || name.includes("clash")) return <Swords className={className} size={size} />;
  if (name.includes("sweep")) return <Sparkles className={className} size={size} />;

  // Category fallbacks
  switch (badge.category) {
    case "PROBLEM": return <Award className={className} size={size} />;
    case "STREAK": return <Flame className={className} size={size} />;
    case "BATTLE": return <Swords className={className} size={size} />;
    case "SPECIAL": return <Trophy className={className} size={size} />;
    default: return <Award className={className} size={size} />;
  }
}

/* ── Badge Card ── */
function BadgeCard({ badge, index }) {
  const accent = getAccent(badge.category);
  const earned = badge.earned;
  const pct = badge.target > 0 ? Math.min(100, Math.round((badge.progress / badge.target) * 100)) : 0;
  const isHidden = badge.isHidden && !earned;

  return (
    <TiltedCard
      containerHeight="auto"
      containerWidth="100%"
      scaleOnHover={1.03}
      rotateAmplitude={8}
      className="h-full"
    >
      <div
        className={cn(
          "badge-glass relative h-full p-5 badge-card-enter rounded-2xl",
          earned && "badge-earned-shine"
        )}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Hidden overlay */}
        {isHidden && (
          <div className="absolute inset-0 badge-hidden-blur rounded-2xl z-10 flex flex-col items-center justify-center gap-2">
            <Lock size={20} className="text-muted-foreground/50" />
            <span className="text-[9px] font-general uppercase tracking-widest text-muted-foreground/50">
              Hidden
            </span>
          </div>
        )}

        <div className={cn(isHidden && "blur-sm select-none")}>
          {/* Icon + Info row */}
          <div className="flex items-start gap-3">
            {/* Icon container */}
            <div
              className={cn(
                "relative flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-500",
                earned ? "scale-100" : "grayscale opacity-50"
              )}
              style={{
                background: earned ? accent.bg : "rgba(255,255,255,0.03)",
                border: earned ? `1px solid ${accent.glow}` : "1px solid rgba(255,255,255,0.05)",
                boxShadow: earned ? `0 0 16px ${accent.glow}` : "none",
              }}
            >
              <BadgeIcon
                badge={badge}
                className={earned ? accent.text : "text-muted-foreground"}
                size={20}
              />
              {earned && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-background">
                  <CheckCircle2 size={8} className="text-white" />
                </div>
              )}
            </div>

            {/* Text info */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-general font-bold text-xs tracking-wide leading-tight",
                  earned ? "text-white" : "text-white/80"
                )}
              >
                {badge.name}
              </h3>
              <p className="text-[10px] text-white/55 mt-0.5 line-clamp-2 leading-snug">
                {badge.description}
              </p>
            </div>
          </div>

          {/* Reward chips */}
          <div className="flex items-center gap-1.5 mt-3">
            {badge.coinReward > 0 && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-5 gap-1 border-amber-500/20 text-amber-400 bg-amber-500/5">
                <Coins size={8} /> +{badge.coinReward}
              </Badge>
            )}
            {badge.xpReward > 0 && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-5 gap-1 border-[#5542FF]/20 text-[#B28EF2] bg-[#5542FF]/5">
                <Sparkles size={8} /> +{badge.xpReward}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-medium uppercase tracking-widest text-muted-foreground/70">
                {earned ? "Unlocked" : `${badge.progress} / ${badge.target}`}
              </span>
              <span className={cn(
                "text-[9px] font-bold tabular-nums",
                earned ? "text-emerald-400" : accent.text
              )}>
                {pct}%
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden bg-white/5">
              <div
                className="h-full transition-all duration-1000 ease-out rounded-full"
                style={{
                  width: `${pct}%`,
                  background: earned ? "linear-gradient(90deg, #10b981, #34d399)" : accent.bar,
                  boxShadow: earned ? "0 0 8px rgba(16, 185, 129, 0.3)" : `0 0 8px ${accent.glow}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </TiltedCard>
  );
}

/* ═══════════════════ Main Page ═══════════════════ */
export default function AchievementsPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  const badges = useAchievementStore((s) => s.achievements);
  const loading = useAchievementStore((s) => s.loading);
  const loadAchievements = useAchievementStore((s) => s.loadAchievements);
  const earnedCount = useAchievementStore((s) => s.earnedCount);

  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    if (!user?.uid) return;
    loadAchievements(user.uid);
  }, [user?.uid, loadAchievements]);

  /* GSAP hero animation */
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".badge-hero-word",
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.6, ease: "power3.out",
        }
      );
      gsap.fromTo(
        ".badge-hero-sub",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        ".badge-stats-row",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.4, ease: "power2.out" }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const filtered = useMemo(
    () => activeCategory === "ALL" ? badges : badges.filter((b) => b.category === activeCategory),
    [badges, activeCategory]
  );

  const inProgressCount = useMemo(
    () => badges.filter((b) => !b.earned && b.progress > 0).length,
    [badges]
  );

  const overallPct = badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ── Decorative orbs ── */}
      <div className="badge-orb w-[350px] h-[350px] top-[-10%] left-[-10%]"
        style={{ background: "rgba(85, 66, 255, 0.1)" }} />
      <div className="badge-orb w-[280px] h-[280px] top-[20%] right-[-8%]"
        style={{ background: "rgba(178, 142, 242, 0.07)", animationDelay: "3s" }} />
      <div className="badge-orb w-[200px] h-[200px] bottom-[10%] left-[20%]"
        style={{ background: "rgba(237, 255, 102, 0.04)", animationDelay: "5s" }} />

      {/* ── Dot pattern overlay ── */}
      <div className="dot-pattern absolute inset-0 opacity-50 pointer-events-none" />

      <div className="relative z-10 pt-10 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* ── Back button ── */}
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="uppercase text-[10px] tracking-widest font-medium">Back</span>
          </button>

          {/* ── Hero Section ── */}
          <div ref={heroRef} className="mb-6">
            {/* Top row: Title + Stats inline */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              {/* Title */}
              <div className="badge-hero-word">
                <GradientText
                  colors={["#5542FF", "#B28EF2", "#34d399", "#5542FF"]}
                  animationSpeed={6}
                  className="!mx-0 text-5xl sm:text-6xl font-zentry font-black uppercase tracking-tight"
                >
                  Achievements
                </GradientText>
                <p className="badge-hero-sub text-white/50 text-xs mt-1.5 max-w-md leading-relaxed">
                  Forge your legacy — earn badges and unlock rewards.
                </p>
              </div>

              {/* Compact stats */}
              <div className="badge-stats-row flex items-center gap-4 sm:gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-primary/10">
                    <Award size={14} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-zentry font-black text-foreground leading-none">{badges.length}</p>
                    <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Total</p>
                  </div>
                </div>

                <div className="w-px h-6 bg-border/30" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10">
                    <Trophy size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-zentry font-black text-emerald-400 leading-none">{earnedCount}</p>
                    <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Earned</p>
                  </div>
                </div>

                <div className="w-px h-6 bg-border/30" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/10">
                    <Flame size={14} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg font-zentry font-black text-orange-400 leading-none">{inProgressCount}</p>
                    <p className="text-[8px] uppercase tracking-widest text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Minimal inline progress bar */}
            {!loading && badges.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap">
                  {earnedCount}/{badges.length}
                </span>
                <Progress
                  value={overallPct}
                  className="h-1.5 flex-1 bg-white/5"
                />
                <span className="text-xs font-bold font-zentry tabular-nums text-brand-primary whitespace-nowrap">
                  {overallPct}%
                </span>
              </div>
            )}
          </div>

          {/* ── Category Tabs ── */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(({ key, label, icon: Icon }) => {
              const isActive = activeCategory === key;
              const count = key === "ALL"
                ? badges.length
                : badges.filter((b) => b.category === key).length;
              const earnedInCat = key === "ALL"
                ? earnedCount
                : badges.filter((b) => b.category === key && b.earned).length;

              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 text-xs font-medium transition-all duration-300 rounded-lg",
                    isActive
                      ? "badge-tab-active"
                      : "badge-tab-inactive text-muted-foreground hover:text-foreground border border-white/[0.06]"
                  )}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                  <span className={cn(
                    "text-[10px] tabular-nums ml-1",
                    isActive ? "text-white/70" : "text-muted-foreground/50"
                  )}>
                    {earnedInCat}/{count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Grid ── */}
          <div ref={gridRef}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 relative">
                <div className="badge-orb w-[200px] h-[200px] top-1/2 left-1/2"
                  style={{ background: "rgba(85, 66, 255, 0.1)" }} />
                <Award size={56} className="mx-auto text-muted-foreground/20 mb-5" style={{ animation: "badge-float 3s ease-in-out infinite" }} />
                <p className="font-zentry font-black text-2xl text-muted-foreground/30 uppercase mb-2">
                  No badges yet
                </p>
                <p className="text-sm text-muted-foreground/40">
                  Start solving problems to unlock badges in this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...filtered]
                  .sort((a, b) => (a.earned === b.earned ? 0 : a.earned ? -1 : 1))
                  .map((badge, i) => (
                    <BadgeCard key={badge.id} badge={badge} index={i} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
