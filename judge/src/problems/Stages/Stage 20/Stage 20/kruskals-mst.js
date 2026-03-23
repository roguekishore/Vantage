/**
 * Kruskal's MST - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m - number of vertices and edges
 *   Next m lines: Three integers u v w representing an undirected edge
 *                 between vertex u and v with weight w
 *
 * Output format (stdout):
 *   Print a single integer - the total weight of the Minimum Spanning Tree (MST).
 */

module.exports = {
  id: 'kruskals-mst',
  conquestId: 'stage20-7',
  title: "Kruskal's MST",
  difficulty: 'Hard',
  category: 'Graphs',
  tags: ['Graph', 'MST', 'Kruskal', 'Union Find', 'Greedy'],

  description: `
Given a **connected, undirected, weighted graph**, compute the **total weight of its Minimum Spanning Tree (MST)** using **Kruskal’s Algorithm**.

A **Minimum Spanning Tree** is a subset of edges that:
- Connects all vertices in the graph
- Contains **exactly (n − 1) edges**
- Has the **minimum possible total edge weight**
- Contains **no cycles**

**Kruskal’s Algorithm:**
1. Sort all edges by their weight.
2. Start adding edges with the smallest weight.
3. Use a **Disjoint Set Union (Union-Find)** structure to detect cycles.
4. If adding an edge does not form a cycle, include it in the MST.
5. Stop when **n−1 edges** are included.

Return the **sum of weights of the edges in the MST**.
`,

  examples: [
    {
      input: '4 5\n0 1 10\n0 2 6\n0 3 5\n1 3 15\n2 3 4',
      output: '19',
      explanation: 'Edges chosen: (2-3:4), (0-3:5), (0-1:10) → Total = 19.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    'n - 1 ≤ m ≤ 2×10^5',
    '0 ≤ u, v < n',
    '1 ≤ w ≤ 10^9',
    'The graph is connected'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct Edge {
    int u, v;
    long long w;
};

long long kruskal(int n, vector<Edge>& edges) {
    // TODO: Implement Kruskal's MST using Union-Find
    return 0;
}

int main() {
    int n, m;
    cin >> n >> m;

    vector<Edge> edges(m);

    for(int i = 0; i < m; i++) {
        cin >> edges[i].u >> edges[i].v >> edges[i].w;
    }

    cout << kruskal(n, edges);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Edge {
        int u, v;
        long w;

        Edge(int u, int v, long w) {
            this.u = u;
            this.v = v;
            this.w = w;
        }
    }

    static long kruskal(int n, List<Edge> edges) {
        // TODO: Implement Kruskal's MST using Union-Find
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<Edge> edges = new ArrayList<>();

        for(int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            long w = sc.nextLong();
            edges.add(new Edge(u, v, w));
        }

        System.out.print(kruskal(n, edges));
    }
}`,
  },

  testCases: [
    {
      input: '4 5\n0 1 10\n0 2 6\n0 3 5\n1 3 15\n2 3 4',
      expected: '19'
    },
    {
      input: '3 3\n0 1 1\n1 2 2\n0 2 3',
      expected: '3'
    },
    {
      input: '2 1\n0 1 5',
      expected: '5'
    },
    {
      input: '5 7\n0 1 2\n0 3 6\n1 2 3\n1 3 8\n1 4 5\n2 4 7\n3 4 9',
      expected: '16'
    },
    {
      input: '4 4\n0 1 1\n1 2 2\n2 3 3\n3 0 4',
      expected: '6'
    },
    {
      input: '5 4\n0 1 10\n1 2 10\n2 3 10\n3 4 10',
      expected: '40'
    },
    {
      input: '6 9\n0 1 4\n0 2 4\n1 2 2\n1 0 4\n2 3 3\n2 5 2\n2 4 4\n3 4 3\n5 4 3',
      expected: '14'
    },
    {
      input: '3 3\n0 1 100\n1 2 200\n0 2 50',
      expected: '150'
    },
    {
      input: '4 6\n0 1 1\n0 2 2\n0 3 3\n1 2 4\n1 3 5\n2 3 6',
      expected: '6'
    }
  ],
};