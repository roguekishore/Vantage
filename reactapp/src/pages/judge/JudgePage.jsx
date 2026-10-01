import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Group, Panel as SplitPanel, Separator } from "react-resizable-panels";
import { fetchProblem, submitCode, runCode } from "../../services/judgeApi";
import { getStoredUser } from "../../services/userApi";
import { useTheme } from "../../components/common/ThemeProvider";
import useThemeTokens from "../../hooks/useThemeTokens";
import { defineVantageThemes, vantageThemeName } from "../../lib/monacoThemes";
import useProgressStore, { getConquestIdByJudgeId } from "../../map/useProgressStore";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  IconButton,
  OfflineState,
  Panel,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThemeToggle,
  Tooltip,
} from "@/components/ds";
import {
  ArrowLeft, Play, CheckCircle2, XCircle, Clock, AlertTriangle,
  Terminal, SquareTerminal, FlaskConical, BookOpen, ListChecks,
  RotateCcw, Copy, Check, Plus, X, ArrowUpRight, ChevronDown,
  FileQuestion, Braces, LogIn, Send, Workflow, Columns2,
} from "lucide-react";
import "./Judge.css";
import VisualizerDrawer, { VisualizerToggleButton } from "./VisualizerDrawer";
import CodeFlowPanel from "./codeflow/CodeFlowPanel";
import DryRunPanel from "./codeflow/DryRunPanel";
import { useCodeFlow } from "./codeflow/useCodeFlow";

/* ── Constants ── */
const LANGUAGES = [
  { value: "cpp", label: "C++", monacoId: "cpp" },
  { value: "java", label: "Java", monacoId: "java" },
];

const DIFF_TONE = { Easy: "ok", Medium: "warn", Hard: "err" };

