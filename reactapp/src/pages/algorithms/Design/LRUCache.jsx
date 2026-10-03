import { defineVisualizer, fieldError } from "@/components/visualizer";

// ── model ──
const OP_RE = /([A-Za-z_]\w*)\s*\(([^)]*)\)/g;

function parseInput(raw) {
  const calls = [];
  let m;
  OP_RE.lastIndex = 0;
  while ((m = OP_RE.exec(raw.ops))) calls.push({ name: m[1], args: m[2].split(",").map((a) => parseInt(a, 10)) });
  if (!calls.length || calls[0].name !== "LRUCache") throw fieldError("ops", "Start with LRUCache(capacity).");
  const capacity = calls[0].args[0];
  if (!(capacity > 0)) throw fieldError("ops", "Capacity must be at least 1.");
  const commands = calls.slice(1).map((c) => {
    if (c.name === "LRUCache") throw fieldError("ops", "LRUCache(capacity) may only appear once, first.");
    return c.name === "put" ? { op: "put", key: c.args[0], value: c.args[1] } : { op: "get", key: c.args[0] };
  });
  if (commands.length === 0) throw fieldError("ops", "Add at least one put or get.");
  const ops = [`LRUCache(${capacity})`, ...commands.map((c) => (c.op === "put" ? `put(${c.key}, ${c.value})` : `get(${c.key})`))];
  return { capacity, commands, ops };
}

function generateOptimal({ capacity, commands }) {
  const newHistory = [];
  const cache = new Map();
  const head = { key: -1, val: -1, next: null, prev: null };
  const tail = { key: -1, val: -1, next: null, prev: null };
  head.next = tail;
  tail.prev = head;
  const outputLog = [];

  const getList = () => {
    const list = [];
    let curr = head.next;
    while (curr !== tail) {
      list.push({ key: curr.key, val: curr.val });
      curr = curr.next;
    }
    return list;
  };
  const getMap = () => {
    const mapObject = {};
    for (const [key, node] of cache.entries()) mapObject[key] = node.val;
    return mapObject;
  };
  const addState = (props) => newHistory.push({ cache: getMap(), list: getList(), outputLog: [...outputLog], ...props });

  addState({ commandIndex: -1, line: 12, msg: `LRU Cache initialized with capacity ${capacity}.` });

  commands.forEach((command, commandIndex) => {
    if (command.op === "put") {
      const { key, value } = command;
      addState({ commandIndex, line: 24, msg: `Executing put(${key}, ${value}). Checking if key exists in hash map.` });

      if (cache.has(key)) {
        const node = cache.get(key);
        const oldVal = node.val;
        addState({ commandIndex, line: 26, msg: `Key ${key} found in hash map. Updating its value.` });
        node.val = value;
        addState({ commandIndex, line: 27, msg: `Value for key ${key} updated from ${oldVal} to ${value}. Now moving node to front.` });

        node.prev.next = node.next;
        node.next.prev = node.prev;
        addState({ commandIndex, line: 28, movedKey: key, msg: `Unlinked node from its current position in the list.` });

        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
        addState({ commandIndex, line: 29, movedKey: key, msg: `Moved node to the front of the list to mark it as most recently used.` });
      } else {
        addState({ commandIndex, line: 31, msg: `Key ${key} not in hash map. Checking if cache is full.` });
        if (cache.size === capacity) {
          addState({ commandIndex, line: 31, msg: `Cache is full (size=${capacity}). Eviction is necessary.` });
          const lru = tail.prev;
          addState({ commandIndex, line: 32, msg: `Identified least recently used item: key ${lru.key}.` });

          cache.delete(lru.key);
          addState({ commandIndex, line: 33, evictedKey: lru.key, msg: `Removed key ${lru.key} from the hash map.` });

          lru.prev.next = tail;
          tail.prev = lru.prev;
          addState({ commandIndex, line: 34, evictedKey: lru.key, msg: `Removed the LRU node from the end of the linked list.` });
        }
        const newNode = { key, val: value, prev: head, next: head.next };
        addState({ commandIndex, line: 37, msg: `Creating new node for key ${key} with value ${value}.` });

        head.next.prev = newNode;
        head.next = newNode;
        addState({ commandIndex, line: 38, newKey: key, msg: `Inserted new node at the front of the linked list.` });

        cache.set(key, newNode);
        addState({ commandIndex, line: 39, newKey: key, msg: `Added key ${key} with its node reference to the hash map.` });
      }
    } else if (command.op === "get") {
      const { key } = command;
      addState({ commandIndex, line: 17, msg: `Executing get(${key}). Checking for key in hash map.` });
      if (cache.has(key)) {
        const node = cache.get(key);
        outputLog.push(node.val);
        addState({ commandIndex, line: 19, getResult: node.val, msg: `Key ${key} found. Returning value ${node.val}. Now moving node to front.` });

        node.prev.next = node.next;
        node.next.prev = node.prev;
        addState({ commandIndex, line: 20, movedKey: key, getResult: node.val, msg: `Unlinked node from its current position in the list.` });

        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
        addState({ commandIndex, line: 21, movedKey: key, getResult: node.val, msg: `Moved node to the front of the list to mark it as most recently used.` });
      } else {
        outputLog.push(-1);
        addState({ commandIndex, line: 18, getResult: -1, msg: `Key ${key} not found in hash map. Returning -1.` });
      }
    }
  });

  addState({ finished: true, line: 42, msg: "All operations completed." });
  return newHistory;
}

