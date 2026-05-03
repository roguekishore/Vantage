/**
 * ProblemsTable — Vantage aesthetic overhaul.
 * Dark #09090b base · Monument Extended titles · EDFF66 accents
 * GSAP scroll animations · custom row interactions · full parity with original API
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowUp, ArrowDown, ArrowUpDown, Search,
  ExternalLink, X, Loader2, Filter, RotateCcw,
  Check, BookOpen, ChevronRight, Zap,
} from "lucide-react";
import { SiLeetcode } from "react-icons/si";
import { Dialog, DialogContent } from "../ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";
import { fetchProgressStats } from "../../services/problemApi";
import { ALGO_CONFIGS, AlgoCanvas, MergeSortCanvas } from "@/components/animations/HomePageAnimations";
import CustomCursor from "@/components/common/CustomCursor";
import { MONUMENT_TYPO as T } from "@/components/common/MonumentTypography";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const LC_BASE = "https://leetcode.com/problems";

const DIFF = {
  BASIC: { color: "#888", dot: "rgba(136,136,136,0.8)", label: "Basic" },
  EASY: { color: "#34d399", dot: "rgba(52,211,153,0.85)", label: "Easy" },
  MEDIUM: { color: "#fbbf24", dot: "rgba(251,191,36,0.85)", label: "Medium" },
  HARD: { color: "#f87171", dot: "rgba(248,113,113,0.85)", label: "Hard" },
  Easy: { color: "#34d399", dot: "rgba(52,211,153,0.85)", label: "Easy" },
  Medium: { color: "#fbbf24", dot: "rgba(251,191,36,0.85)", label: "Medium" },
  Hard: { color: "#f87171", dot: "rgba(248,113,113,0.85)", label: "Hard" },
};

const STATUS_CFG = {
  SOLVED: { label: "Solved" },
  ATTEMPTED: { label: "Attempted" },
  NOT_STARTED: { label: "Todo" },
};

/* ─────────────────────────────────────────────────────────
   BACKGROUND CANVAS
───────────────────────────────────────────────────────── */
function BgCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      vx: (Math.random() - .5) * .14, vy: (Math.random() - .5) * .14,
      r: .5 + Math.random() * 1.2, op: .04 + Math.random() * .08,
      ph: Math.random() * Math.PI * 2,
    }));
    let t = 0, id;
    const tick = () => {
      t += .007;
      ctx.clearRect(0, 0, W(), H());
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W(); if (p.x > W()) p.x = 0;
        if (p.y < 0) p.y = H(); if (p.y > H()) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.op * (.7 + .3 * Math.sin(t + p.ph))})`;
        ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 100) * .025})`;
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <canvas ref={ref} style={{
      position: "fixed", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 0, opacity: .45,
    }} />
  );
}

