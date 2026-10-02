/**
 * ProblemsTable: the /problems list (POLISH_PLAN §6, Problems row).
 * PageShell + PageHeader, a filter panel (search, stage and sort Selects,
 * segmented difficulty and status Tabs), then a ds Table with status icons,
 * difficulty as text + 2px left bar, stage Badges and an optional LeetCode
 * link. Data flow (paged Spring fetch with infinite scroll, or the client-side
 * filtered judge list) is unchanged; only the view is rebuilt on ds/*.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, useId } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp, ArrowDown, ArrowUpDown, Search, ExternalLink, X, RotateCcw,
  BookOpen, CircleCheck, CircleDot, Circle,
} from "lucide-react";
import {
  PageShell, PageHeader, Button, IconButton, Input, Select, SelectItem,
  Tabs, TabsList, TabsTrigger, Table, TableHead, TableBody, TableRow,
  TableHeaderCell, TableCell, Badge, Stat, Progress, Skeleton,
  EmptyState, ErrorState, OfflineState, Dialog, DialogContent,
} from "@/components/ds";
import { cn } from "@/lib/utils";
import { fetchProgressStats } from "../../services/problemApi";

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const LC_BASE = "https://leetcode.com/problems";
const RESULTS_ID = "problems-results";
const FOCUS_RING = "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus";
const COLOR_TRANSITION = "transition-colors duration-[120ms] ease-out";
const LABEL = "font-mono text-label uppercase";

/* Difficulty: status tokens only (§3.1). Easy ok, Medium warn, Hard err. */
const EASY = { label: "Easy", text: "text-ok", bar: "border-ok" };
const MEDIUM = { label: "Medium", text: "text-warn", bar: "border-warn" };
const HARD = { label: "Hard", text: "text-err", bar: "border-err" };
const DIFF = {
  BASIC: { label: "Basic", text: "text-fg-muted", bar: "border-border-strong" },
  EASY, MEDIUM, HARD,
  Easy: EASY, Medium: MEDIUM, Hard: HARD,
};

const STATUS_CFG = {
  SOLVED: { label: "Solved", Icon: CircleCheck, className: "text-ok" },
  ATTEMPTED: { label: "Attempted", Icon: CircleDot, className: "text-warn" },
  NOT_STARTED: { label: "To do", Icon: Circle, className: "text-fg-dim" },
};

const SORT_OPTIONS = [
  { value: "pid,asc", label: "Number, ascending" },
  { value: "pid,desc", label: "Number, descending" },
  { value: "title,asc", label: "Title, A to Z" },
  { value: "title,desc", label: "Title, Z to A" },
  { value: "tag,asc", label: "Difficulty, ascending" },
  { value: "tag,desc", label: "Difficulty, descending" },
];

/* fetch() rejects with a bare TypeError when the API is unreachable. */
const NETWORK_ERROR_RE = /^(failed to fetch|load failed|network ?error|networkerror when attempting to fetch resource\.?)$/i;
const isNetworkError = (msg) =>
  NETWORK_ERROR_RE.test(String(msg || "").trim()) ||
  (typeof navigator !== "undefined" && navigator.onLine === false);

/* ─────────────────────────────────────────────────────────
   SMALL VIEW PIECES
───────────────────────────────────────────────────────── */
function StatusIcon({ status, withLabel = false }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.NOT_STARTED;
  const { Icon } = cfg;
  return (
    <span className="inline-flex items-center gap-2" title={withLabel ? undefined : cfg.label}>
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" className={cn("shrink-0", cfg.className)} />
      {withLabel ? (
        <span className="font-mono text-body text-fg">{cfg.label}</span>
      ) : (
        <span className="sr-only">{cfg.label}</span>
      )}
    </span>
  );
}

function DifficultyText({ value, className }) {
  const d = DIFF[value] || { label: value || "—", text: "text-fg-muted", bar: "border-border" };
  return (
    <span className={cn("inline-flex h-5 items-center border-l-2 pl-2 font-mono text-small font-bold", d.text, d.bar, className)}>
      {d.label}
    </span>
  );
}

