/**
 * A* Pathfinding - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers m and n - number of rows and columns in the grid
 *   Next m lines: n space-separated integers representing the grid
 *                 0 = walkable cell
 *                 1 = obstacle
 *   Next line: Two integers sr sc - start cell
 *   Next line: Two integers tr tc - target cell
 *
 * Output format (stdout):
 *   Print a single integer - the length of the shortest path from start to target.
 *   If the target cannot be reached, print -1.
 */

module.exports = {
  id: 'a-star-pathfinding',
  conquestId: 's20-p08',
  title: 'A* Path to the Chamber',
  difficulty: 'Hard',
  category: 'Graphs',
  tags: ['Graph', 'A*', 'Shortest Path', 'Grid', 'Heuristic', 'Hogwarts'],

  storyBriefing: `
"We have to get to the Chamber entrance, and we have to do it fast," Harry says, checking the map. "But there are obstacles everywhere, and we can't afford to take the long way around."

To find the most efficient path, you'll use the **A* (A-Star) Algorithm**. By using a heuristic (Manhattan Distance) to estimate the remaining distance to the goal, you can navigate the grid and reach your target in the shortest time possible.
`,

  description: `
Given a **grid-based map**, find the **shortest path** from a start cell to a target cell using the **A* (A-Star) Pathfinding Algorithm**.

Each cell can either be:
- **0** → Walkable
- **1** → Obstacle (cannot be passed)

Movement is allowed in **four directions** (Up, Down, Left, Right).

A* works by combining:
- **g(n)** → cost from start node to current node
- **h(n)** → heuristic estimate from current node to goal

The total cost is: **f(n) = g(n) + h(n)**.
For this problem, use the **Manhattan Distance heuristic**: **h(n) = |x₁ - x₂| + |y₁ - y₂|**.

Return the **length of the shortest path** from start to target. If no path exists, return **-1**.
`,

  examples: [
    {
      input: '3 3\n0 0 0\n0 1 0\n0 0 0\n0 0\n2 2',
      output: '4',
      explanation: 'Shortest path from (0,0) to (2,2) avoiding the obstacle at (1,1) has length 4.'
    }
  ],

  constraints: [
    '1 ≤ m, n ≤ 200',
    'grid[i][j] is either 0 or 1',
    '0 ≤ sr, tr < m',
    '0 ≤ sc, tc < n'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <cmath>

using namespace std;

struct Node {
    int r, c, g, h;
    bool operator>(const Node& other) const {
        return (g + h) > (other.g + other.h);
    }
};

int aStar(vector<vector<int>>& grid, int sr, int sc, int tr, int tc) {
    int m = grid.size();
    int n = grid[0].size();
    if (grid[sr][sc] == 1 || grid[tr][tc] == 1) return -1;
    
    priority_queue<Node, vector<Node>, greater<Node>> pq;
    vector<vector<int>> dist(m, vector<int>(n, 1e9));

    auto getH = [&](int r, int c) {
        return abs(r - tr) + abs(c - tc);
    };

    dist[sr][sc] = 0;
    pq.push({sr, sc, 0, getH(sr, sc)});

    int dr[] = {0, 0, 1, -1};
    int dc[] = {1, -1, 0, 0};

    while (!pq.empty()) {
        Node curr = pq.top();
        pq.pop();

        if (curr.r == tr && curr.c == tc) return curr.g;
        if (curr.g > dist[curr.r][curr.c]) continue;

        for (int i = 0; i < 4; i++) {
            int nr = curr.r + dr[i];
            int nc = curr.c + dc[i];

            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                if (dist[curr.r][curr.c] + 1 < dist[nr][nc]) {
                    dist[nr][nc] = dist[curr.r][curr.c] + 1;
                    pq.push({nr, nc, dist[nr][nc], getH(nr, nc)});
                }
            }
        }
    }
    return -1;
}

int main() {
    int m, n;
    if (!(cin >> m >> n)) return 0;

    vector<vector<int>> grid(m, vector<int>(n));
    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> grid[i][j];

    int sr, sc, tr, tc;
    cin >> sr >> sc >> tr >> tc;

    cout << aStar(grid, sr, sc, tr, tc) << endl;
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static class Node implements Comparable<Node> {
        int r, c, g, h;
        Node(int r, int c, int g, int h) {
            this.r = r; this.c = c; this.g = g; this.h = h;
        }
        public int compareTo(Node other) {
            return (this.g + this.h) - (other.g + other.h);
        }
    }

    static int aStar(int[][] grid, int sr, int sc, int tr, int tc) {
        int m = grid.length, n = grid[0].length;
        if (grid[sr][sc] == 1 || grid[tr][tc] == 1) return -1;

        PriorityQueue<Node> pq = new PriorityQueue<>();
        int[][] dist = new int[m][n];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);

        dist[sr][sc] = 0;
        int h0 = Math.abs(sr - tr) + Math.abs(sc - tc);
        pq.add(new Node(sr, sc, 0, h0));

        int[] dr = {0, 0, 1, -1};
        int[] dc = {1, -1, 0, 0};

        while (!pq.isEmpty()) {
            Node curr = pq.poll();
            if (curr.r == tr && curr.c == tc) return curr.g;
            if (curr.g > dist[curr.r][curr.c]) continue;

            for (int i = 0; i < 4; i++) {
                int nr = curr.r + dr[i], nc = curr.c + dc[i];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                    if (dist[curr.r][curr.c] + 1 < dist[nr][nc]) {
                        dist[nr][nc] = dist[curr.r][curr.c] + 1;
                        int hVal = Math.abs(nr - tr) + Math.abs(nc - tc);
                        pq.add(new Node(nr, nc, dist[nr][nc], hVal));
                    }
                }
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        Scanner scn = new Scanner(System.in);
        if (!scn.hasNextInt()) return;
        int m = scn.nextInt(), n = scn.nextInt();
        int[][] grid = new int[m][n];
        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                grid[i][j] = scn.nextInt();
        int sr = scn.nextInt(), scCol = scn.nextInt();
        int tr = scn.nextInt(), tc = scn.nextInt();
        System.out.println(aStar(grid, sr, scCol, tr, tc));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <queue>
#include <cmath>

using namespace std;

struct Node {
    int r, c, g, h;
    bool operator>(const Node& other) const {
        return (g + h) > (other.g + other.h);
    }
};

int main() {
    int m, n;
    if (!(cin >> m >> n)) return 0;
    vector<vector<int>> grid(m, vector<int>(n));
    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> grid[i][j];
    int sr, sc, tr, tc;
    cin >> sr >> sc >> tr >> tc;

    if (sr == tr && sc == tc) { cout << 0; return 0; }
    if (grid[sr][sc] == 1 || grid[tr][tc] == 1) { cout << -1; return 0; }

    priority_queue<Node, vector<Node>, greater<Node>> pq;
    vector<vector<int>> dist(m, vector<int>(n, 1e9));

    dist[sr][sc] = 0;
    pq.push({sr, sc, 0, abs(sr - tr) + abs(sc - tc)});

    int dr[] = {0, 0, 1, -1};
    int dc[] = {1, -1, 0, 0};

    while (!pq.empty()) {
        Node curr = pq.top();
        pq.pop();
        if (curr.r == tr && curr.c == tc) { cout << curr.g; return 0; }
        if (curr.g > dist[curr.r][curr.c]) continue;
        for (int i = 0; i < 4; i++) {
            int nr = curr.r + dr[i], nc = curr.c + dc[i];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                if (dist[curr.r][curr.c] + 1 < dist[nr][nc]) {
                    dist[nr][nc] = dist[curr.r][curr.c] + 1;
                    pq.push({nr, nc, dist[nr][nc], abs(nr - tr) + abs(nc - tc)});
                }
            }
        }
    }
    cout << -1;
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static class Node implements Comparable<Node> {
        int r, c, g, h;
        Node(int r, int c, int g, int h) { this.r = r; this.c = c; this.g = g; this.h = h; }
        public int compareTo(Node o) { return (this.g + this.h) - (o.g + o.h); }
    }

    public static void main(String[] args) {
        Scanner scn = new Scanner(System.in);
        if (!scn.hasNextInt()) return;
        int m = scn.nextInt(), n = scn.nextInt();
        int[][] grid = new int[m][n];
        for(int i = 0; i < m; i++) for(int j = 0; j < n; j++) grid[i][j] = scn.nextInt();
        int sr = scn.nextInt(), sc = scn.nextInt(), tr = scn.nextInt(), tc = scn.nextInt();
        if (sr == tr && sc == tc) { System.out.print(0); return; }
        if (grid[sr][sc] == 1 || grid[tr][tc] == 1) { System.out.print(-1); return; }
        PriorityQueue<Node> pq = new PriorityQueue<>();
        int[][] dist = new int[m][n];
        for (int[] r : dist) Arrays.fill(r, Integer.MAX_VALUE);
        dist[sr][sc] = 0;
        pq.add(new Node(sr, sc, 0, Math.abs(sr - tr) + Math.abs(sc - tc)));
        int[] dr = {0, 0, 1, -1}, dc = {1, -1, 0, 0};
        while (!pq.isEmpty()) {
            Node curr = pq.poll();
            if (curr.r == tr && curr.c == tc) { System.out.print(curr.g); return; }
            if (curr.g > dist[curr.r][curr.c]) continue;
            for (int i = 0; i < 4; i++) {
                int nr = curr.r + dr[i], nc = curr.c + dc[i];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                    if (dist[curr.r][curr.c] + 1 < dist[nr][nc]) {
                        dist[nr][nc] = dist[curr.r][curr.c] + 1;
                        pq.add(new Node(nr, nc, dist[nr][nc], Math.abs(nr - tr) + Math.abs(nc - tc)));
                    }
                }
            }
        }
        System.out.print(-1);
    }
}`
  },

  testCases: [
    {
      input: '3 3\n0 0 0\n0 1 0\n0 0 0\n0 0\n2 2',
      expected: '4'
    },
    {
      input: '2 2\n0 0\n0 0\n0 0\n1 1',
      expected: '2'
    },
    {
      input: '3 3\n0 1 0\n0 1 0\n0 0 0\n0 0\n2 2',
      expected: '4'
    },
    {
      input: '3 3\n0 1 0\n1 1 0\n0 0 0\n0 0\n2 2',
      expected: '-1'
    },
    {
      input: '1 5\n0 0 0 0 0\n0 0\n0 4',
      expected: '4'
    },
    {
      input: '4 4\n0 0 0 0\n0 1 1 0\n0 0 0 0\n0 1 0 0\n0 0\n3 3',
      expected: '6'
    },
    {
      input: '3 4\n0 0 0 0\n1 1 0 1\n0 0 0 0\n0 0\n2 3',
      expected: '5'
    },
    {
      input: '1 1\n0\n0 0\n0 0',
      expected: '0'
    },
    {
      input: '2 3\n0 1 0\n0 0 0\n0 0\n1 2',
      expected: '3'
    }
  ],
};