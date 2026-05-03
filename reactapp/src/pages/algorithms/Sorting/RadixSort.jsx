import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Terminal, Shuffle } from "lucide-react";
import {
  V,
  VisualizerShell, VisualizerHeader, ControlBar, ProgressBar,
  Panel, CodePanel, ExplanationLog, Divider,
  StatBlock, Legend, ComplexityFooter,
  ArrayBox, InputField, IdleState,
} from "@/components/visualizer";
import CustomCursor from "@/components/common/CustomCursor";

const CODE_LINES = [
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "radixSort(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  max = getMax", k: "fn" }, { t: "(arr);", k: "" }] },
  { n: 3, tokens: [{ t: "  for ", k: "kw" }, { t: "(exp = 1; max/exp > 0; exp *= 10) {", k: "" }] },
  { n: 4, tokens: [{ t: "    countingSort", k: "fn" }, { t: "(arr, exp);", k: "" }] },
  { n: 5, tokens: [{ t: "  }", k: "dim" }] },
  { n: 6, tokens: [{ t: "}", k: "dim" }] },
  { n: 7, tokens: [{ t: "", k: "dim" }] },
  { n: 8, tokens: [{ t: "function ", k: "kw" }, { t: "countingSort(arr, exp) {", k: "" }] },
  { n: 9, tokens: [{ t: "  count digits → cumulate → place;", k: "comment" }] },
  { n: 10, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Default" },
  { color: V.amberDim, border: V.amber, label: "Processing" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

const RadixSortVisualizer = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const [arrayInput, setArrayInput] = useState("170,45,75,90,802,24,2,66");
  const [loaded, setLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef(null);

  const generateHistory = useCallback((initialArray) => {
    const arr = JSON.parse(JSON.stringify(initialArray));
    const n = arr.length;
    const hist = [];
    let iterations = 0, placements = 0;

    const snap = (extra) => hist.push({ array: JSON.parse(JSON.stringify(arr)), iterations, placements, ...extra });

    snap({ line: 1, msg: "Initialize Radix Sort.", phase: "start" });

    const getMax = () => Math.max(...arr.map((o) => o.value));

    const countingSort = (exp) => {
      const output = new Array(n);
      const count = new Array(10).fill(0);

      snap({ line: 4, msg: `Counting sort for digit at exponent ${exp}.`, phase: "info" });

      for (let i = 0; i < n; i++) {
        const idx = Math.floor(arr[i].value / exp) % 10;
        count[idx]++;
        iterations++;
        snap({ line: 9, digitIndex: i, msg: `digit(${arr[i].value}) = ${idx} → count[${idx}]++`, phase: "try" });
      }
      for (let i = 1; i < 10; i++) count[i] += count[i - 1];

      for (let i = n - 1; i >= 0; i--) {
        const idx = Math.floor(arr[i].value / exp) % 10;
        output[count[idx] - 1] = arr[i];
        placements++;
        snap({ line: 9, digitIndex: i, msg: `Place ${arr[i].value} at output[${count[idx] - 1}].`, phase: "place" });
        count[idx]--;
      }

      for (let i = 0; i < n; i++) arr[i] = output[i];
    };

    const max = getMax();
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      snap({ line: 3, msg: `Sort by digit at position 10^${Math.log10(exp)} (exp = ${exp}).`, phase: "info" });
      countingSort(exp);
      snap({ line: 5, msg: `✓ Pass for exp = ${exp} complete.`, phase: "success" });
    }

    snap({ line: 6, finished: true, sortedIndices: Array.from({ length: n }, (_, k) => k), msg: `Complete. ${iterations} digit reads, ${placements} placements.`, phase: "done" });
    setHistory(hist);
    setStep(0);
  }, []);

  const load = () => {
    const nums = arrayInput.split(",").map((s) => s.trim()).filter(Boolean).map(Number);
    if (nums.some(isNaN) || nums.length === 0 || nums.some((n) => n < 0)) { alert("Use non-negative comma-separated numbers."); return; }
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
    if (state.digitIndex === index) return "comparing";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />
      <VisualizerHeader title="RADIX" subtitle="SORT." category="Sorting" icon={Shuffle}
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
        <IdleState icon={Shuffle} message='Enter non-negative comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", gridTemplateRows: "auto auto", gap: 14 }}>
          <Panel title="pseudocode.js" icon={Terminal} style={{ gridRow: "1 / 3" }}>
            <div style={{ padding: "12px 0", flex: 1, overflow: "hidden" }}><CodePanel lines={CODE_LINES} activeLine={state.line} /></div>
          </Panel>

          <Panel title={`array · ${array.length} elements`} icon={BarChart3} accent={V.amber}>
            <div style={{ padding: "20px 16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {array.map((item, index) => (
                  <ArrayBox key={item.id} value={item.value} index={index} variant={getVariant(index)} showIndex />
                ))}
              </div>
              <Legend items={LEGEND_ITEMS} />
            </div>
          </Panel>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatBlock label="Iterations" value={state.iterations ?? 0} color={V.green} />
            <StatBlock label="Placements" value={state.placements ?? 0} color={V.accent} />
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
            { label: "Time Complexity", value: "O(D × (N+K))", color: V.amber, description: "Where D = number of digits in max, N = elements, K = radix (10). Processes each digit position once." },
            { label: "Space Complexity", value: "O(N + K)", color: V.green, description: "Requires output array (N) and count array for each digit (K = 10)." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default RadixSortVisualizer;
