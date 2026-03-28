/**
 * Max Consecutive Ones III - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated integers (0s and 1s).
 * Line 3: An integer k, the maximum number of 0s you can flip.
 *
 * Output format (stdout):
 * A single integer representing the maximum number of consecutive 1s.
 */

module.exports = {
  // ---- Identity ----
  id: 'max-consecutive-ones-iii',
  conquestId: 'stage5-1',
  title: 'Max Consecutive Ones III',
  difficulty: 'Medium',
  category: 'Sliding Window',
  tags: ['Array', 'Sliding Window', 'Two Pointers'],

  // ---- Story Layer ----
  stageIntro: `The competitive spirit at Hogwarts is at an all-time high as the Quidditch season officially opens. As a promising new player, you're under the watchful eye of your team captain, Oliver Wood. He's obsessed with performance analytics and has devised a series of challenges to measure your consistency and adaptability during practice matches. This is where you'll learn to maintain peak performance over a 'window' of time.`,
  storyBriefing: `Oliver Wood wants to test your Bludger-dodging skills. He records your practice run as a sequence of 1s (successful dodges) and 0s (getting hit). To make things interesting, he gives you a magical advantage: you can use a minor time-turner charm to flip up to 'k' of your misses into successes. Your task is to find the longest possible continuous streak of successful dodges you could have achieved with this advantage.`,

  // ---- Technical Layer ----
  description: `You are given a binary array 'nums' (containing only 0s and 1s) and an integer 'k'. Your task is to find the maximum number of consecutive 1s in the array if you are allowed to flip at most 'k' zeros to ones.

This problem is a perfect fit for the sliding window technique. The goal is to find the longest subarray that contains at most 'k' zeros. You can maintain a window with two pointers, left and right. Expand the window by moving the right pointer. If the number of zeros in the window exceeds 'k', shrink the window from the left until the constraint is met again. The maximum window size seen during this process is the answer.

Return a single integer representing the length of the longest contiguous subarray of 1s.`,
  examples: [
    {
      input: '11\n1 1 1 0 0 0 1 1 1 1 0\n2',
      output: '6',
      explanation: 'The subarray [1,1,1,0,0,0,1,1,1,1,0] starting at index 5 is [0,1,1,1,1,0]. By flipping the two zeros at indices 5 and 10 within this window, we get [1,1,1,1,1,1]. The longest streak is of length 6.'
    },
    {
      input: '5\n0 0 0 1 1\n2',
      output: '4',
      explanation: 'We can flip the first two zeros to get the subarray [1, 1, 0, 1, 1], but a better choice is [0,0,1,1], flipping two zeros gives [1,1,1,1] of length 4.'
    },
    {
      input: '1\n0\n0',
      output: '0',
      explanation: 'We have one 0 but cannot flip any zeros (k=0). The longest streak of 1s is 0.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    'nums[i] is either 0 or 1',
    '0 <= k <= n'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int solve(int n, vector<int>& nums, int k) {
    int maxLen = 0;
    // Your code here
    
    return maxLen;
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
    public static int solve(int n, int[] nums, int k) {
        int maxLen = 0;
        // Your code here
        
        return maxLen;
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
    { input: '11\n1 1 1 0 0 0 1 1 1 1 0\n2', expected: '6' },
    { input: '19\n0 0 1 1 0 0 1 1 1 0 1 1 0 0 0 1 1 1 1\n3', expected: '10' },
    { input: '1\n0\n1', expected: '1' },
    { input: '1\n1\n0', expected: '1' },
    { input: '5\n1 1 1 1 1\n2', expected: '5' },
    { input: '5\n0 0 0 0 0\n5', expected: '5' },
    { input: '5\n0 0 0 0 0\n0', expected: '0' },
    { input: '2\n0 1\n0', expected: '1' },
    { input: '2\n0 1\n1', expected: '2' },
    { input: '10\n1 1 0 0 1 1 0 1 1 0\n3', expected: '10' }
  ],

  // ---- Solution ----
  solution: {
    approach: `This problem is solved using a sliding window approach. We maintain a window [left, right] and a count of zeros within that window. We expand the window by incrementing 'right'. If the element at 'right' is a zero, we increment our zero count. If the zero count exceeds 'k', we must shrink the window from the left by incrementing 'left'. If the element at the old 'left' was a zero, we decrement the zero count. At each step, we update our maximum length with the size of the current valid window (right - left + 1).`,
    cpp: `int left = 0, zeroCount = 0;
for (int right = 0; right < n; ++right) {
    if (nums[right] == 0) {
        zeroCount++;
    }
    while (zeroCount > k) {
        if (nums[left] == 0) {
            zeroCount--;
        }
        left++;
    }
    maxLen = max(maxLen, right - left + 1);
}
return maxLen;`,
    java: `int left = 0, zeroCount = 0;
for (int right = 0; right < n; right++) {
    if (nums[right] == 0) {
        zeroCount++;
    }
    while (zeroCount > k) {
        if (nums[left] == 0) {
            zeroCount--;
        }
        left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
}
return maxLen;`
  }
};