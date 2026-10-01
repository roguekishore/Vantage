import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Coins, Sparkles, Flame, ChevronLeft, ChevronRight, TrendingUp, Swords, Building2, Trophy,
} from "lucide-react";
import { getStoredUser } from "@/services/userApi";
import {
  fetchGlobalXPLeaderboard, fetchWeeklyXPLeaderboard,
  fetchWeeklyCoinsLeaderboard, fetchStreakLeaderboard,
  fetchBattleRatingLeaderboard, fetchMyRank, fetchInstitutionLeaderboard,
} from "@/services/leaderboardApi";
import {
  PageShell, PageHeader, Panel, Badge, Button, Stat, Progress, Avatar, Skeleton,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  EmptyState, ErrorState, OfflineState,
} from "@/components/ds";
import { cn } from "@/lib/utils";

/* ─── config ─── */
const TABS = [
  { key: "global-xp",     label: "Global XP",   Icon: Sparkles,   weekly: false },
  { key: "weekly-xp",     label: "Weekly XP",   Icon: TrendingUp, weekly: true  },
  { key: "weekly-coins",  label: "Coins",       Icon: Coins,      weekly: true  },
  { key: "streaks",       label: "Streaks",     Icon: Flame,      weekly: false },
  { key: "battle-rating", label: "Battle",      Icon: Swords,     weekly: false },
  { key: "institution",   label: "Institution", Icon: Building2,  weekly: false },
];
const FETCH = {
  "global-xp": fetchGlobalXPLeaderboard, "weekly-xp": fetchWeeklyXPLeaderboard,
  "weekly-coins": fetchWeeklyCoinsLeaderboard, "streaks": fetchStreakLeaderboard,
  "battle-rating": fetchBattleRatingLeaderboard,
};
const VL = { "global-xp": "XP", "weekly-xp": "XP", "weekly-coins": "Coins", "streaks": "Days", "battle-rating": "Rating", "institution": "XP" };
const PS = 20;

/* fetch() rejects with a TypeError when the server is unreachable; a non-OK
   response throws a plain Error from leaderboardApi. */
const isNetworkError = (e) => e instanceof TypeError;

/* ════════════════════════════════════════
   RANK CELL: top 3 get an accent block
════════════════════════════════════════ */
function RankCell({ rank }) {
  const top = rank >= 1 && rank <= 3;
  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center border font-mono text-small font-bold tabular-nums",
        top ? "border-accent-edge bg-accent text-on-accent" : "border-transparent text-fg-muted"
      )}
    >
      {String(rank).padStart(2, "0")}
    </span>
  );
}

function SkeletonRows({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="size-7" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 shrink-0" />
          <Skeleton className="h-3 w-32" />
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell"><Skeleton className="h-3 w-10" /></TableCell>
      <TableCell className="hidden sm:table-cell"><Skeleton className="h-3 w-10" /></TableCell>
      <TableCell align="right"><Skeleton className="ml-auto h-3 w-16" /></TableCell>
    </TableRow>
  ));
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <nav aria-label="Leaderboard pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <Button variant="secondary" size="sm" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0}>
        <ChevronLeft aria-hidden="true" /> Prev
      </Button>

      <div className="flex flex-wrap items-center gap-1">
        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
          <Button
            key={i}
            size="sm"
            variant={page === i ? "primary" : "ghost"}
            aria-label={`Page ${i + 1}`}
            aria-current={page === i ? "page" : undefined}
            className="w-7 px-0 tabular-nums"
            onClick={() => onPage(i)}
          >
            {i + 1}
          </Button>
        ))}
      </div>

      <Button variant="secondary" size="sm" onClick={() => onPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
        Next <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}

