/**
 * Topological Sort - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m - number of vertices and edges
 *   Next m lines: Two integers u v representing a directed edge from u to v
 *
 * Output format (stdout):
 *   Print a valid topological ordering of the graph as n space-separated integers.
 *   If multiple orders are possible, print the one obtained by processing
 *   vertices with smaller indices first.
 */

module.exports = {
  id: 'topological-sort',
  conquestId: 's20-p06',
  title: 'Order of O.W.L. Exams',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'Topological Sort', 'DAG', 'BFS', 'Kahn Algorithm', 'Hogwarts'],

  storyBriefing: `
"You can't take N.E.W.T. level Potions without completing O.W.L. level first," Percy Weasley points out, adjusting his glasses. "The curriculum is a complex set of prerequisites. One must follow the correct order to succeed."

Given a set of courses and their prerequisites (a **Directed Acyclic Graph**), determine a valid **Topological Sort** sequence to complete all exams.
`,

  description: `
Given a **Directed Acyclic Graph (DAG)** with **n vertices** and **m directed edges**, perform a **Topological Sort**.

A **topological ordering** of a directed graph is a linear ordering of its vertices such that for every directed edge **u → v**, vertex **u appears before v** in the ordering.

**Rules:**
- The graph is guaranteed to be a **DAG**.
- If multiple nodes have **indegree 0**, always process the **smaller numbered node first**.
- Print the resulting ordering.
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
    vector<int> indegree(n, 0);
    for (int i = 0; i < n; i++) {
        for (int v : adj[i]) indegree[v]++;
    }

    priority_queue<int, vector<int>, greater<int>> pq;
    for (int i = 0; i < n; i++) {
        if (indegree[i] == 0) pq.push(i);
    }

    vector<int> result;
    while (!pq.empty()) {
        int u = pq.top();
        pq.pop();
        result.push_back(u);

        for (int v : adj[u]) {
            indegree[v]--;
            if (indegree[v] == 0) pq.push(v);
        }
    }
    return result;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> adj(n);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
    }

    vector<int> result = topologicalSort(n, adj);
    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static List<Integer> topologicalSort(int n, List<List<Integer>> adj) {
        int[] indegree = new int[n];
        for (int i = 0; i < n; i++) {
            for (int v : adj.get(i)) indegree[v]++;
        }

        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int i = 0; i < n; i++) {
            if (indegree[i] == 0) pq.add(i);
        }

        List<Integer> result = new ArrayList<>();
        while (!pq.isEmpty()) {
            int u = pq.poll();
            result.add(u);

            for (int v : adj.get(u)) {
                indegree[v]--;
                if (indegree[v] == 0) pq.add(v);
            }
        }
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

        for (int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
        }

        List<Integer> result = topologicalSort(n, adj);
        for (int i = 0; i < result.size(); i++) {
            System.out.print(result.get(i) + (i == result.size() - 1 ? "" : " "));
        }
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <queue>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> adj(n);
    vector<int> indegree(n, 0);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        indegree[v]++;
    }

    priority_queue<int, vector<int>, greater<int>> pq;
    for (int i = 0; i < n; i++) {
        if (indegree[i] == 0) pq.push(i);
    }

    vector<int> result;
    while (!pq.empty()) {
        int u = pq.top();
        pq.pop();
        result.push_back(u);

        for (int v : adj[u]) {
            indegree[v]--;
            if (indegree[v] == 0) pq.push(v);
        }
    }

    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<List<Integer>> adj = new ArrayList<>();
        int[] indegree = new int[n];
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

        for (int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
            indegree[v]++;
        }

        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int i = 0; i < n; i++) {
            if (indegree[i] == 0) pq.add(i);
        }

        List<Integer> result = new ArrayList<>();
        while (!pq.isEmpty()) {
            int u = pq.poll();
            result.add(u);

            for (int v : adj.get(u)) {
                indegree[v]--;
                if (indegree[v] == 0) pq.add(v);
            }
        }

        for (int i = 0; i < result.size(); i++) {
            System.out.print(result.get(i) + (i == result.size() - 1 ? "" : " "));
        }
    }
}`
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