import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import useBattleStore from "../stores/useBattleStore";
import { getStoredUser } from "../services/userApi";
import { fetchProblem as fetchJudgeProblem, runCode } from "../services/judgeApi";
import { resolveJudgeProblemId } from "../lib/judgeProblemIdResolver";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
} from "../components/ui/resizable";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "../components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "../components/ui/dropdown-menu";
import {
  Swords, Timer, AlertTriangle, CheckCircle2, XCircle,
  Loader2, Flag, ChevronLeft, ChevronRight, Play, Clock,
  Terminal, SquareTerminal, FlaskConical, BookOpen, ListChecks,
  RotateCcw, Copy, Check, Plus, X, ChevronDown, Braces,
  Code2, Zap, CircleDot, Hash, ArrowUpRight,
} from "lucide-react";
import CustomCursor from "../components/CustomCursor";
import { MONUMENT_TYPO } from "../components/MonumentTypography";
import "./judge/Judge.css";

const BATTLE_FONT_FAMILY = MONUMENT_TYPO.fontFamily;
const BATTLE_FONT_LETTER_SPACING = MONUMENT_TYPO.letterSpacing.monument;

const LANGUAGES = [
  { value: "cpp",  label: "C++",  monacoId: "cpp"  },
  { value: "java", label: "Java", monacoId: "java" },
];

/* ── Inline style constants ── */
const S = {
  bg:        "#09090b",
  surface:   "#0c0c0f",
  border:    "rgba(255,255,255,0.2)",
  borderSub: "rgba(255,255,255,0.16)",
  textPri:   "#ffffff",
  textSec:   "rgba(255,255,255,0.32)",
  textMeta:  "rgba(255,255,255,0.18)",
  acid:      "#EDFF66",
  red:       "#f87171",
  green:     "#34d399",
  amber:     "#fbbf24",
  violet:    "#c4b5fd",
};

/* ── Verdict config ── */
const VERDICT_CFG = {
  ACCEPTED:      { color: S.green,  bgColor: "rgba(52,211,153,0.08)",   border: "rgba(52,211,153,0.2)",  label: "Accepted"             },
  WRONG_ANSWER:  { color: S.red,    bgColor: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)", label: "Wrong Answer"         },
  TIME_LIMIT:    { color: S.amber,  bgColor: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.2)",  label: "Time Limit Exceeded"  },
  COMPILE_ERROR: { color: S.red,    bgColor: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)", label: "Compilation Error"    },
  RUNTIME_ERROR: { color: S.amber,  bgColor: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.2)",  label: "Runtime Error"        },
  ERROR:         { color: S.red,    bgColor: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.2)", label: "Error"                },
};

