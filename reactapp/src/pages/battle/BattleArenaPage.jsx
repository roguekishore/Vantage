import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Group as PanelGroup, Panel as ResizePanel, Separator as PanelResizeHandle } from "react-resizable-panels";
import useBattleStore from "../../stores/useBattleStore";
import { getStoredUser } from "../../services/userApi";
import { fetchProblem as fetchJudgeProblem, runCode } from "../../services/judgeApi";
import { resolveJudgeProblemId } from "../../lib/judgeProblemIdResolver";
import { defineVantageThemes, vantageThemeName } from "../../lib/monacoThemes";
import useThemeTokens from "../../hooks/useThemeTokens";
import {
  AlertTriangle, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight,
  Copy, FlaskConical, Flag, ListChecks, Play, Plus, RotateCcw, Send,
  SquareTerminal, Swords, Terminal, Timer, X, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  OfflineState,
  PageHeader,
  PageLoader,
  PageShell,
  Panel,
  Progress,
  Select,
  SelectItem,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThemeToggle,
  Tooltip,
} from "@/components/ds";

/*
 * Battle arena (POLISH_PLAN §6): the Judge layout (problem | editor over
 * console, resizable) under a slim top bar with the timer (Mono, tabular,
 * --warn under 5 min, --err under 60 s) and an opponent status strip. The
 * global nav is hidden on this route, so the bar carries the theme toggle.
 * The page's one h1 is the current problem title. Group arena copies this.
 */

const LANGUAGES = [
  { value: "cpp", label: "C++", monacoId: "cpp" },
  { value: "java", label: "Java", monacoId: "java" },
];

const TONE = {
  ok: "border-ok bg-ok-soft text-ok",
  warn: "border-warn bg-warn-soft text-warn",
  err: "border-err bg-err-soft text-err",
};

/* ── Verdict config ── */
const VERDICT_CFG = {
  ACCEPTED: { tone: "ok", label: "Accepted" },
  WRONG_ANSWER: { tone: "err", label: "Wrong answer" },
  TIME_LIMIT: { tone: "warn", label: "Time limit exceeded" },
  COMPILE_ERROR: { tone: "err", label: "Compilation error" },
  RUNTIME_ERROR: { tone: "warn", label: "Runtime error" },
  ERROR: { tone: "err", label: "Error" },
};

const STATUS_CFG = {
  Success: { tone: "ok", Icon: CheckCircle2 },
  Error: { tone: "err", Icon: AlertTriangle },
  "Runtime Error": { tone: "warn", Icon: AlertTriangle },
};

const LEADER_REASON = {
  PROBLEMS_SOLVED: "on problems solved",
  SOLVE_TIME: "on solve time",
  SUBMISSIONS: "on submissions",
};

const LOAD_TIMEOUT_MS = 10000;

const focusRing = "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus";
const labelCls = "font-mono text-label uppercase";

/* Below md the workspace stacks vertically (view only). */
function useMediaQuery(query) {
  const read = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(read);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

/* Hairline resize handle with an 8px hit area (no ds primitive for this). */
function ResizeHandle({ vertical = false }) {
  return (
    <PanelResizeHandle
      className={cn(
        "group relative flex shrink-0 items-center justify-center bg-bg outline-none",
        "ds-focus:outline ds-focus:outline-2 ds-focus:-outline-offset-2 ds-focus:outline-focus",
        vertical ? "h-2 w-full cursor-row-resize" : "h-full w-2 cursor-col-resize"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-border transition-colors duration-[120ms] ease-out group-hover:bg-border-strong group-data-[separator=active]:bg-accent-ink",
          vertical ? "h-px w-full" : "h-full w-px"
        )}
      />
    </PanelResizeHandle>
  );
}

/* Square progress cells for the status strip. */
function SolvedCells({ total, solved, filledClass }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn("size-2 border", i < solved ? filledClass : "border-border-strong")} />
      ))}
    </span>
  );
}

function ResultDot({ ok }) {
  return (
    <>
      <span aria-hidden="true" className={cn("size-1.5", ok ? "bg-ok" : "bg-err")} />
      <span className="sr-only">{ok ? "(passed)" : "(failed)"}</span>
    </>
  );
}

