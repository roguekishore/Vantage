import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy, Flame, Coins, Sparkles, Crown, Medal,
  ChevronLeft, ChevronRight, ArrowLeft, TrendingUp, Swords, Building2, Timer,
} from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";
import { getStoredUser } from "@/services/userApi";
import {
  fetchGlobalXPLeaderboard,
  fetchWeeklyXPLeaderboard,
  fetchWeeklyCoinsLeaderboard,
  fetchStreakLeaderboard,
  fetchBattleRatingLeaderboard,
  fetchMyRank,
  fetchInstitutionLeaderboard,
} from "@/services/leaderboardApi";

/* ══════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════ */

function getNextMonday() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const daysUntil = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatCountdown(ms) {
  if (ms <= 0) return "Resetting soon…";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/* ══════════════════════════════════════════════
   Sub-components
══════════════════════════════════════════════ */

function WeekResetBanner() {
  const [timeLeft, setTimeLeft] = useState(() => getNextMonday() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getNextMonday() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/60 bg-card w-fit">
      <div className="w-6 h-6 rounded-md bg-sky-500/10 flex items-center justify-center shrink-0">
        <Timer className="w-3.5 h-3.5 text-sky-500" />
      </div>
      <span className="text-xs text-muted-foreground">Resets in</span>
      <span className="text-xs font-bold text-foreground font-mono tabular-nums">{formatCountdown(timeLeft)}</span>
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
      <Crown className="w-4 h-4 text-amber-500" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center shrink-0">
      <Medal className="w-4 h-4 text-zinc-400" />
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center shrink-0">
      <Medal className="w-4 h-4 text-orange-600" />
    </div>
  );
  return (
    <div className="w-8 flex items-center justify-center shrink-0">
      <span className="text-xs text-muted-foreground font-bold tabular-nums">#{rank}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Tab Config
══════════════════════════════════════════════ */

const TABS = [
  { key: "global-xp",     label: "Global XP",     icon: Sparkles,    accent: "text-[#5542FF]",   bg: "bg-[#5542FF]/10" },
  { key: "weekly-xp",     label: "Weekly XP",     icon: TrendingUp,  accent: "text-sky-500",     bg: "bg-sky-500/10",    weekly: true },
  { key: "weekly-coins",  label: "Weekly Coins",  icon: Coins,       accent: "text-amber-500",   bg: "bg-amber-500/10",  weekly: true },
  { key: "streaks",       label: "Streaks",       icon: Flame,       accent: "text-orange-500",  bg: "bg-orange-500/10" },
  { key: "battle-rating", label: "Battle Rating", icon: Swords,      accent: "text-rose-500",    bg: "bg-rose-500/10" },
  { key: "institution",   label: "Institution",   icon: Building2,   accent: "text-emerald-500", bg: "bg-emerald-500/10" },
];

const FETCH_MAP = {
  "global-xp":     fetchGlobalXPLeaderboard,
  "weekly-xp":     fetchWeeklyXPLeaderboard,
  "weekly-coins":  fetchWeeklyCoinsLeaderboard,
  "streaks":       fetchStreakLeaderboard,
  "battle-rating": fetchBattleRatingLeaderboard,
};

const VALUE_LABEL = {
  "global-xp":     "XP",
  "weekly-xp":     "XP",
  "weekly-coins":  "Coins",
  "streaks":       "Days",
  "battle-rating": "Rating",
  "institution":   "XP",
};

const PAGE_SIZE = 20;

/* ══════════════════════════════════════════════
   Page
══════════════════════════════════════════════ */

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [activeTab, setActiveTab]   = useState("global-xp");
  const [page, setPage]             = useState(0);
  const [data, setData]             = useState(null);
  const [myRank, setMyRank]         = useState(null);
  const [loading, setLoading]       = useState(true);

  const userInstitutionId   = user?.institutionId   ?? null;
  const userInstitutionName = user?.institutionName ?? null;
  const currentTab          = TABS.find((t) => t.key === activeTab);
  const isWeekly            = currentTab?.weekly ?? false;

  const loadData = useCallback(async () => {
    if (activeTab === "institution" && !userInstitutionId) {
      setData(null); setMyRank(null); setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let pageData, rankData;
      if (activeTab === "institution") {
        pageData  = await fetchInstitutionLeaderboard(userInstitutionId, page, PAGE_SIZE);
        rankData  = null;
      } else {
        [pageData, rankData] = await Promise.all([
          FETCH_MAP[activeTab](page, PAGE_SIZE),
          user?.uid ? fetchMyRank(user.uid, activeTab).catch(() => null) : null,
        ]);
      }
      setData(pageData);
      setMyRank(rankData);
    } catch (err) {
      console.error("Leaderboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, user?.uid, userInstitutionId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(0); }, [activeTab]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="battle-fade-up">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Leaderboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">See how you stack up against other players</p>
            </div>
          </div>
        </div>

        {/* ── My Rank ── */}
        {myRank && (
          <div className="battle-fade-up battle-fade-up-delay-1 rounded-xl border border-border/60 bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-foreground uppercase">
                  {myRank.username?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{myRank.username}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Your Rank</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-foreground tabular-nums">
                  #<NumberTicker value={myRank.rank} className="font-black text-foreground" />
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {myRank.value?.toLocaleString()} {VALUE_LABEL[activeTab]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Bar ── */}
        <div className="battle-fade-up battle-fade-up-delay-2 flex gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-background shadow-sm text-foreground border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={13} className={isActive ? tab.accent : ""} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Weekly Reset Banner ── */}
        {isWeekly && <WeekResetBanner />}

        {/* ── Institution subtitle ── */}
        {activeTab === "institution" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 size={14} className="text-emerald-500" />
            {userInstitutionName
              ? <span>Rankings within <span className="font-medium text-foreground">{userInstitutionName}</span></span>
              : <span className="text-destructive text-xs">You are not part of any institution.</span>
            }
          </div>
        )}

        {/* ── Leaderboard Table ── */}
        <div className="battle-fade-up battle-fade-up-delay-3 rounded-xl border border-border/60 bg-card overflow-hidden">

          {/* Section header */}
          <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentTab && (
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", currentTab.bg)}>
                  <currentTab.icon className={cn("w-3.5 h-3.5", currentTab.accent)} />
                </div>
              )}
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {currentTab?.label} Rankings
                {activeTab === "institution" && userInstitutionName && ` · ${userInstitutionName}`}
              </span>
            </div>
            {data && data.totalPages > 1 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {page + 1} / {data.totalPages}
              </span>
            )}
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/40">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/60 animate-pulse shrink-0" />
                  <div className="w-9 h-9 rounded-lg bg-muted/60 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 rounded bg-muted/60 animate-pulse" />
                    <div className="h-2.5 w-16 rounded bg-muted/40 animate-pulse" />
                  </div>
                  <div className="w-14 h-4 rounded bg-muted/60 animate-pulse" />
                </div>
              ))
            ) : !data?.content?.length ? (
              <div className="px-6 py-16 text-center">
                <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  {activeTab === "institution" && !userInstitutionId
                    ? "You need to be part of an institution to see this leaderboard."
                    : "No data yet. Solve problems to climb the ranks!"}
                </p>
              </div>
            ) : (
              data.content.map((entry) => {
                const isMe = user?.uid === entry.userId;
                return (
                  <div
                    key={`${entry.userId}-${entry.rank}`}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3.5 transition-colors",
                      isMe ? "bg-primary/[0.04]" : "hover:bg-muted/30"
                    )}
                  >
                    <RankBadge rank={entry.rank} />

                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 uppercase",
                      isMe ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
                    )}>
                      {entry.username?.charAt(0) || "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold truncate", isMe ? "text-primary" : "text-foreground")}>
                        {entry.username}
                        {isMe && <span className="ml-1.5 text-[11px] text-primary/60 font-normal">(you)</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Lv.{entry.level}{entry.currentStreak > 0 && ` · 🔥 ${entry.currentStreak}d`}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm font-bold tabular-nums",
                        entry.rank <= 3 ? "text-amber-500" : "text-foreground"
                      )}>
                        {entry.value.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {VALUE_LABEL[activeTab]}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination footer */}
          {data && data.totalPages > 1 && (
            <div className="px-6 py-3.5 border-t border-border/60 flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                onClick={() => setPage(Math.min(data.totalPages - 1, page + 1))}
                disabled={page >= data.totalPages - 1}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