/* ════════════════════════════════════════
   YOUR RANK
════════════════════════════════════════ */
function MyRankPanel({ myRank, total, activeTab }) {
  const pct = total > 0 ? Math.max(2, Math.min(100, (myRank.rank / total) * 100)) : 50;
  return (
    <Panel as="section" label="Your rank">
      <div className="mb-4 flex min-w-0 items-center gap-3">
        <Avatar name={myRank.username} size="md" />
        <div className="min-w-0 truncate font-mono text-body text-fg">{myRank.username}</div>
      </div>
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-1">
        <Stat label="Rank" value={`#${myRank.rank?.toLocaleString()}`} />
        <Stat label={VL[activeTab]} value={myRank.value?.toLocaleString() ?? "—"} />
        <Stat label="Percentile" value={`Top ${Math.round(pct)}%`} />
      </div>
      {total > 0 ? (
        <div className="mt-4 grid gap-2">
          <Progress value={100 - pct} label="Performance" />
          <div className="font-mono text-small tabular-nums text-fg-muted">
            #{myRank.rank?.toLocaleString()} of {total.toLocaleString()}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

/* ════════════════════════════════════════
   PAGE
════════════════════════════════════════ */
export default function LeaderboardPage() {
  const user = getStoredUser();

  const [activeTab, setActiveTab] = useState("global-xp");
  const [page, setPage]           = useState(0);
  const [data, setData]           = useState(null);
  const [myRank, setMyRank]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [fading, setFading]       = useState(false);
  const [error, setError]         = useState(null);

  const instId   = user?.institutionId   ?? null;
  const instName = user?.institutionName ?? null;
  const tab      = TABS.find(t => t.key === activeTab);
  const isWeekly = tab?.weekly ?? false;

  const load = useCallback(async () => {
    if (activeTab === "institution" && !instId) { setData(null); setMyRank(null); setError(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      let pd, rd;
      if (activeTab === "institution") {
        pd = await fetchInstitutionLeaderboard(instId, page, PS); rd = null;
      } else {
        [pd, rd] = await Promise.all([
          FETCH[activeTab](page, PS),
          user?.uid ? fetchMyRank(user.uid, activeTab).catch(() => null) : null,
        ]);
      }
      setData(pd); setMyRank(rd);
    } catch (e) { console.error(e); setError(e); }
    finally { setLoading(false); }
  }, [activeTab, page, user?.uid, instId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [activeTab]);

  const handleTabChange = (key) => {
    setFading(true);
    setTimeout(() => { setActiveTab(key); setFading(false); }, 160);
  };

  const entries = data?.content || [];
  const showTotal = data?.totalElements != null && !isWeekly;
  const noInstitution = activeTab === "institution" && !instId;

  let body;
  if (error && !loading) {
    body = isNetworkError(error)
      ? <OfflineState onRetry={load} className="border-0" />
      : <ErrorState description="The leaderboard could not be loaded." onRetry={load} className="border-0" />;
  } else if (!loading && noInstitution) {
    body = (
      <EmptyState
        icon={Building2}
        title="Join an institution first"
        description="Institution rankings require membership."
        className="border-0"
      />
    );
  } else if (!loading && !entries.length) {
    body = (
      <EmptyState
        icon={Trophy}
        title="No rankings yet"
        description="Solve problems and compete to appear here."
        className="border-0"
      />
    );
  } else {
    body = (
      <>
        <Table wrapperClassName="border-0" aria-label={`${tab?.label} rankings`} aria-busy={loading || undefined}>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-16">Rank</TableHeaderCell>
              <TableHeaderCell>Player</TableHeaderCell>
              <TableHeaderCell className="hidden w-20 sm:table-cell" align="right">Level</TableHeaderCell>
              <TableHeaderCell className="hidden w-24 sm:table-cell" align="right">Streak</TableHeaderCell>
              <TableHeaderCell className="w-28" align="right">{VL[activeTab]}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? <SkeletonRows /> : entries.map((entry) => {
              const isMe = user?.uid === entry.userId;
              return (
                <TableRow
                  key={`${entry.userId}-${entry.rank}`}
                  className={cn(isMe && "!bg-accent-soft")}
                  aria-current={isMe ? "true" : undefined}
                >
                  <TableCell><RankCell rank={entry.rank} /></TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={entry.username} size="sm" />
                      <span className="min-w-0 truncate text-fg">{entry.username}</span>
                      {isMe ? <Badge tone="accent">You</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-fg-muted sm:table-cell" align="right">
                    {entry.level != null ? `Lv ${entry.level}` : "—"}
                  </TableCell>
                  <TableCell className="hidden text-fg-muted sm:table-cell" align="right">
                    {entry.currentStreak > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Flame size={14} strokeWidth={1.5} aria-hidden="true" />
                        {entry.currentStreak}d
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell align="right" className="font-bold text-fg">
                    {entry.value?.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {data?.totalPages > 1 && (
          <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />
        )}
      </>
    );
  }

  const showMyRank = Boolean(myRank) && !error;
  const showBoardPanel = (showTotal && !error) || isWeekly || activeTab === "institution" || !user?.uid;
  const hasAside = showMyRank || showBoardPanel;

  const board = (
    <div className={cn("mt-6 grid gap-6", hasAside && "lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start")}>
      <Panel
        as="section"
        padded={false}
        label={`${tab?.label} rankings${activeTab === "institution" && instName ? ` · ${instName}` : ""}`}
        actions={data?.totalPages > 1 && !error ? (
          <span className="font-mono text-small tabular-nums text-fg-muted">{page + 1}/{data.totalPages}</span>
        ) : null}
        className={cn("min-w-0 transition-opacity duration-150", fading && "opacity-40")}
      >
        {body}
      </Panel>

      {hasAside ? (
        <aside className="order-first grid gap-4 lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:order-none">
          {showMyRank ? (
            <MyRankPanel myRank={myRank} total={data?.totalElements} activeTab={activeTab} />
          ) : null}

          {showBoardPanel ? (
            <Panel as="section" label="Board">
              <div className="grid gap-3">
                {showTotal && !error ? (
                  <Stat label="Ranked players" value={data.totalElements.toLocaleString()} />
                ) : null}
                {isWeekly ? (
                  <p className="font-mono text-small text-fg-muted">Counts this week only.</p>
                ) : null}
                {activeTab === "institution" ? (
                  <p className="flex items-start gap-2 font-mono text-small text-fg-muted">
                    <Building2 size={14} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                    {instName
                      ? <span>Rankings within <strong className="text-fg">{instName}</strong></span>
                      : <span>You're not part of any institution.</span>}
                  </p>
                ) : null}
                {!user?.uid ? (
                  <div className="grid gap-3">
                    <p className="font-mono text-small text-fg-muted">Sign in to see where you rank.</p>
                    <Button variant="secondary" size="sm" asChild>
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </Panel>
          ) : null}
        </aside>
      ) : null}
    </div>
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Rankings"
        title="Leaderboard"
        description="Rise through the ranks. Every point counts."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
        <TabsList aria-label="Leaderboards">
          {TABS.map(({ key, label, Icon, weekly }) => (
            <TabsTrigger key={key} value={key}>
              <Icon aria-hidden="true" />
              {label}
              {weekly ? (
                <Badge tone="outline">
                  <span aria-hidden="true">Wk</span>
                  <span className="sr-only">weekly</span>
                </Badge>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ key }) => (
          <TabsContent key={key} value={key}>
            {board}
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