/* ════════════════════════════════════════════
   ARENA PAGE
════════════════════════════════════════════ */
export default function BattleArenaPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;

  const {
    battleState, submitting,
    startBattlePolling, stopBattlePolling, submitCode: battleSubmit, forfeit,
  } = useBattleStore();

  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [codeByProblem, setCodeByProblem] = useState({});
  const [language, setLanguage] = useState("cpp");
  const [submitResult, setSubmitResult] = useState(null);
  const [judgeProblemDetails, setJudgeProblemDetails] = useState({});
  const [leftTab, setLeftTab] = useState("description");
  const [bottomTab, setBottomTab] = useState("testcases");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [testCasesByProblem, setTestCasesByProblem] = useState({});
  const editorRef = useRef(null);

  /* View-only state: theme for Monaco, stacked layout, load timeout. */
  const tokens = useThemeTokens();
  const monacoRef = useRef(null);
  const stacked = useMediaQuery("(max-width: 767px)");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

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
        }).catch(() => { });
      }
    });
  }, [battleState?.problems]);

  /* No battle state after LOAD_TIMEOUT_MS: the API is most likely unreachable. */
  useEffect(() => {
    if (battleState) {
      setLoadTimedOut(false);
      return undefined;
    }
    const t = setTimeout(() => setLoadTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [battleState, loadAttempt]);

  /* Monaco follows the app theme (vantage-dark / vantage-light). */
  useEffect(() => {
    if (monacoRef.current) monacoRef.current.editor.setTheme(defineVantageThemes(monacoRef.current, tokens));
  }, [tokens]);

  const currentProblem = battleState?.problems?.[currentProblemIdx];
  const currentJudgeId = currentProblem ? resolveJudgeProblemId({ judgeProblemId: currentProblem.judgeProblemId, title: currentProblem.title, fallbackId: currentProblem.judgeProblemId }) : null;
  const judgeDetail = currentJudgeId ? judgeProblemDetails[currentJudgeId] : null;
  const code = codeByProblem[currentProblemIdx] || "";
  const testCases = testCasesByProblem[currentProblemIdx] || [];
  const customInput = testCases[activeTestCase]?.input || "";
  const currentLang = LANGUAGES.find(l => l.value === language);
  const sampleCount = judgeDetail?.sampleTestCases?.length || 0;

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
            const existing = prev[p.index];
            const oldBoiler = detail.boilerplate?.[language];
            if (!existing || existing === oldBoiler) return { ...prev, [p.index]: detail.boilerplate[lang] };
            return prev;
          });
        }
      });
    }
  }, [battleState?.problems, judgeProblemDetails, language]);

  const handleResetCode = () => { if (judgeDetail?.boilerplate?.[language]) setCode(judgeDetail.boilerplate[language]); };
  const handleCopyCode = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleEditorMount = (editor) => { editorRef.current = editor; editor.focus(); };
  const handleEditorBeforeMount = (monaco) => { monacoRef.current = monaco; defineVantageThemes(monaco, tokens); };

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

  const loadFailedAsTestCase = (input, expected) => {
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

  const handleRetryLoad = () => {
    setLoadTimedOut(false);
    setLoadAttempt((n) => n + 1);
    stopBattlePolling();
    if (battleId && userId) startBattlePolling(Number(battleId), userId);
  };

  const timeRemaining = battleState?.timeRemainingMs ?? 0;
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const timerUrgent = timeRemaining < 60000;
  const timerWarn = timeRemaining < 300000;

  const switchProblem = (idx) => {
    setCurrentProblemIdx(idx); setSubmitResult(null); setRunResult(null);
    setActiveTestCase(0); setLeftTab("description"); setBottomTab("testcases");
  };

  /* Loading / unreachable */
  if (!battleState) {
    if (loadTimedOut) {
      return (
        <PageShell narrow className="pt-12">
          <PageHeader
            eyebrow="1v1 duel"
            title="Battle"
            actions={
              <Button variant="secondary" asChild>
                <Link to="/battle">Back to lobby</Link>
              </Button>
            }
          />
          <OfflineState
            description="The battle state hasn't arrived from the server. Check your connection and retry. Your match keeps running on the server while you're away."
            onRetry={handleRetryLoad}
          />
        </PageShell>
      );
    }
    return <PageLoader label="LOADING BATTLE_" />;
  }

  const totalProblems = battleState.problems?.length ?? 0;
  const mySolved = battleState.myProgress?.problemsSolved ?? 0;
  const oppSolved = battleState.opponentProgress?.problemsSolved ?? 0;
  const timerColor = timerUrgent ? "text-err" : timerWarn ? "text-warn" : "text-fg";
  const leaderUserId = battleState?.leaderUserId;
  const leaderReason = battleState?.leaderReason;
  const youLeading = leaderUserId != null && Number(leaderUserId) === Number(userId);
  const leaderText = leaderReason === "PROBLEMS_SOLVED"
    ? "Solved"
    : leaderReason === "SOLVE_TIME"
      ? "Time"
      : leaderReason === "SUBMISSIONS"
        ? "Submissions"
        : "Tied";
  const hasLeader = leaderReason && leaderReason !== "TIED";
  const problemTitle = judgeDetail?.title || currentProblem?.title || (totalProblems ? `Problem ${currentProblemIdx + 1}` : "Battle");
  const descriptionText = judgeDetail?.description || currentProblem?.description;
  const runOk = runResult?.status === "Success";
  const submitOk = submitResult?.verdict === "ACCEPTED";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-fg">

      {/* ══════════ TOP BAR ══════════ */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-3">
        <span className={cn(labelCls, "hidden items-center gap-2 text-fg-muted sm:inline-flex")}>
          <Swords size={14} strokeWidth={1.5} aria-hidden="true" /> Battle
        </span>
        <span aria-hidden="true" className="hidden h-4 w-px bg-border sm:block" />
        <div
          role="timer"
          aria-label={`Time remaining ${minutes} minutes ${seconds} seconds`}
          className={cn("flex items-center gap-2 font-mono text-h3 font-bold tabular-nums", timerColor)}
        >
          <Timer size={16} strokeWidth={1.5} aria-hidden="true" />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>

        <nav aria-label="Problems" className="mx-auto flex items-center gap-1">
          {battleState.problems?.map((p, i) => {
            const active = currentProblemIdx === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => switchProblem(i)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "inline-flex h-7 min-w-9 items-center justify-center gap-1 border px-2 tabular-nums transition-colors duration-[120ms] ease-out",
                  labelCls,
                  focusRing,
                  active
                    ? "border-accent-edge bg-accent text-on-accent"
                    : "border-border text-fg-muted ds-hover:border-border-strong ds-hover:text-fg"
                )}
              >
                P{i + 1}
                {p.isSolved && (
                  <>
                    <Check size={14} strokeWidth={1.5} aria-hidden="true" className={active ? undefined : "text-ok"} />
                    <span className="sr-only">solved</span>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" variant="ghost" />
          <Button variant="danger" size="sm" onClick={handleForfeit}>
            <Flag aria-hidden="true" /> <span className="sr-only sm:not-sr-only">Forfeit</span>
          </Button>
        </div>
      </header>

      {/* ══════════ OPPONENT STATUS STRIP ══════════ */}
      <div
        aria-label="Match status"
        role="region"
        className="flex h-9 shrink-0 items-center gap-4 overflow-x-auto whitespace-nowrap border-b border-border bg-bg px-3 font-mono text-small tabular-nums"
      >
        <span className="flex items-center gap-2">
          <span className={cn(labelCls, "text-fg-muted")}>You</span>
          <SolvedCells total={totalProblems} solved={mySolved} filledClass="border-accent-edge bg-accent" />
          <span className="text-fg">{mySolved}/{totalProblems}</span>
        </span>
        <span aria-hidden="true" className="h-4 w-px bg-border" />
        <span className="flex items-center gap-2">
          <span className={cn(labelCls, "text-fg-muted")}>Opponent</span>
          <SolvedCells total={totalProblems} solved={oppSolved} filledClass="border-fg bg-fg" />
          <span className="text-fg">{oppSolved}/{totalProblems}</span>
        </span>
        <span aria-hidden="true" className="h-4 w-px bg-border" />
        <span
          className="flex items-center gap-2"
          title={leaderReason ? `Current leader by ${leaderText.toLowerCase()}` : "Currently tied"}
        >
          <Badge tone={hasLeader ? (youLeading ? "ok" : "err") : "neutral"}>
            {hasLeader ? (youLeading ? "You lead" : "Opponent leads") : "Tied"}
          </Badge>
          {hasLeader && LEADER_REASON[leaderReason] ? (
            <span className="text-fg-muted">{LEADER_REASON[leaderReason]}</span>
          ) : null}
        </span>
      </div>

      {/* ══════════ WORKSPACE ══════════ */}
      <PanelGroup
        key={stacked ? "stacked" : "split"}
        orientation={stacked ? "vertical" : "horizontal"}
        className="flex min-h-0 w-full flex-1"
      >

        {/* ── LEFT: Problem + Results ── */}
        <ResizePanel id="left" defaultSize="40%" minSize="25%" maxSize={stacked ? "60%" : "55%"}>
          <section aria-label="Problem" className="flex h-full min-h-0 flex-col bg-surface">
            <div className="grid shrink-0 gap-2 border-b border-border px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(labelCls, "text-fg-dim")}>
                  Problem <span className="tabular-nums">{currentProblemIdx + 1}</span> of <span className="tabular-nums">{totalProblems}</span>
                </span>
                {currentProblem?.isSolved && <Badge tone="ok">Solved</Badge>}
              </div>
              <h1 className="font-display text-h2 uppercase text-fg" style={{ fontSynthesis: "none" }}>
                {problemTitle}
              </h1>
            </div>

            <Tabs value={leftTab} onValueChange={setLeftTab} className="flex min-h-0 flex-1 flex-col">
              <TabsList aria-label="Problem panels" className="shrink-0 px-4">
                <TabsTrigger value="description"><BookOpen aria-hidden="true" /> Description</TabsTrigger>
                <TabsTrigger value="results">
                  <ListChecks aria-hidden="true" /> Results
                  {submitResult ? <ResultDot ok={submitOk} /> : null}
                </TabsTrigger>
              </TabsList>

              {/* Description */}
              <TabsContent value="description" className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid gap-6 p-4">
                  {descriptionText ? (
                    <div className="whitespace-pre-wrap font-mono text-body text-fg-muted">{descriptionText}</div>
                  ) : (
                    <div className="grid gap-2" aria-label="Loading problem">
                      <Skeleton className="w-full" />
                      <Skeleton className="w-5/6" />
                      <Skeleton className="w-2/3" />
                    </div>
                  )}

                  {/* Examples */}
                  {judgeDetail?.examples?.length > 0 && (
                    <div className="grid gap-3">
                      <h2 className={cn(labelCls, "text-fg-dim")}>Examples</h2>
                      {judgeDetail.examples.map((ex, i) => (
                        <Panel key={i} variant="inset" label={`Example ${i + 1}`}>
                          <div className="grid gap-3">
                            <CodeOutput label="Input">{ex.input}</CodeOutput>
                            <CodeOutput label="Output">{ex.output}</CodeOutput>
                            {ex.explanation && (
                              <div className="grid gap-1 border-t border-border pt-3">
                                <div className={cn(labelCls, "text-fg-dim")}>Explanation</div>
                                <p className="font-mono text-small text-fg-muted">{ex.explanation}</p>
                              </div>
                            )}
                          </div>
                        </Panel>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {judgeDetail?.constraints?.length > 0 && (
                    <div className="grid gap-3">
                      <h2 className={cn(labelCls, "text-fg-dim")}>Constraints</h2>
                      <ul className="grid gap-2 border border-border bg-bg px-4 py-3">
                        {judgeDetail.constraints.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span aria-hidden="true" className="mt-2 size-1 shrink-0 bg-fg-dim" />
                            <code className="font-mono text-small text-fg-muted">{c}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prev / Next */}
                  {totalProblems > 1 && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" disabled={currentProblemIdx === 0} onClick={() => switchProblem(currentProblemIdx - 1)}>
                        <ChevronLeft aria-hidden="true" /> Prev
                      </Button>
                      <Button variant="ghost" size="sm" disabled={currentProblemIdx >= totalProblems - 1} onClick={() => switchProblem(currentProblemIdx + 1)}>
                        Next <ChevronRight aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Results */}
              <TabsContent value="results" className="min-h-0 flex-1 overflow-y-auto">
                <div className="p-4">
                  {!submitResult && !runResult && (
                    <EmptyState
                      icon={Terminal}
                      title="No results yet"
                      description="Run or submit your code to see results."
                      className="border-0 bg-transparent"
                    />
                  )}

                  {runResult && (
                    <div className="grid gap-4">
                      <StatusBanner status={runResult.status} time={runResult.time} />
                      {runResult.stdout && <CodeOutput label="Standard output">{runResult.stdout}</CodeOutput>}
                      {runResult.stderr && <CodeOutput label="Error output" variant="error">{runResult.stderr}</CodeOutput>}
                    </div>
                  )}

                  {submitResult && !runResult && (
                    <div className="grid gap-4">
                      <BattleVerdictBanner result={submitResult} />
                      {submitResult.error && <CodeOutput variant="error">{submitResult.error}</CodeOutput>}

                      {submitResult.totalProblems > 0 && (
                        <div className="grid gap-2">
                          <p className="font-mono text-small tabular-nums text-fg-muted">
                            <span className="font-bold text-fg">{submitResult.problemsSolved}</span> / {submitResult.totalProblems} solved
                          </p>
                          <Progress
                            value={submitResult.problemsSolved}
                            max={submitResult.totalProblems}
                            label="Problems solved"
                          />
                        </div>
                      )}

                      {submitResult.firstFailedInput != null && (
                        <Panel
                          variant="inset"
                          label={
                            <span className="inline-flex items-center gap-2 text-err">
                              <XCircle size={14} strokeWidth={1.5} aria-hidden="true" /> Last executed test
                            </span>
                          }
                          actions={
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => loadFailedAsTestCase(submitResult.firstFailedInput, submitResult.firstFailedExpected)}
                            >
                              Load failing case
                            </Button>
                          }
                        >
                          <div className="grid gap-3">
                            <CodeOutput label="Input">{submitResult.firstFailedInput}</CodeOutput>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <CodeOutput label="Expected" labelClass="text-ok">{submitResult.firstFailedExpected}</CodeOutput>
                              <CodeOutput label="Your output" labelClass="text-err" variant="error">{submitResult.firstFailedActual}</CodeOutput>
                            </div>
                            {submitResult.firstFailedError && (
                              <CodeOutput label="Runtime error" variant="error">{submitResult.firstFailedError}</CodeOutput>
                            )}
                          </div>
                        </Panel>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </ResizePanel>

        <ResizeHandle vertical={stacked} />

        {/* ── RIGHT: Editor + Testcases ── */}
        <ResizePanel id="right" defaultSize="60%" minSize="35%">
          <PanelGroup orientation="vertical" className="flex h-full w-full">

            {/* Editor */}
            <ResizePanel id="right-top" defaultSize="60%" minSize="25%">
              <section aria-label="Editor" className="flex h-full min-h-0 flex-col">

                {/* Toolbar */}
                <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-2">
                  <Select
                    size="sm"
                    aria-label="Language"
                    value={language}
                    onValueChange={handleLanguageChange}
                    className="w-28"
                  >
                    {LANGUAGES.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </Select>

                  <div className="flex items-center gap-1">
                    <Tooltip content="Reset to boilerplate">
                      <IconButton icon={RotateCcw} size="sm" aria-label="Reset to boilerplate" onClick={handleResetCode} />
                    </Tooltip>
                    <Tooltip content={copied ? "Copied" : "Copy code"}>
                      <IconButton
                        icon={copied ? Check : Copy}
                        size="sm"
                        aria-label={copied ? "Copied" : "Copy code"}
                        onClick={handleCopyCode}
                        className={copied ? "text-ok" : undefined}
                      />
                    </Tooltip>
                    <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                    <Tooltip content="Run against the active test case">
                      <Button size="sm" variant="secondary" onClick={handleRun} disabled={submitting} loading={running}>
                        <Play aria-hidden="true" /> Run
                      </Button>
                    </Tooltip>
                    <Tooltip content="Submit against all test cases">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={running || currentProblem?.isSolved}
                        loading={submitting}
                      >
                        <Send aria-hidden="true" /> Submit
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                {/* Monaco */}
                <div className="min-h-0 flex-1">
                  <Editor
                    height="100%"
                    language={currentLang?.monacoId || "cpp"}
                    theme={vantageThemeName(tokens.theme)}
                    beforeMount={handleEditorBeforeMount}
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
              </section>
            </ResizePanel>

            <ResizeHandle vertical />

            {/* Bottom: Testcases / Output */}
            <ResizePanel id="right-bottom" defaultSize="40%" minSize="15%" maxSize="60%">
              <section aria-label="Console" className="flex h-full min-h-0 flex-col bg-bg">
                <Tabs value={bottomTab} onValueChange={setBottomTab} className="flex min-h-0 flex-1 flex-col">
                  <TabsList aria-label="Console panels" className="shrink-0 px-3">
                    <TabsTrigger value="testcases"><FlaskConical aria-hidden="true" /> Testcases</TabsTrigger>
                    <TabsTrigger value="result">
                      <SquareTerminal aria-hidden="true" /> Output
                      {(runResult || submitResult) ? <ResultDot ok={runOk || submitOk} /> : null}
                    </TabsTrigger>
                  </TabsList>

                  {/* Testcases */}
                  <TabsContent value="testcases" className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid gap-3 p-3">
                      <div role="group" aria-label="Test cases" className="flex flex-wrap items-center gap-1">
                        {testCases.map((tc, idx) => {
                          const active = activeTestCase === idx;
                          const name = tc.isCustom ? `Custom ${idx - sampleCount + 1}` : `Case ${idx + 1}`;
                          return (
                            <div key={idx} className="flex">
                              <Button
                                size="sm"
                                variant={active ? "primary" : "secondary"}
                                aria-pressed={active}
                                onClick={() => setActiveTestCase(idx)}
                              >
                                {name}
                              </Button>
                              {tc.isCustom && (
                                <IconButton
                                  icon={X}
                                  size="sm"
                                  variant="secondary"
                                  aria-label={`Remove ${name}`}
                                  onClick={() => removeTestCase(idx)}
                                  className="-ml-px"
                                />
                              )}
                            </div>
                          );
                        })}
                        <Tooltip content="Add a custom test case">
                          <IconButton icon={Plus} size="sm" variant="secondary" aria-label="Add custom test case" onClick={addCustomTestCase} />
                        </Tooltip>
                      </div>

                      <Textarea
                        label="Input"
                        value={testCases[activeTestCase]?.input || ""}
                        onChange={(e) => updateActiveInput(e.target.value)}
                        placeholder="Enter test input"
                        spellCheck={false}
                        rows={4}
                        className="text-small"
                      />
                      {testCases[activeTestCase]?.output && (
                        <CodeOutput label="Expected output">{testCases[activeTestCase].output}</CodeOutput>
                      )}
                    </div>
                  </TabsContent>

                  {/* Output */}
                  <TabsContent value="result" className="min-h-0 flex-1 overflow-y-auto">
                    <div className="p-3">
                      {!runResult && !submitResult && (
                        <p className="py-8 text-center font-mono text-small text-fg-muted">Run your code to see output.</p>
                      )}
                      {runResult && (
                        <div className="grid gap-3">
                          <StatusBanner status={runResult.status} time={runResult.time} compact />
                          {runResult.stdout && <CodeOutput label="Stdout">{runResult.stdout}</CodeOutput>}
                          {runResult.stderr && <CodeOutput label="Stderr" variant="error">{runResult.stderr}</CodeOutput>}
                        </div>
                      )}
                      {submitResult && !runResult && (
                        <div className="grid gap-3">
                          <BattleVerdictBanner result={submitResult} compact />
                          {submitResult.error && <CodeOutput variant="error">{submitResult.error}</CodeOutput>}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </section>
            </ResizePanel>
          </PanelGroup>
        </ResizePanel>
      </PanelGroup>
    </div>
  );
}

/* ── Sub-components ── */

function StatusBanner({ status, time, compact }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Error;
  const Icon = cfg.Icon;
  return (
    <div role="status" className={cn("flex items-center gap-3 border", compact ? "px-3 py-2" : "px-4 py-3", TONE[cfg.tone])}>
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <span className="flex-1 font-mono text-h3">{status}</span>
      {time > 0 && <span className="font-mono text-small tabular-nums text-fg-muted">{time} ms</span>}
    </div>
  );
}

function BattleVerdictBanner({ result, compact }) {
  const cfg = VERDICT_CFG[result.verdict] || VERDICT_CFG.ERROR;
  const Icon = result.verdict === "ACCEPTED" ? CheckCircle2 : AlertTriangle;
  return (
    <div role="status" className={cn("flex items-center gap-3 border", compact ? "px-3 py-2" : "px-4 py-3", TONE[cfg.tone])}>
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <div className="grid flex-1 gap-1">
        <span className="font-mono text-h3">{cfg.label}</span>
        {!compact && result.executionTimeMs > 0 && (
          <span className="font-mono text-small tabular-nums text-fg-muted">Executed in {result.executionTimeMs} ms</span>
        )}
      </div>
      {compact && result.executionTimeMs > 0 && (
        <span className="font-mono text-small tabular-nums text-fg-muted">{result.executionTimeMs} ms</span>
      )}
    </div>
  );
}

function CodeOutput({ label, variant, labelClass, children }) {
  const isErr = variant === "error";
  return (
    <div className="grid min-w-0 gap-1">
      {label && (
        <div className={cn(labelCls, labelClass || (isErr ? "text-err" : "text-fg-dim"))}>{label}</div>
      )}
      <pre
        className={cn(
          "overflow-x-auto whitespace-pre-wrap border px-3 py-2 font-mono text-small",
          isErr ? "border-err bg-err-soft text-fg" : "border-border bg-bg text-fg"
        )}
      >
        {children}
      </pre>
    </div>
  );
}
