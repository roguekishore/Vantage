import React, { useState, useCallback } from "react";
const Demo = () => {
  const [numsInput, setNumsInput] = useState("9,9,9");
  const [bitWidth, setBitWidth] = useState(4);
  const [history, setHistory] = useState([]);
  const pad = (n) => window.BigInt(n).toString(2).padStart(bitWidth, "0");
  const generateHistory = useCallback(() => {
    const arr = numsInput.split(",").map((s) => parseInt(s.trim(), 10));
    if (!arr.length) { alert("bad"); return; }
    let acc = 0;
    const h = [{ msg: "start", line: 1, acc, bin: pad(acc) }];
    arr.forEach((x) => { acc ^= x; h.push({ msg: "xor", line: 2, acc, bin: pad(acc) }); });
    setHistory(h);
  }, [numsInput, bitWidth]);
  return <button onClick={generateHistory}>{history.length}</button>;
};
export default Demo;
