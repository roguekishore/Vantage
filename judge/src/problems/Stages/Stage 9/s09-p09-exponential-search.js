/**
 * Exponential Search - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the sorted array.
 * Line 2: n space-separated sorted integers.
 * Line 3: An integer target to search for.
 *
 * Output format (stdout):
 * A single integer representing the 0-based index of the target.
 * If the target is not found, return -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'exponential-search',
  conquestId: 'stage9-9',
  title: 'Exponential Search',
  difficulty: 'Medium',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  storyBriefing: `Your final challenge in the arcane library is set by Dumbledore himself. He points towards the infinite shelves and gives you a target book. He explains a powerful search technique for unbounded collections: first, find a range where the item must reside by exponentially increasing your search steps. Once you've bounded the problem, you can use your standard binary search to pinpoint the location. Master this, he says, and you can find anything, no matter how vast the library.`,

  // ---- Technical Layer ----
  description: `You are given a sorted array of n integers and a target value. Your task is to implement exponential search to find the index of the target. Exponential search is effective for unbounded arrays but works on bounded arrays too. It involves two steps: first, find a range where the element might be present, and second, perform a binary search within that range.

Start by checking index 1, then 2, 4, 8, and so on, doubling the index 'i' until 'arr[i]' is greater than the target. This establishes an upper bound. The lower bound for the subsequent binary search will be the previous 'i' (i.e., i/2). Perform a binary search within the range [i/2, min(i, n-1)] to find the target.

Return the 0-based index of the target if found, otherwise return -1.`,
  examples: [
    {
      input: '10\n10 20 30 40 50 60 70 80 90 100\n80',
      output: '7',
      explanation: 'Step 1: Find range. Check i=1 (20<80), i=2 (30<80), i=4 (50<80), i=8 (90>80). The range is [4, 8]. Step 2: Binary search in arr[4...8] finds 80 at index 7.'
    },
    {
      input: '5\n1 2 3 4 5\n0',
      output: '-1',
      explanation: 'The target is smaller than the first element.'
    },
    {
      input: '5\n1 2 3 4 5\n1',
      output: '0',
      explanation: 'The target is found at index 0, which is checked as a base case.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '-10^9 <= arr[i], target <= 10^9',
    'The array is sorted in ascending order.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int binarySearch(const vector<int>& arr, int left, int right, int target) {
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int solve(int n, vector<int>& arr, int target) {
    if (n == 0) return -1;
    if (arr[0] == target) return 0;

    // Your Exponential Range Finding logic here
    int i = 1;

    // Your Binary Search call here
    
    return -1;
}

int main() {
    int n, target;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    cin >> target;
    
    cout << solve(n, arr, target) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int binarySearch(int[] arr, int left, int right, int target) {
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static int solve(int n, int[] arr, int target) {
        if (n == 0) return -1;
        if (arr[0] == target) return 0;

        // Your Exponential Range Finding logic here
        int i = 1;
        
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int target = sc.nextInt();
        
        System.out.println(solve(n, arr, target));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '10\n10 20 30 40 50 60 70 80 90 100\n80', expected: '7' },
    { input: '5\n1 2 3 4 5\n1', expected: '0' },
    { input: '5\n1 2 3 4 5\n5', expected: '4' },
    { input: '5\n1 2 3 4 5\n6', expected: '-1' },
    { input: '1\n10\n10', expected: '0' },
    { input: '1\n10\n5', expected: '-1' },
    { input: '15\n1 3 5 7 9 11 13 15 17 19 21 23 25 27 29\n3', expected: '1' },
    { input: '15\n1 3 5 7 9 11 13 15 17 19 21 23 25 27 29\n29', expected: '14' },
    { input: '2\n-5 5\n-5', expected: '0' },
    { input: '2\n-5 5\n5', expected: '1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `Exponential search first finds a range for the binary search. Handle the base case where the target is at index 0. Then, start with an index 'i = 1' and double it as long as 'i' is within the array bounds and the element at 'arr[i]' is less than or equal to the target. This quickly finds an upper bound. Once this loop finishes, the target, if it exists, must be in the range between the previous bound ('i / 2') and the current bound ('min(i, n - 1)'). Finally, perform a standard binary search within this calculated range.`,
    cpp: `int i = 1;
while (i < n && arr[i] <= target) {
    i = i * 2;
}
return binarySearch(arr, i / 2, min(i, n - 1), target);`,
    java: `int i = 1;
while (i < n && arr[i] <= target) {
    i = i * 2;
}
return binarySearch(arr, i / 2, Math.min(i, n - 1), target);`
  }
};