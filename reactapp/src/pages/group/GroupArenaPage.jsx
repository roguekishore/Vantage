import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Group as PanelGroup, Panel as ResizePanel, Separator as PanelSeparator } from "react-resizable-panels";
import useGroupBattleStore from "../../stores/useGroupBattleStore";
import { getStoredUser } from "../../services/userApi";
import {
  fetchProblem as fetchJudgeProblem,
  runCode,
} from "../../services/judgeApi";
import { abandonGroupBattle } from "../../services/groupBattleApi";
import { cn } from "../../lib/utils";
import { resolveJudgeProblemId } from "../../lib/judgeProblemIdResolver";
import { defineVantageThemes, vantageThemeName } from "../../lib/monacoThemes";
import useThemeTokens from "../../hooks/useThemeTokens";
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  ListRow,
  PageLoader,
  Panel,
  Select,
  SelectItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThemeToggle,
} from "@/components/ds";
import {
  AlertTriangle, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, Copy, Flag, FlaskConical, ListChecks, Play, Plus, RotateCcw, Send,
  SquareTerminal, Terminal, Timer, Users, X, XCircle,
} from "lucide-react";

/* -- Constants -- */
const LANGUAGES = [
  { value: "cpp", label: "C++", monacoId: "cpp" },
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

/* View-only: below md the panels stack vertically instead of side by side. */
const NARROW_QUERY = "(max-width: 767px)";
function useIsNarrow() {
  const read = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(NARROW_QUERY).matches : false);
  const [narrow, setNarrow] = useState(read);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(NARROW_QUERY);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return narrow;
}

/* Resize handle on tokens: 4px --border bar, --accent-ink on hover / drag. */
function ResizeHandle({ vertical = false }) {
  return (
    <PanelSeparator
      className={cn(
        "shrink-0 bg-border transition-colors duration-[120ms] ease-out hover:bg-accent-ink",
        "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-0 ds-focus:outline-focus",
        vertical ? "h-1 w-full cursor-row-resize" : "h-full w-1 cursor-col-resize"
      )}
    />
  );
}

/* --------------------------------------------
   GROUP ARENA PAGE
   Judge layout with a standings sidebar and an
   opponent status strip under the top bar.
   -------------------------------------------- */
