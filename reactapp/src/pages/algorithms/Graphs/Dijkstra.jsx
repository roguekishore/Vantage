import { defineVisualizer, fieldError } from "@/components/visualizer";

const CODE = [
  "map<node,int> dist; map<node,node> prev; set<node> visited;",
  "priority_queue<pair<int,node>> pq; pq.push({0, start});",
  "while (!pq.empty()) {",
  "  auto [d, u] = pq.top(); pq.pop();",
  "  if (visited.count(u)) continue;",
  "  visited.insert(u);",
  "  if (u == target) break;",
  "  for (auto [v, w] : adj[u]) {",
  "    int newDist = dist[u] + w;",
  "    if (newDist < dist[v]) { dist[v]=newDist; prev[v]=u; pq.push({-newDist,v}); }",
  "  }",
  "}",
];

const show = (d) => (d === Infinity ? "∞" : d);

function parseInput(raw) {
  const { nodes, edges: rawEdges, directed } = raw.graph;
  const start = String(raw.start).trim();
  const end = String(raw.end).trim();
  if (!nodes.includes(start)) throw fieldError("start", "Start node must exist in the graph.");
  if (!nodes.includes(end)) throw fieldError("end", "End node must exist in the graph.");
  const edges = rawEdges.map(([u, v, w]) => [u, v, w == null ? 1 : w]);
  if (edges.some((e) => e[2] < 0)) throw fieldError("graph", "Dijkstra needs non-negative edge weights.");
  const adj = new Map(nodes.map((n) => [n, []]));
  edges.forEach(([u, v, w]) => {
    adj.get(u).push({ node: v, weight: w });
    if (!directed) adj.get(v).push({ node: u, weight: w });
  });
  return { nodes, edges, adj, directed, start, end };
}

function generate({ nodes, edges, adj, start, end }) {
  const steps = [];
  const distances = new Map(nodes.map((n) => [n, n === start ? 0 : Infinity]));
  const previous = new Map(nodes.map((n) => [n, null]));
  const visited = new Set();
  const pq = [];

  const add = (s) =>
    steps.push({
      nodes,
      edges,
      adj,
      distances: Object.fromEntries(distances),
      previous: Object.fromEntries(previous),
      visited: [...visited],
      pq: [...pq],
      current: null,
      exploringEdge: null,
      relaxingEdge: null,
      finalPath: [],
      ...s,
    });

  add({ line: 1, phase: "info", msg: "Initialize distances: start=0, others=∞" });

  pq.push({ node: start, dist: 0 });
  add({ line: 2, phase: "info", msg: `Add ${start} to priority queue with distance 0`, current: start });

  while (pq.length > 0) {
    add({ line: 3, phase: "info", msg: "Priority queue not empty → continue Dijkstra", current: pq[0]?.node });

    pq.sort((a, b) => a.dist - b.dist);
    const { node: u, dist } = pq.shift();
    add({ line: 4, phase: "compare", msg: `Extract ${u} with distance ${dist} from priority queue`, current: u });

    if (visited.has(u)) {
      add({ line: 5, phase: "info", msg: `${u} already visited → skip`, current: u });
      continue;
    }

    visited.add(u);
    add({ line: 6, phase: "write", msg: `Mark ${u} as visited`, current: u });

    if (u === end) {
      const path = [];
      let curr = end;
      while (curr !== null) {
        path.unshift(curr);
        curr = previous.get(curr);
      }
      add({
        line: 7,
        phase: "success",
        msg: `Reached target ${end}! Shortest path found with distance ${distances.get(end)}`,
        current: u,
        finalPath: path,
      });
      break;
    }

    for (const { node: v, weight } of adj.get(u) || []) {
      add({ line: 8, phase: "compare", msg: `Examine neighbor ${v} with edge weight ${weight}`, current: u, exploringEdge: [u, v] });

      const newDist = distances.get(u) + weight;
      add({
        line: 9,
        phase: "compare",
        msg: `Calculate new distance: ${distances.get(u)} + ${weight} = ${newDist}`,
        current: u,
        exploringEdge: [u, v],
      });

      if (newDist < distances.get(v)) {
        const old = distances.get(v);
        distances.set(v, newDist);
        previous.set(v, u);
        pq.push({ node: v, dist: newDist });
        add({
          line: 10,
          phase: "write",
          msg: `${newDist} < ${show(old)} → Update distance and add ${v} to queue`,
          current: u,
          exploringEdge: [u, v],
          relaxingEdge: [u, v],
        });
      }
    }
  }

  const finalPath = [];
  let curr = end;
  while (curr !== null && previous.get(curr) !== undefined) {
    finalPath.unshift(curr);
    curr = previous.get(curr);
  }
  if (curr === start) finalPath.unshift(start);

  const found = visited.has(end);
  add({
    finished: true,
    line: 12,
    phase: found ? "done" : "fail",
    msg: found
      ? `Dijkstra complete! Shortest path: ${finalPath.join(" → ")} with distance ${distances.get(end)}`
      : `Dijkstra complete! No path found from ${start} to ${end}`,
    pq: [],
    finalPath: found ? finalPath : [],
  });
  return steps;
}

