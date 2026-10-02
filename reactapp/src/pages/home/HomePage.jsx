import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ArrowUpRight, Download, Swords } from "lucide-react";
import { Avatar, Badge, Button, Panel, PageShell, Progress, Skeleton, Stat, buttonClasses } from "@/components/ds";
import { cn } from "@/lib/utils";
import { rgba } from "@/lib/canvasTheme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { topicConfig } from "@/routes/config";
import {
  ALGO_CONFIGS,
  AlgoCanvas,
  MergeSortCanvas,
  makeMotionGate,
  tok,
} from "../../components/animations/HomePageAnimations";
import { COMPLEX_ALGO_CONFIGS, ComplexAlgoCanvas } from "../../components/animations/ComplexAnimations";
import { MID_ANIMATONS_CONFIGS, MidAnimatonsAlgoCanvas } from "../../components/animations/MidAnimations";
import { observeElementResize } from "../../lib/observeResize";

/*
 * Home (POLISH_PLAN §6 row 1). Hero, visualizers, judge, battles, map,
 * extension, final CTA. The footer is mounted globally by the app shell.
 */

// 142 = the number of <VisualizerRoute> entries in src/routes/index.jsx
// (route JSX, not exported data; importing it would pull every visualizer
// into this chunk). Update it when a visualizer route is added or removed.
const VISUALIZER_COUNT = 142;
const TOPIC_COUNT = Object.keys(topicConfig).length;

const EXTENSION_ZIP_DEMO_URL = "https://github.com/roguekishore/Vantage/releases/download/v1.0/VantageCode.zip";

// The world map is ~150KB of paths: load it only when the preview mounts.
const WorldSvg = lazy(() => import("../../map/world.svg").then((m) => ({ default: m.ReactComponent })));

const eyebrowClass = "font-mono text-label text-accent-ink";
const h2Class = "font-display text-h2 uppercase text-fg";
const DISPLAY_STYLE = { fontSynthesis: "none" };

const canvasFont = (canvas, px) => {
  const family = (typeof window !== "undefined" && window.getComputedStyle(canvas).fontFamily) || "monospace";
  return `500 ${px}px ${family}`;
};

