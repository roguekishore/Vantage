/**
 * Counting Bits — Problem Definition
 *
 * Input format (stdin):
 *   A single integer n.
 *
 * Output format (stdout):
 *   Print n + 1 integers separated by spaces where the i-th number
 *   represents the number of 1 bits in the binary representation of i.
 */

module.exports = {
  id: 'counting-bits',
  conquestId: 'bonusA-3',
  title: 'Counting Bits',
  difficulty: 'Easy',
  category: 'Bit Manipulation',
  tags: ['Bit Manipulation', 'Dynamic Programming'],

  description: `Given an integer **n**, return an array **ans** of length **n + 1**
where **ans[i]** is the number of **1 bits** in the binary representation of **i**.

The number of set bits in a number can be efficiently computed using a
dynamic programming relation:

If we remove the least significant bit:
- **ans[i] = ans[i >> 1] + (i & 1)**

Where:
- **i >> 1** shifts the number right by one bit
- **i & 1** checks whether the least significant bit is 1

Your task is to compute the set bit counts for all numbers from **0 to n**.

The solution should run in **O(n)** time.`,

  examples: [
    {
      input: '2',
      output: '0 1 1',
      explanation: `0 -> 0
1 -> 1
2 -> 10 -> 1`,
    },
    {
      input: '5',
      output: '0 1 1 2 1 2',
      explanation: `0 -> 0
1 -> 1
2 -> 10 -> 1
3 -> 11 -> 2
4 -> 100 -> 1
5 -> 101 -> 2`,
    },
  ],

  constraints: [
    '0 ≤ n ≤ 10^5',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> countBits(int n) {
    // TODO: Implement your solution here
    return {};
}

int main() {
    int n;
    cin >> n;

    vector<int> result = countBits(n);

    for (int i = 0; i < result.size(); i++) {
        if (i) cout << " ";
        cout << result[i];
    }

    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static int[] countBits(int n) {
        // TODO: Implement your solution here
        return new int[0];
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        int[] result = countBits(n);

        for (int i = 0; i < result.length; i++) {
            if (i > 0) System.out.print(" ");
            System.out.print(result[i]);
        }
    }
}
`,
  },

  testCases: [
    { input: '0', expected: '0' },
    { input: '1', expected: '0 1' },
    { input: '2', expected: '0 1 1' },
    { input: '3', expected: '0 1 1 2' },
    { input: '5', expected: '0 1 1 2 1 2' },
    { input: '10', expected: '0 1 1 2 1 2 2 3 1 2 2' },
  ],
};