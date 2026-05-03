import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Play, Terminal } from "lucide-react";
import { MONUMENT_TYPO as T } from "@/components/common/MonumentTypography";
import CustomCursor from "@/components/common/CustomCursor";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const C = {
  bg:       "#09090b",
  surface:  "#0c0c0f",
  elevated: "#111115",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.13)",
  accent:   "#EDFF66",
  accentDim:"rgba(237,255,102,0.12)",
  text:     "#fff",
  muted:    "rgba(255,255,255,0.35)",
  dim:      "rgba(255,255,255,0.14)",
  green:    "#34d399",
  red:      "#f87171",
  amber:    "#fbbf24",
  purple:   "#c4b5fd",
};

const QueenIcon = ({ size = 16, color = C.accent, glow = false, style }) => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      fontSize: size,
      lineHeight: 1,
      color,
      filter: glow
        ? `drop-shadow(0 0 6px ${color})`
        : `drop-shadow(0 0 4px rgba(237,255,102,0.5))`,
      ...style,
    }}
  >
    ♛
  </span>
);

/* ─────────────────────────────────────────────────────────────
   ALGORITHM
───────────────────────────────────────────────────────────── */
function generateHistory(n) {
  const history = [];
  let calls = 0, solutions = 0;

  const snap = (extra) => history.push({ calls, solutions, ...extra });

  const isSafe = (board, row, col) => {
    for (let i = 0; i < row; i++) {
      if (board[i] === col) return false;
      if (Math.abs(board[i] - col) === Math.abs(i - row)) return false;
    }
    return true;
  };

  const solve = (board, row) => {
    calls++;
    snap({ board: [...board], row, phase: "enter", line: 1 });
    if (row === n) {
      solutions++;
      snap({ board: [...board], row, phase: "solution", line: 3, isSolution: true,
        msg: `✓ Solution #${solutions} found — all ${n} queens placed safely.` });
      return;
    }
    for (let col = 0; col < n; col++) {
      snap({ board: [...board], row, col, phase: "try", line: 6,
        msg: `→ Try (row ${row}, col ${col})` });
      if (isSafe(board, row, col)) {
        board[row] = col;
        snap({ board: [...board], row, col, phase: "place", line: 8,
          msg: `✓ Safe — place queen at (${row}, ${col})` });
        solve(board, row + 1);
        board[row] = -1;
        snap({ board: [...board], row, col, phase: "backtrack", line: 10,
          msg: `↩ Backtrack — remove from (${row}, ${col})` });
      } else {
        snap({ board: [...board], row, col, phase: "conflict", line: 7,
          msg: `✗ Conflict at (${row}, ${col}) — skip` });
      }
    }
  };

  snap({ board: Array(n).fill(-1), row: -1, phase: "start", line: 0,
    msg: `Solving ${n}-Queens via backtracking…` });
  solve(Array(n).fill(-1), 0);
  snap({ board: Array(n).fill(-1), row: -1, phase: "done", line: 13,
    msg: `Complete. Found ${solutions} solution(s). Total recursive calls: ${calls}.` });

  return history;
}

/* ─────────────────────────────────────────────────────────────
   CODE PANEL
───────────────────────────────────────────────────────────── */
const CODE_LINES = [
  { n: 1,  t: "function ",    k: "kw",  rest: "solve(board, row) {"       },
  { n: 2,  t: "  calls++",    k: "dim", rest: ";"                          },
  { n: 3,  t: "  if ",        k: "kw",  rest: "(row === n) {"              },
  { n: 4,  t: "    solutions.push", k:"fn", rest: "(board);"               },
  { n: 5,  t: "    return",   k: "kw",  rest: ";"                          },
  { n: 6,  t: "  }",          k: "dim", rest: ""                           },
  { n: 7,  t: "  for ",       k: "kw",  rest: "(col = 0; col < n; col++) {"},
  { n: 8,  t: "    if ",      k: "kw",  rest: "(isSafe(board, row, col)) {"},
  { n: 9,  t: "      board[row] = col", k:"var", rest: ";" },
  { n: 10, t: "      solve",  k: "fn",  rest: "(board, row + 1);"          },
  { n: 11, t: "      board[row] = ", k:"var", rest: "-1; // backtrack"     },
  { n: 12, t: "    }",        k: "dim", rest: ""                           },
  { n: 13, t: "  }",          k: "dim", rest: ""                           },
  { n: 14, t: "}",            k: "dim", rest: ""                           },
];

