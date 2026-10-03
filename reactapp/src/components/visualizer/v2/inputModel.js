import { fieldError, isFieldError } from "./fieldError";

/*
 * Input model: draft strings (what the user types) <-> typed values (what
 * `parse` receives and examples / embed supply). Pure, no React.
 */

const SPLIT = /[\s,]+/;
const NULLS = new Set(["null", "nil", "none", "#", "-", "x"]);

export const isTextKind = (kind) => kind !== "select" && kind !== "toggle";
export const isMultiline = (kind) => kind === "matrix" || kind === "tuples" || kind === "graph";

export function toDraft(spec, value) {
  switch (spec.kind) {
    case "select":
    case "toggle":
      return value;
    case "numberList":
      return (value || []).join(", ");
    case "number":
      return value == null ? "" : String(value);
    case "string":
      return value == null ? "" : String(value);
    case "tree":
      return (value || []).map((v) => (v == null ? "null" : String(v))).join(", ");
    case "matrix":
      return (value || []).map((r) => r.join(" ")).join("\n");
    case "tuples":
      return (value || []).map((r) => r.join(" ")).join("\n");
    case "graph": {
      const g = value || { nodes: [], edges: [], directed: false };
      const arrow = g.directed ? "->" : "-";
      const lines = g.edges.map(([a, b, w]) => `${a}${arrow}${b}${w != null ? `:${w}` : ""}`);
      const used = new Set(g.edges.flat().filter((x) => typeof x === "string"));
      g.nodes.filter((n) => !used.has(n)).forEach((n) => lines.push(n));
      return lines.join("\n");
    }
    case "ops":
      return value == null ? "" : String(value);
    default:
      return value == null ? "" : String(value);
  }
}

const toNum = (key, tok) => {
  const n = Number(tok);
  if (tok === "" || !Number.isFinite(n)) throw fieldError(key, `"${tok}" is not a number.`);
  return n;
};

function coerceGraph(spec, draft) {
  const key = spec.key;
  const nodes = [];
  const edges = [];
  let directed = null;
  const addNode = (n) => {
    if (!nodes.includes(n)) nodes.push(n);
  };
  for (const raw of draft.split(/[\n;]+/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^([^\s:>-]+)\s*(->|-)\s*([^\s:>-]+)\s*(?::\s*(-?\d+(?:\.\d+)?))?$/.exec(line);
    if (m) {
      const dir = m[2] === "->";
      if (directed === null) directed = dir;
      else if (directed !== dir) throw fieldError(key, "Use either all '->' (directed) or all '-' (undirected) edges.");
      addNode(m[1]);
      addNode(m[3]);
      edges.push(m[4] !== undefined ? [m[1], m[3], Number(m[4])] : [m[1], m[3]]);
    } else if (/^[^\s:>-]+$/.test(line)) {
      addNode(line);
    } else {
      throw fieldError(key, `Could not read "${line}". Write edges like A-B, A->B or A-B:4, one per line.`);
    }
  }
  if (!nodes.length) throw fieldError(key, "Add at least one node or edge.");
  return { nodes, edges, directed: directed === null ? Boolean(spec.default && spec.default.directed) : directed };
}

function coerceOps(spec, draft) {
  const key = spec.key;
  const text = draft.trim();
  if (!text) throw fieldError(key, "Enter at least one operation.");
  const grammar = Object.fromEntries((spec.grammar || []).map((g) => [g.name, g]));
  const re = /([A-Za-z_]\w*)\s*\(([^)]*)\)/g;
  let m;
  let last = 0;
  let count = 0;
  while ((m = re.exec(text))) {
    const gap = text.slice(last, m.index);
    if (gap.replace(/[\s,;]/g, "")) throw fieldError(key, `Unexpected "${gap.trim()}". Write operations like name(arg).`);
    last = re.lastIndex;
    count += 1;
    const g = grammar[m[1]];
    if (!g) throw fieldError(key, `Unknown operation "${m[1]}". Use ${Object.keys(grammar).join(", ")}.`);
    const args = m[2].trim() ? m[2].split(",").map((a) => a.trim()) : [];
    if (args.length !== g.args.length) throw fieldError(key, `${g.name} takes ${g.args.length} argument(s), got ${args.length}.`);
    g.args.forEach((t, i) => {
      if (t === "int" && !/^-?\d+$/.test(args[i])) throw fieldError(key, `${g.name}: "${args[i]}" is not an integer.`);
    });
  }
  if (text.slice(last).replace(/[\s,;]/g, "")) throw fieldError(key, `Unexpected "${text.slice(last).trim()}".`);
  if (!count) throw fieldError(key, "Enter at least one operation.");
  return text;
}

