import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Terminal, Layers } from "lucide-react";
import {
  V,
  VisualizerShell, VisualizerHeader, ControlBar, ProgressBar,
  Panel, CodePanel, ExplanationLog, Divider,
  StatBlock, Legend, ComplexityFooter,
  ArrayBox, InputField, IdleState,
} from "@/components/visualizer";
import VisualizerPointer from "@/components/visualizer/VisualizerPointer";
import CustomCursor from "@/components/common/CustomCursor";

const CODE_LINES = [
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "shellSort(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  for ", k: "kw" }, { t: "(gap = n/2; gap > 0; gap /= 2) {", k: "" }] },
  { n: 3, tokens: [{ t: "    for ", k: "kw" }, { t: "(i = gap; i < n; i++) {", k: "" }] },
  { n: 4, tokens: [{ t: "      temp = arr[i];", k: "var" }] },
  { n: 5, tokens: [{ t: "      while ", k: "kw" }, { t: "(j >= gap && arr[j-gap] > temp) {", k: "" }] },
  { n: 6, tokens: [{ t: "        arr[j] = arr[j-gap];", k: "" }] },
  { n: 7, tokens: [{ t: "        j -= gap;", k: "" }] },
  { n: 8, tokens: [{ t: "      }", k: "dim" }] },
  { n: 9, tokens: [{ t: "      arr[j] = temp;", k: "" }] },
  { n: 10, tokens: [{ t: "    }", k: "dim" }] },
  { n: 11, tokens: [{ t: "  }", k: "dim" }] },
  { n: 12, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Default" },
  { color: V.purpleDim, border: V.purple, label: "Current (i)" },
  { color: V.amberDim, border: V.amber, label: "Comparing" },
  { color: V.accentDim, border: V.accent, label: "Inserting (j)" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

const ShellSortVisualizer = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const [arrayInput, setArrayInput] = useState("12,34,54,2,3,9,23,18,7");
  const [loaded, setLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef(null);

  const generateHistory = useCallback((initialArray) => {
    const arr = JSON.parse(JSON.stringify(initialArray));
    const n = arr.length;
    const hist = [];
    let swaps = 0, comparisons = 0;

    const snap = (extra) => hist.push({ array: JSON.parse(JSON.stringify(arr)), comparisons, swaps, ...extra });

    snap({ line: 1, msg: "Initialize Shell Sort.", phase: "start" });

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      snap({ line: 2, gap, msg: `Start pass with gap = ${gap}.`, phase: "info" });
      for (let i = gap; i < n; i++) {
        snap({ line: 3, gap, i, msg: `Select element at index ${i} (${arr[i].value}) as key.`, phase: "info" });
        const temp = arr[i];
        let j = i;
        while (j >= gap) {
          comparisons++;
          snap({ line: 5, gap, i, j, msg: `Compare arr[${j - gap}] (${arr[j - gap].value}) vs key (${temp.value}).`, phase: "try" });
          if (arr[j - gap].value > temp.value) {
            swaps++;
            arr[j] = arr[j - gap];
            j -= gap;
            snap({ line: 6, gap, i, j, msg: `Shift ${arr[j + gap]?.value ?? arr[j].value} right by gap.`, phase: "place" });
          } else break;
        }
        arr[j] = temp;
        snap({ line: 9, gap, i, j, msg: `Place key ${temp.value} at position ${j}.`, phase: "success" });
      }
      snap({ line: 11, gap, msg: `✓ Pass complete with gap = ${gap}.`, phase: "success" });
    }

    snap({ line: 12, sortedIndices: Array.from({ length: n }, (_, k) => k), finished: true, msg: `Complete. ${comparisons} comparisons, ${swaps} shifts.`, phase: "done" });
    setHistory(hist);
    setStep(0);
  }, []);

  const load = () => {
    const nums = arrayInput.split(",").map((s) => s.trim()).filter(Boolean).map(Number);
    if (nums.some(isNaN) || nums.length === 0) { alert("Invalid input."); return; }
    setLoaded(true);
    generateHistory(nums.map((value, id) => ({ value, id })));
  };

  const reset = () => { setLoaded(false); setHistory([]); setStep(-1); setAutoPlay(false); };
  const fwd = useCallback(() => setStep((s) => Math.min(s + 1, history.length - 1)), [history.length]);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    if (!autoPlay) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setStep((s) => { if (s >= history.length - 1) { setAutoPlay(false); return s; } return s + 1; });
    }, Math.max(50, speed));
    return () => clearInterval(intervalRef.current);
  }, [autoPlay, speed, history.length]);

  useEffect(() => {
    const h = (e) => { if (!loaded) return; if (e.key === "ArrowRight") fwd(); if (e.key === "ArrowLeft") back(); if (e.key === " ") { e.preventDefault(); setAutoPlay((p) => !p); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [loaded, fwd, back]);

  const state = history[step] || {};
  const { array = [] } = state;

  const getVariant = (index) => {
    if (state.finished || state.sortedIndices?.includes(index)) return "sorted";
    if (state.j === index) return "active";
    if (state.i === index) return "swapping";
    if (state.j != null && state.gap && index === state.j - state.gap) return "comparing";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />
      <VisualizerHeader title="SHELL" subtitle="SORT." category="Sorting" icon={Layers}
        right={
          <ControlBar loaded={loaded} playing={autoPlay} step={step} totalSteps={history.length}
            speed={speed} onRun={load} onReset={reset} onForward={fwd} onBackward={back}
            onPlayPause={() => { if (step >= history.length - 1) setStep(0); setAutoPlay((p) => !p); }} onSpeedChange={setSpeed}>
            <InputField label="Array" value={arrayInput} onChange={(e) => setArrayInput(e.target.value)}
              disabled={loaded} inputProps={{ onKeyDown: (e) => e.key === "Enter" && load() }} style={{ flex: 1, minWidth: 160 }} />
          </ControlBar>
        }
      />
      {loaded && <ProgressBar step={step} totalSteps={history.length} />}
      <Divider spacing={12} />

      {!loaded ? (
        <IdleState icon={Layers} message='Enter comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", gridTemplateRows: "auto auto", gap: 14 }}>
          <Panel title="pseudocode.js" icon={Terminal} style={{ gridRow: "1 / 3" }}>
            <div style={{ padding: "12px 0", flex: 1, overflow: "hidden" }}><CodePanel lines={CODE_LINES} activeLine={state.line} /></div>
          </Panel>

          <Panel title={`array · ${array.length} elements`} icon={BarChart3} accent={V.amber}>
            <div style={{ padding: "16px 16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div id="array-container" style={{ position: "relative", width: `${array.length * 4.5}rem`, height: "8rem" }}>
                {array.map((item, index) => (
                  <div key={item.id} id={`array-container-element-${index}`}
                    style={{ position: "absolute", left: `${index * 4.5}rem`, transition: "left 0.4s ease" }}>
                    <ArrayBox value={item.value} index={index} variant={getVariant(index)} showIndex />
                  </div>
                ))}
                {loaded && (
                  <>
                    <VisualizerPointer index={state.i} containerId="array-container" color="purple" label="i" direction="up" />
                    <VisualizerPointer index={state.j} containerId="array-container" color="cyan" label="j" direction="up" />
                    {state.gap != null && state.j != null && state.j - state.gap >= 0 && (
                      <VisualizerPointer index={state.j - state.gap} containerId="array-container" color="amber" label="j-gap" direction="up" />
                    )}
                  </>
                )}
              </div>
              <Legend items={LEGEND_ITEMS} />
            </div>
          </Panel>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatBlock label="Gap" value={state.gap ?? "-"} color={V.accent} />
            <StatBlock label="Comparisons" value={state.comparisons ?? 0} color={V.green} />
            <StatBlock label="Shifts" value={state.swaps ?? 0} color={V.purple} />
          </div>

          <Panel title="execution log" icon={Terminal} accent={V.green} style={{ gridColumn: "2 / 3" }}>
            <ExplanationLog entries={history.slice(0, step + 1).filter((s) => s.msg).map((s) => ({ msg: s.msg, phase: s.phase }))} autoPlay={autoPlay} />
          </Panel>
        </div>
      )}

      {loaded && (
        <div style={{ marginTop: 10 }}>
          <ComplexityFooter items={[
            { label: "Time Complexity", value: "O(N²)", color: V.amber, description: "Worst case O(N²) with Shell's sequence. Average O(N^3/2). Best O(N log N) for nearly sorted inputs." },
            { label: "Space Complexity", value: "O(1)", color: V.green, description: "In-place sorting with constant extra memory." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default ShellSortVisualizer;
