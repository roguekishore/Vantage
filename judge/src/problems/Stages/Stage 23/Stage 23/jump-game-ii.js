/**
 * Jump Game II — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of elements
 *   Line 2: n space-separated integers representing the array nums
 *
 * Output format (stdout):
 *   Print a single integer representing the minimum number of jumps required
 *   to reach the last index.
 */

module.exports = {
  id: 'jump-game-ii',
  conquestId: 'stage21-7',
  title: 'Jump Game II',
  difficulty: 'Medium',
  category: 'Greedy',
  tags: ['Array', 'Greedy', 'Dynamic Programming'],

  description: `
You are given a **0-indexed array nums** of length **n**.

Each element **nums[i]** represents the **maximum jump length** you can make from index **i**.

Your goal is to reach the **last index** in the **minimum number of jumps**.

You can assume that it is **always possible to reach the last index**.

Greedy Idea:

Maintain two ranges:

- **currentEnd** — the end of the current jump range
- **farthest** — the farthest index reachable so far

Iterate through the array:

1. Update **farthest = max(farthest, i + nums[i])**
2. When **i reaches currentEnd**, we must make another jump.
3. Update **currentEnd = farthest**

This guarantees the **minimum number of jumps**.

Time Complexity: **O(n)**  
Space Complexity: **O(1)**
`,

  examples: [
    {
      input: '5\n2 3 1 1 4',
      output: '2',
      explanation:
        'Jump from index 0 → 1, then from index 1 → 4.'
    },
    {
      input: '5\n2 3 0 1 4',
      output: '2',
      explanation:
        'Jump from index 0 → 1, then from index 1 → 4.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^4',
    '0 ≤ nums[i] ≤ 1000',
    'It is guaranteed that you can reach the last index.'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int jump(vector<int>& nums) {
        // TODO: Implement greedy solution
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
    cout << sol.jump(nums);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public int jump(int[] nums) {
            // TODO: Implement greedy solution
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
        System.out.print(sol.jump(nums));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '5\n2 3 1 1 4', expected: '2' },
    { input: '5\n2 3 0 1 4', expected: '2' },
    { input: '1\n0', expected: '0' },
    { input: '2\n1 1', expected: '1' },
    { input: '6\n1 2 3 4 5 6', expected: '3' },
    { input: '6\n6 2 4 0 5 1', expected: '1' },
    { input: '7\n2 1 1 1 1 1 1', expected: '5' },
    { input: '4\n3 2 1 0', expected: '1' },
    { input: '5\n1 1 1 1 1', expected: '4' },
    { input: '5\n4 1 1 3 1', expected: '1' }
  ],
};