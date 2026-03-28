/**
 * BFS (Graph) - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m - number of vertices and edges
 *   Next m lines: Two integers u v representing an undirected edge between u and v
 *   Last line: Integer s - starting vertex for BFS traversal
 *
 * Output format (stdout):
 *   Print the BFS traversal order starting from vertex s.
 *   Vertices should be printed space-separated in the order they are visited.
 */

module.exports = {
  id: 'bfs-graph',
  conquestId: 's20-p02',
  title: 'BFS (Tunnel Surveyor)',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'BFS', 'Traversal', 'Hogwarts'],

  storyBriefing: `
"We should spread out," Ron suggests, though his voice shakes slightly. "If we check all the nearby branches first, we'll find the way faster without getting lost deep in the pipes."

You are using **Breadth First Search (BFS)** to map out the tunnels. By visiting all neighbors at the current level before moving deeper, you ensure a systematic survey of the area near the entrance.
`,

  description: `
Given a graph with **n vertices** and **m edges**, perform a **Breadth First Search (BFS)** starting from node **s**.

BFS (Breadth First Search) is an algorithm for traversing or searching tree or graph data structures. It starts at the root node (selecting some arbitrary node as the root node for graphs) and explores all of the neighbor nodes at the present depth prior to moving on to the nodes at the next depth level.

**Rules:**
- Visit nodes using BFS.
- If multiple neighbors exist, visit them in **increasing numerical order**.
- Each node should be visited **only once**.
`,

  examples: [
    {
      input: '5 4\n0 1\n0 2\n1 3\n1 4\n0',
      output: '0 1 2 3 4',
      explanation: 'Starting at 0, neighbors 1 and 2 are visited. Then, from 1, neighbors 3 and 4 are added to the queue.'
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

vector<int> bfs(int s, vector<vector<int>>& adj, int n) {
    vector<int> result;
    vector<bool> visited(n, false);
    queue<int> q;

    q.push(s);
    visited[s] = true;

    while (!q.empty()) {
        int curr = q.front();
        q.pop();
        result.push_back(curr);

        for (int next : adj[curr]) {
            if (!visited[next]) {
                visited[next] = true;
                q.push(next);
            }
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
        adj[v].push_back(u);
    }

    for (int i = 0; i < n; i++) {
        sort(adj[i].begin(), adj[i].end());
    }

    int s;
    cin >> s;

    vector<int> result = bfs(s, adj, n);

    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    cout << endl;

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static List<Integer> bfs(int s, List<List<Integer>> adj, int n) {
        List<Integer> result = new ArrayList<>();
        boolean[] visited = new boolean[n];
        Queue<Integer> q = new LinkedList<>();

        q.add(s);
        visited[s] = true;

        while (!q.isEmpty()) {
            int curr = q.poll();
            result.add(curr);

            for (int next : adj.get(curr)) {
                if (!visited[next]) {
                    visited[next] = true;
                    q.add(next);
                }
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
            adj.get(v).add(u);
        }

        for (int i = 0; i < n; i++) Collections.sort(adj.get(i));

        int s = sc.nextInt();
        List<Integer> result = bfs(s, adj, n);

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
#include <queue>
#include <algorithm>

using namespace std;

vector<int> bfs(int s, vector<vector<int>>& adj, int n) {
    vector<int> result;
    vector<bool> visited(n, false);
    queue<int> q;

    if (n == 0) return result;
    q.push(s);
    visited[s] = true;

    while (!q.empty()) {
        int curr = q.front();
        q.pop();
        result.push_back(curr);

        for (int next : adj[curr]) {
            if (!visited[next]) {
                visited[next] = true;
                q.push(next);
            }
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
        adj[v].push_back(u);
    }

    for (int i = 0; i < n; i++) {
        sort(adj[i].begin(), adj[i].end());
    }

    int s;
    cin >> s;

    vector<int> result = bfs(s, adj, n);

    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static List<Integer> bfs(int s, List<List<Integer>> adj, int n) {
        List<Integer> result = new ArrayList<>();
        if (n == 0) return result;
        boolean[] visited = new boolean[n];
        Queue<Integer> q = new LinkedList<>();

        q.add(s);
        visited[s] = true;

        while (!q.isEmpty()) {
            int curr = q.poll();
            result.add(curr);

            for (int next : adj.get(curr)) {
                if (!visited[next]) {
                    visited[next] = true;
                    q.add(next);
                }
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
            adj.get(v).add(u);
        }

        for (int i = 0; i < n; i++) Collections.sort(adj.get(i));

        int s = sc.nextInt();
        List<Integer> result = bfs(s, adj, n);

        for (int i = 0; i < result.size(); i++) {
            System.out.print(result.get(i) + (i == result.size() - 1 ? "" : " "));
        }
    }
}`
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