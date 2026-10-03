import { defineVisualizer } from "@/components/visualizer";

const NULL_ID = "null";

const ITERATIVE_CODE = [
  "class Solution {",
  "public:",
  "  ListNode* reverseList(ListNode* head) {",
  "    ListNode *prev = NULL, *curr = head;",
  "    while (curr != NULL) {",
  "      ListNode* nextTemp = curr->next;",
  "      curr->next = prev;",
  "",
  "      prev = curr;",
  "      curr = nextTemp;",
  "    }",
  "    return prev;",
  "  }",
  "};",
];

const RECURSIVE_CODE = [
  "class Solution {",
  "public:",
  "  ListNode* reverseList(ListNode* head) {",
  "    if (head == NULL || head->next == NULL)",
  "      return head;",
  "",
  "    ListNode* newHead = reverseList(head->next);",
  "    head->next->next = head;",
  "    head->next = NULL;",
  "    return newHead;",
  "  }",
  "};",
];

function buildNodes(data) {
  return data.map((d, i) => ({ id: i, data: d, next: i + 1 < data.length ? i + 1 : null }));
}

function edgesOf(nodes) {
  return nodes.filter((n) => n.next !== null).map((n) => ({ from: n.id, to: n.next }));
}

function generateIterative({ nums }) {
  const steps = [];
  const nodes = buildNodes(nums);
  let prev = null;
  let curr = 0;
  const addState = (props) =>
    steps.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: edgesOf(nodes), prev, curr, msg: "", ...props });

  addState({ line: 4, msg: "Initialize `prev` to null and `curr` to head (node 0)." });
  while (curr !== null) {
    addState({ line: 5, curr, prev, msg: `Start of loop. Current node is ${curr}.` });
    const currentNode = nodes.find((n) => n.id === curr);
    const nextTemp = currentNode.next;
    addState({ line: 6, curr, prev, nextTemp, msg: `Store next node (${nextTemp}) in a temporary variable.` });
    currentNode.next = prev;
    addState({
      line: 7,
      curr,
      prev,
      nextTemp,
      msg: `Reverse current node's pointer to point to previous node (${prev === null ? "null" : prev}).`,
    });
    prev = curr;
    addState({ line: 9, curr, prev, nextTemp, msg: `Move 'prev' pointer forward to current node (${curr}).` });
    curr = nextTemp;
    addState({
      line: 10,
      curr,
      prev,
      nextTemp,
      msg: `Move 'curr' pointer forward to the stored next node (${nextTemp === null ? "null" : nextTemp}).`,
    });
  }
  addState({ line: 5, finished: true, prev, msg: "Current node is null, loop terminates." });
  addState({ line: 12, finished: true, prev, msg: `Return the new head of the list, which is 'prev' (${prev}).` });
  return steps;
}

function generateRecursive({ nums }) {
  const steps = [];
  const nodes = buildNodes(nums);
  const addState = (props) =>
    steps.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: edgesOf(nodes), msg: "", callStack: [], ...props });

  function reverse(head, callStack) {
    addState({ callStack, line: 4, head, msg: `Calling reverse for node ${head}.` });
    if (head === null || nodes.find((n) => n.id === head)?.next === null) {
      addState({
        callStack,
        line: 5,
        head,
        msg: `Base case: head is null or it's the last node. Returning node ${head}.`,
      });
      return head;
    }
    const nextNodeId = nodes.find((n) => n.id === head).next;
    const newHead = reverse(nextNodeId, [...callStack, { id: head, next: nextNodeId }]);

    const nextNode = nodes.find((n) => n.id === nextNodeId);
    nextNode.next = head;
    addState({ callStack, line: 8, head, newHead, msg: `Unwinding: Node ${nextNode.id}'s next now points to ${head}.` });

    nodes.find((n) => n.id === head).next = null;
    addState({ callStack, line: 9, head, newHead, msg: `Unwinding: Node ${head}'s next points to null.` });

    addState({ callStack, line: 10, head, newHead, msg: `Returning new head ${newHead} up the call stack.` });
    return newHead;
  }

  addState({ msg: "Starting recursive reversal." });
  reverse(0, []);
  addState({ finished: true, msg: "Reversal complete." });
  return steps;
}

const idOf = (v) => (v === null ? NULL_ID : v);