const TOKEN_COLOR = { kw: "#c4b5fd", fn: "#34d399", var: "#fbbf24", dim: C.muted, "": C.text };

const LINE_MAP = { enter:1, solution:3, try:7, place:8, backtrack:10, conflict:7, start:0, done:13 };

function CodePanel({ activeLine }) {
  const activeRef = useRef(null);
  useEffect(() => { activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [activeLine]);

  return (
    <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 12, lineHeight: "22px", color: C.muted, overflowY: "auto", maxHeight: "100%", paddingBottom: 8 }}>
      {CODE_LINES.map(({ n, t, k, rest }) => {
        const active = activeLine === n;
        return (
          <div key={n} ref={active ? activeRef : null}
            style={{
              display: "flex", alignItems: "center", gap: 0,
              background: active ? C.accentDim : "transparent",
              borderLeft: active ? `2px solid ${C.accent}` : "2px solid transparent",
              paddingLeft: 0, transition: "background 0.15s, border-color 0.15s",
            }}>
            <span style={{ width: 36, textAlign: "right", paddingRight: 16, color: active ? C.accent : C.dim, flexShrink: 0, fontSize: 10, fontWeight: active ? 700 : 400 }}>
              {n}
            </span>
            <span style={{ color: TOKEN_COLOR[k] || C.text }}>{t}</span>
            <span style={{ color: C.text }}>{rest}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BOARD
───────────────────────────────────────────────────────────── */
function Board({ state }) {
  const { board = [], row: activeRow = -1, col: activeCol = -1, phase = "" } = state;
  const n = board.length;
  if (!n) return null;

  const CELL = Math.min(56, Math.floor(336 / n));

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div>
        {/* Col indices */}
        <div style={{ display: "flex", marginBottom: 2, paddingLeft: CELL }}>
          {Array.from({ length: n }, (_, c) => (
            <div key={c} style={{ width: CELL, textAlign: "center", fontSize: 9, fontFamily: "monospace", color: C.dim, fontWeight: 700, letterSpacing: "0.1em" }}>
              {c}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {/* Row indices */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {Array.from({ length: n }, (_, r) => (
              <div key={r} style={{ height: CELL, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, fontSize: 9, fontFamily: "monospace", color: r === activeRow ? C.accent : C.dim, fontWeight: r === activeRow ? 700 : 400, width: CELL, transition: "color 0.15s" }}>
                {r}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ border: `1px solid ${C.borderHi}` }}>
            {Array.from({ length: n }, (_, r) => (
              <div key={r} style={{ display: "flex" }}>
                {Array.from({ length: n }, (_, c) => {
                  const hasQueen  = board[r] === c;
                  const isLight   = (r + c) % 2 === 0;
                  const isTrying  = r === activeRow && c === activeCol && phase === "try";
                  const isPlace   = r === activeRow && c === activeCol && phase === "place";
                  const isConflict= r === activeRow && c === activeCol && phase === "conflict";
                  const isBT      = r === activeRow && c === activeCol && phase === "backtrack";
                  const isSol     = phase === "solution";

                  let bg = isLight ? "#131318" : "#0e0e12";
                  if (isTrying)   bg = "rgba(251,191,36,0.15)";
                  if (isPlace)    bg = "rgba(52,211,153,0.15)";
                  if (isConflict) bg = "rgba(248,113,113,0.15)";
                  if (isBT)       bg = "rgba(196,181,253,0.12)";
                  if (isSol)      bg = "rgba(237,255,102,0.06)";

                  let borderCol = C.border;
                  if (isTrying)   borderCol = "rgba(251,191,36,0.4)";
                  if (isPlace)    borderCol = "rgba(52,211,153,0.45)";
                  if (isConflict) borderCol = "rgba(248,113,113,0.4)";
                  if (isBT)       borderCol = "rgba(196,181,253,0.35)";

                  return (
                    <div key={c} style={{
                      width: CELL, height: CELL,
                      background: bg,
                      border: `1px solid ${borderCol}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.12s, border-color 0.12s",
                      position: "relative",
                    }}>
                      {hasQueen && (
                        <QueenIcon
                          size={CELL * 0.56}
                          color={C.accent}
                          glow={isSol}
                          style={{ transition: "color 0.2s" }}
                        />
                      )}
                      {/* Active col highlight dot */}
                      {r === activeRow && c === activeCol && !hasQueen && (
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: isTrying ? C.amber : isConflict ? C.red : C.purple, opacity: 0.8 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LEGEND
───────────────────────────────────────────────────────────── */
function Legend() {
  const items = [
    { col: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.4)",  label: "Trying"    },
    { col: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.45)", label: "Placed"    },
    { col: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)", label: "Conflict"  },
    { col: "rgba(196,181,253,0.12)", border: "rgba(196,181,253,0.35)",label: "Backtrack" },
    { col: "rgba(237,255,102,0.06)", border: C.accent,               label: "Solution"  },
  ];
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {items.map(({ col, border, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 12, background: col, border: `1px solid ${border}` }} />
          <span style={{ fontFamily: "monospace", fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAT BLOCK
───────────────────────────────────────────────────────────── */
function Stat({ label, value, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `2px solid ${color}`, padding: "12px 16px" }}>
      <div style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.dim, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 28, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PANEL WRAPPER — terminal window chrome
───────────────────────────────────────────────────────────── */
function Panel({ title, icon: Icon, accent = C.accent, children, style }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", ...style }}>
      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 5 }}>
          {["rgba(248,113,113,0.7)", "rgba(251,191,36,0.7)", "rgba(52,211,153,0.7)"].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ width: 1, height: 12, background: C.border, marginLeft: 4 }} />
        {Icon && <Icon size={11} style={{ color: accent }} />}
        <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted }}>
          {title}
        </span>
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOG LINE — scrolling terminal output
───────────────────────────────────────────────────────────── */
function TerminalLog({ msg, phase }) {
  const color = { solution: C.accent, place: C.green, conflict: C.red, backtrack: C.purple, done: C.accent, start: C.muted }[phase] || C.text;
  const prefix = { solution: "✓", place: "+", conflict: "✗", backtrack: "↩", done: "■", start: "▶", try: "→" }[phase] || "·";
  return (
    <div style={{ fontFamily: "monospace", fontSize: 11, color, lineHeight: "18px", display: "flex", gap: 8, padding: "1px 0" }}>
      <span style={{ color: C.dim, flexShrink: 0 }}>{prefix}</span>
      <span>{msg}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BLINKING CURSOR
───────────────────────────────────────────────────────────── */
function Cursor() {
  return <span style={{ display: "inline-block", width: 7, height: 13, background: C.accent, marginLeft: 2, animation: "nq-blink 1s step-end infinite", verticalAlign: "text-bottom" }} />;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const NQueensVisualizer = () => {
  const [history,     setHistory]     = useState([]);
  const [step,        setStep]        = useState(-1);
  const [nInput,      setNInput]      = useState("6");
  const [loaded,      setLoaded]      = useState(false);
  const [autoPlay,    setAutoPlay]    = useState(false);
  const [speed,       setSpeed]       = useState(80); // ms per step
  const logRef = useRef(null);
  const intervalRef = useRef(null);

  const load = () => {
    const n = parseInt(nInput);
    if (isNaN(n) || n < 1 || n > 8) return;
    const h = generateHistory(n);
    setHistory(h);
    setStep(0);
    setLoaded(true);
    setAutoPlay(false);
  };

  const reset = () => {
    setLoaded(false);
    setHistory([]);
    setStep(-1);
    setAutoPlay(false);
  };

  const fwd  = useCallback(() => setStep(s => Math.min(s + 1, history.length - 1)), [history.length]);
  const back = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  /* Auto-play */
  useEffect(() => {
    if (!autoPlay) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setStep(s => {
        if (s >= history.length - 1) { setAutoPlay(false); return s; }
        return s + 1;
      });
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [autoPlay, speed, history.length]);

  /* Keyboard */
  useEffect(() => {
    const h = (e) => {
      if (!loaded) return;
      if (e.key === "ArrowRight") fwd();
      if (e.key === "ArrowLeft")  back();
      if (e.key === " ")          { e.preventDefault(); setAutoPlay(p => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [loaded, fwd, back]);

  /* Scroll log to bottom on step change */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [step]);

  const state = history[step] || {};
  const activeLine = LINE_MAP[state.phase] ?? 0;
  const pct = history.length > 1 ? Math.round((step / (history.length - 1)) * 100) : 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "monospace", padding: "24px", cursor: "none" }}>
      <CustomCursor />

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 20 }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Terminal size={11} style={{ color: C.accent }} />
          <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: C.dim }}>
            Algorithm Visualizer · Backtracking
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          {/* Title */}
          <div>
            <h1 style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, margin: 0, color: C.text }}>
              N-QUEENS
            </h1>
            <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "-0.025em", lineHeight: 0.88, color: C.accent }}>
              SOLVER.
            </div>
          </div>

          {/* Control bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* N input */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, border: `1px solid ${C.borderHi}`, background: C.surface }}>
              <span style={{ padding: "0 10px", fontFamily: "monospace", fontSize: 11, color: C.accent, borderRight: `1px solid ${C.border}`, height: 36, display: "flex", alignItems: "center" }}>n =</span>
              <input type="number" min="1" max="8" value={nInput}
                onChange={e => setNInput(e.target.value)}
                disabled={loaded}
                style={{ width: 48, height: 36, background: "transparent", border: "none", outline: "none", padding: "0 10px", fontFamily: "monospace", fontSize: 13, color: C.text, textAlign: "center" }}
              />
            </div>

            {/* Load / Reset */}
            {!loaded ? (
              <button onClick={load} data-cursor="RUN"
                style={{ height: 36, padding: "0 18px", background: C.accent, border: "none", cursor: "none", fontFamily: "monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.bg, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 7 }}>
                <Play size={11} /> Run
              </button>
            ) : (
              <>
                {/* Back */}
                <button onClick={back} disabled={step <= 0} data-cursor="PREV"
                  style={{ width: 36, height: 36, background: C.surface, border: `1px solid ${C.border}`, cursor: "none", display: "flex", alignItems: "center", justifyContent: "center", color: step <= 0 ? C.dim : C.text, transition: "all 0.1s" }}>
                  <ChevronLeft size={14} />
                </button>

                {/* Play/Pause */}
                <button onClick={() => setAutoPlay(p => !p)} data-cursor={autoPlay ? "PAUSE" : "PLAY"}
                  style={{ height: 36, padding: "0 14px", background: autoPlay ? C.accentDim : C.surface, border: `1px solid ${autoPlay ? C.accent : C.border}`, cursor: "none", fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: autoPlay ? C.accent : C.muted, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
                  {autoPlay ? "⏸ Pause" : "▶ Play"}
                </button>

                {/* Fwd */}
                <button onClick={fwd} disabled={step >= history.length - 1} data-cursor="NEXT"
                  style={{ width: 36, height: 36, background: C.surface, border: `1px solid ${C.border}`, cursor: "none", display: "flex", alignItems: "center", justifyContent: "center", color: step >= history.length - 1 ? C.dim : C.text, transition: "all 0.1s" }}>
                  <ChevronRight size={14} />
                </button>

                {/* Speed */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${C.border}`, background: C.surface, padding: "0 10px", height: 36 }}>
                  <span style={{ fontSize: 9, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase" }}>spd</span>
                  <input type="range" min="20" max="400" value={400 - speed + 20}
                    onChange={e => setSpeed(400 - parseInt(e.target.value) + 20)}
                    style={{ width: 60, accentColor: C.accent, cursor: "none" }}
                  />
                </div>

                {/* Step counter */}
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.muted, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                  {step + 1}<span style={{ color: C.dim }}>/{history.length}</span>
                </span>

                {/* Reset */}
                <button onClick={reset} data-cursor="RESET"
                  style={{ width: 36, height: 36, background: C.surface, border: `1px solid ${C.border}`, cursor: "none", display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}>
                  <RotateCcw size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {loaded && (
          <div style={{ marginTop: 14, height: 2, background: C.border, position: "relative" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: C.accent, transition: "width 0.1s" }} />
          </div>
        )}
      </div>

      {/* ── SEPARATOR ── */}
      <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

      {!loaded ? (
        /* ── IDLE STATE ── */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16, textAlign: "center" }}>
          <QueenIcon size={36} color={C.accent} glow />
          <div>
            <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.15)", letterSpacing: "0.04em" }}>AWAITING INPUT</div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: C.dim, marginTop: 6 }}>
              Set <span style={{ color: C.accent }}>n</span> and press <span style={{ color: C.accent }}>Run</span> to start <Cursor />
            </div>
          </div>
        </div>
      ) : (
        /* ── MAIN LAYOUT ── */
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 200px", gridTemplateRows: "auto auto", gap: 10 }}>

          {/* ── CODE PANEL ── */}
          <Panel title="pseudocode.js" icon={Terminal} style={{ gridRow: "1 / 3", minHeight: 0 }}>
            <div style={{ padding: "12px 0 12px 0", flex: 1, overflow: "hidden" }}>
              <CodePanel activeLine={activeLine} />
            </div>
          </Panel>

          {/* ── BOARD ── */}
          <Panel title={`board · n=${state.board?.length ?? "?"}`} icon={QueenIcon} accent={C.accent}
            style={{ padding: 0 }}>
            <div style={{ padding: "20px 16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <Board state={state} />
              <Legend />
            </div>
          </Panel>

          {/* ── STATS ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Stat label="Recursive Calls" value={state.calls ?? 0} color={C.green} />
            <Stat label="Solutions Found" value={state.solutions ?? 0} color={C.accent} />
            <Stat label="Progress" value={`${pct}%`} color={C.purple} />
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "10px 12px", flex: 1 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: C.dim, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Phase</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color:
                { solution: C.accent, place: C.green, conflict: C.red, backtrack: C.purple, done: C.accent }[state.phase] || C.muted,
                letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700
              }}>
                {state.phase ?? "—"}
              </div>
              <div style={{ marginTop: 12, height: 1, background: C.border }} />
              <div style={{ fontFamily: "monospace", fontSize: 9, color: C.dim, marginTop: 10, letterSpacing: "0.08em" }}>
                row: <span style={{ color: C.muted }}>{state.row >= 0 ? state.row : "—"}</span><br/>
                col: <span style={{ color: C.muted }}>{state.col !== undefined ? state.col : "—"}</span><br/>
                line: <span style={{ color: C.accent }}>{activeLine}</span>
              </div>
            </div>
          </div>

          {/* ── TERMINAL LOG ── */}
          <Panel title="execution log" icon={Terminal} accent={C.green} style={{ gridColumn: "2 / 3" }}>
            <div ref={logRef} style={{ padding: "10px 14px", flex: 1, overflowY: "auto", maxHeight: 140 }}>
              {history.slice(0, step + 1).filter(s => s.msg).map((s, i) => (
                <TerminalLog key={i} msg={s.msg} phase={s.phase} />
              ))}
              {autoPlay && <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 11, color: C.dim, marginTop: 4 }}>
                <span>running</span><Cursor />
              </div>}
            </div>
          </Panel>

        </div>
      )}

      {/* ── COMPLEXITY FOOTER ── */}
      {loaded && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            {
              label: "Time Complexity",
              val: "O(n!)",
              color: C.amber,
              body: "Worst case explores all placements. Safety check prunes branches aggressively — far better than brute O(nⁿ). For n=8: 92 solutions from ~2,057 calls."
            },
            {
              label: "Space Complexity",
              val: "O(n)",
              color: C.green,
              body: "Recursion depth bounded by n. Board stored as 1D array of size n. Solution storage adds O(n×s) where s = solution count."
            },
          ].map(({ label, val, color, body }) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `2px solid ${color}`, padding: "14px 16px", display: "flex", gap: 16 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: C.dim, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 22, color, letterSpacing: "-0.01em" }}>{val}</div>
              </div>
              <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
              <p style={{ fontFamily: "monospace", fontSize: 10.5, color: C.muted, lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=range] { height: 2px; }
        @keyframes nq-blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
};

export default NQueensVisualizer;