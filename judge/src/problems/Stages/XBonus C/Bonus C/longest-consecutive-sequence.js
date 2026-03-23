/**
 * Longest Consecutive Sequence - Problem Definition
 *
 * Input format (stdin):
 *   First line: integer n (size of array)
 *   Second line: n space-separated integers
 *
 * Output format (stdout):
 *   Print the length of the longest consecutive elements sequence.
 */

module.exports = {
  id: 'longest-consecutive-sequence',
  conquestId: 'bonusC-1',
  title: 'Longest Consecutive Sequence',
  difficulty: 'Medium',
  category: 'Array',
  tags: ['Array', 'Hash Set'],

  description: `Given an **unsorted array of integers**, return the **length of the longest consecutive elements sequence**.

A consecutive sequence means numbers appear in order with a difference of **1**, for example:  
1, 2, 3, 4

The algorithm must run in **O(n)** time.

Efficient approach:

1. Insert all elements into a **HashSet**.
2. Iterate through each number in the set.
3. Only start counting when the number is the **start of a sequence**  
   (i.e., **num - 1 is not in the set**).
4. Expand the sequence while **num + 1 exists** in the set.
5. Track the **maximum length** encountered.

This ensures each number is processed only once.`,

  examples: [
    {
      input: `6
100 4 200 1 3 2`,
      output: '4',
      explanation: 'The longest consecutive sequence is 1, 2, 3, 4.',
    },
    {
      input: `7
0 3 7 2 5 8 4`,
      output: '4',
      explanation: 'The longest consecutive sequence is 2, 3, 4, 5.',
    },
  ],

  constraints: [
    '0 ≤ n ≤ 10^5',
    '-10^9 ≤ nums[i] ≤ 10^9',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int longestConsecutive(vector<int>& nums) {
    // TODO: Implement your solution here
    return 0;
}

int main() {
    int n;
    cin >> n;

    vector<int> nums(n);
    for(int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    cout << longestConsecutive(nums);
    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static int longestConsecutive(int[] nums) {
        // TODO: Implement your solution here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[] nums = new int[n];

        for(int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }

        System.out.print(longestConsecutive(nums));
    }
}
`,
  },

  testCases: [
    { input: `0\n`, expected: '0' },
    { input: `1\n5`, expected: '1' },
    { input: `6\n100 4 200 1 3 2`, expected: '4' },
    { input: `7\n0 3 7 2 5 8 4`, expected: '4' },
    { input: `8\n1 2 0 1 3 4 5 6`, expected: '7' },
  ],
};