function generateBruteForce({ capacity, commands }) {
  const newHistory = [];
  const cache = new Map();
  let usage = [];
  const outputLog = [];

  const getList = () => usage.map((key) => ({ key, val: cache.get(key) }));
  const getMap = () => Object.fromEntries(cache.entries());
  const addState = (props) => newHistory.push({ cache: getMap(), list: getList(), outputLog: [...outputLog], ...props });

  addState({ commandIndex: -1, line: 6, msg: `Cache initialized with capacity ${capacity} using a vector.` });

  commands.forEach((command, commandIndex) => {
    if (command.op === "put") {
      const { key, value } = command;
      addState({ commandIndex, line: 13, msg: `Executing put(${key}, ${value}). Checking if key exists.` });
      if (cache.has(key)) {
        addState({ commandIndex, line: 14, msg: `Key ${key} exists. Updating its value in the hash map.` });
        cache.set(key, value);
        addState({ commandIndex, line: 15, msg: `Value updated. Now updating recency in the usage vector.` });
        usage = usage.filter((k) => k !== key);
        addState({ commandIndex, line: 16, movedKey: key, msg: `Removed key ${key} from its current position in the vector (O(N) search).` });
        usage.unshift(key);
        addState({ commandIndex, line: 17, movedKey: key, msg: `Added key ${key} to the front of the vector to mark it as most recent.` });
      } else {
        addState({ commandIndex, line: 19, msg: `Key ${key} is new. Checking if cache is full.` });
        if (cache.size === capacity) {
          addState({ commandIndex, line: 19, msg: `Cache is full. Evicting the LRU item.` });
          const lruKey = usage.pop();
          addState({ commandIndex, line: 21, evictedKey: lruKey, msg: `Removed LRU key ${lruKey} from the back of the usage vector.` });
          cache.delete(lruKey);
          addState({ commandIndex, line: 22, evictedKey: lruKey, msg: `Removed evicted key ${lruKey} from the hash map.` });
        }
        cache.set(key, value);
        addState({ commandIndex, line: 24, newKey: key, msg: `Added new key ${key} with value ${value} to the hash map.` });
        usage.unshift(key);
        addState({ commandIndex, line: 25, newKey: key, msg: `Added new key ${key} to the front of the usage vector.` });
      }
    } else if (command.op === "get") {
      const { key } = command;
      addState({ commandIndex, line: 7, msg: `Executing get(${key}). Checking for key.` });
      if (cache.has(key)) {
        const val = cache.get(key);
        outputLog.push(val);
        addState({ commandIndex, line: 9, getResult: val, msg: `Key ${key} found, returning ${val}. Now updating recency.` });
        usage = usage.filter((k) => k !== key);
        addState({ commandIndex, line: 9, getResult: val, movedKey: key, msg: `Removed key ${key} from the usage vector (O(N) search).` });
        usage.unshift(key);
        addState({ commandIndex, line: 10, getResult: val, movedKey: key, msg: `Added key ${key} to the front of the vector.` });
      } else {
        outputLog.push(-1);
        addState({ commandIndex, line: 8, getResult: -1, msg: `Key ${key} not found. Returning -1.` });
      }
    }
  });
  addState({ finished: true, line: 28, msg: "All operations completed." });
  return newHistory;
}

