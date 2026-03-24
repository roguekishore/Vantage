import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../lib/utils";
import { getStoredUser } from "../services/userApi";
import useGroupBattleStore from "../stores/useGroupBattleStore";
import useFriendsStore from "../stores/useFriendsStore";
import {
  Users, Crown, Zap, Copy, Check,
  Play, UserX, LogOut, AlertTriangle, Loader2,
  ChevronRight, Hash, Search, UserPlus,
} from "lucide-react";
import CustomCursor from "../components/CustomCursor";
import { MONUMENT_TYPO } from "../components/MonumentTypography";

const BATTLE_FONT_FAMILY = MONUMENT_TYPO.fontFamily;
const BATTLE_FONT_LETTER_SPACING = MONUMENT_TYPO.letterSpacing.monument;

/* ── Constants ── */
const DIFFICULTIES = [
  { value: "EASY", label: "Easy", color: "text-emerald-400", dot: "bg-emerald-500" },
  { value: "MEDIUM", label: "Medium", color: "text-amber-400", dot: "bg-amber-500" },
  { value: "HARD", label: "Hard", color: "text-rose-400", dot: "bg-rose-500" },
];
const PROBLEM_COUNTS = [1, 2, 3];
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60, 90, 120, 150, 180];
const MAX_PLAYERS_OPTIONS = [3, 4, 5, 6, 7, 8];

