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
  conquestId: 's20-p09',
  title: 'Max Flow of the Pipe System',
  difficulty: 'Hard',
  category: 'Graphs',
  tags: ['Graph', 'Max Flow', 'Edmonds-Karp', 'Dinic', 'BFS', 'Hogwarts'],

  storyBriefing: `
"The pipes only allow so much through at once," Tom Riddle's voice echoes through the tunnels. You realize that to understand the Basilisk's movements, you must calculate the maximum capacity of the plumbing system connecting the various sectors of Hogwarts.

Using the **Edmonds-Karp** or **Dinic's Algorithm**, find the **maximum flow** from the source (the entrance) to the sink (the Chamber). This represents the absolute limit of what the magical tunnels can carry.
`,

  description: `
Given a **directed graph** where each edge has a **capacity**, compute the **maximum possible flow** from a **source node s** to a **sink node t**.

The flow must satisfy:
- **Capacity constraint:** Flow on an edge cannot exceed its capacity.
- **Flow conservation:** Incoming flow equals outgoing flow for intermediate nodes.

You should implement the **Edmonds-Karp Algorithm** (BFS-based Ford-Fulkerson).

Return the **maximum flow** from **s → t**.
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
#include <algorithm>

using namespace std;

long long bfs(int s, int t, vector<int>& parent, vector<vector<long long>>& capacity, vector<vector<int>>& adj) {
    fill(parent.begin(), parent.end(), -1);
    parent[s] = -2;
    queue<pair<int, long long>> q;
    q.push({s, LLONG_MAX});

    while (!q.empty()) {
        int u = q.front().first;
        long long flow = q.front().second;
        q.pop();

        for (int v : adj[u]) {
            if (parent[v] == -1 && capacity[u][v] > 0) {
                parent[v] = u;
                long long new_flow = min(flow, capacity[u][v]);
                if (v == t) return new_flow;
                q.push({v, new_flow});
            }
        }
    }
    return 0;
}

long long maxFlow(int n, vector<vector<long long>>& capacity, vector<vector<int>>& adj, int s, int t) {
    long long flow = 0;
    vector<int> parent(n);
    long long new_flow;

    while (new_flow = bfs(s, t, parent, capacity, adj)) {
        flow += new_flow;
        int curr = t;
        while (curr != s) {
            int prev = parent[curr];
            capacity[prev][curr] -= new_flow;
            capacity[curr][prev] += new_flow;
            curr = prev;
        }
    }
    return flow;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    if (!(cin >> n >> m)) return 0;

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

    cout << maxFlow(n, capacity, adj, s, t) << endl;
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static long bfs(int s, int t, int[] parent, long[][] capacity, List<List<Integer>> adj) {
        Arrays.fill(parent, -1);
        parent[s] = -2;
        Queue<long[]> q = new LinkedList<>();
        q.add(new long[]{s, Long.MAX_VALUE});

        while (!q.isEmpty()) {
            long[] curr = q.poll();
            int u = (int)curr[0];
            long flow = curr[1];

            for (int v : adj.get(u)) {
                if (parent[v] == -1 && capacity[u][v] > 0) {
                    parent[v] = u;
                    long newFlow = Math.min(flow, capacity[u][v]);
                    if (v == t) return newFlow;
                    q.add(new long[]{v, newFlow});
                }
            }
        }
        return 0;
    }

    static long maxFlow(int n, long[][] capacity, List<List<Integer>> adj, int s, int t) {
        long flow = 0;
        int[] parent = new int[n];
        long newFlow;

        while ((newFlow = bfs(s, t, parent, capacity, adj)) != 0) {
            flow += newFlow;
            int curr = t;
            while (curr != s) {
                int prev = parent[curr];
                capacity[prev][curr] -= newFlow;
                capacity[curr][prev] += newFlow;
                curr = prev;
            }
        }
        return flow;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int n = sc.nextInt();
        int m = sc.nextInt();

        long[][] capacity = new long[n][n];
        List<List<Integer>> adj = new ArrayList<>();
        for(int i = 0; i < n; i++) adj.add(new ArrayList<>());

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

        System.out.println(maxFlow(n, capacity, adj, s, t));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <climits>
#include <algorithm>

using namespace std;

long long bfs(int s, int t, vector<int>& parent, vector<vector<long long>>& capacity, vector<vector<int>>& adj) {
    fill(parent.begin(), parent.end(), -1);
    parent[s] = -2;
    queue<pair<int, long long>> q;
    q.push({s, LLONG_MAX});

    while (!q.empty()) {
        int u = q.front().first;
        long long flow = q.front().second;
        q.pop();

        for (int v : adj[u]) {
            if (parent[v] == -1 && capacity[u][v] > 0) {
                parent[v] = u;
                long long new_flow = min(flow, capacity[u][v]);
                if (v == t) return new_flow;
                q.push({v, new_flow});
            }
        }
    }
    return 0;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<vector<long long>> capacity(n, vector<long long>(n, 0));
    vector<vector<int>> adj(n);
    for(int i = 0; i < m; i++) {
        int u, v; long long c; cin >> u >> v >> c;
        capacity[u][v] += c;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    int s, t; cin >> s >> t;
    long long total_flow = 0;
    vector<int> parent(n);
    long long new_flow;
    while (new_flow = bfs(s, t, parent, capacity, adj)) {
        total_flow += new_flow;
        int curr = t;
        while (curr != s) {
            int prev = parent[curr];
            capacity[prev][curr] -= new_flow;
            capacity[curr][prev] += new_flow;
            curr = prev;
        }
    }
    cout << total_flow;
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static long bfs(int s, int t, int[] parent, long[][] capacity, List<List<Integer>> adj) {
        Arrays.fill(parent, -1);
        parent[s] = -2;
        Queue<long[]> q = new LinkedList<>();
        q.add(new long[]{s, Long.MAX_VALUE});
        while (!q.isEmpty()) {
            long[] curr = q.poll();
            int u = (int)curr[0]; long flow = curr[1];
            for (int v : adj.get(u)) {
                if (parent[v] == -1 && capacity[u][v] > 0) {
                    parent[v] = u;
                    long newFlow = Math.min(flow, capacity[u][v]);
                    if (v == t) return newFlow;
                    q.add(new long[]{v, newFlow});
                }
            }
        }
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt(); int m = sc.nextInt();
        long[][] capacity = new long[n][n];
        List<List<Integer>> adj = new ArrayList<>();
        for(int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for(int i = 0; i < m; i++) {
            int u = sc.nextInt(); int v = sc.nextInt(); long c = sc.nextLong();
            capacity[u][v] += c;
            adj.get(u).add(v); adj.get(v).add(u);
        }
        int s = sc.nextInt(); int t = sc.nextInt();
        long flow = 0; int[] parent = new int[n]; long newFlow;
        while ((newFlow = bfs(s, t, parent, capacity, adj)) != 0) {
            flow += newFlow; int curr = t;
            while (curr != s) {
                int prev = parent[curr];
                capacity[prev][curr] -= newFlow;
                capacity[curr][prev] += newFlow;
                curr = prev;
            }
        }
        System.out.print(flow);
    }
}`
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