// ── C++ listings ──
const OPTIMAL_CODE = [
  "class LRUCache {",
  "  struct Node { int key, val; Node *prev, *next; };",
  "  unordered_map<int, Node*> mp;",
  "  Node *head, *tail;",
  "  int cap;",
  "  void remove(Node* n) { n->prev->next = n->next; n->next->prev = n->prev; }",
  "  void insertFront(Node* n) {",
  "    n->next = head->next; n->prev = head;",
  "    head->next->prev = n; head->next = n;",
  "  }",
  "public:",
  "  LRUCache(int capacity) {",
  "    cap = capacity;",
  "    head = new Node(); tail = new Node();",
  "    head->next = tail; tail->prev = head;",
  "  }",
  "  int get(int key) {",
  "    if (!mp.count(key)) return -1;",
  "    Node* n = mp[key];",
  "    remove(n);",
  "    insertFront(n);",
  "    return n->val;",
  "  }",
  "  void put(int key, int value) {",
  "    if (mp.count(key)) {",
  "      Node* n = mp[key];",
  "      n->val = value;",
  "      remove(n);",
  "      insertFront(n);",
  "    } else {",
  "      if (mp.size() == cap) {",
  "        Node* lru = tail->prev;",
  "        mp.erase(lru->key);",
  "        remove(lru);",
  "        delete lru;",
  "      }",
  "      Node* n = new Node{key, value};",
  "      insertFront(n);",
  "      mp[key] = n;",
  "    }",
  "  }",
  "};",
];

const BRUTE_CODE = [
  "class LRUCache {",
  "  unordered_map<int, int> mp;",
  "  vector<int> usage;  // front = most recent",
  "  int cap;",
  "public:",
  "  LRUCache(int capacity) { cap = capacity; }",
  "  int get(int key) {",
  "    if (!mp.count(key)) return -1;",
  "    usage.erase(find(usage.begin(), usage.end(), key));",
  "    usage.insert(usage.begin(), key);",
  "    return mp[key];",
  "  }",
  "  void put(int key, int value) {",
  "    if (mp.count(key)) {",
  "      mp[key] = value;",
  "      usage.erase(find(usage.begin(), usage.end(), key));",
  "      usage.insert(usage.begin(), key);",
  "    } else {",
  "      if (mp.size() == cap) {",
  "        int lru = usage.back();",
  "        usage.pop_back();",
  "        mp.erase(lru);",
  "      }",
  "      mp[key] = value;",
  "      usage.insert(usage.begin(), key);",
  "    }",
  "  }",
  "};",
];

// ── view helpers (read `input` defensively: it may be absent) ──
const touched = (s, key) => s.movedKey === key || s.newKey === key;

function opsView(s, input) {
  const ops = input && Array.isArray(input.ops) ? input.ops : [];
  const commands = input && Array.isArray(input.commands) ? input.commands : [];
  const results = ops.map(() => "");
  let k = 0;
  commands.forEach((c, i) => {
    if (c.op === "get" && k < (s.outputLog || []).length) results[i + 1] = String(s.outputLog[k++]);
  });
  return { ops, active: s.finished ? ops.length : (s.commandIndex ?? -1) + 1, results };
}

