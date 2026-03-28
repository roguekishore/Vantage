/**
 * Find Peak Element - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single integer representing the index of any peak element found.
 */

module.exports = {
  // ---- Identity ----
  id: 'find-peak-element',
  conquestId: 'stage9-3',
  title: 'Find Peak Element',
  difficulty: 'Medium',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  storyBriefing: `Your map now shows a series of magical hills and valleys. The next clue is hidden atop one of these peaks. A 'peak' is defined as a point that is higher than its immediate neighbors. The array of altitudes isn't necessarily sorted, but it contains at least one peak. You must find the index of any peak to proceed.`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'nums'. A peak element is an element that is strictly greater than its neighbors. Your task is to find a peak element and return its index. If the array contains multiple peaks, returning the index to any of the peaks is acceptable. You can imagine that 'nums[-1]' and 'nums[n]' are negative infinity.

Your algorithm must run in O(log n) time. This can be achieved with a binary search. Compare the middle element 'nums[mid]' with its right neighbor 'nums[mid + 1]'. If 'nums[mid]' is smaller, you are on an upward slope, so a peak must exist to the right. If 'nums[mid]' is larger, you are on a downward slope, meaning 'mid' itself could be a peak, or one exists to the left.

Return the index of any peak element.`,
  examples: [
    {
      input: '4\n1 2 3 1',
      output: '2',
      explanation: '3 is a peak element, located at index 2.'
    },
    {
      input: '7\n1 2 1 3 5 6 4',
      output: '1',
      explanation: 'The function can return either index 1 (peak value 2) or index 5 (peak value 6). Returning 1 is a valid answer.'
    },
    {
      input: '1\n100',
      output: '0',
      explanation: 'In a single-element array, that element is considered a peak.'
    }
  ],
  constraints: [
    '1 <= nums.length <= 1000',
    '-2^31 <= nums[i] <= 2^31 - 1',
    'nums[i] != nums[i + 1] for all valid i.'
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
    
    return left;
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
        
        return left;
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
    { input: '4\n1 2 3 1', expected: '2' },
    { input: '7\n1 2 1 3 5 6 4', expected: '5' },
    { input: '1\n10', expected: '0' },
    { input: '2\n1 2', expected: '1' },
    { input: '2\n2 1', expected: '0' },
    { input: '3\n1 2 1', expected: '1' },
    { input: '5\n1 2 3 4 5', expected: '4' },
    { input: '5\n5 4 3 2 1', expected: '0' },
    { input: '6\n1 2 1 2 1 2', expected: '1' },
    { input: '4\n1 3 2 4', expected: '1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem can be solved with binary search because every array is guaranteed to have a peak. Initialize 'left' and 'right' pointers. While 'left' is less than 'right', calculate 'mid'. Compare 'nums[mid]' with its right neighbor, 'nums[mid + 1]'. If 'nums[mid]' is smaller, it means we are on an ascending slope, so a peak must lie to the right. We can safely discard the left half by setting 'left = mid + 1'. If 'nums[mid]' is larger, then 'mid' is either a peak or on a descending slope. In this case, a peak must be at 'mid' or to its left. We can discard the right half by setting 'right = mid'. The loop will converge when 'left' and 'right' are equal, pointing to a peak index.`,
    cpp: `while (left < right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] < nums[mid + 1]) {
        left = mid + 1;
    } else {
        right = mid;
    }
}
return left;`,
    java: `while (left < right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] < nums[mid + 1]) {
        left = mid + 1;
    } else {
        right = mid;
    }
}
return left;`
  }
};