function nodeTone(s, node, mode) {
  if (mode === "recursive") {
    if (s.finished) return node.id === s.nodes.length - 1 ? "success" : "done";
    if (node.id === s.head) return "active";
    if (node.id === s.newHead) return "success";
    return "idle";
  }
  if (s.finished) return node.id === s.prev ? "success" : "done";
  if (node.id === s.curr) return "active";
  if (node.id === s.nextTemp) return "compare";
  if (node.id === s.prev) return "done";
  return "idle";
}

function mapList(s, input, mode) {
  const nodes = [
    ...s.nodes.map((n) => ({ id: n.id, value: n.data, tone: nodeTone(s, n, mode) })),
    { id: NULL_ID, value: "null", tone: "dim" },
  ];
  const changing = (from) =>
    s.line === 7 ? from === s.curr : s.line === 8 ? s.nodes.some((n) => n.id === from && n.next === s.head) : s.line === 9 && from === s.head;
  const edges = s.nodes.map((n) => ({ from: n.id, to: idOf(n.next), tone: changing(n.id) ? "write" : "idle" }));
  const pointers = [];
  if (mode !== "recursive" && !s.finished) {
    pointers.push({ nodeId: idOf(s.prev), label: "prev", role: 3 });
    pointers.push({ nodeId: idOf(s.curr), label: "curr", role: 1 });
    if (s.nextTemp !== undefined) pointers.push({ nodeId: idOf(s.nextTemp), label: "next", role: 2 });
  } else if (mode !== "recursive") {
    pointers.push({ nodeId: idOf(s.prev), label: "head", role: 3 });
  } else if (s.head != null) {
    pointers.push({ nodeId: s.head, label: "head", role: 1 });
  }
  return { nodes, edges, pointers };
}

function mapFrames(s) {
  const valueOf = (id) => s.nodes.find((n) => n.id === id)?.data;
  const frames = (s.callStack || []).map((c) => ({ fn: "reverseList", args: `head=${valueOf(c.id)}`, status: "waiting" }));
  if (s.head != null) {
    const returning = s.line === 5 || s.line === 10;
    frames.push({
      fn: "reverseList",
      args: `head=${valueOf(s.head)}`,
      ret: returning ? valueOf(s.line === 5 ? s.head : s.newHead) : undefined,
      status: returning ? "returned" : "active",
    });
  }
  return { frames };
}

export default defineVisualizer({
  meta: {
    title: "Reverse Linked List",
    category: "Linked List",
    difficulty: "easy",
    summary: "Flip every next pointer so the list runs backwards, iteratively with three pointers or recursively on unwind.",
    leetcode: 206,
  },
  inputs: [{ key: "nums", kind: "numberList", label: "List values", default: [1, 2, 3, 4, 5], minLen: 1, maxLen: 10 }],
  examples: [
    { label: "Five nodes", values: { nums: [1, 2, 3, 4, 5] } },
    { label: "Single node", values: { nums: [7] } },
    { label: "Two nodes", values: { nums: [1, 2] } },
    { label: "Duplicates and negatives", values: { nums: [3, -1, 3, 0] } },
  ],
  parse: ({ nums }) => ({ nums: nums.slice() }),
  modes: {
    iterative: {
      label: "Iterative",
      generate: generateIterative,
      code: { lang: "cpp", lines: ITERATIVE_CODE },
      complexity: {
        time: { avg: "O(N)" },
        space: "O(1)",
        note: "One pass; only prev, curr and nextTemp are kept, so extra space is constant.",
      },
    },
    recursive: {
      label: "Recursive",
      generate: generateRecursive,
      code: { lang: "cpp", lines: RECURSIVE_CODE },
      complexity: {
        time: { avg: "O(N)" },
        space: "O(N)",
        note: "Each node is visited going down and again while unwinding; the call stack is N deep.",
      },
    },
  },
  defaultMode: "iterative",
  legend: [
    { tone: "active", label: "current node" },
    { tone: "compare", label: "stored next" },
    { tone: "done", label: "already reversed" },
    { tone: "write", label: "pointer being changed" },
    { tone: "success", label: "new head" },
  ],
  view: {
    stage: "list",
    map: mapList,
    aux: [{ kind: "callstack", title: "Call stack", map: mapFrames }],
  },
});
