/**
 * Power of Two - Problem Definition
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
  title: 'Magical Resonance Check',
  difficulty: 'Easy',
  category: 'Bit Manipulation',
  tags: ['Bit Manipulation', 'Math'],
  storyBriefing: `
Professor Flitwick explains that a spell's energy is perfectly stable only if its magical frequency (an integer) is a power of two. Any other frequency can cause unpredictable, and often humorous, side effects.

You need to create a simple diagnostic charm that takes a frequency 'n' and determines if it will produce a stable spell.
`,
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
    cpp: `#include <iostream>

using namespace std;

bool isPowerOfTwo(long long n) {
    if (n <= 0) return false;
    return (n & (n - 1)) == 0;
}

int main() {
    long long n;
    cin >> n;

    cout << (isPowerOfTwo(n) ? "true" : "false");
    return 0;
}`,
    java: `import java.util.*;

public class Main {

    public static boolean isPowerOfTwo(long n) {
        if (n <= 0) return false;
        return (n & (n - 1)) == 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();

        System.out.print(isPowerOfTwo(n) ? "true" : "false");
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>

using namespace std;

bool isPowerOfTwo(long long n) {
    if (n <= 0) return false;
    return (n & (n - 1)) == 0;
}

int main() {
    long long n;
    cin >> n;

    cout << (isPowerOfTwo(n) ? "true" : "false");
    return 0;
}`,
    java: `import java.util.*;

public class Main {

    public static boolean isPowerOfTwo(long n) {
        if (n <= 0) return false;
        return (n & (n - 1)) == 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();

        System.out.print(isPowerOfTwo(n) ? "true" : "false");
    }
}`,
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