import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "../../lib/utils";
import { getStoredUser } from "../../services/userApi";
import useGroupBattleStore from "../../stores/useGroupBattleStore";
import useFriendsStore from "../../stores/useFriendsStore";
import { AlertTriangle, Check, ChevronRight, Copy, Crown, LogOut, MoreHorizontal, Play, UserPlus, Users, UserX } from "lucide-react";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  ErrorState,
  IconButton,
  Input,
  ListRow,
  OfflineState,
  PageHeader,
  PageShell,
  Panel,
  SegmentedInput,
  Select,
  SelectItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ds";

/* ── Constants ── */
const DIFFICULTIES = [
  { value: "EASY", label: "Easy", tone: "ok" },
  { value: "MEDIUM", label: "Medium", tone: "warn" },
  { value: "HARD", label: "Hard", tone: "err" },
];
const PROBLEM_COUNTS = [1, 2, 3];
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60, 90, 120, 150, 180];
const MAX_PLAYERS_OPTIONS = [3, 4, 5, 6, 7, 8];

/* fetch() rejects with a TypeError ("Failed to fetch") when the API is unreachable. */
const NETWORK_RE = /failed to fetch|networkerror|network error|load failed|err_connection|unreachable/i;
const isNetworkMessage = (msg) => NETWORK_RE.test(String(msg || ""));

const difficultyTone = (value) => DIFFICULTIES.find((d) => d.value === value)?.tone || "neutral";
const difficultyLabel = (value) => DIFFICULTIES.find((d) => d.value === value)?.label || value;

