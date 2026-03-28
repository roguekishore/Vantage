/**
 * Linear Search - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 * Line 3: An integer target, the value to search for.
 *
 * Output format (stdout):
 * The 0-based index of the target if found. 
 * If the target is not found, output -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'linear-search',
  conquestId: 'stage2-2',
  title: 'Linear Search',
  difficulty: 'Easy',
  category: 'Array Index Manipulation',
  tags: ['Array', 'Searching', 'Basics'],

  // ---- Story Layer ----
  storyBriefing: `After a fruitless search through the first pile, you realize the catalogue is nowhere to be seen. Ron Weasley suggests it might have been accidentally returned to the library. Madam Pince allows you to look, but warns you to be quick. You must now scan the 'New Arrivals' shelf, which is unfortunately in no particular order.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers and a target value. Your task is to find the 0-based index of the first occurrence of the target in the array.

A linear search is the required strategy. This involves a sequential scan of the array, examining each element one by one from index 0 to n-1. When you find the first element that matches the target, its index is the solution.

Return a single integer representing the 0-based index of the target. If the target does not appear in the array, return -1.`,
  examples: [
    {
      input: '5\n10 50 30 70 80\n70',
      output: '3',
      explanation: 'Scan from left: 10!=70, 50!=70, 30!=70, 70==70. The target 70 is at index 3. Return 3.'
    },
    {
      input: '6\n5 8 2 8 4 1\n8',
      output: '1',
      explanation: 'The target 8 first appears at index 1. Even though it appears again at index 3, we return the index of the first match. Return 1.'
    },
    {
      input: '3\n-1 -2 -3\n0',
      output: '-1',
      explanation: 'The target 0 is not found in the array of negative numbers. After scanning all elements, we return -1.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '-10^9 <= array[i], target <= 10^9'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

int solve(int n, const vector<int>& arr, int target) {
    // Your code here
    return -1;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int target;
    cin >> target;
    cout << solve(n, arr, target) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, int[] arr, int target) {
        // Your code here
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        if (!sc.hasNextInt()) return;
        int target = sc.nextInt();
        System.out.println(solve(n, arr, target));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '5\n10 50 30 70 80\n70', expected: '3' },
    { input: '4\n1 2 3 4\n5', expected: '-1' },
    { input: '1\n-100\n-100', expected: '0' },
    { input: '5\n1 1 1 1 1\n1', expected: '0' },
    { input: '4\n0 0 0 0\n1', expected: '-1' },
    { input: '3\n10 20 30\n10', expected: '0' },
    { input: '3\n10 20 30\n30', expected: '2' },
    { input: '2\n-1000000000 1000000000\n1000000000', expected: '1' },
    { input: '2\n5 10\n10', expected: '1' },
    { input: '10\n1 6 2 6 3 6 4 6 5 6\n6', expected: '1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The linear search algorithm iterates through each element of the array from start to end. It compares each element with the target value. If a match is found, the index of that element is returned immediately. If the end of the array is reached without finding the target, -1 is returned.`,
    cpp: `for (int i = 0; i < n; ++i) {
    if (arr[i] == target) {
        return i;
    }
}
return -1;`,
    java: `for (int i = 0; i < n; i++) {
    if (arr[i] == target) {
        return i;
    }
}
return -1;`
  }
};