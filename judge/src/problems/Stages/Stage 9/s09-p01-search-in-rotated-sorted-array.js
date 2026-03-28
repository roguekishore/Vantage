/**
 * Search in Rotated Sorted Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated integers (the rotated sorted array).
 * Line 3: An integer target.
 *
 * Output format (stdout):
 * A single integer representing the 0-based index of the target.
 * If target is not found, return -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'search-in-rotated-sorted-array',
  conquestId: 'stage9-1',
  title: 'Search in Rotated Sorted Array',
  difficulty: 'Medium',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  stageIntro: `The clues from the library have led you deep into the castle's less-traveled corridors. Nearly Headless Nick drifts through a wall, looking troubled. 'The passages ahead are enchanted,' he whispers. 'They are like a sorted list of rooms, but the Grey Lady has rotated the sequence as a prank! Finding anything in this state requires a... particular kind of thinking. A more advanced form of searching.'`,
  storyBriefing: `Nearly Headless Nick presents you with a map of a corridor, represented as a sorted array of room numbers that has been rotated at an unknown point. He needs you to find the index of a specific 'target' room number. A linear search would take too long and risk getting caught by Filch. You must adapt your binary search logic to handle the rotation and find the room in logarithmic time.`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'nums' sorted in ascending order with distinct values, which has been possibly rotated at an unknown pivot. Your task is to find the index of a given 'target'. If the target is not in the array, return -1. Your algorithm must run in O(log n) time.

This requires a modified binary search. In each step, you determine which half of the current search space (from 'left' to 'mid' or 'mid' to 'right') is sorted. You can do this by comparing 'nums[left]' and 'nums[mid]'. Once you've identified the sorted half, you check if the target lies within its range. If it does, you search in that half; otherwise, you search in the other, unsorted half.

Return the index of the target if it is found, otherwise return -1.`,
  examples: [
    {
      input: '7\n4 5 6 7 0 1 2\n0',
      output: '4',
      explanation: 'The array was rotated. The target 0 is found at index 4.'
    },
    {
      input: '7\n4 5 6 7 0 1 2\n3',
      output: '-1',
      explanation: 'The target 3 is not present in the rotated array.'
    },
    {
      input: '1\n1\n0',
      output: '-1',
      explanation: 'A single element array does not contain the target.'
    }
  ],
  constraints: [
    '1 <= nums.length <= 5000',
    '-10^4 <= nums[i] <= 10^4',
    'All values of nums are unique.',
    'nums is an ascending array that is possibly rotated.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

int solve(int n, vector<int>& nums, int target) {
    int left = 0, right = n - 1;
    // Your code here
    
    return -1;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;
    
    cout << solve(n, nums, target) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, int[] nums, int target) {
        int left = 0, right = n - 1;
        // Your code here
        
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        
        System.out.println(solve(n, nums, target));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '7\n4 5 6 7 0 1 2\n0', expected: '4' },
    { input: '7\n4 5 6 7 0 1 2\n3', expected: '-1' },
    { input: '1\n1\n0', expected: '-1' },
    { input: '1\n1\n1', expected: '0' },
    { input: '2\n3 1\n1', expected: '1' },
    { input: '2\n1 3\n1', expected: '0' },
    { input: '5\n1 2 3 4 5\n4', expected: '3' },
    { input: '5\n3 4 5 1 2\n1', expected: '3' },
    { input: '5\n5 1 2 3 4\n1', expected: '1' },
    { input: '3\n5 1 3\n5', expected: '0' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The core of the solution is a modified binary search. In each iteration, calculate 'mid'. Check if the left half (from 'left' to 'mid') is sorted by comparing nums[left] and nums[mid]. If it is, check if the target falls within this sorted range. If it does, search this half (right = mid - 1). Otherwise, search the other half (left = mid + 1). If the left half is not sorted, then the right half must be. Check if the target falls within the right half's range and adjust the pointers accordingly. Repeat until the target is found or the pointers cross.`,
    cpp: `while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) {
        return mid;
    }
    // Check if left half is sorted
    if (nums[left] <= nums[mid]) {
        if (target >= nums[left] && target < nums[mid]) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    } 
    // Otherwise, right half must be sorted
    else {
        if (target > nums[mid] && target <= nums[right]) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
}
return -1;`,
    java: `while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) {
        return mid;
    }
    // Check if left half is sorted
    if (nums[left] <= nums[mid]) {
        if (target >= nums[left] && target < nums[mid]) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    } 
    // Otherwise, right half must be sorted
    else {
        if (target > nums[mid] && target <= nums[right]) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
}
return -1;`
  }
};