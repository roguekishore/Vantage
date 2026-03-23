/**
 * Burst Balloons (Top Down) - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of balloons
 *   Line 2: n space-separated integers representing the balloon values
 *
 * Output format (stdout):
 *   Print a single integer representing the maximum coins that can be collected.
 */

module.exports = {
  id: 'burst-balloons-top-down',
  conquestId: 'stage22-8',
  title: 'Burst Balloons (Top Down)',
  difficulty: 'Hard',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Memoization', 'Interval DP', 'Recursion'],

  description: `
You are given **n balloons**, each with a number written on it represented by the array **nums**.

When you burst the **iᵗʰ balloon**, you gain:

\`nums[left] * nums[i] * nums[right]\`

Where:
- **left** and **right** are the adjacent balloons of **i** at that moment.
- Once a balloon is burst, it disappears and its neighbors become adjacent.

Special rule:
- If there is **no balloon on the left**, treat its value as **1**.
- If there is **no balloon on the right**, treat its value as **1**.

Return the **maximum coins** you can collect by bursting balloons in the best order.

This version should be solved using **Top-Down Dynamic Programming (Memoization)**.

Idea:

Instead of deciding the **first balloon to burst**, we choose the **last balloon to burst** within an interval.

Define:

- \`solve(l, r)\` = maximum coins obtained by bursting balloons **between l and r (exclusive)**.

Recurrence:

\`solve(l, r) = max(
    solve(l, k) +
    nums[l] * nums[k] * nums[r] +
    solve(k, r)
)\`

for every **k between l and r**.

Use **memoization** to store previously computed results.
`,

  examples: [
    {
      input: '4\n3 1 5 8',
      output: '167',
      explanation: 'Best bursting order yields 167 coins.'
    },
    {
      input: '1\n5',
      output: '5',
      explanation: 'Only balloon → 1 * 5 * 1 = 5.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 300',
    '0 ≤ nums[i] ≤ 100'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int dfs(int left, int right, vector<int>& nums, vector<vector<int>>& memo) {
        // TODO: Implement memoized recursion
        return 0;
    }

    int maxCoins(vector<int>& nums) {
        // TODO: Prepare padded array and memo table
        return 0;
    }
};

int main() {
    int n;
    cin >> n;

    vector<int> nums(n);
    for (int i = 0; i < n; i++)
        cin >> nums[i];

    Solution sol;
    cout << sol.maxCoins(nums);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Solution {

        int dfs(int left, int right, int[] nums, int[][] memo) {
            // TODO: Implement memoized recursion
            return 0;
        }

        public int maxCoins(int[] nums) {
            // TODO: Prepare padded array and memo table
            return 0;
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[] nums = new int[n];

        for (int i = 0; i < n; i++)
            nums[i] = sc.nextInt();

        Solution sol = new Solution();
        System.out.print(sol.maxCoins(nums));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '4\n3 1 5 8', expected: '167' },
    { input: '1\n5', expected: '5' },
    { input: '2\n1 5', expected: '10' },
    { input: '3\n1 2 3', expected: '12' },
    { input: '3\n3 1 5', expected: '35' },
    { input: '4\n1 1 1 1', expected: '4' },
    { input: '3\n7 9 8', expected: '568' },
    { input: '5\n3 1 5 8 2', expected: '192' },
    { input: '2\n0 5', expected: '0' },
    { input: '1\n1', expected: '1' }
  ],
};