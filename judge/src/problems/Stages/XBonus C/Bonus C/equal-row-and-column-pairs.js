/**
 * Equal Row and Column Pairs — Problem Definition
 *
 * Input format (stdin):
 *   First line: integer n (size of the grid)
 *   Next n lines: n space-separated integers representing the grid
 *
 * Output format (stdout):
 *   Print the number of pairs (ri, cj) such that row i and column j are identical.
 */

module.exports = {
  id: 'equal-row-and-column-pairs',
  conquestId: 'bonusA-12',
  title: 'Equal Row and Column Pairs',
  difficulty: 'Medium',
  category: 'Matrix',
  tags: ['Matrix', 'Hash Map', 'Array'],

  description: `Given a **0-indexed n × n integer matrix grid**, return the number of pairs **(ri, cj)** such that **row ri** and **column cj** are equal.

Two sequences are considered equal if they contain the same elements in the same order.

Efficient approach:

1. Convert each **row** into a string (or tuple representation).
2. Store the frequency of each row pattern in a **HashMap**.
3. For each **column**, build its sequence.
4. Check if this sequence exists in the row map.
5. If it does, add the stored frequency to the result.

This reduces the time complexity to **O(n²)** instead of comparing every row-column pair directly.`,

  examples: [
    {
      input: `3
3 2 1
1 7 6
2 7 7`,
      output: '1',
      explanation: 'Row 2 equals Column 1 → [2,7,7]',
    },
    {
      input: `4
3 1 2 2
1 4 4 5
2 4 2 2
2 4 2 2`,
      output: '3',
      explanation: 'Multiple rows match column patterns.',
    },
  ],

  constraints: [
    '1 ≤ n ≤ 200',
    '1 ≤ grid[i][j] ≤ 10^5',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int equalPairs(vector<vector<int>>& grid) {
    // TODO: Implement your solution here
    return 0;
}

int main() {
    int n;
    cin >> n;

    vector<vector<int>> grid(n, vector<int>(n));
    for(int i = 0; i < n; i++) {
        for(int j = 0; j < n; j++) {
            cin >> grid[i][j];
        }
    }

    cout << equalPairs(grid);
    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static int equalPairs(int[][] grid) {
        // TODO: Implement your solution here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[][] grid = new int[n][n];

        for(int i = 0; i < n; i++) {
            for(int j = 0; j < n; j++) {
                grid[i][j] = sc.nextInt();
            }
        }

        System.out.print(equalPairs(grid));
    }
}
`,
  },

  testCases: [
    {
      input: `1
5`,
      expected: '1',
    },
    {
      input: `3
3 2 1
1 7 6
2 7 7`,
      expected: '1',
    },
    {
      input: `4
3 1 2 2
1 4 4 5
2 4 2 2
2 4 2 2`,
      expected: '3',
    },
  ],
};