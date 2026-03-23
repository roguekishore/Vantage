/**
 * Network Flow (Edmonds-Karp/Dinic) - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m - number of vertices and edges
 *   Next m lines: Three integers u v c representing a directed edge
 *                 from u to v with capacity c
 *   Last line: Two integers s t - source and sink vertices
 *
 * Output format (stdout):
 *   Print a single integer - the maximum flow from source s to sink t.
 */

module.exports = {
  id: 'network-flow-max-flow',
  conquestId: 'stage20-9',
  title: 'Network Flow (Edmonds-Karp/Dinic)',
  difficulty: 'Hard',
  category: 'Graphs',
  tags: ['Graph', 'Max Flow', 'Edmonds-Karp', 'Dinic', 'BFS'],

  description: `
Given a **directed graph** where each edge has a **capacity**, compute the **maximum possible flow** from a **source node s** to a **sink node t**.

The flow must satisfy:
- **Capacity constraint:** Flow on an edge cannot exceed its capacity.
- **Flow conservation:** Incoming flow equals outgoing flow for intermediate nodes.

You may implement either:
- **Edmonds-Karp Algorithm** (BFS-based Ford-Fulkerson)
- **Dinic's Algorithm** (more efficient for large graphs)

**Idea (Edmonds-Karp):**
1. Use **BFS** to find the shortest augmenting path from source to sink.
2. Determine the **minimum residual capacity** along that path.
3. Add that flow to the total and update residual capacities.
4. Repeat until no augmenting path exists.

Return the **maximum flow** from **s → t**.

Applications include:
- Network routing
- Bipartite matching
- Image segmentation
- Supply chain optimization
`,

  examples: [
    {
      input: '6 9\n0 1 16\n0 2 13\n1 2 10\n2 1 4\n1 3 12\n3 2 9\n2 4 14\n4 3 7\n3 5 20\n0 5',
      output: '23',
      explanation: 'Maximum flow from source 0 to sink 5 is 23.'
    }
  ],

  constraints: [
    '2 ≤ n ≤ 10^4',
    '1 ≤ m ≤ 10^5',
    '0 ≤ u, v < n',
    '1 ≤ c ≤ 10^9',
    '0 ≤ s, t < n',
    's ≠ t'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <climits>
using namespace std;

long long maxFlow(int n, vector<vector<long long>>& capacity, vector<vector<int>>& adj, int s, int t) {
    // TODO: Implement Edmonds-Karp or Dinic Algorithm
    return 0;
}

int main() {
    int n, m;
    cin >> n >> m;

    vector<vector<long long>> capacity(n, vector<long long>(n, 0));
    vector<vector<int>> adj(n);

    for(int i = 0; i < m; i++) {
        int u, v;
        long long c;
        cin >> u >> v >> c;

        capacity[u][v] += c;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    int s, t;
    cin >> s >> t;

    cout << maxFlow(n, capacity, adj, s, t);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static long maxFlow(int n, long[][] capacity, List<List<Integer>> adj, int s, int t) {
        // TODO: Implement Edmonds-Karp or Dinic Algorithm
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int m = sc.nextInt();

        long[][] capacity = new long[n][n];
        List<List<Integer>> adj = new ArrayList<>();

        for(int i = 0; i < n; i++)
            adj.add(new ArrayList<>());

        for(int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            long c = sc.nextLong();

            capacity[u][v] += c;
            adj.get(u).add(v);
            adj.get(v).add(u);
        }

        int s = sc.nextInt();
        int t = sc.nextInt();

        System.out.print(maxFlow(n, capacity, adj, s, t));
    }
}`,
  },

  testCases: [
    {
      input: '6 9\n0 1 16\n0 2 13\n1 2 10\n2 1 4\n1 3 12\n3 2 9\n2 4 14\n4 3 7\n3 5 20\n0 5',
      expected: '23'
    },
    {
      input: '4 5\n0 1 10\n0 2 5\n1 2 15\n1 3 10\n2 3 10\n0 3',
      expected: '15'
    },
    {
      input: '2 1\n0 1 7\n0 1',
      expected: '7'
    },
    {
      input: '3 3\n0 1 3\n1 2 4\n0 2 2\n0 2',
      expected: '5'
    },
    {
      input: '5 7\n0 1 10\n0 2 10\n1 3 4\n1 2 2\n2 4 9\n4 3 6\n3 4 6\n0 3',
      expected: '13'
    },
    {
      input: '3 3\n0 1 5\n1 2 3\n0 2 4\n0 2',
      expected: '7'
    },
    {
      input: '4 4\n0 1 100\n1 2 1\n2 3 100\n0 3 50\n0 3',
      expected: '51'
    },
    {
      input: '3 2\n0 1 10\n1 2 10\n0 2',
      expected: '10'
    },
    {
      input: '5 6\n0 1 8\n0 2 5\n1 3 4\n2 3 6\n3 4 10\n1 2 3\n0 4',
      expected: '9'
    }
  ],
};