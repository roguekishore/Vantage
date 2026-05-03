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
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "quickSort(arr, low, high) {", k: "" }] },
  { n: 2, tokens: [{ t: "  if ", k: "kw" }, { t: "(low < high) {", k: "" }] },
  { n: 3, tokens: [{ t: "    pivotIdx = partition", k: "fn" }, { t: "(arr, low, high);", k: "" }] },
  { n: 4, tokens: [{ t: "    quickSort", k: "fn" }, { t: "(arr, low, pivotIdx-1);", k: "" }] },
  { n: 5, tokens: [{ t: "    quickSort", k: "fn" }, { t: "(arr, pivotIdx+1, high);", k: "" }] },
  { n: 6, tokens: [{ t: "  }", k: "dim" }] },
  { n: 7, tokens: [{ t: "}", k: "dim" }] },
  { n: 8, tokens: [{ t: "function ", k: "kw" }, { t: "partition(arr, low, high) {", k: "" }] },
  { n: 9, tokens: [{ t: "  pivot = arr[high];", k: "var" }] },
  { n: 10, tokens: [{ t: "  i = low - 1;", k: "var" }] },
  { n: 11, tokens: [{ t: "  for ", k: "kw" }, { t: "(j = low; j < high; j++) {", k: "" }] },
  { n: 12, tokens: [{ t: "    if ", k: "kw" }, { t: "(arr[j] <= pivot) { i++; swap; }", k: "" }] },
  { n: 13, tokens: [{ t: "  }", k: "dim" }] },
  { n: 14, tokens: [{ t: "  swap", k: "fn" }, { t: "(arr[i+1], arr[high]);", k: "" }] },
  { n: 15, tokens: [{ t: "  return ", k: "kw" }, { t: "i + 1;", k: "" }] },
  { n: 16, tokens: [{ t: "}", k: "dim" }] },
];

