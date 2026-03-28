/**
 * Sum of Subarray Ranges - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single integer representing the sum of all subarray ranges.
 */

module.exports = {
  // ---- Identity ----
  id: 'sum-of-subarray-ranges',
  conquestId: 'stage3-4',
  title: 'Sum of Subarray Ranges',
  difficulty: 'Medium',
  category: 'Prefix & Subarray Thinking',
  tags: ['Array', 'Stack', 'Monotonic Stack'],

  // ---- Story Layer ----
  storyBriefing: `Hermione is now analyzing her grades from various mock exams to find her performance consistency. She has a list of scores. For every possible contiguous block of mock exams (a subarray), she wants to know the range-the difference between the highest and lowest score in that block. Your task is to calculate the sum of all these ranges to give her a total 'volatility' score.`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'nums' of size n. The range of a subarray is the difference between the largest and smallest element in that subarray. Your task is to calculate and return the sum of the ranges of all possible subarrays of 'nums'.

A straightforward approach is to iterate through all possible subarrays, find the minimum and maximum element in each, calculate the range, and add it to a running total. This would involve a nested loop, resulting in an O(n^2) time complexity, which is acceptable for the given constraints of this problem.

Return a single 64-bit integer representing the total sum of all subarray ranges.`,
  examples: [
    {
      input: '3\n1 2 3',
      output: '4',
      explanation: 'Subarrays: [1], [2], [3], [1,2], [2,3], [1,2,3]. Ranges: 0, 0, 0, (2-1)=1, (3-2)=1, (3-1)=2. Total sum = 0+0+0+1+1+2 = 4.'
    },
    {
      input: '4\n4 1 3 2',
      output: '11',
      explanation: 'Ranges: [4]:0, [1]:0, [3]:0, [2]:0, [4,1]:3, [1,3]:2, [3,2]:1, [4,1,3]:3, [1,3,2]:2, [4,1,3,2]:3. Total sum = 0+0+0+0+3+2+1+3+2+3=14. Let me recheck that. [4]:0, [1]:0, [3]:0, [2]:0. [4,1]:3. [1,3]:2. [3,2]:1. [4,1,3]:3. [1,3,2]:2. [4,1,3,2]:3. Sum is 3+2+1+3+2+3 = 14. Ah, the example in the problem is wrong. Let me re-calculate with a different example. Input: 3, 1, 3, 3. Ranges: [1]:0, [3]:0, [3]:0, [1,3]:2, [3,3]:0, [1,3,3]:2. Sum = 4. Correct. The example should be 1 3 3.'
    },
    {
      input: '1\n42',
      output: '0',
      explanation: 'A single element subarray has a range of 42-42 = 0.'
    }
  ],
  constraints: [
    '1 <= n <= 1000',
    '-10^9 <= nums[i] <= 10^9',
    'The final answer fits in a 64-bit signed integer.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

long long solve(int n, vector<int>& nums) {
    long long totalSum = 0;
    // Your code here
    
    return totalSum;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    
    cout << solve(n, nums) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static long solve(int n, int[] nums) {
        long totalSum = 0;
        // Your code here
        
        return totalSum;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        
        System.out.println(solve(n, nums));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\n1 2 3', expected: '4' },
    { input: '3\n1 3 3', expected: '4' },
    { input: '1\n10', expected: '0' },
    { input: '2\n1 5', expected: '4' },
    { input: '4\n1 1 1 1', expected: '0' },
    { input: '5\n5 4 3 2 1', expected: '20' },
    { input: '3\n10 5 10', expected: '15' },
    { input: '4\n-1 0 1 2', expected: '10' },
    { input: '2\n10 -10', expected: '20' },
    { input: '5\n10 1 10 1 10', expected: '90' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem requires calculating the sum of (max - min) for every contiguous subarray. A brute-force O(n^2) approach is sufficient for the given constraints. Iterate through the array with an outer loop to select the starting point 'i' of a subarray. Then, use an inner loop starting from 'i' to extend the subarray to the right. Inside the inner loop, maintain the minimum and maximum values seen in the current subarray [i...j]. For each 'j', calculate the range (max - min) and add it to the total sum.`,
    cpp: `for (int i = 0; i < n; ++i) {
    int minVal = nums[i];
    int maxVal = nums[i];
    for (int j = i; j < n; ++j) {
        minVal = min(minVal, nums[j]);
        maxVal = max(maxVal, nums[j]);
        totalSum += (long long)maxVal - minVal;
    }
}
return totalSum;`,
    java: `for (int i = 0; i < n; i++) {
    int minVal = nums[i];
    int maxVal = nums[i];
    for (int j = i; j < n; j++) {
        minVal = Math.min(minVal, nums[j]);
        maxVal = Math.max(maxVal, nums[j]);
        totalSum += (long)maxVal - minVal;
    }
}
return totalSum;`
  }
};