import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight, Swords, BarChart3, Map, Code2,
  BookOpen, Zap, Trophy, ArrowUpRight, GitBranch,
} from "lucide-react";
import { MONUMENT_TYPO } from "../components/MonumentTypography";
import Logo from "../components/Logo";
import { ALGO_CONFIGS, AlgoCanvas, MergeSortCanvas } from "../components/HomePageAnimations";
import { COMPLEX_ALGO_CONFIGS, ComplexAlgoCanvas } from "../components/ComplexAnimations";
import { MID_ANIMATONS_CONFIGS, MidAnimatonsAlgoCanvas } from "../components/midanimatons";
import { observeElementResize } from "../lib/observeResize";

gsap.registerPlugin(ScrollTrigger);

const HOME_TYPO = {
  monumentFontFamily: MONUMENT_TYPO.fontFamily,
  canvasFontFamily: MONUMENT_TYPO.canvasFontFamily,
  letterSpacing: MONUMENT_TYPO.letterSpacing,
};

const getCanvasPerfProfile = () => {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const hc = typeof navigator !== "undefined" ? (navigator.hardwareConcurrency || 8) : 8;
  const dm = typeof navigator !== "undefined" ? (navigator.deviceMemory || 8) : 8;
  const lowPower = !!reducedMotion || hc <= 6 || dm <= 4;
  return {
    dprCap: lowPower ? 1.25 : 1.5,
    glowScale: lowPower ? 0.72 : 1,
  };
};

