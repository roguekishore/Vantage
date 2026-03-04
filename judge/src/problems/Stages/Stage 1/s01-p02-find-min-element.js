/**
 * Find Minimum Element - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single integer representing the minimum value found in the array.
 */

module.exports = {
  id: 'find-min-element',
  conquestId: 'stage1-2',
  title: 'Find Minimum Element',
  difficulty: 'Easy',
  category: 'Absolute Programming Basics',
  tags: ['Array', 'Basics', 'Traversal'],

  storyBriefing: `Snape's eyes narrow. "Adequate. Now - a potion brewed below minimum temperature is useless, and a dangerous waste of my time." He gestures along the same row of cauldrons. "Find the coldest one before it contaminates the batch. Five points from your house if you keep me waiting."`,

  description: `You are given an array of n integers. Return the smallest element in the array.

Traverse the array from left to right, maintaining the smallest value seen so far. Initialize your running minimum with the first element, then update it whenever you encounter a smaller value.

Do not use built-in sort or min functions. Return a single integer - the minimum element in the array.`,

  examples: [
    {
      input: '5\n10 5 8 2 15',
      output: '2',
      explanation: 'Scanning left to right: min = 10, then 5 < 10 (min = 5), then 8 > 5 (no change), then 2 < 5 (min = 2), then 15 > 2 (no change). Return 2.'
    },
    {
      input: '4\n-3 -1 -4 -2',
      output: '-4',
      explanation: 'All values are negative. Scanning gives min = -3, then -1 > -3 (no change), then -4 < -3 (min = -4), then -2 > -4 (no change). Return -4.'
    },
    {
      input: '1\n42',
      output: '42',
      explanation: 'With only one element, the minimum is trivially 42.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10⁵',
    '-10⁹ ≤ array[i] ≤ 10⁹',
    'The array contains at least one element.'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <climits>
#include <algorithm>

using namespace std;

/**
 * Returns the minimum element in the array.
 */
int solve(int n, const vector<int>& arr) {
    int minVal = arr;
    // Your code here
    
    return minVal;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    cout << solve(n, arr) << endl;
    return 0;
}`,
    java: `import java.util.Scanner;

public class Main {
    /**
     * Returns the minimum element in the array.
     */
    public static int solve(int n, int[] arr) {
        int minVal = arr;
        // Your code here
        
        return minVal;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        System.out.println(solve(n, arr));
    }
}`
  },

  testCases: [
    { input: '5\n10 5 8 2 15', expected: '2' },
    { input: '1\n100', expected: '100' },
    { input: '4\n-1 -2 -3 -4', expected: '-4' },
    { input: '3\n50 50 50', expected: '50' },
    { input: '6\n10 20 30 5 2 1', expected: '1' },
    { input: '5\n0 0 0 0 0', expected: '0' },
    { input: '2\n1000000000 -1000000000', expected: '-1000000000' },
    { input: '4\n2 3 4 5', expected: '2' },
    { input: '10\n10 9 8 7 6 5 4 3 2 1', expected: '1' },
    { input: '8\n50 0 100 -25 -30 10 -40 -5', expected: '-40' }
  ]
};