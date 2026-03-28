/**
 * Peak Index in a Mountain Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated integers representing the mountain array.
 *
 * Output format (stdout):
 * A single integer representing the index i such that 
 * arr < arr < ... < arr[i - 1] < arr[i] > arr[i + 1] > ... > arr[arr.length - 1].
 */

module.exports = {
  // ---- Identity ----
  id: 'peak-index-in-mountain-array',
  conquestId: 'stage8-2',
  title: 'Peak Index in a Mountain Array',
  difficulty: 'Medium',
  category: 'Binary Search – Core',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  storyBriefing: `Your search leads you and Hermione to a strange map of a mountain range near Hogwarts. The map is represented by an array of altitudes that strictly increases and then strictly decreases, forming a single 'peak'. The clue you need is located at the very highest point. Wasting no time on a full-scale expedition, you must use your binary search skills to find the index of the peak altitude efficiently.`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'arr' that is guaranteed to be a mountain array. A mountain array has at least 3 elements and consists of a strictly increasing sequence followed by a strictly decreasing sequence. Your task is to find the index of the peak element.

This problem can be solved with O(log n) runtime complexity using binary search. The key is to compare the middle element 'arr[mid]' with its right neighbor 'arr[mid + 1]'. If 'arr[mid]' is less than 'arr[mid + 1]', it means you are on the ascending slope of the mountain, and the peak must be to the right. If 'arr[mid]' is greater than 'arr[mid + 1]', you are on the descending slope, and the peak is at or to the left of the current position.

Return the index of the peak element.`,
  examples: [
    {
      input: '3\n0 1 0',
      output: '1',
      explanation: 'The peak is at index 1, with a value of 1.'
    },
    {
      input: '4\n0 10 5 2',
      output: '1',
      explanation: 'The peak is at index 1, with a value of 10.'
    },
    {
      input: '5\n1 3 5 4 2',
      output: '2',
      explanation: 'The peak is at index 2, with a value of 5.'
    }
  ],
  constraints: [
    '3 <= arr.length <= 10^5',
    '0 <= arr[i] <= 10^6',
    'arr is guaranteed to be a mountain array.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

int solve(int n, vector<int>& arr) {
    int left = 0, right = n - 1;
    // Your code here
    
    return left;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    cout << solve(n, arr) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, int[] arr) {
        int left = 0, right = n - 1;
        // Your code here
        
        return left;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        
        System.out.println(solve(n, arr));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\n0 1 0', expected: '1' },
    { input: '4\n0 2 1 0', expected: '1' },
    { input: '4\n0 10 5 2', expected: '1' },
    { input: '3\n1 2 1', expected: '1' },
    { input: '5\n1 3 5 4 2', expected: '2' },
    { input: '10\n1 2 3 4 5 10 9 8 7 6', expected: '5' },
    { input: '10\n1 10 9 8 7 6 5 4 3 2', expected: '1' },
    { input: '3\n1 10 1', expected: '1' },
    { input: '5\n-10 0 10 5 -5', expected: '2' },
    { input: '5\n0 1 2 1 0', expected: '2' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem asks for the peak of a mountain array, which can be found efficiently using binary search. Initialize 'left' and 'right' pointers at the start and end of the array. While 'left' is less than 'right', calculate 'mid'. If the element at 'mid' is less than the element at 'mid + 1', it means we are on the ascending part of the mountain, so the peak must be to the right. Thus, we set 'left = mid + 1'. Otherwise, we are on the descending part or at the peak itself, so the peak is at or to the left of 'mid'. We set 'right = mid'. The loop terminates when 'left' and 'right' converge, at which point they both indicate the peak index.`,
    cpp: `while (left < right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] < arr[mid + 1]) {
        left = mid + 1;
    } else {
        right = mid;
    }
}
return left;`,
    java: `while (left < right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] < arr[mid + 1]) {
        left = mid + 1;
    } else {
        right = mid;
    }
}
return left;`
  }
};