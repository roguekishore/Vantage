import React, { useState } from "react";
const Demo = () => {
  const [history, setHistory] = useState([]);
  const generateBrute = (nums) => {
    const a = nums.slice();
    const h = [{ explanation: "Legacy start", line: 1, arr: a.slice(), j: null }];
    for (let j = 0; j < a.length; j++) h.push({ explanation: "scan", line: 2, arr: a.slice(), j });
    h.push({ explanation: "end", line: 3, arr: a.slice(), j: null });
    setHistory(h);
  };
  return <div>{history.length}</div>;
};
export default Demo;
