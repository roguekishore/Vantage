import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useBattleStore from "../stores/useBattleStore";
import { getStoredUser } from "../services/userApi";
import { fetchPlayerStats } from "../services/gamificationApi";
import { fetchBattleHistory } from "../services/battleApi";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import {
  Swords, Loader2, X, Check,
  Trophy, ArrowLeft, Zap, Crosshair, Crown,
  Clock, ArrowUp, ArrowDown, Minus, Shield,
  ChevronRight, History, AlertTriangle, RotateCcw, Users,
} from "lucide-react";

/* ── Constants ── */
const MODES = [
  {
    value: "CASUAL_1V1",
    label: "Casual",
    desc: "No rating changes. Warm up and have fun.",
    icon: Zap,
    gradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  {
    value: "RANKED_1V1",
    label: "Ranked",
    desc: "ELO on the line. Prove your skill.",
    icon: Crown,
    gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
];

const DIFFICULTIES = [
  { value: "EASY", label: "Easy", bg: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
  { value: "MEDIUM", label: "Medium", bg: "bg-amber-500", shadow: "shadow-amber-500/20" },
  { value: "HARD", label: "Hard", bg: "bg-red-500", shadow: "shadow-red-500/20" },
];

const PROBLEM_COUNTS = [1, 2, 3];
const LANGUAGES = [
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
];

/* ═══════════════════ Main Component ═══════════════════ */
export default function BattleLobbyPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;

  const {
    queueStatus, activeBattleState, battleId, lobby, loading, error,
    joinQueue, leaveQueue, fetchLobby, readyUp, reset, stopPolling, abandon,
  } = useBattleStore();

  const [mode, setMode] = useState("RANKED_1V1");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [problemCount, setProblemCount] = useState(2);
  const [language, setLanguage] = useState("cpp");
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchPlayerStats(userId).then(setStats).catch(() => {});
      setHistoryLoading(true);
      fetchBattleHistory(userId, 0, 20)
        .then(setHistory)
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
  }, [userId]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    // Don't auto-navigate when the interstitial is showing
    if (lobby?.state === "ACTIVE" && battleId && !activeBattleState) navigate(`/battle/match/${battleId}`);
  }, [lobby?.state, battleId, navigate, activeBattleState]);

  useEffect(() => {
    // Don't poll when the interstitial is showing — user hasn't chosen to rejoin yet
    if (!battleId || !userId || lobby?.state === "ACTIVE" || activeBattleState) return;
    const interval = setInterval(() => fetchLobby(battleId, userId), 3000);
    return () => clearInterval(interval);
  }, [battleId, userId, lobby?.state, fetchLobby, activeBattleState]);

  const handleFindBattle = () => { if (userId) joinQueue(userId, mode, difficulty, problemCount); };
  const handleCancel = () => { if (userId) leaveQueue(userId); };
  const handleReady = () => { if (battleId && userId) readyUp(battleId, userId, language); };
  const handleRejoin = () => {
    if (!battleId) return;
    if (activeBattleState === "ACTIVE") navigate(`/battle/match/${battleId}`);
    else if (activeBattleState === "WAITING") fetchLobby(battleId, userId);
  };
  const handleAbandon = async () => {
    if (!battleId || !userId) return;
    await abandon(battleId, userId);
    // Refresh history after abandon
    fetchBattleHistory(userId, 0, 20).then(setHistory).catch(() => {});
  };

  /* ── Not logged in ── */
  if (!userId) {
    return (
      <div className="battle-page min-h-screen bg-background flex items-center justify-center p-4">
        <div className="battle-card p-12 text-center space-y-6 max-w-sm w-full battle-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 dark:bg-white/5 flex items-center justify-center mx-auto">
            <Swords className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Sign in to Battle</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Challenge other players in real-time 1v1 coding duels.
            </p>
          </div>
          <Button onClick={() => navigate("/login")} className="w-full h-11 font-semibold rounded-xl">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  /* ── Active Battle Detected (rejoin or abandon) ── */
  if (activeBattleState && battleId) {
    return (
      <div className="battle-page min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-6 battle-fade-up">
          <div className="battle-card p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Active Battle Found</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                You have a battle that&apos;s still{" "}
                <span className="font-semibold text-foreground">
                  {activeBattleState === "ACTIVE" ? "in progress" : "in the lobby"}
                </span>
                . Would you like to rejoin or abandon it?
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={handleRejoin}
                className={cn(
                  "w-full h-12 rounded-xl font-bold text-sm transition-all",
                  "flex items-center justify-center gap-2",
                  "bg-foreground text-background dark:bg-white dark:text-black",
                  "hover:opacity-90 active:scale-[0.98]",
                  "shadow-lg shadow-foreground/10 dark:shadow-white/10"
                )}
              >
                <Swords className="w-4 h-4" />
                {activeBattleState === "ACTIVE" ? "Rejoin Battle" : "Rejoin Lobby"}
              </button>
              <button
                onClick={handleAbandon}
                className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <X className="w-3.5 h-3.5 inline mr-1.5" />
                Abandon &amp; Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Lobby (match found, waiting for ready) ── */
  if (lobby && lobby.state === "WAITING") {
    return (
      <div className="battle-page min-h-screen bg-background pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="battle-fade-up mb-10">
            <button
              onClick={() => { reset(); navigate("/battle"); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to lobby</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 flex items-center justify-center">
                <Crosshair className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Match Found</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Ready up to begin the battle</p>
              </div>
            </div>
          </div>

          {/* VS Card */}
          <div className="battle-card battle-card-glow p-8 battle-fade-up battle-fade-up-delay-1">
            {/* Players Row */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
              <PlayerLobbyCard info={lobby.you} isReady={lobby.you.isReady} label="YOU" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border/50 dark:border-white/10 flex items-center justify-center relative">
                  <span className="text-xs font-black tracking-widest text-muted-foreground">VS</span>
                  <div className="absolute inset-0 rounded-full border border-foreground/5 dark:border-white/5 animate-ping opacity-30" />
                </div>
              </div>
              <PlayerLobbyCard info={lobby.opponent} isReady={lobby.opponent.isReady} label="OPPONENT" />
            </div>

            {/* Match Info Tags */}
            <div className="battle-divider my-6" />
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <InfoTag label={lobby.mode.replace("_", " ")} />
              <InfoTag label={`${lobby.problemCount} Problem${lobby.problemCount > 1 ? "s" : ""}`} />
              <InfoTag label={`${lobby.durationMinutes} Min`} />
              <DifficultyTag difficulty={lobby.difficulty} />
            </div>

            {/* Language + Ready */}
            <div className="battle-divider my-6" />
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-3">
                <span className="battle-label">Language</span>
                <div className="flex gap-1 p-0.5 rounded-lg bg-foreground/5 dark:bg-white/5">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.value}
                      onClick={() => !lobby.you.isReady && setLanguage(l.value)}
                      disabled={lobby.you.isReady}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                        language === l.value
                          ? "bg-foreground text-background dark:bg-white dark:text-black shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >{l.label}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReady}
                  disabled={lobby.you.isReady || loading}
                  className={cn(
                    "h-11 px-8 font-semibold text-sm rounded-xl transition-all",
                    !lobby.you.isReady
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                      : ""
                  )}
                >
                  {lobby.you.isReady
                    ? <><Check className="w-4 h-4 mr-2" /> Ready</>
                    : loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Readying…</>
                      : "Ready Up"}
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 px-6 text-sm text-muted-foreground hover:text-destructive"
                  onClick={() => { reset(); navigate("/battle"); }}
                >
                  Leave
                </Button>
              </div>

              {!lobby.opponent.isReady && lobby.you.isReady && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Waiting for opponent…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Queue Searching ── */
  if (queueStatus === "QUEUED") {
    return (
      <div className="battle-page min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-sm w-full battle-fade-up">
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 rounded-full border border-foreground/5 dark:border-white/5" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent"
              style={{
                borderTopColor: "var(--battle-accent)",
                animation: "battle-ring-spin 1.5s linear infinite",
              }}
            />
            <div
              className="absolute inset-3 rounded-full border border-transparent"
              style={{
                borderBottomColor: "var(--battle-accent)",
                opacity: 0.4,
                animation: "battle-ring-spin 2s linear infinite reverse",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Swords className="w-8 h-8 text-foreground" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Searching for opponent</h2>
            <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
              {mode.replace("_", " ")} · {difficulty} · {problemCount} problem{problemCount > 1 ? "s" : ""}
            </p>
          </div>

          <div className="w-full h-0.5 rounded-full overflow-hidden bg-foreground/5 dark:bg-white/5">
            <div className="h-full battle-shimmer rounded-full" />
          </div>

          <button
            onClick={handleCancel}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors font-medium"
          >
            Cancel Search
          </button>
        </div>
      </div>
    );
  }

  /* ── Mode Selection (default) ── */
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="battle-fade-up">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Battle Arena</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Challenge other coders in real-time 1v1 duels</p>
            </div>

            {/* Stat strip */}
            {stats && (
              <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card divide-x divide-border/60 overflow-hidden shrink-0">
                {[
                  { label: "Rating", value: stats.battleRating, cls: "text-foreground" },
                  { label: "Wins",   value: history.filter(b => b.outcome === "WIN").length,  cls: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Losses", value: history.filter(b => b.outcome === "LOSS").length, cls: "text-red-500" },
                  { label: "Played", value: history.length, cls: "text-foreground" },
                ].map(s => (
                  <div key={s.label} className="px-5 py-3 text-center">
                    <div className={cn("text-lg font-black tabular-nums leading-none", s.cls)}>{s.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Group Battle Banner ── */}
        <div className="battle-fade-up">
          <button
            onClick={() => navigate("/group")}
            className={cn(
              "w-full flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-4",
              "hover:border-primary/40 hover:bg-card/80 transition-all group"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Group Battle <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">NEW</span></p>
                <p className="text-xs text-muted-foreground">3–8 players · FFA · Points-based scoring</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>

        {/* ── Equal 50/50 Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ══════ LEFT: Battle Config ══════ */}
          <div className="lg:sticky lg:top-24 battle-fade-up battle-fade-up-delay-1">
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">

              {/* Card header */}
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <Swords className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">New Battle</div>
                  <div className="text-[11px] text-muted-foreground">Configure your match settings</div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Mode */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {MODES.map(m => {
                      const active = mode === m.value;
                      return (
                        <button
                          key={m.value}
                          onClick={() => setMode(m.value)}
                          className={cn(
                            "relative flex flex-col gap-1.5 p-4 rounded-lg border text-left transition-all duration-150",
                            "hover:border-foreground/20 dark:hover:border-white/15",
                            active
                              ? cn("border-foreground/25 dark:border-white/20 bg-gradient-to-br", m.gradient)
                              : "border-border/50 dark:border-white/5 bg-transparent"
                          )}
                        >
                          <m.icon className={cn("w-4 h-4", active ? m.iconColor : "text-muted-foreground")} />
                          <span className={cn("text-sm font-semibold leading-none", active ? "text-foreground" : "text-muted-foreground")}>{m.label}</span>
                          <span className="text-[11px] text-muted-foreground leading-snug">{m.desc}</span>
                          {active && <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-foreground dark:bg-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTIES.map(d => {
                      const active = difficulty === d.value;
                      return (
                        <button
                          key={d.value}
                          onClick={() => setDifficulty(d.value)}
                          className={cn(
                            "py-2 rounded-lg text-sm font-semibold transition-all duration-150",
                            active
                              ? cn(d.bg, "text-white shadow-md", d.shadow)
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                          )}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Problems */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Problem Count</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROBLEM_COUNTS.map(c => {
                      const active = problemCount === c;
                      return (
                        <button
                          key={c}
                          onClick={() => setProblemCount(c)}
                          className={cn(
                            "py-2 rounded-lg text-sm font-semibold transition-all duration-150",
                            active
                              ? "bg-foreground text-background dark:bg-white dark:text-black"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                          )}
                        >
                          {c}
                          <span className="text-[10px] font-normal opacity-60 ml-1">·{c * 15}m</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Find Battle CTA */}
                <button
                  onClick={handleFindBattle}
                  disabled={loading}
                  className={cn(
                    "w-full h-12 rounded-lg font-bold text-sm transition-all duration-150",
                    "flex items-center justify-center gap-2",
                    "bg-foreground text-background dark:bg-white dark:text-black",
                    "hover:opacity-90 active:scale-[0.99]",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "shadow-sm"
                  )}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining queue…</>
                    : <><Swords className="w-4 h-4" /> Find Battle</>}
                </button>
              </div>
            </div>
          </div>

          {/* ══════ RIGHT: Battle History ══════ */}
          <div className="battle-fade-up battle-fade-up-delay-2">
            <BattleHistorySection history={history} loading={historyLoading} navigate={navigate} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────── Sub Components ─────────────────── */

function Section({ label, children, delay = 0 }) {
  return (
    <div className={cn("space-y-3 battle-fade-up", `battle-fade-up-delay-${delay}`)}>
      <span className="battle-label">{label}</span>
      {children}
    </div>
  );
}

function PlayerLobbyCard({ info, isReady, label }) {
  return (
    <div className="text-center space-y-3">
      <span className="battle-label">{label}</span>
      <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-lg font-bold bg-foreground/5 dark:bg-white/5 text-foreground">
        {info.username?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div>
        <div className="font-semibold text-sm text-foreground truncate">{info.username}</div>
        <div className="text-xs text-muted-foreground mt-0.5 tabular-nums">
          BR {info.battleRating} · Lv.{info.level}
        </div>
      </div>
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold",
        isReady
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-foreground/5 dark:bg-white/5 text-muted-foreground"
      )}>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          isReady ? "bg-emerald-500" : "bg-muted-foreground/40"
        )} />
        {isReady ? "Ready" : "Not Ready"}
      </div>
    </div>
  );
}

function InfoTag({ label }) {
  return (
    <span className="px-3 py-1 rounded-full bg-foreground/5 dark:bg-white/5 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}

function DifficultyTag({ difficulty }) {
  const colorMap = {
    EASY: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    MEDIUM: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    HARD: "text-red-600 dark:text-red-400 bg-red-500/10",
  };
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[11px] font-semibold",
      colorMap[difficulty] || ""
    )}>
      {difficulty}
    </span>
  );
}

/* ─────────────────── Battle History ─────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const OUTCOME_STYLES = {
  WIN: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: Trophy, label: "Victory" },
  LOSS: { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: X, label: "Defeat" },
  DRAW: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: Minus, label: "Draw" },
  FORFEIT: { text: "text-muted-foreground", bg: "bg-foreground/5 dark:bg-white/5", icon: X, label: "Forfeit" },
};

function BattleHistorySection({ history, loading, navigate }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
            <History className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Battle History</div>
            <div className="text-[11px] text-muted-foreground">Your recent matches</div>
          </div>
        </div>
        {history && history.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums px-2 py-1 rounded-md bg-muted/50 border border-border/40">
            {history.length} matches
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!loading && (!history || history.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center">
            <Swords className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No battles yet</p>
            <p className="text-xs text-muted-foreground mt-1">Find an opponent and start your first match</p>
          </div>
        </div>
      )}

      {/* List */}
      {!loading && history && history.length > 0 && (
        <div className="divide-y divide-border/40 overflow-y-auto max-h-[calc(100vh-18rem)]">
          {history.map((b) => (
            <BattleHistoryRow key={b.battleId} battle={b} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function BattleHistoryRow({ battle, navigate }) {
  const b = battle;
  const style = OUTCOME_STYLES[b.outcome] || OUTCOME_STYLES.LOSS;
  const OutcomeIcon = style.icon;
  const isCompleted = b.state === "COMPLETED" || b.state === "FORFEITED";
  const isRanked = b.mode === "RANKED_1V1";

  return (
    <button
      onClick={() => isCompleted && navigate(`/battle/result/${b.battleId}`)}
      disabled={!isCompleted}
      className={cn(
        "w-full px-6 py-4 text-left transition-colors duration-150 flex items-center gap-4",
        isCompleted ? "hover:bg-muted/40 cursor-pointer group" : "opacity-50 cursor-default"
      )}
    >
      {/* Outcome pill */}
      <div className={cn(
        "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold w-20 justify-center",
        style.bg, style.text
      )}>
        <OutcomeIcon className="w-3 h-3" />
        {style.label}
      </div>

      {/* Opponent */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground text-xs">vs</span>
          <span className="font-medium text-foreground truncate">{b.opponentUsername || "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <DifficultyTag difficulty={b.difficulty} />
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded border",
            isRanked
              ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
              : "text-muted-foreground bg-muted/50 border-border/40"
          )}>
            {isRanked ? "Ranked" : "Casual"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {b.yourSolved}/{b.problemCount} solved
          </span>
          {b.durationMinutes > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />{b.durationMinutes}m
            </span>
          )}
        </div>
      </div>

      {/* Right: rating + time */}
      <div className="text-right shrink-0 space-y-0.5">
        {isRanked && b.ratingChange != null ? (
          <div className={cn(
            "text-sm font-bold tabular-nums flex items-center justify-end gap-0.5",
            b.ratingChange > 0 ? "text-emerald-600 dark:text-emerald-400"
              : b.ratingChange < 0 ? "text-red-500"
              : "text-muted-foreground"
          )}>
            {b.ratingChange > 0 ? <ArrowUp className="w-3 h-3" /> :
             b.ratingChange < 0 ? <ArrowDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {b.ratingChange > 0 ? "+" : ""}{b.ratingChange}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground/50">—</div>
        )}
        <div className="text-[10px] text-muted-foreground">{timeAgo(b.completedAt || b.createdAt)}</div>
      </div>

      {isCompleted && (
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
      )}
    </button>
  );
}
