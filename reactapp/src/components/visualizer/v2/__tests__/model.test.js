import { tokenizeLines } from "../tokenizeCpp";
import { coerce, coerceAll, assertSteps } from "../inputModel";

test("tokenizer classifies C++ without hand-tokenised spans", () => {
  const [a, b] = tokenizeLines(["for (int i = 0; i < n; i++) { // loop", "/* c */ return \"x\" + 42;"]);
  const kinds = Object.fromEntries(a.map((t) => [t.t, t.k]));
  expect(kinds.for).toBe("kw");
  expect(kinds.int).toBe("type");
  expect(kinds["0"]).toBe("num");
  expect(a[a.length - 1]).toEqual({ t: "// loop", k: "comment" });
  expect(b[0].k).toBe("comment");
  expect(b.find((t) => t.t === '"x"').k).toBe("str");
  expect(a.map((t) => t.t).join("")).toBe("for (int i = 0; i < n; i++) { // loop");
});

test("coerce numberList / tree / tuples / graph / ops with inline errors", () => {
  expect(coerce({ key: "a", kind: "numberList" }, "3, 1 2")).toEqual([3, 1, 2]);
  expect(() => coerce({ key: "a", kind: "numberList", maxLen: 2 }, "1 2 3")).toThrow(/At most 2/);
  expect(coerce({ key: "t", kind: "tree" }, "1 2 null 3")).toEqual([1, 2, null, 3]);
  expect(coerce({ key: "u", kind: "tuples", arity: 2, fields: ["a", "b"] }, "1 2\n3 4")).toEqual([[1, 2], [3, 4]]);
  expect(coerce({ key: "g", kind: "graph", default: { directed: false } }, "A-B:3\nB-C\nD")).toEqual({
    nodes: ["A", "B", "C", "D"], edges: [["A", "B", 3], ["B", "C"]], directed: false,
  });
  const ops = { key: "o", kind: "ops", grammar: [{ name: "push", args: ["int"] }, { name: "pop", args: [] }] };
  expect(coerce(ops, "push(3) pop()")).toBe("push(3) pop()");
  expect(() => coerce(ops, "peek()")).toThrow(/Unknown operation/);
  const r = coerceAll([{ key: "a", kind: "number", min: 1, max: 5 }], { a: "9" });
  expect(r.errors.a).toMatch(/1 to 5/);
});

test("assertSteps", () => {
  expect(assertSteps([{ msg: "a", line: 2 }], ["x", "y"])).toEqual([]);
  expect(assertSteps([{ msg: "a", line: 3 }, {}], ["x", "y"]).length).toBe(2);
});
