import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Terminal, PackageOpen } from "lucide-react";
import {
  V,
  VisualizerShell, VisualizerHeader, ControlBar, ProgressBar,
  Panel, CodePanel, ExplanationLog, Divider,
  StatBlock, Legend, ComplexityFooter,
  ArrayBox, InputField, IdleState,
} from "@/components/visualizer";
import CustomCursor from "@/components/common/CustomCursor";

/* ─── Helpers ─── */
function deepClone(arr) { return JSON.parse(JSON.stringify(arr)); }

function insertionSortStable(arr, counts) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j].value > key.value) {
      counts.comparisons++;
      arr[j + 1] = arr[j];
      counts.moves++;
      j--;
    }
    if (i - 1 >= 0) counts.comparisons++;
    arr[j + 1] = key;
    counts.moves++;
  }
  return arr;
}

const CODE_LINES = [
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "bucketSort(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  b = floor(sqrt(n));", k: "var" }] },
  { n: 3, tokens: [{ t: "  buckets = Array(b);", k: "var" }] },
  { n: 4, tokens: [{ t: "  for ", k: "kw" }, { t: "each x in arr:", k: "" }] },
  { n: 5, tokens: [{ t: "    i = floor((x-min)/range * b);", k: "" }] },
  { n: 6, tokens: [{ t: "    buckets[i].push(x);", k: "" }] },
  { n: 7, tokens: [{ t: "  for ", k: "kw" }, { t: "each bucket:", k: "" }] },
  { n: 8, tokens: [{ t: "    insertionSort", k: "fn" }, { t: "(bucket);", k: "" }] },
  { n: 9, tokens: [{ t: "  concat all buckets → arr;", k: "" }] },
  { n: 10, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Default" },
  { color: V.amberDim, border: V.amber, label: "Distributing" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

const BucketSortVisualizer = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const [arrayInput, setArrayInput] = useState("0.42,0.32,0.33,0.52,0.37,0.47,0.51");
  const [loaded, setLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef(null);

  const generateHistory = useCallback((initialObjs) => {
    const arr = deepClone(initialObjs);
    const n = arr.length;
    const hist = [];
    const counts = { moves: 0, comparisons: 0 };

    const snap = (extra) =>
      hist.push({ array: deepClone(arr), comparisons: counts.comparisons, moves: counts.moves, ...extra });

    snap({ line: 1, msg: "Initialize Bucket Sort.", phase: "start" });

    if (n <= 1) {
      snap({ line: 10, finished: true, sortedIndices: Array.from({ length: n }, (_, k) => k), msg: "Trivially sorted.", phase: "done" });
      setHistory(hist); setStep(0); return;
    }

    const min = Math.min(...arr.map((o) => o.value));
    const max = Math.max(...arr.map((o) => o.value));
    const range = Math.max(1e-9, max - min);
    const b = Math.max(1, Math.floor(Math.sqrt(n)));
    const buckets = Array.from({ length: b }, () => []);

    snap({ line: 2, msg: `Create ${b} buckets. Range [${min}, ${max}].`, phase: "info" });

    for (let i = 0; i < n; i++) {
      const x = arr[i];
      let idx = Math.floor(((x.value - min) / range) * b);
      if (idx >= b) idx = b - 1;
      buckets[idx].push(x);
      snap({ line: 6, highlightedIndex: i, bucketIndex: idx, msg: `Place ${x.value} → bucket[${idx}].`, phase: "try" });
    }

    for (let bi = 0; bi < b; bi++) {
      const before = buckets[bi].map((o) => o.value).join(", ");
      insertionSortStable(buckets[bi], counts);
      const after = buckets[bi].map((o) => o.value).join(", ");
      snap({ line: 8, bucketIndex: bi, msg: `Sort bucket ${bi}: [${before}] → [${after}].`, phase: "place" });
    }

    let k = 0;
    for (let bi = 0; bi < b; bi++) {
      for (let j = 0; j < buckets[bi].length; j++) {
        arr[k] = buckets[bi][j];
        counts.moves++;
        snap({ line: 9, msg: `Place ${buckets[bi][j].value} back at arr[${k}].`, phase: "success" });
        k++;
      }
    }

    snap({ line: 10, finished: true, sortedIndices: Array.from({ length: n }, (_, k) => k), msg: `Complete. ${counts.comparisons} comparisons, ${counts.moves} moves.`, phase: "done" });
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
    if (state.highlightedIndex === index) return "comparing";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />
      <VisualizerHeader title="BUCKET" subtitle="SORT." category="Sorting" icon={PackageOpen}
        right={
          <ControlBar loaded={loaded} playing={autoPlay} step={step} totalSteps={history.length}
            speed={speed} onRun={load} onReset={reset} onForward={fwd} onBackward={back}
            onPlayPause={() => { if (step >= history.length - 1) setStep(0); setAutoPlay((p) => !p); }} onSpeedChange={setSpeed}>
            <InputField label="Array" value={arrayInput} onChange={(e) => setArrayInput(e.target.value)}
              disabled={loaded} inputProps={{ onKeyDown: (e) => e.key === "Enter" && load() }} style={{ flex: 1, minWidth: 180 }} />
          </ControlBar>
        }
      />
      {loaded && <ProgressBar step={step} totalSteps={history.length} />}
      <Divider spacing={12} />

      {!loaded ? (
        <IdleState icon={PackageOpen} message='Enter comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
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
            <StatBlock label="Comparisons" value={state.comparisons ?? 0} color={V.green} />
            <StatBlock label="Moves" value={state.moves ?? 0} color={V.accent} />
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
            { label: "Time Complexity", value: "O(N + K)", color: V.amber, description: "Avg O(N+K) with uniform distribution. Worst O(N²) if all elements fall in one bucket." },
            { label: "Space Complexity", value: "O(N + K)", color: V.green, description: "Requires additional memory for buckets. Not in-place." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default BucketSortVisualizer;