export default function GroupArenaPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;

  const {
    groupState, submitting,
    startGroupPolling, subscribeGroupState, submitCode: groupSubmit, forfeit,
  } = useGroupBattleStore();

  /* -- Local state -- */
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
  const [scoreboardOpen, setScoreboardOpen] = useState(true);
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
      const resolvedJudgeId = resolveJudgeProblemId({
        judgeProblemId: p.judgeProblemId,
        title: p.title,
        fallbackId: p.judgeProblemId,
      });

      if (resolvedJudgeId && !judgeProblemDetails[resolvedJudgeId]) {
        fetchJudgeProblem(resolvedJudgeId)
          .then((data) => {
            setJudgeProblemDetails((prev) => ({ ...prev, [resolvedJudgeId]: data }));
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
          .catch(() => { });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupState?.problems]);

  /* -- Derived -- */
  const currentProblem = groupState?.problems?.[currentProblemIdx];
  const currentJudgeId = currentProblem
    ? resolveJudgeProblemId({
      judgeProblemId: currentProblem.judgeProblemId,
      title: currentProblem.title,
      fallbackId: currentProblem.judgeProblemId,
    })
    : null;
  const judgeDetail = currentJudgeId ? judgeProblemDetails[currentJudgeId] : null;
  const code = codeByProblem[currentProblemIdx] || "";
  const testCases = testCasesByProblem[currentProblemIdx] || [];
  const customInput = testCases[activeTestCase]?.input || "";
  const currentLang = LANGUAGES.find((l) => l.value === language);
  const sampleCount = judgeDetail?.sampleTestCases?.length || 0;
  const scoreboard = groupState?.scoreboard || [];
  const meScoreEntry = scoreboard.find((entry) => entry.userId === userId) || null;
  const myForfeited = !!meScoreEntry?.forfeited;
  const timeRemaining = groupState?.timeRemainingMs ?? 0;
  const totalProblems = groupState?.problems?.length ?? 0;
  const myFinishedAllProblems =
    !myForfeited &&
    totalProblems > 0 &&
    (meScoreEntry?.problemsSolved ?? 0) >= totalProblems;
  const waitingForGroupResult =
    groupState?.state === "ACTIVE" && myFinishedAllProblems;
  const timerUrgent = timeRemaining < 60_000;
  const timerWarn = timeRemaining < 300_000;

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
          const resolvedJudgeId = resolveJudgeProblemId({
            judgeProblemId: p.judgeProblemId,
            title: p.title,
            fallbackId: p.judgeProblemId,
          });
          const detail = judgeProblemDetails[resolvedJudgeId];
          if (detail?.boilerplate?.[lang]) {
            setCodeByProblem((prev) => {
              const existing = prev[p.index];
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

  const handleForfeit = async () => {
    if (!window.confirm("Are you sure you want to forfeit this group battle?")) return;
    try {
      await forfeit(Number(battleId), userId);
    } catch (_) {
      // store error is already set; keep user in arena if request fails
    }
  };

  const handleLeaveBattle = async () => {
    try {
      await abandonGroupBattle(Number(battleId), userId);
    } catch (_) { }
    useGroupBattleStore.getState().reset();
    navigate("/");
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

  /* -- View-only: Monaco on the vantage-* token themes, stacked panels on narrow screens -- */
  const themeTokens = useThemeTokens();
  const monacoRef = useRef(null);
  const isNarrow = useIsNarrow();
  useEffect(() => {
    if (monacoRef.current) monacoRef.current.editor.setTheme(defineVantageThemes(monacoRef.current, themeTokens));
  }, [themeTokens]);
  const handleEditorBeforeMount = (monaco) => {
    monacoRef.current = monaco;
    defineVantageThemes(monaco, themeTokens);
  };

  /* -- Loading -- */
  if (!groupState) {
    return <PageLoader label="LOADING BATTLE_" />;
  }

  const submitDisabled = submitting || running || currentProblem?.isSolved || myForfeited || myFinishedAllProblems;
  const problemTitle = judgeDetail?.title || currentProblem?.title || `Problem ${currentProblemIdx + 1}`;
  const resultOk = runResult ? runResult.status === "Success" : submitResult?.verdict === "ACCEPTED";

  /* --------------------------------------------
     RENDER
     -------------------------------------------- */
  return (
    <main id="main" className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">

      {/* ----------- TOP BAR ----------- */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3">

        {/* Left: mode + timer */}
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="sr-only font-mono text-label uppercase text-fg-muted sm:not-sr-only">Group battle</h1>
          <span aria-hidden="true" className="hidden h-4 w-px bg-border sm:block" />
          <div
            role="timer"
            aria-label={`Time remaining ${fmtTime(timeRemaining)}`}
            className={cn(
              "flex items-center gap-2 font-mono text-h3 font-bold tabular-nums",
              timerUrgent ? "text-err" : timerWarn ? "text-warn" : "text-fg"
            )}
          >
            <Timer size={16} strokeWidth={1.5} aria-hidden="true" />
            {fmtTime(timeRemaining)}
          </div>
        </div>

        {/* Centre: problem switcher */}
        <nav aria-label="Problems" className="flex items-center gap-1">
          {groupState.problems?.map((p, i) => {
            const active = currentProblemIdx === i;
            return (
              <Button
                key={i}
                size="sm"
                variant={active ? "primary" : "secondary"}
                aria-current={active ? "true" : undefined}
                aria-label={`Problem ${i + 1}${p.isSolved ? ", solved" : ""}`}
                onClick={() => switchProblem(i)}
                className="min-w-9 px-2 tabular-nums"
              >
                {i + 1}
                {p.isSolved ? <Check aria-hidden="true" className={active ? undefined : "text-ok"} /> : null}
              </Button>
            );
          })}
        </nav>

        {/* Right: forfeit, standings toggle, theme */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleForfeit}
            disabled={myForfeited || myFinishedAllProblems}
            aria-label="Forfeit this group battle"
            title="Forfeit this group battle"
            className="text-err"
          >
            <Flag aria-hidden="true" />
            <span className="hidden sm:inline">Forfeit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScoreboardOpen((v) => !v)}
            aria-pressed={scoreboardOpen}
            aria-label="Toggle standings"
            title="Toggle standings"
            className="hidden md:inline-flex"
          >
            <Users aria-hidden="true" />
            Standings
          </Button>
          <ThemeToggle size="sm" variant="ghost" />
        </div>
      </header>

      {/* ----------- OPPONENT STATUS STRIP (mobile, or when the sidebar is closed) ----------- */}
      <div
        role="list"
        aria-label="Players"
        className={cn(
          "flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-border bg-bg",
          scoreboardOpen && "md:hidden"
        )}
      >
        {scoreboard.map((entry, i) => {
          const isMe = entry.userId === userId;
          return (
            <div
              role="listitem"
              key={entry.userId}
              className={cn(
                "flex shrink-0 items-center gap-2 border-r border-border px-3 font-mono text-small tabular-nums",
                isMe ? "bg-accent-soft text-fg" : "text-fg-muted"
              )}
            >
              <span className={i === 0 ? "text-accent-ink" : "text-fg-dim"}>#{i + 1}</span>
              <span className="max-w-[12ch] truncate">{entry.username}</span>
              {entry.forfeited ? (
                <Badge tone="err">Forfeit</Badge>
              ) : (
                <span className="text-fg-dim">
                  {entry.problemsSolved}/{totalProblems}
                </span>
              )}
              <span className="font-bold text-fg">{entry.groupScore}</span>
            </div>
          );
        })}
      </div>

      {myForfeited && (
        <div role="status" className="flex shrink-0 flex-wrap items-center gap-3 border-b border-warn bg-warn-soft px-3 py-2 font-mono text-small text-warn">
          <AlertTriangle size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
          <span className="min-w-0 flex-1">You forfeited. You can keep watching or leave the battle.</span>
          <Button size="sm" variant="secondary" onClick={handleLeaveBattle}>
            Leave battle
          </Button>
        </div>
      )}

      {waitingForGroupResult && (
        <div role="status" className="flex shrink-0 flex-wrap items-center gap-3 border-b border-ok bg-ok-soft px-3 py-2 font-mono text-small text-ok">
          <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
          <span className="min-w-0 flex-1">
            You solved every problem. Final results appear when the other players finish or the timer ends.
          </span>
          <Button size="sm" variant="secondary" onClick={handleLeaveBattle}>
            Leave room
          </Button>
        </div>
      )}

      {/* ----------- WORKSPACE ----------- */}
      <div className="flex min-h-0 flex-1">

        {/* -- Standings sidebar (md+) -- */}
        {scoreboardOpen && (
          <aside aria-label="Standings" className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
            <div className="flex h-10 shrink-0 items-center border-b border-border px-3 font-mono text-label uppercase text-fg-muted">
              Standings
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {scoreboard.map((entry, i) => {
                const isMe = entry.userId === userId;
                return (
                  <ListRow
                    key={entry.userId}
                    className={cn("px-3", isMe && "bg-accent-soft")}
                    leading={
                      <span className={cn("w-6 font-mono text-small tabular-nums", i === 0 ? "text-accent-ink" : "text-fg-dim")}>
                        #{i + 1}
                      </span>
                    }
                    title={<span className="text-small">{entry.username}{isMe ? " (you)" : ""}</span>}
                    meta={entry.forfeited ? <span className="text-err">Forfeited</span> : `${entry.problemsSolved}/${totalProblems} solved`}
                    trailing={<span className="font-mono text-small font-bold tabular-nums text-fg">{entry.groupScore}</span>}
                  />
                );
              })}
            </div>
          </aside>
        )}

        {/* -- Main panels -- */}
        <PanelGroup
          key={isNarrow ? "stack" : "split"}
          orientation={isNarrow ? "vertical" : "horizontal"}
          className="flex h-full min-h-0 w-full flex-1"
        >

          {/* --- LEFT: problem + results --- */}
          <ResizePanel id="left" defaultSize="40%" minSize="25%" maxSize={isNarrow ? "70%" : "55%"}>
            <section aria-label="Problem" className="flex h-full flex-col bg-surface">
              <Tabs value={leftTab} onValueChange={setLeftTab} className="flex h-full min-h-0 flex-col">
                <TabsList aria-label="Problem panel" className="shrink-0 px-3">
                  <TabsTrigger value="description">
                    <BookOpen aria-hidden="true" /> Description
                  </TabsTrigger>
                  <TabsTrigger value="results">
                    <ListChecks aria-hidden="true" /> Results
                    {submitResult && (
                      <span
                        aria-label={submitResult.verdict === "ACCEPTED" ? "accepted" : "failed"}
                        role="img"
                        className={cn("size-1.5", submitResult.verdict === "ACCEPTED" ? "bg-ok" : "bg-err")}
                      />
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* -- Description -- */}
                <TabsContent value="description" className="min-h-0 flex-1 overflow-auto">
                  <div className="grid gap-6 p-5">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-label uppercase text-fg-muted">
                          Problem {currentProblemIdx + 1} of {totalProblems}
                        </span>
                        {currentProblem?.isSolved && (
                          <Badge tone="ok">
                            <CheckCircle2 size={10} strokeWidth={1.5} aria-hidden="true" /> Solved
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-mono text-h3 text-fg">{problemTitle}</h2>
                    </div>

                    <div className="grid gap-2 font-mono text-body text-fg-muted">
                      {(judgeDetail?.description || currentProblem?.description || "Loading…")
                        .split("\n")
                        .map((line, i) => (
                          <p key={i} className={line ? "" : "h-2"}>{line}</p>
                        ))}
                    </div>

                    {judgeDetail?.examples?.length > 0 && (
                      <section className="grid gap-3">
                        <h3 className="font-mono text-label uppercase text-fg-muted">Examples</h3>
                        {judgeDetail.examples.map((ex, i) => (
                          <Panel key={i} variant="inset" label={`Example ${i + 1}`} bodyClassName="grid gap-3">
                            <CodeBlock label="Input">{ex.input}</CodeBlock>
                            <CodeBlock label="Output">{ex.output}</CodeBlock>
                            {ex.explanation && (
                              <div className="grid gap-1.5 border-t border-border pt-3">
                                <div className="font-mono text-label uppercase text-fg-muted">Explanation</div>
                                <p className="font-mono text-small text-fg-muted">{ex.explanation}</p>
                              </div>
                            )}
                          </Panel>
                        ))}
                      </section>
                    )}

                    {judgeDetail?.constraints?.length > 0 && (
                      <section className="grid gap-3">
                        <h3 className="font-mono text-label uppercase text-fg-muted">Constraints</h3>
                        <ul className="grid gap-1 border border-border bg-bg p-3">
                          {judgeDetail.constraints.map((c, i) => (
                            <li key={i} className="flex gap-2 font-mono text-small text-fg-muted">
                              <span aria-hidden="true" className="text-fg-dim">-</span>
                              <code>{c}</code>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {totalProblems > 1 && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={currentProblemIdx === 0}
                          onClick={() => switchProblem(currentProblemIdx - 1)}
                        >
                          <ChevronLeft aria-hidden="true" /> Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={currentProblemIdx >= totalProblems - 1}
                          onClick={() => switchProblem(currentProblemIdx + 1)}
                        >
                          Next <ChevronRight aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* -- Results -- */}
                <TabsContent value="results" className="min-h-0 flex-1 overflow-auto">
                  <div className="grid gap-5 p-5">
                    {!submitResult && !runResult && (
                      <EmptyState
                        icon={Terminal}
                        title="No results yet"
                        description="Run or submit your code to see results here."
                      />
                    )}
                    {runResult && (
                      <div className="grid gap-4">
                        <StatusBanner status={runResult.status} time={runResult.time} />
                        {runResult.stdout && <CodeBlock label="Standard output">{runResult.stdout}</CodeBlock>}
                        {runResult.stderr && <CodeBlock label="Error output" tone="err">{runResult.stderr}</CodeBlock>}
                      </div>
                    )}
                    {submitResult && !runResult && (
                      <div className="grid gap-5">
                        <VerdictBanner result={submitResult} />
                        {submitResult.error && <CodeBlock label="Error" tone="err">{submitResult.error}</CodeBlock>}
                        {/* First failed test case */}
                        {submitResult.firstFailedInput != null && (
                          <Panel
                            label="Last executed test"
                            actions={
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => useFailedAsTestCase(submitResult.firstFailedInput, submitResult.firstFailedExpected)}
                                title="Load this input as a custom test case"
                              >
                                <ArrowUpRight aria-hidden="true" />
                                Load failing case
                              </Button>
                            }
                            bodyClassName="grid gap-3"
                          >
                            <div className="flex items-center gap-2 font-mono text-small text-err">
                              <XCircle size={14} strokeWidth={1.5} aria-hidden="true" /> Wrong answer
                            </div>
                            <CodeBlock label="Input">{submitResult.firstFailedInput}</CodeBlock>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <CodeBlock label="Expected" tone="ok">{submitResult.firstFailedExpected}</CodeBlock>
                              <CodeBlock label="Your output" tone="err">{submitResult.firstFailedActual}</CodeBlock>
                            </div>
                            {submitResult.firstFailedError && (
                              <CodeBlock label="Runtime error" tone="err">{submitResult.firstFailedError}</CodeBlock>
                            )}
                          </Panel>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </ResizePanel>

          <ResizeHandle vertical={isNarrow} />

          {/* --- RIGHT: editor + testcases --- */}
          <ResizePanel id="right" defaultSize="60%" minSize="30%">
            <PanelGroup orientation="vertical" className="flex h-full w-full">

              {/* -- Code editor -- */}
              <ResizePanel id="right-top" defaultSize="60%" minSize="25%">
                <section aria-label="Code editor" className="flex h-full flex-col">
                  <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-2">
                    <Select size="sm" aria-label="Language" value={language} onValueChange={handleLanguageChange} className="w-28">
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </Select>

                    <div className="flex items-center gap-1">
                      <IconButton icon={RotateCcw} size="sm" aria-label="Reset to boilerplate" onClick={handleResetCode} />
                      <IconButton
                        icon={copied ? Check : Copy}
                        size="sm"
                        aria-label={copied ? "Code copied" : "Copy code"}
                        onClick={handleCopyCode}
                      />
                      <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleRun}
                        disabled={running || submitting}
                        loading={running}
                        title="Run against the active test case"
                      >
                        <Play aria-hidden="true" />
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={submitDisabled}
                        loading={submitting}
                        title="Submit for free-for-all scoring"
                      >
                        <Send aria-hidden="true" />
                        Submit
                      </Button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1">
                    <Editor
                      height="100%"
                      language={currentLang?.monacoId || "cpp"}
                      theme={vantageThemeName(themeTokens.theme)}
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

              {/* -- Bottom: testcases / output -- */}
              <ResizePanel id="right-bottom" defaultSize="40%" minSize="15%" maxSize="60%">
                <section aria-label="Test cases and output" className="flex h-full flex-col bg-surface">
                  <Tabs value={bottomTab} onValueChange={setBottomTab} className="flex h-full min-h-0 flex-col">
                    <TabsList aria-label="Console" className="shrink-0 px-3">
                      <TabsTrigger value="testcases">
                        <FlaskConical aria-hidden="true" /> Testcases
                      </TabsTrigger>
                      <TabsTrigger value="result">
                        <SquareTerminal aria-hidden="true" /> Output
                        {(runResult || submitResult) && (
                          <span
                            role="img"
                            aria-label={resultOk ? "passed" : "failed"}
                            className={cn("size-1.5", resultOk ? "bg-ok" : "bg-err")}
                          />
                        )}
                      </TabsTrigger>
                    </TabsList>

                    {/* Testcases */}
                    <TabsContent value="testcases" className="min-h-0 flex-1 overflow-auto">
                      <div className="grid gap-3 p-3">
                        <div role="group" aria-label="Test cases" className="flex flex-wrap items-center gap-1.5">
                          {testCases.map((tc, idx) => {
                            const label = tc.isCustom ? `Custom ${idx - sampleCount + 1}` : `Case ${idx + 1}`;
                            const active = activeTestCase === idx;
                            return (
                              <div key={idx} className="flex items-center">
                                <Button
                                  size="sm"
                                  variant={active ? "primary" : "secondary"}
                                  aria-pressed={active}
                                  onClick={() => setActiveTestCase(idx)}
                                >
                                  {label}
                                </Button>
                                {tc.isCustom && (
                                  <IconButton
                                    icon={X}
                                    size="sm"
                                    variant="secondary"
                                    className="-ml-px"
                                    aria-label={`Remove ${label}`}
                                    onClick={(e) => { e.stopPropagation(); removeTestCase(idx); }}
                                  />
                                )}
                              </div>
                            );
                          })}
                          <IconButton icon={Plus} size="sm" variant="ghost" aria-label="Add custom test case" onClick={addCustomTestCase} />
                        </div>

                        <Textarea
                          label="Input"
                          value={testCases[activeTestCase]?.input || ""}
                          onChange={(e) => updateActiveInput(e.target.value)}
                          placeholder="Enter test input"
                          spellCheck={false}
                          className="font-mono text-small"
                        />
                        {testCases[activeTestCase]?.output && (
                          <CodeBlock label="Expected output">{testCases[activeTestCase].output}</CodeBlock>
                        )}
                      </div>
                    </TabsContent>

                    {/* Output */}
                    <TabsContent value="result" className="min-h-0 flex-1 overflow-auto">
                      <div className="grid gap-3 p-3">
                        {!runResult && !submitResult && (
                          <p className="flex items-center gap-2 font-mono text-small text-fg-muted">
                            <SquareTerminal size={14} strokeWidth={1.5} aria-hidden="true" />
                            Run your code to see output.
                          </p>
                        )}
                        {runResult && (
                          <>
                            <StatusBanner status={runResult.status} time={runResult.time} compact />
                            {runResult.stdout && <CodeBlock label="Stdout">{runResult.stdout}</CodeBlock>}
                            {runResult.stderr && <CodeBlock label="Stderr" tone="err">{runResult.stderr}</CodeBlock>}
                          </>
                        )}
                        {submitResult && !runResult && (
                          <>
                            <VerdictBanner result={submitResult} compact />
                            {submitResult.error && <CodeBlock tone="err">{submitResult.error}</CodeBlock>}
                          </>
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
    </main>
  );
}

/* --------------------------------------------
   SUB-COMPONENTS
   -------------------------------------------- */

const TONE_CLASSES = {
  ok: "border-ok bg-ok-soft text-ok",
  err: "border-err bg-err-soft text-err",
  warn: "border-warn bg-warn-soft text-warn",
};

function ResultBanner({ tone, icon: Icon, label, sub, timeMs, compact }) {
  return (
    <div
      role="status"
      className={cn("flex items-center gap-3 border", compact ? "px-3 py-2" : "px-4 py-3", TONE_CLASSES[tone] || TONE_CLASSES.err)}
    >
      <Icon size={compact ? 16 : 20} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <div className="grid min-w-0">
        <span className={cn("font-mono font-bold", compact ? "text-small" : "text-body")}>{label}</span>
        {sub ? <span className="font-mono text-small text-fg-muted">{sub}</span> : null}
      </div>
      {timeMs > 0 && (
        <Badge tone="outline" className="ml-auto">
          <Clock size={10} strokeWidth={1.5} aria-hidden="true" /> {timeMs} ms
        </Badge>
      )}
    </div>
  );
}

const RUN_STATUS_MAP = {
  Success: { icon: CheckCircle2, tone: "ok" },
  Error: { icon: AlertTriangle, tone: "err" },
  "Runtime Error": { icon: AlertTriangle, tone: "warn" },
};

function StatusBanner({ status, time, compact }) {
  const cfg = RUN_STATUS_MAP[status] || RUN_STATUS_MAP.Error;
  return <ResultBanner tone={cfg.tone} icon={cfg.icon} label={status} timeMs={time} compact={compact} />;
}

const VERDICT_MAP = {
  ACCEPTED: { icon: CheckCircle2, tone: "ok", label: "Accepted" },
  WRONG_ANSWER: { icon: XCircle, tone: "err", label: "Wrong answer" },
  TIME_LIMIT: { icon: Clock, tone: "warn", label: "Time limit exceeded" },
  COMPILE_ERROR: { icon: AlertTriangle, tone: "err", label: "Compilation error" },
  RUNTIME_ERROR: { icon: AlertTriangle, tone: "warn", label: "Runtime error" },
  ERROR: { icon: AlertTriangle, tone: "err", label: "Error" },
};

function VerdictBanner({ result, compact }) {
  const cfg = VERDICT_MAP[result.verdict] || VERDICT_MAP.ERROR;
  return (
    <ResultBanner
      tone={cfg.tone}
      icon={cfg.icon}
      label={cfg.label}
      sub={!compact && result.executionTimeMs > 0 ? `Executed in ${result.executionTimeMs} ms` : undefined}
      timeMs={result.executionTimeMs}
      compact={compact}
    />
  );
}

const CODE_TONE = {
  ok: { label: "text-ok", border: "border-ok" },
  err: { label: "text-err", border: "border-err" },
};

function CodeBlock({ label, tone, children }) {
  const t = CODE_TONE[tone];
  return (
    <div className="grid gap-1.5">
      {label ? <div className={cn("font-mono text-label uppercase", t ? t.label : "text-fg-muted")}>{label}</div> : null}
      <pre
        className={cn(
          "overflow-x-auto whitespace-pre-wrap break-words border bg-bg p-3 font-mono text-small text-fg",
          t ? t.border : "border-border"
        )}
      >
        {children}
      </pre>
    </div>
  );
}
