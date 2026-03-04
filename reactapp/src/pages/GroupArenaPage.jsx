import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import useGroupBattleStore from "../stores/useGroupBattleStore";
import { getStoredUser } from "../services/userApi";
import {
  fetchProblem as fetchJudgeProblem,
  runCode,
} from "../services/judgeApi";
import { useTheme } from "../components/theme-provider";
import { cn } from "../lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../components/ui/dropdown-menu";
import {
  Timer, AlertTriangle, CheckCircle2,
  XCircle, Loader2, ChevronLeft, ChevronRight,
  Play, Clock, Terminal, SquareTerminal, FlaskConical,
  BookOpen, ListChecks, RotateCcw, Copy, Check, Plus, X,
  ChevronDown, Braces, Code2, Zap, CircleDot, Hash,
  Users, Trophy, Medal, ArrowUpRight,
} from "lucide-react";
import "./judge/Judge.css";

/* -- Constants -- */
const LANGUAGES = [
  { value: "cpp",  label: "C++",  monacoId: "cpp" },
  { value: "java", label: "Java", monacoId: "java" },
];

function fmtTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function RankBadge({ rank }) {
  if (rank === 1) return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
  if (rank === 2) return <Medal className="w-3.5 h-3.5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-3.5 h-3.5 text-amber-700" />;
  return <Hash className="w-3.5 h-3.5 text-muted-foreground" />;
}

/* --------------------------------------------
   GROUP ARENA PAGE
   Reuses BattleArenaPage judge layout with a
   collapsible scoreboard sidebar instead of
   opponent-progress / forfeit controls.
   -------------------------------------------- */