const sameEdge = (pair, u, v, directed) =>
  !!pair && ((pair[0] === u && pair[1] === v) || (!directed && pair[0] === v && pair[1] === u));

function nodeTone(s, n) {
  if (s.current === n) return "active";
  if (s.finalPath.includes(n)) return "success";
  if (s.visited.includes(n)) return "done";
  if (s.pq.some((item) => item.node === n)) return "compare";
  return "idle";
}

function edgeTone(s, u, v, directed) {
  const onPath = s.finalPath.some((n, i) => i < s.finalPath.length - 1 && sameEdge([n, s.finalPath[i + 1]], u, v, directed));
  if (onPath) return "success";
  if (sameEdge(s.relaxingEdge, u, v, directed)) return "write";
  if (sameEdge(s.exploringEdge, u, v, directed)) return "active";
  return "idle";
}

const DEFAULT_GRAPH = {
  nodes: ["0", "1", "2", "3", "4"],
  edges: [["0", "1", 4], ["0", "2", 1], ["1", "3", 1], ["2", "1", 2], ["2", "3", 5], ["3", "4", 3]],
  directed: false,
};

export default defineVisualizer({
  meta: {
    title: "Dijkstra's Algorithm",
    category: "Graphs",
    difficulty: "medium",
    summary: "Always settle the closest unvisited node, relaxing its edges to find shortest paths in a weighted graph.",
    leetcode: 743,
  },
  inputs: [
    { key: "graph", kind: "graph", label: "Edges (A-B:3, A->B:3)", default: DEFAULT_GRAPH },
    { key: "start", kind: "string", label: "Start", default: "0", maxLen: 5 },
    { key: "end", kind: "string", label: "End", default: "4", maxLen: 5 },
  ],
  examples: [
    { label: "Classic", values: { graph: DEFAULT_GRAPH, start: "0", end: "4" } },
    {
      label: "Directed",
      values: {
        graph: { nodes: ["A", "B", "C", "D"], edges: [["A", "B", 1], ["A", "C", 4], ["B", "C", 2], ["C", "D", 1]], directed: true },
        start: "A",
        end: "D",
      },
    },
    {
      label: "Unreachable",
      values: { graph: { nodes: ["A", "B", "C", "D"], edges: [["A", "B", 2], ["C", "D", 1]], directed: false }, start: "A", end: "D" },
    },
    { label: "Start is target", values: { graph: DEFAULT_GRAPH, start: "2", end: "2" } },
  ],
  parse: parseInput,
  generate,
  code: { lang: "cpp", lines: CODE },
  complexity: {
    time: { avg: "O((V + E) log V)", note: "Using a priority queue: O(V) for extraction and O(E log V) for edge relaxations." },
    space: "O(V)",
  },
  legend: [
    { tone: "active", label: "current node / exploring edge" },
    { tone: "compare", label: "in priority queue" },
    { tone: "done", label: "visited" },
    { tone: "write", label: "edge relaxed" },
    { tone: "success", label: "shortest path" },
  ],
  view: {
    stage: "graph",
    map: (s, input) => {
      const directed = Boolean(input && input.directed);
      return {
        nodes: s.nodes.map((n) => ({ id: n, label: `${n}:${show(s.distances[n])}`, tone: nodeTone(s, n) })),
        edges: s.edges.map(([u, v, w]) => ({ from: u, to: v, weight: w, tone: edgeTone(s, u, v, directed) })),
        directed,
      };
    },
    aux: [
      {
        kind: "queue",
        title: "Priority queue",
        map: (s) => ({
          items: [...s.pq].sort((a, b) => a.dist - b.dist).map((item) => ({ value: item.node, sub: `d=${item.dist}` })),
        }),
      },
    ],
  },
  stats: (s) => [
    { label: "visited", value: s.visited.length },
    { label: "in queue", value: s.pq.length },
  ],
});
