/**
 * Dijkstra's Algorithm - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and m - number of vertices and edges
 *   Next m lines: Three integers u v w representing an edge from u to v with weight w
 *   Last line: Integer s - source vertex
 *
 * Output format (stdout):
 *   Print n space-separated integers representing the shortest distance from
 *   the source vertex s to every vertex from 0 to n-1.
 *   If a vertex is unreachable, print -1 for that vertex.
 */

module.exports = {
  id: 'dijkstras-algorithm',
  conquestId: 's20-p05',
  title: "Dijkstra's Marauder Map",
  difficulty: 'Hard',
  category: 'Graphs',
  tags: ['Graph', 'Shortest Path', 'Dijkstra', 'Priority Queue', 'Hogwarts'],

  storyBriefing: `
"The map isn't just about where people are," George explains, tapping the parchment with his wand. "It's about the fastest way to get there without being spotted by Filch."

Using **Dijkstra's Algorithm**, calculate the shortest distance from your current location to every other point in the castle. The weighted edges represent the time or risk involved in traveling between different locations.
`,

  description: `
Given a **weighted directed graph**, compute the **shortest distance from a source node to all other nodes** using **Dijkstra's Algorithm**.

Dijkstra’s algorithm works for graphs with **non-negative edge weights**.

**Algorithm idea:**
- Use a **priority queue (min heap)**.
- Start from the source node with distance 0.
- Repeatedly pick the node with the smallest known distance.
- Relax its edges and update distances if a shorter path is found.

If a node cannot be reached from the source, its distance should be **-1** in the output.
`,

  examples: [
    {
      input: '5 6\n0 1 2\n0 2 4\n1 2 1\n1 3 7\n2 4 3\n3 4 1\n0',
      output: '0 2 3 9 6',
      explanation: 'Shortest paths from node 0 are computed using Dijkstra.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    '0 ≤ m ≤ 2×10^5',
    '0 ≤ u, v < n',
    '0 ≤ w ≤ 10^9',
    '0 ≤ s < n'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <limits>

using namespace std;

const long long INF = 1e18;

vector<long long> dijkstra(int n, vector<vector<pair<int, int>>>& adj, int s) {
    vector<long long> dist(n, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;

    dist[s] = 0;
    pq.push({0, s});

    while (!pq.empty()) {
        long long d = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        if (d > dist[u]) continue;

        for (auto& edge : adj[u]) {
            int v = edge.first;
            int w = edge.second;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }

    for (int i = 0; i < n; i++) {
        if (dist[i] == INF) dist[i] = -1;
    }
    return dist;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<vector<pair<int, int>>> adj(n);
    for (int i = 0; i < m; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
    }

    int s;
    cin >> s;

    vector<long long> dist = dijkstra(n, adj, s);
    for (int i = 0; i < n; i++) {
        cout << dist[i] << (i == n - 1 ? "" : " ");
    }
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static class Node implements Comparable<Node> {
        int u;
        long d;
        Node(int u, long d) { this.u = u; this.d = d; }
        public int compareTo(Node other) { return Long.compare(this.d, other.d); }
    }

    static long[] dijkstra(int n, List<List<int[]>> adj, int s) {
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        PriorityQueue<Node> pq = new PriorityQueue<>();

        dist[s] = 0;
        pq.add(new Node(s, 0));

        while (!pq.isEmpty()) {
            Node curr = pq.poll();
            int u = curr.u;
            long d = curr.d;

            if (d > dist[u]) continue;

            for (int[] edge : adj.get(u)) {
                int v = edge[0];
                int w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.add(new Node(v, dist[v]));
                }
            }
        }

        for (int i = 0; i < n; i++) {
            if (dist[i] == Long.MAX_VALUE) dist[i] = -1;
        }
        return dist;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

        for (int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            int w = sc.nextInt();
            adj.get(u).add(new int[]{v, w});
        }

        int s = sc.nextInt();
        long[] dist = dijkstra(n, adj, s);

        for (int i = 0; i < n; i++) {
            System.out.print(dist[i] + (i == n - 1 ? "" : " "));
        }
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <limits>

using namespace std;

const long long INF = 1e18;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<vector<pair<int, int>>> adj(n);
    for (int i = 0; i < m; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
    }

    int s;
    cin >> s;

    vector<long long> dist(n, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;

    dist[s] = 0;
    pq.push({0, s});

    while (!pq.empty()) {
        long long d = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        if (d > dist[u]) continue;

        for (auto& edge : adj[u]) {
            int v = edge.first;
            int w = edge.second;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }

    for (int i = 0; i < n; i++) {
        cout << (dist[i] == INF ? -1 : dist[i]) << (i == n - 1 ? "" : " ");
    }
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static class Node implements Comparable<Node> {
        int u;
        long d;
        Node(int u, long d) { this.u = u; this.d = d; }
        public int compareTo(Node other) { return Long.compare(this.d, other.d); }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

        for (int i = 0; i < m; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            int w = sc.nextInt();
            adj.get(u).add(new int[]{v, w});
        }

        int s = sc.nextInt();
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        PriorityQueue<Node> pq = new PriorityQueue<>();

        dist[s] = 0;
        pq.add(new Node(s, 0));

        while (!pq.isEmpty()) {
            Node curr = pq.poll();
            int u = curr.u;
            long d = curr.d;

            if (d > dist[u]) continue;

            for (int[] edge : adj.get(u)) {
                int v = edge[0];
                int w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.add(new Node(v, dist[v]));
                }
            }
        }

        for (int i = 0; i < n; i++) {
            System.out.print((dist[i] == Long.MAX_VALUE ? -1 : dist[i]) + (i == n - 1 ? "" : " "));
        }
    }
}`
  },

  testCases: [
    {
      input: '5 6\n0 1 2\n0 2 4\n1 2 1\n1 3 7\n2 4 3\n3 4 1\n0',
      expected: '0 2 3 9 6'
    },
    {
      input: '4 4\n0 1 5\n1 2 3\n2 3 1\n0 3 10\n0',
      expected: '0 5 8 9'
    },
    {
      input: '3 1\n0 1 7\n0',
      expected: '0 7 -1'
    },
    {
      input: '3 3\n0 1 2\n0 2 5\n1 2 1\n0',
      expected: '0 2 3'
    },
    {
      input: '2 0\n0',
      expected: '0 -1'
    },
    {
      input: '1 0\n0',
      expected: '0'
    },
    {
      input: '4 2\n0 1 4\n2 3 5\n0',
      expected: '0 4 -1 -1'
    },
    {
      input: '5 7\n0 1 10\n0 2 3\n1 2 1\n2 1 4\n2 3 2\n1 3 2\n3 4 7\n0',
      expected: '0 7 3 5 12'
    },
    {
      input: '4 5\n0 1 1\n0 2 7\n1 2 2\n1 3 6\n2 3 3\n0',
      expected: '0 1 3 6'
    }
  ],
};