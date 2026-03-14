/**
 * BFS (Graph) — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m — number of vertices and edges
 *   Next m lines: Two integers u v representing an undirected edge between u and v
 *   Last line: Integer s — starting vertex for BFS traversal
 *
 * Output format (stdout):
 *   Print the BFS traversal order starting from vertex s.
 *   Vertices should be printed space-separated in the order they are visited.
 */

module.exports = {
  id: 'bfs-graph',
  conquestId: 'stage20-2',
  title: 'BFS (Graph)',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'BFS', 'Traversal'],

  description: `
Given a graph with **n vertices** and **m edges**, perform a **Breadth First Search (BFS)** starting from a given starting node.

BFS explores nodes **level by level**, visiting all neighbors of the current node before moving to the next level.  
It is typically implemented using a **queue**.

The graph is **undirected**.

You must print the **BFS traversal order** starting from the given node.

**Rules:**
- Visit nodes using BFS.
- If multiple neighbors exist, visit them in **increasing numerical order**.
- Each node should be visited **only once**.

BFS is widely used for:
- Shortest path in unweighted graphs
- Level order traversal
- Connectivity checking
`,

  examples: [
    {
      input: '5 4\n0 1\n0 2\n1 3\n1 4\n0',
      output: '0 1 2 3 4',
      explanation: 'Starting from 0, BFS visits its neighbors 1 and 2 first, then their neighbors.'
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
#include <queue>
#include <algorithm>
using namespace std;

vector<int> bfs(int start, vector<vector<int>>& adj) {
    // TODO: Implement BFS traversal
    return {};
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

    vector<int> result = bfs(s, adj);

    for(int i = 0; i < result.size(); i++) {
        if(i) cout << " ";
        cout << result[i];
    }

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static List<Integer> bfs(int start, List<List<Integer>> adj) {
        // TODO: Implement BFS traversal
        return new ArrayList<>();
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

        List<Integer> result = bfs(s, adj);

        for(int i = 0; i < result.size(); i++) {
            if(i > 0) System.out.print(" ");
            System.out.print(result.get(i));
        }
    }
}`,
  },

  testCases: [
    { input: '5 4\n0 1\n0 2\n1 3\n1 4\n0', expected: '0 1 2 3 4' },
    { input: '4 3\n0 1\n1 2\n2 3\n0', expected: '0 1 2 3' },
    { input: '4 3\n0 1\n0 2\n0 3\n0', expected: '0 1 2 3' },
    { input: '3 1\n0 1\n0', expected: '0 1' },
    { input: '6 5\n0 1\n0 2\n1 3\n3 4\n2 5\n0', expected: '0 1 2 3 5 4' },
    { input: '1 0\n0', expected: '0' },
    { input: '5 3\n0 1\n2 3\n3 4\n2', expected: '2 3 4' },
    { input: '5 5\n0 1\n0 2\n1 2\n2 3\n3 4\n0', expected: '0 1 2 3 4' },
    { input: '5 4\n0 1\n1 2\n2 3\n3 4\n2', expected: '2 1 3 0 4' }
  ],
};