import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award, Trophy, Flame, Swords, Star, Lock,
  Coins, Sparkles, CheckCircle2,
} from "lucide-react";
import useUserStore from "@/stores/useUserStore";
import useAchievementStore from "@/stores/useAchievementStore";
import {
  PageShell, PageHeader, Panel, Badge, Button, Stat, Progress, Skeleton,
  Tabs, TabsList, TabsTrigger, TabsContent,
  EmptyState, ErrorState, OfflineState,
} from "@/components/ds";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "ALL",     label: "All",      icon: Award  },
  { key: "PROBLEM", label: "Problems", icon: Star   },
  { key: "STREAK",  label: "Streaks",  icon: Flame  },
  { key: "BATTLE",  label: "Battle",   icon: Swords },
  { key: "SPECIAL", label: "Special",  icon: Trophy },
];

/* The store keeps err.message only. fetch() network failures surface as
   "Failed to fetch" (Chromium), "NetworkError when attempting to fetch
   resource." (Firefox) or "Load failed" (Safari); a non-OK response reads
   "Failed to fetch achievements". */
const NETWORK_ERROR = /^(failed to fetch|networkerror when attempting to fetch resource\.?|load failed|network request failed)$/i;

/* earnedAt is a Java LocalDateTime: an ISO string, or an array if the
   server ever serialises dates as timestamps. */
