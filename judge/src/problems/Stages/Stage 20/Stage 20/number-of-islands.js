/**
 * Number of Islands — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers m and n — number of rows and columns in the grid
 *   Next m lines: n space-separated integers (0 or 1) representing the grid
 *                 1 = land, 0 = water
 *
 * Output format (stdout):
 *   Print a single integer — the total number of islands in the grid
 */

module.exports = {
  id: 'number-of-islands',
  conquestId: 'stage20-3',
  title: 'Number of Islands',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'DFS', 'BFS', 'Grid'],

  description: `
You are given a **2D grid** of size **m × n** consisting of **'1's (land)** and **'0's (water)**.

An **island** is formed by connecting adjacent lands **horizontally or vertically** (not diagonally).

Your task is to **count the number of islands** in the grid.

You may explore the grid using either **Depth First Search (DFS)** or **Breadth First Search (BFS)**.

**Key idea:**
- Traverse the grid.
- When you find an unvisited land cell ('1'), start a DFS/BFS.
- Mark all connected land cells as visited.
- Increase the island count.
- Continue until the grid is fully explored.

This is a classic **graph traversal on a grid** problem.
`,

  examples: [
    {
      input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1',
      output: '3',
      explanation: 'There are three separate islands in the grid.'
    }
  ],

  constraints: [
    '1 ≤ m, n ≤ 300',
    'grid[i][j] is either 0 or 1'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

void dfs(int r, int c, vector<vector<int>>& grid, int m, int n) {
    // TODO: Implement DFS to mark connected land
}

int numIslands(vector<vector<int>>& grid) {
    int m = grid.size();
    int n = grid[0].size();
    
    // TODO: Count islands using DFS/BFS
    return 0;
}

int main() {
    int m, n;
    cin >> m >> n;

    vector<vector<int>> grid(m, vector<int>(n));

    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> grid[i][j];

    cout << numIslands(grid);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static void dfs(int r, int c, int[][] grid, int m, int n) {
        // TODO: Implement DFS to mark connected land
    }

    static int numIslands(int[][] grid) {
        int m = grid.length;
        int n = grid[0].length;

        // TODO: Count islands using DFS/BFS
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int m = sc.nextInt();
        int n = sc.nextInt();

        int[][] grid = new int[m][n];

        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                grid[i][j] = sc.nextInt();

        System.out.print(numIslands(grid));
    }
}`,
  },

  testCases: [
    {
      input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1',
      expected: '3'
    },
    {
      input: '3 3\n1 1 1\n0 1 0\n1 1 1',
      expected: '1'
    },
    {
      input: '3 3\n1 0 1\n0 0 0\n1 0 1',
      expected: '4'
    },
    {
      input: '2 2\n1 1\n1 1',
      expected: '1'
    },
    {
      input: '2 2\n0 0\n0 0',
      expected: '0'
    },
    {
      input: '1 5\n1 0 1 0 1',
      expected: '3'
    },
    {
      input: '5 1\n1\n0\n1\n0\n1',
      expected: '3'
    },
    {
      input: '3 4\n1 1 0 1\n0 1 0 0\n1 0 1 1',
      expected: '4'
    },
    {
      input: '1 1\n1',
      expected: '1'
    }
  ],
};