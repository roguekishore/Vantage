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
  title: 'The Gemstone Collection Vault',
  difficulty: 'Medium',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Binary Search', 'Array'],
  storyBriefing: `
This Gringotts vault holds a collection of rare gemstones, each with a specific value. They are arranged in a line. To pass, you must identify the longest possible sequence of gemstones you can pick, such that their values are strictly increasing.

You must maintain the original relative order of the gemstones. For example, you can't pick a gemstone that appears earlier in the line after one that appears later.
`,
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
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        if (nums.empty()) {
            return 0;
        }
        vector<int> dp;
        for (int num : nums) {
            auto it = lower_bound(dp.begin(), dp.end(), num);
            if (it == dp.end()) {
                dp.push_back(num);
            } else {
                *it = num;
            }
        }
        return dp.size();
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
            if (nums == null || nums.length == 0) {
                return 0;
            }
            ArrayList<Integer> dp = new ArrayList<>();
            for (int num : nums) {
                int i = Collections.binarySearch(dp, num);
                if (i < 0) {
                    i = -(i + 1);
                }
                if (i == dp.size()) {
                    dp.add(num);
                } else {
                    dp.set(i, num);
                }
            }
            return dp.size();
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
    int lengthOfLIS(vector<int>& nums) {
        if (nums.empty()) {
            return 0;
        }
        vector<int> dp;
        for (int num : nums) {
            auto it = lower_bound(dp.begin(), dp.end(), num);
            if (it == dp.end()) {
                dp.push_back(num);
            } else {
                *it = num;
            }
        }
        return dp.size();
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
            if (nums == null || nums.length == 0) {
                return 0;
            }
            ArrayList<Integer> dp = new ArrayList<>();
            for (int num : nums) {
                int i = Collections.binarySearch(dp, num);
                if (i < 0) {
                    i = -(i + 1);
                }
                if (i == dp.size()) {
                    dp.add(num);
                } else {
                    dp.set(i, num);
                }
            }
            return dp.size();
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