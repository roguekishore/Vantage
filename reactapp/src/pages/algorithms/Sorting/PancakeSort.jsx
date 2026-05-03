import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Terminal, FlipVertical } from "lucide-react";
import {
  V,
  VisualizerShell, VisualizerHeader, ControlBar, ProgressBar,
  Panel, CodePanel, ExplanationLog, Divider,
  StatBlock, Legend, ComplexityFooter,
  ArrayBox, InputField, IdleState,
} from "@/components/visualizer";
import CustomCursor from "@/components/common/CustomCursor";

const CODE_LINES = [
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "pancakeSort(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  for ", k: "kw" }, { t: "(n = arr.length; n > 1; n--) {", k: "" }] },
  { n: 3, tokens: [{ t: "    maxIdx = findMax", k: "fn" }, { t: "(arr, n);", k: "" }] },
  { n: 4, tokens: [{ t: "    if ", k: "kw" }, { t: "(maxIdx != n-1) {", k: "" }] },
  { n: 5, tokens: [{ t: "      if ", k: "kw" }, { t: "(maxIdx != 0)", k: "" }] },
  { n: 6, tokens: [{ t: "        flip", k: "fn" }, { t: "(arr, maxIdx+1);", k: "" }] },
  { n: 7, tokens: [{ t: "      flip", k: "fn" }, { t: "(arr, n);", k: "" }] },
  { n: 8, tokens: [{ t: "    }", k: "dim" }] },
  { n: 9, tokens: [{ t: "  }", k: "dim" }] },
  { n: 10, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Default" },
  { color: V.redDim, border: V.red, label: "Max element" },
  { color: V.amberDim, border: V.amber, label: "Scanning" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

const PancakeSortVisualizer = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const [arrayInput, setArrayInput] = useState("3,5,2,9,6,1,4");
  const [loaded, setLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef(null);

  const generateHistory = useCallback((initialArray) => {
    const arr = JSON.parse(JSON.stringify(initialArray));
    let n = arr.length;
    const hist = [];
    let flips = 0;

    const snap = (extra) =>
      hist.push({
        array: JSON.parse(JSON.stringify(arr)),
        flips,
        sortedIndices: Array.from({ length: arr.length - n }, (_, i) => n + i),
        ...extra,
      });

    snap({ line: 1, msg: "Initialize Pancake Sort.", phase: "start" });

    for (let curr_size = n; curr_size > 1; --curr_size) {
      let mi = 0;
      for (let i = 1; i < curr_size; i++) {
        snap({ line: 3, currentIndex: curr_size - 1, maxIndex: mi, i, msg: `Scan: max so far ${arr[mi].value} at [${mi}], checking [${i}] (${arr[i].value}).`, phase: "try" });
        if (arr[i].value > arr[mi].value) mi = i;
      }

      if (mi !== curr_size - 1) {
        if (mi !== 0) {
          flips++;
          snap({ line: 6, currentIndex: curr_size - 1, maxIndex: mi, msg: `Flip 1: bring max (${arr[mi].value}) to front — flip [0..${mi}].`, phase: "place" });
          let temp = arr.slice(0, mi + 1).reverse();
          for (let i = 0; i <= mi; i++) arr[i] = temp[i];
        }
        flips++;
        snap({ line: 7, currentIndex: curr_size - 1, maxIndex: 0, msg: `Flip 2: send front to position ${curr_size - 1} — flip [0..${curr_size - 1}].`, phase: "place" });
        let temp = arr.slice(0, curr_size).reverse();
        for (let i = 0; i < curr_size; i++) arr[i] = temp[i];
        snap({ line: 8, currentIndex: curr_size - 1, msg: `✓ Element ${arr[curr_size - 1].value} in place at [${curr_size - 1}].`, phase: "success" });
      }
    }

    snap({ line: 10, finished: true, sortedIndices: Array.from({ length: arr.length }, (_, i) => i), msg: `Complete. ${flips} flips total.`, phase: "done" });
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
    if (state.maxIndex === index) return "pivot";
    if (state.i === index) return "comparing";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />
      <VisualizerHeader title="PANCAKE" subtitle="SORT." category="Sorting" icon={FlipVertical}
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
        <IdleState icon={FlipVertical} message='Enter comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
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
            <StatBlock label="Flips" value={state.flips ?? 0} color={V.accent} />
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
            { label: "Time Complexity", value: "O(N²)", color: V.amber, description: "O(N²) worst/average — scans for max each pass. Best O(N) if already sorted (no flips)." },
            { label: "Space Complexity", value: "O(1)", color: V.green, description: "In-place with constant memory, plus O(N) for flip reversal." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default PancakeSortVisualizer;
