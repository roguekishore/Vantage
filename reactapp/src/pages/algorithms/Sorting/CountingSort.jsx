import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Terminal, ListOrdered } from "lucide-react";
import {
  V, MONO,
  VisualizerShell, VisualizerHeader, ControlBar, ProgressBar,
  Panel, CodePanel, ExplanationLog, Divider,
  StatBlock, Legend, ComplexityFooter,
  ArrayBox, InputField, IdleState,
} from "@/components/visualizer";
import CustomCursor from "@/components/common/CustomCursor";

const CODE_LINES = [
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "countingSort(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  max = findMax", k: "fn" }, { t: "(arr);", k: "" }] },
  { n: 3, tokens: [{ t: "  count = Array(max+1).fill(0);", k: "var" }] },
  { n: 4, tokens: [{ t: "  output = Array(n);", k: "var" }] },
  { n: 5, tokens: [{ t: "  for ", k: "kw" }, { t: "(i = 0; i < n; i++)", k: "" }] },
  { n: 6, tokens: [{ t: "    count[arr[i]]++;", k: "" }] },
  { n: 7, tokens: [{ t: "  for ", k: "kw" }, { t: "(i = 1; i <= max; i++)", k: "" }] },
  { n: 8, tokens: [{ t: "    count[i] += count[i-1];", k: "" }] },
  { n: 9, tokens: [{ t: "  for ", k: "kw" }, { t: "(i = n-1; i >= 0; i--) {", k: "" }] },
  { n: 10, tokens: [{ t: "    output[count[arr[i]]-1] = arr[i];", k: "" }] },
  { n: 11, tokens: [{ t: "    count[arr[i]]--;", k: "" }] },
  { n: 12, tokens: [{ t: "  }", k: "dim" }] },
  { n: 13, tokens: [{ t: "  arr = output;", k: "" }] },
  { n: 14, tokens: [{ t: "}", k: "dim" }] },
];

const LEGEND_ITEMS = [
  { color: V.elevated, border: V.borderHi, label: "Default" },
  { color: V.amberDim, border: V.amber, label: "Processing" },
  { color: V.accentDim, border: V.accent, label: "Placed" },
  { color: V.greenDim, border: V.green, label: "Sorted" },
];

