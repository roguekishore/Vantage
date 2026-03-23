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
  conquestId: 'stage20-8',
  title: 'A* Pathfinding',
  difficulty: 'Hard',
  category: 'Graphs',
  tags: ['Graph', 'A*', 'Shortest Path', 'Grid', 'Heuristic'],

  description: `
Given a **grid-based map**, find the **shortest path** from a start cell to a target cell using the **A* (A-Star) Pathfinding Algorithm**.

Each cell can either be:
- **0** → Walkable
- **1** → Obstacle (cannot be passed)

Movement is allowed in **four directions**:
- Up
- Down
- Left
- Right

A* works by combining:
- **g(n)** → cost from start node to current node
- **h(n)** → heuristic estimate from current node to goal

The total cost is:

f(n) = g(n) + h(n)

For this problem, use the **Manhattan Distance heuristic**:

h(n) = |x₁ - x₂| + |y₁ - y₂|

Return the **length of the shortest path** from start to target.

If no path exists, return **-1**.

This algorithm is widely used in:
- Game AI navigation
- Robotics
- GPS route planning
`,

  examples: [
    {
      input: '3 3\n0 0 0\n0 1 0\n0 0 0\n0 0\n2 2',
      output: '4',
      explanation:
        'Shortest path from (0,0) to (2,2) avoiding obstacle has length 4.'
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

int aStar(vector<vector<int>>& grid, int sr, int sc, int tr, int tc) {
    // TODO: Implement A* pathfinding
    return -1;
}

int main() {
    int m, n;
    cin >> m >> n;

    vector<vector<int>> grid(m, vector<int>(n));

    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> grid[i][j];

    int sr, sc;
    cin >> sr >> sc;

    int tr, tc;
    cin >> tr >> tc;

    cout << aStar(grid, sr, sc, tr, tc);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static int aStar(int[][] grid, int sr, int sc, int tr, int tc) {
        // TODO: Implement A* pathfinding
        return -1;
    }

    public static void main(String[] args) {
        Scanner scn = new Scanner(System.in);

        int m = scn.nextInt();
        int n = scn.nextInt();

        int[][] grid = new int[m][n];

        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                grid[i][j] = scn.nextInt();

        int sr = scn.nextInt();
        int sc = scn.nextInt();

        int tr = scn.nextInt();
        int tc = scn.nextInt();

        System.out.print(aStar(grid, sr, sc, tr, tc));
    }
}`,
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