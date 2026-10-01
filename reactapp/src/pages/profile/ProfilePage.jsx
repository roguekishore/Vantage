import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ChevronLeft, ChevronRight, Flame, LogOut, Shield, VolumeX, Volume2 } from "lucide-react";
import { fetchUserStats, fetchUserProfile } from "@/services/userApi";
import { fetchCoinHistory } from "@/services/gamificationApi";
import useGamificationStore from "@/stores/useGamificationStore";
import useUserStore from "@/stores/useUserStore";
import useFriendsStore from "@/stores/useFriendsStore";
import useProgressStore, { STAGES, STAGE_ORDER, ALL_PROBLEMS, Difficulty } from "@/map/useProgressStore";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  ListRow,
  OfflineState,
  PageHeader,
  PageLoader,
  PageShell,
  Panel,
  Progress,
  Stat,
} from "@/components/ds";

/*
 * Profile: PageHeader (square Avatar, name as the h1,
 * handle and email), a stat grid (rating, level, XP, streak, coins),
 * problem progress with the difficulty split, progress by topic as
 * Progress bars, and recent coin activity as ListRows.
 */

const getRatingTier = (r) => {
  if (r >= 500) return "Grandmaster";
  if (r >= 300) return "Master";
  if (r >= 150) return "Expert";
  if (r >= 50) return "Intermediate";
  return "Beginner";
};

const getDiffBreakdown = (cp) => {
  const s = ALL_PROBLEMS.filter((p) => cp.includes(p.id));
  return {
    easy: s.filter((p) => p.difficulty === Difficulty.EASY).length,
    medium: s.filter((p) => p.difficulty === Difficulty.MEDIUM).length,
    hard: s.filter((p) => p.difficulty === Difficulty.HARD).length,
  };
};

// fetch() rejects with a TypeError when the server can't be reached.
const isNetworkError = (e) =>
  e instanceof TypeError || /^(failed to fetch|load failed)$|networkerror/i.test(e?.message || "");

const sentence = (s = "") => {
  const t = s.trim().toLowerCase();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
};

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : n);

const DIFF_TONE = {
  Easy: { text: "text-ok", bar: "border-l-ok" },
  Medium: { text: "text-warn", bar: "border-l-warn" },
  Hard: { text: "text-err", bar: "border-l-err" },
};

function DifficultyRow({ label, count, total }) {
  const tone = DIFF_TONE[label];
  return (
    <div className={`grid gap-2 border-l-2 pl-3 ${tone.bar}`}>
      <div className="flex items-baseline justify-between gap-3 font-mono text-small tabular-nums">
        <span className={tone.text}>{label}</span>
        <span className="text-fg-muted">
          {count} / {total}
        </span>
      </div>
      <Progress value={count} max={Math.max(total, 1)} label={`${label} problems solved`} />
    </div>
  );
}

function StageRow({ stage, prog }) {
  return (
    <ListRow
      title={stage.name}
      trailing={
        <>
          <span className="w-14 text-right font-mono text-small tabular-nums text-fg-muted">
            {prog.completed}/{prog.total}
          </span>
          {prog.isComplete ? (
            <CheckCircle size={16} strokeWidth={1.5} className="text-accent-ink" role="img" aria-label="Complete" />
          ) : (
            <span className="inline-block w-4" aria-hidden="true" />
          )}
        </>
      }
    >
      <Progress value={prog.percentage} label={`${stage.name} progress`} className="mt-1" />
    </ListRow>
  );
}