const CountingSortVisualizer = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const [arrayInput, setArrayInput] = useState("4,2,2,8,3,3,1");
  const [loaded, setLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef(null);

  const generateHistory = useCallback((initialArray) => {
    const arr = JSON.parse(JSON.stringify(initialArray));
    const n = arr.length;
    const hist = [];
    let ops = 0;
    let sortedIndices = [];

    const max = Math.max(...arr.map((o) => o.value));

    const snap = (extra) =>
      hist.push({
        array: JSON.parse(JSON.stringify(arr)),
        countArray: extra.countArray || [],
        outputArray: extra.outputArray || new Array(n).fill(null),
        ops,
        sortedIndices: [...sortedIndices],
        ...extra,
      });

    snap({ line: 1, msg: "Initialize Counting Sort.", phase: "start" });

    const count = new Array(max + 1).fill(0);
    const output = new Array(n).fill(null);

    snap({ line: 2, countArray: [...count], outputArray: [...output], msg: `Max value = ${max}. Count array size = ${max + 1}.`, phase: "info" });

    // Count frequencies
    for (let i = 0; i < n; i++) {
      const v = arr[i].value;
      count[v]++;
      ops++;
      snap({ line: 6, highlightedIndex: i, countIndex: v, countArray: [...count], outputArray: [...output], msg: `count[${v}]++ → ${count[v]}`, phase: "try" });
    }

    // Cumulative count
    for (let i = 1; i <= max; i++) {
      count[i] += count[i - 1];
      ops++;
      snap({ line: 8, countIndex: i, countArray: [...count], outputArray: [...output], msg: `count[${i}] = ${count[i]} (cumulative).`, phase: "info" });
    }

    // Build output
    for (let i = n - 1; i >= 0; i--) {
      const v = arr[i].value;
      const pos = count[v] - 1;
      output[pos] = arr[i];
      ops++;
      snap({ line: 10, highlightedIndex: i, countIndex: v, outputIndex: pos, countArray: [...count], outputArray: [...output], msg: `Place ${v} at output[${pos}].`, phase: "place" });
      count[v]--;
      snap({ line: 11, countIndex: v, countArray: [...count], outputArray: [...output], msg: `count[${v}]-- → ${count[v]}.`, phase: "info" });
    }

    // Copy back
    for (let i = 0; i < n; i++) {
      arr[i] = output[i];
      sortedIndices.push(i);
      snap({ line: 13, countArray: [...count], outputArray: [...output], highlightedIndex: i, msg: `Copy output[${i}] (${arr[i].value}) → arr[${i}].`, phase: "success" });
    }

    snap({ line: 14, countArray: [...count], outputArray: [...output], finished: true, sortedIndices: Array.from({ length: n }, (_, k) => k), msg: `Complete. ${ops} operations.`, phase: "done" });
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
  const { array = [], countArray = [], outputArray = [] } = state;

  /* Helper: mini box for count/output arrays */
  const MiniBox = ({ value, index, highlighted, accent }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{
        width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
        background: highlighted ? (accent || V.amberDim) : V.elevated,
        border: `2px solid ${highlighted ? (accent ? V.accent : V.amber) : V.borderHi}`,
        fontFamily: MONO, fontSize: 14, fontWeight: 700, color: V.primary,
        transition: "all 0.2s ease",
      }}>
        {value ?? ""}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 10, color: V.secondary }}>{index}</span>
    </div>
  );

  return (
    <VisualizerShell noCursor>
      <CustomCursor />
      <VisualizerHeader title="COUNTING" subtitle="SORT." category="Sorting" icon={ListOrdered}
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
        <IdleState icon={ListOrdered} message='Enter non-negative comma-separated numbers and press <span style="color:#EDFF66">Run</span>' />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", gridTemplateRows: "auto auto auto", gap: 14 }}>
          <Panel title="pseudocode.js" icon={Terminal} style={{ gridRow: "1 / 4" }}>
            <div style={{ padding: "12px 0", flex: 1, overflow: "hidden" }}><CodePanel lines={CODE_LINES} activeLine={state.line} /></div>
          </Panel>

          {/* Input array */}
          <Panel title={`input · ${array.length} elements`} icon={BarChart3} accent={V.amber}>
            <div style={{ padding: "14px 12px 10px", display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {array.map((item, index) => {
                let variant = "default";
                if (state.finished || state.sortedIndices?.includes(index)) variant = "sorted";
                else if (state.highlightedIndex === index) variant = "comparing";
                return <ArrayBox key={item.id} value={item.value} index={index} variant={variant} size={48} showIndex />;
              })}
            </div>
          </Panel>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatBlock label="Operations" value={state.ops ?? 0} color={V.green} />
            <StatBlock label="Progress" value={`${history.length > 1 ? Math.round((step / (history.length - 1)) * 100) : 0}%`} color={V.purple} />
          </div>

          {/* Count array */}
          <Panel title={`count · ${countArray.length} slots`} icon={BarChart3} accent={V.purple}>
            <div style={{ padding: "14px 12px 10px", display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {countArray.map((c, i) => <MiniBox key={i} value={c} index={i} highlighted={state.countIndex === i} />)}
            </div>
          </Panel>

          {/* Output array */}
          <Panel title={`output · ${outputArray.length} slots`} icon={BarChart3} accent={V.green} style={{ gridColumn: "2 / 3" }}>
            <div style={{ padding: "14px 12px 10px", display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {outputArray.map((item, i) => <MiniBox key={i} value={item?.value} index={i} highlighted={state.outputIndex === i} accent />)}
            </div>
          </Panel>

          {/* Log spans full bottom */}
          <Panel title="execution log" icon={Terminal} accent={V.green} style={{ gridColumn: "2 / 4" }}>
            <ExplanationLog entries={history.slice(0, step + 1).filter((s) => s.msg).map((s) => ({ msg: s.msg, phase: s.phase }))} autoPlay={autoPlay} />
          </Panel>
        </div>
      )}

      {loaded && (
        <div style={{ marginTop: 10 }}>
          <ComplexityFooter items={[
            { label: "Time Complexity", value: "O(N + K)", color: V.amber, description: "Where N = elements, K = max value. Fixed iterations through input and count arrays — not input-order dependent." },
            { label: "Space Complexity", value: "O(N + K)", color: V.green, description: "Requires output array (N) and count array (K)." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};

export default CountingSortVisualizer;
