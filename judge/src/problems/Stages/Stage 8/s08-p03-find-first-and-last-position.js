/**
 * Find First and Last Position of Element in Sorted Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated sorted integers (may contain duplicates).
 * Line 3: An integer target.
 *
 * Output format (stdout):
 * Two space-separated integers representing the starting and ending index 
 * of the target. If target is not found, return "-1 -1".
 */

module.exports = {
  // ---- Identity ----
  id: 'find-first-and-last-position',
  conquestId: 'stage8-3',
  title: 'Find First and Last Position of Element',
  difficulty: 'Medium',
  category: 'Binary Search – Core',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  storyBriefing: `The book you found contains not one, but a whole series of identical enchanted symbols that repeat over several pages. Dobby the house-elf appears with a warning, 'The clue is not just one symbol, but the whole sequence! You must find where the sequence begins and where it ends!' You are given the sorted list of page numbers where the symbols appear. Your task is to find the starting and ending index of the target symbol's sequence.`,

  // ---- Technical Layer ----
  description: `You are given an array of integers 'nums' sorted in non-decreasing order, which may contain duplicates. Your task is to find the starting and ending position of a given 'target' value. If the target is not found in the array, you should return [-1, -1].

You must write an algorithm with O(log n) runtime complexity. This requires using a modified binary search. To find the first position, you perform a binary search, but when you find the target, you continue searching in the left half. To find the last position, you perform another binary search, and when you find the target, you continue searching in the right half.

Return two space-separated integers representing the first and last indices of the target.`,
  examples: [
    {
      input: '6\n5 7 7 8 8 10\n8',
      output: '3 4',
      explanation: 'The target 8 first appears at index 3 and last appears at index 4.'
    },
    {
      input: '6\n5 7 7 8 8 10\n6',
      output: '-1 -1',
      explanation: 'The target 6 is not found in the array.'
    },
    {
      input: '1\n1\n1',
      output: '0 0',
      explanation: 'The target 1 is at index 0, so its first and last position are the same.'
    }
  ],
  constraints: [
    '0 <= nums.length <= 10^5',
    '-10^9 <= nums[i], target <= 10^9',
    'nums is a non-decreasing array.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

pair<int, int> solve(int n, vector<int>& nums, int target) {
    // Your code here
    return {-1, -1};
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
    
    pair<int, int> res = solve(n, nums, target);
    cout << res.first << " " << res.second << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int[] solve(int n, int[] nums, int target) {
        // Your code here
        return new int[]{-1, -1};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        
        int[] res = solve(n, nums, target);
        System.out.println(res[0] + " " + res[1]);
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '6\n5 7 7 8 8 10\n8', expected: '3 4' },
    { input: '6\n5 7 7 8 8 10\n6', expected: '-1 -1' },
    { input: '0\n\n0', expected: '-1 -1' },
    { input: '1\n5\n5', expected: '0 0' },
    { input: '2\n5 5\n5', expected: '0 1' },
    { input: '1\n5\n4', expected: '-1 -1' },
    { input: '5\n1 1 1 1 1\n1', expected: '0 4' },
    { input: '5\n1 2 3 4 5\n1', expected: '0 0' },
    { input: '5\n1 2 3 4 5\n5', expected: '4 4' },
    { input: '5\n1 2 2 2 5\n2', expected: '1 3' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem requires two separate modified binary searches, both running in O(log n) time. For the first occurrence, perform a binary search. When the target is found at 'mid', store this index as a potential answer and continue searching in the left half (right = mid - 1). For the last occurrence, perform another binary search. When the target is found at 'mid', store this index and continue searching in the right half (left = mid + 1). This ensures you find the leftmost and rightmost boundaries of the target's range.`,
    cpp: `int first = -1, last = -1;

// Find first position
int left = 0, right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] >= target) {
        right = mid - 1;
    } else {
        left = mid + 1;
    }
    if (nums[mid] == target) {
        first = mid;
    }
}

// Find last position
left = 0, right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] <= target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
    if (nums[mid] == target) {
        last = mid;
    }
}

return {first, last};`,
    java: `int first = -1, last = -1;

// Find first position
int left = 0, right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] >= target) {
        right = mid - 1;
    } else {
        left = mid + 1;
    }
    if (mid < n && nums[mid] == target) {
        first = mid;
    }
}

// Find last position
left = 0;
right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] <= target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
    if (mid < n && nums[mid] == target) {
        last = mid;
    }
}

return new int[]{first, last};`
  }
};