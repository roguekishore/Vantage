/**
 * Count Zeros in Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single integer representing the count of elements that are equal to 0.
 */

module.exports = {
  id: 'count-zeros',
  conquestId: 'stage1-5', //
  title: 'Count Zeros in Array',
  difficulty: 'Easy', //
  category: 'Absolute Programming Basics',
  tags: ['Array', 'Basics', 'Counting'],

  storyBriefing: `Hagrid sends you a handwritten note before dinner: "Come see me at the hut if yeh got a moment. Something's wrong with me magical creature feed records." When you arrive, he spreads a long parchment across the table. "Some days I wrote down nothin' - zero feed, see? The Ministry's askin' how many days I missed. Count 'em up for me, would yeh?"`,

  description: `You are given an array of n integers. Return the number of elements in the array that are equal to 0.

Traverse the array from left to right and increment a counter each time you encounter an element whose value is exactly 0. Non-zero values - whether positive or negative - should not be counted.

Return a single integer - the total count of zeros in the array.`,

  examples: [
    {
      input: '7\n0 1 0 2 0 3 0',
      output: '4',
      explanation: 'Zeros are found at indices 0, 2, 4, and 6. Non-zero values at indices 1, 3, and 5 are skipped. Total count: 4.'
    },
    {
      input: '4\n5 6 7 8',
      output: '0',
      explanation: 'No element equals 0. The counter never increments. Return 0.'
    },
    {
      input: '5\n0 0 0 0 0',
      output: '5',
      explanation: 'Every element equals 0. The counter increments on each step. Return 5.'
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

using namespace std;

/**
 * Returns the number of zeros in the array.
 */
int solve(int n, const vector<int>& arr) {
    int count = 0;
    // Your code here
    
    return count;
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
     * Returns the number of zeros in the array.
     */
    public static int solve(int n, int[] arr) {
        int count = 0;
        // Your code here
        
        return count;
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
    { input: '6\n1 0 2 0 0 3', expected: '3' },
    { input: '5\n0 0 0 0 0', expected: '5' },
    { input: '4\n1 2 3 4', expected: '0' },
    { input: '1\n0', expected: '1' },
    { input: '1\n10', expected: '0' },
    { input: '10\n0 5 0 2 0 3 0 4 0 1', expected: '5' },
    { input: '8\n-1 0 -2 0 100 0 50 0', expected: '4' },
    { input: '3\n1000000000 0 -1000000000', expected: '1' },
    { input: '2\n0 1', expected: '1' },
    { input: '7\n1 2 3 0 4 5 6', expected: '1' }
  ]
};