/**
 * Find Maximum Element - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single integer representing the maximum value found in the array.
 */

module.exports = {
  id: 'find-max-element',
  conquestId: 'stage1-1',
  title: 'Find Maximum Element',
  difficulty: 'Easy',
  category: 'Absolute Programming Basics',
  tags: ['Array', 'Basics', 'Traversal'],

  stageIntro: `Your Hogwarts acceptance letter has finally arrived. Harry steps off the Hogwarts Express, crosses the black lake with Hagrid, and enters the Great Hall for the Sorting Ceremony. Dumbledore rises at the staff table and spreads his arms wide. "Another year, another chance to prove yourselves. Magic, young witches and wizards, is built on logic as much as instinct. Your first week begins now."`,

  storyBriefing: `Your first class is Potions with Professor Snape. He lines a row of cauldrons along the dungeon wall, each bubbling at a different temperature. "Tell me," Snape says quietly, robes sweeping the cold stone floor, "which of these cauldrons burns the hottest? I suggest you answer correctly - or points will be lost before this week has even begun."`,

  description: `You are given an array of n integers. Return the largest element in the array.

Traverse the array from left to right, maintaining the greatest value seen so far. Initialize your running maximum with the first element, then update it whenever you encounter a larger value.

Do not use built-in sort or max functions. Return a single integer - the maximum element in the array.`,

  examples: [
    {
      input: '5\n3 1 4 1 5',
      output: '5',
      explanation: 'Scanning left to right: max = 3, then 1 < 3 (no change), then 4 > 3 (max = 4), then 1 < 4 (no change), then 5 > 4 (max = 5). Return 5.'
    },
    {
      input: '4\n-3 -1 -4 -2',
      output: '-1',
      explanation: 'All values are negative. Scanning gives max = -3, then -1 > -3 (max = -1), then -4 < -1 (no change), then -2 < -1 (no change). Return -1.'
    },
    {
      input: '1\n7',
      output: '7',
      explanation: 'With only one element, the maximum is trivially 7.'
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
 * Returns the maximum element in the array.
 */
int solve(int n, const vector<int>& arr) {
    int maxVal = arr;
    // Your code here
    
    return maxVal;
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
     * Returns the maximum element in the array.
     */
    public static int solve(int n, int[] arr) {
        int maxVal = arr;
        // Your code here
        
        return maxVal;
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
    { input: '5\n1 5 3 9 2', expected: '9' },
    { input: '1\n42', expected: '42' },
    { input: '4\n-1 -2 -3 -4', expected: '-1' },
    { input: '3\n100 100 100', expected: '100' },
    { input: '6\n10 20 30 5 2 1', expected: '30' },
    { input: '5\n0 0 0 0 0', expected: '0' },
    { input: '2\n-1000000000 1000000000', expected: '1000000000' },
    { input: '4\n5 4 3 2', expected: '5' },
    { input: '10\n1 2 3 4 5 6 7 8 9 10', expected: '10' },
    { input: '8\n-50 0 -100 25 30 -10 40 5', expected: '40' }
  ]
};