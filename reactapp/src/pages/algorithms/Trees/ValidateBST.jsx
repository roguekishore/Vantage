import { defineVisualizer } from "@/components/visualizer";

// ── model: pure functions ──
const fmt = (n) => (n === -Infinity ? "-∞" : n === Infinity ? "∞" : String(n));

// Level-order (heap-indexed) tree; `id` is the slot so duplicate values stay distinct.
function buildTreeFromLevelOrder(values) {
  const nodes = values.map((val, id) => (val === null ? null : { id, val, left: null, right: null }));
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i] !== null) {
      if (2 * i + 1 < nodes.length) nodes[i].left = nodes[2 * i + 1];
      if (2 * i + 2 < nodes.length) nodes[i].right = nodes[2 * i + 2];
    }
  }
  return nodes[0] || null;
}

function parseInput(raw) {
  return { values: raw.values.slice() };
}

function generate(input) {
  const root = buildTreeFromLevelOrder(input.values);
  const history = [];
  const callStack = [];

  const isValidBST = (node, min = -Infinity, max = Infinity, depth = 0, side = "root") => {
    callStack.push({ node: node?.val, min, max, depth, side });
    const vars = () => ({ depth, min: fmt(min), max: fmt(max), side });

    if (!node) {
      history.push({
        msg: "Reached null node - valid by definition",
        tree: root, currentId: null, currentNode: null, processingNode: null,
        currentRange: { min, max }, isValid: true, line: 6, vars: vars(),
        callStack: [...callStack], depth, side,
      });
      callStack.pop();
      return true;
    }

    history.push({
      msg: `Processing node ${node.val} with range [${fmt(min)}, ${fmt(max)}]`,
      tree: root, currentId: node.id, currentNode: node.val, processingNode: node.val,
      currentRange: { min, max }, line: 5, vars: vars(),
      callStack: [...callStack], depth, side,
    });

    const isCurrentValid = node.val > min && node.val < max;

    history.push({
      msg: `Checking BST condition: ${fmt(min)} < ${node.val} < ${fmt(max)} = ${isCurrentValid ? "VALID" : "INVALID"}`,
      tree: root, currentId: node.id, currentNode: node.val, processingNode: node.val,
      currentRange: { min, max }, isValid: isCurrentValid,
      comparison: { leftCheck: node.val > min, leftValue: min, rightCheck: node.val < max, rightValue: max },
      line: 9, vars: vars(), callStack: [...callStack], depth, side,
    });

    if (!isCurrentValid) {
      history.push({
        msg: `Node ${node.val} violates the BST condition. The tree is NOT a valid BST.`,
        tree: root, currentId: node.id, currentNode: node.val, processingNode: node.val,
        currentRange: { min, max }, isValid: false, isComplete: true, line: 10, vars: vars(),
        callStack: [...callStack], depth, side,
      });
      callStack.pop();
      return false;
    }

    history.push({
      msg: `Checking left subtree of ${node.val} with updated range [${fmt(min)}, ${node.val}]`,
      tree: root, currentId: node.id, currentNode: node.val, processingNode: null,
      currentRange: { min, max: node.val }, line: 14, vars: { depth: depth + 1, min: fmt(min), max: String(node.val), side: "left" },
      callStack: [...callStack], depth: depth + 1, side: "left",
    });

    const leftValid = isValidBST(node.left, min, node.val, depth + 1, "left");
    if (!leftValid) {
      callStack.pop();
      return false;
    }

    history.push({
      msg: `Checking right subtree of ${node.val} with updated range [${node.val}, ${fmt(max)}]`,
      tree: root, currentId: node.id, currentNode: node.val, processingNode: null,
      currentRange: { min: node.val, max }, line: 15, vars: { depth: depth + 1, min: String(node.val), max: fmt(max), side: "right" },
      callStack: [...callStack], depth: depth + 1, side: "right",
    });

    const rightValid = isValidBST(node.right, node.val, max, depth + 1, "right");
    const finalValid = leftValid && rightValid;

    history.push({
      msg: finalValid ? `Subtree rooted at ${node.val} is a valid BST` : `Subtree rooted at ${node.val} is not a valid BST`,
      tree: root, currentId: node.id, currentNode: node.val, processingNode: node.val,
      currentRange: { min, max }, isValid: finalValid, line: 15, vars: vars(),
      callStack: [...callStack], depth, side,
    });

    callStack.pop();
    return finalValid;
  };

  const result = isValidBST(root);

  history.push({
    msg: result ? "The entire tree is a valid Binary Search Tree." : "The tree is NOT a valid Binary Search Tree.",
    tree: root, isComplete: true, isValid: result, line: 2, callStack: [],
  });
  return history;
}

