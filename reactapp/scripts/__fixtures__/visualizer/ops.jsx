import { defineVisualizer, fieldError } from "@/components/visualizer";

function parseInput(raw) {
  const lines = String(raw.ops || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw fieldError("ops", "Enter operations.");
  const capacity = Number(lines[0].match(/\((\d+)\)/)[1]);
  const commands = lines.slice(1).map((l) => ({ op: l.split("(")[0], key: Number(l.match(/\((\d+)\)/)[1]) }));
  return { capacity, commands };
}
function generate({ capacity, commands }) {
  const steps = [{ msg: "Start.", line: 1, items: [] }];
  const items = [];
  commands.forEach((c) => { items.push(c.key); if (items.length > capacity) items.shift(); steps.push({ msg: c.op, line: 2, items: items.slice() }); });
  return steps;
}
const code = { lang: "cpp", lines: ["void f() {", "  add();", "}"] };

export default defineVisualizer({
  meta: { title: "Ops Script", category: "Design", difficulty: "easy", summary: "Legacy generator takes parsed commands." },
  inputs: [{ key: "ops", kind: "text", label: "Ops", default: "Cnt(2)\nadd(1)\nadd(2)\nadd(3)" }],
  examples: [{ label: "Basic", values: { ops: "Cnt(2)\nadd(1)\nadd(2)\nadd(3)" } }],
  parse: parseInput,
  generate,
  code,
  complexity: { time: { avg: "O(n)" }, space: "O(1)" },
  legend: [{ tone: "compare", label: "op" }],
  view: { stage: "array", map: (s) => ({ cells: s.items.map((v) => ({ value: v, tone: "idle" })), pointers: [] }) },
});