function CoinTx({ tx }) {
  const pos = tx.amount > 0;
  return (
    <ListRow
      title={sentence(tx.source.replace(/_/g, " "))}
      meta={new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      trailing={
        <div className="grid justify-items-end gap-0.5 font-mono tabular-nums">
          <span className={`text-body font-bold ${pos ? "text-ok" : "text-err"}`}>
            {pos ? "+" : "−"}
            {Math.abs(tx.amount)}
          </span>
          <span className="text-small text-fg-muted">Balance {fmt(tx.balanceAfter)}</span>
        </div>
      }
    />
  );
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [coinHistory, setCoinHistory] = useState(null);
  const [coinPage, setCoinPage] = useState(0);

  const user = useUserStore((s) => s.user);
  const gamStats = useGamificationStore((s) => s.stats);
  const streakData = useGamificationStore((s) => s.streak);
  const completedProblems = useProgressStore((s) => s.completedProblems);
  const getStageProgress = useProgressStore((s) => s.getStageProgress);
  const getTotalProgress = useProgressStore((s) => s.getTotalProgress);
  const loadProgress = useProgressStore((s) => s.loadProgress);
  const challengeMuteUntil = useFriendsStore((s) => s.challengeMuteUntil);
  const loadChallengeMuteStatus = useFriendsStore((s) => s.loadChallengeMuteStatus);
  const unmuteChallenges = useFriendsStore((s) => s.unmuteChallenges);
  const friendsActionLoading = useFriendsStore((s) => s.actionLoading);

  const totalProgress = getTotalProgress();
  const diffBreakdown = useMemo(() => getDiffBreakdown(completedProblems), [completedProblems]);

  const load = useCallback(async () => {
    if (!user?.uid) { navigate("/login"); return; }
    setLoading(true);
    setOffline(false);
    try {
      const [pd, sd, cd] = await Promise.all([
        fetchUserProfile(user.uid), fetchUserStats(user.uid),
        fetchCoinHistory(user.uid, 0, 10).catch(() => null),
        loadProgress(user.uid), loadChallengeMuteStatus(),
      ]);
      setProfile(pd); setStats(sd); setCoinHistory(cd);
      if (!gamStats) useGamificationStore.getState().loadStats(user.uid);
    } catch (e) {
      // Unreachable API: show OfflineState instead of signing the user out.
      if (isNetworkError(e)) { setOffline(true); return; }
      useUserStore.getState().clearUser(); navigate("/login");
    }
    finally { setLoading(false); }
  }, [user?.uid]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const goToCoinPage = async (p) => {
    setCoinPage(p);
    setCoinHistory(await fetchCoinHistory(user.uid, p, 10));
  };

  const signOut = () => {
    useUserStore.getState().clearUser();
    window.postMessage({ type: "VANTAGE_LOGOUT" }, "*");
    navigate("/login");
  };

  if (loading) return <PageLoader label="LOADING PROFILE_" />;

  if (offline) {
    return (
      <PageShell>
        <PageHeader eyebrow="Account" title="Profile" />
        <OfflineState onRetry={load} />
      </PageShell>
    );
  }

  const du = profile || user;
  const muts = challengeMuteUntil ? new Date(challengeMuteUntil).getTime() : 0;
  const isDnd = Boolean(muts && muts > Date.now());
  const mutLabel = isDnd
    ? new Date(challengeMuteUntil).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  const rating = du?.rating ?? 0;
  const tierLabel = getRatingTier(rating);

  const xpPct = gamStats && gamStats.xpForNextLevel > gamStats.xpForCurrentLevel
    ? Math.min(100, ((gamStats.xp - gamStats.xpForCurrentLevel) / (gamStats.xpForNextLevel - gamStats.xpForCurrentLevel)) * 100)
    : gamStats ? 100 : 0;

  const pStats = [
    { label: "Solved", value: stats?.solved ?? totalProgress.completed },
    { label: "Attempted", value: stats?.attempted ?? 0 },
    { label: "Remaining", value: stats?.notStarted ?? (totalProgress.total - totalProgress.completed) },
    { label: "Total", value: stats?.total ?? totalProgress.total },
  ];

  const diffRows = [
    { label: "Easy", count: diffBreakdown.easy, total: ALL_PROBLEMS.filter((p) => p.difficulty === Difficulty.EASY).length },
    { label: "Medium", count: diffBreakdown.medium, total: ALL_PROBLEMS.filter((p) => p.difficulty === Difficulty.MEDIUM).length },
    { label: "Hard", count: diffBreakdown.hard, total: ALL_PROBLEMS.filter((p) => p.difficulty === Difficulty.HARD).length },
  ];

  const name = du?.username || "Player";
  const totalPages = coinHistory?.totalPages || 0;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Profile"
        title={
          <span className="flex min-w-0 items-center gap-4">
            <span aria-hidden="true" className="shrink-0">
              <Avatar name={name} src={du?.avatarUrl || du?.photoURL} className="size-14 text-h3 md:size-16" />
            </span>
            <span className="min-w-0 break-words">{name}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-fg">@{name}</span>
            {du?.email ? <span className="break-all">{du.email}</span> : null}
            <Badge tone="outline">{tierLabel}</Badge>
            {du?.institutionName ? <Badge>{du.institutionName}</Badge> : null}
          </span>
        }
        actions={
          <Button variant="secondary" onClick={signOut}>
            <LogOut aria-hidden="true" /> Sign out
          </Button>
        }
      />

      <div className="grid gap-6">
        {/* Stat grid */}
        <Panel as="section" label="Overview" padded={false}>
          <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-5">
            <Stat className="bg-surface p-4" label="Rating" value={fmt(rating)} hint={`${tierLabel} tier`} />
            <Stat className="bg-surface p-4" label="Level" value={gamStats ? fmt(gamStats.level) : "–"} hint={gamStats ? `${Math.round(xpPct)}% to next` : undefined} />
            <Stat className="bg-surface p-4" label="XP" value={gamStats ? fmt(gamStats.xp || 0) : "–"} hint={gamStats ? `Next at ${fmt(gamStats.xpForNextLevel || 1)}` : undefined} />
            <Stat
              className="bg-surface p-4"
              label="Streak"
              value={streakData ? fmt(streakData.currentStreak) : "–"}
              hint={streakData ? `Day${streakData.currentStreak !== 1 ? "s" : ""}, record ${streakData.longestStreak || 0}` : undefined}
            />
            <Stat className="col-span-2 bg-surface p-4 md:col-span-1" label="Coins" value={gamStats ? fmt(gamStats.coins || 0) : "–"} />
          </div>
          {gamStats ? (
            <div className="grid gap-2 border-t border-border p-4">
              <div className="flex items-baseline justify-between gap-3 font-mono text-small tabular-nums text-fg-muted">
                <span>Level {gamStats.level} progress</span>
                <span>{Math.round(xpPct)}%</span>
              </div>
              <Progress value={xpPct} label="XP progress to next level" />
            </div>
          ) : null}
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Problems */}
          <Panel as="section" label="Problems" actions={<span className="font-mono text-small tabular-nums text-fg-muted">{totalProgress.percentage}%</span>}>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {pStats.map((s) => (
                  <Stat key={s.label} label={s.label} value={fmt(s.value)} />
                ))}
              </div>
              <div className="grid gap-2">
                <div className="font-mono text-small tabular-nums text-fg-muted">
                  {totalProgress.completed} of {totalProgress.total} solved, {totalProgress.total - totalProgress.completed} left
                </div>
                <Progress value={totalProgress.percentage} label="Overall progress" />
              </div>
              <div className="grid gap-4">
                {diffRows.map((d) => (
                  <DifficultyRow key={d.label} {...d} />
                ))}
              </div>
            </div>
          </Panel>

          <div className="grid content-start gap-6">
            {/* Streak */}
            {streakData ? (
              <Panel as="section" label="Streak">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Stat label="Record" value={fmt(streakData.longestStreak || 0)} />
                    <Stat label="Multiplier" value={`${(streakData.multiplier || 1).toFixed(1)}×`} />
                    <Stat label="Shields" value={fmt(streakData.shieldCount || 0)} />
                    <Stat label="Next goal" value={streakData.nextMilestone || "–"} />
                  </div>
                  <div className="flex items-center gap-2 border border-border bg-elevated px-3 py-2 font-mono text-small text-fg">
                    {streakData.solvedToday ? (
                      <><CheckCircle size={14} strokeWidth={1.5} className="text-ok" aria-hidden="true" /> Streak secured today</>
                    ) : streakData.shieldCount > 0 ? (
                      <><Shield size={14} strokeWidth={1.5} className="text-accent-ink" aria-hidden="true" /> {streakData.shieldCount} shield active</>
                    ) : (
                      <><Flame size={14} strokeWidth={1.5} className="text-warn" aria-hidden="true" /> Solve a problem today to {streakData.currentStreak > 0 ? "keep your streak" : "start a streak"}</>
                    )}
                  </div>
                </div>
              </Panel>
            ) : null}

            {/* Do not disturb */}
            <Panel as="section" label="Challenges">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {isDnd ? (
                    <VolumeX size={16} strokeWidth={1.5} className="shrink-0 text-accent-ink" aria-hidden="true" />
                  ) : (
                    <Volume2 size={16} strokeWidth={1.5} className="shrink-0 text-fg-muted" aria-hidden="true" />
                  )}
                  <div className="grid gap-0.5 font-mono">
                    <div className="text-body text-fg">Do not disturb</div>
                    <div className="text-small text-fg-muted">
                      {isDnd ? `On until ${mutLabel}` : "Off. You receive challenges from friends."}
                    </div>
                  </div>
                </div>
                {isDnd ? (
                  <Button size="sm" variant="secondary" onClick={unmuteChallenges} disabled={friendsActionLoading}>
                    Turn off
                  </Button>
                ) : null}
              </div>
            </Panel>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Progress by topic */}
          <Panel as="section" label="Progress by topic" padded={false}>
            <div className="[&>*:last-child]:border-b-0">
              {STAGE_ORDER.map((key) => (
                <StageRow key={key} stage={STAGES[key]} prog={getStageProgress(key)} />
              ))}
            </div>
          </Panel>

          {/* Recent activity */}
          <Panel
            as="section"
            label="Recent activity"
            padded={false}
            actions={
              totalPages > 1 ? (
                <span className="font-mono text-small tabular-nums text-fg-muted">
                  Page {coinPage + 1} of {totalPages}
                </span>
              ) : null
            }
          >
            {coinHistory == null ? (
              <ErrorState
                className="border-0"
                title="Activity could not be loaded"
                description="Your coin history didn't load. The rest of your profile is up to date."
                onRetry={async () => setCoinHistory(await fetchCoinHistory(user.uid, coinPage, 10).catch(() => null))}
              />
            ) : coinHistory.content?.length > 0 ? (
              <>
                <div className="[&>*:last-child]:border-b-0">
                  {coinHistory.content.map((tx) => (
                    <CoinTx key={tx.id} tx={tx} />
                  ))}
                </div>
                {totalPages > 1 ? (
                  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2">
                    <IconButton
                      icon={ChevronLeft}
                      size="sm"
                      aria-label="Previous page"
                      disabled={coinPage === 0}
                      onClick={() => { if (coinPage > 0) goToCoinPage(coinPage - 1); }}
                    />
                    <span className="font-mono text-small tabular-nums text-fg-muted">
                      {coinPage + 1} / {totalPages}
                    </span>
                    <IconButton
                      icon={ChevronRight}
                      size="sm"
                      aria-label="Next page"
                      disabled={coinPage >= totalPages - 1}
                      onClick={() => { if (coinPage < totalPages - 1) goToCoinPage(coinPage + 1); }}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                className="border-0"
                title="No activity yet"
                description="Coins you earn and spend show up here."
              />
            )}
          </Panel>
        </div>
      </div>
    </PageShell>
  );
};

export default ProfilePage;
