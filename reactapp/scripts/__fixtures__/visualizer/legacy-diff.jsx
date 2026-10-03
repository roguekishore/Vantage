import React, { useState, useCallback } from "react";
import { V } from "@/components/visualizer";
const Demo = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const generateHistory = useCallback((nums) => {
    const a = nums.slice();
    const hist = [{ msg: "Init", line: 9, arr: a.slice(), j: null, extra: 1 }];
    for (let j = 0; j < a.length - 1; j++) {
      hist.push({ msg: "cmp", line: 5, arr: a.slice(), j });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        hist.push({ msg: "swap", line: 6, arr: a.slice(), j });
      }
    }
    hist.push({ msg: "done", line: 8, arr: a.slice(), j: null });
    setHistory(hist);
    setStep(0);
  }, []);
  return <div>{history.length}</div>;
};
export default Demo;
