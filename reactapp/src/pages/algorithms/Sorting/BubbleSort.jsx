import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Terminal } from "lucide-react";
import {
    V, MONO,
    VisualizerShell, VisualizerHeader, ControlBar, ProgressBar,
    Panel, CodePanel, ExplanationLog, Divider,
    StatBlock, Legend, ComplexityFooter,
    ArrayBox, InputField, IdleState,
} from "@/components/visualizer";
import VisualizerPointer from "@/components/visualizer/VisualizerPointer";
import CustomCursor from "@/components/common/CustomCursor";

/* ─────────────────────────────────────────────────────────────
   CODE LINES
───────────────────────────────────────────────────────────── */
const CODE_LINES = [
    { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "bubbleSort(arr) {", k: "" }] },
    { n: 2, tokens: [{ t: "  for ", k: "kw" }, { t: "(i = 0; i < n-1; i++) {", k: "" }] },
    { n: 3, tokens: [{ t: "    for ", k: "kw" }, { t: "(j = 0; j < n-i-1; j++) {", k: "" }] },
    { n: 4, tokens: [{ t: "      if ", k: "kw" }, { t: "(arr[j] > arr[j+1]) {", k: "" }] },
    { n: 5, tokens: [{ t: "        swap", k: "fn" }, { t: "(arr[j], arr[j+1]);", k: "" }] },
    { n: 6, tokens: [{ t: "      }", k: "dim" }] },
    { n: 7, tokens: [{ t: "    }", k: "dim" }] },
    { n: 8, tokens: [{ t: "  }", k: "dim" }] },
    { n: 9, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
    { color: V.elevated, border: V.borderHi, label: "Unsorted" },
    { color: V.amberDim, border: V.amber, label: "Comparing" },
    { color: V.purpleDim, border: V.purple, label: "Swapping" },
    { color: V.greenDim, border: V.green, label: "Sorted" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const BubbleSortVisualizer = () => {
    const [history, setHistory] = useState([]);
    const [step, setStep] = useState(-1);
    const [arrayInput, setArrayInput] = useState("8,5,2,9,5,6,3");
    const [loaded, setLoaded] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);
    const [speed, setSpeed] = useState(300);
    const intervalRef = useRef(null);

    /* ── Algorithm ── */
    const generateHistory = useCallback((initialArray) => {
        const arr = JSON.parse(JSON.stringify(initialArray));
        const n = arr.length;
        const hist = [];
        let comparisons = 0;
        let swaps = 0;

        const snap = (extra) =>
            hist.push({ array: JSON.parse(JSON.stringify(arr)), comparisons, swaps, ...extra });

        snap({ line: 1, msg: "Initialize Bubble Sort.", phase: "start" });

        for (let i = 0; i < n - 1; i++) {
            let swappedInPass = false;
            snap({
                line: 2, i, explanation: `Start Pass ${i + 1}.`,
                msg: `▶ Pass ${i + 1}`, phase: "info",
            });

            for (let j = 0; j < n - i - 1; j++) {
                comparisons++;
                snap({
                    line: 4, i, j,
                    msg: `Compare arr[${j}] (${arr[j].value}) vs arr[${j + 1}] (${arr[j + 1].value})`,
                    phase: "try",
                });

                if (arr[j].value > arr[j + 1].value) {
                    swappedInPass = true;
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    swaps++;
                    snap({
                        line: 5, i, j,
                        msg: `✓ Swapped ${arr[j].value} ↔ ${arr[j + 1].value}`,
                        phase: "place",
                    });
                }
            }

            if (!swappedInPass) {
                snap({
                    line: 8, i,
                    msg: `No swaps in pass ${i + 1} — array sorted early.`,
                    phase: "success",
                });
                break;
            }
        }

        snap({
            line: 9,
            sortedIndices: Array.from({ length: n }, (_, k) => k),
            finished: true,
            msg: `Complete. ${comparisons} comparisons, ${swaps} swaps.`,
            phase: "done",
        });

        setHistory(hist);
        setStep(0);
    }, []);

    /* ── Controls ── */
    const load = () => {
        const nums = arrayInput.split(",").map((s) => s.trim()).filter(Boolean).map(Number);
        if (nums.some(isNaN) || nums.length === 0) { alert("Invalid input."); return; }
        const objects = nums.map((value, id) => ({ value, id }));
        setLoaded(true);
        generateHistory(objects);
    };

    const reset = () => { setLoaded(false); setHistory([]); setStep(-1); setAutoPlay(false); };
    const fwd = useCallback(() => setStep((s) => Math.min(s + 1, history.length - 1)), [history.length]);
    const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

    /* Auto-play */
    useEffect(() => {
        if (!autoPlay) { clearInterval(intervalRef.current); return; }
        intervalRef.current = setInterval(() => {
            setStep((s) => { if (s >= history.length - 1) { setAutoPlay(false); return s; } return s + 1; });
        }, Math.max(50, speed));
        return () => clearInterval(intervalRef.current);
    }, [autoPlay, speed, history.length]);

    /* Keyboard */
    useEffect(() => {
        const h = (e) => {
            if (!loaded) return;
            if (e.key === "ArrowRight") fwd();
            if (e.key === "ArrowLeft") back();
            if (e.key === " ") { e.preventDefault(); setAutoPlay((p) => !p); }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [loaded, fwd, back]);

    const state = history[step] || {};
    const { array = [] } = state;

    const getVariant = (index) => {
        if (state.finished || state.sortedIndices?.includes(index)) return "sorted";
        if (state.j === index || state.j + 1 === index) {
            return state.line === 5 ? "swapping" : "comparing";
        }
        return "default";
    };

    /* ── Render ── */
    return (
        <VisualizerShell noCursor>
            <CustomCursor />

            <VisualizerHeader
                title="BUBBLE"
                subtitle="SORT."
                category="Sorting"
                right={
                    <ControlBar
                        loaded={loaded} playing={autoPlay} step={step} totalSteps={history.length}
                        speed={speed} onRun={load} onReset={reset} onForward={fwd} onBackward={back}
                        onPlayPause={() => { if (step >= history.length - 1) setStep(0); setAutoPlay((p) => !p); }} onSpeedChange={setSpeed}
                    >
                        <InputField
                            label="Array"
                            value={arrayInput}
                            onChange={(e) => setArrayInput(e.target.value)}
                            disabled={loaded}
                            inputProps={{ onKeyDown: (e) => e.key === "Enter" && load() }}
                            style={{ flex: 1, minWidth: 160 }}
                        />
                    </ControlBar>
                }
            />

            {loaded && <ProgressBar step={step} totalSteps={history.length} />}
            <Divider spacing={12} />

            {!loaded ? (
                <IdleState icon={BarChart3} message='Enter comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", gridTemplateRows: "auto auto", gap: 14 }}>

                    {/* ── Code Panel ── */}
                    <Panel title="pseudocode.js" icon={Terminal} style={{ gridRow: "1 / 3" }}>
                        <div style={{ padding: "12px 0", flex: 1, overflow: "hidden" }}>
                            <CodePanel lines={CODE_LINES} activeLine={state.line} />
                        </div>
                    </Panel>

                    {/* ── Array Visualization ── */}
                    <Panel title={`array · ${array.length} elements`} icon={BarChart3} accent={V.amber}>
                        <div style={{ padding: "16px 16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                            <div id="array-container" style={{ position: "relative", width: `${array.length * 4.5}rem`, height: "8rem" }}>
                                {array.map((item, index) => (
                                    <div
                                        key={item.id}
                                        id={`array-container-element-${index}`}
                                        style={{ position: "absolute", left: `${index * 4.5}rem`, transition: "left 0.4s ease" }}
                                    >
                                        <ArrayBox value={item.value} index={index} variant={getVariant(index)} showIndex />
                                    </div>
                                ))}
                                {state.j !== null && state.j !== undefined && (
                                    <>
                                        <VisualizerPointer index={state.j} containerId="array-container" color="amber" label="j" direction="up" />
                                        <VisualizerPointer index={state.j + 1} containerId="array-container" color="amber" label="j+1" direction="up" />
                                    </>
                                )}
                            </div>
                            <Legend items={LEGEND_ITEMS} />
                        </div>
                    </Panel>

                    {/* ── Stats ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <StatBlock label="Comparisons" value={state.comparisons ?? 0} color={V.green} />
                        <StatBlock label="Swaps" value={state.swaps ?? 0} color={V.accent} />
                        <StatBlock label="Progress" value={`${history.length > 1 ? Math.round((step / (history.length - 1)) * 100) : 0}%`} color={V.purple} />
                    </div>

                    {/* ── Execution Log ── */}
                    <Panel title="execution log" icon={Terminal} accent={V.green} style={{ gridColumn: "2 / 3" }}>
                        <ExplanationLog
                            entries={history.slice(0, step + 1).filter((s) => s.msg).map((s) => ({ msg: s.msg, phase: s.phase }))}
                            autoPlay={autoPlay}
                        />
                    </Panel>
                </div>
            )}

            {/* ── Complexity Footer ── */}
            {loaded && (
                <div style={{ marginTop: 10 }}>
                    <ComplexityFooter items={[
                        { label: "Time Complexity", value: "O(N²)", color: V.amber, description: "Nested loops compare adjacent elements. Worst/average case is O(N²). Best case O(N) with early termination when no swaps occur in a pass." },
                        { label: "Space Complexity", value: "O(1)", color: V.green, description: "Sorts in-place. Only a constant amount of extra space is used for the swap variable." },
                    ]} />
                </div>
            )}
        </VisualizerShell>
    );
};

export default BubbleSortVisualizer;