/* ═══════════════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════════════ */
function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: -300, y: -300 });
  const ring  = useRef({ x: -300, y: -300 });
  const [label, setLabel] = useState("");

  useEffect(() => {
    const onMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    document.addEventListener("mousemove", onMove);

    let raf;
    const tick = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.11;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.11;
      if (dotRef.current)  dotRef.current.style.transform  = `translate(${mouse.current.x - 3}px, ${mouse.current.y - 3}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.current.x - 16}px, ${ring.current.y - 16}px)`;
      raf = requestAnimationFrame(tick);
    };
    tick();

    const enter = (e) => {
      const lbl = e.currentTarget.dataset.cursor || "";
      setLabel(lbl);
      gsap.to(ringRef.current, { scale: lbl ? 3.2 : 1.8, duration: 0.3, ease: "power2.out" });
    };
    const leave = () => {
      setLabel("");
      gsap.to(ringRef.current, { scale: 1, duration: 0.35, ease: "power2.out" });
    };

    const attach = () => {
      document.querySelectorAll("[data-cursor]").forEach(el => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
      });
    };
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => { cancelAnimationFrame(raf); document.removeEventListener("mousemove", onMove); observer.disconnect(); };
  }, []);

  return (
    <>
      <div ref={dotRef} style={{ position:"fixed",top:0,left:0,width:6,height:6,borderRadius:"50%",
        background:"#EDFF66",pointerEvents:"none",zIndex:9999,mixBlendMode:"difference" }} />
      <div ref={ringRef} style={{ position:"fixed",top:0,left:0,width:32,height:32,borderRadius:"50%",
        border:"1px solid rgba(237,255,102,0.55)",pointerEvents:"none",zIndex:9998,
        display:"flex",alignItems:"center",justifyContent:"center",mixBlendMode:"difference" }}>
        {label && <span style={{ fontSize:6,fontWeight:900,letterSpacing:"0.08em",color:"#EDFF66",
          textTransform:"uppercase",whiteSpace:"nowrap",lineHeight:1 }}>{label}</span>}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   RACE CANVAS - Bubble vs Quick on live canvas
═══════════════════════════════════════════════════════ */
function RaceCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const perf = getCanvasPerfProfile();
    const N = 44;

    const makeArr = () => Array.from({ length: N }, () => Math.floor(Math.random() * 88) + 12);

    const buildQuickSteps = (src) => {
      const a = [...src], steps = [];
      const qs = (lo, hi) => {
        if (lo >= hi) return;
        const piv = a[hi]; let i = lo - 1;
        for (let j = lo; j < hi; j++) {
          steps.push({ type: "cmp", a: j, b: hi });
          if (a[j] <= piv) { i++; steps.push({ type: "swap", a: i, b: j }); [a[i],a[j]]=[a[j],a[i]]; }
        }
        steps.push({ type: "swap", a: i+1, b: hi }); [a[i+1],a[hi]]=[a[hi],a[i+1]];
        const pi = i+1; qs(lo,pi-1); qs(pi+1,hi);
      };
      qs(0, a.length-1);
      return steps;
    };

    let state, animId;

    const init = () => {
      const orig = makeArr();
      state = {
        bubble: { arr:[...orig], i:0, j:0, comps:[], done:false, ops:0 },
        quick:  { arr:[...orig], steps:buildQuickSteps(orig), idx:0, comps:[], done:false, ops:0 },
        restartTimer: null,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const stopResizeObserver = observeElementResize(canvas, resize);

    let isInView = true;
    let isPageVisible = document.visibilityState !== "hidden";
    const io = new IntersectionObserver(
      ([entry]) => { isInView = !!entry?.isIntersecting; },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    const onVisibilityChange = () => { isPageVisible = document.visibilityState !== "hidden"; };
    document.addEventListener("visibilitychange", onVisibilityChange);

    init();

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const drawPanel = (arr, comps, x0, panelW, label, color, ops) => {
      const bw   = Math.max(1, (panelW - 24) / arr.length - 1);
      const maxH = H() * 0.74;
      arr.forEach((v, i) => {
        const bh = (v / 100) * maxH;
        const bx = x0 + 12 + i * (bw + 1);
        const by = H() - bh - 34;
        const hot = comps.includes(i);
        ctx.fillStyle = hot ? color : "rgba(255,255,255,0.1)";
        ctx.shadowColor = hot ? color : "transparent";
        ctx.shadowBlur  = hot ? 10 * perf.glowScale : 0;
        ctx.fillRect(bx, by, bw, bh);
      });
      ctx.shadowBlur = 0;
      ctx.font = `700 9px ${HOME_TYPO.canvasFontFamily},monospace`;
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.textAlign = "left";
      ctx.fillText(label.toUpperCase(), x0 + 12, H() - 13);
      ctx.fillStyle = color;
      ctx.textAlign = "right";
      ctx.fillText(`${ops} ops`, x0 + panelW - 10, H() - 13);
      ctx.textAlign = "left";
    };

    const BSPEED = 2, QSPEED = 6;

    const step = (ts) => {
      animId = requestAnimationFrame(step);
      if (!isInView || !isPageVisible) return;
      if (W() === 0 || H() === 0) return;
      const { bubble: b, quick: q } = state;

      if (!b.done) {
        for (let k = 0; k < BSPEED; k++) {
          const n = b.arr.length;
          if (b.i >= n-1) { b.done = true; b.comps = []; break; }
          b.comps = [b.j, b.j+1];
          if (b.arr[b.j] > b.arr[b.j+1]) { [b.arr[b.j], b.arr[b.j+1]] = [b.arr[b.j+1], b.arr[b.j]]; b.ops++; }
          b.j++;
          if (b.j >= n-1-b.i) { b.i++; b.j = 0; }
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
      drawPanel(b.arr, b.comps, 0,    half, "Bubble Sort", "#f87171", b.ops);
      drawPanel(q.arr, q.comps, half, half, "Quick Sort",  "#EDFF66", q.ops);

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(half, 0, 1, H());

      const cy = H() / 2;
      ctx.beginPath(); ctx.arc(half, cy, 17, 0, Math.PI*2);
      ctx.fillStyle = "#09090b"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `900 8px ${HOME_TYPO.canvasFontFamily},monospace`; ctx.textAlign = "center";
      ctx.fillText("VS", half, cy + 3); ctx.textAlign = "left";

      if (b.done && q.done && !state.restartTimer) {
        state.restartTimer = setTimeout(() => { init(); }, 1400);
      }
    };
    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      if (state?.restartTimer) clearTimeout(state.restartTimer);
      window.removeEventListener("resize", resize);
      stopResizeObserver();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width:"100%", height:"100%", display:"block", contain:"strict" }} />;
}

/* ═══════════════════════════════════════════════════════
   ALGO CANVAS - unified renderer for all 8 algorithms
═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   ALGO CANVAS - unified renderer for all 8 algorithms
═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   MERGE SORT CANVAS - animated merge sort visualization
═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   MERGE SORT CANVAS - animated merge sort visualization
═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   GLITCH TEXT
═══════════════════════════════════════════════════════ */
function GlitchText({ children, style }) {
  const ref = useRef(null);
  const CHARS = "!<>-_\\/[]{}=+*^?#01XZAB";
  useEffect(() => {
    const el = ref.current, orig = String(children);
    let timer;
    const glitch = () => {
      let iter = 0;
      const iv = setInterval(() => {
        el.textContent = orig.split("").map((ch, i) => {
          if (ch === " ") return " ";
          if (i < iter) return orig[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("");
        iter += 0.6;
        if (iter >= orig.length) { clearInterval(iv); el.textContent = orig; timer = setTimeout(glitch, 3800 + Math.random() * 3000); }
      }, 28);
    };
    timer = setTimeout(glitch, 2400 + Math.random() * 1600);
    return () => clearTimeout(timer);
  }, [children]);
  return <span ref={ref} style={style}>{children}</span>;
}

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
function Hero() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const ruleRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.05 });
    tl.fromTo(ruleRef.current,
      { scaleX: 0, transformOrigin: "left" },
      { scaleX: 1, duration: 1.1, ease: "expo.inOut" }
    )
    .fromTo(".hw",
      { yPercent: 110 },
      { yPercent: 0, duration: 0.95, stagger: 0.08, ease: "expo.out" },
      "-=0.6"
    )
    .fromTo(".hm",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.06, ease: "power2.out" },
      "-=0.4"
    )
    .fromTo(".hcanvas",
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 1.0, ease: "expo.inOut" },
      "-=0.85"
    );
  }, { scope: ref });

  return (
    <section ref={ref} style={{ minHeight:"100vh",background:"#09090b",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:1,opacity:0.032,
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize:"200px" }} />
      <div style={{ position:"absolute",top:0,right:0,width:360,height:360,pointerEvents:"none",zIndex:1,opacity:0.04 }}>
        <svg width="360" height="360" viewBox="0 0 360 360">
          {Array.from({length:11},(_,i)=><line key={i} x1={i*34} y1="0" x2="0" y2={i*34} stroke="white" strokeWidth="0.8"/>)}
        </svg>
      </div>
      <div ref={ruleRef} style={{ position:"absolute",top:"57%",left:0,right:0,height:1,background:"rgba(255,255,255,0.05)",zIndex:2 }} />
      <div style={{ height:56, flexShrink:0 }} />
      <div style={{ flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",position:"relative",zIndex:3 }}>
        <div style={{ display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"clamp(48px,8vh,100px) clamp(24px,5vw,72px) 0" }}>
          <div className="hm" style={{ display:"flex",alignItems:"center",gap:10,marginBottom:26,opacity:0 }}>
            <div style={{ width:4,height:4,borderRadius:"50%",background:"#EDFF66",animation:"blink 1.4s step-end infinite" }} />
            <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.28)" }}>Competitive DSA Platform - Est. 2026</span>
          </div>
          {[{text:"VISUALIZE",color:"#fff"},{text:"PRACTICE.",color:"rgba(255,255,255,0.18)"},{text:"DOMINATE.",color:"#EDFF66"}].map(({text,color})=>(
            <div key={text} style={{ overflow:"hidden",lineHeight:0.88,marginBottom:3 }}>
              <div className="hw" style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(3.4rem,7.2vw,7rem)",fontWeight:900,letterSpacing:HOME_TYPO.letterSpacing.displayTight,color,display:"block",willChange:"transform" }}>{text}</div>
            </div>
          ))}
          <p className="hm" style={{ fontSize:14,color:"rgba(255,255,255,0.32)",lineHeight:1.75,maxWidth:380,marginTop:26,fontWeight:400,opacity:0 }}>
            The platform that combines live algorithm visualization, an online judge, and real-time 1v1 battles - for developers who actually want to win.
          </p>
          <div className="hm" style={{ display:"flex",gap:10,marginTop:28,flexWrap:"wrap",opacity:0 }}>
            <button onClick={()=>navigate("/problems")} data-cursor="GO" style={{ height:46,padding:"0 24px",borderRadius:10,border:"none",cursor:"none",background:"#EDFF66",color:"#09090b",fontSize:12,fontWeight:900,letterSpacing:"0.1em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,transition:"opacity 0.15s" }} onMouseEnter={e=>e.currentTarget.style.opacity="0.86"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>Start for free <ArrowRight size={13}/></button>
            <button onClick={()=>navigate("/battle")} data-cursor="BATTLE" style={{ height:46,padding:"0 22px",borderRadius:10,cursor:"none",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",fontSize:12,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.42)",display:"flex",alignItems:"center",gap:8,transition:"all 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.28)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="rgba(255,255,255,0.42)";}}><Swords size={12}/> Challenge someone</button>
          </div>
          <div className="hm" style={{ display:"flex",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:36,opacity:0 }}>
            {[{n:"50+",l:"Algorithms"},{n:"150+",l:"Problems"},{n:"1v1",l:"Live Battles"},{n:"∞",l:"Streaks"}].map(({n,l},i)=>(
              <div key={l} style={{ flex:1,padding:"14px 0",borderRight:i<3?"1px solid rgba(255,255,255,0.06)":"none" }}>
                <div style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(1.1rem,2vw,1.7rem)",fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:HOME_TYPO.letterSpacing.metric }}>{n}</div>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)",marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hcanvas" style={{ borderLeft:"1px solid rgba(255,255,255,0.06)",position:"relative",overflow:"hidden" }}>
          <RaceCanvas />
          <div style={{ position:"absolute",top:72,right:20,display:"flex",alignItems:"center",gap:6,padding:"5px 11px",borderRadius:8,background:"rgba(9,9,11,0.92)",border:"1px solid rgba(248,113,113,0.22)" }}>
            <div style={{ width:5,height:5,borderRadius:"50%",background:"#f87171",animation:"blink 1.1s step-end infinite" }} />
            <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.18em",textTransform:"uppercase",color:"#f87171" }}>Live Race</span>
          </div>
          <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"10px 18px",background:"rgba(9,9,11,0.82)",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)" }}>Same input - sorting race</span>
            <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"#EDFF66" }}>O(n²) vs O(n log n)</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)",padding:"9px 0",overflow:"hidden",position:"relative",zIndex:3,flexShrink:0 }}>
        <div style={{ display:"flex",gap:44,whiteSpace:"nowrap",animation:"ticker 26s linear infinite" }}>
          {[...Array(3)].flatMap(()=>[
            "50+ Algorithm Visualizations","•","150+ Curated Problems","•","Real-time 1v1 Battles","•","ELO Ranked System","•","C++ & Java Support","•","Daily Streak Rewards","•",
          ]).map((item,i)=>(
            <span key={i} style={{ fontSize:9,fontWeight:item==="•"?900:700,letterSpacing:item==="•"?0:"0.16em",textTransform:"uppercase",color:item==="•"?"#EDFF66":"rgba(255,255,255,0.18)" }}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   VIZ SHOWCASE - 8 live algorithms, 2-row grid
═══════════════════════════════════════════════════════ */
function VizShowcase() {
  const ref = useRef(null);
  const navigate = useNavigate();

  useGSAP(() => {
    gsap.fromTo(".vs-hd", { opacity:0, y:36 },
      { opacity:1, y:0, duration:0.8, ease:"power3.out", scrollTrigger:{ trigger:ref.current, start:"top 78%" } });
    gsap.fromTo(".vs-card",
      { opacity:0, y:52, clipPath:"inset(0 0 100% 0)" },
      { opacity:1, y:0, clipPath:"inset(0 0 0% 0)", duration:0.75, stagger:0.1, ease:"expo.out",
        scrollTrigger:{ trigger:".vs-grid", start:"top 78%" } });
    gsap.fromTo(".vs-rule", { scaleX:0, transformOrigin:"left" },
      { scaleX:1, duration:1, ease:"expo.inOut", scrollTrigger:{ trigger:ref.current, start:"top 70%" } });
  }, { scope: ref });

  const CARDS = [
    { key:"bfs",          label:"01", title:"BFS",            tag:"GRAPH",   color:"#60a5fa", complexity:"O(V+E)",    desc:"Level-by-level traversal. Queue-driven. Guarantees shortest path in unweighted graphs." },
    { key:"dfs",          label:"02", title:"DFS",            tag:"GRAPH",   color:"#c4b5fd", complexity:"O(V+E)",    desc:"Dives deep before backtracking. Powers cycle detection, topo sort, and maze solving." },
    { key:"dijkstra",     label:"03", title:"Dijkstra",       tag:"GRAPH",   color:"#fb923c", complexity:"O(E log V)", desc:"Greedy shortest-path. Relaxes edges via min-heap. Foundation of GPS routing." },
    { key:"floydwarshall",label:"04", title:"Floyd-Warshall", tag:"GRAPH",   color:"#f43f5e", complexity:"O(V³)",      desc:"Dynamic programming for all-pairs shortest paths. Computes every route in one sweep." },
    { key:"inorder",      label:"05", title:"Inorder BST",    tag:"TREE",    color:"#34d399", complexity:"O(n)",      desc:"Left → Root → Right yields sorted output. The elegance of recursive tree traversal." },
    { key:"slidingwindow",label:"06", title:"Sliding Window",  tag:"PATTERN", color:"#22d3ee", complexity:"O(n)",      desc:"A core interview pattern: move a fixed window and compute answers in linear time." },
    { key:"bsearch",      label:"07", title:"Binary Search",  tag:"ARRAY",   color:"#e879f9", complexity:"O(log n)",  desc:"Halves the search space every step. Finds a target in 50M sorted items in 26 steps." },
    { key:"mergesort",    label:"08", title:"Merge Sort",     tag:"SORTING", color:"#34d399", complexity:"O(n log n)", desc:"Divide, conquer, merge. Stable. Predictable. The gold standard for comparison sorting." },
    { key:"twopointers",  label:"09", title:"Two Pointers",   tag:"PATTERN", color:"#38bdf8", complexity:"O(n)",      desc:"A classic sorted-array strategy: squeeze both ends inward to converge on the answer." },
    { key:"kadane",       label:"10", title:"Kadane",         tag:"DP",      color:"#a78bfa", complexity:"O(n)",      desc:"Maximum subarray in one pass with rolling state and local-vs-global optimization." },
    { key:"kruskal",      label:"11", title:"Kruskal MST",    tag:"GRAPH",   color:"#2dd4bf", complexity:"O(E log E)", desc:"Edge-sorted MST construction with cycle rejection via disjoint-set structure." },
    { key:"heapsort",     label:"12", title:"Heap Sort",      tag:"SORTING", color:"#f97316", complexity:"O(n log n)", desc:"Heapify then extract max repeatedly. In-place comparison sorting with strict guarantees." },
    { key:"nqueens",      label:"13", title:"N-Queens",       tag:"BACKTRACK", color:"#f59e0b", complexity:"O(N!)",       desc:"Classic recursive search: place queens row-by-row, reject conflicts, and backtrack toward a valid board." },
    { key:"sudoku",       label:"14", title:"Sudoku Solver",  tag:"BACKTRACK", color:"#22d3ee", complexity:"Exponential", desc:"Constraint-driven backtracking that fills each empty cell while preserving row, column, and box validity." },
    { key:"snakesladders",label:"15", title:"Snakes & Ladders",tag:"SIM", color:"#f43f5e", complexity:"O(T)", desc:"Dice-roll simulation on a 100-cell board with ladder climbs and snake slips." },
    { key:"knightstour",  label:"16", title:"Knight's Tour",   tag:"BACKTRACK", color:"#8b5cf6", complexity:"O(8^(N²))", desc:"A knight visits every chessboard square exactly once using legal L-shaped jumps." },
    { key:"astar",        label:"17", title:"A* Pathfinding",  tag:"GRAPH", color:"#60a5fa", complexity:"O(E)", desc:"Heuristic best-first search combining g(n) and h(n) to efficiently find optimal routes." },
    { key:"unionfind",    label:"18", title:"Union-Find",      tag:"DSA", color:"#34d399", complexity:"~O(α(n))", desc:"Disjoint set operations with union by rank and path compression." },
    { key:"kmp",          label:"19", title:"KMP",             tag:"STRING", color:"#f59e0b", complexity:"O(n+m)", desc:"Linear-time substring search using LPS fallback jumps." },
    { key:"palindrome",   label:"20", title:"Longest Palindrome", tag:"STRING", color:"#a78bfa", complexity:"O(n²)", desc:"Expand-around-center search for the longest palindromic substring." },
  ];

  return (
    <section ref={ref} style={{ background:"#09090b",padding:"96px 0 0",overflow:"hidden" }}>
      <div className="vs-rule" style={{ height:1,background:"rgba(255,255,255,0.05)",margin:"0 clamp(24px,5vw,72px) 64px" }} />

      <div className="vs-hd" style={{ padding:"0 clamp(24px,5vw,72px)",marginBottom:52,display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:24 }}>
        <div>
          <div style={{ fontSize:9,fontWeight:900,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)",marginBottom:14 }}>- Visualization First</div>
          <h2 style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(2.2rem,4.2vw,3.8rem)",fontWeight:900,color:"#fff",letterSpacing:HOME_TYPO.letterSpacing.displayTight,lineHeight:1,margin:0 }}>
            Watch algorithms<br/><span style={{ color:"rgba(255,255,255,0.2)" }}>think in real time.</span>
          </h2>
        </div>
        <div style={{ maxWidth:300,flexShrink:0 }}>
          <p style={{ fontSize:13,color:"rgba(255,255,255,0.28)",lineHeight:1.75,margin:"0 0 16px" }}>
            Every algorithm on Vantage runs as a live animation. Not a GIF. Not a diagram. A live execution you can pause, scrub, and study.
          </p>
          <button onClick={()=>navigate("/sorting")} data-cursor="EXPLORE" style={{ height:36,padding:"0 16px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",cursor:"none",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6,transition:"all 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.28)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="rgba(255,255,255,0.4)";}}>
            Explore all 50+ algorithms <ArrowUpRight size={12}/>
          </button>
        </div>
      </div>

      {/* 3-row grid of 4 cols = 12 cards */}
      <div className="vs-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        {CARDS.map((card, i) => (
          <div key={card.key} className="vs-card" style={{
            borderRight: (i % 4) < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
            borderBottom: i < CARDS.length - 4 ? "1px solid rgba(255,255,255,0.05)" : "none",
            display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",
          }}>
            <div style={{ height:2,background:`linear-gradient(90deg, ${card.color}70, transparent)` }} />
            <div style={{ height:220,background:"rgba(255,255,255,0.01)",position:"relative" }}>
              {card.key === "mergesort"
                ? <MergeSortCanvas />
                : (card.key === "nqueens" || card.key === "sudoku" || card.key === "snakesladders" || card.key === "knightstour")
                  ? <ComplexAlgoCanvas algo={COMPLEX_ALGO_CONFIGS[card.key]} />
                  : (card.key === "astar" || card.key === "unionfind" || card.key === "kmp" || card.key === "palindrome")
                    ? <MidAnimatonsAlgoCanvas algo={MID_ANIMATONS_CONFIGS[card.key]} />
                : <AlgoCanvas algo={ALGO_CONFIGS[card.key]} />}
              <div style={{ position:"absolute",top:10,right:10,padding:"3px 8px",borderRadius:6,background:"rgba(9,9,11,0.88)",border:`1px solid ${card.color}25`,fontSize:9,fontWeight:900,letterSpacing:"0.1em",color:card.color }}>{card.complexity}</div>
            </div>
            <div style={{ padding:"16px 20px 22px",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.2em",textTransform:"uppercase",color:card.color }}>{card.tag}</span>
                <span style={{ fontSize:9,color:"rgba(255,255,255,0.15)",letterSpacing:"0.1em" }}>/ {card.label}</span>
              </div>
              <h3 style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:16,fontWeight:900,color:"#fff",letterSpacing:HOME_TYPO.letterSpacing.displayTight,lineHeight:1.08,margin:"0 0 8px" }}>{card.title}</h3>
              <p style={{ fontSize:11,color:"rgba(255,255,255,0.3)",lineHeight:1.65,margin:0 }}>{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ margin:"0 clamp(24px,5vw,72px)",padding:"18px 0",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex",gap:20,flexWrap:"wrap" }}>
          {["Floyd-Warshall","Bellman-Ford","AVL Tree","Heaps","Tries","DP","Kruskal's"].map(a=>(
            <span key={a} style={{ fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.18)",cursor:"none",transition:"color 0.15s" }} data-cursor="VIEW" onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.6)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.18)"}>{a}</span>
          ))}
          <span style={{ fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(237,255,102,0.55)" }}>+43 more →</span>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURES TAPE
═══════════════════════════════════════════════════════ */
const FEAT_CARDS = [
  { num:"01",icon:Code2,    title:"Online\nJudge",          accent:"#34d399",tag:"EXECUTE", stat:"150+ problems",  desc:"Write real C++ or Java. Run against hidden test cases. Get instant pass/fail. No coddling." },
  { num:"02",icon:Swords,   title:"1v1\nBattle Arena",      accent:"#f87171",tag:"COMPETE", stat:"ELO rated",      desc:"Real-time coding duels. Ranked or Casual. First to AC wins. Real pressure. Real improvement." },
  { num:"03",icon:Map,      title:"World\nConquest",        accent:"#fbbf24",tag:"EXPLORE", stat:"Global board",   desc:"An interactive world map. Every country = a problem. Solve it, claim the territory." },
  { num:"04",icon:Trophy,   title:"Ranks &\nAchievements",  accent:"#fb923c",tag:"GRIND",   stat:"Gamified XP",    desc:"Badges, coins, XP, streaks. Every session rewards you. Flex your progress on your profile." },
  { num:"05",icon:Zap,      title:"Group\nBattles",         accent:"#EDFF66",tag:"DOMINATE",stat:"Up to 8 players",desc:"3–8 player coded showdowns. Host a room, invite your crew, destroy them publicly." },
  { num:"06",icon:GitBranch,title:"Learning\nPaths",        accent:"#c4b5fd",tag:"LEARN",   stat:"Structured",     desc:"Curated topic-by-topic paths from arrays to advanced DP. Know exactly what to study next." },
];

function Features() {
  const ref = useRef(null);
  useGSAP(() => {
    gsap.fromTo(".fc-hd", { opacity:0, y:32 },
      { opacity:1, y:0, duration:0.75, ease:"power3.out", scrollTrigger:{ trigger:ref.current, start:"top 80%" } });
    gsap.fromTo(".fc-card", { opacity:0, x:50 },
      { opacity:1, x:0, duration:0.65, stagger:0.1, ease:"power3.out", scrollTrigger:{ trigger:".fc-track", start:"top 80%" } });
  }, { scope: ref });

  return (
    <section ref={ref} style={{ background:"#09090b",paddingBottom:80 }}>
      <div className="fc-hd" style={{ padding:"80px clamp(24px,5vw,72px) 40px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:24 }}>
        <div>
          <div style={{ fontSize:9,fontWeight:900,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)",marginBottom:12 }}>- Platform Features</div>
          <h2 style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(2.2rem,4.2vw,3.8rem)",fontWeight:900,color:"#fff",letterSpacing:HOME_TYPO.letterSpacing.displayTight,lineHeight:1,margin:0 }}>
            One platform.<br/><span style={{ color:"rgba(255,255,255,0.18)" }}>Every tool.</span>
          </h2>
        </div>
        <p style={{ fontSize:13,color:"rgba(255,255,255,0.26)",maxWidth:280,lineHeight:1.75,flexShrink:0 }}>
          From your first array traversal to dynamic programming - Vantage accelerates your DSA growth at every level.
        </p>
      </div>
      <div className="fc-track" style={{ display:"flex",gap:12,padding:"0 clamp(24px,5vw,72px)",overflowX:"auto",scrollbarWidth:"none" }}>
        {FEAT_CARDS.map((c) => (
          <div key={c.num} className="fc-card" data-cursor={c.tag} style={{ flexShrink:0,width:272,borderRadius:16,background:"#0d0d10",border:"1px solid rgba(255,255,255,0.06)",padding:26,display:"flex",flexDirection:"column",cursor:"none",position:"relative",overflow:"hidden",transition:"border-color 0.25s, transform 0.25s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${c.accent}30`;e.currentTarget.style.transform="translateY(-4px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg, ${c.accent}55, transparent)` }} />
            <div style={{ fontSize:10,fontWeight:900,letterSpacing:"0.14em",color:"rgba(255,255,255,0.14)",marginBottom:18 }}>{c.num} /</div>
            <div style={{ width:38,height:38,borderRadius:10,border:`1px solid ${c.accent}20`,background:`${c.accent}0c`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18 }}><c.icon size={15} color={c.accent}/></div>
            <h3 style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:21,fontWeight:900,color:"#fff",letterSpacing:HOME_TYPO.letterSpacing.displayTight,lineHeight:1.1,margin:"0 0 12px",whiteSpace:"pre-line" }}>{c.title}</h3>
            <p style={{ fontSize:12,color:"rgba(255,255,255,0.32)",lineHeight:1.7,margin:0,flex:1 }}>{c.desc}</p>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:22,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:c.accent }}>{c.stat}</span>
              <ArrowUpRight size={13} color="rgba(255,255,255,0.18)"/>
            </div>
          </div>
        ))}
        <div style={{ flexShrink:0,width:40 }} />
      </div>
    </section>
  );
}

function MatchSearchRadar({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const visual = active
      ? {
          core0: 0.14,
          core1: 0.05,
          ring: 0.2,
          cross: 0.12,
          sector: 0.16,
          beam: 0.95,
          blip: 0.85,
        }
      : {
          core0: 0.08,
          core1: 0.03,
          ring: 0.12,
          cross: 0.08,
          sector: 0.09,
          beam: 0.55,
          blip: 0.45,
        };

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;
    let r = 0;
    let animId;
    let angle = 0;

    const resize = () => {
      const nw = canvas.offsetWidth;
      const nh = canvas.offsetHeight;
      if (!nw || !nh) return;
      w = nw;
      h = nh;
      r = Math.min(w, h) / 2 - 14;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const stopResizeObserver = observeElementResize(canvas, resize);

    const blips = [
      { a: 0.7, d: 0.5 },
      { a: 1.9, d: 0.82 },
      { a: 3.8, d: 0.63 },
      { a: 5.1, d: 0.72 },
    ];

    const tick = () => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // center glow
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * 1.05);
      glow.addColorStop(0, `rgba(237,255,102,${visual.core0})`);
      glow.addColorStop(0.45, `rgba(237,255,102,${visual.core1})`);
      glow.addColorStop(1, "rgba(237,255,102,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
      ctx.fill();

      // rings
      [1, 0.7, 0.4].forEach(scale => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(237,255,102,${visual.ring})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // crosshair
      ctx.strokeStyle = `rgba(237,255,102,${visual.cross})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

      // sweep sector
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, -0.55, 0.55);
      ctx.closePath();
      ctx.fillStyle = `rgba(237,255,102,${visual.sector})`;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.strokeStyle = `rgba(237,255,102,${visual.beam})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      // reactive blips
      blips.forEach(b => {
        const diff = ((b.a - angle) + Math.PI * 2) % (Math.PI * 2);
        if (diff < 1.2) {
          const alpha = (1 - diff / 1.2) * visual.blip;
          const bx = cx + Math.cos(b.a) * r * b.d;
          const by = cy + Math.sin(b.a) * r * b.d;
          ctx.beginPath();
          ctx.arc(bx, by, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(237,255,102,${alpha})`;
          ctx.shadowColor = "#EDFF66";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      angle = (angle + 0.02) % (Math.PI * 2);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      stopResizeObserver();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:active ? 0.98 : 0.66, pointerEvents:"none", transition:"opacity 0.2s ease" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   BATTLE SECTION — rebuilt with proper alignment + GSAP
═══════════════════════════════════════════════════════ */
function BattleSection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const vsRef = useRef(null);
  const [finding, setFinding] = useState(false);
  const [found, setFound] = useState("");
  const [matchProgress, setMatchProgress] = useState(0);
  const names = ["CodeMaster99","xAl9xr","bit_wizard","0xff_dev","AlgoKing_23"];

  const handleFind = () => {
    setFinding(true);
    setFound("");
    setMatchProgress(0);
    const interval = setInterval(() => {
      setMatchProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + Math.random() * 18;
      });
    }, 120);
    setTimeout(() => {
      clearInterval(interval);
      setMatchProgress(100);
      setFound(names[Math.floor(Math.random() * names.length)]);
      setFinding(false);
    }, 2000);
  };

  useGSAP(() => {
    // Section header slides up
    gsap.fromTo(".btl-header", { opacity:0, y:40 },
      { opacity:1, y:0, duration:0.85, ease:"power3.out", scrollTrigger:{ trigger:ref.current, start:"top 72%" } });

    // Left copy staggers in from left
    gsap.fromTo(".btl-left-item", { opacity:0, x:-44 },
      { opacity:1, x:0, duration:0.7, stagger:0.1, ease:"expo.out", scrollTrigger:{ trigger:".btl-inner", start:"top 75%" } });

    // Right panel slides up
    gsap.fromTo(".btl-right", { opacity:0, y:52, scale:0.97 },
      { opacity:1, y:0, scale:1, duration:0.85, ease:"expo.out", scrollTrigger:{ trigger:".btl-inner", start:"top 72%" }, delay:0.15 });

    // VS icon pulse loop
    gsap.to(vsRef.current, {
      scale:1.15, duration:0.9, ease:"sine.inOut", yoyo:true, repeat:-1,
    });
  }, { scope: ref });

  // Pulse found card in
  useEffect(() => {
    if (found) {
      gsap.fromTo(".btl-opponent-card",
        { scale:0.88, opacity:0 },
        { scale:1, opacity:1, duration:0.55, ease:"back.out(1.6)" });
    }
  }, [found]);

  return (
    <section ref={ref} style={{ background:"#09090b",padding:"80px 0 0" }}>

      {/* Section header */}
      <div className="btl-header" style={{ padding:"0 clamp(24px,5vw,72px)",marginBottom:48,display:"flex",alignItems:"center",gap:16 }}>
        <div style={{ height:1,background:"rgba(255,255,255,0.06)",flex:1 }} />
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <Swords size={12} color="#f87171"/>
          <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.24)" }}>Battle Arena</span>
          <div style={{ width:4,height:4,borderRadius:"50%",background:"#f87171",animation:"blink 1.1s step-end infinite" }} />
        </div>
        <div style={{ height:1,background:"rgba(255,255,255,0.06)",flex:1 }} />
      </div>

      {/* Main battle card */}
      <div className="btl-inner" style={{ margin:"0 clamp(24px,5vw,72px)",borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)",position:"relative",background:"#0b0b0e" }}>

        {/* Background decoration */}
        <div style={{ position:"absolute",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none" }}>
          <svg width="100%" height="100%" style={{ position:"absolute",inset:0,opacity:0.025 }} preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="diag" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="36" stroke="white" strokeWidth="1"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#diag)"/>
          </svg>
          <div style={{ position:"absolute",left:"-10%",top:"50%",transform:"translateY(-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle, rgba(248,113,113,0.06) 0%, transparent 70%)" }}/>
          <div style={{ position:"absolute",right:"-10%",top:"50%",transform:"translateY(-50%)",width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle, rgba(237,255,102,0.04) 0%, transparent 70%)" }}/>
        </div>

        <div style={{ position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"1fr 1px 1fr" }}>

          {/* LEFT — copy */}
          <div style={{ padding:"60px clamp(28px,5vw,64px)" }}>
            <div className="btl-left-item" style={{ marginBottom:20 }}>
              <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"5px 12px",borderRadius:8,background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)" }}>
                <div style={{ width:5,height:5,borderRadius:"50%",background:"#f87171",animation:"blink 1.1s step-end infinite" }} />
                <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.22em",textTransform:"uppercase",color:"#f87171" }}>ELO Ranked</span>
              </div>
            </div>

            <div className="btl-left-item" style={{ overflow:"hidden",marginBottom:4 }}>
              <h2 style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(2.4rem,4vw,4.2rem)",fontWeight:900,color:"#fff",letterSpacing:HOME_TYPO.letterSpacing.displayTight,lineHeight:0.9,margin:0 }}>
                Think you're
              </h2>
            </div>
            <div className="btl-left-item" style={{ overflow:"hidden",marginBottom:24 }}>
              <h2 style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(2.4rem,4vw,4.2rem)",fontWeight:900,letterSpacing:HOME_TYPO.letterSpacing.displayTight,lineHeight:0.9,margin:0 }}>
                <GlitchText style={{ color:"rgba(255,255,255,0.18)" }}>fast? Prove it.</GlitchText>
              </h2>
            </div>

            <p className="btl-left-item" style={{ fontSize:14,color:"rgba(255,255,255,0.3)",lineHeight:1.78,marginBottom:32,maxWidth:360 }}>
              Real-time 1v1 coding duels with ELO ranking. First to submit a passing solution wins. No hints. No mercy. Pure algorithmic speed.
            </p>

            <div className="btl-left-item" style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:32 }}>
              {[{l:"Ranked",c:"#f87171"},{l:"Casual",c:"#c4b5fd"},{l:"Group 3–8",c:"#34d399"}].map(({l,c})=>(
                <span key={l} style={{ padding:"5px 13px",borderRadius:8,fontSize:10,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:c,background:`${c}0f`,border:`1px solid ${c}22` }}>{l}</span>
              ))}
            </div>

            <div className="btl-left-item" style={{ display:"flex",gap:10 }}>
              <button onClick={()=>navigate("/battle")} data-cursor="FIGHT" style={{ height:46,padding:"0 26px",borderRadius:11,border:"none",cursor:"none",background:"#f87171",color:"#fff",fontSize:12,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,transition:"opacity 0.15s" }} onMouseEnter={e=>e.currentTarget.style.opacity="0.82"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                <Swords size={12}/> Enter Arena
              </button>
              <button onClick={()=>navigate("/battle")} data-cursor="PLAY" style={{ height:46,padding:"0 22px",borderRadius:11,cursor:"none",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",fontSize:12,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.36)",transition:"all 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.26)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="rgba(255,255,255,0.36)";}}>
                Casual
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ background:"rgba(255,255,255,0.05)" }} />

          {/* RIGHT — matchmaking widget */}
          <div className="btl-right" style={{ padding:"60px clamp(28px,5vw,64px)",display:"flex",flexDirection:"column",justifyContent:"center",gap:0 }}>

            {/* Matchmaking card */}
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"28px 28px 24px",marginBottom:14 }}>
              {/* Player row */}
              <div style={{ position:"relative",borderRadius:12,overflow:"hidden",marginBottom:24,background:finding?"rgba(237,255,102,0.04)":"transparent",border:finding?"1px solid rgba(237,255,102,0.2)":"1px solid transparent",transition:"all 0.2s" }}>
                <MatchSearchRadar active={finding} />
                {finding && <div style={{ position:"absolute",inset:0,background:"radial-gradient(circle at center, rgba(237,255,102,0.08) 0%, rgba(10,10,14,0.08) 78%)",pointerEvents:"none" }} />}
                {finding && (
                  <div style={{ position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",zIndex:2,fontSize:8,fontWeight:900,letterSpacing:"0.2em",textTransform:"uppercase",color:"#EDFF66",textShadow:"0 0 12px rgba(237,255,102,0.45)",pointerEvents:"none" }}>
                    Scanning...
                  </div>
                )}
                <div style={{ position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:16,padding:finding?"20px 8px 12px":"8px 4px" }}>

                {/* You */}
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
                  <div style={{ width:52,height:52,borderRadius:14,background:"rgba(196,181,253,0.1)",border:"1px solid rgba(196,181,253,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:HOME_TYPO.monumentFontFamily,fontWeight:900,fontSize:22,color:"#c4b5fd",letterSpacing:HOME_TYPO.letterSpacing.metric }}>Y</div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:900,color:"#fff",textAlign:"center",marginBottom:2 }}>You</div>
                    <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",textAlign:"center" }}>⚡ 1247 ELO</div>
                  </div>
                </div>

                {/* VS */}
                <div ref={vsRef} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,willChange:"transform" }}>
                  <div style={{ width:40,height:40,borderRadius:"50%",background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.25)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Swords size={15} color="#f87171"/>
                  </div>
                  <span style={{ fontSize:8,fontWeight:900,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)" }}>VS</span>
                </div>

                {/* Opponent */}
                <div className={found ? "btl-opponent-card" : ""} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
                  <div style={{ width:52,height:52,borderRadius:14,background:found?"rgba(248,113,113,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${found?"rgba(248,113,113,0.28)":"rgba(255,255,255,0.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:HOME_TYPO.monumentFontFamily,fontWeight:900,fontSize:22,color:found?"#f87171":"rgba(255,255,255,0.14)",transition:"all 0.35s" }}>
                    {finding
                      ? <div style={{ display:"flex",gap:3 }}>{[0,1,2].map(i=><div key={i} style={{ width:4,height:4,borderRadius:"50%",background:"#EDFF66",animation:"blink 0.8s step-end infinite",animationDelay:`${i*0.2}s` }}/>)}</div>
                      : found ? found[0].toUpperCase() : "?"
                    }
                  </div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:900,color:found?"#fff":"rgba(255,255,255,0.25)",textAlign:"center",marginBottom:2,transition:"color 0.3s" }}>{found||"Searching…"}</div>
                    {found
                      ? <div style={{ fontSize:10,color:"#34d399",textAlign:"center" }}>⚡ 1198 ELO</div>
                      : <div style={{ fontSize:10,color:"rgba(255,255,255,0.18)",textAlign:"center" }}>—</div>
                    }
                  </div>
                </div>
              </div>
              </div>

              {/* Progress bar */}
              {finding && (
                <div style={{ height:2,borderRadius:2,background:"rgba(255,255,255,0.07)",marginBottom:16,overflow:"hidden" }}>
                  <div style={{ height:"100%",background:"linear-gradient(90deg, #EDFF66, #34d399)",borderRadius:2,width:`${matchProgress}%`,transition:"width 0.12s ease" }} />
                </div>
              )}

              {/* Problem preview */}
              {found && (
                <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:9,fontWeight:900,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)",marginBottom:3 }}>Problem assigned</div>
                    <div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>Two Sum</div>
                  </div>
                  <span style={{ fontSize:9,padding:"3px 8px",borderRadius:6,fontWeight:900,letterSpacing:"0.08em",textTransform:"uppercase",background:"rgba(52,211,153,0.1)",color:"#34d399",border:"1px solid rgba(52,211,153,0.2)" }}>Easy</span>
                </div>
              )}

              {/* CTA button */}
              {found
                ? <button onClick={()=>navigate("/battle")} data-cursor="FIGHT" style={{ width:"100%",height:46,borderRadius:11,border:"none",cursor:"none",background:"linear-gradient(135deg, #f87171, #f43f5e)",color:"#fff",fontSize:12,fontWeight:900,letterSpacing:"0.14em",textTransform:"uppercase",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"opacity 0.15s",boxShadow:"0 0 32px rgba(248,113,113,0.22)" }} onMouseEnter={e=>e.currentTarget.style.opacity="0.86"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    <Swords size={13}/> Start Battle
                  </button>
                : <button onClick={handleFind} data-cursor="MATCH" disabled={finding} style={{ width:"100%",height:46,borderRadius:11,border:"none",cursor:"none",background:finding?"rgba(255,255,255,0.05)":"#EDFF66",color:finding?"rgba(255,255,255,0.3)":"#09090b",fontSize:12,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",transition:"all 0.25s",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                    {finding
                      ? <><div style={{ display:"flex",gap:3 }}>{[0,1,2].map(i=><div key={i} style={{ width:4,height:4,borderRadius:"50%",background:"rgba(255,255,255,0.3)",animation:"blink 0.8s step-end infinite",animationDelay:`${i*0.22}s` }}/>)}</div> Matching…</>
                      : "Find an Opponent"
                    }
                  </button>
              }
            </div>

            {/* Match info tags */}
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {["Avg wait: 8s","Global matchmaking","ELO ±150 range"].map(tag=>(
                <span key={tag} style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",padding:"3px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.07)" }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div style={{ height:80 }} />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════════════════ */
function HowItWorks() {
  const ref = useRef(null);
  useGSAP(() => {
    gsap.fromTo(".hiw-col", { opacity:0, x:-36 },
      { opacity:1, x:0, duration:0.7, stagger:0.14, ease:"power3.out", scrollTrigger:{ trigger:ref.current, start:"top 72%" } });
  }, { scope: ref });
  const steps = [
    { n:"01",icon:BookOpen,title:"Learn visually",   desc:"Pick any algorithm. Watch it run step by step. Understand the why, not the what.",color:"#c4b5fd" },
    { n:"02",icon:Code2,   title:"Practice hard",    desc:"Write real code. Submit. Get destroyed by hidden tests. Iterate. Get better.",color:"#34d399" },
    { n:"03",icon:Swords,  title:"Battle opponents", desc:"Live 1v1. ELO on the line. First to AC wins. Real pressure builds real speed.",color:"#f87171" },
    { n:"04",icon:Map,     title:"Conquer the world",desc:"Every solved problem is territory on the map. Document your dominance globally.",color:"#EDFF66" },
  ];
  return (
    <section ref={ref} style={{ background:"#09090b",padding:"80px clamp(24px,5vw,72px)" }}>
      <div style={{ maxWidth:1120,margin:"0 auto" }}>
        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:9,fontWeight:900,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",marginBottom:12 }}>- The Loop</div>
          <h2 style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(2.2rem,4.2vw,3.8rem)",fontWeight:900,color:"#fff",letterSpacing:HOME_TYPO.letterSpacing.displayTight,lineHeight:1,margin:0 }}>How Vantage works</h2>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          {steps.map((s, i) => (
            <div key={s.n} className="hiw-col" style={{ padding:"32px 24px 32px 0",paddingLeft:i>0?24:0,borderRight:i<3?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:22 }}>
                <div style={{ width:30,height:30,borderRadius:8,background:`${s.color}0f`,border:`1px solid ${s.color}22`,display:"flex",alignItems:"center",justifyContent:"center" }}><s.icon size={13} color={s.color}/></div>
                <span style={{ fontSize:10,fontWeight:900,letterSpacing:"0.14em",color:"rgba(255,255,255,0.14)" }}>{s.n}</span>
              </div>
              <h3 style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:18,fontWeight:900,color:"#fff",letterSpacing:HOME_TYPO.letterSpacing.displayTight,margin:"0 0 10px",lineHeight:1.1 }}>{s.title}</h3>
              <p style={{ fontSize:13,color:"rgba(255,255,255,0.28)",lineHeight:1.7,margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FINAL CTA
═══════════════════════════════════════════════════════ */
function FinalCTA() {
  const navigate = useNavigate();
  const ref = useRef(null);
  useGSAP(() => {
    gsap.fromTo(".fcta", { opacity:0, y:44 },
      { opacity:1, y:0, duration:0.9, stagger:0.12, ease:"power3.out", scrollTrigger:{ trigger:ref.current, start:"top 70%" } });
  }, { scope: ref });
  return (
    <section ref={ref} style={{ background:"#09090b",padding:"80px clamp(24px,5vw,72px) 0",overflow:"hidden" }}>
      <div style={{ borderRadius:18,overflow:"hidden",background:"#EDFF66",position:"relative" }}>
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",pointerEvents:"none" }}>
          <div style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(7rem,16vw,15rem)",fontWeight:900,color:"rgba(0,0,0,0.055)",letterSpacing:HOME_TYPO.letterSpacing.displayWide,lineHeight:1,whiteSpace:"nowrap",userSelect:"none" }}>VANTAGE</div>
        </div>
        <div style={{ position:"relative",zIndex:1,padding:"clamp(60px,8vh,96px) clamp(32px,6vw,92px)",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:26 }}>
          <div className="fcta" style={{ fontSize:9,fontWeight:900,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(0,0,0,0.32)" }}>- Start today. Free forever.</div>
          <h2 className="fcta" style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(3.2rem,6.5vw,6.5rem)",fontWeight:900,color:"#09090b",letterSpacing:HOME_TYPO.letterSpacing.displayTight,lineHeight:0.9,margin:0,maxWidth:780 }}>Your DSA journey<br/>starts here.</h2>
          <p className="fcta" style={{ fontSize:15,color:"rgba(0,0,0,0.42)",lineHeight:1.72,maxWidth:440,margin:0 }}>No credit card. No fluff. Just a platform built for coders who want to get dangerously good at algorithms.</p>
          <div className="fcta" style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            <button onClick={()=>navigate("/problems")} data-cursor="GO" style={{ height:50,padding:"0 30px",borderRadius:11,border:"none",cursor:"none",background:"#09090b",color:"#EDFF66",fontSize:12,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,transition:"opacity 0.15s" }} onMouseEnter={e=>e.currentTarget.style.opacity="0.78"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>Start for free <ArrowRight size={13}/></button>
            <button onClick={()=>navigate("/battle")} data-cursor="FIGHT" style={{ height:50,padding:"0 26px",borderRadius:11,cursor:"none",background:"rgba(0,0,0,0.09)",border:"1px solid rgba(0,0,0,0.14)",color:"rgba(0,0,0,0.46)",fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8,transition:"all 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,0,0,0.16)";e.currentTarget.style.color="rgba(0,0,0,0.76)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,0.09)";e.currentTarget.style.color="rgba(0,0,0,0.46)";}}>
              <Swords size={12}/> Jump into a battle
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ background:"#09090b",borderTop:"1px solid rgba(255,255,255,0.04)",overflow:"hidden" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:48,padding:"44px clamp(24px,5vw,72px) 36px",flexWrap:"wrap" }}>
        <div>
          <div onClick={()=>navigate("/")} data-cursor="HOME" style={{ display:"flex",alignItems:"center",gap:10,cursor:"none",marginBottom:12 }}>
            <Logo size={26} style={{ borderRadius: 6 }} />
            <span style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontWeight:900,fontSize:14,color:"#fff",letterSpacing:HOME_TYPO.letterSpacing.logo }}>VANTAGE</span>
          </div>
          <p style={{ fontSize:12,color:"rgba(255,255,255,0.18)",maxWidth:210,lineHeight:1.7 }}>Master DSA through visualization, practice, and competition.</p>
        </div>
        <div style={{ display:"flex",gap:52,flexWrap:"wrap" }}>
          {[
            { t:"Platform",items:[["Visualizer","/sorting"],["Problems","/problems"],["Battle","/battle"],["Map","/map"]] },
            { t:"Profile", items:[["Dashboard","/profile"],["Leaderboard","/leaderboard"],["Achievements","/achievements"],["Store","/store"]] },
          ].map(g=>(
            <div key={g.t}>
              <div style={{ fontSize:8,fontWeight:900,letterSpacing:"0.26em",textTransform:"uppercase",color:"rgba(255,255,255,0.16)",marginBottom:14 }}>{g.t}</div>
              <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
                {g.items.map(([n,p])=>(
                  <button key={n} onClick={()=>navigate(p)} style={{ background:"none",border:"none",cursor:"none",padding:0,textAlign:"left",fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.28)",transition:"color 0.15s" }} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.28)"}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflow:"hidden",lineHeight:0.82,padding:"0 clamp(24px,5vw,72px)" }}>
        <div style={{ fontFamily:HOME_TYPO.monumentFontFamily,fontSize:"clamp(4.5rem,13vw,12rem)",fontWeight:900,color:"rgba(255,255,255,0.028)",letterSpacing:HOME_TYPO.letterSpacing.displayWide,userSelect:"none" }}>VANTAGE</div>
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",padding:"16px clamp(24px,5vw,72px) 24px",flexWrap:"wrap",gap:8 }}>
        <span style={{ fontSize:10,color:"rgba(255,255,255,0.14)" }}>© 2026 Vantage. All rights reserved.</span>
        <span style={{ fontSize:10,color:"rgba(255,255,255,0.14)" }}>Built for developers who want to win.</span>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main style={{ background:"#09090b",width:"100vw",overflowX:"hidden",cursor:"none" }}>
      <Cursor />
      <Hero />
      <VizShowcase />
      <Features />
      <BattleSection />
      <HowItWorks />
      <FinalCTA />
      <Footer />
      <style>{`
        @font-face {
          font-family: 'Monument Extended';
          src: url('/fonts/MonumentExtended-Regular.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:0;}
        @keyframes ticker{0%{transform:translateX(0);}100%{transform:translateX(-33.333%);}}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.12;}}
        @media(max-width:1100px){
          .vs-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
        @media(max-width:640px){
          .vs-grid{grid-template-columns:1fr!important;}
        }
      `}</style>
    </main>
  );
}