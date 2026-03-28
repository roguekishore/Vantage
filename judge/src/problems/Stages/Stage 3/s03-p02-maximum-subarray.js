/**
 * Maximum Subarray - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single integer representing the maximum sum of a contiguous subarray.
 */

module.exports = {
  // ---- Identity ----
  id: 'maximum-subarray',
  conquestId: 'stage3-2',
  title: 'Maximum Subarray',
  difficulty: 'Medium',
  category: 'Prefix & Subarray Thinking',
  tags: ['Array', 'Dynamic Programming', 'Kadane\'s Algorithm'],

  // ---- Story Layer ----
  storyBriefing: `Neville Longbottom is feeling overwhelmed by his Potions homework. He's been tracking his performance on a list, with positive numbers for successful steps and negative numbers for mistakes. To boost his confidence, he asks you to find the single, continuous stretch of potion-making steps where his performance was highest. This will show him his best period of work.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers. Your task is to find the contiguous subarray (containing at least one number) which has the largest sum and return its sum. A subarray is a continuous part of an array.

This classic problem can be solved efficiently using Kadane's Algorithm. The idea is to iterate through the array, maintaining two variables: one for the maximum sum of a subarray ending at the current position, and another for the overall maximum sum found so far. If the current subarray sum becomes negative, it's better to start a new subarray from the next element.

Return a single integer representing the largest possible sum of a contiguous subarray.`,
  examples: [
    {
      input: '9\n-2 1 -3 4 -1 2 1 -5 4',
      output: '6',
      explanation: 'The subarray [4, -1, 2, 1] has the largest sum of 6.'
    },
    {
      input: '5\n5 4 -1 7 8',
      output: '23',
      explanation: 'The subarray with the maximum sum is the entire array itself, which sums to 23.'
    },
    {
      input: '5\n-5 -1 -3 -2 -4',
      output: '-1',
      explanation: 'When all numbers are negative, the maximum subarray is the single element that is closest to zero. In this case, -1.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '-10^4 <= nums[i] <= 10^4'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int solve(int n, const vector<int>& nums) {
    int maxSoFar = nums[0];
    int currentMax = nums[0];
    
    // Your code here
    
    return maxSoFar;
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
    public static int solve(int n, int[] nums) {
        int maxSoFar = nums[0];
        int currentMax = nums[0];
        
        // Your code here
        
        return maxSoFar;
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
    { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expected: '6' },
    { input: '1\n1', expected: '1' },
    { input: '5\n5 4 -1 7 8', expected: '23' },
    { input: '5\n-1 -2 -3 -4 -5', expected: '-1' },
    { input: '1\n-10', expected: '-10' },
    { input: '5\n5 5 5 5 5', expected: '25' },
    { input: '2\n-1 1', expected: '1' },
    { input: '10\n-1 -2 -3 -4 -5 -6 -7 -8 -9 -10', expected: '-1' },
    { input: '2\n1 -1', expected: '1' },
    { input: '3\n-2 -3 -1', expected: '-1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `Kadane's algorithm provides an O(n) solution. Initialize 'maxSoFar' and 'currentMax' with the first element of the array. Iterate from the second element onwards. In each iteration, update 'currentMax' to be the maximum of the current element itself or the sum of the current element and the previous 'currentMax'. This decides whether to extend the existing subarray or start a new one. Then, update 'maxSoFar' with the maximum of its current value and the new 'currentMax'.`,
    cpp: `for (int i = 1; i < n; i++) {
    currentMax = max(nums[i], currentMax + nums[i]);
    maxSoFar = max(maxSoFar, currentMax);
}
return maxSoFar;`,
    java: `for (int i = 1; i < n; i++) {
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    maxSoFar = Math.max(maxSoFar, currentMax);
}
return maxSoFar;`
  }
};