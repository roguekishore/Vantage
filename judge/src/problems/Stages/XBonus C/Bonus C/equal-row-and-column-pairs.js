/**
 * Equal Row and Column Pairs - Problem Definition
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
  conquestId: 'bonusC-1',
  title: 'Prophecy Grid Alignment',
  difficulty: 'Medium',
  category: 'Matrix',
  tags: ['Matrix', 'Hash Map', 'Array'],
  storyBriefing: `
In the Divination classroom, you are tasked with interpreting a "Prophecy Grid." This magical grid reveals glimpses of the future, but only when its internal symmetries are understood.

An alignment occurs when a row's sequence of symbols is identical to a column's sequence. Each such alignment strengthens the clarity of the prophecy. Your task is to count how many such alignments exist in a given grid to determine the prophecy's overall power.
`,
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
    cpp: `#include <iostream>
#include <vector>
#include <map>

using namespace std;

int equalPairs(vector<vector<int>>& grid) {
    int n = grid.size();
    int count = 0;
    map<vector<int>, int> row_counts;

    for (int i = 0; i < n; ++i) {
        row_counts[grid[i]]++;
    }

    for (int j = 0; j < n; ++j) {
        vector<int> col;
        for (int i = 0; i < n; ++i) {
            col.push_back(grid[i][j]);
        }
        if (row_counts.count(col)) {
            count += row_counts[col];
        }
    }

    return count;
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
}`,
    java: `import java.util.*;

public class Main {
    public static int equalPairs(int[][] grid) {
        int n = grid.length;
        int count = 0;
        Map<String, Integer> rowCounts = new HashMap<>();

        for (int[] row : grid) {
            StringBuilder sb = new StringBuilder();
            for (int num : row) {
                sb.append(num).append(",");
            }
            String rowStr = sb.toString();
            rowCounts.put(rowStr, rowCounts.getOrDefault(rowStr, 0) + 1);
        }

        for (int j = 0; j < n; j++) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                sb.append(grid[i][j]).append(",");
            }
            String colStr = sb.toString();
            if (rowCounts.containsKey(colStr)) {
                count += rowCounts.get(colStr);
            }
        }

        return count;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] grid = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                grid[i][j] = sc.nextInt();
            }
        }
        System.out.println(equalPairs(grid));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <map>

using namespace std;

int equalPairs(vector<vector<int>>& grid) {
    int n = grid.size();
    int count = 0;
    map<vector<int>, int> row_counts;

    for (int i = 0; i < n; ++i) {
        row_counts[grid[i]]++;
    }

    for (int j = 0; j < n; ++j) {
        vector<int> col;
        for (int i = 0; i < n; ++i) {
            col.push_back(grid[i][j]);
        }
        if (row_counts.count(col)) {
            count += row_counts[col];
        }
    }

    return count;
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
}`,
    java: `import java.util.*;

public class Main {
    public static int equalPairs(int[][] grid) {
        int n = grid.length;
        int count = 0;
        Map<String, Integer> rowCounts = new HashMap<>();

        for (int[] row : grid) {
            StringBuilder sb = new StringBuilder();
            for (int num : row) {
                sb.append(num).append(",");
            }
            String rowStr = sb.toString();
            rowCounts.put(rowStr, rowCounts.getOrDefault(rowStr, 0) + 1);
        }

        for (int j = 0; j < n; j++) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                sb.append(grid[i][j]).append(",");
            }
            String colStr = sb.toString();
            if (rowCounts.containsKey(colStr)) {
                count += rowCounts.get(colStr);
            }
        }

        return count;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] grid = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                grid[i][j] = sc.nextInt();
            }
        }
        System.out.println(equalPairs(grid));
    }
}`,
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