/**
 * Split Array Largest Sum - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array nums.
 * Line 2: n space-separated integers representing the array nums.
 * Line 3: An integer k, the number of non-empty continuous subarrays to split nums into.
 *
 * Output format (stdout):
 * A single integer representing the minimized largest sum of the split.
 */

module.exports = {
  // ---- Identity ----
  id: 'split-array-largest-sum',
  conquestId: 'stage3-6',
  title: 'Split Array Largest Sum',
  difficulty: 'Hard',
  category: 'Prefix & Subarray Thinking',
  tags: ['Array', 'Binary Search', 'Dynamic Programming', 'Greedy'],

  // ---- Story Layer ----
  storyBriefing: `As exams draw closer, Hermione decides the only way to cover all the material is to divide and conquer. She gives you and Ron a long list of textbook chapters to summarize, represented by the number of pages in each. You must split this single list of chapters into exactly 'k' contiguous study sessions (subarrays). To be fair, you want to find a split that minimizes the maximum number of pages anyone has to read in a single session.`,

  // ---- Technical Layer ----
  description: `You are given an array 'nums' of n non-negative integers and an integer 'k'. You need to split 'nums' into k non-empty, continuous subarrays. Your goal is to write an algorithm that finds a split which minimizes the largest sum among all the created subarrays.

This problem is a classic application of binary search on the answer. The minimum possible value for the largest subarray sum is the maximum element in the array, and the maximum possible value is the sum of all elements. You can binary search within this range. For any chosen potential answer 'x', you must check if it's possible to split the array into k or fewer subarrays such that no subarray's sum exceeds 'x'.

Return a single integer representing the minimized largest sum possible.`,
  examples: [
    {
      input: '5\n7 2 5 10 8\n2',
      output: '18',
      explanation: 'The best split is [7, 2, 5] and [10, 8]. The sums are 14 and 18. The largest sum is 18, which is the minimum possible.'
    },
    {
      input: '5\n1 2 3 4 5\n2',
      output: '9',
      explanation: 'The best split is [1, 2, 3, 4] and [5] sums to 10 and 5, max 10. Another is [1, 2, 3] and [4, 5], sums are 6 and 9, max is 9. This is the optimal solution.'
    },
    {
      input: '3\n1 4 4\n3',
      output: '4',
      explanation: 'The only way to split into 3 subarrays is [1], [4], [4]. The sums are 1, 4, 4. The largest sum is 4.'
    }
  ],
  constraints: [
    '1 <= n <= 1000',
    '0 <= nums[i] <= 10^6',
    '1 <= k <= min(50, n)'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

using namespace std;

// Helper function to check if a given max_sum is feasible
bool is_possible(long long max_sum, int n, vector<int>& nums, int k) {
    int subarrays = 1;
    long long current_sum = 0;
    for (int i = 0; i < n; i++) {
        if (nums[i] > max_sum) return false;
        if (current_sum + nums[i] > max_sum) {
            subarrays++;
            current_sum = nums[i];
        } else {
            current_sum += nums[i];
        }
    }
    return subarrays <= k;
}

int solve(int n, vector<int>& nums, int k) {
    // Your code here
    return 0;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int k;
    cin >> k;
    
    cout << solve(n, nums, k) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    // Helper function to check if a given max_sum is feasible
    private static boolean isPossible(long maxSum, int n, int[] nums, int k) {
        int subarrays = 1;
        long currentSum = 0;
        for (int i = 0; i < n; i++) {
            if (nums[i] > maxSum) return false;
            if (currentSum + nums[i] > maxSum) {
                subarrays++;
                currentSum = nums[i];
            } else {
                currentSum += nums[i];
            }
        }
        return subarrays <= k;
    }

    public static int solve(int n, int[] nums, int k) {
        // Your code here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();
        
        System.out.println(solve(n, nums, k));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '5\n7 2 5 10 8\n2', expected: '18' },
    { input: '5\n1 2 3 4 5\n2', expected: '9' },
    { input: '3\n1 4 4\n3', expected: '4' },
    { input: '1\n100\n1', expected: '100' },
    { input: '4\n10 20 30 40\n1', expected: '100' },
    { input: '4\n10 20 30 40\n4', expected: '40' },
    { input: '6\n1 1 1 1 1 1\n3', expected: '2' },
    { input: '2\n10 10\n1', expected: '20' },
    { input: '5\n10 2 3 4 10\n2', expected: '19' },
    { input: '10\n1 2 3 4 5 6 7 8 9 10\n5', expected: '15' }
  ],

  // ---- Solution ----
  solution: {
    approach: `This problem is solved by binary searching for the minimum possible value of the 'largest subarray sum'. The search space for this value ranges from the largest single element in the array (lower bound) to the total sum of the array (upper bound). For each 'mid' value in the binary search, a helper function checks if it's possible to partition the array into 'k' or fewer subarrays such that no subarray sum exceeds 'mid'. If it is possible, it means 'mid' could be our answer, and we try for a smaller sum by moving the upper bound down. If it's not possible, 'mid' is too small, and we must allow for larger subarray sums by moving the lower bound up. The final answer is the smallest 'mid' for which the partition is possible.`,
    cpp: `long long low = 0, high = 0;
for (int x : nums) {
    low = max(low, (long long)x);
    high += x;
}

int ans = high;

while (low <= high) {
    long long mid = low + (high - low) / 2;
    if (is_possible(mid, n, nums, k)) {
        ans = mid;
        high = mid - 1;
    } else {
        low = mid + 1;
    }
}
return ans;`,
    java: `long low = 0, high = 0;
for (int x : nums) {
    low = Math.max(low, x);
    high += x;
}

int ans = (int)high;

while (low <= high) {
    long mid = low + (high - low) / 2;
    if (isPossible(mid, n, nums, k)) {
        ans = (int)mid;
        high = mid - 1;
    } else {
        low = mid + 1;
    }
}
return ans;`
  }
};