/* -------------------------------------------------------
   RACE CANVAS: bubble sort vs quick sort on the same input
------------------------------------------------------- */
function RaceCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const N = 44;

    const makeArr = () => Array.from({ length: N }, () => Math.floor(Math.random() * 88) + 12);

    const buildQuickSteps = (src) => {
      const a = [...src], steps = [];
      const qs = (lo, hi) => {
        if (lo >= hi) return;
        const piv = a[hi]; let i = lo - 1;
        for (let j = lo; j < hi; j++) {
          steps.push({ type: "cmp", a: j, b: hi });
          if (a[j] <= piv) { i++; steps.push({ type: "swap", a: i, b: j }); [a[i], a[j]] = [a[j], a[i]]; }
        }
        steps.push({ type: "swap", a: i + 1, b: hi }); [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
        const pi = i + 1; qs(lo, pi - 1); qs(pi + 1, hi);
      };
      qs(0, a.length - 1);
      return steps;
    };

    let state, animId;

    const init = () => {
      const orig = makeArr();
      state = {
        bubble: { arr: [...orig], i: 0, j: 0, comps: [], done: false, ops: 0 },
        quick: { arr: [...orig], steps: buildQuickSteps(orig), idx: 0, comps: [], done: false, ops: 0 },
        restartTimer: null,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const stopResizeObserver = observeElementResize(canvas, resize);

    let isInView = true;
    let isPageVisible = document.visibilityState !== "hidden";
    const io = new IntersectionObserver(
      ([entry]) => { isInView = !!entry?.isIntersecting; },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    const gate = makeMotionGate(canvas);
    const onVisibilityChange = () => { isPageVisible = document.visibilityState !== "hidden"; };
    document.addEventListener("visibilitychange", onVisibilityChange);

    init();

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const drawPanel = (arr, comps, x0, panelW, label, hotColor, ops) => {
      const bw = Math.max(1, (panelW - 32) / arr.length - 1);
      const maxH = H() * 0.72;
      arr.forEach((v, i) => {
        const bh = (v / 100) * maxH;
        const bx = x0 + 16 + i * (bw + 1);
        const by = H() - bh - 36;
        ctx.fillStyle = comps.includes(i) ? hotColor : rgba("fg", 0.14);
        ctx.fillRect(bx, by, bw, bh);
      });
      ctx.font = canvasFont(canvas, 10);
      ctx.fillStyle = rgba("fg", 0.6);
      ctx.textAlign = "left";
      ctx.fillText(label.toUpperCase(), x0 + 16, H() - 14);
      ctx.fillStyle = hotColor;
      ctx.textAlign = "right";
      ctx.fillText(`${ops} OPS`, x0 + panelW - 16, H() - 14);
      ctx.textAlign = "left";
    };

    const BSPEED = 2, QSPEED = 6;

    const step = () => {
      animId = requestAnimationFrame(step);
      if (!isInView || !isPageVisible || gate.hold()) return;
      if (W() === 0 || H() === 0) return;
      const { bubble: b, quick: q } = state;

      if (!b.done) {
        for (let k = 0; k < BSPEED; k++) {
          const n = b.arr.length;
          if (b.i >= n - 1) { b.done = true; b.comps = []; break; }
          b.comps = [b.j, b.j + 1];
          if (b.arr[b.j] > b.arr[b.j + 1]) { [b.arr[b.j], b.arr[b.j + 1]] = [b.arr[b.j + 1], b.arr[b.j]]; b.ops++; }
          b.j++;
          if (b.j >= n - 1 - b.i) { b.i++; b.j = 0; }
        }
      }

      if (!q.done) {
        for (let k = 0; k < QSPEED; k++) {
          if (q.idx >= q.steps.length) { q.done = true; q.comps = []; break; }
          const s = q.steps[q.idx++];
          q.comps = [s.a, s.b];
          if (s.type === "swap" && s.a !== s.b) { [q.arr[s.a], q.arr[s.b]] = [q.arr[s.b], q.arr[s.a]]; q.ops++; }
        }
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      const half = Math.floor(W() / 2);
      drawPanel(b.arr, b.comps, 0, half, "Bubble sort", rgba("fg", 0.9), b.ops);
      drawPanel(q.arr, q.comps, half, half, "Quick sort", tok("accent-ink"), q.ops);

      // divider + square VS tag
      ctx.fillStyle = rgba("fg", 0.1);
      ctx.fillRect(half, 0, 1, H());
      const cy = H() / 2;
      ctx.fillStyle = tok("surface");
      ctx.fillRect(half - 16, cy - 12, 32, 24);
      ctx.strokeStyle = rgba("fg", 0.22);
      ctx.lineWidth = 1;
      ctx.strokeRect(half - 15.5, cy - 11.5, 31, 23);
      ctx.fillStyle = rgba("fg", 0.66);
      ctx.font = canvasFont(canvas, 10);
      ctx.textAlign = "center";
      ctx.fillText("VS", half, cy + 4);
      ctx.textAlign = "left";

      if (b.done && q.done && !state.restartTimer) {
        state.restartTimer = setTimeout(() => { init(); }, 1400);
      }
    };
    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      if (state?.restartTimer) clearTimeout(state.restartTimer);
      stopResizeObserver();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Bubble sort and quick sort racing on the same random input"
      className="block h-full w-full"
      style={{ contain: "strict" }}
    />
  );
}

/* -------------------------------------------------------
   MATCH SEARCH RADAR: sweeps only while searching
------------------------------------------------------- */
function MatchSearchRadar({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, r = 0, animId, angle = 0;

    const resize = () => {
      const nw = canvas.offsetWidth;
      const nh = canvas.offsetHeight;
      if (!nw || !nh) return;
      w = nw; h = nh;
      r = Math.min(w, h) / 2 - 16;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!active) draw();
    };

    const blips = [
      { a: 0.7, d: 0.5 },
      { a: 1.9, d: 0.82 },
      { a: 3.8, d: 0.63 },
      { a: 5.1, d: 0.72 },
    ];

    const draw = () => {
      if (!w || !h) return;
      const cx = w / 2, cy = h / 2;
      const ink = tok("accent-ink");
      ctx.clearRect(0, 0, w, h);
      [1, 0.7, 0.4].forEach((scale) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = rgba("fg", active ? 0.22 : 0.12);
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.strokeStyle = rgba("fg", 0.1);
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
      if (!active) return;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, -0.5, 0.5);
      ctx.closePath();
      ctx.fillStyle = rgba(ink, 0.14);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      blips.forEach((b) => {
        const diff = ((b.a - angle) + Math.PI * 2) % (Math.PI * 2);
        if (diff < 1.2) {
          ctx.fillStyle = rgba(ink, 1 - diff / 1.2);
          ctx.fillRect(cx + Math.cos(b.a) * r * b.d - 2, cy + Math.sin(b.a) * r * b.d - 2, 4, 4);
        }
      });
    };

    resize();
    const stopResizeObserver = observeElementResize(canvas, resize);

    let isInView = true;
    let isPageVisible = document.visibilityState !== "hidden";
    const io = new IntersectionObserver(
      ([entry]) => { isInView = !!entry?.isIntersecting; },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    const gate = makeMotionGate(canvas);
    const onVisibilityChange = () => { isPageVisible = document.visibilityState !== "hidden"; };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Idle: one static frame. Searching: sweep (paused off-screen; one frame with reduced motion).
    const tick = () => {
      animId = requestAnimationFrame(tick);
      if (!isInView || !isPageVisible || gate.hold()) return;
      draw();
      angle = (angle + 0.03) % (Math.PI * 2);
    };
    if (active) animId = requestAnimationFrame(tick);
    else draw();

    return () => {
      cancelAnimationFrame(animId);
      stopResizeObserver();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/* -------------------------------------------------------
   SHARED SECTION HEADER
------------------------------------------------------- */
function SectionHead({ id, eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div className="grid min-w-0 gap-2">
        <p className={eyebrowClass}>{eyebrow}</p>
        <h2 id={id} className={h2Class} style={DISPLAY_STYLE}>{title}</h2>
        {description ? <p className="max-w-[64ch] font-mono text-body text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------
   HERO
------------------------------------------------------- */
function Hero() {
  return (
    <section aria-labelledby="home-title" className="grid gap-8 border-b border-border pb-12 lg:grid-cols-2 lg:items-end lg:gap-12">
      <div className="home-enter grid min-w-0 gap-6">
        <p className={eyebrowClass}>&gt; vantage</p>
        <h1 id="home-title" className="font-display text-display uppercase text-fg" style={DISPLAY_STYLE}>
          <span className="block">Visualize</span>
          <span className="block">Practice</span>
          <span className="block text-accent-ink">Compete</span>
        </h1>
        <p className="max-w-[56ch] font-mono text-body text-fg-muted">
          Algorithm visualizers, an online judge, live 1v1 battles, a world map to conquer and a LeetCode sync extension, in one place.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="primary" size="lg">
            <Link to="/visualizers">
              Open visualizers <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/problems">Solve a problem</Link>
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
          <Stat label="Visualizers" value={VISUALIZER_COUNT} />
          <Stat label="Topics" value={TOPIC_COUNT} />
          <Stat label="Languages" value="C++ / Java" />
        </div>
      </div>

      <Panel
        className="home-enter min-w-0"
        label="Same input · sorting race"
        actions={<span className="font-mono text-micro uppercase tabular-nums text-accent-ink">O(n²) vs O(n log n)</span>}
        padded={false}
      >
        <div className="h-64 bg-bg sm:h-80 lg:h-96">
          <RaceCanvas />
        </div>
      </Panel>
    </section>
  );
}

/* -------------------------------------------------------
   VISUALIZERS: 8 live cards, 2 rows at desktop
------------------------------------------------------- */
const VIZ_CARDS = [
  { key: "mergesort", kind: "merge", title: "Merge sort", tag: "Sorting", complexity: "O(n log n)", to: "/sorting/MergeSort", desc: "Divide, conquer, merge. Stable and predictable on every input." },
  { key: "heapsort", kind: "algo", title: "Heap sort", tag: "Sorting", complexity: "O(n log n)", to: "/sorting/HeapSort", desc: "Heapify, then extract the max until the array is sorted in place." },
  { key: "bsearch", kind: "algo", title: "Binary search", tag: "Search", complexity: "O(log n)", to: "/binary-search/BinarySearchBasic", desc: "Halve the search space each step: 50M sorted items in 26 steps." },
  { key: "bfs", kind: "algo", title: "BFS", tag: "Graphs", complexity: "O(V+E)", to: "/graphs/BFS", desc: "Level-by-level traversal with a queue. Shortest paths in unweighted graphs." },
  { key: "dijkstra", kind: "algo", title: "Dijkstra", tag: "Graphs", complexity: "O(E log V)", to: "/graphs/Dijkstra", desc: "Greedy shortest paths, relaxing edges from a min-heap." },
  { key: "astar", kind: "mid", title: "A* pathfinding", tag: "Pathfinding", complexity: "O(E)", to: "/pathfinding/AStar", desc: "Best-first search on g(n) + h(n) toward an optimal route." },
  { key: "nqueens", kind: "complex", title: "N-Queens", tag: "Backtracking", complexity: "O(N!)", to: "/recursion/NQueens", desc: "Place queens row by row, reject conflicts and backtrack." },
  { key: "sudoku", kind: "complex", title: "Sudoku solver", tag: "Backtracking", complexity: "Exponential", to: "/backtracking/SudokuSolver", desc: "Fill each empty cell while rows, columns and boxes stay valid." },
];

function VizCanvas({ card }) {
  if (card.kind === "merge") return <MergeSortCanvas />;
  if (card.kind === "complex") return <ComplexAlgoCanvas algo={COMPLEX_ALGO_CONFIGS[card.key]} />;
  if (card.kind === "mid") return <MidAnimatonsAlgoCanvas algo={MID_ANIMATONS_CONFIGS[card.key]} />;
  return <AlgoCanvas algo={ALGO_CONFIGS[card.key]} />;
}

function VizShowcase() {
  return (
    <section aria-labelledby="home-viz" className="pt-16">
      <SectionHead
        id="home-viz"
        eyebrow="> visualize"
        title="Visualizers"
        description="Every algorithm runs as a live animation you can pause, step through and study, not a GIF."
        action={
          <Button asChild variant="link">
            <Link to="/visualizers">
              Browse all {VISUALIZER_COUNT} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VIZ_CARDS.map((card) => (
          <li key={card.key} className="min-w-0">
            <Panel as={Link} to={card.to} variant="interactive" padded={false} className="flex h-full flex-col">
              <div className="relative h-44 border-b border-border bg-bg" aria-hidden="true">
                <VizCanvas card={card} />
              </div>
              <div className="grid flex-1 content-start gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-micro uppercase text-fg-muted">{card.tag}</span>
                  <Badge tone="outline">{card.complexity}</Badge>
                </div>
                <h3 className="font-mono text-h3 text-fg">{card.title}</h3>
                <p className="font-mono text-small text-fg-muted">{card.desc}</p>
              </div>
            </Panel>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------
   JUDGE + CODE FLOW: static editor frame (verdict + trace)
------------------------------------------------------- */
const CODE_LINES = [
  "class Solution {",
  " public:",
  "  vector<int> twoSum(vector<int>& nums, int target) {",
  "    unordered_map<int, int> seen;",
  "    for (int i = 0; i < nums.size(); i++) {",
  "      int need = target - nums[i];",
  "      if (seen.count(need)) return {seen[need], i};",
  "      seen[nums[i]] = i;",
  "    }",
  "    return {};",
  "  }",
  "};",
];
const ACTIVE_LINE = 7;

const TRACE = [
  { step: 1, line: 6, state: "i = 0, need = 7, seen = {}" },
  { step: 2, line: 8, state: "seen = {2: 0}" },
  { step: 3, line: 6, state: "i = 1, need = 2" },
  { step: 4, line: 7, state: "return {0, 1}" },
];

function JudgeSection() {
  return (
    <section aria-labelledby="home-judge" className="pt-16">
      <SectionHead
        id="home-judge"
        eyebrow="> practice"
        title="Judge"
        description="Write C++ or Java, run it against hidden tests and get a verdict with a line-by-line trace of how your code ran."
        action={
          <Button asChild variant="secondary">
            <Link to="/problems">
              Solve a problem <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <Panel
        label="two_sum.cpp · sample run"
        actions={<Badge tone="ok">Accepted</Badge>}
        padded={false}
      >
        <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <pre className="overflow-x-auto border-b border-border bg-bg py-3 font-mono text-small lg:border-b-0 lg:border-r" aria-label="Sample solution">
            <code>
              {CODE_LINES.map((line, i) => {
                const n = i + 1;
                const active = n === ACTIVE_LINE;
                return (
                  <span
                    key={n}
                    className={cn(
                      "grid grid-cols-[3rem_minmax(0,1fr)] border-l-2 pr-4",
                      active ? "border-accent-ink bg-accent-soft text-fg" : "border-transparent text-fg-muted"
                    )}
                  >
                    <span className="select-none pr-3 text-right tabular-nums text-fg-dim">{n}</span>
                    <span className="whitespace-pre">{line}</span>
                  </span>
                );
              })}
            </code>
          </pre>
          <div className="grid content-start">
            <div className="border-b border-border px-4 py-2 font-mono text-label uppercase text-fg-muted">Trace · nums = [2, 7, 11, 15], target = 9</div>
            <ol className="font-mono text-small">
              {TRACE.map((t) => {
                const active = t.line === ACTIVE_LINE;
                return (
                  <li
                    key={t.step}
                    className={cn(
                      "grid grid-cols-[3rem_4rem_minmax(0,1fr)] gap-2 border-b border-l-2 border-b-border px-4 py-2 tabular-nums",
                      active ? "border-l-accent-ink bg-accent-soft text-fg" : "border-l-transparent text-fg-muted"
                    )}
                  >
                    <span className="text-fg-dim">#{t.step}</span>
                    <span>L{t.line}</span>
                    <span className="min-w-0 break-words">{t.state}</span>
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 font-mono text-small text-fg-muted">
              <Badge tone="ok">Accepted</Badge>
              <span>Hidden tests passed</span>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* -------------------------------------------------------
   BATTLES (matchmaking demo, no fake ratings)
------------------------------------------------------- */
function BattleSection() {
  const navigate = useNavigate();
  const progressIntervalRef = useRef(null);
  const previewIntervalRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const [finding, setFinding] = useState(false);
  const [found, setFound] = useState("");
  const [searchPreview, setSearchPreview] = useState("");
  const [matchProgress, setMatchProgress] = useState(0);
  const names = ["maverick","rogue","fushiguro","topg"];

  const clearMatchmakingTimers = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  };

  const handleFind = () => {
    clearMatchmakingTimers();
    setFinding(true);
    setFound("");
    setSearchPreview(names[0]);
    setMatchProgress(0);

    let idx = 0;
    previewIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % names.length;
      setSearchPreview(names[idx]);
    }, 240);

    progressIntervalRef.current = setInterval(() => {
      setMatchProgress(p => {
        if (p >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return 100;
        }
        return p + Math.random() * 18;
      });
    }, 120);

    finishTimeoutRef.current = setTimeout(() => {
      clearMatchmakingTimers();
      setMatchProgress(100);
      setFound(names[Math.floor(Math.random() * names.length)]);
      setSearchPreview("");
      setFinding(false);
    }, 2000);
  };

  useEffect(() => {
    return () => clearMatchmakingTimers();
  }, []);

  const opponent = finding ? searchPreview : found;

  return (
    <section aria-labelledby="home-battle" className="pt-16">
      <SectionHead
        id="home-battle"
        eyebrow="> compete"
        title="Battles"
        description="Real-time 1v1 duels and group rooms for up to 8 players. Same problem, same clock: the first accepted solution wins."
        action={
          <Button asChild variant="secondary">
            <Link to="/battle">
              <Swords aria-hidden="true" /> Enter arena
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel label="Modes">
          <ul className="grid gap-3 font-mono text-small text-fg-muted">
            <li className="grid gap-1">
              <span className="font-mono text-label uppercase text-fg">Ranked</span>
              <span>Rated 1v1 matches against players near your level.</span>
            </li>
            <li className="grid gap-1 border-t border-border pt-3">
              <span className="font-mono text-label uppercase text-fg">Casual</span>
              <span>Unrated 1v1 practice with the same rules.</span>
            </li>
            <li className="grid gap-1 border-t border-border pt-3">
              <span className="font-mono text-label uppercase text-fg">Group · 3–8 players</span>
              <span>Host a room, share the code, race your friends.</span>
            </li>
          </ul>
        </Panel>

        <Panel label="Matchmaking demo">
          <div className="relative mb-4 h-40 border border-border bg-bg">
            <MatchSearchRadar active={finding} />
            <div className="relative grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
              <div className="grid justify-items-center gap-2">
                <Avatar name="You" size="lg" />
                <span className="font-mono text-small text-fg">You</span>
              </div>
              <span className="border border-border-strong bg-surface px-2 py-1 font-mono text-micro uppercase text-fg-muted">VS</span>
              <div className="grid justify-items-center gap-2">
                {opponent ? (
                  <Avatar name={opponent} size="lg" />
                ) : (
                  <span className="flex size-11 items-center justify-center border border-dashed border-border-strong font-mono text-label text-fg-dim">?</span>
                )}
                <span className={cn("font-mono text-small", found ? "text-fg" : "text-fg-dim")} aria-live="polite">
                  {opponent || "Waiting"}
                </span>
              </div>
            </div>
          </div>

          {finding ? <Progress value={matchProgress} label="Matchmaking progress" className="mb-4" /> : null}

          {found ? (
            <div className="mb-4 flex items-center justify-between gap-3 border border-border bg-bg px-3 py-2">
              <div className="grid gap-1">
                <span className="font-mono text-micro uppercase text-fg-dim">Problem assigned</span>
                <span className="font-mono text-small text-fg">Two Sum</span>
              </div>
              <Badge tone="ok">Easy</Badge>
            </div>
          ) : null}

          {found ? (
            <Button variant="primary" size="lg" className="w-full" onClick={() => navigate("/battle")}>
              <Swords aria-hidden="true" /> Start battle
            </Button>
          ) : (
            <Button variant="secondary" size="lg" className="w-full" onClick={handleFind} loading={finding}>
              {finding ? "Searching…" : "Find an opponent"}
            </Button>
          )}
        </Panel>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   MAP: read-only world preview
------------------------------------------------------- */
function MapPreview() {
  return (
    <section aria-labelledby="home-map" className="pt-16">
      <SectionHead
        id="home-map"
        eyebrow="> conquer"
        title="Map"
        description="Every country is a problem. Solve it to claim the territory on a shared world map."
        action={
          <Button asChild variant="secondary">
            <Link to="/map">
              Open the map <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <Panel as={Link} to="/map" variant="interactive" aria-label="Open the world map" className="overflow-hidden">
        <div className="text-fg [&_path]:[fill:var(--elevated)] [&_path]:[stroke-width:0.6] [&_path]:[stroke:var(--border-strong)]" aria-hidden="true">
          <Suspense fallback={<Skeleton className="aspect-[2000/857] w-full" />}>
            <WorldSvg viewBox="0 0 2000 857" preserveAspectRatio="xMidYMid meet" className="block h-auto w-full" focusable="false" />
          </Suspense>
        </div>
      </Panel>
    </section>
  );
}

/* -------------------------------------------------------
   EXTENSION: terminal block
------------------------------------------------------- */
const EXTENSION_STEPS = [
  { n: "01", cmd: "download", desc: "Get the extension zip with the button above, or from the extension icon in the navbar." },
  { n: "02", cmd: "extract", desc: "Unzip it to any folder on your machine." },
  { n: "03", cmd: "load", desc: "Open chrome://extensions, turn on Developer mode, then click Load unpacked." },
  { n: "04", cmd: "sync", desc: "Pick the extracted folder. Your solved LeetCode problems sync now, and every new solve syncs after." },
];

function ExtensionInstallGuide() {
  return (
    <section id="extension-setup" aria-labelledby="home-extension" className="scroll-mt-[calc(var(--nav-h)+16px)] pt-16">
      <SectionHead
        id="home-extension"
        eyebrow="> sync"
        title="Extension"
        description="The Vantage LeetCode sync extension imports the problems you have already solved and keeps syncing new ones."
      />
      <Panel
        label="vantage-sync · setup"
        actions={
          <Button asChild variant="secondary" size="sm">
            <a href={EXTENSION_ZIP_DEMO_URL} download target="_blank" rel="noreferrer">
              <Download aria-hidden="true" /> Download zip
            </a>
          </Button>
        }
        className="bg-bg"
      >
        <ol className="grid gap-3 font-mono text-small">
          {EXTENSION_STEPS.map((s) => (
            <li key={s.n} className="grid gap-x-3 gap-y-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <span className="whitespace-nowrap text-fg">
                <span className="text-accent-ink">$</span> <span className="tabular-nums text-fg-dim">{s.n}</span> {s.cmd}
              </span>
              <span className="text-fg-muted">{s.desc}</span>
            </li>
          ))}
          <li aria-hidden="true" className="text-accent-ink">$ <span>▮</span></li>
        </ol>
      </Panel>
    </section>
  );
}

/* -------------------------------------------------------
   FINAL CTA: the only accent slab
------------------------------------------------------- */
function FinalCTA() {
  return (
    <section aria-labelledby="home-cta" className="pt-16">
      <div className="grid gap-6 border border-accent-edge bg-accent p-8 text-on-accent md:p-12">
        <p className="font-mono text-label">&gt; start</p>
        <h2 id="home-cta" className="font-display text-h1 uppercase" style={DISPLAY_STYLE}>
          Start with a visualizer
        </h2>
        <p className="max-w-[56ch] font-mono text-body">
          Pick any of the {VISUALIZER_COUNT} visualizers, then take the same idea to the judge or into a battle.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/visualizers"
            className={buttonClasses({
              size: "lg",
              className: "border-on-accent bg-on-accent text-accent ds-hover:border-on-accent ds-hover:bg-transparent ds-hover:text-on-accent",
            })}
          >
            Open visualizers <ArrowRight aria-hidden="true" />
          </Link>
          <Link
            to="/battle"
            className={buttonClasses({
              size: "lg",
              className: "border-on-accent bg-transparent text-on-accent ds-hover:border-on-accent ds-hover:bg-on-accent ds-hover:text-accent",
            })}
          >
            <Swords aria-hidden="true" /> Jump into a battle
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   ROOT
------------------------------------------------------- */
export default function HomePage() {
  const location = useLocation();
  const scopeRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (location.hash !== "#extension-setup") return;
    const id = window.setTimeout(() => {
      const setupSection = document.getElementById("extension-setup");
      setupSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
    return () => window.clearTimeout(id);
  }, [location.hash]);

  // One entrance per page (§3.6): hero fades up 8px in 250ms.
  useGSAP(() => {
    if (reducedMotion) return;
    gsap.from(".home-enter", { opacity: 0, y: 8, duration: 0.25, ease: "power2.out", stagger: 0.06, clearProps: "opacity,transform" });
  }, { scope: scopeRef, dependencies: [reducedMotion] });

  return (
    <PageShell>
      <div ref={scopeRef}>
        <Hero />
        <VizShowcase />
        <JudgeSection />
        <BattleSection />
        <MapPreview />
        <ExtensionInstallGuide />
        <FinalCTA />
      </div>
    </PageShell>
  );
}
