import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Terminal, List } from "lucide-react";
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
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "combSort(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  gap = n; shrink = 1.3;", k: "var" }] },
  { n: 3, tokens: [{ t: "  while ", k: "kw" }, { t: "(gap > 1 || swapped) {", k: "" }] },
  { n: 4, tokens: [{ t: "    gap = floor(gap / shrink);", k: "" }] },
  { n: 5, tokens: [{ t: "    swapped = false;", k: "var" }] },
  { n: 6, tokens: [{ t: "    for ", k: "kw" }, { t: "(i = 0; i+gap < n; i++) {", k: "" }] },
  { n: 7, tokens: [{ t: "      if ", k: "kw" }, { t: "(arr[i] > arr[i+gap]) {", k: "" }] },
  { n: 8, tokens: [{ t: "        swap", k: "fn" }, { t: "(arr[i], arr[i+gap]);", k: "" }] },
  { n: 9, tokens: [{ t: "        swapped = true;", k: "" }] },
  { n: 10, tokens: [{ t: "      }", k: "dim" }] },
  { n: 11, tokens: [{ t: "    }", k: "dim" }] },
  { n: 12, tokens: [{ t: "  }", k: "dim" }] },
  { n: 13, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Default" },
  { color: V.amberDim, border: V.amber, label: "Comparing" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

const CombSortVisualizer = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const [arrayInput, setArrayInput] = useState("8,5,2,9,5,6,3");
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

    snap({ line: 1, msg: "Initialize Comb Sort.", phase: "start" });

    let gap = n, shrink = 1.3, swapped = true;

    while (gap > 1 || swapped) {
      gap = Math.floor(gap / shrink);
      if (gap < 1) gap = 1;
      snap({ line: 4, gap, msg: `New gap = ${gap}.`, phase: "info" });

      swapped = false;
      for (let i = 0; i + gap < n; i++) {
        comparisons++;
        snap({ line: 7, gap, i, j: i + gap, msg: `Compare arr[${i}] (${arr[i].value}) vs arr[${i + gap}] (${arr[i + gap].value}).`, phase: "try" });
        if (arr[i].value > arr[i + gap].value) {
          swapped = true;
          swaps++;
          [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
          snap({ line: 8, gap, i, j: i + gap, msg: `Swapped ${arr[i + gap].value} ↔ ${arr[i].value}.`, phase: "place" });
        }
      }
    }

    snap({ line: 13, finished: true, msg: `Complete. ${comparisons} comparisons, ${swaps} swaps.`, phase: "done" });
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
    if (state.finished) return "sorted";
    if (state.i === index || state.j === index) return "comparing";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />
      <VisualizerHeader title="COMB" subtitle="SORT." category="Sorting" icon={List}
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
        <IdleState icon={List} message='Enter comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
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
                {loaded && (<>
                  <VisualizerPointer index={state.i} containerId="array-container" color="amber" label="i" direction="up" />
                  <VisualizerPointer index={state.j} containerId="array-container" color="amber" label="i+gap" direction="up" />
                </>)}
              </div>
              <Legend items={LEGEND_ITEMS} />
            </div>
          </Panel>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatBlock label="Gap" value={state.gap ?? "-"} color={V.accent} />
            <StatBlock label="Comparisons" value={state.comparisons ?? 0} color={V.green} />
            <StatBlock label="Swaps" value={state.swaps ?? 0} color={V.purple} />
          </div>

          <Panel title="execution log" icon={Terminal} accent={V.green} style={{ gridColumn: "2 / 3" }}>
            <ExplanationLog entries={history.slice(0, step + 1).filter((s) => s.msg).map((s) => ({ msg: s.msg, phase: s.phase }))} autoPlay={autoPlay} />
          </Panel>
        </div>
      )}

      {loaded && (
        <div style={{ marginTop: 10 }}>
          <ComplexityFooter items={[
            { label: "Time Complexity", value: "O(N²)", color: V.amber, description: "Worst O(N²) with killer sequences (rare). Average/best O(N log N) with shrink factor 1.3." },
            { label: "Space Complexity", value: "O(1)", color: V.green, description: "In-place with constant extra memory." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default CombSortVisualizer;