function formatDate(value) {
  if (!value) return null;
  const d = Array.isArray(value) ? new Date(value[0], (value[1] || 1) - 1, value[2] || 1) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* ─────────────────────────────────────────────
   BADGE ICON
─────────────────────────────────────────────── */
function BadgeIcon({ badge, size = 20, className }) {
  const n = (badge.name || "").toLowerCase();
  const p = { size, strokeWidth: 1.5, "aria-hidden": true, className: cn("shrink-0", className) };
  if (n.includes("streak") || n.includes("warrior")) return <Flame    {...p} />;
  if (n.includes("battle") || n.includes("clash"))   return <Swords   {...p} />;
  if (n.includes("trophy") || n.includes("century")) return <Trophy   {...p} />;
  if (n.includes("mastery"))                          return <Star     {...p} />;
  if (n.includes("sweep"))                            return <Sparkles {...p} />;
  switch (badge.category) {
    case "STREAK":  return <Flame  {...p} />;
    case "BATTLE":  return <Swords {...p} />;
    case "SPECIAL": return <Trophy {...p} />;
    default:        return <Award  {...p} />;
  }
}

/* ─────────────────────────────────────────────
   BADGE CARD
   earned       accent-ink border + earned date
   in progress  default border + progress bar
   locked       --fg-dim text + 1px dashed border
─────────────────────────────────────────────── */
function BadgeCard({ badge }) {
  const earned = badge.earned;
  const pct    = badge.target > 0 ? Math.min(100, Math.round((badge.progress / badge.target) * 100)) : 0;
  const hidden = badge.isHidden && !earned;
  const locked = !earned && !(badge.progress > 0);
  const date   = earned ? formatDate(badge.earnedAt) : null;
  const name   = hidden ? "Hidden badge" : badge.name;
  const desc   = hidden ? "Keep playing to reveal this badge." : badge.description;

  return (
    <Panel
      as="article"
      variant={earned ? "accent" : "default"}
      className={cn("flex h-full flex-col", locked && "border-dashed border-border-strong text-fg-dim")}
      bodyClassName="flex h-full flex-col"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex size-10 items-center justify-center border",
            earned ? "border-accent-ink text-accent-ink" : locked ? "border-dashed border-border-strong" : "border-border text-fg-muted"
          )}
        >
          {hidden ? <Lock size={20} strokeWidth={1.5} aria-hidden="true" /> : <BadgeIcon badge={badge} />}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {hidden ? (
            <Badge tone="outline" className={cn(locked && "text-fg-dim")}>
              <Lock size={12} strokeWidth={1.5} aria-hidden="true" /> Hidden
            </Badge>
          ) : null}
          <Badge tone="neutral">{badge.category}</Badge>
        </div>
      </div>

      <h3 className={cn("mb-2 truncate font-mono text-h3", locked ? "text-fg-dim" : "text-fg")} title={name}>
        {name}
      </h3>
      <p className={cn("mb-4 line-clamp-2 min-h-[3.2em] font-mono text-small", locked ? "text-fg-dim" : "text-fg-muted")}>
        {desc}
      </p>

      <div className="mt-auto grid gap-3 border-t border-border pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {badge.coinReward > 0 && (
              <Badge tone="outline" className={cn(locked && "text-fg-dim")}>
                <Coins size={12} strokeWidth={1.5} aria-hidden="true" /> +{badge.coinReward}
              </Badge>
            )}
            {badge.xpReward > 0 && (
              <Badge tone="outline" className={cn(locked && "text-fg-dim")}>
                <Sparkles size={12} strokeWidth={1.5} aria-hidden="true" /> +{badge.xpReward} XP
              </Badge>
            )}
            {!badge.coinReward && !badge.xpReward && (
              <span className="font-mono text-small text-fg-dim">No reward</span>
            )}
          </div>
          <span className={cn("font-mono text-small font-bold tabular-nums", earned ? "text-accent-ink" : locked ? "text-fg-dim" : "text-fg")}>
            {earned ? "100" : pct}%
          </span>
        </div>

        {earned ? (
          <div className="flex items-center gap-2 font-mono text-small tabular-nums text-fg-muted">
            <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-accent-ink" />
            {date ? <span>Earned <time dateTime={String(badge.earnedAt)}>{date}</time></span> : <span>Earned</span>}
          </div>
        ) : (
          <div className="grid gap-2">
            <Progress value={pct} label={`${name} progress`} />
            {badge.target > 0 ? (
              <div className={cn("font-mono text-small tabular-nums", locked ? "text-fg-dim" : "text-fg-muted")}>
                {badge.progress ?? 0} / {badge.target}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Panel>
  );
}

function BadgeGrid({ children }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function SkeletonCard() {
  return (
    <Panel>
      <div className="mb-4 flex items-start justify-between">
        <Skeleton className="size-10" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="mb-3 h-4 w-3/5" />
      <Skeleton className="mb-2 h-3 w-11/12" />
      <Skeleton className="mb-4 h-3 w-2/3" />
      <Skeleton className="h-1 w-full" />
    </Panel>
  );
}

function Section({ title, count, children }) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <h2 className="font-display text-h2 uppercase text-fg" style={{ fontSynthesis: "none" }}>{title}</h2>
        <Badge tone="neutral">{count}</Badge>
      </div>
      <BadgeGrid>{children}</BadgeGrid>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function AchievementsPage() {
  const navigate = useNavigate();
  const user     = useUserStore(s => s.user);

  const badges           = useAchievementStore(s => s.achievements);
  const loading          = useAchievementStore(s => s.loading);
  const loadAchievements = useAchievementStore(s => s.loadAchievements);
  const earnedCount      = useAchievementStore(s => s.earnedCount);
  const error            = useAchievementStore(s => s.error);
  const loadedFor        = useAchievementStore(s => s._loadedFor);

  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    if (!user?.uid) return;
    loadAchievements(user.uid);
  }, [user?.uid, loadAchievements]);

  const filtered   = useMemo(() => activeCategory === "ALL" ? badges : badges.filter(b => b.category === activeCategory), [badges, activeCategory]);
  const earned     = useMemo(() => [...filtered].filter(b =>  b.earned).sort((a,b) => (a.earnedAt||0) < (b.earnedAt||0) ? 1 : -1), [filtered]);
  const inProgress = useMemo(() => filtered.filter(b => !b.earned && b.progress > 0).sort((a,b) => (b.progress/b.target) - (a.progress/a.target)), [filtered]);
  const locked     = useMemo(() => filtered.filter(b => !b.earned && b.progress === 0), [filtered]);
  const overallPct = badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0;
  const inProgCt   = useMemo(() => badges.filter(b => !b.earned && b.progress > 0).length, [badges]);

  const header = (
    <PageHeader
      eyebrow="Badge collection"
      title="Achievements"
      description="Every badge is a milestone. Track what you have earned and what comes next."
    />
  );

  /* ── not logged in ── */
  if (!user?.uid) {
    return (
      <PageShell narrow>
        {header}
        <EmptyState
          icon={Award}
          title="Sign in to continue"
          description="Sign in to track your badges and progress."
          action={<Button variant="primary" onClick={() => navigate("/login")}>Sign in</Button>}
        />
      </PageShell>
    );
  }

  const retry = () => loadAchievements(user.uid);
  /* Before the first load for this user resolves, show skeletons rather than an empty state. */
  const pending = loading || (!error && loadedFor !== user.uid && badges.length === 0);
  const failed  = Boolean(error) && !loading && badges.length === 0;

  let content;
  if (failed) {
    content = NETWORK_ERROR.test(String(error).trim())
      ? <OfflineState onRetry={retry} />
      : <ErrorState description="Your achievements could not be loaded." onRetry={retry} />;
  } else if (pending) {
    content = (
      <BadgeGrid>
        {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
      </BadgeGrid>
    );
  } else if (badges.length === 0) {
    content = <EmptyState icon={Award} title="No badges yet" description="Start solving to unlock badges." />;
  } else if (filtered.length === 0) {
    content = <EmptyState icon={Award} title="No badges in this category" description="Pick another category to see more badges." />;
  } else {
    content = (
      <div className="grid gap-12">
        {earned.length > 0 && (
          <Section title="Earned" count={earned.length}>
            {earned.map(b => <BadgeCard key={b.id} badge={b} />)}
          </Section>
        )}
        {inProgress.length > 0 && (
          <Section title="In progress" count={inProgress.length}>
            {inProgress.map(b => <BadgeCard key={b.id} badge={b} />)}
          </Section>
        )}
        {locked.length > 0 && (
          <Section title="Locked" count={locked.length}>
            {locked.map(b => <BadgeCard key={b.id} badge={b} />)}
          </Section>
        )}
      </div>
    );
  }

  return (
    <PageShell>
      {header}

      {!failed ? (
        <Panel as="section" label="Overview" className="mb-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat label="Total badges" value={pending ? "—" : badges.length} />
            <Stat label="Earned" value={pending ? "—" : earnedCount} />
            <Stat label="In progress" value={pending ? "—" : inProgCt} />
            <Stat label="Completion" value={pending ? "—" : `${overallPct}%`} hint={pending ? undefined : `${earnedCount} of ${badges.length}`} />
          </div>
          <Progress value={pending ? 0 : overallPct} label="Overall completion" className="mt-6" />
        </Panel>
      ) : null}

      <Tabs value={activeCategory} onValueChange={setActiveCategory} variant="segmented">
        <TabsList aria-label="Badge categories" className="mb-8">
          {CATEGORIES.map(({ key, label, icon: Icon }) => {
            const count  = key === "ALL" ? badges.length : badges.filter(b => b.category === key).length;
            const earnedN = key === "ALL" ? earnedCount : badges.filter(b => b.category === key && b.earned).length;
            return (
              <TabsTrigger key={key} value={key}>
                <Icon aria-hidden="true" />
                {label}
                {!pending && !failed ? (
                  <span className="tabular-nums">
                    <span aria-hidden="true">{earnedN}/{count}</span>
                    <span className="sr-only">, {earnedN} of {count} earned</span>
                  </span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {CATEGORIES.map(({ key }) => (
          <TabsContent key={key} value={key}>
            {content}
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
