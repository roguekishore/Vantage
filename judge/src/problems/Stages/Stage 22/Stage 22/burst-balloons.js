/**
 * Burst Balloons - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of balloons
 *   Line 2: n space-separated integers representing the balloon values
 *
 * Output format (stdout):
 *   Print a single integer representing the maximum coins that can be collected.
 */

module.exports = {
  id: 'burst-balloons',
  conquestId: 'stage22-7',
  title: 'Burst Balloons',
  difficulty: 'Hard',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Interval DP', 'Array'],

  description: `
You are given **n balloons**, indexed from **0 to n - 1**. Each balloon has a number written on it represented by the array **nums**.

You are asked to **burst all the balloons**.

If you burst the **iᵗʰ balloon**, you gain:

\`nums[left] * nums[i] * nums[right]\`

Where:
- **left** and **right** are the adjacent balloons of **i** at that moment.
- After the balloon is burst, it disappears and the neighbors become adjacent.

Assume:
- If there is no balloon on the left, treat its value as **1**.
- If there is no balloon on the right, treat its value as **1**.

Return the **maximum coins** you can collect by bursting the balloons in the best order.

This is a classic **Interval Dynamic Programming** problem.

Idea:
Instead of choosing the **first balloon to burst**, think about the **last balloon to burst** within an interval.

Define:

- \`dp[l][r]\` = maximum coins obtained by bursting balloons in the interval **(l, r)**.

Transition:

\`dp[l][r] = max(dp[l][k] + nums[l] * nums[k] * nums[r] + dp[k][r])\`

for every **k between l and r**.
`,

  examples: [
    {
      input: '4\n3 1 5 8',
      output: '167',
      explanation:
        'Burst order example: [1,5,3,8] gives the maximum coins = 167.'
    },
    {
      input: '1\n5',
      output: '5',
      explanation:
        'Only one balloon, coins = 1 * 5 * 1 = 5.'
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
    int maxCoins(vector<int>& nums) {
        // TODO: Implement interval DP solution
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
        public int maxCoins(int[] nums) {
            // TODO: Implement interval DP solution
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