/* ─────────────────────────────────────────────────────────
   STATUS DOT
───────────────────────────────────────────────────────── */
function StatusDot({ status }) {
  if (status === "SOLVED") return (
    <div style={{
      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
      background: "rgba(52,211,153,0.12)",
      border: "1px solid rgba(52,211,153,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Check size={11} color="#34d399" strokeWidth={2.8} />
    </div>
  );
  if (status === "ATTEMPTED") return (
    <div style={{
      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
      border: "1.5px solid rgba(251,191,36,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(251,191,36,0.7)" }} />
    </div>
  );
  return <div style={{ width: 20, height: 20, flexShrink: 0 }} />;
}

/* ─────────────────────────────────────────────────────────
   SORT HEADER
───────────────────────────────────────────────────────── */
function SortHeader({ label, field, current, onSort }) {
  const [f, d] = (current || "").split(",");
  const active = f === field;
  const Icon = active ? (d === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      onClick={() => onSort(active && d === "asc" ? `${field},desc` : `${field},asc`)}
      data-cursor={label.toUpperCase()}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 9, fontWeight: 900, letterSpacing: ".2em",
        textTransform: "uppercase",
        color: active ? "#EDFF66" : "rgba(255,255,255,0.28)",
        background: "none", border: "none", cursor: "none",
        transition: "color .15s",
        padding: 0,
      }}
    >
      {label}
      <Icon size={10} style={{ opacity: active ? 1 : .4 }} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   COLUMN HEADER LABEL (non-sortable)
───────────────────────────────────────────────────────── */
function ColLabel({ children }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 900, letterSpacing: ".2em",
      textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
    }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT CHIP
───────────────────────────────────────────────────────── */
function StatChip({ label, value, color }) {
  return (
    <div style={{ padding: "12px 20px" }}>
      <div style={{
        fontFamily: T.fontFamily, fontSize: 22, fontWeight: 900,
        color: color || "#fff", lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: ".2em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: 4,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────────────────── */
function SkeletonRow({ i }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "14px 22px", gap: 0,
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      animation: "vantage-pulse 1.6s ease-in-out infinite",
      animationDelay: `${i * 0.07}s`,
    }}>
      <div style={{ width: 36, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
      </div>
      <div style={{ width: 52, flexShrink: 0, padding: "0 10px" }}>
        <div style={{ height: 10, width: 28, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
      </div>
      <div style={{ flex: 1, paddingRight: 20 }}>
        <div style={{ height: 11, width: `${35 + (i * 17) % 44}%`, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div style={{ width: 140, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ height: 22, width: 80, borderRadius: 8, background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div style={{ width: 96, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ height: 10, width: 50, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
      </div>
      <div style={{ width: 40, flexShrink: 0 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DETAIL ROW (inside dialog)
───────────────────────────────────────────────────────── */
function DetailRow({ label, children }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <span style={{
        width: 90, flexShrink: 0, fontSize: 9, fontWeight: 900,
        letterSpacing: ".2em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.22)", paddingTop: 2,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PROBLEM ROW
───────────────────────────────────────────────────────── */
function ProblemRow({ problem, index, showStage, showLeetCode, source, onClick, getUserStatus, getDifficulty, getTitle, getId, getLcSlug, getCategory, getStages }) {
  const [hov, setHov] = useState(false);
  const diff = getDifficulty(problem);
  const dStyle = DIFF[diff] || { color: "rgba(255,255,255,0.3)", dot: "rgba(255,255,255,0.2)", label: diff };
  const status = getUserStatus(problem);
  const slug = getLcSlug(problem);

  return (
    <div
      className="prob-row"
      onClick={() => onClick(problem)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      data-cursor="OPEN"
      style={{
        display: "flex", alignItems: "center",
        padding: "0 22px",
        height: 52,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: hov ? "rgba(255,255,255,0.025)" : "transparent",
        cursor: "none",
        transition: "background 0.14s",
        position: "relative",
      }}
    >
      {/* Left accent line on hover */}
      <div style={{
        position: "absolute", left: 0, top: 8, bottom: 8,
        width: 2, borderRadius: 2,
        background: dStyle.color,
        opacity: hov ? 0.7 : 0,
        transition: "opacity 0.14s",
      }} />

      {/* Status */}
      <div style={{ width: 36, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <StatusDot status={status} />
      </div>

      {/* # */}
      <div style={{ width: 52, flexShrink: 0, padding: "0 10px" }}>
        <span style={{
          fontFamily: "monospace", fontSize: 11,
          color: "rgba(255,255,255,0.22)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {index + 1}
        </span>
      </div>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: hov ? "#fff" : "rgba(255,255,255,0.62)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          display: "block",
          transition: "color 0.14s",
        }}>
          {getTitle(problem)}
        </span>
      </div>

      {/* Stage / Topic */}
      {(showStage || source === "judge") && (
        <div style={{ width: 160, flexShrink: 0, display: "flex", justifyContent: "center" }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: "rgba(255,255,255,0.25)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: "100%",
          }}>
            {source === "judge" ? getCategory(problem) : (getStages(problem)[0] || "—")}
          </span>
        </div>
      )}

      {/* Difficulty */}
      <div style={{ width: 96, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
          background: dStyle.dot,
        }} />
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: dStyle.color,
        }}>
          {dStyle.label}
        </span>
      </div>

      {/* LC */}
      {showLeetCode && (
        <div
          style={{ width: 40, flexShrink: 0, display: "flex", justifyContent: "center" }}
          onClick={e => e.stopPropagation()}
        >
          {slug ? (
            <a
              href={`${LC_BASE}/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="LC"
              style={{
                width: 28, height: 28, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.22)",
                border: "1px solid rgba(255,255,255,0.07)",
                transition: "all .15s",
                cursor: "none",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "#FFA116";
                e.currentTarget.style.borderColor = "rgba(255,161,22,0.3)";
                e.currentTarget.style.background = "rgba(255,161,22,0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "rgba(255,255,255,0.22)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <SiLeetcode size={13} />
            </a>
          ) : null}
        </div>
      )}

      {/* Chevron */}
      <ChevronRight
        size={13}
        style={{
          color: "rgba(255,255,255,0.18)",
          opacity: hov ? 1 : 0,
          transition: "opacity 0.14s",
          flexShrink: 0,
          marginLeft: 4,
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FILTER PILL BUTTON
───────────────────────────────────────────────────────── */
function FilterPill({ children, active, onClick, color }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      data-cursor="FILTER"
      style={{
        height: 32, padding: "0 14px", borderRadius: 8, cursor: "none",
        flexShrink: 0,
        border: active
          ? `1px solid ${color || "rgba(237,255,102,0.35)"}`
          : "1px solid rgba(255,255,255,0.07)",
        background: active
          ? (color ? `${color}14` : "rgba(237,255,102,0.07)")
          : (hov ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)"),
        color: active
          ? (color || "#EDFF66")
          : (hov ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.32)"),
        fontSize: 11, fontWeight: 800, letterSpacing: ".04em",
        transition: "all .15s", whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
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
  icon: HeaderIcon = BookOpen,
  onRowClick,
  showLeetCode = true,
  showStage = source === "spring",
}) {
  const pageRef = useRef(null);

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

  /* ── GSAP entrance ── */
  useGSAP(() => {
    gsap.fromTo(".pt-eyebrow",
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55, ease: "expo.out", delay: 0.05 }
    );
    gsap.fromTo(".pt-title",
      { opacity: 0, y: 36, skewY: 1 },
      { opacity: 1, y: 0, skewY: 0, duration: 0.8, ease: "expo.out", delay: 0.14 }
    );
    gsap.fromTo(".pt-sub",
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, ease: "expo.out", delay: 0.28 }
    );
    gsap.fromTo(".pt-stats",
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", delay: 0.38 }
    );
    gsap.fromTo(".pt-filterbar",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, ease: "expo.out", delay: 0.48 }
    );
    gsap.fromTo(".pt-table-wrap",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", delay: 0.58 }
    );
  }, { scope: pageRef });

  /* ── Animate rows when loaded ── */
  useGSAP(() => {
    if (loading) return;
    gsap.fromTo(".prob-row",
      { opacity: 0, x: -12 },
      {
        opacity: 1, x: 0,
        duration: 0.4, ease: "expo.out",
        stagger: 0.025,
        scrollTrigger: { trigger: ".pt-table-wrap", start: "top 90%" },
      }
    );
  }, { scope: pageRef, dependencies: [loading] });

  /* ── Difficulty quick-filter pills ── */
  const diffPills = source === "spring"
    ? [
      { label: "All", value: "" },
      { label: "Easy", value: "EASY", color: "#34d399" },
      { label: "Medium", value: "MEDIUM", color: "#fbbf24" },
      { label: "Hard", value: "HARD", color: "#f87171" },
    ]
    : [
      { label: "All", value: "All" },
      { label: "Easy", value: "Easy", color: "#34d399" },
      { label: "Medium", value: "Medium", color: "#fbbf24" },
      { label: "Hard", value: "Hard", color: "#f87171" },
    ];

  const statusPills = [
    { label: "All", value: "" },
    { label: "Solved", value: "SOLVED", color: "#34d399" },
    { label: "Attempted", value: "ATTEMPTED", color: "#fbbf24" },
    { label: "Todo", value: "NOT_STARTED", color: "rgba(255,255,255,0.4)" },
  ];

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: "100vh",
        background: "#09090b",
        position: "relative",
        overflowX: "hidden",
        paddingTop: 56,
        paddingBottom: 80,
        cursor: "none",
      }}
    >
      <CustomCursor />
      {/* <BgCanvas /> */}

      {/* Masked algorithm animation background
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.1,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 80%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 80%, transparent 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gridTemplateRows: "repeat(3, minmax(0, 1fr))",
            border: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(255,255,255,0.005)",
          }}
        >
          {[
            "bfs",
            "dfs",
            "dijkstra",
            "floydwarshall",
            "inorder",
            "slidingwindow",
            "bsearch",
            "mergesort",
            "twopointers",
            "kadane",
            "kruskal",
            "heapsort",
          ].map((key, i, arr) => (
            <div
              key={key}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRight: (i % 4) < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
                borderBottom: i < arr.length - 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: "rgba(255,255,255,0.006)",
              }}
            >
              <div style={{ position: "absolute", inset: 0 }}>
                {key === "mergesort"
                  ? <MergeSortCanvas />
                  : <AlgoCanvas algo={ALGO_CONFIGS[key]} />}
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* Atmosphere */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: .018,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "256px",
      }} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: .013,
        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
        backgroundSize: "52px 52px",
      }} />
      <div style={{
        position: "fixed", top: "-20%", right: "-12%",
        width: 600, height: 600, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(237,255,102,0.04) 0%, transparent 65%)",
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-10%",
        width: 500, height: 500, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 65%)",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "40px clamp(20px,5vw,52px) 0" }}>

        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <div style={{ position: "relative", overflow: "hidden" }}>

          {/* Watermark */}
          {/* <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
            fontFamily: T.fontFamily, fontWeight: 900,
            fontSize: "clamp(5rem,15vw,12rem)", letterSpacing: "-.03em",
            color: "rgba(255,255,255,0.022)", lineHeight: .85,
            textTransform: "uppercase", pointerEvents: "none", userSelect: "none",
          }}>
            GRIND
          </div> */}

          <div className="pt-hero-grid" style={{
            display: "grid", gridTemplateColumns: "1fr auto",
            gap: 30, alignItems: "end",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: 28, marginBottom: 28,
            position: "relative",
          }}>
            <div>
              <p className="pt-eyebrow" style={{
                fontSize: 9, fontWeight: 900, letterSpacing: ".28em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                marginBottom: 14,
              }}>
                - Practice Arena
              </p>

              <h1 className="pt-title" style={{
                fontFamily: T.fontFamily,
                fontSize: "clamp(2.8rem,5vw,4.8rem)",
                fontWeight: 900, letterSpacing: "-0.02em",
                lineHeight: 0.9, color: "#fff",
                marginBottom: 14,
              }}>
                <span style={{ color: "#fff", display: "block" }}>{title}</span>
                <span style={{ color: "#EDFF66", display: "block" }}>Arena.</span>
              </h1>
              <p className="pt-sub" style={{
                fontSize: 14, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, maxWidth: 420,
              }}>
                {subtitle || `${displayTotal} challenges. Every problem solved is a step closer to #1.`}
              </p>
            </div>

            {/* Progress block */}
            <div className="pt-stats pt-hero-stats" style={{
              flexShrink: 0, minWidth: 250,
              background: "#0d0d10", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{ height: 2, background: "linear-gradient(90deg,#EDFF66,rgba(237,255,102,0.2))" }} />

              <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: ".22em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 6,
                }}>
                  Completion
                </div>
                <div style={{
                  fontFamily: T.fontFamily, letterSpacing: "-0.015em", fontSize: 30, fontWeight: 900,
                  color: "#EDFF66", lineHeight: 1, textShadow: "0 0 24px rgba(237,255,102,0.28)",
                }}>
                  {completionPct}%
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                {[
                  { label: "Solved", value: solvedCount, color: "#34d399" },
                  { label: "Attempt", value: attemptedCount, color: "#fbbf24" },
                  { label: "Total", value: displayTotal, color: "#fff" },
                ].map((s, i) => (
                  <div key={s.label} style={{ padding: "12px 14px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div style={{
                      fontFamily: T.fontFamily, fontSize: 17, fontWeight: 900,
                      color: s.color, lineHeight: 1, marginBottom: 3,
                      textShadow: s.color === "#fff" ? "none" : `0 0 14px ${s.color}30`,
                    }}>{s.value}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                  <div style={{
                    height: "100%", width: `${completionPct}%`, borderRadius: 3,
                    background: "linear-gradient(90deg,#EDFF66,#34d399)",
                    transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          {/* <div className="pt-stats" style={{
            display: "flex", alignItems: "stretch", width: "fit-content",
            borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}>
            {[
              { label: "Total",     value: displayTotal,   color: "rgba(255,255,255,0.85)" },
              { label: "Solved",    value: solvedCount,    color: "#34d399" },
              { label: "Attempted", value: attemptedCount, color: "#fbbf24" },
              { label: "Remaining", value: displayTotal - solvedCount - attemptedCount, color: "rgba(255,255,255,0.3)" },
            ].map(({ label, value, color }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ width: 1, background: "rgba(255,255,255,0.05)", alignSelf: "stretch" }} />}
                <StatChip label={label} value={value} color={color} />
              </React.Fragment>
            ))}
          </div> */}
        </div>

        {/* ══ FILTER BAR ════════════════════════════════════════════ */}
        <div className="pt-filterbar" style={{
          background: "#0d0d10",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "16px 20px",
          marginBottom: 16,
          display: "flex", flexDirection: "column", gap: 14,
          position: "relative",
          zIndex: 20, // Increased z-index to stay above table
          // Removed overflowX: "auto" from here
        }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
              color: "rgba(255,255,255,0.2)",
            }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search problems, topics, tags…"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              style={{
                width: "100%", height: 40, borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                paddingLeft: 36, paddingRight: 36,
                fontSize: 13, color: "#fff", outline: "none",
                transition: "border-color .15s",
                cursor: "none",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(237,255,102,0.3)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword("")}
                data-cursor="CLEAR"
                style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)", cursor: "none",
                  background: "none", border: "none",
                  color: "rgba(255,255,255,0.28)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 2,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Pill rows - This container now handles horizontal scrolling for pills only */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflowX: "auto", // Moved scroll here
              paddingBottom: 4, // Small buffer for scrollbar height
              flex: 1,
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}>
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: ".2em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                display: "flex", alignItems: "center", gap: 6,
                flexShrink: 0,
                marginRight: 4,
              }}>
                <Filter size={10} /> Difficulty
              </span>
              {diffPills.map(pill => (
                <FilterPill
                  key={pill.value}
                  active={source === "spring" ? tagFilter === pill.value : judgeDiffFilter === pill.value}
                  onClick={() => source === "spring" ? setTagFilter(pill.value) : setJudgeDiffFilter(pill.value)}
                  color={pill.color}
                >
                  {pill.label}
                </FilterPill>
              ))}

              {source === "spring" && (
                <>
                  <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 4px", flexShrink: 0 }} />
                  <span style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: ".2em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                    display: "flex", alignItems: "center", gap: 6, marginRight: 4,
                    flexShrink: 0,
                  }}>
                    <Zap size={10} /> Status
                  </span>
                  {statusPills.map(pill => (
                    <FilterPill
                      key={pill.value}
                      active={statusFilter === pill.value}
                      onClick={() => setStatusFilter(pill.value)}
                      color={pill.color}
                    >
                      {pill.label}
                    </FilterPill>
                  ))}
                </>
              )}
            </div>

            {/* Stage select - Kept outside the scroll container to prevent clipping */}
            {showStage && stages.length > 0 && (
              <>
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 4px", flexShrink: 0 }} />
                <div style={{ position: "relative", zIndex: 50 }}>
                  <Select value={stageFilter || "__all__"} onValueChange={v => setStageFilter(v === "__all__" ? "" : v)}>
                    <SelectTrigger style={{
                      height: 32, width: 160, borderRadius: 8, cursor: "none",
                      flexShrink: 0,
                      background: stageFilter ? "rgba(237,255,102,0.07)" : "rgba(255,255,255,0.02)",
                      border: stageFilter ? "1px solid rgba(237,255,102,0.3)" : "1px solid rgba(255,255,255,0.07)",
                      color: stageFilter ? "#EDFF66" : "rgba(255,255,255,0.35)",
                      fontSize: 11, fontWeight: 800,
                    }}>
                      <SelectValue placeholder="All stages" />
                    </SelectTrigger>
                    {/* Added Portal or high z-index handling */}
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      style={{
                        background: "#0d0d10",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 10,
                        zIndex: 100,
                        // Fix: Constrain the height and allow internal scrolling
                        maxHeight: "240px",
                        width: "var(--radix-select-trigger-width)", // Keeps dropdown same width as button
                        overflowY: "auto",
                      }}
                    >
                      <SelectItem value="__all__">All stages</SelectItem>
                      {stages.map(s => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Reset */}
            {hasFilters && (
              <>
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 4px", flexShrink: 0 }} />
                <button
                  onClick={clearAll}
                  data-cursor="RESET"
                  style={{
                    height: 32, padding: "0 12px", borderRadius: 8, cursor: "none",
                    border: "1px solid rgba(248,113,113,0.25)",
                    background: "rgba(248,113,113,0.06)",
                    color: "#f87171", fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all .15s",
                    flexShrink: 0
                  }}
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* ══ ERROR ════════════════════════════════════════════════ */}
        {error && (
          <div style={{
            borderRadius: 12, padding: "12px 18px", marginBottom: 12,
            background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <span style={{ fontSize: 13, color: "#f87171", overflow: "hidden", textOverflow: "ellipsis" }}>{error}</span>
            <button
              onClick={retryLoad}
              data-cursor="RETRY"
              style={{
                height: 30, padding: "0 12px", borderRadius: 8, cursor: "none",
                border: "1px solid rgba(248,113,113,0.3)", background: "transparent",
                color: "#f87171", fontSize: 11, fontWeight: 800,
                display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
              }}
            >
              <RotateCcw size={10} /> Retry
            </button>
          </div>
        )}

        {/* ══ TABLE ════════════════════════════════════════════════ */}
        <div className="pt-table-wrap" style={{
          background: "#0d0d10",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18, overflow: "hidden",
        }}>

          {/* Top accent */}
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(237,255,102,0.25),transparent)" }} />

          {/* Table head */}
          <div style={{
            display: "flex", alignItems: "center",
            padding: "11px 22px",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ width: 36, flexShrink: 0 }} />
            <div style={{ width: 52, flexShrink: 0, padding: "0 10px" }}>
              {source === "spring"
                ? <SortHeader label="#" field="pid" current={sort} onSort={setSort} />
                : <ColLabel>#</ColLabel>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {source === "spring"
                ? <SortHeader label="Title" field="title" current={sort} onSort={setSort} />
                : <ColLabel>Title</ColLabel>}
            </div>
            {(showStage || source === "judge") && (
              <div style={{ width: 160, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                <ColLabel>{source === "judge" ? "Topic" : "Stage"}</ColLabel>
              </div>
            )}
            <div style={{ width: 96, flexShrink: 0, display: "flex", justifyContent: "center" }}>
              {source === "spring"
                ? <SortHeader label="Difficulty" field="tag" current={sort} onSort={setSort} />
                : <ColLabel>Difficulty</ColLabel>}
            </div>
            {showLeetCode && (
              <div style={{ width: 40, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                <ColLabel>LC</ColLabel>
              </div>
            )}
            <div style={{ width: 20, flexShrink: 0 }} />
          </div>

          {/* Rows */}
          {loading ? (
            <div>
              {Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} i={i} />)}
            </div>
          ) : displayList.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "64px 24px", gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Search size={18} style={{ color: "rgba(255,255,255,0.14)" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{
                  fontFamily: T.fontFamily, fontSize: 14, fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: ".06em",
                  color: "rgba(255,255,255,0.18)", marginBottom: 6,
                }}>
                  {hasFilters ? "No matches" : "No problems"}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
                  {hasFilters ? "Try adjusting your filters above." : "Check back later."}
                </p>
              </div>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  data-cursor="RESET"
                  style={{
                    height: 32, padding: "0 16px", borderRadius: 8, cursor: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 800,
                    transition: "all .15s",
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            displayList.map((p, i) => (
              <ProblemRow
                key={getId(p)}
                problem={p}
                index={i}
                showStage={showStage}
                showLeetCode={showLeetCode}
                source={source}
                onClick={handleRowClick}
                getUserStatus={getUserStatus}
                getDifficulty={getDifficulty}
                getTitle={getTitle}
                getId={getId}
                getLcSlug={getLcSlug}
                getCategory={getCategory}
                getStages={getStages}
              />
            ))
          )}

          {/* Bottom status bar */}
          {!loading && displayList.length > 0 && (
            <div style={{
              padding: "10px 22px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.18)", fontVariantNumeric: "tabular-nums" }}>
                {displayList.length} of {displayTotal} problems
              </span>
              {hasMore && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "rgba(237,255,102,0.5)",
                  letterSpacing: ".1em", textTransform: "uppercase",
                }}>
                  Scroll for more ↓
                </span>
              )}
            </div>
          )}
        </div>

        {/* ══ INFINITE SCROLL SENTINEL ════════════════════════════ */}
        {source === "spring" && (
          <div ref={sentinelRef} style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", padding: "28px 0", gap: 8,
          }}>
            {loadingMore && (
              <>
                <Loader2 size={16} style={{ color: "rgba(255,255,255,0.25)", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  Loading more…
                </span>
              </>
            )}
            {!loadingMore && !hasMore && !loading && displayList.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 900, letterSpacing: ".2em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.14)",
              }}>
                All {totalElements} problems loaded
              </span>
            )}
          </div>
        )}

        {source === "judge" && !loading && !error && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.14)" }}>
              {displayList.length} problem{displayList.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

      </div>

      {/* ══ DETAIL DIALOG ════════════════════════════════════════ */}
      {fetchDetail && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent style={{
            maxWidth: 480, padding: 0, gap: 0, overflow: "hidden",
            borderRadius: 20,
            background: "#0d0d10",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
          }}>
            {/* Top accent */}
            <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(237,255,102,0.4),transparent)" }} />

            {detailLoading ? (
              <div style={{
                height: 220, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Loader2 size={20} style={{ color: "rgba(255,255,255,0.2)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : selected ? (
              <div style={{ color: "#fff" }}>
                {/* Header */}
                <div style={{
                  padding: "22px 24px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: ".22em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 8,
                  }}>
                    Problem #{selected.pid ?? selected.id}
                  </div>
                  <div style={{
                    fontFamily: T.fontFamily, fontSize: 20, fontWeight: 900,
                    letterSpacing: "-.01em", lineHeight: 1.15, color: "#fff",
                  }}>
                    {selected.title}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, background: "rgba(0,0,0,0.25)" }}>
                  <DetailRow label="Difficulty">
                    {(() => {
                      const s = DIFF[selected.tag || selected.difficulty] || {};
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot || "rgba(255,255,255,0.3)" }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: s.color || "rgba(255,255,255,0.5)" }}>
                            {s.label || selected.tag || selected.difficulty}
                          </span>
                        </div>
                      );
                    })()}
                  </DetailRow>

                  {selected.userStatus && (
                    <DetailRow label="Status">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusDot status={selected.userStatus} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
                          {STATUS_CFG[selected.userStatus]?.label || selected.userStatus}
                        </span>
                      </div>
                    </DetailRow>
                  )}

                  {selected.stages?.length > 0 && (
                    <DetailRow label="Stages">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {selected.stages.map(t => (
                          <span key={t} style={{
                            padding: "3px 10px", borderRadius: 7,
                            border: "1px solid rgba(255,255,255,0.09)",
                            background: "rgba(255,255,255,0.04)",
                            fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)",
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </DetailRow>
                  )}

                  {selected.hasVisualizer !== undefined && (
                    <DetailRow label="Visualizer">
                      <span style={{ fontSize: 13, fontWeight: 600, color: selected.hasVisualizer ? "#34d399" : "rgba(255,255,255,0.2)" }}>
                        {selected.hasVisualizer ? "Available" : "—"}
                      </span>
                    </DetailRow>
                  )}

                  {selected.description && (
                    <DetailRow label="Description">
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.65 }}>
                        {selected.description}
                      </p>
                    </DetailRow>
                  )}

                  {getLcSlug(selected) && (
                    <DetailRow label="LeetCode">
                      <a
                        href={`${LC_BASE}/${getLcSlug(selected)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 7,
                          padding: "6px 14px", borderRadius: 9,
                          border: "1px solid rgba(255,161,22,0.25)",
                          background: "rgba(255,161,22,0.06)",
                          fontSize: 12, fontWeight: 700, color: "#FFA116",
                          textDecoration: "none", cursor: "none",
                          transition: "all .15s",
                        }}
                      >
                        {getLcSlug(selected)}
                        <ExternalLink size={11} />
                      </a>
                    </DetailRow>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                height: 200, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: "rgba(255,255,255,0.2)",
              }}>
                Problem not found.
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes vantage-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width: 720px) {
          div[style*="grid-template-columns: 1fr auto"] {
            grid-template-columns: 1fr !important;
          }
          .pt-hero-grid {
            gap: 16px !important;
          }
          .pt-hero-stats {
            min-width: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}