/* Read-only room code: the same six square cells as the join SegmentedInput. */
function RoomCodeCells({ code = "" }) {
  const chars = String(code).padEnd(6, " ").slice(0, 6).split("");
  return (
    <div role="img" aria-label={`Room code ${String(code).split("").join(" ")}`} className="flex gap-2">
      {chars.map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="flex size-11 items-center justify-center border border-fg bg-elevated font-mono text-h3 uppercase text-fg"
        >
          {ch.trim()}
        </span>
      ))}
    </div>
  );
}

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

  const inRoom = Boolean(room && room.state !== "CANCELLED");
  /* Retry re-runs the action that produced the error (view-only wiring). */
  const retryLastAction = inRoom
    ? () => lookupRoom(room.roomCode).catch(() => {})
    : tab === "join"
      ? handleJoin
      : handleCreate;

  /* ════════════════════════════════════ RENDER ════════════════ */
  return (
    <PageShell narrow>
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Battle", to: "/battle" }, { label: "Group" }]} />}
        eyebrow="Group battle"
        title={
          <>
            Group <em>lobby</em>
          </>
        }
        description="Free-for-all for 3 to 8 players. Every accepted solve scores points: faster solves with fewer wrong submissions score more."
      />

      <div className="grid gap-6">
        {/* ── Room cancelled ── */}
        {room?.state === "CANCELLED" && (
          <div role="status" className="flex items-center gap-3 border border-warn bg-warn-soft px-4 py-3 font-mono text-small text-warn">
            <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
            <span>{room?.cancelMessage || "This room was cancelled. Returning to Battle."}</span>
          </div>
        )}

        {/* ── API error ── */}
        {error &&
          (isNetworkMessage(error) ? (
            <OfflineState onRetry={retryLastAction} />
          ) : (
            <ErrorState title="That didn't work" description={error} onRetry={retryLastAction} className="py-8" />
          ))}

        {inRoom ? (
          /* ═══════════════ ROOM LOBBY ═══════════════ */
          <>
            <Panel
              as="section"
              label="Room"
              actions={
                <Badge tone="outline">
                  {room.state === "WAITING" ? "Waiting for players" : String(room.state || "").toLowerCase()}
                </Badge>
              }
            >
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="grid gap-2">
                  <span className="font-mono text-label uppercase text-fg-muted">Room code</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <RoomCodeCells code={room.roomCode} />
                    <IconButton
                      icon={copied ? Check : Copy}
                      variant="secondary"
                      onClick={copyCode}
                      aria-label={copied ? "Room code copied" : "Copy room code"}
                    />
                  </div>
                  <span aria-live="polite" className="font-mono text-small text-fg-muted">
                    {copied ? "Copied to clipboard." : "Share this code with the players you want in the room."}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={difficultyTone(room.difficulty)}>{difficultyLabel(room.difficulty)}</Badge>
                  <Badge>
                    {room.problemCount} problem{room.problemCount !== 1 ? "s" : ""}
                  </Badge>
                  <Badge>{room.durationMinutes} min</Badge>
                </div>
              </div>
            </Panel>

            {/* Players */}
            <Panel
              as="section"
              label={`Players ${playerCount}/${room.maxPlayers}`}
              actions={
                !canStart && isCreator ? (
                  <span className="font-mono text-small text-fg-muted">Needs at least 3 to start</span>
                ) : null
              }
              padded={false}
            >
              <div className="[&>*:last-child]:border-b-0">
                {room.participants.map((p) => {
                  const isHost = p.userId === room.creatorId;
                  const isMe = p.userId === userId;
                  return (
                    <ListRow
                      key={p.userId}
                      leading={<Avatar name={p.username || "?"} />}
                      title={
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{p.username}</span>
                          {isHost ? (
                            <Badge tone="outline">
                              <Crown size={10} strokeWidth={1.5} aria-hidden="true" />
                              Host
                            </Badge>
                          ) : null}
                          {isMe ? <Badge tone="accent">You</Badge> : null}
                        </span>
                      }
                      meta={`BR ${p.battleRating ?? "-"}`}
                      trailing={
                        isCreator && !isMe ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <IconButton icon={MoreHorizontal} size="sm" aria-label={`Host controls for ${p.username}`} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{p.username}</DropdownMenuLabel>
                              <DropdownMenuItem tone="danger" onSelect={() => handleKick(p.userId)}>
                                <UserX aria-hidden="true" />
                                Remove from room
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null
                      }
                    />
                  );
                })}

                {/* Open slots */}
                {Array.from({ length: Math.max(0, room.maxPlayers - playerCount) }).map((_, i) => (
                  <ListRow
                    key={`empty-${i}`}
                    leading={
                      <span
                        aria-hidden="true"
                        className="flex size-9 items-center justify-center border border-dashed border-border-strong text-fg-dim"
                      >
                        <Users size={14} strokeWidth={1.5} />
                      </span>
                    }
                    title={<span className="text-fg-dim">Open slot</span>}
                  />
                ))}
              </div>
            </Panel>

            {/* Share link (temporarily hidden) */}
            {false && (
              <Panel label="Invite link" actions={
                <Button size="sm" onClick={copyInviteLink}>
                  {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              }>
                <span className="block truncate font-mono text-small text-fg-muted">
                  {window.location.origin}/group/{room.roomCode}
                </span>
              </Panel>
            )}

            {/* Invite online friends (temporarily hidden) */}
            {false && isCreator && (
              <Panel
                label="Invite online friends"
                actions={<span className="font-mono text-small text-fg-muted">{onlineInvitableFriends.length} available</span>}
                padded={false}
              >
                <div className="border-b border-border p-4">
                  <Input
                    aria-label="Search online friends"
                    value={friendQuery}
                    onChange={(e) => setFriendQuery(e.target.value)}
                    placeholder="Search online friends"
                  />
                </div>
                {onlineInvitableFriends.length === 0 ? (
                  <p className="px-4 py-3 font-mono text-small text-fg-muted">No online friends available to invite.</p>
                ) : (
                  <div className="max-h-44 overflow-auto">
                    {onlineInvitableFriends.slice(0, 10).map((f) => {
                      const busy = invitingFriendId === f.uid && friendActionLoading;
                      return (
                        <ListRow
                          key={f.uid}
                          title={f.username}
                          meta={<span className="text-ok">Online</span>}
                          trailing={
                            <Button size="sm" variant="primary" loading={busy} disabled={friendActionLoading} onClick={() => handleInviteFriend(f)}>
                              <UserPlus aria-hidden="true" />
                              Invite
                            </Button>
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </Panel>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {isCreator && (
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleStart}
                  disabled={!canStart || loading}
                  loading={loading}
                >
                  <Play aria-hidden="true" />
                  Start battle
                </Button>
              )}
              <Button variant="secondary" size="lg" className={cn(!isCreator && "flex-1")} onClick={handleLeave}>
                <LogOut aria-hidden="true" />
                Leave room
              </Button>
            </div>
          </>
        ) : (
          /* ═══════════════ CREATE / JOIN ═══════════════ */
          <Tabs value={tab} onValueChange={setTab} className="grid gap-6">
            <TabsList aria-label="Room setup">
              <TabsTrigger value="create">Create room</TabsTrigger>
              <TabsTrigger value="join">Join room</TabsTrigger>
            </TabsList>

            {/* ── Create room ── */}
            <TabsContent value="create" className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Difficulty" value={difficulty} onValueChange={setDifficulty}>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </Select>
                <Select label="Problems" value={String(problemCount)} onValueChange={(v) => setProblemCount(Number(v))}>
                  {PROBLEM_COUNTS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} problem{n !== 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </Select>
                <Select label="Time limit" value={String(durationMinutes)} onValueChange={(v) => setDurationMinutes(Number(v))}>
                  {QUICK_DURATION_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} min
                    </SelectItem>
                  ))}
                </Select>
                <Select label="Max players" value={String(maxPlayers)} onValueChange={(v) => setMaxPlayers(Number(v))}>
                  {MAX_PLAYERS_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} players
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Scoring note */}
              <Panel variant="inset" label="Scoring">
                <dl className="grid gap-2 font-mono text-small tabular-nums text-fg-muted">
                  <div className="flex flex-wrap gap-x-3">
                    <dt className="text-fg">Points</dt>
                    <dd>base × time bonus × accuracy</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-3">
                    <dt className="text-fg">Base</dt>
                    <dd>Easy 100 · Medium 250 · Hard 500</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-3">
                    <dt className="text-fg">Bonus</dt>
                    <dd>Faster solves and fewer wrong submissions earn more.</dd>
                  </div>
                </dl>
              </Panel>

              <Button variant="primary" size="lg" className="w-full" onClick={handleCreate} disabled={loading} loading={loading}>
                <Users aria-hidden="true" />
                Create room
              </Button>
            </TabsContent>

            {/* ── Join room ── */}
            <TabsContent value="join" className="grid gap-6">
              <SegmentedInput
                label="Room code"
                hint="Enter the 6-character code from the room host."
                length={6}
                value={joinCode}
                onChange={(v) => setJoinCode(v.toUpperCase().slice(0, 6))}
                autoFocus={!codeParam}
              />
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleJoin}
                disabled={loading || joinCode.length !== 6}
                loading={loading}
              >
                Join room
                <ChevronRight aria-hidden="true" />
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageShell>
  );
}
