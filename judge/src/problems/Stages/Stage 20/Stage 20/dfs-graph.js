/**
 * DFS (Graph) — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m — number of vertices and edges
 *   Next m lines: Two integers u v representing an undirected edge between u and v
 *   Last line: Integer s — starting vertex for DFS traversal
 *
 * Output format (stdout):
 *   Print the DFS traversal order starting from vertex s.
 *   Vertices should be printed space-separated in the order they are visited.
 */

module.exports = {
  id: 'dfs-graph',
  conquestId: 'stage20-1',
  title: 'DFS (Graph)',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'DFS', 'Traversal'],

  description: `
Given a graph with **n vertices** and **m edges**, perform a **Depth First Search (DFS)** starting from a given starting node.

DFS explores as far as possible along each branch before backtracking. It is commonly implemented using **recursion** or an **explicit stack**.

The graph is **undirected**.

You must print the **DFS traversal order** starting from the given node.

**Rules:**
- Visit nodes using DFS.
- If multiple neighbors exist, visit them in **increasing numerical order**.
- Each node should be visited **only once**.

DFS is a fundamental algorithm used in:
- Cycle detection
- Connected components
- Topological sorting
- Pathfinding
`,

  examples: [
    {
      input: '5 4\n0 1\n0 2\n1 3\n1 4\n0',
      output: '0 1 3 4 2',
      explanation: 'DFS starts at 0, explores 1 and its children before visiting 2.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    '0 ≤ m ≤ 2×10^5',
    '0 ≤ u, v < n',
    '0 ≤ s < n'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

void dfs(int node, vector<vector<int>>& adj, vector<int>& visited, vector<int>& result) {
    // TODO: Implement DFS traversal
}

int main() {
    int n, m;
    cin >> n >> m;

    vector<vector<int>> adj(n);

    for(int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    for(int i = 0; i < n; i++) {
        sort(adj[i].begin(), adj[i].end());
    }

    int s;
    cin >> s;

    vector<int> visited(n, 0);
    vector<int> result;

    dfs(s, adj, visited, result);

    for(int i = 0; i < result.size(); i++) {
        if(i) cout << " ";
        cout << result[i];
    }

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static void dfs(int node, List<List<Integer>> adj, boolean[] visited, List<Integer> result) {
        // TODO: Implement DFS traversal
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<List<Integer>> adj = new ArrayList<>();

        for(int i = 0; i < n; i++)
            adj.add(new ArrayList<>());

        for(int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();

            adj.get(u).add(v);
            adj.get(v).add(u);
        }

        for(int i = 0; i < n; i++)
            Collections.sort(adj.get(i));

        int s = sc.nextInt();

        boolean[] visited = new boolean[n];
        List<Integer> result = new ArrayList<>();

        dfs(s, adj, visited, result);

        for(int i = 0; i < result.size(); i++) {
            if(i > 0) System.out.print(" ");
            System.out.print(result.get(i));
        }
    }
}`,
  },

  testCases: [
    {
      input: '5 4\n0 1\n0 2\n1 3\n1 4\n0',
      expected: '0 1 3 4 2'
    },
    {
      input: '4 3\n0 1\n1 2\n2 3\n0',
      expected: '0 1 2 3'
    },
    {
      input: '4 3\n0 1\n0 2\n0 3\n0',
      expected: '0 1 2 3'
    },
    {
      input: '3 1\n0 1\n0',
      expected: '0 1'
    },
    {
      input: '6 5\n0 1\n0 2\n1 3\n3 4\n2 5\n0',
      expected: '0 1 3 4 2 5'
    },
    {
      input: '1 0\n0',
      expected: '0'
    },
    {
      input: '5 3\n0 1\n2 3\n3 4\n2',
      expected: '2 3 4'
    },
    {
      input: '5 5\n0 1\n0 2\n1 2\n2 3\n3 4\n0',
      expected: '0 1 2 3 4'
    },
    {
      input: '5 4\n0 1\n1 2\n2 3\n3 4\n2',
      expected: '2 1 0 3 4'
    }
  ],
};