export default function GroupArenaPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;
  const { theme } = useTheme();

  const {
    groupState, submitting,
    startGroupPolling, subscribeGroupState, submitCode: groupSubmit,
  } = useGroupBattleStore();

  /* -- Local state -- */
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [codeByProblem, setCodeByProblem]         = useState({});
  const [language, setLanguage]                   = useState("cpp");
  const [submitResult, setSubmitResult]           = useState(null);
  const [judgeProblemDetails, setJudgeProblemDetails] = useState({});
  const [leftTab, setLeftTab]                     = useState("description");
  const [bottomTab, setBottomTab]                 = useState("testcases");
  const [running, setRunning]                     = useState(false);
  const [runResult, setRunResult]                 = useState(null);
  const [copied, setCopied]                       = useState(false);
  const [activeTestCase, setActiveTestCase]       = useState(0);
  const [testCasesByProblem, setTestCasesByProblem] = useState({});
  const [scoreboardOpen, setScoreboardOpen]       = useState(true);
  const editorRef = useRef(null);

  /* -- Polling + STOMP lifecycle -- */
  useEffect(() => {
    if (battleId && userId) {
      const id = Number(battleId);
      startGroupPolling(id, userId);
      subscribeGroupState(id, userId);
    }
  }, [battleId, userId, startGroupPolling, subscribeGroupState]);

  /* -- Navigate away on completion -- */
  useEffect(() => {
    if (
      groupState?.state === "COMPLETED" &&
      groupState?.battleId === Number(battleId)
    ) {
      navigate(`/group/result/${battleId}`);
    }
  }, [groupState?.state, groupState?.battleId, battleId, navigate]);

  /* -- Fetch judge problem details + seed boilerplate / test cases -- */
  useEffect(() => {
    if (!groupState?.problems) return;
    groupState.problems.forEach((p) => {
      if (p.judgeProblemId && !judgeProblemDetails[p.judgeProblemId]) {
        fetchJudgeProblem(p.judgeProblemId)
          .then((data) => {
            setJudgeProblemDetails((prev) => ({ ...prev, [p.judgeProblemId]: data }));
            setCodeByProblem((prev) => {
              if (!prev[p.index] && data.boilerplate?.[language]) {
                return { ...prev, [p.index]: data.boilerplate[language] };
              }
              return prev;
            });
            if (data.sampleTestCases?.length) {
              setTestCasesByProblem((prev) => {
                if (prev[p.index]) return prev;
                return {
                  ...prev,
                  [p.index]: data.sampleTestCases.map((tc) => ({
                    input: tc.input, output: tc.output, isCustom: false,
                  })),
                };
              });
            }
          })
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupState?.problems]);

  /* -- Derived -- */
  const currentProblem  = groupState?.problems?.[currentProblemIdx];
  const judgeDetail     = currentProblem ? judgeProblemDetails[currentProblem.judgeProblemId] : null;
  const code            = codeByProblem[currentProblemIdx] || "";
  const testCases       = testCasesByProblem[currentProblemIdx] || [];
  const customInput     = testCases[activeTestCase]?.input || "";
  const currentLang     = LANGUAGES.find((l) => l.value === language);
  const sampleCount     = judgeDetail?.sampleTestCases?.length || 0;
  const scoreboard      = groupState?.scoreboard || [];
  const timeRemaining   = groupState?.timeRemainingMs ?? 0;
  const totalProblems   = groupState?.problems?.length ?? 0;
  const timerUrgent     = timeRemaining < 60_000;
  const timerWarn       = timeRemaining < 300_000;

  const editorTheme =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "vs-dark"
      : "light";

  /* -- Code helpers -- */
  const setCode = useCallback(
    (val) => setCodeByProblem((prev) => ({ ...prev, [currentProblemIdx]: val })),
    [currentProblemIdx]
  );

  const handleLanguageChange = useCallback(
    (lang) => {
      setLanguage(lang);
      if (groupState?.problems) {
        groupState.problems.forEach((p) => {
          const detail = judgeProblemDetails[p.judgeProblemId];
          if (detail?.boilerplate?.[lang]) {
            setCodeByProblem((prev) => {
              const existing      = prev[p.index];
              const oldBoilerplate = detail.boilerplate?.[language];
              if (!existing || existing === oldBoilerplate) {
                return { ...prev, [p.index]: detail.boilerplate[lang] };
              }
              return prev;
            });
          }
        });
      }
    },
    [groupState?.problems, judgeProblemDetails, language]
  );

  const handleResetCode = () => {
    if (judgeDetail?.boilerplate?.[language]) setCode(judgeDetail.boilerplate[language]);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorMount = (editor) => { editorRef.current = editor; editor.focus(); };

  /* -- Test-case helpers -- */
  const updateActiveInput = (value) => {
    setTestCasesByProblem((prev) => ({
      ...prev,
      [currentProblemIdx]: (prev[currentProblemIdx] || []).map((tc, i) =>
        i === activeTestCase ? { ...tc, input: value } : tc
      ),
    }));
  };

  const addCustomTestCase = () => {
    const last = testCases[testCases.length - 1];
    setTestCasesByProblem((prev) => ({
      ...prev,
      [currentProblemIdx]: [
        ...(prev[currentProblemIdx] || []),
        { input: last?.input || "", output: "", isCustom: true },
      ],
    }));
    setActiveTestCase(testCases.length);
  };

  const removeTestCase = (idx) => {
    if (!testCases[idx]?.isCustom) return;
    setTestCasesByProblem((prev) => ({
      ...prev,
      [currentProblemIdx]: (prev[currentProblemIdx] || []).filter((_, i) => i !== idx),
    }));
    setActiveTestCase((prev) => Math.min(prev, testCases.length - 2));
  };
  /* Load a failed test case into the testcase panel for debugging */
  const useFailedAsTestCase = (input, expected) => {
    setTestCasesByProblem((prev) => ({
      ...prev,
      [currentProblemIdx]: [
        ...(prev[currentProblemIdx] || []),
        { input, output: expected || "", isCustom: true },
      ],
    }));
    setActiveTestCase(testCases.length);
    setBottomTab("testcases");
  };
  /* -- Run -- */
  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    setSubmitResult(null);
    setBottomTab("result");
    try {
      const res = await runCode({ language, code, input: customInput });
      setRunResult(res);
    } catch (err) {
      setRunResult({ status: "Error", stderr: err.message });
    } finally {
      setRunning(false);
    }
  };

  /* -- Submit -- */
  const handleSubmit = async () => {
    if (!currentProblem || !code) return;
    setSubmitResult(null);
    setRunResult(null);
    setLeftTab("results");
    try {
      const result = await groupSubmit(Number(battleId), {
        userId,
        problemIndex: currentProblemIdx,
        language,
        code,
      });
      setSubmitResult(result);
    } catch (e) {
      setSubmitResult({ verdict: "ERROR", error: e.message });
    }
  };

  /* -- Problem switching -- */
  const switchProblem = (idx) => {
    setCurrentProblemIdx(idx);
    setSubmitResult(null);
    setRunResult(null);
    setActiveTestCase(0);
    setLeftTab("description");
    setBottomTab("testcases");
  };

  /* -- Loading -- */
  if (!groupState) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading battle�</span>
        </div>
      </div>
    );
  }

  /* --------------------------------------------
     RENDER
     -------------------------------------------- */
  return (
    <TooltipProvider delayDuration={300}>
      <div className="judge-root flex h-screen flex-col bg-background text-foreground overflow-hidden">

        {/* ----------- HEADER ----------- */}
        <header className="judge-header flex items-center justify-between h-11 px-3 flex-shrink-0 z-10">

          {/* Left: mode label + timer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
                Group FFA
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className={cn(
              "flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums",
              timerUrgent ? "text-red-500" : timerWarn ? "text-amber-500" : "text-foreground"
            )}>
              <Timer className="w-3.5 h-3.5" />
              {fmtTime(timeRemaining)}
              {timerUrgent && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-0.5" />
              )}
            </div>
          </div>

          {/* Center: problem tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-secondary/50">
            {groupState.problems?.map((p, i) => (
              <button
                key={i}
                onClick={() => switchProblem(i)}
                className={cn(
                  "relative px-3.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                  currentProblemIdx === i
                    ? "bg-foreground text-background dark:bg-white dark:text-black shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {i + 1}
                {p.isSolved && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                )}
              </button>
            ))}
          </div>

          {/* Right: mini top-3 + sidebar toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {scoreboard.slice(0, 3).map((entry, i) => (
                <div key={entry.userId} className={cn(
                  "flex items-center gap-1 text-[10px] font-medium",
                  entry.userId === userId ? "text-foreground" : "text-muted-foreground"
                )}>
                  <RankBadge rank={i + 1} />
                  <span className="truncate max-w-[56px]">{entry.username}</span>
                  <span className="font-bold text-primary">{entry.groupScore}</span>
                </div>
              ))}
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setScoreboardOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <Users className="w-3 h-3" />
                  <span className="hidden sm:inline">Players</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Toggle scoreboard</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* ----------- WORKSPACE ----------- */}
        <div className="flex flex-1 min-h-0">

          {/* -- Scoreboard Sidebar -- */}
          {scoreboardOpen && (
            <aside className="w-48 border-r border-border flex flex-col shrink-0 bg-card/40">
              <div className="judge-toolbar h-9 px-3 flex items-center gap-1.5 border-b border-border">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Players
                </span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {scoreboard.map((entry, i) => (
                    <div
                      key={entry.userId}
                      className={cn(
                        "rounded-md px-2 py-1.5 flex items-center gap-2",
                        entry.userId === userId
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <RankBadge rank={i + 1} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate">{entry.username}</p>
                        <p className="text-[10px] text-muted-foreground">{entry.problemsSolved} solved</p>
                      </div>
                      <span className="text-[11px] font-bold text-primary shrink-0">{entry.groupScore}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </aside>
          )}

          {/* -- Main Panels -- */}
          <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0">

            {/* --- LEFT PANEL: Problem + Results --- */}
            <ResizablePanel id="left" defaultSize="40%" minSize="25%" maxSize="55%">
              <div className="flex flex-col h-full judge-panel">
                <Tabs value={leftTab} onValueChange={setLeftTab} className="flex flex-col h-full">
                  <div className="flex items-center border-b border-border px-1 flex-shrink-0">
                    <TabsList className="bg-transparent h-10 p-0 gap-0">
                      <TabsTrigger value="description" className="judge-tab-trigger">
                        <BookOpen className="h-3.5 w-3.5" /> Description
                      </TabsTrigger>
                      <TabsTrigger value="results" className="judge-tab-trigger">
                        <ListChecks className="h-3.5 w-3.5" /> Results
                        {submitResult && (
                          <span className={`judge-result-dot ${
                            submitResult.verdict === "ACCEPTED"
                              ? "judge-result-dot--success"
                              : "judge-result-dot--error"
                          }`} />
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* -- Description -- */}
                  <TabsContent value="description" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      <div className="p-5 space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Code2 className="h-3.5 w-3.5 text-[var(--color-accent-primary)]" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Problem {currentProblemIdx + 1} of {totalProblems}
                            </span>
                            {currentProblem?.isSolved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Solved
                              </span>
                            )}
                          </div>
                          <h2 className="text-lg font-bold text-foreground tracking-tight">
                            {judgeDetail?.title || currentProblem?.title || `Problem ${currentProblemIdx + 1}`}
                          </h2>
                        </div>

                        <div className="text-[13px] leading-relaxed text-foreground/90 space-y-2">
                          {(judgeDetail?.description || currentProblem?.description || "Loading\u2026")
                            .split("\n")
                            .map((line, i) => (
                              <p key={i} className={line ? "" : "h-2"}>{line}</p>
                            ))}
                        </div>

                        {judgeDetail?.examples?.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="judge-section-heading">Examples</h3>
                            {judgeDetail.examples.map((ex, i) => (
                              <div key={i} className="judge-example-card">
                                <div className="judge-example-header">
                                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Hash className="h-3 w-3" /> Example {i + 1}
                                  </span>
                                </div>
                                <div className="judge-example-body space-y-2.5">
                                  <div>
                                    <div className="judge-label">Input</div>
                                    <code className="judge-codeblock block text-[12px]">{ex.input}</code>
                                  </div>
                                  <div>
                                    <div className="judge-label">Output</div>
                                    <code className="judge-codeblock block text-[12px]">{ex.output}</code>
                                  </div>
                                  {ex.explanation && (
                                    <div className="pt-2 border-t border-border/50">
                                      <div className="judge-label">Explanation</div>
                                      <span className="text-xs text-muted-foreground leading-relaxed">{ex.explanation}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {judgeDetail?.constraints?.length > 0 && (
                          <div className="space-y-2.5">
                            <h3 className="judge-section-heading">Constraints</h3>
                            <div className="rounded-lg border border-border p-3 space-y-0.5">
                              {judgeDetail.constraints.map((c, i) => (
                                <div key={i} className="judge-constraint-item">
                                  <span className="judge-constraint-dot" />
                                  <code className="text-xs font-mono text-foreground/70">{c}</code>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {totalProblems > 1 && (
                          <div className="flex gap-2 pt-2">
                            <button
                              disabled={currentProblemIdx === 0}
                              onClick={() => switchProblem(currentProblemIdx - 1)}
                              className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                currentProblemIdx === 0
                                  ? "text-muted-foreground/30 cursor-not-allowed"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                              )}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" /> Prev
                            </button>
                            <button
                              disabled={currentProblemIdx >= totalProblems - 1}
                              onClick={() => switchProblem(currentProblemIdx + 1)}
                              className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                currentProblemIdx >= totalProblems - 1
                                  ? "text-muted-foreground/30 cursor-not-allowed"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                              )}
                            >
                              Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* -- Results -- */}
                  <TabsContent value="results" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      <div className="p-5">
                        {!submitResult && !runResult && (
                          <div className="judge-empty-state py-16">
                            <Terminal className="judge-empty-state-icon" />
                            <p className="text-sm font-medium">No results yet</p>
                            <p className="text-xs text-muted-foreground/70">Run or submit your code to see results here</p>
                          </div>
                        )}
                        {runResult && (
                          <div className="space-y-4">
                            <StatusBanner status={runResult.status} time={runResult.time} />
                            {runResult.stdout && (
                              <CodeOutput label="Standard Output" icon={<SquareTerminal className="h-3 w-3" />}>{runResult.stdout}</CodeOutput>
                            )}
                            {runResult.stderr && (
                              <CodeOutput label="Error Output" variant="error" icon={<AlertTriangle className="h-3 w-3" />}>{runResult.stderr}</CodeOutput>
                            )}
                          </div>
                        )}
                        {submitResult && !runResult && (
                          <div className="space-y-5">
                            <VerdictBanner result={submitResult} />
                            {submitResult.error && (
                              <CodeOutput label="Error" variant="error" icon={<AlertTriangle className="h-3 w-3" />}>{submitResult.error}</CodeOutput>
                            )}
                            {/* First failed test case — LeetCode-style */}
                            {submitResult.firstFailedInput != null && (
                              <div className="space-y-3">
                                <h4 className="judge-section-heading">Last Executed Test</h4>
                                <div className="judge-failed-card">
                                  <div className="judge-failed-card-header">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="h-3.5 w-3.5 text-[var(--color-danger)]" />
                                      <span className="text-xs font-semibold text-[var(--color-danger)]">Wrong Answer</span>
                                    </div>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => useFailedAsTestCase(submitResult.firstFailedInput, submitResult.firstFailedExpected)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[var(--color-accent-primary-light)] text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)] hover:text-white transition-colors"
                                        >
                                          <ArrowUpRight className="h-3 w-3" />
                                          Debug
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="text-xs">Load this input as a custom test case</TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <div className="p-3.5 space-y-3">
                                    <div>
                                      <div className="judge-label">Input</div>
                                      <pre className="judge-codeblock text-[12px]">{submitResult.firstFailedInput}</pre>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <div className="judge-label" style={{ color: 'var(--color-success)' }}>Expected</div>
                                        <pre className="judge-codeblock text-[12px]" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>{submitResult.firstFailedExpected}</pre>
                                      </div>
                                      <div>
                                        <div className="judge-label" style={{ color: 'var(--color-danger)' }}>Your Output</div>
                                        <pre className="judge-codeblock text-[12px]" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>{submitResult.firstFailedActual}</pre>
                                      </div>
                                    </div>
                                    {submitResult.firstFailedError && (
                                      <div>
                                        <div className="judge-label" style={{ color: 'var(--color-danger)' }}>Runtime Error</div>
                                        <pre className="judge-codeblock judge-codeblock--error text-[12px]">{submitResult.firstFailedError}</pre>
                                      </div>
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

            {/* --- RIGHT PANEL: Editor + Testcases --- */}
            <ResizablePanel id="right" defaultSize="60%" minSize="35%">
              <ResizablePanelGroup orientation="vertical">

                {/* -- Code Editor -- */}
                <ResizablePanel id="right-top" defaultSize="60%" minSize="25%">
                  <div className="flex flex-col h-full">
                    <div className="judge-toolbar flex items-center justify-between h-10 px-2.5 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="judge-lang-trigger">
                            <Braces className="h-3 w-3 text-[var(--color-accent-primary)]" />
                            {currentLang?.label}
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-[140px]">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Language</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {LANGUAGES.map((l) => (
                              <DropdownMenuItem
                                key={l.value}
                                onClick={() => handleLanguageChange(l.value)}
                                className={`text-xs font-medium cursor-pointer ${
                                  language === l.value
                                    ? "text-[var(--color-accent-primary)] bg-[var(--color-accent-primary-light)]"
                                    : ""
                                }`}
                              >
                                <Braces className="h-3 w-3 mr-1.5" />
                                {l.label}
                                {language === l.value && <Check className="h-3 w-3 ml-auto" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="judge-icon-btn" onClick={handleResetCode}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">Reset to boilerplate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="judge-icon-btn" onClick={handleCopyCode}>
                              {copied
                                ? <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                                : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">{copied ? "Copied!" : "Copy code"}</TooltipContent>
                        </Tooltip>

                        <Separator orientation="vertical" className="h-4 mx-1" />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="judge-btn-run" onClick={handleRun} disabled={running || submitting}>
                              {running
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Play className="h-3.5 w-3.5" />}
                              Run
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">Run against active test case</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="judge-btn-submit"
                              onClick={handleSubmit}
                              disabled={submitting || running || currentProblem?.isSolved}
                            >
                              {submitting
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Zap className="h-3.5 w-3.5" />}
                              Submit
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">Submit for FFA scoring</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0">
                      <Editor
                        height="100%"
                        language={currentLang?.monacoId || "cpp"}
                        theme={editorTheme}
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

                {/* -- Bottom: Testcases / Output -- */}
                <ResizablePanel id="right-bottom" defaultSize="40%" minSize="15%" maxSize="60%">
                  <div className="flex flex-col h-full judge-panel">
                    <Tabs value={bottomTab} onValueChange={setBottomTab} className="flex flex-col h-full">
                      <div className="flex items-center border-b border-border px-1 flex-shrink-0">
                        <TabsList className="bg-transparent h-9 p-0 gap-0">
                          <TabsTrigger value="testcases" className="judge-tab-trigger h-9">
                            <FlaskConical className="h-3.5 w-3.5" /> Testcases
                          </TabsTrigger>
                          <TabsTrigger value="result" className="judge-tab-trigger h-9">
                            <SquareTerminal className="h-3.5 w-3.5" /> Output
                            {(runResult || submitResult) && (
                              <span className={`judge-result-dot ${
                                runResult?.status === "Success" || submitResult?.verdict === "ACCEPTED"
                                  ? "judge-result-dot--success"
                                  : "judge-result-dot--error"
                              }`} />
                            )}
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      {/* Testcases */}
                      <TabsContent value="testcases" className="flex-1 overflow-hidden m-0">
                        <div className="flex flex-col h-full">
                          <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 flex-shrink-0 flex-wrap">
                            {testCases.map((tc, idx) => (
                              <div key={idx} className="relative group">
                                <button
                                  className={`judge-tc-pill ${tc.isCustom ? "judge-tc-pill-custom" : ""}`}
                                  data-active={activeTestCase === idx}
                                  onClick={() => setActiveTestCase(idx)}
                                >
                                  <CircleDot className="h-2.5 w-2.5" />
                                  {tc.isCustom ? `Custom ${idx - sampleCount + 1}` : `Case ${idx + 1}`}
                                </button>
                                {tc.isCustom && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeTestCase(idx); }}
                                    className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground/60 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] hover:border-[var(--color-danger)]/30 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={addCustomTestCase} className="judge-tc-pill judge-tc-pill-add">
                                  <Plus className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">Add custom test case</TooltipContent>
                            </Tooltip>
                          </div>

                          <ScrollArea className="flex-1 px-3 pb-3">
                            <div className="space-y-3">
                              <div>
                                <div className="judge-label">Input</div>
                                <textarea
                                  className="judge-input"
                                  value={testCases[activeTestCase]?.input || ""}
                                  onChange={(e) => updateActiveInput(e.target.value)}
                                  placeholder="Enter test input\u2026"
                                  spellCheck={false}
                                />
                              </div>
                              {testCases[activeTestCase]?.output && (
                                <div>
                                  <div className="judge-label">Expected Output</div>
                                  <pre className="judge-codeblock text-[12px]">{testCases[activeTestCase].output}</pre>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </TabsContent>

                      {/* Output */}
                      <TabsContent value="result" className="flex-1 overflow-hidden m-0">
                        <ScrollArea className="h-full p-3">
                          {!runResult && !submitResult && (
                            <div className="judge-empty-state py-8">
                              <SquareTerminal className="judge-empty-state-icon" />
                              <p className="text-xs font-medium">Run your code to see output</p>
                            </div>
                          )}
                          {runResult && (
                            <div className="space-y-3">
                              <StatusBanner status={runResult.status} time={runResult.time} compact />
                              {runResult.stdout && (
                                <CodeOutput label="Stdout" size="sm" icon={<SquareTerminal className="h-3 w-3" />}>{runResult.stdout}</CodeOutput>
                              )}
                              {runResult.stderr && (
                                <CodeOutput label="Stderr" variant="error" size="sm" icon={<AlertTriangle className="h-3 w-3" />}>{runResult.stderr}</CodeOutput>
                              )}
                            </div>
                          )}
                          {submitResult && !runResult && (
                            <div className="space-y-3">
                              <VerdictBanner result={submitResult} compact />
                              {submitResult.error && (
                                <CodeOutput variant="error" size="sm">{submitResult.error}</CodeOutput>
                              )}
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
      </div>
    </TooltipProvider>
  );
}

/* --------------------------------------------
   SUB-COMPONENTS (identical to BattleArenaPage)
   -------------------------------------------- */

const RUN_STATUS_MAP = {
  Success:         { icon: CheckCircle2,  color: "var(--color-success)", variant: "accepted" },
  Error:           { icon: AlertTriangle, color: "var(--color-danger)",  variant: "failed"   },
  "Runtime Error": { icon: AlertTriangle, color: "var(--color-orange)",  variant: "warning"  },
};

function StatusBanner({ status, time, compact }) {
  const cfg  = RUN_STATUS_MAP[status] || RUN_STATUS_MAP.Error;
  const Icon = cfg.icon;
  return (
    <div className={`judge-status-banner judge-status-banner--${cfg.variant} ${compact ? "!py-2 !px-3" : ""}`}>
      <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} style={{ color: cfg.color }} />
      <span className={`${compact ? "text-sm" : "text-base"} font-bold leading-tight`} style={{ color: cfg.color }}>
        {status}
      </span>
      {time > 0 && (
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums bg-secondary/80 px-2 py-0.5 rounded-md">
          <Clock className="h-3 w-3" /> {time}ms
        </span>
      )}
    </div>
  );
}

const VERDICT_MAP = {
  ACCEPTED:      { icon: CheckCircle2,  color: "var(--color-success)", variant: "accepted", label: "Accepted"            },
  WRONG_ANSWER:  { icon: XCircle,       color: "var(--color-danger)",  variant: "failed",   label: "Wrong Answer"        },
  TIME_LIMIT:    { icon: Clock,         color: "var(--color-warning)", variant: "warning",  label: "Time Limit Exceeded" },
  COMPILE_ERROR: { icon: AlertTriangle, color: "var(--color-danger)",  variant: "failed",   label: "Compilation Error"   },
  RUNTIME_ERROR: { icon: AlertTriangle, color: "var(--color-orange)",  variant: "warning",  label: "Runtime Error"       },
  ERROR:         { icon: AlertTriangle, color: "var(--color-danger)",  variant: "failed",   label: "Error"               },
};

function VerdictBanner({ result, compact }) {
  const cfg  = VERDICT_MAP[result.verdict] || VERDICT_MAP.ERROR;
  const Icon = cfg.icon;
  return (
    <div className={`judge-status-banner judge-status-banner--${cfg.variant} ${compact ? "!py-2 !px-3" : ""}`}>
      <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} style={{ color: cfg.color }} />
      <div className="flex flex-col">
        <span className={`${compact ? "text-sm" : "text-base"} font-bold leading-tight`} style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        {!compact && result.executionTimeMs > 0 && (
          <span className="text-[10px] text-muted-foreground mt-0.5">Executed in {result.executionTimeMs}ms</span>
        )}
      </div>
      {result.executionTimeMs > 0 && (
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums bg-secondary/80 px-2 py-0.5 rounded-md">
          <Clock className="h-3 w-3" /> {result.executionTimeMs}ms
        </span>
      )}
    </div>
  );
}

function CodeOutput({ label, variant, size = "md", icon, children }) {
  const isError = variant === "error";
  return (
    <div>
      {label && (
        <div className="judge-label flex items-center gap-1.5" style={isError ? { color: "var(--color-danger)" } : undefined}>
          {icon} {label}
        </div>
      )}
      <pre className={`judge-codeblock ${size === "sm" ? "text-[12px]" : "text-[13px]"} ${isError ? "judge-codeblock--error" : ""}`}>
        {children}
      </pre>
    </div>
  );
}
