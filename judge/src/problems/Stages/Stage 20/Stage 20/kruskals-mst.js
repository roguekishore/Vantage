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
  conquestId: 's20-p07',
  title: "Kruskal's House Cup Bridge",
  difficulty: 'Hard',
  category: 'Graphs',
  tags: ['Graph', 'MST', 'Kruskal', 'Union Find', 'Greedy', 'Hogwarts'],

  storyBriefing: `
"The Great Hall needs a new set of magical bridges to connect the House tables," Professor Flitwick announces. "But magic is expensive! We must connect all tables with the minimum total cost of magical energy possible, ensuring there are no redundant loops."

Using **Kruskal's Algorithm** and a **Disjoint Set Union (DSU)**, find the Minimum Spanning Tree (MST) of the connections between the house tables.
`,

  description: `
Given a **connected, undirected, weighted graph**, compute the **total weight of its Minimum Spanning Tree (MST)** using **Kruskal’s Algorithm**.

A **Minimum Spanning Tree** is a subset of edges that:
- Connects all vertices in the graph
- Contains **exactly (n − 1) edges**
- Has the **minimized possible total edge weight**
- Contains **no cycles**

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

struct DSU {
    vector<int> parent;
    DSU(int n) {
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]);
    }
    bool unite(int i, int j) {
        int root_i = find(i);
        int root_j = find(j);
        if (root_i != root_j) {
            parent[root_i] = root_j;
            return true;
        }
        return false;
    }
};

long long kruskal(int n, vector<Edge>& edges) {
    sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) {
        return a.w < b.w;
    });

    DSU dsu(n);
    long long mst_weight = 0;
    int edges_count = 0;

    for (const auto& edge : edges) {
        if (dsu.unite(edge.u, edge.v)) {
            mst_weight += edge.w;
            edges_count++;
            if (edges_count == n - 1) break;
        }
    }
    return mst_weight;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<Edge> edges(m);
    for(int i = 0; i < m; i++) {
        cin >> edges[i].u >> edges[i].v >> edges[i].w;
    }

    cout << kruskal(n, edges) << endl;

    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static class Edge {
        int u, v;
        long w;
        Edge(int u, int v, long w) { this.u = u; this.v = v; this.w = w; }
    }

    static class DSU {
        int[] parent;
        DSU(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int i) {
            if (parent[i] == i) return i;
            return parent[i] = find(parent[i]);
        }
        boolean unite(int i, int j) {
            int root_i = find(i);
            int root_j = find(j);
            if (root_i != root_j) {
                parent[root_i] = root_j;
                return true;
            }
            return false;
        }
    }

    static long kruskal(int n, List<Edge> edges) {
        edges.sort((a, b) -> Long.compare(a.w, b.w));
        DSU dsu = new DSU(n);
        long mstWeight = 0;
        int edgesCount = 0;

        for (Edge edge : edges) {
            if (dsu.unite(edge.u, edge.v)) {
                mstWeight += edge.w;
                edgesCount++;
                if (edgesCount == n - 1) break;
            }
        }
        return mstWeight;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int n = sc.nextInt();
        int m = sc.nextInt();

        List<Edge> edges = new ArrayList<>();
        for(int i = 0; i < m; i++) {
            edges.add(new Edge(sc.nextInt(), sc.nextInt(), sc.nextLong()));
        }

        System.out.println(kruskal(n, edges));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

struct Edge {
    int u, v;
    long long w;
};

struct DSU {
    vector<int> parent;
    DSU(int n) {
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]);
    }
    bool unite(int i, int j) {
        int root_i = find(i);
        int root_j = find(j);
        if (root_i != root_j) {
            parent[root_i] = root_j;
            return true;
        }
        return false;
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<Edge> edges(m);
    for(int i = 0; i < m; i++) cin >> edges[i].u >> edges[i].v >> edges[i].w;
    sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) { return a.w < b.w; });
    DSU dsu(n);
    long long mst_weight = 0;
    int count = 0;
    for (const auto& e : edges) {
        if (dsu.unite(e.u, e.v)) {
            mst_weight += e.w;
            count++;
            if (count == n - 1) break;
        }
    }
    cout << mst_weight;
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static class Edge {
        int u, v;
        long w;
        Edge(int u, int v, long w) { this.u = u; this.v = v; this.w = w; }
    }
    static class DSU {
        int[] parent;
        DSU(int n) {
            parent = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }
        int find(int i) {
            if (parent[i] == i) return i;
            return parent[i] = find(parent[i]);
        }
        boolean unite(int i, int j) {
            int root_i = find(i);
            int root_j = find(j);
            if (root_i != root_j) {
                parent[root_i] = root_j;
                return true;
            }
            return false;
        }
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int m = sc.nextInt();
        List<Edge> edges = new ArrayList<>();
        for(int i = 0; i < m; i++) edges.add(new Edge(sc.nextInt(), sc.nextInt(), sc.nextLong()));
        edges.sort((a, b) -> Long.compare(a.w, b.w));
        DSU dsu = new DSU(n);
        long mstWeight = 0;
        int count = 0;
        for (Edge e : edges) {
            if (dsu.unite(e.u, e.v)) {
                mstWeight += e.w;
                count++;
                if (count == n - 1) break;
            }
        }
        System.out.print(mstWeight);
    }
}`
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