/** Typed value from a draft for one spec. Throws fieldError(spec.key, msg). */
export function coerce(spec, draft) {
  const key = spec.key;
  switch (spec.kind) {
    case "select":
      if (!spec.options.some((o) => o.value === draft)) throw fieldError(key, "Pick one of the options.");
      return draft;
    case "toggle":
      return Boolean(draft);
    case "numberList": {
      const toks = String(draft).split(SPLIT).filter(Boolean);
      const arr = toks.map((t) => toNum(key, t));
      const minLen = spec.minLen ?? 1;
      if (arr.length < minLen) throw fieldError(key, `Enter at least ${minLen} number${minLen === 1 ? "" : "s"}.`);
      if (spec.maxLen != null && arr.length > spec.maxLen) throw fieldError(key, `At most ${spec.maxLen} numbers (got ${arr.length}).`);
      arr.forEach((n) => {
        if (spec.min != null && n < spec.min) throw fieldError(key, `${n} is below the minimum ${spec.min}.`);
        if (spec.max != null && n > spec.max) throw fieldError(key, `${n} is above the maximum ${spec.max}.`);
      });
      if (spec.sorted && arr.some((n, i) => i && arr[i - 1] > n)) throw fieldError(key, "Numbers must be in ascending order.");
      return arr;
    }
    case "number": {
      const n = toNum(key, String(draft).trim());
      if (n < spec.min || n > spec.max) throw fieldError(key, `Enter a value from ${spec.min} to ${spec.max}.`);
      if (spec.step && Number.isInteger(spec.step) && !Number.isInteger(n)) throw fieldError(key, "Enter a whole number.");
      return n;
    }
    case "string": {
      let s = String(draft);
      if (spec.transform === "upper") s = s.toUpperCase();
      if (spec.transform === "lower") s = s.toLowerCase();
      if (spec.maxLen != null && s.length > spec.maxLen) throw fieldError(key, `At most ${spec.maxLen} characters.`);
      if (spec.charset) {
        const bad = [...s].find((c) => !spec.charset.includes(c));
        if (bad !== undefined) throw fieldError(key, `"${bad}" is not allowed. Allowed: ${spec.charset}`);
      }
      return s;
    }
    case "tree": {
      const toks = String(draft).split(SPLIT).filter(Boolean);
      if (!toks.length) throw fieldError(key, "Enter level-order values; use null for a missing node.");
      const arr = toks.map((t) => (NULLS.has(t.toLowerCase()) ? null : toNum(key, t)));
      if (arr[0] === null) throw fieldError(key, "The root cannot be null.");
      return arr;
    }
    case "matrix": {
      const rows = String(draft).split("\n").map((r) => r.trim()).filter(Boolean);
      if (!rows.length) throw fieldError(key, "Enter at least one row.");
      const m = rows.map((r) => r.split(SPLIT).filter(Boolean).map((t) => (Number.isFinite(Number(t)) ? Number(t) : t)));
      if (m.some((r) => r.length !== m[0].length)) throw fieldError(key, "Every row needs the same number of cells.");
      if (spec.maxRows != null && m.length > spec.maxRows) throw fieldError(key, `At most ${spec.maxRows} rows.`);
      if (spec.maxCols != null && m[0].length > spec.maxCols) throw fieldError(key, `At most ${spec.maxCols} columns.`);
      return m;
    }
    case "tuples": {
      const rows = String(draft).split(/\n|;/).map((r) => r.replace(/[()[\]]/g, "").trim()).filter(Boolean);
      if (!rows.length) throw fieldError(key, `Enter at least one row of ${spec.arity} numbers.`);
      return rows.map((r) => {
        const nums = r.split(SPLIT).filter(Boolean).map((t) => toNum(key, t));
        if (nums.length !== spec.arity) throw fieldError(key, `Each row needs ${spec.arity} numbers (${spec.fields.join(", ")}).`);
        return nums;
      });
    }
    case "graph":
      return coerceGraph(spec, String(draft));
    case "ops":
      return coerceOps(spec, String(draft));
    default:
      return draft;
  }
}

/** { values, errors } from drafts. Errors are keyed by input key. */
export function coerceAll(inputs, drafts) {
  const values = {};
  const errors = {};
  for (const spec of inputs) {
    try {
      values[spec.key] = coerce(spec, drafts[spec.key]);
    } catch (e) {
      if (!isFieldError(e)) throw e;
      errors[e.fieldKey || spec.key] = e.message;
    }
  }
  return { values, errors };
}

export const defaultValues = (inputs) => Object.fromEntries(inputs.map((s) => [s.key, s.default]));

export const draftsFromValues = (inputs, values) =>
  Object.fromEntries(inputs.map((s) => [s.key, toDraft(s, values[s.key] !== undefined ? values[s.key] : s.default)]));

/** Dev check: every step has msg, every line is in [1, lines.length]. Returns problem strings. */
export function assertSteps(steps, lines) {
  const problems = [];
  steps.forEach((s, i) => {
    if (!s || typeof s.msg !== "string" || !s.msg) problems.push(`step ${i}: missing msg`);
    if (s && s.line != null) {
      if (!Number.isInteger(s.line) || s.line < 1 || s.line > lines.length) {
        problems.push(`step ${i}: line ${s.line} is outside 1..${lines.length}`);
      }
    }
  });
  return problems;
}