/* ═══════════════════════════════════════ Main Component ═══ */
export default function GroupLobbyPage() {
  const navigate = useNavigate();
  const { roomCode: codeParam } = useParams();   // if route is /group/:roomCode
  const user = getStoredUser();
  const userId = user?.uid;

  const { room, roomCode, battleId, loading, error, kicked, createRoom, lookupRoom, joinRoom, leaveRoom, kickPlayer, startBattle, reset } =
    useGroupBattleStore();
  const {
    friends,
    friendsPresence,
    actionLoading: friendActionLoading,
    loadOverview: loadFriendsOverview,
    loadFriendsPresence,
    sendChallenge,
  } = useFriendsStore();

  /* ── Tab: create | join ── */
  const [tab, setTab] = useState(codeParam ? "join" : "create");

  /* ── Create-room form ── */
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [problemCount, setProblemCount] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(60);

  /* ── Join-room form ── */
  const [joinCode, setJoinCode] = useState(codeParam || "");
  const [friendQuery, setFriendQuery] = useState("");
  const [invitingFriendId, setInvitingFriendId] = useState(null);

  /* ── Copy feedback ── */
  const [copied, setCopied] = useState(false);

  /* ─ Clean up on unmount ─ */
  useEffect(() => () => { /* don't reset on nav away - arena needs state */ }, []);

  /* ─ If kicked, navigate home ─ */
  useEffect(() => {
    if (kicked) {
      alert("You were kicked from the room.");
      reset();
      navigate("/battle");
    }
  }, [kicked, navigate, reset]);

  /* ─ If opened via invite link, try auto-join first ─ */
  useEffect(() => {
    if (codeParam && userId && !room) {
      joinRoom(codeParam, userId)
        .catch(() => lookupRoom(codeParam).catch(() => {}));
    }
  }, [codeParam, userId, room, joinRoom, lookupRoom]);

  useEffect(() => {
    if (!room || room.state !== "WAITING") return;
    loadFriendsOverview();
    loadFriendsPresence();
  }, [room?.battleId, room?.state, loadFriendsOverview, loadFriendsPresence]);

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

  const copyInviteLink = () => {
    const link = `${window.location.origin}/group/${room?.roomCode || roomCode || ""}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteFriend = async (friend) => {
    if (!friend?.uid || !room?.roomCode || !isCreator) return;
    setInvitingFriendId(friend.uid);
    try {
      await sendChallenge({
        targetUserId: friend.uid,
        mode: "GROUP_FFA",
        difficulty: room.difficulty,
        problemCount: room.problemCount,
        durationMinutes: room.durationMinutes,
        roomCode: room.roomCode,
      });
    } finally {
      setInvitingFriendId(null);
    }
  };

  const isCreator = room?.creatorId === userId;
  const playerCount = room?.participants?.length || 0;
  const canStart = isCreator && playerCount >= 3;
  const participantIds = new Set((room?.participants || []).map((p) => p.userId));
  const onlineInvitableFriends = (friends || [])
    .filter((f) => !!friendsPresence?.[f.uid]?.online)
    .filter((f) => !participantIds.has(f.uid) && f.uid !== userId)
    .filter((f) => !friendQuery.trim() || f.username?.toLowerCase().includes(friendQuery.trim().toLowerCase()));

  /* ════════════════════════════════════ RENDER ════════════════ */
  return (
    <div className="group-battle-theme min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6" style={{ cursor: "none" }}>
      <CustomCursor />
      <div className="max-w-3xl mx-auto space-y-4">

        {/* ── Page Header ── */}
        <div className="battle-fade-up">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500 mb-2">- Group Battle</p>
              <h1 className="battle-monument text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Lobby
              </h1>
              <p className="text-sm text-zinc-500 mt-1.5">Free-For-All · 3–8 players · Points-based</p>
            </div>
          </div>
        </div>

        {/* ── Room Cancelled Banner ── */}
        {room?.state === "CANCELLED" && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-400">
              {room?.cancelMessage || "Room was cancelled. Redirecting…"}
            </span>
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            LOBBY PANEL - show once in a room
         ═══════════════════════════════════════════════════════ */}
        {room && room.state !== "CANCELLED" ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden battle-panel">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
                  <Users className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Room Lobby</div>
                  <div className="text-[11px] text-zinc-500">Waiting for players to join</div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Room Details Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-1">Room Code</span>
                  <div className="flex items-center gap-3">
                    <span className="battle-monument text-3xl font-black tabular-nums tracking-[0.2em] text-white">
                      {room.roomCode}
                    </span>
                    <button onClick={copyCode}
                      className="p-1.5 rounded-lg hover:bg-zinc-800/40 transition-colors text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-700">
                      {copied
                        ? <Check className="w-4 h-4 text-emerald-500" />
                        : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 text-sm">
                  <span className={cn(
                    "text-[11px] font-bold flex items-center gap-1.5",
                    room.difficulty === "EASY" ? "text-emerald-400" :
                    room.difficulty === "MEDIUM" ? "text-amber-400" :
                    "text-rose-400"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      room.difficulty === "EASY" ? "bg-emerald-500" :
                      room.difficulty === "MEDIUM" ? "bg-amber-500" :
                      "bg-rose-500"
                    )} />
                    {room.difficulty}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {room.problemCount} problem{room.problemCount !== 1 ? "s" : ""} · {room.durationMinutes} min
                  </span>
                </div>
              </div>

              {/* Players list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white">
                    Players ({playerCount}/{room.maxPlayers})
                  </span>
                  {!canStart && isCreator && (
                    <span className="text-xs text-zinc-500">Need at least 3 to start</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {room.participants.map((p) => (
                    <div key={p.userId}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sm font-bold text-zinc-300 uppercase">
                          {p.username?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            {p.username}
                            {p.userId === room.creatorId && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                            {p.userId === userId && <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-primary/20 text-primary font-black uppercase tracking-widest">YOU</span>}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">BR {p.battleRating}</div>
                        </div>
                      </div>

                      {/* Kick button - creator only, not on self */}
                      {isCreator && p.userId !== userId && (
                        <button onClick={() => handleKick(p.userId)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Kick player">
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, room.maxPlayers - playerCount) }).map((_, i) => (
                    <div key={`empty-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-3 opacity-60">
                      <div className="w-10 h-10 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center">
                        <Users className="w-4 h-4 text-zinc-600" />
                      </div>
                      <span className="text-sm font-medium text-zinc-500">Waiting...</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share link (temporarily hidden) */}
              {false && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/60">
                    <Hash className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-xs font-mono text-zinc-500 truncate flex-1">
                    {window.location.origin}/group/{room.roomCode}
                  </span>
                  <button onClick={copyInviteLink}
                    className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-500 hover:text-white transition-colors shrink-0 flex items-center gap-1.5">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                </div>
              )}

              {/* Invite online friends (temporarily hidden) */}
              {false && isCreator && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                      Invite Online Friends
                    </span>
                    <span className="text-[11px] text-zinc-500">{onlineInvitableFriends.length} available</span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      value={friendQuery}
                      onChange={(e) => setFriendQuery(e.target.value)}
                      placeholder="Search online friends…"
                      className="w-full h-9 rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  {onlineInvitableFriends.length === 0 ? (
                    <div className="text-xs text-zinc-500 px-1 py-1">
                      No online friends available to invite.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-auto pr-1">
                      {onlineInvitableFriends.slice(0, 10).map((f) => {
                        const busy = invitingFriendId === f.uid && friendActionLoading;
                        return (
                          <div key={f.uid} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-zinc-200 truncate">{f.username}</div>
                              <div className="text-[11px] text-emerald-400">Online</div>
                            </div>
                            <button
                              onClick={() => handleInviteFriend(f)}
                              disabled={friendActionLoading}
                              className="h-8 px-3 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
                            >
                              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                              Invite
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {isCreator && (
                  <button 
                    onClick={handleStart} 
                    disabled={!canStart || loading}
                    className={cn(
                      "flex-1 h-11 rounded-xl font-bold text-sm transition-all",
                      "flex items-center justify-center gap-2",
                      canStart && !loading 
                        ? "bg-primary text-primary-foreground hover:opacity-90" 
                        : "bg-zinc-800 text-zinc-600 opacity-60 cursor-not-allowed"
                    )}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Start Battle
                  </button>
                )}
                <button 
                  onClick={handleLeave}
                  className={cn(
                    "h-11 px-6 rounded-xl font-bold text-sm transition-all",
                    "flex items-center justify-center gap-2",
                    "border border-zinc-800 bg-zinc-950 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 hover:border-zinc-700",
                    !isCreator && "flex-1"
                  )}>
                  <LogOut className="w-4 h-4" /> Leave
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════
              CREATE / JOIN PANEL
           ═══════════════════════════════════════════════════════ */
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden battle-panel">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
                <Users className="w-4 h-4 text-zinc-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Room Setup</div>
                <div className="text-[11px] text-zinc-500">Create or join a group battle</div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                {["create", "join"].map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                      tab === t
                        ? "bg-white text-zinc-950"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}>
                    {t === "create" ? "Create Room" : "Join Room"}
                  </button>
                ))}
              </div>

              {/* ── Create Room Form ── */}
              {tab === "create" && (
                <div className="space-y-6 battle-fade-up-delay-1">
                  {/* Difficulty */}
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
                      Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {DIFFICULTIES.map((d) => {
                        const active = difficulty === d.value;
                        return (
                          <button key={d.value} onClick={() => setDifficulty(d.value)}
                            className={cn(
                              "py-2 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-1.5",
                              active
                                ? "bg-zinc-800 border-zinc-600 text-white"
                                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", d.dot)} />
                            <span className={cn(active ? "text-white" : d.color)}>{d.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Problem Count */}
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
                      Problems
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PROBLEM_COUNTS.map((n) => {
                        const active = problemCount === n;
                        return (
                          <button key={n} onClick={() => setProblemCount(n)}
                            className={cn(
                              "py-2 rounded-xl border text-sm font-bold transition-all",
                              active
                                ? "bg-white text-zinc-950 border-white"
                                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            )}>
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
                      Time Limit
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {QUICK_DURATION_OPTIONS.map((m) => {
                        const active = durationMinutes === m;
                        return (
                          <button key={m} onClick={() => setDurationMinutes(m)}
                            className={cn(
                              "py-2 rounded-xl border text-sm font-bold transition-all",
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                            )}>
                            {m}m
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Max Players */}
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
                      Max Players
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {MAX_PLAYERS_OPTIONS.map((n) => {
                        const active = maxPlayers === n;
                        return (
                          <button key={n} onClick={() => setMaxPlayers(n)}
                            className={cn(
                              "w-10 h-10 rounded-lg border text-sm font-bold transition-all",
                              active
                                ? "bg-white text-zinc-950 border-white"
                                : "bg-zinc-950 text-zinc-500 hover:text-zinc-300 border-zinc-800 hover:border-zinc-700"
                            )}>
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scoring note */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-500 space-y-1.5 flex gap-3">
                    <div className="mt-0.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-white">FFA Scoring System</p>
                      <p className="leading-relaxed">Points = base × time_bonus × accuracy</p>
                      <p className="leading-relaxed">Base points: Easy (100) · Medium (250) · Hard (500)</p>
                      <p className="leading-relaxed">Faster solves and fewer wrong answers earn you more points.</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleCreate} 
                    disabled={loading} 
                    className={cn(
                      "w-full h-11 rounded-xl font-bold text-sm transition-all mt-4",
                      "flex items-center justify-center gap-2",
                      "bg-primary text-primary-foreground",
                      "hover:opacity-90",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      ""
                    )}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    Create Room
                  </button>
                </div>
              )}

              {/* ── Join Room Form ── */}
              {tab === "join" && (
                <div className="space-y-6 battle-fade-up-delay-1">
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
                      Room Code
                    </label>
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="ABC123"
                      maxLength={6}
                      className={cn(
                        "w-full h-14 rounded-xl border border-zinc-800 bg-zinc-950 px-4",
                        "battle-monument text-2xl font-black tracking-[0.4em] text-center text-white",
                        "focus:outline-none focus:border-zinc-600 transition-colors uppercase",
                        "placeholder:text-zinc-600"
                      )}
                    />
                    <p className="text-xs text-zinc-500 mt-1 text-center">
                      Enter the 6-character code shared by the room creator.
                    </p>
                  </div>

                  <button 
                    onClick={handleJoin} 
                    disabled={loading || joinCode.length !== 6} 
                    className={cn(
                      "w-full h-11 rounded-xl font-bold text-sm transition-all mt-4",
                      "flex items-center justify-center gap-2",
                      "bg-primary text-primary-foreground",
                      "hover:opacity-90",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      ""
                    )}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Join Room
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .group-battle-theme{position:relative;overflow-x:hidden}
        .group-battle-theme::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.025;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:200px;z-index:0}
        .group-battle-theme::after{content:"";position:fixed;inset:0;pointer-events:none;opacity:.014;
          background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px);
          background-size:64px 64px;z-index:0}
        .group-battle-theme > div{position:relative;z-index:1}
        .group-battle-theme .bg-zinc-900{background:#0d0d10!important}
        .group-battle-theme .bg-zinc-950{background:#09090b!important}
        .group-battle-theme .border-zinc-800{border-color:rgba(255,255,255,.06)!important}
        .group-battle-theme .border-zinc-700{border-color:rgba(255,255,255,.12)!important}
        .group-battle-theme .bg-primary{background:#EDFF66!important;color:#09090b!important}
        .group-battle-theme .text-primary{color:#EDFF66!important}
        .group-battle-theme .border-primary\/20{border-color:rgba(237,255,102,.22)!important}
        .group-battle-theme .bg-primary\/10{background:rgba(237,255,102,.1)!important}
        .group-battle-theme .text-primary-foreground{color:#09090b!important}
        .group-battle-theme .text-zinc-500{color:rgba(255,255,255,.35)!important}
        .group-battle-theme .text-zinc-600{color:rgba(255,255,255,.22)!important}
        .group-battle-theme .rounded-2xl{border-radius:18px!important}
        .group-battle-theme .rounded-xl{border-radius:12px!important}
        .group-battle-theme .battle-panel{position:relative;box-shadow:0 0 0 1px rgba(255,255,255,.02) inset}
        .group-battle-theme .battle-panel::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;
          background:linear-gradient(90deg,rgba(237,255,102,.65),rgba(237,255,102,0));pointer-events:none}
        .group-battle-theme .battle-monument{font-family:${BATTLE_FONT_FAMILY};letter-spacing:${BATTLE_FONT_LETTER_SPACING}}
        .group-battle-theme input.battle-monument::placeholder{letter-spacing:.08em;font-family:inherit}
        .group-battle-theme .hover\:opacity-90:hover{opacity:.86!important}
        .group-battle-theme .hover\:text-rose-400:hover{color:#f87171!important}
        .group-battle-theme button{cursor:none!important}
      `}</style>
    </div>
  );
}
