/**
 * Single Number — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer `n` — number of elements in the array
 *   Line 2: `n` space-separated integers
 *
 * Output format (stdout):
 *   Print the element that appears exactly once.
 *
 * Note:
 *   Every element appears twice except for one.
 */

module.exports = {
  id: 'single-number',
  conquestId: 'stage6-1',
  title: 'Single Number',
  difficulty: 'Easy',
  category: 'Bit Manipulation',
  tags: ['Bit Manipulation', 'Array', 'XOR'],

  description: `
Given a **non-empty array of integers**, every element appears **twice except for one**.

Find and return the element that appears **only once**.

You must implement a solution with:
- **Linear runtime complexity O(n)**
- **Constant extra space O(1)**

Hint: XOR has useful properties:
- a ^ a = 0
- a ^ 0 = a
`,

  examples: [
    {
      input: `3
2 2 1`,
      output: `1`,
      explanation: `Only number 1 appears once.`,
    },
    {
      input: `5
4 1 2 1 2`,
      output: `4`,
      explanation: `Numbers 1 and 2 appear twice. 4 appears once.`,
    },
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    '-10^9 ≤ nums[i] ≤ 10^9',
    'Exactly one element appears once',
    'All other elements appear exactly twice',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int singleNumber(vector<int>& nums) {
    
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin >> n;

    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    cout << singleNumber(nums) << "\\n";

    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static int singleNumber(int[] nums) {

    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[] nums = new int[n];

        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }

        System.out.println(singleNumber(nums));

        sc.close();
    }
}
`,
  },

  testCases: [
    {
      input: `1
7`,
      expected: `7`,
    },
    {
      input: `3
2 2 1`,
      expected: `1`,
    },
    {
      input: `5
4 1 2 1 2`,
      expected: `4`,
    },
    {
      input: `7
5 3 5 4 3 4 9`,
      expected: `9`,
    },
    {
      input: `9
10 20 30 10 20 30 40 50 40`,
      expected: `50`,
    },
    {
      input: `5
-1 -1 -2 -2 -3`,
      expected: `-3`,
    },
    {
      input: `3
1000000000 5 5`,
      expected: `1000000000`,
    },
    {
      input: `7
8 8 6 6 3 2 2`,
      expected: `3`,
    },
  ],
};