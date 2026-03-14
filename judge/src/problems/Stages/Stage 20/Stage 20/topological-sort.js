/**
 * Topological Sort — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m — number of vertices and edges
 *   Next m lines: Two integers u v representing a directed edge from u to v
 *
 * Output format (stdout):
 *   Print a valid topological ordering of the graph as n space-separated integers.
 *   If multiple orders are possible, print the one obtained by processing
 *   vertices with smaller indices first.
 */

module.exports = {
  id: 'topological-sort',
  conquestId: 'stage20-6',
  title: 'Topological Sort',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'Topological Sort', 'DAG', 'BFS', 'Kahn Algorithm'],

  description: `
Given a **Directed Acyclic Graph (DAG)** with **n vertices** and **m directed edges**, perform a **Topological Sort**.

A **topological ordering** of a directed graph is a linear ordering of its vertices such that for every directed edge **u → v**, vertex **u appears before v** in the ordering.

You should implement **Kahn’s Algorithm (BFS-based topological sort)** or a **DFS-based approach**.

**Rules:**
- The graph is guaranteed to be a **DAG**.
- If multiple nodes have **indegree 0**, always process the **smaller numbered node first**.
- Print the resulting ordering.

Topological sorting is useful in:
- Task scheduling
- Build systems
- Dependency resolution
- Course prerequisite planning
`,

  examples: [
    {
      input: '6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1',
      output: '4 5 0 2 3 1',
      explanation: 'One valid topological order that satisfies all edge directions.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    '0 ≤ m ≤ 2×10^5',
    '0 ≤ u, v < n',
    'The graph is guaranteed to be a DAG'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

vector<int> topologicalSort(int n, vector<vector<int>>& adj) {
    // TODO: Implement Kahn's Algorithm
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
    }

    vector<int> result = topologicalSort(n, adj);

    for(int i = 0; i < result.size(); i++) {
        if(i) cout << " ";
        cout << result[i];
    }

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static List<Integer> topologicalSort(int n, List<List<Integer>> adj) {
        // TODO: Implement Kahn's Algorithm
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
        }

        List<Integer> result = topologicalSort(n, adj);

        for(int i = 0; i < result.size(); i++) {
            if(i > 0) System.out.print(" ");
            System.out.print(result.get(i));
        }
    }
}`,
  },

  testCases: [
    {
      input: '6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1',
      expected: '4 5 0 2 3 1'
    },
    {
      input: '4 3\n0 1\n0 2\n1 3',
      expected: '0 1 2 3'
    },
    {
      input: '3 2\n0 1\n1 2',
      expected: '0 1 2'
    },
    {
      input: '5 4\n0 1\n0 2\n1 3\n2 4',
      expected: '0 1 2 3 4'
    },
    {
      input: '3 1\n0 2',
      expected: '0 1 2'
    },
    {
      input: '1 0',
      expected: '0'
    },
    {
      input: '4 2\n1 2\n2 3',
      expected: '0 1 2 3'
    },
    {
      input: '5 3\n0 1\n1 2\n3 4',
      expected: '0 3 1 4 2'
    },
    {
      input: '4 4\n0 1\n0 2\n1 3\n2 3',
      expected: '0 1 2 3'
    }
  ],
};