function SortHeader({ label, field, current, onSort, align = "left", className }) {
  const [f, d] = (current || "").split(",");
  const active = f === field;
  const Icon = active ? (d === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHeaderCell
      align={align}
      aria-sort={active ? (d === "asc" ? "ascending" : "descending") : "none"}
      className={className}
    >
      <button
        type="button"
        onClick={() => onSort(active && d === "asc" ? `${field},desc` : `${field},asc`)}
        className={cn(
          "inline-flex items-center gap-1 uppercase",
          COLOR_TRANSITION,
          FOCUS_RING,
          active ? "text-fg" : "text-fg-muted ds-hover:text-fg"
        )}
      >
        {label}
        <Icon size={14} strokeWidth={1.5} aria-hidden="true" className={active ? "text-accent-ink" : undefined} />
      </button>
    </TableHeaderCell>
  );
}

function FilterTabs({ label, value, onChange, options }) {
  const labelId = useId();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span id={labelId} className={cn(LABEL, "text-fg-muted")}>
        {label}
      </span>
      <Tabs variant="segmented" value={value} onValueChange={onChange}>
        <TabsList aria-labelledby={labelId}>
          {options.map((o) => (
            <TabsTrigger key={o.value || "all"} value={o.value} aria-controls={RESULTS_ID}>
              {o.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function ProgressSummary({ completionPct, solved, attempted, total }) {
  const cells = [
    { label: "Complete", value: `${completionPct}%` },
    { label: "Solved", value: solved },
    { label: "Attempted", value: attempted },
    { label: "Total", value: total },
  ];
  return (
    <div className="w-full border border-border bg-surface sm:w-auto">
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {cells.map((c) => (
          <Stat key={c.label} label={c.label} value={c.value} className="bg-surface px-4 py-3" />
        ))}
      </div>
      <div className="border-t border-border px-4 py-3">
        <Progress value={completionPct} label={`${completionPct}% of problems solved`} />
      </div>
    </div>
  );
}

function SkeletonRows({ count, cols }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i} aria-hidden="true">
      {cols.map((c) => (
        <TableCell key={c.key} className={c.className}>
          <Skeleton className={c.skeleton(i)} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function DetailRow({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-4">
      <dt className={cn(LABEL, "pt-0.5 text-fg-muted")}>{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function ProblemsTable({
  source = "spring",
  fetchList,
  fetchDetail,
  fetchStages: fetchStagesFn,
  progressMap = {},
  title = "Problems",
  subtitle,
  eyebrow = "Practice",
  // eslint-disable-next-line no-unused-vars
  icon: HeaderIcon = BookOpen,
  onRowClick,
  rowHref,
  showLeetCode = true,
  showStage = source === "spring",
}) {
  /* ── State ── */
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [sort, setSort] = useState("pid,asc");
  const [hasMore, setHasMore] = useState(false);

  const [stageFilter, setStageFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [stages, setStages] = useState([]);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [userStats, setUserStats] = useState(null);
  const [judgeDiffFilter, setJudgeDiffFilter] = useState("All");
  // eslint-disable-next-line no-unused-vars
  const [judgeStatusFilter, setJudgeStatusFilter] = useState("All");

  const sentinelRef = useRef(null);
  const searchRef = useRef(null);

  /* ── Debounce ── */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchKeyword), 300);
    return () => clearTimeout(t);
  }, [searchKeyword]);

  useEffect(() => {
    setPage(0); setProblems([]); setHasMore(false);
  }, [debounced, stageFilter, tagFilter, statusFilter, sort]);

  /* ── Fetch ── */
  const fetchSpringPage = useCallback(async (pageNum) => {
    const isFirst = pageNum === 0;
    if (isFirst) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchList({
        page: pageNum, size, sort,
        stage: stageFilter || undefined,
        tag: tagFilter || undefined,
        status: statusFilter || undefined,
        keyword: debounced || undefined,
      });
      const incoming = data.content || [];
      setProblems(prev => isFirst ? incoming : [...prev, ...incoming]);
      setTotalElements(data.totalElements || 0);
      setHasMore(pageNum < (data.totalPages || 0) - 1);
    } catch (e) { setError(e.message); }
    finally { if (isFirst) setLoading(false); else setLoadingMore(false); }
  }, [fetchList, size, sort, stageFilter, tagFilter, statusFilter, debounced]);

  const loadJudge = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchList();
      setProblems(data);
      setTotalElements(data.length);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [fetchList]);

  useEffect(() => {
    if (source === "spring") fetchSpringPage(page);
    else if (page === 0) loadJudge();
  }, [source, page, fetchSpringPage, loadJudge]);

  /* ── Infinite scroll ── */
  useEffect(() => {
    if (source !== "spring") return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading)
          setPage(prev => prev + 1);
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [source, hasMore, loadingMore, loading]);

  useEffect(() => {
    if (fetchStagesFn) fetchStagesFn().then(setStages).catch(() => { });
  }, [fetchStagesFn]);

  useEffect(() => {
    if (source !== "spring") return;
    fetchProgressStats().then(setUserStats).catch(() => { });
  }, [source]);

  /* ── Judge filter ── */
  const filteredJudge = useMemo(() => {
    if (source !== "judge") return [];
    return problems.filter(p => {
      const matchSearch = !debounced ||
        p.title?.toLowerCase().includes(debounced.toLowerCase()) ||
        p.topic?.toLowerCase().includes(debounced.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(debounced.toLowerCase()));
      const matchDiff = judgeDiffFilter === "All" || p.difficulty === judgeDiffFilter;
      return matchSearch && matchDiff;
    });
  }, [source, problems, debounced, judgeDiffFilter]);

  const displayList = source === "spring" ? problems : filteredJudge;
  const displayTotal = source === "spring" ? totalElements : filteredJudge.length;

  /* ── Detail ── */
  const openDetail = async id => {
    if (!fetchDetail) return;
    setDialogOpen(true); setDetailLoading(true);
    try { setSelected(await fetchDetail(id)); }
    catch { setSelected(null); }
    finally { setDetailLoading(false); }
  };

  const handleRowClick = problem => {
    const id = problem.pid ?? problem.id;
    if (onRowClick) onRowClick(id, problem);
    else openDetail(id);
  };

  /* ── Helpers ── */
  const clearAll = () => {
    setSearchKeyword(""); setDebounced("");
    setStageFilter(""); setTagFilter(""); setStatusFilter("");
    setJudgeDiffFilter("All"); setSort("pid,asc");
  };

  const hasFilters = source === "spring"
    ? (stageFilter || tagFilter || statusFilter || debounced)
    : (debounced || judgeDiffFilter !== "All");

  const retryLoad = useCallback(() => {
    if (source === "spring") { setPage(0); fetchSpringPage(0); }
    else loadJudge();
  }, [source, fetchSpringPage, loadJudge]);

  const getDifficulty = p => p.tag || p.difficulty || "";
  const getTitle = p => p.title || "";
  const getId = p => p.pid ?? p.id;
  const getLcSlug = p => p.lcslug || p.lcSlug || null;
  const getStages = p => p.stages || [];
  const getCategory = p => p.category || p.topic || "";
  const getUserStatus = p => {
    if (p.userStatus) return p.userStatus;
    const id = getId(p);
    if (progressMap[id]) return progressMap[id].status || progressMap[id];
    return null;
  };

  /* ── Stats ── */
  const solvedCount = useMemo(() => {
    if (source === "spring") return userStats ? Number(userStats.solved ?? 0) : 0;
    return problems.filter(p => {
      const s = progressMap[p.pid ?? p.id];
      return (s?.status || s) === "SOLVED";
    }).length;
  }, [source, problems, progressMap, userStats]);

  const attemptedCount = useMemo(() => {
    if (source === "spring") return userStats ? Number(userStats.attempted ?? 0) : 0;
    return problems.filter(p => {
      const s = progressMap[p.pid ?? p.id];
      return (s?.status || s) === "ATTEMPTED";
    }).length;
  }, [source, problems, progressMap, userStats]);

  const completionPct = displayTotal > 0 ? Math.round((solvedCount / displayTotal) * 100) : 0;

  /* ── Filter options ── */
  const diffOptions = source === "spring"
    ? [
      { label: "All", value: "" },
      { label: "Easy", value: "EASY" },
      { label: "Medium", value: "MEDIUM" },
      { label: "Hard", value: "HARD" },
    ]
    : [
      { label: "All", value: "All" },
      { label: "Easy", value: "Easy" },
      { label: "Medium", value: "Medium" },
      { label: "Hard", value: "Hard" },
    ];

  const statusOptions = [
    { label: "All", value: "" },
    { label: "Solved", value: "SOLVED" },
    { label: "Attempted", value: "ATTEMPTED" },
    { label: "To do", value: "NOT_STARTED" },
  ];

  /* ── Columns (shared by header, skeleton and rows) ── */
  const showTopicCol = showStage || source === "judge";
  const cols = [
    { key: "status", className: "w-12", skeleton: () => "h-4 w-4" },
    { key: "num", className: "w-16", skeleton: () => "h-3 w-6" },
    { key: "title", className: "", skeleton: i => cn("h-3", ["w-3/5", "w-2/5", "w-1/2", "w-3/4"][i % 4]) },
    showTopicCol && { key: "topic", className: "hidden w-48 sm:table-cell", skeleton: () => "h-5 w-24" },
    { key: "diff", className: "w-28", skeleton: () => "h-3 w-14" },
    showLeetCode && { key: "lc", className: "hidden w-16 md:table-cell", skeleton: () => "h-7 w-7" },
  ].filter(Boolean);

  const colClass = key => cols.find(c => c.key === key)?.className;
  const showFirstLoadError = Boolean(error) && !loading && displayList.length === 0;
  const errorIsNetwork = isNetworkError(error);

  /* ── Rows ── */
  const renderRow = (problem, index) => {
    const id = getId(problem);
    const titleText = getTitle(problem);
    const slug = getLcSlug(problem);
    const href = rowHref ? rowHref(id, problem) : null;
    const stageList = source === "judge" ? [getCategory(problem)].filter(Boolean) : getStages(problem);

    return (
      <TableRow
        key={id}
        interactive
        onClick={e => {
          if (e.target.closest("a, button")) return;
          handleRowClick(problem);
        }}
      >
        <TableCell className={colClass("status")}>
          <StatusIcon status={getUserStatus(problem)} />
        </TableCell>
        <TableCell className={cn(colClass("num"), "text-fg-muted")}>{index + 1}</TableCell>
        <TableCell className="max-w-0">
          {href ? (
            <Link
              to={href}
              className={cn("block truncate text-body text-fg", COLOR_TRANSITION, FOCUS_RING, "ds-hover:text-accent-ink")}
            >
              {titleText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => handleRowClick(problem)}
              className={cn("block w-full truncate text-left text-body text-fg", COLOR_TRANSITION, FOCUS_RING, "ds-hover:text-accent-ink")}
            >
              {titleText}
            </button>
          )}
        </TableCell>
        {showTopicCol && (
          <TableCell className={colClass("topic")}>
            {stageList.length > 0 ? (
              <span className="flex items-center gap-1">
                <Badge className="block max-w-[10rem] truncate leading-[18px]" title={stageList[0]}>
                  {stageList[0]}
                </Badge>
                {stageList.length > 1 && (
                  <Badge tone="outline" title={stageList.slice(1).join(", ")}>
                    +{stageList.length - 1}
                  </Badge>
                )}
              </span>
            ) : (
              <span className="text-fg-dim">—</span>
            )}
          </TableCell>
        )}
        <TableCell className={colClass("diff")}>
          <DifficultyText value={getDifficulty(problem)} />
        </TableCell>
        {showLeetCode && (
          <TableCell className={colClass("lc")}>
            {slug ? (
              <IconButton asChild size="sm" aria-label={`Open ${titleText} on LeetCode`}>
                <a href={`${LC_BASE}/${slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                </a>
              </IconButton>
            ) : null}
          </TableCell>
        )}
      </TableRow>
    );
  };

  /* ── Results block ── */
  let results;
  if (showFirstLoadError) {
    results = errorIsNetwork
      ? <OfflineState onRetry={retryLoad} />
      : <ErrorState title="Couldn't load problems" description={error} onRetry={retryLoad} />;
  } else if (!loading && displayList.length === 0) {
    results = (
      <EmptyState
        icon={Search}
        title={hasFilters ? "No matching problems" : "No problems yet"}
        description={hasFilters ? "Try a different search or clear the filters." : "Check back later."}
        action={hasFilters ? <Button onClick={clearAll}>Clear filters</Button> : null}
      />
    );
  } else {
    results = (
      <>
        <Table wrapperClassName="bg-surface" aria-busy={loading || undefined}>
          {loading ? <caption className="sr-only">Loading problems</caption> : null}
          <TableHead>
            <TableRow>
              <TableHeaderCell className={colClass("status")}>
                <span className="sr-only">Status</span>
              </TableHeaderCell>
              {source === "spring"
                ? <SortHeader label="#" field="pid" current={sort} onSort={setSort} className={colClass("num")} />
                : <TableHeaderCell className={colClass("num")}>#</TableHeaderCell>}
              {source === "spring"
                ? <SortHeader label="Title" field="title" current={sort} onSort={setSort} />
                : <TableHeaderCell>Title</TableHeaderCell>}
              {showTopicCol && (
                <TableHeaderCell className={colClass("topic")}>{source === "judge" ? "Topic" : "Stage"}</TableHeaderCell>
              )}
              {source === "spring"
                ? <SortHeader label="Difficulty" field="tag" current={sort} onSort={setSort} className={colClass("diff")} />
                : <TableHeaderCell className={colClass("diff")}>Difficulty</TableHeaderCell>}
              {showLeetCode && (
                <TableHeaderCell className={colClass("lc")}>
                  <abbr title="LeetCode" className="no-underline">LC</abbr>
                </TableHeaderCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? <SkeletonRows count={12} cols={cols} />
              : displayList.map((p, i) => renderRow(p, i))}
          </TableBody>
        </Table>

        {!loading && displayList.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-x border-b border-border bg-surface px-3 py-2 font-mono text-small tabular-nums text-fg-muted">
            <span>{displayList.length} of {displayTotal} problems</span>
            {hasMore && <span className={cn(LABEL, "text-fg-dim")}>Scroll for more</span>}
          </div>
        )}

        {error && displayList.length > 0 && (
          <div className="mt-4">
            {errorIsNetwork
              ? <OfflineState onRetry={retryLoad} />
              : <ErrorState title="Couldn't load more problems" description={error} onRetry={retryLoad} />}
          </div>
        )}
      </>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={subtitle || "Filter by difficulty, stage or status, then open a problem in the judge."}
        actions={
          <ProgressSummary
            completionPct={completionPct}
            solved={solvedCount}
            attempted={attemptedCount}
            total={displayTotal}
          />
        }
      />

      {/* ══ FILTERS ══ */}
      <section aria-label="Filters" className="mb-4 grid gap-4 border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-0 flex-1 basis-64">
            <Input
              ref={searchRef}
              type="text"
              label="Search"
              placeholder="Search problems, topics, tags"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="pl-9 pr-10"
            />
            <Search
              size={16}
              strokeWidth={1.5}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[10px] left-3 text-fg-dim"
            />
            {searchKeyword && (
              <IconButton
                icon={X}
                size="sm"
                aria-label="Clear search"
                onClick={() => setSearchKeyword("")}
                className="absolute bottom-1 right-1"
              />
            )}
          </div>

          {showStage && stages.length > 0 && (
            <Select
              label="Stage"
              value={stageFilter || "__all__"}
              onValueChange={v => setStageFilter(v === "__all__" ? "" : v)}
              placeholder="All stages"
              fieldClassName="w-full sm:w-56"
            >
              <SelectItem value="__all__">All stages</SelectItem>
              {stages.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </Select>
          )}

          {source === "spring" && (
            <Select
              label="Sort"
              value={sort}
              onValueChange={setSort}
              fieldClassName="w-full sm:w-56"
            >
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </Select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <FilterTabs
            label="Difficulty"
            value={source === "spring" ? tagFilter : judgeDiffFilter}
            onChange={v => source === "spring" ? setTagFilter(v) : setJudgeDiffFilter(v)}
            options={diffOptions}
          />
          {source === "spring" && (
            <FilterTabs label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          )}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="sm:ml-auto">
              <RotateCcw aria-hidden="true" /> Reset filters
            </Button>
          )}
        </div>
      </section>

      {/* ══ RESULTS ══ */}
      <div id={RESULTS_ID}>
        {results}
      </div>

      {/* ══ INFINITE SCROLL SENTINEL ══ */}
      {source === "spring" && (
        <div ref={sentinelRef} className="flex flex-col items-center gap-2 py-6">
          {loadingMore && (
            <div role="status" className="grid w-40 justify-items-center gap-2">
              <Progress label="Loading more problems" />
              <span className={cn(LABEL, "text-fg-muted")}>Loading more_</span>
            </div>
          )}
          {!loadingMore && !hasMore && !loading && displayList.length > 0 && (
            <span className={cn(LABEL, "tabular-nums text-fg-dim")}>All {totalElements} problems loaded</span>
          )}
        </div>
      )}

      {source === "judge" && !loading && !error && (
        <p className="py-6 text-center font-mono text-small tabular-nums text-fg-dim">
          {displayList.length} problem{displayList.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* ══ DETAIL DIALOG (used when no onRowClick is passed) ══ */}
      {fetchDetail && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            title={detailLoading ? "Loading problem" : selected ? (selected.title || "Problem") : "Problem not found"}
            description={!detailLoading && selected ? `Problem #${selected.pid ?? selected.id}` : undefined}
          >
            {detailLoading ? (
              <div role="status" className="grid gap-3 py-2">
                <span className="sr-only">Loading problem details</span>
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : selected ? (
              <dl className="grid gap-4">
                <DetailRow label="Difficulty">
                  <DifficultyText value={selected.tag || selected.difficulty} />
                </DetailRow>

                {selected.userStatus && (
                  <DetailRow label="Status">
                    <StatusIcon status={selected.userStatus} withLabel />
                  </DetailRow>
                )}

                {selected.stages?.length > 0 && (
                  <DetailRow label="Stages">
                    <div className="flex flex-wrap gap-2">
                      {selected.stages.map(t => <Badge key={t}>{t}</Badge>)}
                    </div>
                  </DetailRow>
                )}

                {selected.hasVisualizer !== undefined && (
                  <DetailRow label="Visualizer">
                    <span className={cn("font-mono text-body", selected.hasVisualizer ? "text-ok" : "text-fg-dim")}>
                      {selected.hasVisualizer ? "Available" : "—"}
                    </span>
                  </DetailRow>
                )}

                {selected.description && (
                  <DetailRow label="Description">
                    <p className="font-mono text-body text-fg-muted">{selected.description}</p>
                  </DetailRow>
                )}

                {getLcSlug(selected) && (
                  <DetailRow label="LeetCode">
                    <Button asChild size="sm">
                      <a href={`${LC_BASE}/${getLcSlug(selected)}`} target="_blank" rel="noopener noreferrer">
                        {getLcSlug(selected)} <ExternalLink aria-hidden="true" />
                      </a>
                    </Button>
                  </DetailRow>
                )}
              </dl>
            ) : (
              <p className="py-6 text-center font-mono text-body text-fg-muted">
                This problem could not be loaded.
              </p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  );
}
