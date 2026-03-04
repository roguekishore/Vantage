import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../lib/utils";
import { getStoredUser } from "../services/userApi";
import useGroupBattleStore from "../stores/useGroupBattleStore";
import {
  Users, Crown, Zap, Copy, Check, ArrowLeft,
  Play, UserX, LogOut, AlertTriangle, Loader2,
  Shield, ChevronRight, Hash,
} from "lucide-react";
import { Button } from "../components/ui/button";

/* ── Constants ── */
const DIFFICULTIES = [
  { value: "EASY",   label: "Easy",   color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40" },
  { value: "MEDIUM", label: "Medium", color: "text-amber-400",   bg: "bg-amber-500/20 border-amber-500/40"   },
  { value: "HARD",   label: "Hard",   color: "text-red-400",     bg: "bg-red-500/20 border-red-500/40"       },
];
const PROBLEM_COUNTS = [1, 2, 3];
const MAX_PLAYERS_OPTIONS = [3, 4, 5, 6, 7, 8];

/* ═══════════════════════════════════════ Main Component ═══ */
export default function GroupLobbyPage() {
  const navigate = useNavigate();
  const { roomCode: codeParam } = useParams();   // if route is /group/:roomCode
  const user = getStoredUser();
  const userId = user?.uid;

  const { room, roomCode, battleId, loading, error, kicked, createRoom, lookupRoom, joinRoom, leaveRoom, kickPlayer, startBattle, reset } =
    useGroupBattleStore();

  /* ── Tab: create | join ── */
  const [tab, setTab] = useState(codeParam ? "join" : "create");

  /* ── Create-room form ── */
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [problemCount, setProblemCount] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(30);

  /* ── Join-room form ── */
  const [joinCode, setJoinCode] = useState(codeParam || "");

  /* ── Copy feedback ── */
  const [copied, setCopied] = useState(false);

  /* ─ Clean up on unmount ─ */
  useEffect(() => () => { /* don't reset on nav away — arena needs state */ }, []);

  /* ─ If kicked, navigate home ─ */
  useEffect(() => {
    if (kicked) {
      alert("You were kicked from the room.");
      reset();
      navigate("/battle");
    }
  }, [kicked, navigate, reset]);

  /* ─ If auto-joined via URL param, look up room ─ */
  useEffect(() => {
    if (codeParam && !room) {
      lookupRoom(codeParam).catch(() => {});
    }
  }, [codeParam]);

  /* ─ Navigate to arena when battle starts ─ */
  useEffect(() => {
    if (room?.state === "ACTIVE" && battleId) {
      navigate(`/group/match/${battleId}`);
    }
  }, [room?.state, battleId, navigate]);

  /* ─ Room cancelled ─ */
  useEffect(() => {
    if (room?.state === "CANCELLED") {
      setTimeout(() => { reset(); navigate("/battle"); }, 2000);
    }
  }, [room?.state]);

  /* ─ Handle Create ─ */
  const handleCreate = async () => {
    if (!userId) { alert("Please log in first."); return; }
    try {
      await createRoom(userId, {
        mode: "GROUP_FFA",
        difficulty,
        problemCount,
        maxPlayers,
        durationMinutes,
      });
    } catch (_) {}
  };

  /* ─ Handle Join ─ */
  const handleJoin = async () => {
    if (!userId) { alert("Please log in first."); return; }
    if (!joinCode || joinCode.length !== 6) { alert("Enter a valid 6-character room code."); return; }
    try {
      await joinRoom(joinCode.toUpperCase(), userId);
    } catch (_) {}
  };

  /* ─ Handle Leave ─ */
  const handleLeave = async () => {
    if (!roomCode) { reset(); navigate("/battle"); return; }
    await leaveRoom(roomCode, userId);
    navigate("/battle");
  };

  /* ─ Handle Kick ─ */
  const handleKick = async (targetId) => {
    if (roomCode) await kickPlayer(roomCode, userId, targetId);
  };

  /* ─ Handle Start ─ */
  const handleStart = async () => {
    if (!roomCode) return;
    try {
      await startBattle(roomCode, userId);
    } catch (_) {}
  };

  /* ─ Copy room code ─ */
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCreator = room?.creatorId === userId;
  const playerCount = room?.participants?.length || 0;
  const canStart = isCreator && playerCount >= 3;

  /* ════════════════════════════════════ RENDER ════════════════ */
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl battle-fade-up">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/battle")}
            className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Group Battle
            </h1>
            <p className="text-sm text-muted-foreground">Free-For-All · 3–8 players · Points-based</p>
          </div>
        </div>

        {/* ── Room Cancelled Banner ── */}
        {room?.state === "CANCELLED" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm text-red-300">Room was cancelled. Redirecting…</span>
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            LOBBY PANEL — show once in a room
         ═══════════════════════════════════════════════════════ */}
        {room && room.state !== "CANCELLED" ? (
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6">

            {/* Room header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Room Code</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-mono font-bold tracking-widest text-primary">
                    {room.roomCode}
                  </span>
                  <button onClick={copyCode}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    {copied
                      ? <Check className="w-4 h-4 text-emerald-400" />
                      : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  room.difficulty === "EASY" ? "bg-emerald-500/20 text-emerald-400" :
                  room.difficulty === "MEDIUM" ? "bg-amber-500/20 text-amber-400" :
                  "bg-red-500/20 text-red-400"
                )}>{room.difficulty}</span>
                <span className="text-xs text-muted-foreground">
                  {room.problemCount} problem{room.problemCount !== 1 ? "s" : ""} · {room.durationMinutes} min
                </span>
              </div>
            </div>

            {/* Players list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground/80">
                  Players ({playerCount}/{room.maxPlayers})
                </span>
                {!canStart && isCreator && (
                  <span className="text-xs text-muted-foreground">Need at least 3 to start</span>
                )}
              </div>

              <div className="space-y-2">
                {room.participants.map((p) => (
                  <div key={p.userId}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {p.userId === room.creatorId
                        ? <Crown className="w-4 h-4 text-amber-400" />
                        : <Shield className="w-4 h-4 text-muted-foreground/40" />}
                      <span className="font-medium text-sm">
                        {p.username}
                        {p.userId === userId ? <span className="ml-1 text-xs text-primary">(you)</span> : null}
                      </span>
                      <span className="text-xs text-muted-foreground">BR {p.battleRating}</span>
                    </div>

                    {/* Kick button — creator only, not on self */}
                    {isCreator && p.userId !== userId && (
                      <button onClick={() => handleKick(p.userId)}
                        className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded"
                        title="Kick player">
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, room.maxPlayers - playerCount) }).map((_, i) => (
                  <div key={i}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-border/30 px-3 py-2">
                    <div className="w-4 h-4 rounded-full border border-dashed border-border/40" />
                    <span className="text-xs text-muted-foreground italic">Waiting for player…</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Share link */}
            <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                Share: {window.location.origin}/group/{room.roomCode}
              </span>
              <button onClick={copyCode}
                className="ml-auto text-muted-foreground hover:text-primary transition-colors shrink-0">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isCreator && (
                <Button onClick={handleStart} disabled={!canStart || loading}
                  className="flex-1 gap-2">
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Play className="w-4 h-4" />}
                  Start Battle
                </Button>
              )}
              <Button variant="outline" onClick={handleLeave}
                className="gap-2 text-muted-foreground hover:text-red-400">
                <LogOut className="w-4 h-4" /> Leave
              </Button>
            </div>
          </div>

        ) : (
          /* ═══════════════════════════════════════════════════════
              CREATE / JOIN PANEL
           ═══════════════════════════════════════════════════════ */
          <div className="rounded-xl border border-border/60 bg-card p-6">

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-background/60 rounded-lg p-1">
              {["create", "join"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                    tab === t
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                  {t === "create" ? "Create Room" : "Join Room"}
                </button>
              ))}
            </div>

            {/* ── Create Room Form ── */}
            {tab === "create" && (
              <div className="space-y-5 battle-fade-up-delay-1">
                {/* Difficulty */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button key={d.value} onClick={() => setDifficulty(d.value)}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm font-semibold transition-all",
                          difficulty === d.value ? d.bg : "border-border/40 text-muted-foreground hover:border-border"
                        )}>
                        <span className={difficulty === d.value ? d.color : ""}>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problem Count */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Problems
                  </label>
                  <div className="flex gap-2">
                    {PROBLEM_COUNTS.map((n) => (
                      <button key={n} onClick={() => { setProblemCount(n); setDurationMinutes(n * 15); }}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm font-semibold transition-all",
                          problemCount === n
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/40 text-muted-foreground hover:border-border"
                        )}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{durationMinutes} min time limit</p>
                </div>

                {/* Max Players */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Max Players
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {MAX_PLAYERS_OPTIONS.map((n) => (
                      <button key={n} onClick={() => setMaxPlayers(n)}
                        className={cn(
                          "w-10 h-10 rounded-lg border text-sm font-semibold transition-all",
                          maxPlayers === n
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/40 text-muted-foreground hover:border-border"
                        )}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scoring note */}
                <div className="rounded-lg border border-border/30 bg-background/40 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground/60">⚡ FFA Scoring</p>
                  <p>Points = base × time_bonus × accuracy</p>
                  <p>Easy: 100 · Medium: 250 · Hard: 500 base points</p>
                  <p>Faster solves & fewer wrong answers earn more.</p>
                </div>

                <Button onClick={handleCreate} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Create Room
                </Button>
              </div>
            )}

            {/* ── Join Room Form ── */}
            {tab === "join" && (
              <div className="space-y-5 battle-fade-up-delay-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
                    Room Code
                  </label>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ABC123"
                    maxLength={6}
                    className={cn(
                      "w-full rounded-lg border border-border/60 bg-background px-4 py-3",
                      "text-2xl font-mono font-bold tracking-[0.4em] text-center",
                      "focus:outline-none focus:border-primary/60 transition-colors uppercase"
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Enter the 6-character code shared by the room creator.
                  </p>
                </div>

                <Button onClick={handleJoin} disabled={loading || joinCode.length !== 6} className="w-full gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Join Room
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
