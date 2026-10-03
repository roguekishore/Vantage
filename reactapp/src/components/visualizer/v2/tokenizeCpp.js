/*
 * Tiny C++ tokenizer for the code panel. Input: code.lines (plain strings).
 * Output: one array of { t: text, k: kind } per line, kind in
 * kw | type | num | str | comment | fn | punct | plain.
 * Block comments carry state across lines.
 */
const KEYWORDS = new Set(
  "if else for while do switch case default break continue return goto new delete class struct public private protected template typename using namespace const constexpr static auto sizeof true false nullptr this operator virtual override throw try catch inline".split(" ")
);
const TYPES = new Set(
  "int long short char bool void float double unsigned signed size_t string vector map unordered_map set unordered_set multiset multimap queue stack deque priority_queue pair tuple array bitset list ListNode TreeNode Node nullptr_t int8_t int16_t int32_t int64_t uint32_t uint64_t".split(" ")
);

export function tokenizeLines(lines) {
  let inBlock = false;
  return lines.map((line) => {
    const out = [];
    let i = 0;
    const push = (t, k) => t && out.push({ t, k });
    while (i < line.length) {
      if (inBlock) {
        const end = line.indexOf("*/", i);
        if (end < 0) {
          push(line.slice(i), "comment");
          i = line.length;
        } else {
          push(line.slice(i, end + 2), "comment");
          i = end + 2;
          inBlock = false;
        }
        continue;
      }
      const c = line[i];
      const two = line.slice(i, i + 2);
      if (two === "//") {
        push(line.slice(i), "comment");
        break;
      }
      if (two === "/*") {
        inBlock = true;
        push("/*", "comment");
        i += 2;
        continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < line.length && line[j] !== c) j += line[j] === "\\" ? 2 : 1;
        push(line.slice(i, j + 1), "str");
        i = j + 1;
        continue;
      }
      if (/\s/.test(c)) {
        const m = /^\s+/.exec(line.slice(i))[0];
        push(m, "plain");
        i += m.length;
        continue;
      }
      if (c === "#") {
        push(line.slice(i), "kw");
        break;
      }
      const num = /^(0[xX][0-9a-fA-F]+|\d+\.?\d*([eE][+-]?\d+)?[uUlLfF]*)/.exec(line.slice(i));
      if (num && !/[A-Za-z_]/.test(line[i - 1] || "")) {
        push(num[0], "num");
        i += num[0].length;
        continue;
      }
      const id = /^[A-Za-z_]\w*/.exec(line.slice(i));
      if (id) {
        const w = id[0];
        const rest = line.slice(i + w.length);
        let k = "plain";
        if (KEYWORDS.has(w)) k = "kw";
        else if (TYPES.has(w)) k = "type";
        else if (/^\s*\(/.test(rest)) k = "fn";
        push(w, k);
        i += w.length;
        continue;
      }
      push(c, "punct");
      i += 1;
    }
    return out;
  });
}

export const TOKEN_CLASS = {
  kw: "text-accent-ink",
  type: "text-info",
  num: "text-viz-write",
  str: "text-ok",
  comment: "text-fg-dim italic",
  fn: "text-fg font-bold",
  punct: "text-fg-muted",
  plain: "text-fg",
};
