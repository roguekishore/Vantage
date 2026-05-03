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
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "heapSort(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  buildMaxHeap", k: "fn" }, { t: "(arr);", k: "" }] },
  { n: 3, tokens: [{ t: "  for ", k: "kw" }, { t: "(i = n-1; i > 0; i--) {", k: "" }] },
  { n: 4, tokens: [{ t: "    swap", k: "fn" }, { t: "(arr[0], arr[i]);", k: "" }] },
  { n: 5, tokens: [{ t: "    heapify", k: "fn" }, { t: "(arr, i, 0);", k: "" }] },
  { n: 6, tokens: [{ t: "  }", k: "dim" }] },
  { n: 7, tokens: [{ t: "}", k: "dim" }] },
  { n: 8, tokens: [{ t: "", k: "dim" }] },
  { n: 9, tokens: [{ t: "function ", k: "kw" }, { t: "heapify(arr, size, i) {", k: "" }] },
  { n: 10, tokens: [{ t: "  largest = i;", k: "var" }] },
  { n: 11, tokens: [{ t: "  if ", k: "kw" }, { t: "(left < size && arr[l] > arr[largest])", k: "" }] },
  { n: 12, tokens: [{ t: "    largest = left;", k: "" }] },
  { n: 13, tokens: [{ t: "  if ", k: "kw" }, { t: "(right < size && arr[r] > arr[largest])", k: "" }] },
  { n: 14, tokens: [{ t: "    largest = right;", k: "" }] },
  { n: 15, tokens: [{ t: "  if ", k: "kw" }, { t: "(largest != i) {", k: "" }] },
  { n: 16, tokens: [{ t: "    swap", k: "fn" }, { t: "(arr[i], arr[largest]);", k: "" }] },
  { n: 17, tokens: [{ t: "    heapify", k: "fn" }, { t: "(arr, size, largest);", k: "" }] },
  { n: 18, tokens: [{ t: "  }", k: "dim" }] },
  { n: 19, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "In Heap" },
  { color: V.redDim, border: V.red, label: "Root" },
  { color: V.amberDim, border: V.amber, label: "Comparing" },
  { color: V.accentDim, border: V.accent, label: "Largest" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const HeapSortVisualizer = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const [arrayInput, setArrayInput] = useState("12,11,13,5,6,7");
  const [loaded, setLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef(null);

  /* ── Algorithm ── */
  const generateHistory = useCallback((initialArray) => {
    let arr = JSON.parse(JSON.stringify(initialArray));
    let n = arr.length;
    const hist = [];
    let comparisons = 0, swaps = 0;
    let sortedIndices = [];

    const snap = (extra) =>
      hist.push({ array: JSON.parse(JSON.stringify(arr)), comparisons, swaps, sortedIndices: [...sortedIndices], ...extra });

    snap({ line: 1, msg: "Initialize Heap Sort.", phase: "start" });

    const heapify = (heapSize, i) => {
      let largest = i, left = 2 * i + 1, right = 2 * i + 2;

      snap({ line: 9, heapSize, rootIndex: i, msg: `Heapify subtree at index ${i}.`, phase: "info" });

      if (left < heapSize) {
        comparisons++;
        snap({ line: 11, heapSize, rootIndex: i, leftIndex: left, largestIndex: largest, msg: `Compare root (${arr[i].value}) vs left child (${arr[left].value}).`, phase: "try" });
        if (arr[left].value > arr[largest].value) largest = left;
      }
      if (right < heapSize) {
        comparisons++;
        snap({ line: 13, heapSize, rootIndex: i, rightIndex: right, largestIndex: largest, msg: `Compare largest (${arr[largest].value}) vs right child (${arr[right].value}).`, phase: "try" });
        if (arr[right].value > arr[largest].value) largest = right;
      }
      if (largest !== i) {
        snap({ line: 16, heapSize, rootIndex: i, largestIndex: largest, msg: `Swap root ${arr[i].value} ↔ largest ${arr[largest].value}.`, phase: "place" });
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        swaps++;
        heapify(heapSize, largest);
      }
    };

    // Build max heap
    snap({ line: 2, msg: "Building max heap from unsorted array.", phase: "info" });
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
    snap({ line: 2, msg: "✓ Max heap built. Largest element at root.", phase: "success" });

    // Extract elements
    for (let i = n - 1; i > 0; i--) {
      snap({ line: 4, heapSize: i + 1, rootIndex: 0, msg: `Swap root (${arr[0].value}) with last heap element (${arr[i].value}).`, phase: "place" });
      [arr[0], arr[i]] = [arr[i], arr[0]];
      swaps++;
      sortedIndices.unshift(i);
      heapify(i, 0);
    }
    sortedIndices.unshift(0);

    snap({ line: 7, sortedIndices: [...sortedIndices], finished: true, msg: `Complete. ${comparisons} comparisons, ${swaps} swaps.`, phase: "done" });

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
    if (state.rootIndex === index) return "pivot";
    if (state.largestIndex === index && state.largestIndex !== state.rootIndex) return "active";
    if (state.leftIndex === index || state.rightIndex === index) return "comparing";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />

      <VisualizerHeader title="HEAP" subtitle="SORT." category="Sorting"
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
        <IdleState icon={BarChart3} message='Enter comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", gridTemplateRows: "auto auto", gap: 14 }}>
          <Panel title="pseudocode.js" icon={Terminal} style={{ gridRow: "1 / 3" }}>
            <div style={{ padding: "12px 0", flex: 1, overflow: "hidden" }}><CodePanel lines={CODE_LINES} activeLine={state.line} /></div>
          </Panel>

          <Panel title={`array · ${array.length} elements`} icon={BarChart3} accent={V.amber}>
            <div style={{ padding: "16px 16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div id="array-container" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", position: "relative", paddingBottom: "3rem" }}>
                {array.map((item, index) => (
                  <div key={item.id} id={`array-container-element-${index}`}>
                    <ArrayBox value={item.value} index={index} variant={getVariant(index)} size={52} showIndex />
                  </div>
                ))}
                {state.rootIndex != null && (
                  <VisualizerPointer index={state.rootIndex} containerId="array-container" color="red" label="R" direction="up" />
                )}
                {state.largestIndex != null && state.largestIndex !== state.rootIndex && (
                  <VisualizerPointer index={state.largestIndex} containerId="array-container" color="blue" label="Lg" direction="up" />
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
            { label: "Time Complexity", value: "O(N log N)", color: V.amber, description: "Always O(N log N). Build heap is O(N), each of N extractions takes O(log N) for heapify. Consistent across all inputs." },
            { label: "Space Complexity", value: "O(1)", color: V.green, description: "In-place sorting. Only constant extra space. Recursive heapify uses O(log N) stack space." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default HeapSortVisualizer;