const LINE_MAP = { 2: 1, 3: 2, 4: 3, 5: 12, 6: 12, 7: 12, 8: 12, 9: 12, 11: 14, 12: 14, 14: 3, 15: 2, 16: 16 };

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Default" },
  { color: V.cyanDim, border: V.cyan, label: "In Range" },
  { color: V.amberDim, border: V.amber, label: "Comparing" },
  { color: V.redDim, border: V.red, label: "Pivot" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const QuickSortVisualizer = () => {
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
    let comparisons = 0, swaps = 0;
    let sortedIndices = [];

    const snap = (extra) =>
      hist.push({ array: JSON.parse(JSON.stringify(arr)), comparisons, swaps, sortedIndices: [...sortedIndices], ...extra });

    snap({ line: 1, msg: "Initialize Quick Sort.", phase: "start" });

    const partition = (low, high) => {
      const pivot = arr[high].value;
      let i = low - 1;
      snap({ line: 9, low, high, pivot, pivotIndex: high, i, j: low, msg: `Partition [${low}..${high}]. Pivot: ${pivot}`, phase: "info" });

      for (let j = low; j < high; j++) {
        comparisons++;
        snap({ line: 12, low, high, pivot, pivotIndex: high, i, j, msg: `Compare arr[${j}] (${arr[j].value}) vs pivot (${pivot})`, phase: "try" });

        if (arr[j].value <= pivot) {
          i++;
          if (i !== j) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            swaps++;
            snap({ line: 12, low, high, pivot, pivotIndex: high, i, j, msg: `${arr[i].value} ≤ ${pivot} → swap arr[${i}] ↔ arr[${j}]`, phase: "place" });
          }
        }
      }

      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      swaps++;
      snap({ line: 14, low, high, pivot, pivotIndex: i + 1, i, msg: `Place pivot ${pivot} at index ${i + 1}`, phase: "success" });

      return i + 1;
    };

    const quickSort = (low, high) => {
      if (low < high) {
        snap({ line: 3, low, high, msg: `Sorting subarray [${low}..${high}]`, phase: "info" });
        const pi = partition(low, high);
        sortedIndices.push(pi);
        quickSort(low, pi - 1);
        quickSort(pi + 1, high);
      } else if (low === high) {
        sortedIndices.push(low);
      }
    };

    quickSort(0, n - 1);

    snap({
      line: 16,
      sortedIndices: Array.from({ length: n }, (_, k) => k),
      finished: true,
      msg: `Complete. ${comparisons} comparisons, ${swaps} swaps.`,
      phase: "done",
    });

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
    if (state.pivotIndex === index) return "pivot";
    if (state.j === index) return "comparing";
    if (state.low !== null && state.high !== null && index >= state.low && index <= state.high) return "range";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />

      <VisualizerHeader
        title="QUICK"
        subtitle="SORT."
        category="Sorting"
        right={
          <ControlBar
            loaded={loaded} playing={autoPlay} step={step} totalSteps={history.length}
            speed={speed} onRun={load} onReset={reset} onForward={fwd} onBackward={back}
            onPlayPause={() => { if (step >= history.length - 1) setStep(0); setAutoPlay((p) => !p); }} onSpeedChange={setSpeed}
          >
            <InputField label="Array" value={arrayInput} onChange={(e) => setArrayInput(e.target.value)}
              disabled={loaded} inputProps={{ onKeyDown: (e) => e.key === "Enter" && load() }} style={{ flex: 1, minWidth: 160 }} />
          </ControlBar>
        }
      />

      {loaded && <ProgressBar step={step} totalSteps={history.length} />}
      <Divider spacing={12} />

      {!loaded ? (
        <IdleState icon={BarChart3} message='Enter comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", gridTemplateRows: "auto auto", gap: 14 }}>
          <Panel title="pseudocode.js" icon={Terminal} style={{ gridRow: "1 / 3" }}>
            <div style={{ padding: "12px 0", flex: 1, overflow: "hidden" }}>
              <CodePanel lines={CODE_LINES} activeLine={state.line} />
            </div>
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
                {state.low !== null && state.low !== undefined && state.high !== null && state.high !== undefined && (
                  <>
                    <VisualizerPointer index={state.low} containerId="array-container" color="blue" label="L" direction="up" />
                    <VisualizerPointer index={state.high} containerId="array-container" color="purple" label="H" direction="up" />
                    {state.pivotIndex !== null && state.pivotIndex !== undefined && (
                      <VisualizerPointer index={state.pivotIndex} containerId="array-container" color="red" label="P" direction="up" />
                    )}
                  </>
                )}
              </div>
              <Legend items={LEGEND_ITEMS} />
            </div>
          </Panel>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatBlock label="Comparisons" value={state.comparisons ?? 0} color={V.green} />
            <StatBlock label="Swaps" value={state.swaps ?? 0} color={V.accent} />
            <StatBlock label="Progress" value={`${history.length > 1 ? Math.round((step / (history.length - 1)) * 100) : 0}%`} color={V.purple} />
          </div>

          <Panel title="execution log" icon={Terminal} accent={V.green} style={{ gridColumn: "2 / 3" }}>
            <ExplanationLog entries={history.slice(0, step + 1).filter((s) => s.msg).map((s) => ({ msg: s.msg, phase: s.phase }))} autoPlay={autoPlay} />
          </Panel>
        </div>
      )}

      {loaded && (
        <div style={{ marginTop: 10 }}>
          <ComplexityFooter items={[
            { label: "Time Complexity", value: "O(N log N)", color: V.amber, description: "Average case O(N log N) with balanced partitions. Worst case O(N²) when pivot is always min/max (sorted arrays). Randomized pivot mitigates this." },
            { label: "Space Complexity", value: "O(log N)", color: V.green, description: "Recursion depth is O(log N) in the average case. Worst case O(N) for degenerate partitions. In-place — no auxiliary arrays." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default QuickSortVisualizer;
