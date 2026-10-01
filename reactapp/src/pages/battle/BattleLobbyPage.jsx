import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useBattleStore from "../../stores/useBattleStore";
import useFriendsStore from "../../stores/useFriendsStore";
import { getStoredUser } from "../../services/userApi";
import { fetchPlayerStats } from "../../services/gamificationApi";
import { fetchBattleHistory } from "../../services/battleApi";
import { AlertTriangle, Check, Swords, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  ListRow,
  OfflineState,
  PageHeader,
  PageShell,
  Panel,
  Progress,
  Select,
  SelectItem,
  Skeleton,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ds";

/*
 * Battle lobby: narrow PageShell, one h1 ("Battle") in
 * every state, mode Tabs, segmented choices + Select for the config, one
 * primary FIND MATCH, a history Table. The Group lobby copies this layout.
 */

/* ═══ Config ══════════════════════════════════════════════ */
const MODES = [
  { value: "CASUAL_1V1", label: "Casual", desc: "No rating changes. A warm-up match." },
  { value: "RANKED_1V1", label: "Ranked", desc: "Your ELO rating moves with the result." },
];
const DIFFICULTIES = [
  { value: "EASY", label: "Easy", tone: "ok" },
  { value: "MEDIUM", label: "Medium", tone: "warn" },
  { value: "HARD", label: "Hard", tone: "err" },
];
const PROBLEM_COUNTS = [1, 2, 3];
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60, 90, 120, 150, 180];
const LANGUAGES = [{ value: "cpp", label: "C++" }, { value: "java", label: "Java" }];

const OUTCOME = {
  WIN: { label: "Win", tone: "ok" },
  LOSS: { label: "Loss", tone: "err" },
  DRAW: { label: "Draw", tone: "warn" },
  FORFEIT: { label: "Forfeit", tone: "neutral" },
};

/* Difficulty is text plus a 2px left bar in its status colour (§3.1). */
const DIFF_CLASS = {
  EASY: "border-ok text-ok",
  MEDIUM: "border-warn text-warn",
  HARD: "border-err text-err",
};

const labelCls = "font-mono text-label uppercase text-fg-muted";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const isNetworkError = (err) =>
  err instanceof TypeError || /failed to fetch|networkerror|load failed|network request/i.test(String(err?.message || err || ""));

const friendlyError = (message) =>
  isNetworkError(message) ? "Can't reach the Vantage API. Check your connection and try again." : message;

const modeLabel = (mode) => (mode === "RANKED_1V1" ? "Ranked" : "Casual");
const difficultyLabel = (value) => DIFFICULTIES.find((d) => d.value === value)?.label || value;
const difficultyTone = (value) => DIFFICULTIES.find((d) => d.value === value)?.tone || "neutral";
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

/* ═══ Shared sub-components ══════════════════════════════ */

/*
 * Segmented single choice (no ds primitive for this yet): a WAI-ARIA
 * radiogroup of square cells, roving tabindex, arrows / Home / End select.
 * Active cell = accent fill + accent edge, same look as Tabs "segmented".
 */
