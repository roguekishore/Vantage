import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Terminal, GitMerge } from "lucide-react";
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
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "mergeSort(arr, l, r) {", k: "" }] },
  { n: 2, tokens: [{ t: "  if ", k: "kw" }, { t: "(l < r) {", k: "" }] },
  { n: 3, tokens: [{ t: "    mid = (l + r) / 2;", k: "var" }] },
  { n: 4, tokens: [{ t: "    mergeSort", k: "fn" }, { t: "(arr, l, mid);", k: "" }] },
  { n: 5, tokens: [{ t: "    mergeSort", k: "fn" }, { t: "(arr, mid+1, r);", k: "" }] },
  { n: 6, tokens: [{ t: "    merge", k: "fn" }, { t: "(arr, l, mid, r);", k: "" }] },
  { n: 7, tokens: [{ t: "  }", k: "dim" }] },
  { n: 8, tokens: [{ t: "}", k: "dim" }] },
  { n: 9, tokens: [{ t: "", k: "dim" }] },
  { n: 10, tokens: [{ t: "function ", k: "kw" }, { t: "merge(arr, l, mid, r) {", k: "" }] },
  { n: 11, tokens: [{ t: "  while ", k: "kw" }, { t: "(i < left.len && j < right.len) {", k: "" }] },
  { n: 12, tokens: [{ t: "    if ", k: "kw" }, { t: "(left[i] <= right[j])", k: "" }] },
  { n: 13, tokens: [{ t: "      arr[k++] = left[i++];", k: "" }] },
  { n: 14, tokens: [{ t: "    else", k: "kw" }] },
  { n: 15, tokens: [{ t: "      arr[k++] = right[j++];", k: "" }] },
  { n: 16, tokens: [{ t: "  }", k: "dim" }] },
  { n: 17, tokens: [{ t: "  // copy remaining", k: "comment" }] },
  { n: 18, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Default" },
  { color: V.accentDim, border: V.accent, label: "Left half" },
  { color: V.purpleDim, border: V.purple, label: "Right half" },
  { color: V.amberDim, border: V.amber, label: "Merging" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const MergeSortVisualizer = () => {
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
    let comparisons = 0, merges = 0;

    const snap = (extra) =>
      hist.push({ array: JSON.parse(JSON.stringify(arr)), comparisons, merges, ...extra });

    snap({ line: 1, msg: "Initialize Merge Sort.", phase: "start" });

    const merge = (left, mid, right) => {
      const leftArr = [], rightArr = [];
      for (let i = left; i <= mid; i++) leftArr.push(arr[i]);
      for (let j = mid + 1; j <= right; j++) rightArr.push(arr[j]);

      snap({ line: 10, left, right, mid, msg: `Merging [${leftArr.map(x => x.value)}] and [${rightArr.map(x => x.value)}]`, phase: "info" });

      let i = 0, j = 0, k = left;
      while (i < leftArr.length && j < rightArr.length) {
        comparisons++;
        snap({ line: 12, left, right, mid, k, i: left + i, j: mid + 1 + j, msg: `Compare ${leftArr[i].value} vs ${rightArr[j].value}`, phase: "try" });
        if (leftArr[i].value <= rightArr[j].value) {
          arr[k] = leftArr[i]; i++;
          snap({ line: 13, left, right, mid, k, msg: `Take ${arr[k].value} from left`, phase: "place" });
        } else {
          arr[k] = rightArr[j]; j++;
          snap({ line: 15, left, right, mid, k, msg: `Take ${arr[k].value} from right`, phase: "place" });
        }
        k++;
      }
      while (i < leftArr.length) { arr[k] = leftArr[i]; i++; k++; }
      while (j < rightArr.length) { arr[k] = rightArr[j]; j++; k++; }
      merges++;
      snap({ line: 18, left, right, mid, msg: `✓ Merge complete [${left}..${right}]`, phase: "success" });
    };

    const mergeSort = (left, right) => {
      if (left < right) {
        const mid = Math.floor((left + right) / 2);
        snap({ line: 3, left, right, mid, msg: `Divide [${left}..${right}] at mid=${mid}`, phase: "info" });
        mergeSort(left, mid);
        mergeSort(mid + 1, right);
        merge(left, mid, right);
      } else {
        snap({ line: 2, left, right, msg: `Base case: single element at ${left} (${arr[left].value})`, phase: "info" });
      }
    };

    mergeSort(0, n - 1);
    snap({ line: 18, sortedIndices: Array.from({ length: n }, (_, k) => k), finished: true, msg: `Complete. ${comparisons} comparisons, ${merges} merges.`, phase: "done" });

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
    if (state.k === index) return "comparing";
    if (state.left != null && state.mid != null && index >= state.left && index <= state.mid) return "active";
    if (state.mid != null && state.right != null && index > state.mid && index <= state.right) return "swapping";
    return "default";
  };

  return (
    <VisualizerShell noCursor>
      <CustomCursor />

      <VisualizerHeader
        title="MERGE"
        subtitle="SORT."
        category="Sorting"
        icon={GitMerge}
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
        <IdleState icon={GitMerge} message='Enter comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
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
                {state.left != null && state.right != null && (
                  <>
                    <VisualizerPointer index={state.left} containerId="array-container" color="blue" label="L" direction="up" />
                    <VisualizerPointer index={state.right} containerId="array-container" color="purple" label="R" direction="up" />
                    {state.mid != null && <VisualizerPointer index={state.mid} containerId="array-container" color="cyan" label="M" direction="up" />}
                  </>
                )}
              </div>
              <Legend items={LEGEND_ITEMS} />
            </div>
          </Panel>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatBlock label="Comparisons" value={state.comparisons ?? 0} color={V.green} />
            <StatBlock label="Merges" value={state.merges ?? 0} color={V.accent} />
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
            { label: "Time Complexity", value: "O(N log N)", color: V.amber, description: "Always O(N log N) — divides in half at each level (log N levels) and merges in O(N). Consistent across best, average, and worst cases." },
            { label: "Space Complexity", value: "O(N)", color: V.green, description: "Requires O(N) auxiliary space for temporary arrays during merge. Not in-place — trades space for guaranteed O(N log N) time." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default MergeSortVisualizer;
