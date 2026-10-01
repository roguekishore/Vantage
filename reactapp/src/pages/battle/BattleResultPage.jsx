import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useBattleStore from "../../stores/useBattleStore";
import useGamificationStore from "../../stores/useGamificationStore";
import useUserStore from "../../stores/useUserStore";
import { Home, RotateCcw, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Button,
  ErrorState,
  OfflineState,
  PageHeader,
  PageLoader,
  PageShell,
  Panel,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ds";

/*
 * Battle result: the verdict is the page's one h1
 * (WIN / LOSS / DRAW), then Stat deltas (ELO, XP, coins), a per-player
 * Table and the actions. No canvases, glows or count-up animations.
 * The Group result page copies this layout.
 */

const OUTCOMES = {
  WIN: { title: <em>Win</em> },
  DRAW: { title: "Draw" },
  LOSS: { title: <span className="text-err">Loss</span> },
};

function formatTime(ms) {
  if (!ms || ms === 0) return "DNF";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const signed = (n) => `${n > 0 ? "+" : n < 0 ? "-" : "+"}${Math.abs(n)}`;

const isNetworkError = (message) =>
  /failed to fetch|networkerror|load failed|network request/i.test(String(message || ""));

function PlayerRow({ stats, isYou, isWinner, problemCount }) {
  const after = stats.ratingAfter ?? stats.ratingBefore;
  const changed = stats.ratingAfter != null && stats.ratingAfter !== stats.ratingBefore;
  const diff = changed ? stats.ratingAfter - stats.ratingBefore : 0;
  return (
    <TableRow>
      <TableCell>
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={stats.username} size="sm" />
          <span className="truncate text-fg">{stats.username}</span>
          {isYou && <span className="text-fg-muted">(you)</span>}
          {isWinner && <Badge tone="accent">Winner</Badge>}
        </span>
      </TableCell>
      <TableCell align="right">{stats.problemsSolved}/{problemCount}</TableCell>
      <TableCell align="right">{stats.totalSubmissions}</TableCell>
      <TableCell align="right">{formatTime(stats.totalSolveTimeMs)}</TableCell>
      <TableCell align="right">
        <span className="text-fg">{after}</span>
        {changed && (
          <span className={cn("ml-2", diff > 0 ? "text-ok" : "text-err")}>{signed(diff)}</span>
        )}
      </TableCell>
    </TableRow>
  );
}

/* Page */
export default function BattleResultPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const userId   = useUserStore((s) => s.user?.uid ?? null);

  const { result, loading, error, fetchResult, abandon, reset } = useBattleStore();

  const handleForceExit = async () => {
    if (!battleId || !userId) return;
    await abandon(Number(battleId), userId);
    navigate("/battle", { replace: true });
  };

  useEffect(()=>{
    let mounted = true;
    const run = async () => {
      if (!battleId || !userId) return;
      const response = await fetchResult(Number(battleId), userId);
      if (!mounted || !response) return;

      // Backend returns 409 while battle is still WAITING/ACTIVE.
      // Route user back to the correct live screen instead of hanging on result page.
      if (response.status === 409) {
        if (response.pendingState === "ACTIVE") {
          navigate(`/battle/match/${battleId}`, { replace: true });
          return;
        }
        if (response.pendingState === "WAITING") {
          navigate("/battle", { replace: true });
          return;
        }
      }

      useGamificationStore.getState().loadStats(userId);
    };

    run();
    return ()=>reset();
  },[battleId,userId,navigate,fetchResult,reset]);

  /* Retry for the error states: the same fetch and routing as the effect above. */
  const handleRetry = async () => {
    if (!battleId || !userId) return;
    const response = await fetchResult(Number(battleId), userId);
    if (!response) return;
    if (response.status === 409) {
      if (response.pendingState === "ACTIVE") {
        navigate(`/battle/match/${battleId}`, { replace: true });
        return;
      }
      if (response.pendingState === "WAITING") {
        navigate("/battle", { replace: true });
        return;
      }
    }
    useGamificationStore.getState().loadStats(userId);
  };

  if (loading || !result) {
    if (!loading && error) {
      return (
        <PageShell narrow>
          <PageHeader eyebrow="Battle result" title="Battle" />
          {isNetworkError(error) ? (
            <OfflineState onRetry={handleRetry} />
          ) : (
            <ErrorState
              title="Couldn't load the result"
              description={error}
              onRetry={handleRetry}
              action={
                <Button variant="danger" onClick={handleForceExit}>
                  Force exit battle
                </Button>
              }
            />
          )}
        </PageShell>
      );
    }
    return <PageLoader label="LOADING RESULT_" />;
  }

  const O          = OUTCOMES[result.outcome]||OUTCOMES.LOSS;
  const isRanked   = result.mode==="RANKED_1V1";
  const ratingDiff = (result.ratingAfter??result.ratingBefore) - result.ratingBefore;
  const solvedMax  = Math.max(
    1,
    Number(result.problemCount || 0),
    Number(result.you?.problemsSolved || 0),
    Number(result.opponent?.problemsSolved || 0)
  );
  const problemCount = Number(result.problemCount || 0) || solvedMax;

  return (
    <PageShell>
      <PageHeader
        eyebrow={`Battle · ${String(result.mode || "").replace(/_/g, " ")}`}
        title={O.title}
        description={`${result.you.username} vs ${result.opponent.username}. You solved ${result.you.problemsSolved} of ${problemCount}.`}
        actions={
          <>
            <Button variant="primary" onClick={() => { reset(); navigate("/battle"); }}>
              <RotateCcw aria-hidden="true" /> Play again
            </Button>
            <Button variant="secondary" onClick={() => navigate("/leaderboard")}>
              <Trophy aria-hidden="true" /> Leaderboard
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <Home aria-hidden="true" /> Home
            </Button>
          </>
        }
      />

      {/* Stat deltas */}
      <Panel as="section" label="Rewards" className="mb-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {isRanked ? (
            <Stat
              label="ELO rating"
              value={result.ratingAfter ?? result.ratingBefore}
              delta={signed(ratingDiff)}
              deltaTone={ratingDiff > 0 ? "ok" : ratingDiff < 0 ? "err" : "neutral"}
              hint={`Was ${result.ratingBefore}`}
            />
          ) : (
            <Stat label="ELO rating" value={result.ratingBefore} hint="Casual match, no rating change" />
          )}
          <Stat label="XP earned" value={`+${result.xpEarned ?? 0}`} />
          <Stat label="Coins earned" value={`+${result.coinsEarned ?? 0}`} />
        </div>
      </Panel>

      {/* Per-player breakdown */}
      <Panel as="section" label="Players" padded={false}>
        <Table wrapperClassName="border-0">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Player</TableHeaderCell>
              <TableHeaderCell align="right">Solved</TableHeaderCell>
              <TableHeaderCell align="right">Attempts</TableHeaderCell>
              <TableHeaderCell align="right">Time</TableHeaderCell>
              <TableHeaderCell align="right">Rating</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <PlayerRow
              stats={result.you}
              isYou
              isWinner={result.winnerId === result.you.userId}
              problemCount={problemCount}
            />
            <PlayerRow
              stats={result.opponent}
              isYou={false}
              isWinner={result.winnerId === result.opponent.userId}
              problemCount={problemCount}
            />
          </TableBody>
        </Table>
      </Panel>
    </PageShell>
  );
}
