/**
 * DFS (Graph) - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m - number of vertices and edges
 *   Next m lines: Two integers u v representing an undirected edge between u and v
 *   Last line: Integer s - starting vertex for DFS traversal
 *
 * Output format (stdout):
 *   Print the DFS traversal order starting from vertex s.
 *   Vertices should be printed space-separated in the order they are visited.
 */

module.exports = {
  id: 'dfs-graph',
  conquestId: 's20-p01',
  title: 'DFS (Graph Explorer)',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'DFS', 'Traversal', 'Hogwarts'],

  stageIntro: `
# Stage 20: The Chamber of Secrets
The Heir of Slytherin has returned, and the school is in a state of panic. To find the entrance to the Chamber, you must first navigate the labyrinthine tunnels beneath Hogwarts. Knowledge of graph theory will be your only light in the darkness.
`,

  storyBriefing: `
"Even when you think you've hit a dead end, keep going," Hermione whispers, pointing to a map of the ancient sewer systems. "We need to explore every branch as deep as it goes before we backtrack. That's the only way we won't miss any secret passages." 

You are tasked with exploring the underground tunnels using **Depth First Search (DFS)**. Start at the specified node and venture as deep as possible into each branch.
`,

  description: `
Given a graph with **n vertices** and **m edges**, perform a **Depth First Search (DFS)** starting from node **s**.

DFS (Depth First Search) is an algorithm for traversing or searching tree or graph data structures. The algorithm starts at the root node (selecting some arbitrary node as the root node in the case of a graph) and explores as far as possible along each branch before backtracking.

**Rules:**
- Visit nodes using DFS.
- If multiple neighbors exist, visit them in **increasing numerical order**.
- Each node should be visited **only once**.
`,

  examples: [
    {
      input: '5 4\n0 1\n0 2\n1 3\n1 4\n0',
      output: '0 1 3 4 2',
      explanation: 'Starting at 0, we explore neighbor 1. From 1, we visit 3, then 4. Finally, we backtrack to 0 and visit 2.'
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

/**
 * Perform DFS traversal from the starting node.
 * @param node Current node
 * @param adj Adjacency list
 * @param visited Visited array
 * @param result List to store traversal order
 */
void dfs(int node, const vector<vector<int>>& adj, vector<bool>& visited, vector<int>& result) {
    visited[node] = true;
    result.push_back(node);
    
    for (int next : adj[node]) {
        if (!visited[next]) {
            dfs(next, adj, visited, result);
        }
    }
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
        adj[v].push_back(u);
    }

    for (int i = 0; i < n; i++) {
        sort(adj[i].begin(), adj[i].end());
    }

    int s;
    cin >> s;

    vector<bool> visited(n, false);
    vector<int> result;
    dfs(s, adj, visited, result);

    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    cout << endl;

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static void dfs(int node, List<List<Integer>> adj, boolean[] visited, List<Integer> result) {
        visited[node] = true;
        result.add(node);
        
        for (int next : adj.get(node)) {
            if (!visited[next]) {
                dfs(next, adj, visited, result);
            }
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            adj.add(new ArrayList<>());
        }

        for (int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
            adj.get(v).add(u);
        }

        for (int i = 0; i < n; i++) {
            Collections.sort(adj.get(i));
        }

        int s = sc.nextInt();
        boolean[] visited = new boolean[n];
        List<Integer> result = new ArrayList<>();

        dfs(s, adj, visited, result);

        for (int i = 0; i < result.size(); i++) {
            System.out.print(result.get(i) + (i == result.size() - 1 ? "" : " "));
        }
        System.out.println();
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void dfs(int node, const vector<vector<int>>& adj, vector<bool>& visited, vector<int>& result) {
    visited[node] = true;
    result.push_back(node);
    
    for (int next : adj[node]) {
        if (!visited[next]) {
            dfs(next, adj, visited, result);
        }
    }
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
        adj[v].push_back(u);
    }

    for (int i = 0; i < n; i++) {
        sort(adj[i].begin(), adj[i].end());
    }

    int s;
    cin >> s;

    vector<bool> visited(n, false);
    vector<int> result;
    dfs(s, adj, visited, result);

    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    cout << endl;

    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static void dfs(int node, List<List<Integer>> adj, boolean[] visited, List<Integer> result) {
        visited[node] = true;
        result.add(node);
        
        for (int next : adj.get(node)) {
            if (!visited[next]) {
                dfs(next, adj, visited, result);
            }
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            adj.add(new ArrayList<>());
        }

        for (int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
            adj.get(v).add(u);
        }

        for (int i = 0; i < n; i++) {
            Collections.sort(adj.get(i));
        }

        int s = sc.nextInt();
        boolean[] visited = new boolean[n];
        List<Integer> result = new ArrayList<>();

        dfs(s, adj, visited, result);

        for (int i = 0; i < result.size(); i++) {
            System.out.print(result.get(i) + (i == result.size() - 1 ? "" : " "));
        }
    }
}`
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