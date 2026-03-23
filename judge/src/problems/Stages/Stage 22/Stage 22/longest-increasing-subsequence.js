/**
 * Longest Increasing Subsequence - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of elements in the array
 *   Line 2: n space-separated integers representing the array elements
 *
 * Output format (stdout):
 *   Print a single integer representing the length of the longest strictly increasing subsequence.
 */

module.exports = {
  id: 'longest-increasing-subsequence',
  conquestId: 'stage22-4',
  title: 'Longest Increasing Subsequence',
  difficulty: 'Medium',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Binary Search', 'Array'],

  description: `
Given an integer array **nums**, return the **length of the longest strictly increasing subsequence**.

A **subsequence** is a sequence that can be derived from the array by deleting some or no elements **without changing the order of the remaining elements**.

For example, for the array \`[10,9,2,5,3,7,101,18]\`, one of the longest increasing subsequences is \`[2,3,7,101]\`, which has length **4**.

You only need to return the **length** of the longest subsequence, not the subsequence itself.

This problem can be solved using:
- **Dynamic Programming (O(n²))**
- **Binary Search optimization (O(n log n))**
`,

  examples: [
    {
      input: '8\n10 9 2 5 3 7 101 18',
      output: '4',
      explanation: 'The LIS is [2,3,7,101], so the length is 4.'
    },
    {
      input: '6\n0 1 0 3 2 3',
      output: '4',
      explanation: 'One LIS is [0,1,2,3].'
    },
    {
      input: '7\n7 7 7 7 7 7 7',
      output: '1',
      explanation: 'All elements are the same, so the LIS length is 1.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 2500',
    '-10⁴ ≤ nums[i] ≤ 10⁴'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        // TODO: Implement LIS logic
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
    cout << sol.lengthOfLIS(nums);

    return 0;
}`,
    
    java: `import java.util.*;

public class Main {

    static class Solution {
        public int lengthOfLIS(int[] nums) {
            // TODO: Implement LIS logic
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
        System.out.print(sol.lengthOfLIS(nums));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '8\n10 9 2 5 3 7 101 18', expected: '4' },
    { input: '6\n0 1 0 3 2 3', expected: '4' },
    { input: '7\n7 7 7 7 7 7 7', expected: '1' },
    { input: '5\n1 2 3 4 5', expected: '5' },
    { input: '5\n5 4 3 2 1', expected: '1' },
    { input: '1\n10', expected: '1' },
    { input: '6\n3 10 2 1 20 4', expected: '3' },
    { input: '7\n50 3 10 7 40 80 2', expected: '4' },
    { input: '6\n1 3 6 7 9 4', expected: '5' },
    { input: '5\n2 2 2 2 2', expected: '1' }
  ],
};