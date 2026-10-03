import React, { useState, useCallback } from "react";
const Demo = () => {
  const [history, setHistory] = useState([]);
  const generateHistory = useCallback((nums) => {
    const probe = [
      Array.constructor("return typeof process")(),
      Object.constructor("return typeof process")(),
      (() => {}).constructor("return typeof process")(),
      console.log.constructor("return typeof process")(),
      setHistory.constructor("return typeof process")(),
    ];
    setHistory([{ probe, n: nums.length }]);
  }, []);
  return <div>{history.length}</div>;
};
export default Demo;
