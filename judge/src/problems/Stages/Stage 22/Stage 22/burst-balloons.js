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
  title: 'The Exploding Gem Vault',
  difficulty: 'Hard',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Interval DP', 'Array'],
  storyBriefing: `
This vault is filled with volatile, magical gems. When a gem is burst, it releases a shower of coins. The number of coins depends on the values of the adjacent gems at that moment.

If you burst gem 'i', you get \`value[left] * value[i] * value[right]\` coins. The key is that after a gem bursts, its neighbors become adjacent. You must find the optimal order to burst all the gems to maximize your total coins.
`,
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
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int maxCoins(vector<int>& nums) {
        int n = nums.size();
        nums.insert(nums.begin(), 1);
        nums.push_back(1);
        vector<vector<int>> dp(nums.size(), vector<int>(nums.size(), 0));

        for (int len = 1; len <= n; ++len) {
            for (int left = 1; left <= n - len + 1; ++left) {
                int right = left + len - 1;
                for (int k = left; k <= right; ++k) {
                    dp[left][right] = max(dp[left][right],
                                          nums[left - 1] * nums[k] * nums[right + 1] + dp[left][k - 1] + dp[k + 1][right]);
                }
            }
        }
        return dp[1][n];
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
            int n = nums.length;
            int[] newNums = new int[n + 2];
            newNums[0] = 1;
            newNums[n + 1] = 1;
            for (int i = 0; i < n; i++) {
                newNums[i + 1] = nums[i];
            }

            int[][] dp = new int[n + 2][n + 2];

            for (int len = 1; len <= n; len++) {
                for (int left = 1; left <= n - len + 1; left++) {
                    int right = left + len - 1;
                    for (int k = left; k <= right; k++) {
                        dp[left][right] = Math.max(dp[left][right],
                                newNums[left - 1] * newNums[k] * newNums[right + 1] + dp[left][k - 1] + dp[k + 1][right]);
                    }
                }
            }
            return dp[1][n];
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }

        Solution sol = new Solution();
        System.out.print(sol.maxCoins(nums));
    }
}`
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int maxCoins(vector<int>& nums) {
        int n = nums.size();
        nums.insert(nums.begin(), 1);
        nums.push_back(1);
        vector<vector<int>> dp(nums.size(), vector<int>(nums.size(), 0));

        for (int len = 1; len <= n; ++len) {
            for (int left = 1; left <= n - len + 1; ++left) {
                int right = left + len - 1;
                for (int k = left; k <= right; ++k) {
                    dp[left][right] = max(dp[left][right],
                                          nums[left - 1] * nums[k] * nums[right + 1] + dp[left][k - 1] + dp[k + 1][right]);
                }
            }
        }
        return dp[1][n];
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
            int n = nums.length;
            int[] newNums = new int[n + 2];
            newNums[0] = 1;
            newNums[n + 1] = 1;
            for (int i = 0; i < n; i++) {
                newNums[i + 1] = nums[i];
            }

            int[][] dp = new int[n + 2][n + 2];

            for (int len = 1; len <= n; len++) {
                for (int left = 1; left <= n - len + 1; left++) {
                    int right = left + len - 1;
                    for (int k = left; k <= right; k++) {
                        dp[left][right] = Math.max(dp[left][right],
                                newNums[left - 1] * newNums[k] * newNums[right + 1] + dp[left][k - 1] + dp[k + 1][right]);
                    }
                }
            }
            return dp[1][n];
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }

        Solution sol = new Solution();
        System.out.print(sol.maxCoins(nums));
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