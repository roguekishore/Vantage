/**
 * Number of 1 Bits - Problem Definition
 *
 * Input format (stdin):
 *   A single integer n representing a non-negative integer.
 *
 * Output format (stdout):
 *   Print a single integer - the number of '1' bits in the binary
 *   representation of n (also known as the Hamming weight).
 */

module.exports = {
  id: 'number-of-1-bits',
  conquestId: 'bonusA-2',
  title: 'Number of 1 Bits',
  difficulty: 'Easy',
  category: 'Bit Manipulation',
  tags: ['Bit Manipulation'],

  description: `Given a non-negative integer **n**, return the number of **1 bits**
in its binary representation (also known as the **Hamming weight**).

The binary representation of a number consists of **0s and 1s**. Your task is
to count how many **1s** appear in that representation.

A common efficient approach uses **bit manipulation**, repeatedly removing
the lowest set bit using:

\`n = n & (n - 1)\`

This operation clears the lowest set bit each time, allowing you to count
the number of set bits efficiently.

**Note:** Assume the input fits within a 32-bit unsigned integer.`,

  examples: [
    {
      input: '11',
      output: '3',
      explanation: '11 in binary is 1011, which contains three 1 bits.',
    },
    {
      input: '128',
      output: '1',
      explanation: '128 in binary is 10000000, which contains one 1 bit.',
    },
    {
      input: '0',
      output: '0',
      explanation: '0 has no set bits.',
    },
  ],

  constraints: [
    '0 ≤ n ≤ 2³¹ - 1',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int countBits(int n) {
    // TODO: Implement your solution here
    return 0;
}

int main() {
    long long n;
    cin >> n;

    cout << countBits((int)n);
    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static int countBits(int n) {
        // TODO: Implement your solution here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        System.out.print(countBits(n));
    }
}
`,
  },

  testCases: [
    { input: '0', expected: '0' },
    { input: '1', expected: '1' },
    { input: '2', expected: '1' },
    { input: '3', expected: '2' },
    { input: '7', expected: '3' },
    { input: '11', expected: '3' },
    { input: '128', expected: '1' },
    { input: '255', expected: '8' },
    { input: '1023', expected: '10' },
    { input: '2147483647', expected: '31' },
  ],
};