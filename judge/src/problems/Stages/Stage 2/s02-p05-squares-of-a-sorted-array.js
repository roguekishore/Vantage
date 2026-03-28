/**
 * Squares of a Sorted Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers, sorted in non-decreasing order.
 *
 * Output format (stdout):
 * n space-separated integers, representing the squares of the input elements 
 * sorted in non-decreasing order.
 */

module.exports = {
  // ---- Identity ----
  id: 'squares-of-a-sorted-array',
  conquestId: 'stage2-5',
  title: 'Squares of a Sorted Array',
  difficulty: 'Easy',
  category: 'Array Index Manipulation',
  tags: ['Array', 'Two Pointers', 'Sorting'],

  // ---- Story Layer ----
  storyBriefing: `Your final task for the week comes from Oliver Wood, the Gryffindor Quidditch captain. He hands you a list of player performance metrics, sorted from lowest to highest. To account for the impact of both positive (good plays) and negative (fouls) actions, he wants you to square every number. Your job is to take this sorted list, square all the values, and produce a new list of the squared metrics, also sorted in non-decreasing order.`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'nums' of size n, sorted in non-decreasing order. Your task is to return a new array containing the squares of each number from the input, also sorted in non-decreasing order.

A naive solution would be to square each element and then sort the resulting array, which would be O(n log n). A more efficient O(n) approach uses two pointers. Since the original array is sorted, the largest squared values will come from the numbers with the largest absolute values, which are at the two ends of the array. You can place the larger of these squares at the end of your result array and move the pointers inward.

Return a new array of n integers representing the sorted squares. The elements should be space-separated on a single line.`,
  examples: [
    {
      input: '5\n-4 -1 0 3 10',
      output: '0 1 9 16 100',
      explanation: 'After squaring, the array is [16, 1, 0, 9, 100]. Sorting this gives [0, 1, 9, 16, 100].'
    },
    {
      input: '5\n-7 -3 2 3 11',
      output: '4 9 9 49 121',
      explanation: 'Squaring gives [49, 9, 4, 9, 121]. The sorted result is [4, 9, 9, 49, 121].'
    },
    {
      input: '4\n-5 -3 -2 -1',
      output: '1 4 9 25',
      explanation: 'For a sorted array of only negative numbers, the squares will be sorted in reverse order. Squaring gives [25, 9, 4, 1], which is then sorted.'
    }
  ],
  constraints: [
    '1 <= n <= 10^4',
    '-10^4 <= nums[i] <= 10^4',
    'nums is sorted in non-decreasing order.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>

using namespace std;

vector<int> solve(int n, vector<int>& nums) {
    vector<int> result(n);
    // Your code here
    return result;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    
    vector<int> result = solve(n, nums);
    
    for (int i = 0; i < n; i++) {
        cout << result[i] << (i == n - 1 ? "" : " ");
    }
    cout << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int[] solve(int n, int[] nums) {
        int[] result = new int[n];
        // Your code here
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        
        int[] result = solve(n, nums);
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(result[i]);
            if (i < n - 1) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '5\n-4 -1 0 3 10', expected: '0 1 9 16 100' },
    { input: '5\n-7 -3 2 3 11', expected: '4 9 9 49 121' },
    { input: '1\n-5', expected: '25' },
    { input: '4\n1 2 3 4', expected: '1 4 9 16' },
    { input: '4\n-4 -3 -2 -1', expected: '1 4 9 16' },
    { input: '6\n-10 -5 0 0 5 10', expected: '0 0 25 25 100 100' },
    { input: '2\n-5 5', expected: '25 25' },
    { input: '3\n-10000 0 10000', expected: '0 100000000 100000000' },
    { input: '2\n-10 1', expected: '1 100' },
    { input: '2\n-10 -1', expected: '1 100' }
  ],

  // ---- Solution ----
  solution: {
    approach: `This problem is solved efficiently in linear time using a two-pointer approach that builds the result array from end to beginning. Initialize a 'left' pointer at the start of the input array and a 'right' pointer at the end. Compare the absolute values of the elements at these pointers. The larger square is placed at the current end of the result array, and the corresponding pointer is moved inward. This process continues until the result array is filled.`,
    cpp: `vector<int> result(n);
int left = 0, right = n - 1;
for (int i = n - 1; i >= 0; i--) {
    int square;
    if (abs(nums[left]) < abs(nums[right])) {
        square = nums[right] * nums[right];
        right--;
    } else {
        square = nums[left] * nums[left];
        left++;
    }
    result[i] = square;
}
return result;`,
    java: `int[] result = new int[n];
int left = 0, right = n - 1;
for (int i = n - 1; i >= 0; i--) {
    int square;
    if (Math.abs(nums[left]) < Math.abs(nums[right])) {
        square = nums[right] * nums[right];
        right--;
    } else {
        square = nums[left] * nums[left];
        left++;
    }
    result[i] = square;
}
return result;`
  }
};