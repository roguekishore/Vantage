/**
 * Rat in a Maze — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer n — size of the maze (n × n)
 *   Next n lines: n space-separated integers representing the maze
 *                 1 = open cell
 *                 0 = blocked cell
 *
 * Output format (stdout):
 *   Print "true" if there exists at least one path from the top-left corner
 *   (0,0) to the bottom-right corner (n-1,n-1).
 *   Otherwise print "false".
 */

module.exports = {
  id: 'rat-in-a-maze',
  conquestId: 'stage21-9',
  title: 'Rat in a Maze',
  difficulty: 'Medium',
  category: 'Recursion',
  tags: ['Recursion', 'Backtracking', 'Matrix', 'Pathfinding'],

  description: `
A rat is placed at the **top-left corner (0,0)** of an **n × n maze**.  
The rat must reach the **bottom-right corner (n-1,n-1)**.

The maze contains:
- **1 → Open cell (can move)**
- **0 → Blocked cell (cannot move)**

The rat can move in the following directions:
- **Right**
- **Down**
- **Left**
- **Up**

The rat **cannot move outside the maze** and **cannot visit the same cell twice in a path**.

Your task is to determine whether **at least one valid path exists** from start to destination.

This problem is commonly solved using **recursion and backtracking**, where the algorithm explores possible paths and backtracks when it encounters a dead end.
`,

  examples: [
    {
      input: '4\n1 0 0 0\n1 1 0 1\n0 1 0 0\n1 1 1 1',
      output: 'true',
      explanation: 'A valid path exists from (0,0) to (3,3).'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 20',
    'maze[i][j] ∈ {0,1}',
    'Start and destination cells may be either open or blocked'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

bool solveMaze(vector<vector<int>>& maze, vector<vector<bool>>& visited, int x, int y) {
    // TODO: Implement backtracking to check if path exists
    return false;
}

int main() {
    int n;
    cin >> n;

    vector<vector<int>> maze(n, vector<int>(n));
    for(int i = 0; i < n; i++)
        for(int j = 0; j < n; j++)
            cin >> maze[i][j];

    vector<vector<bool>> visited(n, vector<bool>(n, false));

    cout << (solveMaze(maze, visited, 0, 0) ? "true" : "false");

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static boolean solveMaze(int[][] maze, boolean[][] visited, int x, int y) {
        // TODO: Implement backtracking to check if path exists
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[][] maze = new int[n][n];
        for(int i = 0; i < n; i++)
            for(int j = 0; j < n; j++)
                maze[i][j] = sc.nextInt();

        boolean[][] visited = new boolean[n][n];

        System.out.print(solveMaze(maze, visited, 0, 0) ? "true" : "false");
    }
}`,
  },

  testCases: [
    { input: '1\n1', expected: 'true' },
    { input: '1\n0', expected: 'false' },
    {
      input: '2\n1 1\n0 1',
      expected: 'true'
    },
    {
      input: '2\n1 0\n0 1',
      expected: 'false'
    },
    {
      input: '3\n1 1 0\n0 1 0\n0 1 1',
      expected: 'true'
    },
    {
      input: '3\n1 0 0\n0 1 0\n0 0 1',
      expected: 'false'
    },
    {
      input: '4\n1 0 0 0\n1 1 0 1\n0 1 0 0\n1 1 1 1',
      expected: 'true'
    },
    {
      input: '4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1',
      expected: 'false'
    },
    {
      input: '5\n1 1 1 1 1\n0 0 1 0 1\n1 1 1 0 1\n1 0 0 1 1\n1 1 1 1 1',
      expected: 'true'
    }
  ],
};