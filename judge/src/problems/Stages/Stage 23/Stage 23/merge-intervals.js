/**
 * Merge Intervals - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of intervals
 *   Next n lines: Each line contains two integers start and end representing an interval
 *
 * Output format (stdout):
 *   Print the merged intervals in sorted order.
 *   Each interval should be printed on a new line as: start end
 */

module.exports = {
  id: 'merge-intervals',
  conquestId: 'stage23-6',
  title: 'Merge Intervals',
  difficulty: 'Medium',
  category: 'Intervals',
  tags: ['Array', 'Sorting', 'Intervals'],

  description: `
Given an array of **intervals** where **intervals[i] = [startᵢ, endᵢ]**, merge all overlapping intervals.

Return an array of the **non-overlapping intervals** that cover all the intervals in the input.

Approach:

1. **Sort intervals by start time**.
2. Iterate through the intervals:
   - If the current interval overlaps with the last merged interval, merge them.
   - Otherwise, add the interval to the result.

Two intervals **[a, b]** and **[c, d]** overlap if:

\`c ≤ b\`

Time Complexity: **O(n log n)** due to sorting.  
Space Complexity: **O(n)** for storing merged intervals.
`,

  examples: [
    {
      input: '4\n1 3\n2 6\n8 10\n15 18',
      output: '1 6\n8 10\n15 18',
      explanation: 'Intervals [1,3] and [2,6] overlap and are merged.'
    },
    {
      input: '2\n1 4\n4 5',
      output: '1 5',
      explanation: 'Intervals touching at the boundary are merged.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    '0 ≤ start ≤ end ≤ 10^9'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // TODO: Implement merge intervals logic
        return {};
    }
};

int main() {
    int n;
    cin >> n;

    vector<vector<int>> intervals(n, vector<int>(2));
    for (int i = 0; i < n; i++) {
        cin >> intervals[i][0] >> intervals[i][1];
    }

    Solution sol;
    vector<vector<int>> result = sol.merge(intervals);

    for (auto &it : result) {
        cout << it[0] << " " << it[1];
        if (&it != &result.back()) cout << "\\n";
    }

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public List<int[]> merge(int[][] intervals) {
            // TODO: Implement merge intervals logic
            return new ArrayList<>();
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[][] intervals = new int[n][2];

        for (int i = 0; i < n; i++) {
            intervals[i][0] = sc.nextInt();
            intervals[i][1] = sc.nextInt();
        }

        Solution sol = new Solution();
        List<int[]> result = sol.merge(intervals);

        for (int i = 0; i < result.size(); i++) {
            int[] it = result.get(i);
            System.out.print(it[0] + " " + it[1]);
            if (i != result.size() - 1) System.out.print("\\n");
        }

        sc.close();
    }
}`
  },

  testCases: [
    {
      input: '4\n1 3\n2 6\n8 10\n15 18',
      expected: '1 6\n8 10\n15 18'
    },
    {
      input: '2\n1 4\n4 5',
      expected: '1 5'
    },
    {
      input: '3\n1 2\n3 4\n5 6',
      expected: '1 2\n3 4\n5 6'
    },
    {
      input: '3\n1 5\n2 3\n4 8',
      expected: '1 8'
    },
    {
      input: '1\n5 7',
      expected: '5 7'
    },
    {
      input: '5\n1 4\n0 2\n3 5\n7 9\n8 10',
      expected: '0 5\n7 10'
    },
    {
      input: '4\n6 8\n1 9\n2 4\n4 7',
      expected: '1 9'
    },
    {
      input: '3\n1 10\n2 3\n4 5',
      expected: '1 10'
    },
    {
      input: '4\n1 3\n5 7\n2 4\n6 8',
      expected: '1 4\n5 8'
    },
    {
      input: '2\n0 0\n1 1',
      expected: '0 0\n1 1'
    }
  ],
};