function ChoiceGroup({ label, value, onChange, options }) {
  const id = React.useId();
  const refs = useRef([]);
  const selected = options.findIndex((o) => o.value === value);

  const onKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    let next;
    if (step) next = ((selected < 0 ? 0 : selected) + step + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div className="grid gap-2">
      <span id={`${id}-label`} className={labelCls}>{label}</span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        onKeyDown={onKeyDown}
        className="grid gap-1 border border-border p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o, i) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active || (selected < 0 && i === 0) ? 0 : -1}
              onClick={() => onChange(o.value)}
              className={cn(
                "h-9 border font-mono text-label uppercase tabular-nums transition-colors duration-[120ms] ease-out",
                "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus",
                active
                  ? "border-accent-edge bg-accent text-on-accent"
                  : "border-transparent text-fg-muted ds-hover:border-border-strong ds-hover:text-fg"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchBadges({ mode, difficulty, problemCount, durationMinutes }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone={mode === "RANKED_1V1" ? "accent" : "outline"}>{modeLabel(mode)}</Badge>
      <Badge tone={difficultyTone(difficulty)}>{difficultyLabel(difficulty)}</Badge>
      <Badge>{plural(problemCount, "problem")}</Badge>
      <Badge>{durationMinutes} min</Badge>
    </div>
  );
}

function PlayerCard({ label, player, align = "start" }) {
  return (
    <div className={cn("grid min-w-0 gap-3", align === "end" ? "justify-items-end text-right" : "justify-items-start")}>
      <span className="font-mono text-label uppercase text-fg-dim">{label}</span>
      <Avatar name={player.username} size="lg" />
      <div className="grid min-w-0 gap-1">
        <span className="truncate font-mono text-h3 text-fg">{player.username}</span>
        <span className="font-mono text-small tabular-nums text-fg-muted">
          Rating {player.battleRating} · Lv {player.level}
        </span>
      </div>
      <Badge tone={player.isReady ? "ok" : "neutral"}>{player.isReady ? "Ready" : "Waiting"}</Badge>
    </div>
  );
}

/* ═══ Queue searching screen ═════════════════════════════ */
function QueueScreen({ mode, difficulty, problemCount, durationMinutes, onCancel }) {
  return (
    <PageShell narrow>
      <PageHeader eyebrow="Matchmaking" title="Battle" description="Searching for a player with the same match settings." />
      <Panel as="section" label="Finding opponent">
        <div className="grid gap-6" aria-live="polite">
          <MatchBadges mode={mode} difficulty={difficulty} problemCount={problemCount} durationMinutes={durationMinutes} />
          <Progress label="Searching for an opponent" />
          <div>
            <Button variant="secondary" onClick={onCancel}>
              <X aria-hidden="true" /> Cancel search
            </Button>
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}

/* ═══ Lobby waiting screen ═══════════════════════════════ */
function LobbyWaitScreen({ lobby, onReady, onLeave, loading }) {
  return (
    <PageShell narrow>
      <PageHeader eyebrow="Match found" title="Battle" description="Both players must ready up to begin." />
      <Panel as="section" label="Ready check">
        <div className="grid gap-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4">
            <PlayerCard label="You" player={lobby.you} />
            <span className="self-center font-mono text-label uppercase text-fg-dim">vs</span>
            <PlayerCard label="Opponent" player={lobby.opponent} align="end" />
          </div>

          <div className="grid gap-3 border-t border-border pt-4">
            <MatchBadges
              mode={lobby.mode}
              difficulty={lobby.difficulty}
              problemCount={lobby.problemCount}
              durationMinutes={lobby.durationMinutes}
            />
            <p className="font-mono text-small text-fg-muted">
              Languages: {LANGUAGES.map((l) => l.label).join(" or ")}. You can switch in the arena.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onReady}
              disabled={lobby.you.isReady}
              loading={loading && !lobby.you.isReady}
            >
              {lobby.you.isReady ? <><Check aria-hidden="true" /> Ready</> : "Ready up"}
            </Button>
            <Button variant="secondary" size="lg" onClick={onLeave}>
              Leave
            </Button>
          </div>

          {!lobby.opponent.isReady && lobby.you.isReady && (
            <p role="status" className="flex items-center gap-2 font-mono text-small text-fg-muted">
              <span aria-hidden="true" className="size-1.5 bg-warn" />
              Waiting for opponent
            </p>
          )}
        </div>
      </Panel>
    </PageShell>
  );
}

/* ═══ History table ══════════════════════════════════════ */
function HistoryTable({ history, navigate }) {
  return (
    <Table wrapperClassName="border-0">
      <TableHead>
        <TableRow>
          <TableHeaderCell>Result</TableHeaderCell>
          <TableHeaderCell>Opponent</TableHeaderCell>
          <TableHeaderCell className="hidden sm:table-cell">Mode</TableHeaderCell>
          <TableHeaderCell>Difficulty</TableHeaderCell>
          <TableHeaderCell align="right">Solved</TableHeaderCell>
          <TableHeaderCell align="right" className="hidden sm:table-cell">Time</TableHeaderCell>
          <TableHeaderCell align="right">Rating</TableHeaderCell>
          <TableHeaderCell align="right" className="hidden sm:table-cell">When</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {history.map((b) => {
          const o = OUTCOME[b.outcome] || OUTCOME.LOSS;
          const isCompleted = b.state === "COMPLETED" || b.state === "FORFEITED";
          const to = `/battle/result/${b.battleId}`;
          const ranked = b.mode === "RANKED_1V1" && b.ratingChange != null;
          return (
            <TableRow
              key={b.battleId}
              interactive={isCompleted}
              onClick={isCompleted ? () => navigate(to) : undefined}
              className={cn(!isCompleted && "text-fg-dim")}
            >
              <TableCell><Badge tone={o.tone}>{o.label}</Badge></TableCell>
              <TableCell className="max-w-[12rem] truncate">
                {isCompleted ? (
                  <Link
                    to={to}
                    onClick={(e) => e.stopPropagation()}
                    className="text-fg underline-offset-4 ds-hover:underline ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus"
                  >
                    {b.opponentUsername || "Unknown"}
                  </Link>
                ) : (
                  b.opponentUsername || "Unknown"
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">{modeLabel(b.mode)}</TableCell>
              <TableCell>
                <span className={cn("border-l-2 pl-2", DIFF_CLASS[b.difficulty] || "border-border text-fg-muted")}>
                  {difficultyLabel(b.difficulty)}
                </span>
              </TableCell>
              <TableCell align="right">{b.yourSolved}/{b.problemCount}</TableCell>
              <TableCell align="right" className="hidden sm:table-cell">
                {b.durationMinutes > 0 ? `${b.durationMinutes}m` : "—"}
              </TableCell>
              <TableCell
                align="right"
                className={cn(
                  ranked && b.ratingChange > 0 && "text-ok",
                  ranked && b.ratingChange < 0 && "text-err",
                  (!ranked || b.ratingChange === 0) && "text-fg-muted"
                )}
              >
                {ranked ? `${b.ratingChange > 0 ? "+" : ""}${b.ratingChange}` : "—"}
              </TableCell>
              <TableCell align="right" className="hidden text-fg-muted sm:table-cell">
                {timeAgo(b.completedAt || b.createdAt)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ═══ Main Page ═══════════════════════════════════════════ */
export default function BattleLobbyPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;

  const { queueStatus, activeBattleState, activeBattleMode, activeBattleRoomCode, battleId, lobby, loading, error,
    joinQueue, leaveQueue, fetchLobby, readyUp, reset, stopPolling, abandon } = useBattleStore();

  const { friends, friendsPresence, loadOverview: loadFriendsOverview,
    loadFriendsPresence, sendChallenge, actionLoading: friendActionLoading } = useFriendsStore();

  const [mode, setMode] = useState("RANKED_1V1");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [problemCount, setProblemCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const language = "cpp";
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [friendQuery, setFriendQuery] = useState("");
  const [sendingFriendId, setSendingFriendId] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchPlayerStats(userId).then(setStats).catch(() => { });
      setHistoryError(null);
      setHistoryLoading(true);
      fetchBattleHistory(userId, 0, 20).then(setHistory).catch(setHistoryError).finally(() => setHistoryLoading(false));
      loadFriendsOverview(); loadFriendsPresence();
    }
  }, [userId, loadFriendsOverview, loadFriendsPresence]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (lobby?.state === "ACTIVE" && battleId) navigate(`/battle/match/${battleId}`);
  }, [lobby?.state, battleId, navigate]);

  useEffect(() => {
    if (!battleId || !userId) return;
    if (activeBattleState === "WAITING" && !lobby) {
      fetchLobby(battleId, userId);
    }
  }, [activeBattleState, battleId, userId, lobby, fetchLobby]);

  useEffect(() => {
    if (!battleId || !userId || lobby?.state === "ACTIVE" || activeBattleState === "ACTIVE") return;
    const id = setInterval(() => fetchLobby(battleId, userId), 3000);
    return () => clearInterval(id);
  }, [battleId, userId, lobby?.state, fetchLobby, activeBattleState]);

  const reloadHistory = () => {
    if (!userId) return;
    setHistoryError(null);
    setHistoryLoading(true);
    fetchBattleHistory(userId, 0, 20).then(setHistory).catch(setHistoryError).finally(() => setHistoryLoading(false));
  };

  const handleFindBattle = () => {
    if (userId) joinQueue(userId, mode, difficulty, problemCount, durationMinutes);
  };
  const handleCancel = () => { if (userId) leaveQueue(userId); };
  const handleReady = () => { if (battleId && userId) readyUp(battleId, userId, language); };
  const handleRejoin = () => {
    const isGroup = activeBattleMode === "GROUP_FFA";
    if (activeBattleState === "ACTIVE") {
      navigate(isGroup ? `/group/match/${battleId}` : `/battle/match/${battleId}`);
    } else if (activeBattleState === "WAITING") {
      if (isGroup && activeBattleRoomCode) {
        navigate(`/group/${activeBattleRoomCode}`);
      } else {
        fetchLobby(battleId, userId);
      }
    }
  };
  const handleAbandon = async () => {
    if (!battleId || !userId) return;
    await abandon(battleId, userId);
    fetchBattleHistory(userId, 0, 20).then(setHistory).catch(() => { });
  };

  const onlineFriends = (friends || []).filter(f => !!friendsPresence?.[f.uid]?.online);
  const filteredFriends = onlineFriends.filter(f =>
    !friendQuery.trim() || f.username.toLowerCase().includes(friendQuery.trim().toLowerCase())
  );
  const handleChallengeFriend = async (friend) => {
    if (!friend?.uid) return;
    setSendingFriendId(friend.uid);
    try {
      await sendChallenge({
        targetUserId: friend.uid,
        mode,
        difficulty,
        problemCount,
        durationMinutes,
      });
    }
    finally { setSendingFriendId(null); }
  };

  /* ── State-based screens ── */
  if (!userId) {
    return (
      <PageShell narrow>
        <PageHeader eyebrow="1v1 duel" title="Battle" description="Challenge other players to real-time 1v1 coding duels." />
        <EmptyState
          icon={Swords}
          title="Sign in to battle"
          description="Battles need an account so your results, rating and rewards are saved."
          action={<Button variant="primary" onClick={() => navigate("/login")}>Sign in</Button>}
        />
      </PageShell>
    );
  }

  if (lobby && lobby.state === "WAITING") {
    return <LobbyWaitScreen lobby={lobby} language={language}
      onReady={handleReady} onLeave={() => { reset(); navigate("/battle"); }} loading={loading} />;
  }

  if (activeBattleState === "WAITING" && battleId) {
    return (
      <PageShell narrow>
        <PageHeader eyebrow="Match found" title="Battle" description="Restoring your battle lobby." />
        <Panel as="section" label="Rejoining lobby">
          <Progress label="Restoring your battle lobby" />
        </Panel>
      </PageShell>
    );
  }

  if (activeBattleState === "ACTIVE" && battleId) {
    return (
      <PageShell narrow>
        <PageHeader eyebrow="Active battle" title="Battle" description="Finish or abandon your current battle before starting a new one." />
        <Panel as="section" label="Battle in progress">
          <div className="grid gap-6">
            <p className="flex items-start gap-3 font-mono text-body text-fg-muted">
              <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" className="mt-1 shrink-0 text-warn" />
              <span>
                You have a battle <span className="text-fg">{activeBattleState === "ACTIVE" ? "in progress" : "in the lobby"}</span>.
                Rejoin it, or abandon it and start fresh.
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="lg" onClick={handleRejoin}>
                <Swords aria-hidden="true" /> {activeBattleState === "ACTIVE" ? "Rejoin battle" : "Rejoin lobby"}
              </Button>
              <Button variant="danger" size="lg" onClick={handleAbandon}>
                Abandon and start fresh
              </Button>
            </div>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (queueStatus === "QUEUED") {
    return <QueueScreen mode={mode} difficulty={difficulty} problemCount={problemCount} durationMinutes={durationMinutes} onCancel={handleCancel} />;
  }

  /* ── Main config page ── */
  const wins = history.filter(b => b.outcome === "WIN").length;
  const losses = history.filter(b => b.outcome === "LOSS").length;
  const played = history.length;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  const config = (
    <div className="grid gap-6 pt-4">
      <div className="grid gap-6 sm:grid-cols-2">
        <ChoiceGroup
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={DIFFICULTIES.map((d) => ({ value: d.value, label: d.label }))}
        />
        <ChoiceGroup
          label="Problems"
          value={problemCount}
          onChange={setProblemCount}
          options={PROBLEM_COUNTS.map((c) => ({ value: c, label: String(c) }))}
        />
      </div>
      <Select
        label="Time limit"
        value={String(durationMinutes)}
        onValueChange={(v) => setDurationMinutes(Number(v))}
      >
        {QUICK_DURATION_OPTIONS.map((m) => (
          <SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>
        ))}
      </Select>
      <Button variant="primary" size="lg" className="w-full" loading={loading} onClick={handleFindBattle}>
        <Swords aria-hidden="true" /> Find match
      </Button>
    </div>
  );

  return (
    <PageShell narrow>
      <PageHeader
        eyebrow="1v1 duel"
        title="Battle"
        description="Real-time coding duels on the same problems and the same clock. Ranked matches move your ELO rating."
        actions={
          <Button variant="secondary" onClick={() => navigate("/group")}>
            <Users aria-hidden="true" /> Group battle
          </Button>
        }
      />

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-3 border border-err bg-err-soft px-4 py-3 font-mono text-small text-err">
          <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
          <span>{friendlyError(error)}</span>
        </div>
      )}

      {stats && (
        <Panel className="mb-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat label="ELO rating" value={stats.battleRating} />
            <Stat label="Wins" value={wins} />
            <Stat label="Losses" value={losses} />
            <Stat label="Win rate" value={`${winRate}%`} />
          </div>
        </Panel>
      )}

      <Panel as="section" label="New match" className="mb-6">
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList aria-label="Mode">
            {MODES.map((m) => (
              <TabsTrigger key={m.value} value={m.value}>{m.label}</TabsTrigger>
            ))}
          </TabsList>
          {MODES.map((m) => (
            <TabsContent key={m.value} value={m.value}>
              <p className="pt-4 font-mono text-small text-fg-muted">{m.desc}</p>
              {config}
            </TabsContent>
          ))}
        </Tabs>
      </Panel>

      <Panel
        as="section"
        label="Challenge a friend"
        actions={<span className="font-mono text-small tabular-nums text-fg-muted">{onlineFriends.length} online</span>}
        padded={false}
        className="mb-6"
      >
        <div className="border-b border-border p-4">
          <Input
            aria-label="Search online friends"
            placeholder="Search online friends"
            value={friendQuery}
            onChange={e => setFriendQuery(e.target.value)}
          />
        </div>
        {filteredFriends.length === 0 ? (
          <p className="px-4 py-6 text-center font-mono text-small text-fg-muted">
            {onlineFriends.length === 0 ? "No friends online right now." : "No online friends match that name."}
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {filteredFriends.slice(0, 8).map(f => {
              const busy = sendingFriendId === f.uid && friendActionLoading;
              return (
                <ListRow
                  key={f.uid}
                  leading={<Avatar name={f.username} size="sm" />}
                  title={f.username}
                  meta={
                    <span className="inline-flex items-center gap-2 text-ok">
                      <span aria-hidden="true" className="size-1.5 bg-ok" /> Online
                    </span>
                  }
                  trailing={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleChallengeFriend(f)}
                      disabled={friendActionLoading && !busy}
                      loading={busy}
                    >
                      <Swords aria-hidden="true" /> Challenge
                    </Button>
                  }
                />
              );
            })}
          </div>
        )}
        <p className="px-4 py-3 font-mono text-small text-fg-dim">
          Challenges use the mode, difficulty, problem count and time limit above.
        </p>
      </Panel>

      <Panel
        as="section"
        label="History"
        actions={history.length > 0 ? (
          <span className="font-mono text-small tabular-nums text-fg-muted">{plural(history.length, "match", "matches")}</span>
        ) : null}
        padded={false}
      >
        {historyLoading ? (
          <div className="grid gap-2 p-4" aria-busy="true">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8" />)}
          </div>
        ) : historyError ? (
          isNetworkError(historyError) ? (
            <OfflineState onRetry={reloadHistory} className="border-0" />
          ) : (
            <ErrorState
              title="Couldn't load your battle history"
              description={historyError?.message}
              onRetry={reloadHistory}
              className="border-0"
            />
          )
        ) : history.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="No battles yet"
            description="Find a match to start your first battle."
            className="border-0"
          />
        ) : (
          <HistoryTable history={history} navigate={navigate} />
        )}
      </Panel>
    </PageShell>
  );
}
