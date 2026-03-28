/**
 * Number of Islands - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers m and n - number of rows and columns in the grid
 *   Next m lines: n space-separated integers (0 or 1) representing the grid
 *                 1 = land, 0 = water
 *
 * Output format (stdout):
 *   Print a single integer - the total number of islands in the grid
 */

module.exports = {
  id: 'number-of-islands',
  conquestId: 's20-p03',
  title: 'Islands of the Underground Lake',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'DFS', 'BFS', 'Grid', 'Hogwarts'],

  storyBriefing: `
The tunnels have led you to a massive underground lake. Small rocky outcroppings—islands—dot the dark expanse. "We need to count how many separate islands there are," Harry says, looking at the water where the Basilisk might be hiding. "Each one could be a clue to the entrance."

Given a grid representing the lake, identify and count the number of distinct islands.
`,

  description: `
You are given a **2D grid** of size **m × n** consisting of **'1's (land)** and **'0's (water)**.

An **island** is formed by connecting adjacent lands **horizontally or vertically** (not diagonally).

Your task is to **count the number of islands** in the grid.

**Key idea:**
- Traverse the grid.
- When you find an unvisited land cell ('1'), start a DFS/BFS.
- Mark all connected land cells as visited.
- Increase the island count.
`,

  examples: [
    {
      input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1',
      output: '3',
      explanation: 'There are three separate islands: one at the top-left, one in the middle, and one at the bottom-right.'
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
    if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == 0) return;
    
    grid[r][c] = 0; // Mark as visited
    dfs(r+1, c, grid, m, n);
    dfs(r-1, c, grid, m, n);
    dfs(r, c+1, grid, m, n);
    dfs(r, c-1, grid, m, n);
}

int numIslands(vector<vector<int>>& grid) {
    if (grid.empty()) return 0;
    int m = grid.size();
    int n = grid[0].size();
    int count = 0;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) {
                count++;
                dfs(i, j, grid, m, n);
            }
        }
    }
    return count;
}

int main() {
    int m, n;
    if (!(cin >> m >> n)) return 0;

    vector<vector<int>> grid(m, vector<int>(n));
    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> grid[i][j];

    cout << numIslands(grid) << endl;

    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static void dfs(int r, int c, int[][] grid, int m, int n) {
        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == 0) return;
        
        grid[r][c] = 0;
        dfs(r+1, c, grid, m, n);
        dfs(r-1, c, grid, m, n);
        dfs(r, c+1, grid, m, n);
        dfs(r, c-1, grid, m, n);
    }

    static int numIslands(int[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length;
        int n = grid[0].length;
        int count = 0;

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 1) {
                    count++;
                    dfs(i, j, grid, m, n);
                }
            }
        }
        return count;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int m = sc.nextInt();
        int n = sc.nextInt();

        int[][] grid = new int[m][n];
        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                grid[i][j] = sc.nextInt();

        System.out.println(numIslands(grid));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>

using namespace std;

void dfs(int r, int c, vector<vector<int>>& grid, int m, int n) {
    if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == 0) return;
    
    grid[r][c] = 0;
    dfs(r+1, c, grid, m, n);
    dfs(r-1, c, grid, m, n);
    dfs(r, c+1, grid, m, n);
    dfs(r, c-1, grid, m, n);
}

int numIslands(vector<vector<int>>& grid) {
    if (grid.empty()) return 0;
    int m = grid.size();
    int n = grid[0].size();
    int count = 0;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) {
                count++;
                dfs(i, j, grid, m, n);
            }
        }
    }
    return count;
}

int main() {
    int m, n;
    if (!(cin >> m >> n)) return 0;

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
        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] == 0) return;
        
        grid[r][c] = 0;
        dfs(r+1, c, grid, m, n);
        dfs(r-1, c, grid, m, n);
        dfs(r, c+1, grid, m, n);
        dfs(r, c-1, grid, m, n);
    }

    static int numIslands(int[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int m = grid.length;
        int n = grid[0].length;
        int count = 0;

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 1) {
                    count++;
                    dfs(i, j, grid, m, n);
                }
            }
        }
        return count;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int m = sc.nextInt();
        int n = sc.nextInt();

        int[][] grid = new int[m][n];
        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                grid[i][j] = sc.nextInt();

        System.out.print(numIslands(grid));
    }
}`
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