// ── config ──
export default defineVisualizer({
  meta: {
    title: "LRU Cache",
    category: "Design",
    difficulty: "medium",
    summary: "Compare an O(1) hash map plus doubly linked list against an O(N) usage vector for least-recently-used eviction.",
    leetcode: 146,
  },
  inputs: [
    {
      key: "ops",
      kind: "ops",
      label: "Operations",
      grammar: [
        { name: "LRUCache", args: ["int"] },
        { name: "put", args: ["int", "int"] },
        { name: "get", args: ["int"] },
      ],
      default: "LRUCache(2)\nput(1, 1)\nput(2, 2)\nget(1)\nput(3, 3)\nget(2)\nput(4, 4)\nget(1)\nget(3)\nget(4)",
    },
  ],
  examples: [
    { label: "Classic", values: { ops: "LRUCache(2)\nput(1, 1)\nput(2, 2)\nget(1)\nput(3, 3)\nget(2)\nput(4, 4)\nget(1)\nget(3)\nget(4)" } },
    { label: "Update existing key", values: { ops: "LRUCache(2)\nput(1, 1)\nput(1, 10)\nput(2, 2)\nget(1)\nput(3, 3)\nget(2)" } },
    { label: "Capacity 1", values: { ops: "LRUCache(1)\nput(1, 1)\nput(2, 2)\nget(1)\nget(2)" } },
    { label: "Misses only", values: { ops: "LRUCache(3)\nget(5)\nput(1, 1)\nget(2)" } },
  ],
  parse: parseInput,
  modes: {
    "brute-force": {
      label: "Brute force O(N)",
      generate: generateBruteForce,
      code: { lang: "cpp", lines: BRUTE_CODE },
      complexity: {
        time: { avg: "O(N)" },
        space: "O(capacity)",
        note: "Searching and moving elements within the usage vector costs linear time (N is the current cache size).",
      },
    },
    optimal: {
      label: "Optimal O(1)",
      generate: generateOptimal,
      code: { lang: "cpp", lines: OPTIMAL_CODE },
      complexity: {
        time: { avg: "O(1)" },
        space: "O(capacity)",
        note: "get() and put() are constant time: hash map lookups plus linked list pointer updates.",
      },
    },
  },
  defaultMode: "optimal",
  legend: [
    { tone: "active", label: "new or moved key" },
    { tone: "error", label: "evicted key" },
  ],
  view: {
    stage: "list",
    map: (s, input, mode) => {
      const list = s.list || [];
      const doubly = mode !== "brute-force";
      const edges = [];
      for (let i = 0; i + 1 < list.length; i++) {
        edges.push({ from: list[i].key, to: list[i + 1].key });
        if (doubly) edges.push({ from: list[i + 1].key, to: list[i].key });
      }
      const pointers = [];
      if (list.length) {
        pointers.push({ nodeId: list[0].key, label: "MRU", role: 1 });
        pointers.push({ nodeId: list[list.length - 1].key, label: "LRU", role: 2 });
      }
      return {
        nodes: list.map((n) => ({
          id: n.key,
          value: `${n.key}:${n.val}`,
          tone: s.evictedKey === n.key ? "error" : touched(s, n.key) ? "active" : "idle",
        })),
        edges,
        pointers,
      };
    },
    aux: [
      {
        kind: "table",
        title: "Hash map",
        map: (s) => {
          const entries = Object.entries(s.cache || {}).map(([k, v]) => ({
            key: k,
            value: v,
            tone: String(s.evictedKey) === k ? "error" : touched(s, Number(k)) ? "active" : "idle",
          }));
          if (s.evictedKey != null && !entries.some((e) => String(s.evictedKey) === e.key)) {
            entries.push({ key: s.evictedKey, value: "evicted", tone: "error" });
          }
          return { entries };
        },
      },
      { kind: "ops", title: "Operations", map: (s, input) => opsView(s, input) },
    ],
  },
  stats: (s) => [
    { label: "size", value: Object.keys(s.cache || {}).length },
    { label: "results", value: (s.outputLog || []).length },
  ],
});
