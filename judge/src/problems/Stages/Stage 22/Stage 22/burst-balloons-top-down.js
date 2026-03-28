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
  title: 'The Recursive Gem Explosion',
  difficulty: 'Hard',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Memoization', 'Interval DP', 'Recursion'],
  storyBriefing: `
You're back in the Exploding Gem Vault, but this time, you've found a scroll detailing a recursive magical incantation. Instead of building up a solution, this spell works by breaking the problem down.

The spell asks you to consider the *last* gem to burst in any given sequence. By recursively solving for the sub-sequences to the left and right of that final gem, and remembering the results of sub-problems you've already solved (memoization), you can find the maximum coins.
`,
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
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int dfs(int left, int right, vector<int>& nums, vector<vector<int>>& memo) {
        if (left + 1 == right) {
            return 0;
        }
        if (memo[left][right] > 0) {
            return memo[left][right];
        }
        int ans = 0;
        for (int i = left + 1; i < right; ++i) {
            ans = max(ans, nums[left] * nums[i] * nums[right] + dfs(left, i, nums, memo) + dfs(i, right, nums, memo));
        }
        memo[left][right] = ans;
        return ans;
    }

    int maxCoins(vector<int>& nums) {
        int n = nums.size();
        nums.insert(nums.begin(), 1);
        nums.push_back(1);
        vector<vector<int>> memo(n + 2, vector<int>(n + 2, 0));
        return dfs(0, n + 1, nums, memo);
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
        public int dfs(int left, int right, int[] nums, int[][] memo) {
            if (left + 1 == right) {
                return 0;
            }
            if (memo[left][right] > 0) {
                return memo[left][right];
            }
            int ans = 0;
            for (int i = left + 1; i < right; i++) {
                ans = Math.max(ans, nums[left] * nums[i] * nums[right] + dfs(left, i, nums, memo) + dfs(i, right, nums, memo));
            }
            memo[left][right] = ans;
            return ans;
        }

        public int maxCoins(int[] nums) {
            int n = nums.length;
            int[] newNums = new int[n + 2];
            newNums[0] = 1;
            newNums[n + 1] = 1;
            for (int i = 0; i < n; i++) {
                newNums[i + 1] = nums[i];
            }
            int[][] memo = new int[n + 2][n + 2];
            return dfs(0, n + 1, newNums, memo);
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
    int dfs(int left, int right, vector<int>& nums, vector<vector<int>>& memo) {
        if (left + 1 == right) {
            return 0;
        }
        if (memo[left][right] > 0) {
            return memo[left][right];
        }
        int ans = 0;
        for (int i = left + 1; i < right; ++i) {
            ans = max(ans, nums[left] * nums[i] * nums[right] + dfs(left, i, nums, memo) + dfs(i, right, nums, memo));
        }
        memo[left][right] = ans;
        return ans;
    }

    int maxCoins(vector<int>& nums) {
        int n = nums.size();
        nums.insert(nums.begin(), 1);
        nums.push_back(1);
        vector<vector<int>> memo(n + 2, vector<int>(n + 2, 0));
        return dfs(0, n + 1, nums, memo);
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
        public int dfs(int left, int right, int[] nums, int[][] memo) {
            if (left + 1 == right) {
                return 0;
            }
            if (memo[left][right] > 0) {
                return memo[left][right];
            }
            int ans = 0;
            for (int i = left + 1; i < right; i++) {
                ans = Math.max(ans, nums[left] * nums[i] * nums[right] + dfs(left, i, nums, memo) + dfs(i, right, nums, memo));
            }
            memo[left][right] = ans;
            return ans;
        }

        public int maxCoins(int[] nums) {
            int n = nums.length;
            int[] newNums = new int[n + 2];
            newNums[0] = 1;
            newNums[n + 1] = 1;
            for (int i = 0; i < n; i++) {
                newNums[i + 1] = nums[i];
            }
            int[][] memo = new int[n + 2][n + 2];
            return dfs(0, n + 1, newNums, memo);
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