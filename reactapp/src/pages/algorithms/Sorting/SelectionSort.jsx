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
  { n: 1, tokens: [{ t: "for ", k: "kw" }, { t: "(i = 0; i < n-1; i++) {", k: "" }] },
  { n: 2, tokens: [{ t: "  min = i;", k: "var" }] },
  { n: 3, tokens: [{ t: "  for ", k: "kw" }, { t: "(j = i+1; j < n; j++) {", k: "" }] },
  { n: 4, tokens: [{ t: "    if ", k: "kw" }, { t: "(arr[j] < arr[min]) {", k: "" }] },
  { n: 5, tokens: [{ t: "      min = j;", k: "fn" }] },
  { n: 6, tokens: [{ t: "    }", k: "dim" }] },
  { n: 7, tokens: [{ t: "  }", k: "dim" }] },
  { n: 8, tokens: [{ t: "  swap", k: "fn" }, { t: "(arr[i], arr[min]);", k: "" }] },
  { n: 9, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Unsorted" },
  { color: V.accentDim, border: V.accent, label: "Current (i)" },
  { color: V.amberDim, border: V.amber, label: "Scanning (j)" },
  { color: V.redDim, border: V.red, label: "Min found" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const SelectionSortVisualizer = () => {
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

    snap({ line: 1, msg: "Initialize Selection Sort.", phase: "start" });

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      snap({ line: 2, i, minIdx, msg: `Pass ${i + 1}: assume min at index ${i} (${arr[i].value}).`, phase: "info" });

      for (let j = i + 1; j < n; j++) {
        comparisons++;
        snap({ line: 4, i, j, minIdx, msg: `Compare arr[${j}] (${arr[j].value}) vs current min (${arr[minIdx].value}).`, phase: "try" });

        if (arr[j].value < arr[minIdx].value) {
          minIdx = j;
          snap({ line: 5, i, j, minIdx, msg: `✓ New minimum found: ${arr[j].value} at index ${j}.`, phase: "success" });
        }
      }

      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        swaps++;
        snap({ line: 8, i, minIdx, msg: `Swap arr[${i}] ↔ arr[${minIdx}]. Placed ${arr[i].value} at position ${i}.`, phase: "place" });
      } else {
        snap({ line: 8, i, minIdx, msg: `Element ${arr[i].value} already in correct position.`, phase: "info" });
      }

      sortedIndices.push(i);
    }
    sortedIndices.push(n - 1);

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
    if (state.minIdx === index && state.minIdx !== state.i) return "pivot";
    if (state.j === index) return "comparing";
    if (state.i === index) return "active";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />

      <VisualizerHeader
        title="SELECTION"
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
                {state.i !== null && state.i !== undefined && (
                  <>
                    <VisualizerPointer index={state.i} containerId="array-container" color="blue" label="i" direction="up" />
                    {state.j !== null && state.j !== undefined && (
                      <VisualizerPointer index={state.j} containerId="array-container" color="yellow" label="j" direction="up" />
                    )}
                    {state.minIdx !== null && state.minIdx !== undefined && state.minIdx !== state.i && (
                      <VisualizerPointer index={state.minIdx} containerId="array-container" color="red" label="min" direction="up" />
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
            { label: "Time Complexity", value: "O(N²)", color: V.amber, description: "Always O(N²) — inner loop scans remaining elements regardless. No best-case optimization unlike Bubble Sort." },
            { label: "Space Complexity", value: "O(1)", color: V.green, description: "Sorts in-place. Only constant extra space for min index and swap variable." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default SelectionSortVisualizer;