// Random valid BST: a balanced BST over 1..n laid out in level-order slots.
function randomTree() {
  const size = Math.floor(Math.random() * 8) + 5;
  const slots = [];
  const place = (lo, hi, idx) => {
    if (lo > hi) return;
    const mid = Math.floor((lo + hi) / 2);
    slots[idx] = mid;
    place(lo, mid - 1, 2 * idx + 1);
    place(mid + 1, hi, 2 * idx + 2);
  };
  place(1, size, 0);
  return Array.from(slots, (v) => (v === undefined ? null : v));
}

// ── config ──
export default defineVisualizer({
  meta: {
    title: "Validate Binary Search Tree",
    category: "Trees",
    difficulty: "medium",
    summary: "DFS carries a (min, max) range down the tree; every node must fall strictly inside it.",
    leetcode: 98,
  },
  inputs: [{ key: "values", kind: "tree", label: "Tree (level order)", default: [5, 3, 7, 2, 4, 6, 8], random: randomTree }],
  examples: [
    { label: "Valid BST", values: { values: [5, 3, 7, 2, 4, 6, 8] } },
    { label: "Right child too small", values: { values: [5, 1, 4, null, null, 3, 6] } },
    { label: "Duplicates", values: { values: [2, 2, 2] } },
    { label: "Right-leaning chain", values: { values: [1, null, 2, null, null, null, 3] } },
  ],
  parse: parseInput,
  generate,
  code: {
    lang: "cpp",
    lines: [
      "bool isValidBST(TreeNode* root) {",
      "    return validate(root, LONG_MIN, LONG_MAX);",
      "}",
      "",
      "bool validate(TreeNode* node, long min, long max) {",
      "    if (!node) return true;",
      "    ",
      "    // Check BST condition",
      "    if (node->val <= min || node->val >= max) {",
      "        return false;",
      "    }",
      "    ",
      "    // Validate left and right subtrees",
      "    return validate(node->left, min, node->val)",
      "        && validate(node->right, node->val, max);",
      "}",
    ],
  },
  complexity: {
    time: { avg: "O(N)" },
    space: "O(H)",
    note: "Each node is visited once. The recursion stack is O(H), which is O(log N) when balanced and O(N) for a skewed tree.",
  },
  legend: [
    { tone: "active", label: "Node being checked" },
    { tone: "compare", label: "Descending into a subtree" },
    { tone: "success", label: "Valid" },
    { tone: "error", label: "Violates the range" },
  ],
  view: {
    stage: "tree",
    map: (s) => ({
      root: s.tree,
      nodeTone: (n) => {
        if (s.currentId == null || n.id !== s.currentId) return "idle";
        if (s.isValid === true) return "success";
        if (s.isValid === false) return "error";
        return s.processingNode == null ? "compare" : "active";
      },
      badges: (n) => (s.currentId != null && n.id === s.currentId && s.currentRange ? `[${fmt(s.currentRange.min)}, ${fmt(s.currentRange.max)}]` : ""),
    }),
  },
  stats: (s) => [
    { label: "Node", value: s.currentNode == null ? "null" : s.currentNode },
    { label: "Range", value: s.currentRange ? `(${fmt(s.currentRange.min)}, ${fmt(s.currentRange.max)})` : "-" },
    { label: "Depth", value: s.depth ?? 0 },
    { label: "Result", value: s.isComplete ? (s.isValid ? "Valid BST" : "Invalid BST") : "In progress", tone: s.isComplete ? (s.isValid ? "success" : "error") : undefined },
  ],
});
