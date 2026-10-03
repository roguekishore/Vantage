import { defineVisualizer, fieldError } from "@/components/visualizer";

function parseInput(raw) {
  if (!Array.isArray(raw.nums) || raw.nums.length < 1) throw fieldError("nums", "Enter numbers.");
  return { nums: raw.nums.slice(), bits: Number(raw.bits) || 4 };
}
function generate(input) {
  const pad = (n) => n.toString(2).padStart(input.bits, "0");
  let acc = 0;
  const steps = [{ msg: "Start.", line: 1, acc, bin: pad(acc) }];
  input.nums.forEach((x) => { acc ^= x; steps.push({ msg: "XOR.", line: 2, acc, bin: pad(acc) }); });
  return steps;
}
const code = { lang: "cpp", lines: ["int f() {", "  return 0;", "}"] };

export default defineVisualizer({
  meta: { title: "State Closure", category: "Arrays", difficulty: "easy", summary: "Legacy generator closes over useState." },
  inputs: [
    { key: "nums", kind: "numberList", label: "Array", default: [1, 2, 3], maxLen: 8 },
    { key: "bits", kind: "text", label: "Bits", default: "4" },
  ],
  examples: [{ label: "Basic", values: { nums: [1, 2, 3], bits: "4" } }],
  parse: parseInput,
  generate,
  code,
  complexity: { time: { avg: "O(n)" }, space: "O(1)" },
  legend: [{ tone: "compare", label: "xor" }],
  view: { stage: "array", map: (s) => ({ cells: [{ value: s.acc, tone: "idle" }], pointers: [] }) },
});
