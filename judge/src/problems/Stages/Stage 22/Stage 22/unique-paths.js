/**
 * Unique Paths — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers m and n representing the number of rows and columns in the grid
 *
 * Output format (stdout):
 *   Print a single integer representing the number of unique paths from the
 *   top-left corner (0,0) to the bottom-right corner (m-1,n-1).
 */

module.exports = {
  id: 'unique-paths',
  conquestId: 'stage22-1',
  title: 'Unique Paths',
  difficulty: 'Medium',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Grid', 'Combinatorics'],

  description: `
You are given two integers **m** and **n** representing the number of rows and columns of a grid.

A robot starts at the **top-left corner** of the grid \`(0,0)\` and wants to reach the **bottom-right corner** \`(m-1,n-1)\`.

The robot can **only move either down or right at any point in time**.

Your task is to compute the **number of possible unique paths** the robot can take to reach the destination.

This problem demonstrates the **dynamic programming principle of optimal substructure**, where the number of ways to reach a cell depends on the number of ways to reach the cell above and the cell to the left.

The recurrence relation is:

- \`dp[i][j] = dp[i-1][j] + dp[i][j-1]\`

The first row and first column have exactly **1 path** because the robot can only move straight.
`,

  examples: [
    {
      input: '3 7',
      output: '28',
      explanation: 'There are 28 unique paths in a 3×7 grid.'
    },
    {
      input: '3 2',
      output: '3',
      explanation: 'Possible paths: Right→Down→Down, Down→Right→Down, Down→Down→Right.'
    },
    {
      input: '1 1',
      output: '1',
      explanation: 'Start and end are the same cell.'
    }
  ],

  constraints: [
    '1 ≤ m, n ≤ 100',
    'Answer fits within a 32-bit integer'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int uniquePaths(int m, int n) {
        // TODO: Implement dynamic programming solution
        return 0;
    }
};

int main() {
    int m, n;
    cin >> m >> n;

    Solution sol;
    cout << sol.uniquePaths(m, n);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public int uniquePaths(int m, int n) {
            // TODO: Implement dynamic programming solution
            return 0;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int m = sc.nextInt();
        int n = sc.nextInt();

        Solution sol = new Solution();
        System.out.print(sol.uniquePaths(m, n));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '3 7', expected: '28' },
    { input: '3 2', expected: '3' },
    { input: '7 3', expected: '28' },
    { input: '3 3', expected: '6' },
    { input: '1 1', expected: '1' },
    { input: '1 5', expected: '1' },
    { input: '5 1', expected: '1' },
    { input: '2 2', expected: '2' },
    { input: '10 10', expected: '48620' },
    { input: '5 7', expected: '210' }
  ],
};