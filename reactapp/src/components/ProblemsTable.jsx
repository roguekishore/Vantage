/**
 * ProblemsTable — Premium problem table with rich, modern design.
 * Used by both /problems (Spring-backed) and /judge (Node-backed).
 *
 * Features:
 *   • Gradient hero header with animated accents
 *   • Live stat cards with glow effects
 *   • Glassmorphism filter bar
 *   • Premium table rows with hover glow & accent bars
 *   • Rich difficulty badges & status indicators
 *   • Detail dialog with polished layout
 *   • Dual-theme compatible
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp, ArrowDown, ArrowUpDown, Search,
  ExternalLink, X, Loader2, Filter, RotateCcw, CheckCircle2, Circle,
  CircleDot, BookOpen, Code2, Trophy, Target, Flame, Sparkles, Zap,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "./ui/select";
import {
  Dialog, DialogContent,
} from "./ui/dialog";

/* ── Constants ────────────────────────────────────────────────────── */

const LC_BASE = "https://leetcode.com/problems";

const DIFF_STYLE = {
  BASIC: { color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400", label: "Basic", glow: "" },
  EASY: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", label: "Easy", glow: "shadow-emerald-500/5" },
  MEDIUM: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20 text-amber-400", label: "Medium", glow: "shadow-amber-500/5" },
  HARD: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20 text-rose-400", label: "Hard", glow: "shadow-rose-500/5" },
  Easy: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", label: "Easy", glow: "shadow-emerald-500/5" },
  Medium: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20 text-amber-400", label: "Medium", glow: "shadow-amber-500/5" },
  Hard: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20 text-rose-400", label: "Hard", glow: "shadow-rose-500/5" },
};

const STATUS_CFG = {
  SOLVED: { icon: CheckCircle2, color: "text-emerald-400", bgDot: "bg-emerald-400", label: "Solved" },
  ATTEMPTED: { icon: CircleDot, color: "text-amber-400", bgDot: "bg-amber-400", label: "Attempted" },
  NOT_STARTED: { icon: Circle, color: "text-zinc-600", bgDot: "bg-zinc-600", label: "Todo" },
};

/* ── Sortable column header ───────────────────────────────────────── */

function SortHeader({ label, field, current, onSort }) {
  const [f, d] = (current || "").split(",");
  const active = f === field;
  const Icon = active ? (d === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      onClick={() => onSort(active && d === "asc" ? `${field},desc` : `${field},asc`)}
      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 group"
    >
      {label}
      <Icon className={`h-3 w-3 transition-all duration-200 ${active ? "text-[#5542FF]" : "opacity-20 group-hover:opacity-60"}`} />
    </button>
  );
}

/* ── Status icon cell (premium animated dot) ──────────────────────── */

function StatusDot({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.NOT_STARTED;
  const isSolved = status === "SOLVED";
  return (
    <span title={cfg.label} className="relative flex items-center justify-center">
      <span className={`h-2.5 w-2.5 rounded-full ${cfg.bgDot} ${isSolved ? "animate-pulse" : ""}`}
        style={isSolved ? { boxShadow: "0 0 8px rgba(52, 211, 153, 0.4)" } : {}} />
    </span>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * @param {Object}   props
 * @param {"spring"|"judge"} props.source     - Data source: "spring" for paginated backend, "judge" for client-side
 * @param {Function} props.fetchList          - Fetches the problem list. For spring: ({page,size,sort,stage,tag,status,keyword}) → Page<DTO>.
 *                                              For judge: () → Problem[]
 * @param {Function} [props.fetchDetail]      - Fetches a single problem detail by id
 * @param {Function} [props.fetchStages]      - Fetches stage names for the filter dropdown
 * @param {Object}   [props.progressMap]      - Map<pid, {status}> from backend (for spring source)
 * @param {string}   [props.title]            - Page title
 * @param {string}   [props.subtitle]         - Page subtitle
 * @param {React.ElementType} [props.icon]    - Header icon component
 * @param {Function} [props.onRowClick]       - Custom row click handler (pid, problem) → void. If omitted, opens detail dialog.
 * @param {boolean}  [props.showLeetCode]     - Show LC link column (default true)
 * @param {boolean}  [props.showStage]        - Show stage column (default true for spring, false for judge)
 */
export default function ProblemsTable({
  source = "spring",
  fetchList,
  fetchDetail,
  fetchStages: fetchStagesFn,
  progressMap = {},
  title = "Problems",
  subtitle,
  icon: HeaderIcon = BookOpen,
  onRowClick,
  showLeetCode = true,
  showStage = source === "spring",
}) {
  const navigate = useNavigate();

  /* ── State ────────────────────────────────────────────────────── */
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sort, setSort] = useState("pid,asc");
  const [hasMore, setHasMore] = useState(false);

  /* ── Filters ──────────────────────────────────────────────────── */
  const [stageFilter, setStageFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [stages, setStages] = useState([]);

  /* ── Detail dialog ────────────────────────────────────────────── */
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── Judge-only: client-side filter state ─────────────────────── */
  const [judgeDiffFilter, setJudgeDiffFilter] = useState("All");

  /* ── Infinite scroll sentinel ref ────────────────────────────── */
  const sentinelRef = useRef(null);

  /* ── Debounce search — resets to page 0 ─────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(searchKeyword); }, 300);
    return () => clearTimeout(t);
  }, [searchKeyword]);

  /* ── Reset to page 0 when any filter/sort changes ───────────── */
  useEffect(() => {
    setPage(0);
    setProblems([]);
    setHasMore(false);
  }, [debounced, stageFilter, tagFilter, statusFilter, sort]);

  /* ── Fetch a single page (spring) ───────────────────────────── */
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
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setHasMore(pageNum < (data.totalPages || 0) - 1);
    } catch (e) { setError(e.message); }
    finally { if (isFirst) setLoading(false); else setLoadingMore(false); }
  }, [fetchList, size, sort, stageFilter, tagFilter, statusFilter, debounced]);

  /* ── Fetch judge list (all at once, client-filtered) ─────────── */
  const loadJudge = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchList();
      setProblems(data);
      setTotalElements(data.length);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [fetchList]);

  /* ── Initial + page-change load ─────────────────────────────── */
  useEffect(() => {
    if (source === "spring") fetchSpringPage(page);
    else if (page === 0) loadJudge();
  }, [source, page, fetchSpringPage, loadJudge]);

  /* ── IntersectionObserver: load next page when sentinel visible ─ */
  useEffect(() => {
    if (source !== "spring") return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [source, hasMore, loadingMore, loading]);

  /* ── Fetch stages once ───────────────────────────────────────── */
  useEffect(() => {
    if (fetchStagesFn) fetchStagesFn().then(setStages).catch(() => { });
  }, [fetchStagesFn]);

  /* ── Judge: client-filtered list ──────────────────────────────── */
  const filteredJudge = useMemo(() => {
    if (source !== "judge") return [];
    return problems.filter((p) => {
      const matchSearch = !debounced ||
        p.title?.toLowerCase().includes(debounced.toLowerCase()) ||
        p.topic?.toLowerCase().includes(debounced.toLowerCase()) ||
        p.category?.toLowerCase().includes(debounced.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(debounced.toLowerCase()));
      const matchDiff = judgeDiffFilter === "All" || p.difficulty === judgeDiffFilter;
      return matchSearch && matchDiff;
    });
  }, [source, problems, debounced, judgeDiffFilter]);

  const displayList = source === "spring" ? problems : filteredJudge;
  const displayTotal = source === "spring" ? totalElements : filteredJudge.length;

  /* ── Detail dialog ────────────────────────────────────────────── */
  const openDetail = async (id) => {
    if (!fetchDetail) return;
    setDialogOpen(true); setDetailLoading(true);
    try { setSelected(await fetchDetail(id)); }
    catch { setSelected(null); }
    finally { setDetailLoading(false); }
  };

  const handleRowClick = (problem) => {
    const id = problem.pid ?? problem.id;
    if (onRowClick) {
      onRowClick(id, problem);
    } else {
      openDetail(id);
    }
  };

  /* ── Clear all filters ────────────────────────────────────────── */
  const clearAll = () => {
    setSearchKeyword(""); setDebounced("");
    setStageFilter(""); setTagFilter(""); setStatusFilter("");
    setJudgeDiffFilter("All");
    setSort("pid,asc");
    // page/problems reset handled by the filter-change useEffect
  };

  const hasFilters = source === "spring"
    ? (stageFilter || tagFilter || statusFilter || debounced)
    : (debounced || judgeDiffFilter !== "All");

  /* ── Helpers for normalising data shape between spring & judge ── */
  const getDifficulty = (p) => p.tag || p.difficulty || "";
  const getTitle = (p) => p.title || "";
  const getId = (p) => p.pid ?? p.id;
  const getLcSlug = (p) => p.lcslug || p.lcSlug || null;
  const getStages = (p) => p.stages || [];
  const getCategory = (p) => p.category || p.topic || "";
  const getUserStatus = (p) => {
    // Spring backend provides userStatus directly
    if (p.userStatus) return p.userStatus;
    // Fallback: look up from the progressMap
    const id = getId(p);
    if (progressMap[id]) return progressMap[id].status || progressMap[id];
    return null;
  };

  /* ── Stats for header ──────────────────────────────────────────── */
  const solvedCount = useMemo(() => {
    if (source === "spring") {
      return Object.values(progressMap).filter(v => (v?.status || v) === "SOLVED").length;
    }
    return problems.filter(p => {
      const id = p.pid ?? p.id;
      const s = progressMap[id];
      return (s?.status || s) === "SOLVED";
    }).length;
  }, [source, problems, progressMap]);

  const attemptedCount = useMemo(() => {
    if (source === "spring") {
      return Object.values(progressMap).filter(v => (v?.status || v) === "ATTEMPTED").length;
    }
    return problems.filter(p => {
      const id = p.pid ?? p.id;
      const s = progressMap[id];
      return (s?.status || s) === "ATTEMPTED";
    }).length;
  }, [source, problems, progressMap]);

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 md:pt-28">

      {/* ── HERO HEADER ──────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Background gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#5542FF]/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#5542FF]/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <main className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-6 pb-16">

          {/* ── Title Block ───────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-[#5542FF] to-[#B28EF2] shadow-lg shadow-[#5542FF]/20">
                <HeaderIcon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {subtitle || `Master ${displayTotal} challenges to level up your skills`}
                </p>
              </div>
            </div>
          </div>

          {/* ── STAT CARDS ────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatPill icon={Target} label="Total" value={displayTotal} color="purple" />
            <StatPill icon={Trophy} label="Solved" value={solvedCount} color="emerald" />
            <StatPill icon={Flame} label="Attempted" value={attemptedCount} color="amber" />
            <StatPill icon={Zap} label="Remaining" value={Math.max(0, displayTotal - solvedCount)} color="rose" />
          </div>

          {/* ── STATUS TABS (spring only) ─────────────────────── */}
          {source === "spring" && (
            <div className="mb-6">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/80 border border-border">
                {[
                  { val: "ALL", label: "All", icon: null, count: displayTotal },
                  { val: "SOLVED", label: "Solved", icon: CheckCircle2, count: solvedCount, dotColor: "bg-emerald-400" },
                  { val: "ATTEMPTED", label: "Attempted", icon: CircleDot, count: attemptedCount, dotColor: "bg-amber-400" },
                  { val: "NOT_STARTED", label: "Todo", icon: Circle, count: Math.max(0, displayTotal - solvedCount - attemptedCount), dotColor: "bg-zinc-500" },
                ].map((tab) => {
                  const isActive = (tab.val === "ALL" && !statusFilter) || statusFilter === tab.val;
                  return (
                    <button
                      key={tab.val}
                      onClick={() => { setStatusFilter(tab.val === "ALL" ? "" : tab.val); }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-background text-foreground shadow-sm shadow-black/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      {tab.dotColor && <span className={`h-1.5 w-1.5 rounded-full ${tab.dotColor}`} />}
                      {tab.label}
                      <span className={`text-[10px] tabular-nums ${isActive ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SEARCH + FILTERS BAR ─────────────────────────── */}
          <div className="relative z-20 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 sm:p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  type="text"
                  placeholder="Search by name, topic, or tag…"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10 pr-9 h-10 text-sm bg-background border-border rounded-xl focus:ring-2 focus:ring-[#5542FF]/20 focus:border-[#5542FF]/40 transition-all"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="hidden sm:block w-px h-8 bg-border" />

              {/* Filters */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  <Filter className="h-3 w-3" />
                  <span className="hidden sm:inline">Filters</span>
                </div>

                {source === "spring" ? (
                  <>
                    <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v === "__all__" ? "" : v); }}>
                      <SelectTrigger className="w-28 h-9 text-xs rounded-xl border-border bg-background/80 hover:bg-background transition-colors">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All levels</SelectItem>
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>

                    {showStage && stages.length > 0 && (
                      <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v === "__all__" ? "" : v); }}>
                        <SelectTrigger className="w-40 h-9 text-xs rounded-xl border-border bg-background/80 hover:bg-background transition-colors">
                          <SelectValue placeholder="All stages" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                          <SelectItem value="__all__">All stages</SelectItem>
                          {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}

                  </>
                ) : (
                  /* Judge: premium difficulty pills */
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/60 border border-border">
                    {["All", "Easy", "Medium", "Hard"].map(d => {
                      const isActive = judgeDiffFilter === d;
                      const pillColors = {
                        All: "",
                        Easy: isActive ? "text-emerald-400" : "",
                        Medium: isActive ? "text-amber-400" : "",
                        Hard: isActive ? "text-rose-400" : "",
                      };
                      return (
                        <button
                          key={d}
                          onClick={() => setJudgeDiffFilter(d)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                            isActive
                              ? `bg-background shadow-sm ${pillColors[d] || "text-foreground"}`
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                )}

                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAll}
                    className="h-9 px-3 text-[11px] text-muted-foreground hover:text-foreground gap-1.5 rounded-xl">
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── ERROR ─────────────────────────────────────────── */}
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-5 py-4 text-sm text-rose-400 flex items-center justify-between backdrop-blur-sm">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={source === "spring" ? loadSpring : loadJudge}
                className="text-xs text-rose-400 hover:text-rose-300 gap-1.5 rounded-xl">
                <RotateCcw className="h-3 w-3" /> Retry
              </Button>
            </div>
          )}

          {/* ── TABLE CONTAINER ──────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">

            {/* Header row */}
            <div className="flex items-center bg-secondary/30 border-b border-border px-4 py-3">
              {/* Status */}
              <div className="w-9 shrink-0 text-center">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">St</span>
              </div>
              {/* # */}
              <div className="w-12 shrink-0 px-2">
                {source === "spring" ? (
                  <SortHeader label="#" field="pid" current={sort} onSort={(s) => { setSort(s); }} />
                ) : (
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">#</span>
                )}
              </div>
              {/* Title */}
              <div className="flex-1 min-w-0">
                {source === "spring" ? (
                  <SortHeader label="Title" field="title" current={sort} onSort={(s) => { setSort(s); }} />
                ) : (
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">Title</span>
                )}
              </div>
              {/* Stage / Topic — hidden below lg */}
              {(showStage || source === "judge") && (
                <div className="hidden lg:block w-48 shrink-0">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">
                    {source === "judge" ? "Topic" : "Stage"}
                  </span>
                </div>
              )}
              {/* Difficulty */}
              <div className="w-28 shrink-0">
                {source === "spring" ? (
                  <SortHeader label="Difficulty" field="tag" current={sort} onSort={(s) => { setSort(s); }} />
                ) : (
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">Difficulty</span>
                )}
              </div>
              {/* LC — hidden below sm */}
              {showLeetCode && (
                <div className="hidden sm:block w-10 shrink-0 text-center">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">LC</span>
                </div>
              )}
            </div>

            {/* Body */}
            <div>
              {loading ? (
                /* Skeleton rows */
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center px-4 py-3.5 border-b border-border last:border-0">
                    <div className="w-9 shrink-0 flex justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-secondary shimmer-premium" />
                    </div>
                    <div className="w-12 shrink-0 px-2">
                      <div className="h-3 w-6 rounded-md bg-secondary shimmer-premium" style={{ animationDelay: `${i * 60}ms` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 rounded-md bg-secondary shimmer-premium" style={{ width: `${40 + (i * 17) % 40}%`, animationDelay: `${i * 60}ms` }} />
                    </div>
                    {(showStage || source === "judge") && (
                      <div className="hidden lg:block w-48 shrink-0">
                        <div className="h-5 w-28 rounded-lg bg-secondary shimmer-premium" style={{ animationDelay: `${i * 60}ms` }} />
                      </div>
                    )}
                    <div className="w-28 shrink-0">
                      <div className="h-5 w-14 rounded-full bg-secondary shimmer-premium" style={{ animationDelay: `${i * 60}ms` }} />
                    </div>
                    {showLeetCode && (
                      <div className="hidden sm:block w-10 shrink-0 flex justify-center">
                        <div className="h-3 w-3 rounded bg-secondary shimmer-premium" />
                      </div>
                    )}
                  </div>
                ))
              ) : displayList.length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="h-14 w-14 rounded-2xl bg-secondary/60 flex items-center justify-center">
                    <Search className="h-6 w-6 opacity-30" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground/60">
                      {hasFilters ? "No matching problems" : "No problems found"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {hasFilters ? "Try adjusting your filters or search terms" : "Check back later for new challenges"}
                    </p>
                  </div>
                  {hasFilters && (
                    <button onClick={clearAll}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-secondary/80 text-foreground hover:bg-secondary transition-colors">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : displayList.map((p, i) => {
                const diff = getDifficulty(p);
                const style = DIFF_STYLE[diff] || { bg: "bg-secondary text-muted-foreground border-transparent", label: diff };
                const status = getUserStatus(p);
                const idx = i + 1;
                const slug = getLcSlug(p);

                return (
                  <div
                    key={getId(p)}
                    onClick={() => handleRowClick(p)}
                    className="group flex items-center px-4 py-3.5 border-b border-border last:border-0 cursor-pointer hover:bg-[#5542FF]/[0.03] transition-all duration-200 relative"
                  >
                    {/* Accent bar on hover */}
                    <div className="absolute left-0 top-[20%] bottom-[20%] w-0.5 rounded-r-full bg-gradient-to-b from-[#5542FF] to-[#B28EF2] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Status dot */}
                    <div className="w-9 shrink-0 flex justify-center">
                      <StatusDot status={status} />
                    </div>

                    {/* # */}
                    <div className="w-12 shrink-0 px-2">
                      <span className="font-mono text-xs text-muted-foreground/50 tabular-nums group-hover:text-muted-foreground transition-colors">
                        {idx}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0 pr-4">
                      <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-200 truncate block">
                        {getTitle(p)}
                      </span>
                    </div>

                    {/* Stage / Topic */}
                    {(showStage || source === "judge") && (
                      <div className="hidden lg:block w-48 shrink-0 pr-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium bg-secondary/60 text-muted-foreground max-w-full truncate">
                          {source === "judge" ? getCategory(p) : (getStages(p)[0] || "—")}
                        </span>
                      </div>
                    )}

                    {/* Difficulty */}
                    <div className="w-28 shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${style.bg}`}>
                        {style.label}
                      </span>
                    </div>

                    {/* LC link */}
                    {showLeetCode && (
                      <div className="hidden sm:flex w-10 shrink-0 justify-center" onClick={(e) => e.stopPropagation()}>
                        {slug ? (
                          <a
                            href={`${LC_BASE}/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/20 text-sm">-</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── INFINITE SCROLL SENTINEL (spring) ────────────── */}
          {source === "spring" && (
            <div ref={sentinelRef} className="mt-2 flex flex-col items-center py-6 gap-2">
              {loadingMore && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-[#5542FF]" />
                  <span className="text-xs text-muted-foreground">Loading more…</span>
                </>
              )}
              {!loadingMore && !hasMore && !loading && displayList.length > 0 && (
                <div className="flex flex-col items-center gap-1">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <span className="text-xs text-muted-foreground/50">
                    All {totalElements} problems loaded
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Count footer (judge) ─────────────────────────── */}
          {source === "judge" && !loading && !error && (
            <div className="mt-5 text-center">
              <span className="text-xs text-muted-foreground/60">
                Showing <span className="font-medium text-muted-foreground">{displayList.length}</span> problem{displayList.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </main>
      </div>

      {/* ── DETAIL DIALOG (spring only) ─────────────────────── */}
      {fetchDetail && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-border">
            {detailLoading ? (
              <div className="flex items-center justify-center h-52 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#5542FF]" />
                  <span className="text-sm text-muted-foreground">Loading problem…</span>
                </div>
              </div>
            ) : selected ? (
              <div className="text-foreground">
                {/* Gradient header */}
                <div className="relative border-b border-border px-6 pt-6 pb-5 bg-gradient-to-br from-[#5542FF]/[0.06] to-transparent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#B28EF2]/[0.04] rounded-full blur-[60px] pointer-events-none" />
                  <p className="text-[10px] text-muted-foreground mb-2 font-mono tracking-widest uppercase font-semibold">
                    Problem #{selected.pid ?? selected.id}
                  </p>
                  <h2 className="text-lg font-bold leading-snug">{selected.title}</h2>
                </div>
                {/* body */}
                <div className="px-6 py-6 space-y-4">
                  <DetailRow label="Difficulty">
                    {(() => {
                      const s = DIFF_STYLE[selected.tag || selected.difficulty] || {};
                      return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.bg || "bg-secondary text-muted-foreground"}`}>
                          {s.label || selected.tag || selected.difficulty}
                        </span>
                      );
                    })()}
                  </DetailRow>
                  {selected.userStatus && (
                    <DetailRow label="Status">
                      <div className="flex items-center gap-2">
                        <StatusDot status={selected.userStatus} />
                        <span className="text-sm font-medium">{STATUS_CFG[selected.userStatus]?.label || selected.userStatus}</span>
                      </div>
                    </DetailRow>
                  )}
                  {selected.stages?.length > 0 && (
                    <DetailRow label="Stages">
                      <div className="flex flex-wrap gap-1.5">
                        {selected.stages.map(t => (
                          <Badge key={t} variant="secondary" className="text-[10px] rounded-lg px-2.5 py-0.5 font-medium">{t}</Badge>
                        ))}
                      </div>
                    </DetailRow>
                  )}
                  {selected.hasVisualizer !== undefined && (
                    <DetailRow label="Visualizer">
                      <span className={`text-sm font-medium ${selected.hasVisualizer ? "text-emerald-400" : "text-muted-foreground/40"}`}>
                        {selected.hasVisualizer ? "✦ Available" : "—"}
                      </span>
                    </DetailRow>
                  )}
                  {selected.description && (
                    <DetailRow label="Description">
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                    </DetailRow>
                  )}
                  {(getLcSlug(selected)) && (
                    <DetailRow label="LeetCode">
                      <a
                        href={`${LC_BASE}/${getLcSlug(selected)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium bg-secondary/80 text-foreground hover:bg-secondary transition-all border border-border"
                      >
                        {getLcSlug(selected)}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    </DetailRow>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">
                Problem not found.
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ── Small helpers ────────────────────────────────────────────────── */

function DetailRow({ label, children }) {
  return (
    <div className="flex gap-4">
      <span className="w-24 shrink-0 text-[10px] text-muted-foreground/70 pt-1 uppercase tracking-widest font-semibold">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ── Stat pill for header ─────────────────────────────────────────── */

const STAT_COLORS = {
  purple: { icon: "text-[#5542FF]", bg: "bg-[#5542FF]/[0.08] border-[#5542FF]/[0.12]", glow: "shadow-[#5542FF]/5" },
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/[0.08] border-emerald-500/[0.12]", glow: "shadow-emerald-500/5" },
  amber: { icon: "text-amber-400", bg: "bg-amber-500/[0.08] border-amber-500/[0.12]", glow: "shadow-amber-500/5" },
  rose: { icon: "text-rose-400", bg: "bg-rose-500/[0.08] border-rose-500/[0.12]", glow: "shadow-rose-500/5" },
};

function StatPill({ icon: Icon, label, value, color }) {
  const c = STAT_COLORS[color] || STAT_COLORS.purple;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${c.bg} shadow-sm ${c.glow} transition-all duration-200 hover:scale-[1.02]`}>
      <div className={`flex items-center justify-center h-8 w-8 rounded-xl ${c.bg}`}>
        <Icon className={`h-4 w-4 ${c.icon}`} strokeWidth={2} />
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums text-foreground leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}