const STATUS_CFG = {
  Success: { color: S.green, bgColor: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)",  Icon: CheckCircle2 },
  Error:   { color: S.red,   bgColor: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", Icon: AlertTriangle },
  "Runtime Error": { color: S.amber, bgColor: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", Icon: AlertTriangle },
};

/* ════════════════════════════════════════════
   ARENA PAGE
════════════════════════════════════════════ */
export default function BattleArenaPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const user   = getStoredUser();
  const userId = user?.uid;

  const {
    battleState, submitting, error,
    startBattlePolling, stopBattlePolling, submitCode: battleSubmit, forfeit,
  } = useBattleStore();

  const [currentProblemIdx, setCurrentProblemIdx]     = useState(0);
  const [codeByProblem, setCodeByProblem]             = useState({});
  const [language, setLanguage]                       = useState("cpp");
  const [submitResult, setSubmitResult]               = useState(null);
  const [judgeProblemDetails, setJudgeProblemDetails] = useState({});
  const [leftTab, setLeftTab]                         = useState("description");
  const [bottomTab, setBottomTab]                     = useState("testcases");
  const [running, setRunning]                         = useState(false);
  const [runResult, setRunResult]                     = useState(null);
  const [copied, setCopied]                           = useState(false);
  const [activeTestCase, setActiveTestCase]           = useState(0);
  const [testCasesByProblem, setTestCasesByProblem]   = useState({});
  const editorRef = useRef(null);

  useEffect(() => {
    if (battleId && userId) startBattlePolling(Number(battleId), userId);
    return () => stopBattlePolling();
  }, [battleId, userId, startBattlePolling, stopBattlePolling]);

  useEffect(() => {
    if (battleState?.battleId !== Number(battleId)) return;

    if (battleState?.state === "COMPLETED") {
      stopBattlePolling();
      navigate(`/battle/result/${battleId}`);
      return;
    }

    if (battleState?.state === "CANCELLED") {
      stopBattlePolling();
      navigate("/battle", { replace: true });
    }
  }, [battleState?.state, battleState?.battleId, battleId, navigate, stopBattlePolling]);

  useEffect(() => {
    if (!battleState?.problems) return;
    battleState.problems.forEach((p) => {
      const jid = resolveJudgeProblemId({ judgeProblemId: p.judgeProblemId, title: p.title, fallbackId: p.judgeProblemId });
      if (jid && !judgeProblemDetails[jid]) {
        fetchJudgeProblem(jid).then((data) => {
          setJudgeProblemDetails(prev => ({ ...prev, [jid]: data }));
          setCodeByProblem(prev => {
            if (!prev[p.index] && data.boilerplate?.[language]) return { ...prev, [p.index]: data.boilerplate[language] };
            return prev;
          });
          if (data.sampleTestCases?.length) {
            setTestCasesByProblem(prev => {
              if (prev[p.index]) return prev;
              return { ...prev, [p.index]: data.sampleTestCases.map(tc => ({ input: tc.input, output: tc.output, isCustom: false })) };
            });
          }
        }).catch(() => {});
      }
    });
  }, [battleState?.problems]);

  const currentProblem  = battleState?.problems?.[currentProblemIdx];
  const currentJudgeId  = currentProblem ? resolveJudgeProblemId({ judgeProblemId: currentProblem.judgeProblemId, title: currentProblem.title, fallbackId: currentProblem.judgeProblemId }) : null;
  const judgeDetail     = currentJudgeId ? judgeProblemDetails[currentJudgeId] : null;
  const code            = codeByProblem[currentProblemIdx] || "";
  const testCases       = testCasesByProblem[currentProblemIdx] || [];
  const customInput     = testCases[activeTestCase]?.input || "";
  const currentLang     = LANGUAGES.find(l => l.value === language);
  const sampleCount     = judgeDetail?.sampleTestCases?.length || 0;

  const setCode = useCallback(
    (val) => setCodeByProblem(prev => ({ ...prev, [currentProblemIdx]: val })),
    [currentProblemIdx]
  );

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang);
    if (battleState?.problems) {
      battleState.problems.forEach(p => {
        const jid = resolveJudgeProblemId({ judgeProblemId: p.judgeProblemId, title: p.title, fallbackId: p.judgeProblemId });
        const detail = judgeProblemDetails[jid];
        if (detail?.boilerplate?.[lang]) {
          setCodeByProblem(prev => {
            const existing  = prev[p.index];
            const oldBoiler = detail.boilerplate?.[language];
            if (!existing || existing === oldBoiler) return { ...prev, [p.index]: detail.boilerplate[lang] };
            return prev;
          });
        }
      });
    }
  }, [battleState?.problems, judgeProblemDetails, language]);

  const handleResetCode   = () => { if (judgeDetail?.boilerplate?.[language]) setCode(judgeDetail.boilerplate[language]); };
  const handleCopyCode    = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleEditorMount = (editor) => { editorRef.current = editor; editor.focus(); };

  const updateActiveInput = (value) => {
    setTestCasesByProblem(prev => ({
      ...prev,
      [currentProblemIdx]: (prev[currentProblemIdx] || []).map((tc, i) => i === activeTestCase ? { ...tc, input: value } : tc),
    }));
  };

  const addCustomTestCase = () => {
    const last = testCases[testCases.length - 1];
    setTestCasesByProblem(prev => ({
      ...prev,
      [currentProblemIdx]: [...(prev[currentProblemIdx] || []), { input: last?.input || "", output: "", isCustom: true }],
    }));
    setActiveTestCase(testCases.length);
  };

  const removeTestCase = (idx) => {
    if (!testCases[idx]?.isCustom) return;
    setTestCasesByProblem(prev => ({
      ...prev,
      [currentProblemIdx]: (prev[currentProblemIdx] || []).filter((_, i) => i !== idx),
    }));
    setActiveTestCase(prev => Math.min(prev, testCases.length - 2));
  };

  const useFailedAsTestCase = (input, expected) => {
    setTestCasesByProblem(prev => ({
      ...prev,
      [currentProblemIdx]: [...(prev[currentProblemIdx] || []), { input, output: expected || "", isCustom: true }],
    }));
    setActiveTestCase(testCases.length);
    setBottomTab("testcases");
  };

  const handleRun = async () => {
    setRunning(true); setRunResult(null); setSubmitResult(null); setBottomTab("result");
    try { setRunResult(await runCode({ language, code, input: customInput })); }
    catch (err) { setRunResult({ status: "Error", stderr: err.message }); }
    finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    if (!currentProblem || !code) return;
    setSubmitResult(null); setRunResult(null); setLeftTab("results");
    try { setSubmitResult(await battleSubmit(Number(battleId), userId, currentProblemIdx, language, code)); }
    catch (e) { setSubmitResult({ verdict: "ERROR", error: e.message }); }
  };

  const handleForfeit = async () => {
    if (window.confirm("Are you sure you want to forfeit?")) {
      await forfeit(Number(battleId), userId);
      navigate(`/battle/result/${battleId}`);
    }
  };

  const timeRemaining = battleState?.timeRemainingMs ?? 0;
  const minutes       = Math.floor(timeRemaining / 60000);
  const seconds       = Math.floor((timeRemaining % 60000) / 1000);
  const timerUrgent   = timeRemaining < 60000;
  const timerWarn     = timeRemaining < 300000;

  const switchProblem = (idx) => {
    setCurrentProblemIdx(idx); setSubmitResult(null); setRunResult(null);
    setActiveTestCase(0); setLeftTab("description"); setBottomTab("testcases");
  };

  /* Loading */
  if (!battleState) {
    return (
      <div style={{ height: "100vh", background: S.bg, display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <Loader2 size={22} color="rgba(255,255,255,0.25)" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 13, color: S.textSec }}>Loading battle…</span>
        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const totalProblems = battleState.problems?.length ?? 0;
  const mySolved      = battleState.myProgress?.problemsSolved ?? 0;
  const oppSolved     = battleState.opponentProgress?.problemsSolved ?? 0;
  const timerColor    = timerUrgent ? S.red : timerWarn ? S.amber : S.textPri;
  const leaderUserId  = battleState?.leaderUserId;
  const leaderReason  = battleState?.leaderReason;
  const youLeading    = leaderUserId != null && Number(leaderUserId) === Number(userId);
  const leaderText    = leaderReason === "PROBLEMS_SOLVED"
    ? "Solved"
    : leaderReason === "SOLVE_TIME"
      ? "Time"
      : leaderReason === "SUBMISSIONS"
        ? "Submissions"
        : "Tied";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="cursor-visible-scope battle-heading-font" style={{ display: "flex", flexDirection: "column", height: "100vh",
        background: S.bg, color: S.textPri, overflow: "hidden", cursor: "none" }}>
        <CustomCursor />

        {/* ══════════ HEADER ══════════ */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 44, padding: "0 14px", flexShrink: 0,
          borderBottom: `1px solid ${S.border}`, background: S.bg, zIndex: 10 }}>

          {/* Left - timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Swords size={13} color="rgba(255,255,255,0.4)" />
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Battle</span>
            </div>
            <div style={{ width: 1, height: 14, background: S.border }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              fontFamily: "monospace", fontSize: 14, fontWeight: 900,
              color: timerColor, letterSpacing: "0.04em" }}>
              <Timer size={13} color={timerColor} />
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              {timerUrgent && (
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: S.red,
                  animation: "blink 0.8s step-end infinite" }} />
              )}
            </div>
          </div>

          {/* Center - problem tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: 3,
            borderRadius: 11, background: "rgba(255,255,255,0.03)", border: `1px solid ${S.border}` }}>
            {battleState.problems?.map((p, i) => (
              <button key={i} onClick={() => switchProblem(i)} style={{
                position: "relative", padding: "5px 14px", borderRadius: 8, border: "none", cursor: "none",
                fontSize: 11, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase",
                background: currentProblemIdx === i ? "rgba(255,255,255,0.1)" : "transparent",
                color: currentProblemIdx === i ? "#fff" : "rgba(255,255,255,0.32)",
                transition: "all 0.15s",
              }}>
                P{i + 1}
                {p.isSolved && (
                  <div style={{ position: "absolute", top: 2, right: 2, width: 5, height: 5,
                    borderRadius: "50%", background: S.green,
                    boxShadow: `0 0 4px ${S.green}` }} />
                )}
              </button>
            ))}
          </div>

          {/* Right - progress + forfeit */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* You */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.16em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>You</span>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: totalProblems }).map((_, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%",
                    background: i < mySolved ? S.acid : "rgba(255,255,255,0.1)",
                    boxShadow: i < mySolved ? `0 0 5px rgba(237,255,102,0.6)` : "none",
                    transition: "background 0.3s, box-shadow 0.3s" }} />
                ))}
              </div>
            </div>
            <div style={{ width: 1, height: 12, background: S.border }} />
            {/* Opp */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.16em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Opp</span>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: totalProblems }).map((_, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%",
                    background: i < oppSolved ? S.red : "rgba(255,255,255,0.1)",
                    transition: "background 0.3s" }} />
                ))}
              </div>
            </div>
            <div style={{ width: 1, height: 12, background: S.border }} />
            <div title={leaderReason ? `Current leader by ${leaderText.toLowerCase()}` : "Currently tied"} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8,
              border: leaderReason && leaderReason !== "TIED"
                ? `1px solid ${youLeading ? "rgba(52,211,153,0.28)" : "rgba(248,113,113,0.28)"}`
                : `1px solid ${S.border}`,
              background: leaderReason && leaderReason !== "TIED"
                ? (youLeading ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)")
                : "rgba(255,255,255,0.02)",
              color: leaderReason && leaderReason !== "TIED"
                ? (youLeading ? S.green : S.red)
                : "rgba(255,255,255,0.3)",
              fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase"
            }}>
              <Clock size={10} />
              {leaderReason && leaderReason !== "TIED"
                ? `${youLeading ? "You" : "Opp"} lead`
                : "Tied"}
            </div>
            <div style={{ width: 1, height: 12, background: S.border }} />
            <button onClick={handleForfeit} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
              borderRadius: 8, border: "none", cursor: "none", background: "transparent",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.28)",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = S.red; e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.28)"; e.currentTarget.style.background = "transparent"; }}
            >
              <Flag size={12} /> Forfeit
            </button>
          </div>
        </header>

        {/* ══════════ WORKSPACE ══════════ */}
        <ResizablePanelGroup orientation="horizontal" style={{ flex: 1, minHeight: 0 }}>

          {/* ── LEFT: Problem + Results ── */}
          <ResizablePanel id="left" defaultSize="40%" minSize="25%" maxSize="55%">
            <div style={{ display: "flex", flexDirection: "column", height: "100%",
              background: S.surface, borderRight: `1px solid ${S.border}` }}>
              <Tabs value={leftTab} onValueChange={setLeftTab} style={{ display: "flex", flexDirection: "column", height: "100%" }}>

                {/* Tab bar */}
                <div style={{ display: "flex", alignItems: "center",
                  borderBottom: `1px solid ${S.border}`, padding: "0 4px", flexShrink: 0, background: S.bg }}>
                  <TabsList style={{ background: "transparent", height: 38, padding: 0, display: "flex", gap: 0 }}>
                    {[
                      { value: "description", Icon: BookOpen,   label: "Description" },
                      { value: "results",     Icon: ListChecks, label: "Results",
                        dot: submitResult ? (submitResult.verdict === "ACCEPTED" ? S.green : S.red) : null },
                    ].map(tab => (
                      <TabsTrigger key={tab.value} value={tab.value}
                        style={{ display: "flex", alignItems: "center", gap: 5,
                          padding: "0 12px", height: 38, borderRadius: 0, border: "none",
                          background: "transparent", cursor: "none",
                          fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                          color: leftTab === tab.value ? "#fff" : "rgba(255,255,255,0.28)",
                          borderBottom: leftTab === tab.value ? `1px solid ${S.acid}` : "1px solid transparent",
                          transition: "color 0.15s, border-color 0.15s",
                          marginBottom: -1,
                        }}>
                        <tab.Icon size={12} />
                        {tab.label}
                        {tab.dot && <div style={{ width: 5, height: 5, borderRadius: "50%", background: tab.dot }} />}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Description */}
                <TabsContent value="description" style={{ flex: 1, overflow: "hidden", margin: 0 }}>
                  <ScrollArea style={{ height: "100%" }}>
                    <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 22 }}>

                      {/* Problem header */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
                            textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                            Problem {currentProblemIdx + 1} of {totalProblems}
                          </span>
                          {currentProblem?.isSolved && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9,
                              fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
                              color: S.green, background: "rgba(52,211,153,0.08)",
                              border: "1px solid rgba(52,211,153,0.2)", padding: "2px 7px", borderRadius: 6 }}>
                              <CheckCircle2 size={9} /> Solved
                            </span>
                          )}
                        </div>
                        <h2 style={{ fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING,
                          fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.2, margin: 0 }}>
                          {judgeDetail?.title || currentProblem?.title || `Problem ${currentProblemIdx + 1}`}
                        </h2>
                      </div>

                      {/* Description text */}
                      <div style={{ fontSize: 13, lineHeight: 1.75, color: S.textSec }}>
                        {(judgeDetail?.description || currentProblem?.description || "Loading…")
                          .split("\n").map((line, i) => (
                            <p key={i} style={{ margin: line ? "0 0 6px" : "0 0 10px" }}>{line}</p>
                          ))}
                      </div>

                      {/* Examples */}
                      {judgeDetail?.examples?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <h3 style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
                            textTransform: "uppercase", color: "rgba(255,255,255,0.22)", margin: 0 }}>Examples</h3>
                          {judgeDetail.examples.map((ex, i) => (
                            <div key={i} style={{ borderRadius: 11, border: `1px solid ${S.borderSub}`, overflow: "hidden" }}>
                              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${S.borderSub}`,
                                background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 6 }}>
                                <Hash size={11} color="rgba(255,255,255,0.25)" />
                                <span style={{ fontSize: 10, fontWeight: 700, color: S.textMeta }}>Example {i + 1}</span>
                              </div>
                              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                                {[["Input", ex.input], ["Output", ex.output]].map(([label, val]) => (
                                  <div key={label}>
                                    <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
                                      textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 5 }}>{label}</div>
                                    <code style={{ display: "block", fontFamily: "'JetBrains Mono',monospace",
                                      fontSize: 12, background: S.bg, border: `1px solid ${S.border}`,
                                      borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,0.7)",
                                      whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{val}</code>
                                  </div>
                                ))}
                                {ex.explanation && (
                                  <div style={{ paddingTop: 8, borderTop: `1px solid ${S.borderSub}` }}>
                                    <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
                                      textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 5 }}>Explanation</div>
                                    <span style={{ fontSize: 12, color: S.textSec, lineHeight: 1.65 }}>{ex.explanation}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Constraints */}
                      {judgeDetail?.constraints?.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
                            textTransform: "uppercase", color: "rgba(255,255,255,0.22)", margin: "0 0 10px" }}>Constraints</h3>
                          <div style={{ border: `1px solid ${S.borderSub}`, borderRadius: 10,
                            background: "rgba(255,255,255,0.015)", padding: "10px 14px",
                            display: "flex", flexDirection: "column", gap: 6 }}>
                            {judgeDetail.constraints.map((c, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                <div style={{ width: 4, height: 4, borderRadius: "50%",
                                  background: "rgba(255,255,255,0.2)", marginTop: 6, flexShrink: 0 }} />
                                <code style={{ fontFamily: "'JetBrains Mono',monospace",
                                  fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{c}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prev / Next */}
                      {totalProblems > 1 && (
                        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                          <button disabled={currentProblemIdx === 0} onClick={() => switchProblem(currentProblemIdx - 1)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                              borderRadius: 8, border: "none", cursor: "none", background: "transparent",
                              fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                              color: currentProblemIdx === 0 ? "rgba(255,255,255,0.1)" : S.textSec }}>
                            <ChevronLeft size={13} /> Prev
                          </button>
                          <button disabled={currentProblemIdx >= totalProblems - 1} onClick={() => switchProblem(currentProblemIdx + 1)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                              borderRadius: 8, border: "none", cursor: "none", background: "transparent",
                              fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                              color: currentProblemIdx >= totalProblems - 1 ? "rgba(255,255,255,0.1)" : S.textSec }}>
                            Next <ChevronRight size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Results */}
                <TabsContent value="results" style={{ flex: 1, overflow: "hidden", margin: 0 }}>
                  <ScrollArea style={{ height: "100%" }}>
                    <div style={{ padding: "18px 20px" }}>
                      {!submitResult && !runResult && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center", padding: "48px 0", gap: 12, textAlign: "center" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${S.borderSub}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Terminal size={16} color="rgba(255,255,255,0.2)" />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>No results yet</div>
                            <div style={{ fontSize: 12, color: S.textMeta }}>Run or submit your code to see results</div>
                          </div>
                        </div>
                      )}

                      {runResult && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <StatusBanner status={runResult.status} time={runResult.time} />
                          {runResult.stdout && <CodeOutput label="Standard Output" icon={<SquareTerminal size={11} />}>{runResult.stdout}</CodeOutput>}
                          {runResult.stderr && <CodeOutput label="Error Output" variant="error" icon={<AlertTriangle size={11} />}>{runResult.stderr}</CodeOutput>}
                        </div>
                      )}

                      {submitResult && !runResult && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <BattleVerdictBanner result={submitResult} />
                          {submitResult.error && <CodeOutput variant="error">{submitResult.error}</CodeOutput>}

                          {submitResult.totalProblems > 0 && (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: "#fff" }}>
                                  <strong style={{ fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontWeight: 900 }}>{submitResult.problemsSolved}</strong>
                                  <span style={{ color: S.textSec }}> / {submitResult.totalProblems} solved</span>
                                </span>
                              </div>
                              <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", borderRadius: 3, transition: "width 0.8s ease-out",
                                  width: `${(submitResult.problemsSolved / submitResult.totalProblems) * 100}%`,
                                  background: submitResult.verdict === "ACCEPTED" ? "#10b981" : "#ef4444",
                                }} />
                              </div>
                            </div>
                          )}

                          {submitResult.firstFailedInput != null && (
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
                                textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 10 }}>Last Executed Test</div>
                              <div style={{ borderRadius: 11, border: `1px solid ${S.borderSub}`, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "9px 14px", borderBottom: `1px solid ${S.borderSub}`, background: "rgba(255,255,255,0.02)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <XCircle size={13} color={S.red} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: S.red }}>Wrong Answer</span>
                                  </div>
                                  <button onClick={() => useFailedAsTestCase(submitResult.firstFailedInput, submitResult.firstFailedExpected)}
                                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                                      borderRadius: 7, border: "none", cursor: "none",
                                      background: "rgba(237,255,102,0.08)", border: "1px solid rgba(237,255,102,0.15)",
                                      fontSize: 10, fontWeight: 800, color: S.acid, transition: "opacity 0.15s" }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                  >
                                    <ArrowUpRight size={11} /> Debug
                                  </button>
                                </div>
                                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                                  <CodeOutput label="Input">{submitResult.firstFailedInput}</CodeOutput>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <CodeOutput label="Expected" labelColor={S.green}>{submitResult.firstFailedExpected}</CodeOutput>
                                    <CodeOutput label="Your Output" labelColor={S.red} variant="error">{submitResult.firstFailedActual}</CodeOutput>
                                  </div>
                                  {submitResult.firstFailedError && (
                                    <CodeOutput label="Runtime Error" variant="error">{submitResult.firstFailedError}</CodeOutput>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle orientation="horizontal" withHandle />

          {/* ── RIGHT: Editor + Testcases ── */}
          <ResizablePanel id="right" defaultSize="60%" minSize="35%">
            <ResizablePanelGroup orientation="vertical">

              {/* Editor */}
              <ResizablePanel id="right-top" defaultSize="60%" minSize="25%">
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

                  {/* Toolbar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    height: 40, padding: "0 10px", flexShrink: 0,
                    borderBottom: `1px solid ${S.border}`, background: S.bg }}>

                    {/* Language picker */}
                    <DropdownMenu>
                      <DropdownMenuTrigger style={{ display: "flex", alignItems: "center", gap: 6,
                        padding: "4px 10px", borderRadius: 8, border: `1px solid ${S.border}`,
                        background: "transparent", cursor: "none",
                        fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)",
                        transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
                      >
                        <Braces size={11} color="rgba(255,255,255,0.4)" />
                        {currentLang?.label}
                        <ChevronDown size={11} color="rgba(255,255,255,0.3)" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" style={{ background: "#0d0d10", border: `1px solid ${S.border}`,
                        borderRadius: 10, padding: 4, minWidth: 140 }}>
                        <DropdownMenuLabel style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
                          textTransform: "uppercase", color: S.textMeta, padding: "4px 8px" }}>Language</DropdownMenuLabel>
                        <DropdownMenuSeparator style={{ background: S.border, margin: "4px 0" }} />
                        {LANGUAGES.map(l => (
                          <DropdownMenuItem key={l.value} onClick={() => handleLanguageChange(l.value)}
                            style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 8px",
                              borderRadius: 7, cursor: "none", fontSize: 12, fontWeight: 600,
                              color: language === l.value ? S.acid : "rgba(255,255,255,0.5)",
                              background: "transparent", transition: "background 0.1s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <Braces size={11} />
                            {l.label}
                            {language === l.value && <Check size={11} style={{ marginLeft: "auto" }} />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Right side buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {/* Reset */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={handleResetCode}
                            style={{ width: 28, height: 28, borderRadius: 7, border: "none", cursor: "none",
                              background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                              color: "rgba(255,255,255,0.3)", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                          ><RotateCcw size={13} /></button>
                        </TooltipTrigger>
                        <TooltipContent style={{ fontSize: 11, background: "#0d0d10", border: `1px solid ${S.border}`, borderRadius: 7 }}>Reset to boilerplate</TooltipContent>
                      </Tooltip>

                      {/* Copy */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={handleCopyCode}
                            style={{ width: 28, height: 28, borderRadius: 7, border: "none", cursor: "none",
                              background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                              color: copied ? S.green : "rgba(255,255,255,0.3)", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; if (!copied) e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = copied ? S.green : "rgba(255,255,255,0.3)"; }}
                          >{copied ? <Check size={13} /> : <Copy size={13} />}</button>
                        </TooltipTrigger>
                        <TooltipContent style={{ fontSize: 11, background: "#0d0d10", border: `1px solid ${S.border}`, borderRadius: 7 }}>
                          {copied ? "Copied!" : "Copy code"}
                        </TooltipContent>
                      </Tooltip>

                      <div style={{ width: 1, height: 14, background: S.border, margin: "0 4px" }} />

                      {/* Run */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={handleRun} disabled={running || submitting}
                            style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 12px",
                              borderRadius: 7, cursor: "none", border: `1px solid ${S.border}`, background: "transparent",
                              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)",
                              opacity: (running || submitting) ? 0.4 : 1, transition: "all 0.15s" }}
                            onMouseEnter={e => { if (!running && !submitting) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.background = "transparent"; }}
                          >
                            {running ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={12} />}
                            Run
                          </button>
                        </TooltipTrigger>
                        <TooltipContent style={{ fontSize: 11, background: "#0d0d10", border: `1px solid ${S.border}`, borderRadius: 7 }}>Run against active test case</TooltipContent>
                      </Tooltip>

                      {/* Submit */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={handleSubmit} disabled={submitting || running || currentProblem?.isSolved}
                            style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 14px",
                              borderRadius: 7, cursor: "none", border: "none",
                              background: S.acid, color: "#09090b",
                              fontSize: 11, fontWeight: 900, letterSpacing: "0.06em",
                              opacity: (submitting || running || currentProblem?.isSolved) ? 0.45 : 1,
                              transition: "opacity 0.15s", marginLeft: 2 }}
                            onMouseEnter={e => { if (!submitting && !running && !currentProblem?.isSolved) e.currentTarget.style.opacity = "0.82"; }}
                            onMouseLeave={e => e.currentTarget.style.opacity = (submitting || running || currentProblem?.isSolved) ? "0.45" : "1"}
                          >
                            {submitting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={12} />}
                            Submit
                          </button>
                        </TooltipTrigger>
                        <TooltipContent style={{ fontSize: 11, background: "#0d0d10", border: `1px solid ${S.border}`, borderRadius: 7 }}>Submit against all test cases</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Monaco */}
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Editor
                      height="100%"
                      language={currentLang?.monacoId || "cpp"}
                      theme="vs-dark"
                      value={code}
                      onChange={(val) => setCode(val || "")}
                      onMount={handleEditorMount}
                      options={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',Consolas,monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: "on",
                        padding: { top: 12, bottom: 12 },
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        lineNumbersMinChars: 3,
                        renderLineHighlight: "line",
                        cursorBlinking: "smooth",
                        smoothScrolling: true,
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true },
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle orientation="vertical" />

              {/* Bottom: Testcases / Output */}
              <ResizablePanel id="right-bottom" defaultSize="40%" minSize="15%" maxSize="60%">
                <div style={{ display: "flex", flexDirection: "column", height: "100%", background: S.bg }}>
                  <Tabs value={bottomTab} onValueChange={setBottomTab} style={{ display: "flex", flexDirection: "column", height: "100%" }}>

                    {/* Tab bar */}
                    <div style={{ display: "flex", alignItems: "center",
                      borderBottom: `1px solid ${S.border}`, padding: "0 4px", flexShrink: 0 }}>
                      <TabsList style={{ background: "transparent", height: 36, padding: 0, display: "flex", gap: 0 }}>
                        {[
                          { value: "testcases", Icon: FlaskConical,    label: "Testcases" },
                          { value: "result",    Icon: SquareTerminal,  label: "Output",
                            dot: (runResult || submitResult)
                              ? (runResult?.status === "Success" || submitResult?.verdict === "ACCEPTED" ? S.green : S.red)
                              : null },
                        ].map(tab => (
                          <TabsTrigger key={tab.value} value={tab.value}
                            style={{ display: "flex", alignItems: "center", gap: 5,
                              padding: "0 12px", height: 36, borderRadius: 0, border: "none",
                              background: "transparent", cursor: "none",
                              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                              color: bottomTab === tab.value ? "#fff" : "rgba(255,255,255,0.28)",
                              borderBottom: bottomTab === tab.value ? `1px solid ${S.acid}` : "1px solid transparent",
                              transition: "color 0.15s, border-color 0.15s", marginBottom: -1,
                            }}>
                            <tab.Icon size={12} />
                            {tab.label}
                            {tab.dot && <div style={{ width: 5, height: 5, borderRadius: "50%", background: tab.dot }} />}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {/* Testcases */}
                    <TabsContent value="testcases" style={{ flex: 1, overflow: "hidden", margin: 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Test case tabs row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5,
                          padding: "8px 12px", flexShrink: 0, flexWrap: "wrap" }}>
                          {testCases.map((tc, idx) => (
                            <div key={idx} style={{ position: "relative" }}>
                              <button onClick={() => setActiveTestCase(idx)}
                                style={{ display: "flex", alignItems: "center", gap: 5,
                                  padding: "4px 10px", borderRadius: 7, border: "none", cursor: "none",
                                  fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                                  background: activeTestCase === idx ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                                  outline: activeTestCase === idx
                                    ? tc.isCustom ? `1px solid rgba(237,255,102,0.2)` : `1px solid ${S.border}`
                                    : "1px solid rgba(255,255,255,0.04)",
                                  color: activeTestCase === idx ? "#fff" : "rgba(255,255,255,0.35)" }}>
                                <CircleDot size={9} />
                                {tc.isCustom ? `Custom ${idx - sampleCount + 1}` : `Case ${idx + 1}`}
                              </button>
                              {tc.isCustom && (
                                <button onClick={(e) => { e.stopPropagation(); removeTestCase(idx); }}
                                  style={{ position: "absolute", top: -3, right: -3, width: 13, height: 13,
                                    borderRadius: "50%", border: `1px solid ${S.border}`,
                                    background: "#0c0c0f", cursor: "none", display: "none",
                                    alignItems: "center", justifyContent: "center",
                                    fontSize: 7, color: "rgba(255,255,255,0.4)", transition: "color 0.15s" }}
                                  onMouseEnter={e => { e.currentTarget.style.display = "flex"; e.currentTarget.style.color = S.red; }}
                                  className="test-remove-btn"
                                >
                                  <X size={8} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button onClick={addCustomTestCase}
                            style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${S.border}`,
                              background: "transparent", cursor: "none", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              color: "rgba(255,255,255,0.3)", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                          ><Plus size={11} /></button>
                        </div>

                        <ScrollArea style={{ flex: 1, padding: "0 12px 12px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
                                textTransform: "uppercase", color: S.textMeta, marginBottom: 6 }}>Input</div>
                              <textarea
                                value={testCases[activeTestCase]?.input || ""}
                                onChange={(e) => updateActiveInput(e.target.value)}
                                placeholder="Enter test input…"
                                spellCheck={false}
                                style={{ width: "100%", minHeight: 80, borderRadius: 9,
                                  border: `1px solid ${S.border}`, background: S.surface,
                                  padding: "8px 12px", fontFamily: "'JetBrains Mono',monospace",
                                  fontSize: 12, color: "rgba(255,255,255,0.7)", outline: "none",
                                  resize: "vertical", lineHeight: 1.65, transition: "border-color 0.15s" }}
                                onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"}
                                onBlur={e => e.currentTarget.style.borderColor = S.border}
                              />
                            </div>
                            {testCases[activeTestCase]?.output && (
                              <div>
                                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
                                  textTransform: "uppercase", color: S.textMeta, marginBottom: 6 }}>Expected Output</div>
                                <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                                  background: S.surface, border: `1px solid ${S.border}`,
                                  borderRadius: 9, padding: "8px 12px", color: "rgba(255,255,255,0.7)",
                                  whiteSpace: "pre-wrap", lineHeight: 1.65, margin: 0 }}>
                                  {testCases[activeTestCase].output}
                                </pre>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>

                    {/* Output */}
                    <TabsContent value="result" style={{ flex: 1, overflow: "hidden", margin: 0 }}>
                      <ScrollArea style={{ height: "100%", padding: "12px 14px" }}>
                        {!runResult && !submitResult && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", padding: "32px 0", gap: 8, textAlign: "center" }}>
                            <SquareTerminal size={16} color="rgba(255,255,255,0.18)" />
                            <span style={{ fontSize: 12, color: S.textMeta }}>Run your code to see output</span>
                          </div>
                        )}
                        {runResult && (
                          <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                            <StatusBanner status={runResult.status} time={runResult.time} compact />
                            {runResult.stdout && <CodeOutput label="Stdout" icon={<SquareTerminal size={10} />}>{runResult.stdout}</CodeOutput>}
                            {runResult.stderr && <CodeOutput label="Stderr" variant="error" icon={<AlertTriangle size={10} />}>{runResult.stderr}</CodeOutput>}
                          </div>
                        )}
                        {submitResult && !runResult && (
                          <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                            <BattleVerdictBanner result={submitResult} compact />
                            {submitResult.error && <CodeOutput variant="error">{submitResult.error}</CodeOutput>}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes spin  { 0%{transform:rotate(0deg)}  100%{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.1} }
      `}</style>
    </TooltipProvider>
  );
}

/* ── Sub-components ── */

function StatusBanner({ status, time, compact }) {
  const cfg  = STATUS_CFG[status] || STATUS_CFG.Error;
  const Icon = cfg.Icon;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10,
      borderRadius: 10, border: `1px solid ${cfg.border}`,
      background: cfg.bgColor, padding: compact ? "7px 12px" : "9px 14px" }}>
      <Icon size={compact ? 14 : 16} color={cfg.color} />
      <span style={{ fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING,
        fontWeight: 900, fontSize: compact ? 13 : 14, color: cfg.color, flex: 1 }}>{status}</span>
      {time > 0 && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700,
          color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: 6,
          fontFamily: "monospace" }}>
          <Clock size={10} /> {time}ms
        </span>
      )}
    </div>
  );
}

function BattleVerdictBanner({ result, compact }) {
  const cfg  = VERDICT_CFG[result.verdict] || VERDICT_CFG.ERROR;
  const Icon = result.verdict === "ACCEPTED" ? CheckCircle2 : AlertTriangle;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10,
      borderRadius: 10, border: `1px solid ${cfg.border}`,
      background: cfg.bgColor, padding: compact ? "7px 12px" : "9px 14px" }}>
      <Icon size={compact ? 14 : 16} color={cfg.color} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING,
          fontWeight: 900, fontSize: compact ? 13 : 14, color: cfg.color }}>{cfg.label}</div>
        {!compact && result.executionTimeMs > 0 && (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
            Executed in {result.executionTimeMs}ms
          </div>
        )}
      </div>
      {result.executionTimeMs > 0 && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700,
          color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: 6,
          fontFamily: "monospace" }}>
          <Clock size={10} /> {result.executionTimeMs}ms
        </span>
      )}
    </div>
  );
}

function CodeOutput({ label, variant, labelColor, icon, children }) {
  const isErr = variant === "error";
  return (
    <div>
      {label && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5,
          fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase",
          color: labelColor || (isErr ? "#f87171" : "rgba(255,255,255,0.22)") }}>
          {icon}{label}
        </div>
      )}
      <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
        borderRadius: 9, border: `1px solid ${isErr ? "rgba(248,113,113,0.15)" : S.borderSub}`,
        background: isErr ? "rgba(127,29,29,0.2)" : S.surface,
        padding: "8px 12px", color: isErr ? "#fca5a5" : "rgba(255,255,255,0.65)",
        whiteSpace: "pre-wrap", lineHeight: 1.65, margin: 0, overflowX: "auto" }}>
        {children}
      </pre>
    </div>
  );
}