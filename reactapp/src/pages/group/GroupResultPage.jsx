import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { cn } from "../../lib/utils";
import { getStoredUser } from "../../services/userApi";
import useGroupBattleStore from "../../stores/useGroupBattleStore";
import { fetchGroupBattleResult } from "../../services/groupBattleApi";
import {
  Badge,
  Breadcrumb,
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

/* fetch() rejects with a TypeError when the API is unreachable. */
const NETWORK_RE = /failed to fetch|networkerror|network error|load failed|err_connection|unreachable/i;
const isNetworkError = (e) => e instanceof TypeError || NETWORK_RE.test(String(e?.message || e || ""));

const ordinal = (n) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`;
};

function verdictCopy(placement, total) {
  if (!placement) return "Final standings for this free-for-all.";
  const of = total ? ` of ${total}` : "";
  if (placement === 1) return `You finished first${of}, with the highest score in the room.`;
  if (placement === 2) return `You finished second${of}.`;
  if (placement === 3) return `You finished third${of}.`;
  return `You finished ${ordinal(placement)}${of}. Faster accepted solves and fewer wrong submissions score more points.`;
}

export default function GroupResultPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;

  const { result, reset } = useGroupBattleStore();
  const [loadError, setLoadError] = useState(null);

  /* ── If store has no result (direct URL), fetch it ── */
  const loadResult = useCallback(() => {
    if (!battleId || !userId) return;
    setLoadError(null);
    fetchGroupBattleResult(Number(battleId), userId)
      .then((r) => useGroupBattleStore.setState({ result: r }))
      .catch((e) => setLoadError(e || new Error("Failed to load result")));
  }, [battleId, userId]);

  useEffect(() => {
    if (!result) loadResult();
  }, [result, loadResult]);

  const handlePlayAgain = () => {
    reset();
    navigate("/group");
  };

  const breadcrumb = (
    <Breadcrumb items={[{ label: "Battle", to: "/battle" }, { label: "Group", to: "/group" }, { label: "Result" }]} />
  );

  if (!result && loadError) {
    return (
      <PageShell narrow>
        <PageHeader breadcrumb={breadcrumb} eyebrow="Group battle" title="Final standings" />
        {isNetworkError(loadError) ? (
          <OfflineState onRetry={loadResult} />
        ) : (
          <ErrorState
            title="Couldn't load this result"
            description={loadError?.message || "The result for this battle is not available."}
            onRetry={loadResult}
          />
        )}
      </PageShell>
    );
  }

  if (!result) return <PageLoader />;

  const placements = result.placements || [];
  const total = placements.length;
  const myEntry = placements.find((entry) => entry.userId === userId) || null;
  const myPlacement = result.myPlacement;

  return (
    <PageShell narrow>
      <PageHeader
        breadcrumb={breadcrumb}
        eyebrow="Group battle · Free-for-all"
        title={
          myPlacement ? (
            <>
              {ordinal(myPlacement)} <em>place</em>
            </>
          ) : (
            <>
              Final <em>standings</em>
            </>
          )
        }
        description={verdictCopy(myPlacement, total)}
        actions={
          <>
            <Button variant="primary" onClick={handlePlayAgain}>
              <Users aria-hidden="true" />
              Play again
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                navigate("/battle");
              }}
            >
              1v1 battle
              <ArrowRight aria-hidden="true" />
            </Button>
          </>
        }
      />

      <div className="grid gap-6">
        {/* Rewards */}
        <Panel label="Your result">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <Stat label="Rank" value={myPlacement ? `#${myPlacement}` : "-"} hint={total ? `of ${total} players` : undefined} />
            <Stat label="Score" value={myEntry ? myEntry.groupScore : "-"} hint="points" />
            <Stat label="XP" value={`+${result.myXp ?? 0}`} />
            <Stat label="Coins" value={`+${result.myCoins ?? 0}`} />
          </div>
        </Panel>

        {/* Standings */}
        <section aria-labelledby="group-standings" className="grid gap-3">
          <h2 id="group-standings" className="font-mono text-label uppercase text-fg-muted">
            Final standings
          </h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell align="right" className="w-14">
                  Rank
                </TableHeaderCell>
                <TableHeaderCell>Player</TableHeaderCell>
                <TableHeaderCell align="right">Solved</TableHeaderCell>
                <TableHeaderCell align="right">Submissions</TableHeaderCell>
                <TableHeaderCell align="right">Score</TableHeaderCell>
                <TableHeaderCell align="right">XP</TableHeaderCell>
                <TableHeaderCell align="right">Coins</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {placements.map((entry) => {
                const isMe = entry.userId === userId;
                return (
                  <TableRow
                    key={entry.userId}
                    aria-current={isMe ? "true" : undefined}
                    className={cn(isMe && "!bg-accent-soft")}
                  >
                    <TableCell align="right" className={cn(entry.placement === 1 ? "text-accent-ink" : "text-fg-muted")}>
                      #{entry.placement}
                    </TableCell>
                    <TableCell>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-fg">{entry.username}</span>
                        {isMe ? <Badge tone="accent">You</Badge> : null}
                        {entry.forfeited ? <Badge tone="err">Forfeit</Badge> : null}
                      </span>
                    </TableCell>
                    <TableCell align="right">{entry.problemsSolved}</TableCell>
                    <TableCell align="right" className="text-fg-muted">
                      {entry.totalSubmissions}
                    </TableCell>
                    <TableCell align="right" className="font-bold">
                      {entry.groupScore}
                    </TableCell>
                    <TableCell align="right" className="text-ok">
                      +{entry.xpEarned}
                    </TableCell>
                    <TableCell align="right" className="text-fg-muted">
                      +{entry.coinsEarned}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      </div>
    </PageShell>
  );
}
