/**
 * Power of Two — Problem Definition
 *
 * Input format (stdin):
 *   A single integer n.
 *
 * Output format (stdout):
 *   Print "true" if n is a power of two, otherwise print "false".
 */

module.exports = {
  id: 'power-of-two',
  conquestId: 'bonusA-5',
  title: 'Power of Two',
  difficulty: 'Easy',
  category: 'Bit Manipulation',
  tags: ['Bit Manipulation', 'Math'],

  description: `Given an integer **n**, determine whether it is a **power of two**.

An integer is a power of two if there exists an integer **x** such that:

2^x = n

Examples of powers of two:
1, 2, 4, 8, 16, 32, ...

A common and efficient bit manipulation trick is:

n > 0 and (n & (n - 1)) == 0

Explanation:
- A power of two has exactly **one bit set** in binary.
- Subtracting 1 flips that bit and all lower bits.
- Performing **n & (n - 1)** removes the lowest set bit.
- If the result becomes **0**, then there was only one set bit.`,

  examples: [
    {
      input: '1',
      output: 'true',
      explanation: '2^0 = 1, so it is a power of two.',
    },
    {
      input: '16',
      output: 'true',
      explanation: '2^4 = 16.',
    },
    {
      input: '3',
      output: 'false',
      explanation: '3 cannot be expressed as 2^x.',
    },
    {
      input: '0',
      output: 'false',
      explanation: '0 is not a power of two.',
    },
  ],

  constraints: [
    '-2^31 ≤ n ≤ 2^31 - 1',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool isPowerOfTwo(long long n) {
    // TODO: Implement your solution here
    return false;
}

int main() {
    long long n;
    cin >> n;

    cout << (isPowerOfTwo(n) ? "true" : "false");
    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static boolean isPowerOfTwo(long n) {
        // TODO: Implement your solution here
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();

        System.out.print(isPowerOfTwo(n) ? "true" : "false");
    }
}
`,
  },

  testCases: [
    { input: '0', expected: 'false' },
    { input: '1', expected: 'true' },
    { input: '2', expected: 'true' },
    { input: '3', expected: 'false' },
    { input: '4', expected: 'true' },
    { input: '16', expected: 'true' },
    { input: '31', expected: 'false' },
    { input: '1024', expected: 'true' },
    { input: '-2', expected: 'false' },
  ],
};