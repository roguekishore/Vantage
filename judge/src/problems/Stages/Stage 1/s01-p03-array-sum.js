/**
 * Array Sum - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single integer representing the sum of all elements in the array.
 */

module.exports = {
  id: 'array-sum',
  conquestId: 'stage1-3',
  title: 'Array Sum',
  difficulty: 'Easy',
  category: 'Absolute Programming Basics',
  tags: ['Array', 'Basics', 'Sequential Access'],

  storyBriefing: `Hermione pulls you aside after Potions, her copy of Magical Drafts and Potions already annotated in three colours. "Snape is giving us a practical exam tomorrow," she whispers urgently. "We need the exact total heat output of every cauldron in the dungeon combined. I've listed them all - you do the sum, I'll write it up before he notices."`,

  description: `You are given an array of n integers. Return the sum of all elements in the array.

Traverse the array from left to right, adding each element to a running total. The final sum may exceed the range of a 32-bit integer (+/-2.1 billion), so use a 64-bit integer to accumulate the result - long long in C++, long in Java.

Return a single integer - the total sum of all elements.`,

  examples: [
    {
      input: '5\n1 2 3 4 5',
      output: '15',
      explanation: 'Running total: 0 -> 1 -> 3 -> 6 -> 10 -> 15. Return 15.'
    },
    {
      input: '4\n-3 5 -1 7',
      output: '8',
      explanation: 'Running total: 0 -> -3 -> 2 -> 1 -> 8. Negative values decrease the total; positive values increase it. Return 8.'
    },
    {
      input: '3\n0 0 0',
      output: '0',
      explanation: 'All elements are zero. The sum is 0.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10⁵',
    '-10⁹ ≤ array[i] ≤ 10⁹',
    'The array contains at least one element.',
    'The total sum fits within a 64-bit signed integer.'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>

using namespace std;

/**
 * Returns the sum of all elements in the array.
 */
long long solve(int n, const vector<int>& arr) {
    long long totalSum = 0;
    // Your code here
    
    return totalSum;
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
     * Returns the sum of all elements in the array.
     */
    public static long solve(int n, int[] arr) {
        long totalSum = 0;
        // Your code here
        
        return totalSum;
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
    { input: '5\n1 2 3 4 5', expected: '15' },
    { input: '1\n100', expected: '100' },
    { input: '4\n-1 -2 -3 -4', expected: '-10' },
    { input: '3\n0 0 0', expected: '0' },
    { input: '2\n1000000000 1000000000', expected: '2000000000' },
    { input: '5\n10 -10 20 -20 30', expected: '30' },
    { input: '6\n1 1 1 1 1 1', expected: '6' },
    { input: '2\n-1000000000 -1000000000', expected: '-2000000000' },
    { input: '1\n0', expected: '0' },
    { input: '10\n1 2 3 4 5 6 7 8 9 10', expected: '55' }
  ]
};