const LABEL = "font-mono text-label uppercase";
const MICRO = "font-mono text-micro uppercase";
const PRE = "m-0 whitespace-pre-wrap break-words border border-border bg-bg px-3 py-2 font-mono text-small text-fg";

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function JudgePage() {
  const { problemId } = useParams();
  const { resolvedTheme } = useTheme();
  const themeTokens = useThemeTokens();
  const completeProblem = useProgressStore(s => s.completeProblem);
  const markProblemAttempted = useProgressStore(s => s.markProblemAttempted);
  const user = useMemo(() => getStoredUser(), []);
  const isLoggedIn = !!user?.uid;

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  // View-only: keeps the fetch error so the page can tell offline from
  // not-found, and a counter so Retry re-runs the same fetch.
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [leftTab, setLeftTab] = useState("description");
  const [bottomTab, setBottomTab] = useState("testcases");
  const [copied, setCopied] = useState(false);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [vizOpen, setVizOpen] = useState(false);
  const [dryRunOpen, setDryRunOpen] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const codeFlowRef = useRef(null);
  // Single shared flow trace + playback state consumed by BOTH the Flow bottom
  // tab (CodeFlowPanel) and the parallel dry-run window (DryRunPanel) so stepping
  // in one is reflected in the other.
  const flow = useCodeFlow();
  // Holds the editor-cursor handler registered by CodeFlowPanel for the
  // editor -> block highlight direction.
  const cursorResolverRef = useRef(null);

  useEffect(() => {
    if (problem?.sampleTestCases?.length) {
      setTestCases(problem.sampleTestCases.map(tc => ({ input: tc.input, output: tc.output, isCustom: false })));
      setActiveTestCase(0);
    }
  }, [problem]);

  const customInput = testCases[activeTestCase]?.input || "";
  const sampleCount = problem?.sampleTestCases?.length || 0;

  const updateActiveInput = (value) =>
    setTestCases(prev => prev.map((tc, i) => i === activeTestCase ? { ...tc, input: value } : tc));

  const addCustomTestCase = () => {
    const last = testCases[testCases.length - 1];
    setTestCases(prev => [...prev, { input: last?.input || "", output: "", isCustom: true }]);
    setActiveTestCase(testCases.length);
  };

  const removeTestCase = (idx) => {
    if (!testCases[idx]?.isCustom) return;
    setTestCases(prev => prev.filter((_, i) => i !== idx));
    setActiveTestCase(prev => Math.min(prev, testCases.length - 2));
  };

  const loadFailedAsTestCase = (input, expected) => {
    setTestCases(prev => [...prev, { input, output: expected || "", isCustom: true }]);
    setActiveTestCase(testCases.length);
    setBottomTab("testcases");
  };

  const testArray = useMemo(() => {
    const tc = testCases[activeTestCase];
    if (!tc?.input) return null;
    const lines = tc.input.trim().split("\n");
    const arrLine = lines.length > 1 ? lines[lines.length - 1] : lines[0];
    const nums = arrLine.trim().split(/\s+/).map(Number);
    return nums.length > 0 && nums.every(n => !isNaN(n)) ? nums : null;
  }, [testCases, activeTestCase]);

  // Monaco follows the app theme through the token-built vantage-* themes
  //. Re-defined whenever the resolved tokens change.
  const editorTheme = vantageThemeName(resolvedTheme);
  const handleEditorBeforeMount = (monaco) => {
    monacoRef.current = monaco;
    defineVantageThemes(monaco, themeTokens);
  };
  useEffect(() => {
    const monaco = monacoRef.current;
    if (monaco?.editor) monaco.editor.setTheme(defineVantageThemes(monaco, themeTokens));
  }, [themeTokens]);

  useEffect(() => {
    fetchProblem(problemId)
      .then(p => { setProblem(p); setCode(p.boilerplate?.cpp || ""); })
      .catch(err => { console.error(err); setLoadError(err); })
      .finally(() => setLoading(false));
  }, [problemId, reloadKey]);

  const retryLoad = () => { setLoadError(null); setLoading(true); setReloadKey(k => k + 1); };

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang);
    if (problem?.boilerplate?.[lang]) setCode(problem.boilerplate[lang]);
  }, [problem]);

  const handleSubmit = async () => {
    setSubmitting(true); setResult(null); setRunResult(null); setBottomTab("result");
    try {
      const res = await submitCode({ problemId, language, code });
      setResult(res); setLeftTab("results");
      const cid = getConquestIdByJudgeId(problemId);
      if (cid) {
        if (res.status === "Accepted") completeProblem(cid);
        else markProblemAttempted(cid);
      }
    } catch (err) {
      setResult({ status: "Error", error: err.message, results: [], totalPassed: 0, totalTests: 0 });
      setLeftTab("results");
    } finally { setSubmitting(false); }
  };

  const handleRun = async () => {
    setRunning(true); setRunResult(null); setResult(null); setBottomTab("result");
    try { setRunResult(await runCode({ language, code, input: customInput })); }
    catch (err) { setRunResult({ status: "Error", stderr: err.message }); }
    finally { setRunning(false); }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
    // Editor -> block direction: forward cursor line changes to the Flow panel's
    // resolver, which highlights the innermost covering block or clears the hover
    // when no block covers the line.
    editor.onDidChangeCursorPosition((e) => {
      const line = e?.position?.lineNumber;
      if (typeof line === "number") cursorResolverRef.current?.(line);
    });
  };
  const handleResetCode = () => { if (problem?.boilerplate?.[language]) setCode(problem.boilerplate[language]); };
  const handleCopyCode = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Trigger a flow trace and switch the bottom panel to the Flow tab (Req 1.1, 1.3).
  // Uses the shared `flow` instance so both the Flow tab and the parallel dry-run
  // window reflect the same trace/playback state.
  const handleVisualizeFlow = () => {
    setBottomTab("flow");
    flow.run({ language, code, input: customInput });
  };

  /* ── Loading / error / not-found ── */
  if (loading || !problem) {
    let body;
    if (loading) {
      body = (
        <div role="status" aria-live="polite" className="grid gap-4">
          <Progress label="Loading problem" />
          <p className={`${LABEL} text-fg-muted`}>Loading problem_</p>
        </div>
      );
    } else if (loadError instanceof TypeError) {
      // fetch() rejects with a TypeError when the API is unreachable.
      body = (
        <>
          <OfflineState onRetry={retryLoad} />
          <div className="flex justify-center"><BackToProblems variant="ghost" /></div>
        </>
      );
    } else if (loadError && !/^Failed to fetch problem/.test(loadError.message || "")) {
      body = (
        <ErrorState
          description={loadError.message || "This problem couldn't be loaded."}
          onRetry={retryLoad}
          action={<BackToProblems variant="ghost" />}
        />
      );
    } else {
      body = (
        <EmptyState
          icon={FileQuestion}
          title="Problem not found"
          description={`No problem matches "${problemId}", or the server couldn't return it.`}
          action={
            <>
              <Button variant="primary" asChild>
                <Link to="/problems"><ArrowLeft aria-hidden="true" /> Back to problems</Link>
              </Button>
              {loadError ? <Button variant="secondary" onClick={retryLoad}>Retry</Button> : null}
            </>
          }
        />
      );
    }
    return (
      <div className="judge-root flex min-h-screen flex-col bg-bg text-fg">
        <JudgeTopBar title={problem?.title || problemId} />
        <main id="main" className="w-full flex-1 px-[var(--gutter)] py-8">
          <div className="mx-auto grid w-full max-w-[var(--container-narrow)] gap-4">{body}</div>
        </main>
      </div>
    );
  }

  const currentLang = LANGUAGES.find(l => l.value === language);
  const busy = running || submitting;
  const firstFailed = result?.results?.find(tc => !tc.passed);
  const outputTone = (runResult || result)
    ? (runResult?.status === "Success" || result?.status === "Accepted" ? "ok" : "err")
    : null;
  const resultsTone = result ? (result.status === "Accepted" ? "ok" : "err") : null;

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  return (
    <div className="judge-root flex h-screen flex-col overflow-hidden bg-bg text-fg">

      {/* ═══════════ SLIM TOP BAR (global nav is hidden on this route) ═══════════ */}
      <JudgeTopBar
        title={problem.title}
        meta={
          <>
            {problem.difficulty && <Badge tone={DIFF_TONE[problem.difficulty] || "neutral"}>{problem.difficulty}</Badge>}
            {problem.topic && <Badge tone="neutral" className="hidden sm:inline-flex">{problem.topic}</Badge>}
          </>
        }
        actions={<VisualizerToggleButton problemId={problemId} isOpen={vizOpen} onToggle={() => setVizOpen(v => !v)} />}
      />

      {/* ═══════════ VISUALIZER DRAWER ═══════════ */}
      <VisualizerDrawer
        problemId={problemId}
        isOpen={vizOpen}
        onToggle={() => setVizOpen(v => !v)}
        testArray={testArray}
      />

      {/* ═══════════ WORKSPACE ═══════════ */}
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        <Group orientation="horizontal" className="judge-workspace min-h-0 flex-1">

          {/* ─── LEFT PANEL: Description + Results ─── */}
          <SplitPanel id="left" defaultSize="40%" minSize="25%" maxSize="60%" className="judge-pane-left border-r border-border bg-bg">
            <Tabs value={leftTab} onValueChange={setLeftTab} className="flex h-full flex-col">
              <TabsList aria-label="Problem" className="shrink-0 gap-4 px-4">
                <TabsTrigger value="description"><BookOpen aria-hidden="true" /> Description</TabsTrigger>
                <TabsTrigger value="results">
                  <ListChecks aria-hidden="true" /> Results
                  {resultsTone && <ToneDot tone={resultsTone} />}
                </TabsTrigger>
              </TabsList>

              {/* ── Description ── */}
              <TabsContent value="description" className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid gap-6 p-4 sm:p-5">
                  {problem.stageIntro && (
                    <Panel variant="accent" label="Prologue">
                      <p className="font-mono text-body text-fg-muted">{problem.stageIntro}</p>
                    </Panel>
                  )}

                  {problem.storyBriefing && (
                    <Panel label="Story">
                      <p className="font-mono text-body text-fg-muted">{problem.storyBriefing}</p>
                    </Panel>
                  )}

                  <div className="grid gap-2 font-mono text-body text-fg-muted">
                    {problem.description.split("\n").map((line, i) => (
                      <p key={i} className={line ? "" : "h-2"}>{line}</p>
                    ))}
                  </div>

                  {problem.examples?.length > 0 && (
                    <section className="grid gap-3" aria-labelledby="judge-examples">
                      <h2 id="judge-examples" className={`${LABEL} text-fg-muted`}>Examples</h2>
                      {problem.examples.map((ex, i) => (
                        <Panel key={i} label={`Example ${i + 1}`} bodyClassName="grid gap-3">
                          <div className="grid gap-1.5">
                            <div className={`${MICRO} text-fg-dim`}>Input</div>
                            <pre className={PRE}>{ex.input}</pre>
                          </div>
                          <div className="grid gap-1.5">
                            <div className={`${MICRO} text-fg-dim`}>Output</div>
                            <pre className={PRE}>{ex.output}</pre>
                          </div>
                          {ex.explanation && (
                            <div className="grid gap-1.5 border-t border-border pt-3">
                              <div className={`${MICRO} text-fg-dim`}>Explanation</div>
                              <p className="font-mono text-small text-fg-muted">{ex.explanation}</p>
                            </div>
                          )}
                        </Panel>
                      ))}
                    </section>
                  )}

                  {problem.constraints?.length > 0 && (
                    <section className="grid gap-3" aria-labelledby="judge-constraints">
                      <h2 id="judge-constraints" className={`${LABEL} text-fg-muted`}>Constraints</h2>
                      <Panel variant="inset">
                        <ul className="grid gap-1.5">
                          {problem.constraints.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span aria-hidden="true" className="mt-2 size-1 shrink-0 bg-fg-dim" />
                              <code className="font-mono text-small text-fg">{c}</code>
                            </li>
                          ))}
                        </ul>
                      </Panel>
                    </section>
                  )}
                </div>
              </TabsContent>

              {/* ── Results ── */}
              <TabsContent value="results" className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid gap-5 p-4 sm:p-5">
                  {!result && !runResult && (isLoggedIn ? (
                    <EmptyState
                      icon={Terminal}
                      title="No results yet"
                      description="Run or submit your code to see results here."
                    />
                  ) : (
                    <EmptyState
                      icon={LogIn}
                      title="Sign in to submit"
                      description="Run works without an account. Sign in to submit against every test case and save your progress."
                      action={<SignInButton size="md" />}
                    />
                  ))}

                  {runResult && (
                    <div className="grid gap-4">
                      <StatusBanner status={runResult.status} time={runResult.time} />
                      {runResult.stdout && <CodeOutput label="Standard output" icon={SquareTerminal}>{runResult.stdout}</CodeOutput>}
                      {runResult.stderr && <CodeOutput label="Error output" variant="error" icon={AlertTriangle}>{runResult.stderr}</CodeOutput>}
                    </div>
                  )}

                  {result && (
                    <div className="grid gap-5">
                      <StatusBanner status={result.status} time={result.time} />

                      {result.error && <CodeOutput label="Compilation / runtime error" variant="error" icon={AlertTriangle}>{result.error}</CodeOutput>}

                      {result.totalTests > 0 && <PassRate passed={result.totalPassed} total={result.totalTests} />}

                      {firstFailed && (
                        <Panel
                          label={
                            <span className="flex items-center gap-2 text-err">
                              <XCircle size={14} strokeWidth={1.5} aria-hidden="true" /> Test case {firstFailed.testCase} failed
                            </span>
                          }
                          actions={
                            <Tooltip content="Add this input as a custom test case" side="left">
                              <Button variant="secondary" size="sm" onClick={() => loadFailedAsTestCase(firstFailed.input, firstFailed.expected)}>
                                <ArrowUpRight aria-hidden="true" /> Load failing case
                              </Button>
                            </Tooltip>
                          }
                          className="border-err"
                          bodyClassName="grid gap-3"
                        >
                          <div className="grid gap-1.5">
                            <div className={`${MICRO} text-fg-dim`}>Input</div>
                            <pre className={PRE}>{firstFailed.input}</pre>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                              <div className={`${MICRO} text-ok`}>Expected</div>
                              <pre className={PRE}>{firstFailed.expected}</pre>
                            </div>
                            <div className="grid gap-1.5">
                              <div className={`${MICRO} text-err`}>Your output</div>
                              <pre className={PRE}>{firstFailed.actual}</pre>
                            </div>
                          </div>
                          {firstFailed.error && (
                            <CodeOutput label="Runtime error" variant="error">{firstFailed.error}</CodeOutput>
                          )}
                        </Panel>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </SplitPanel>

          <Separator className="judge-resize-handle" aria-label="Resize description and editor" />

          {/* ─── RIGHT PANEL: Editor + Testcases ─── */}
          <SplitPanel id="right" defaultSize="60%" minSize="35%" className="judge-pane-right">
            <Group orientation="vertical">

              {/* ── Editor ── */}
              <SplitPanel id="right-top" defaultSize="60%" minSize="25%">
                <div className="flex h-full flex-col bg-surface">
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-bg px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" aria-label={`Language: ${currentLang?.label}`}>
                            <Braces aria-hidden="true" />
                            {currentLang?.label}
                            <ChevronDown aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[9rem]">
                          <DropdownMenuLabel>Language</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {LANGUAGES.map((l) => (
                            <DropdownMenuItem
                              key={l.value}
                              onClick={() => handleLanguageChange(l.value)}
                              className={language === l.value ? "text-accent-ink" : undefined}
                            >
                              <Braces aria-hidden="true" />
                              {l.label}
                              {language === l.value && <Check aria-hidden="true" className="ml-auto" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <IconButton icon={RotateCcw} size="sm" aria-label="Reset to boilerplate" onClick={handleResetCode} />
                      <IconButton
                        icon={copied ? Check : Copy}
                        size="sm"
                        aria-label={copied ? "Copied" : "Copy code"}
                        onClick={handleCopyCode}
                        className={copied ? "text-ok" : undefined}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tooltip content="Trace and visualize execution flow" side="bottom">
                        <Button variant="secondary" size="sm" onClick={handleVisualizeFlow} disabled={busy}>
                          <Workflow aria-hidden="true" />
                          <span className="hidden sm:inline">Visualize flow</span>
                          <span className="sm:hidden">Flow</span>
                        </Button>
                      </Tooltip>

                      <IconButton
                        icon={Columns2}
                        size="sm"
                        variant="secondary"
                        aria-label={dryRunOpen ? "Hide dry-run window" : "Show dry-run window beside editor"}
                        aria-pressed={dryRunOpen}
                        onClick={() => setDryRunOpen(v => !v)}
                        className={dryRunOpen ? "border-accent-ink text-accent-ink" : undefined}
                      />

                      <Tooltip content="Run against active test case" side="bottom">
                        <Button variant="secondary" size="sm" onClick={handleRun} disabled={busy && !running} loading={running}>
                          <Play aria-hidden="true" /> Run
                        </Button>
                      </Tooltip>

                      {isLoggedIn ? (
                        <Tooltip content="Submit against all test cases" side="bottom">
                          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={busy && !submitting} loading={submitting}>
                            <Send aria-hidden="true" /> Submit
                          </Button>
                        </Tooltip>
                      ) : (
                        <SignInButton />
                      )}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1">
                    <Editor
                      height="100%"
                      language={currentLang?.monacoId || "cpp"}
                      theme={editorTheme}
                      value={code}
                      onChange={val => setCode(val || "")}
                      beforeMount={handleEditorBeforeMount}
                      onMount={handleEditorMount}
                      loading={<p className={`${LABEL} p-4 text-fg-muted`}>Loading editor_</p>}
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
              </SplitPanel>

              <Separator className="judge-resize-handle judge-resize-handle--row" aria-label="Resize editor and console" />

              {/* ── Bottom: Testcases / Output / Flow ── */}
              <SplitPanel id="right-bottom" defaultSize="40%" minSize="15%" maxSize="60%">
                <Tabs value={bottomTab} onValueChange={setBottomTab} className="flex h-full flex-col bg-bg">
                  <TabsList aria-label="Console" className="shrink-0 gap-4 px-3">
                    <TabsTrigger value="testcases"><FlaskConical aria-hidden="true" /> Testcases</TabsTrigger>
                    <TabsTrigger value="result">
                      <SquareTerminal aria-hidden="true" /> Output
                      {outputTone && <ToneDot tone={outputTone} />}
                    </TabsTrigger>
                    <TabsTrigger value="flow"><Workflow aria-hidden="true" /> Flow</TabsTrigger>
                  </TabsList>

                  {/* Testcases */}
                  <TabsContent value="testcases" className="min-h-0 flex-1 overflow-y-auto">
                    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
                      {testCases.map((tc, idx) => {
                        const active = activeTestCase === idx;
                        const name = tc.isCustom ? `Custom ${idx - sampleCount + 1}` : `Case ${idx + 1}`;
                        return (
                          <div key={idx} className="flex items-stretch">
                            <button
                              type="button"
                              onClick={() => setActiveTestCase(idx)}
                              aria-pressed={active}
                              className={[
                                "h-7 border px-3 font-mono text-small tabular-nums transition-colors duration-[120ms] ease-out",
                                "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus",
                                active
                                  ? "border-accent-ink bg-accent-soft text-fg"
                                  : "border-border text-fg-muted ds-hover:border-border-strong ds-hover:text-fg",
                              ].join(" ")}
                            >
                              {name}
                            </button>
                            {tc.isCustom && (
                              <IconButton
                                icon={X}
                                size="sm"
                                variant="ghost"
                                aria-label={`Remove ${name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTestCase(idx);
                                }}
                                className="-ml-px border-border"
                              />
                            )}
                          </div>
                        );
                      })}
                      <IconButton icon={Plus} size="sm" variant="secondary" aria-label="Add custom test case" onClick={addCustomTestCase} />
                    </div>

                    <div className="grid gap-3 px-3 pb-3">
                      <Textarea
                        label="Input"
                        value={testCases[activeTestCase]?.input || ""}
                        onChange={(e) => updateActiveInput(e.target.value)}
                        placeholder="Enter test input"
                        spellCheck={false}
                        rows={4}
                        className="min-h-20 resize-y font-mono text-small"
                      />
                      {testCases[activeTestCase]?.output && (
                        <div className="grid gap-1.5">
                          <div className={`${MICRO} text-fg-dim`}>Expected output</div>
                          <pre className={PRE}>{testCases[activeTestCase].output}</pre>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Output */}
                  <TabsContent value="result" className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid gap-3 px-3 py-3">
                      {!runResult && !result && (
                        <p className="flex items-center justify-center gap-2 py-8 font-mono text-small text-fg-dim">
                          <SquareTerminal size={14} strokeWidth={1.5} aria-hidden="true" /> Run your code to see output
                        </p>
                      )}

                      {runResult && (
                        <>
                          <StatusBanner status={runResult.status} time={runResult.time} compact />
                          {runResult.stdout && <CodeOutput label="Stdout" icon={SquareTerminal}>{runResult.stdout}</CodeOutput>}
                          {runResult.stderr && <CodeOutput label="Stderr" variant="error" icon={AlertTriangle}>{runResult.stderr}</CodeOutput>}
                        </>
                      )}

                      {result && !runResult && (
                        <>
                          <StatusBanner status={result.status} time={result.time} compact />
                          {result.totalTests > 0 && <PassRate passed={result.totalPassed} total={result.totalTests} compact />}
                          {result.error && <CodeOutput variant="error">{result.error}</CodeOutput>}
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Flow — kept mounted (forceMount; hidden when inactive) so the
                      Visualize Flow affordance can trigger a trace before the tab is
                      shown and so trace/playback state survives tab switches. */}
                  <TabsContent
                    value="flow"
                    forceMount
                    className={bottomTab === "flow" ? "flex min-h-0 flex-1 flex-col overflow-hidden" : undefined}
                  >
                    <CodeFlowPanel
                      ref={codeFlowRef}
                      flow={flow}
                      language={language}
                      code={code}
                      input={customInput}
                      editorRef={editorRef}
                      cursorResolverRef={cursorResolverRef}
                      active={bottomTab === "flow" || dryRunOpen}
                    />
                  </TabsContent>
                </Tabs>
              </SplitPanel>
            </Group>
          </SplitPanel>

          {/* ─── PARALLEL DRY-RUN WINDOW ───
              Rendered beside the editor only when toggled on, so the existing
              layout is unaffected by default. Shares the same `flow` instance as
              the Flow tab, so stepping/playing here is reflected there and the
              editor exec-line highlight (shared editorRef) stays in sync. */}
          {dryRunOpen && (
            <>
              <Separator className="judge-resize-handle" aria-label="Resize dry-run window" />
              <SplitPanel id="dryrun" defaultSize="32%" minSize="20%" maxSize="50%" className="judge-pane-dryrun border-l border-border bg-bg">
                <section className="flex h-full flex-col" aria-label="Dry run">
                  <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-bg px-3">
                    <span className={`${LABEL} flex items-center gap-2 text-fg`}>
                      <Columns2 size={14} strokeWidth={1.5} aria-hidden="true" className="text-accent-ink" />
                      Dry run
                    </span>
                    <IconButton icon={X} size="sm" aria-label="Hide dry-run window" onClick={() => setDryRunOpen(false)} />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <DryRunPanel
                      trace={flow.trace}
                      status={flow.status}
                      error={flow.error}
                      step={flow.step}
                      totalSteps={flow.totalSteps}
                      playing={flow.playing}
                      speed={flow.speed}
                      onForward={flow.stepForward}
                      onBackward={flow.stepBackward}
                      onPlayPause={flow.togglePlay}
                      onReset={flow.reset}
                      onSpeedChange={flow.setSpeed}
                    />
                  </div>
                </section>
              </SplitPanel>
            </>
          )}
        </Group>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────
   SUB-COMPONENTS
   ──────────────────────────────────────────── */

/* Slim top bar: back to problems, the page's single <h1>, theme toggle. */
function JudgeTopBar({ title, meta, actions }) {
  return (
    <header className="z-sticky flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-bg px-2 sm:px-3">
      <div className="flex min-w-0 items-center gap-2">
        <BackToProblems variant="ghost" size="sm" compact />
        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
        <h1 className="min-w-0 truncate font-mono text-h3 text-fg" title={title}>{title}</h1>
        {meta ? <div className="flex shrink-0 items-center gap-1.5">{meta}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {actions}
        <ThemeToggle size="sm" />
      </div>
    </header>
  );
}

function BackToProblems({ variant = "secondary", size = "md", compact = false }) {
  return (
    <Button variant={variant} size={size} asChild>
      <Link to="/problems" aria-label={compact ? "Back to problems" : undefined}>
        <ArrowLeft aria-hidden="true" />
        {compact ? <span className="hidden sm:inline">Problems</span> : "Back to problems"}
      </Link>
    </Button>
  );
}

function SignInButton({ size = "sm" }) {
  return (
    <Button variant="secondary" size={size} asChild>
      <Link to="/login"><LogIn aria-hidden="true" /> Sign in to submit</Link>
    </Button>
  );
}

const TONE_BG = { ok: "bg-ok", err: "bg-err", warn: "bg-warn" };
const TONE_TEXT = { ok: "text-ok", err: "text-err", warn: "text-warn" };
const TONE_PANEL = { ok: "border-ok bg-ok-soft", err: "border-err bg-err-soft", warn: "border-warn bg-warn-soft" };

function ToneDot({ tone }) {
  return (
    <>
      <span aria-hidden="true" className={`size-1.5 shrink-0 ${TONE_BG[tone]}`} />
      <span className="sr-only">{tone === "ok" ? "(passed)" : "(failed)"}</span>
    </>
  );
}

const STATUS_MAP = {
  Accepted: { icon: CheckCircle2, tone: "ok" },
  Success: { icon: CheckCircle2, tone: "ok" },
  "Wrong Answer": { icon: XCircle, tone: "err" },
  "Compilation Error": { icon: AlertTriangle, tone: "err" },
  "Runtime Error": { icon: AlertTriangle, tone: "warn" },
  "Time Limit Exceeded": { icon: Clock, tone: "warn" },
  Error: { icon: AlertTriangle, tone: "err" },
};

/* Verdict banner: a status-coloured Panel. */
function StatusBanner({ status, time, compact }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.Error;
  const Icon = cfg.icon;
  return (
    <Panel
      padded={false}
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 ${compact ? "px-3 py-2" : "px-4 py-3"} ${TONE_PANEL[cfg.tone]}`}
    >
      <Icon size={compact ? 14 : 16} strokeWidth={1.5} aria-hidden="true" className={`shrink-0 ${TONE_TEXT[cfg.tone]}`} />
      <span className={`flex-1 font-mono ${compact ? "text-small" : "text-body"} font-bold ${TONE_TEXT[cfg.tone]}`}>{status}</span>
      {time > 0 && (
        <Badge tone="neutral">
          <Clock size={10} strokeWidth={1.5} aria-hidden="true" /> {time} ms
        </Badge>
      )}
    </Panel>
  );
}

function PassRate({ passed, total, compact }) {
  const pct = Math.round((passed / total) * 100);
  const all = passed === total;
  return (
    <div className={compact ? "flex items-center gap-3" : "grid gap-2"}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-small tabular-nums text-fg-muted">
          <span className="font-bold text-fg">{passed}</span> / {total} passed
        </span>
        {!compact && <span className={`font-mono text-small font-bold tabular-nums ${all ? "text-ok" : "text-err"}`}>{pct}%</span>}
      </div>
      <Progress value={passed} max={total} label={`${passed} of ${total} tests passed`} className={compact ? "flex-1" : undefined} />
    </div>
  );
}

function CodeOutput({ label, variant, icon: Icon, children }) {
  const isError = variant === "error";
  return (
    <div className="grid gap-1.5">
      {label && (
        <div className={`${MICRO} flex items-center gap-1.5 ${isError ? "text-err" : "text-fg-dim"}`}>
          {Icon ? <Icon size={12} strokeWidth={1.5} aria-hidden="true" /> : null} {label}
        </div>
      )}
      <pre className={`m-0 overflow-x-auto whitespace-pre-wrap break-words border px-3 py-2 font-mono text-small text-fg ${isError ? "border-err bg-err-soft" : "border-border bg-bg"}`}>
        {children}
      </pre>
    </div>
  );
}
