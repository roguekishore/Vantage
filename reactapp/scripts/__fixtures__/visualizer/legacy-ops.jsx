import React, { useState, useCallback } from "react";
const Demo = () => {
  const [history, setHistory] = useState([]);
  const generateCounter = useCallback((capacity, commands) => {
    const h = [{ msg: "start", line: 1, items: [] }];
    const items = [];
    commands.forEach((c) => { items.push(c.key); if (items.length > capacity) items.shift(); h.push({ msg: c.op, line: 2, items: items.slice() }); });
    setHistory(h);
  }, []);
  return <div>{history.length}</div>;
};
export default Demo;
