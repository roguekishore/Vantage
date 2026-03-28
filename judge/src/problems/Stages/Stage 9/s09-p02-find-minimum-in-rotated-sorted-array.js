/**
 * Find Minimum in Rotated Sorted Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated integers (the rotated sorted array).
 *
 * Output format (stdout):
 * A single integer representing the minimum element in the array.
 */

module.exports = {
  // ---- Identity ----
  id: 'find-minimum-in-rotated-sorted-array',
  conquestId: 'stage9-2',
  title: 'Find Minimum in Rotated Sorted Array',
  difficulty: 'Medium',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  storyBriefing: `As you navigate the rotated corridors, you realize the key to understanding the layout is to find the 'pivot point' - the place where the rotation happened. This pivot point will always be the room with the smallest number. You need to find this minimum value in the rotated sorted list of room numbers to re-orient your map.`,

  // ---- Technical Layer ----
  description: `You are given a sorted array of unique elements that has been rotated between 1 and n times. Your task is to find the minimum element in this array. You must write an algorithm that runs in O(log n) time.

This problem is a variation of binary search. The minimum element is the pivot point where the rotation occurs. By comparing the middle element with the element at the right boundary, you can determine which half of the array contains the pivot. If 'nums[mid]' is greater than 'nums[right]', the pivot must be in the right half. Otherwise, the pivot is in the left half (including 'mid' itself).

Return the minimum element in the array.`,
  examples: [
    {
      input: '5\n3 4 5 1 2',
      output: '1',
      explanation: 'The original array was likely [1, 2, 3, 4, 5] and rotated. The minimum element is 1.'
    },
    {
      input: '7\n4 5 6 7 0 1 2',
      output: '0',
      explanation: 'The minimum element is 0.'
    },
    {
      input: '4\n11 13 15 17',
      output: '11',
      explanation: 'The array was not rotated (or rotated n times). The minimum element is the first one.'
    }
  ],
  constraints: [
    '1 <= n <= 5000',
    '-5000 <= nums[i] <= 5000',
    'All the integers of nums are unique.',
    'nums is sorted and rotated between 1 and n times.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

int solve(int n, vector<int>& nums) {
    int left = 0, right = n - 1;
    // Your code here
    
    return nums[left];
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
        int left = 0, right = n - 1;
        // Your code here
        
        return nums[left];
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
    { input: '5\n3 4 5 1 2', expected: '1' },
    { input: '7\n4 5 6 7 0 1 2', expected: '0' },
    { input: '4\n11 13 15 17', expected: '11' },
    { input: '1\n10', expected: '10' },
    { input: '2\n2 1', expected: '1' },
    { input: '3\n3 1 2', expected: '1' },
    { input: '5\n2 3 4 5 1', expected: '1' },
    { input: '5\n5 1 2 3 4', expected: '1' },
    { input: '2\n-1 -2', expected: '-2' },
    { input: '10\n10 20 30 40 50 -50 -40 -30 -20 -10', expected: '-50' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem of finding the minimum in a rotated sorted array is equivalent to finding the pivot point. This can be done with a modified binary search. Initialize 'left' and 'right' pointers. While 'left' is less than 'right', calculate 'mid'. Compare 'nums[mid]' with 'nums[right]'. If 'nums[mid]' is greater, it means the pivot (and thus the minimum element) lies in the right half of the current range, so we set 'left = mid + 1'. Otherwise, the minimum is either at 'mid' or in the left half, so we set 'right = mid'. The loop terminates when 'left' and 'right' converge on the index of the minimum element.`,
    cpp: `while (left < right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] > nums[right]) {
        left = mid + 1;
    } else {
        right = mid;
    }
}
return nums[left];`,
    java: `while (left < right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] > nums[right]) {
        left = mid + 1;
    } else {
        right = mid;
    }
}
return nums[left];`
  }
};