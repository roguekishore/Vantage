/**
 * Reverse Bits - Problem Definition
 *
 * Input format (stdin):
 *   A single 32-bit unsigned integer n.
 *
 * Output format (stdout):
 *   Print the integer obtained by reversing the bits of n.
 */

module.exports = {
  id: 'reverse-bits',
  conquestId: 'bonusA-4',
  title: 'Counter-Charm Dynamics',
  difficulty: 'Easy',
  category: 'Bit Manipulation',
  tags: ['Bit Manipulation'],
  storyBriefing: `
Professor Flitwick is teaching defensive magic. A particularly clever counter-charm works by perfectly reversing the bit pattern of an incoming spell's magical signature.

To master this defensive maneuver, you must practice taking a 32-bit magical signature (an unsigned integer) and reversing its bits.
`,
  description: `Reverse the bits of a given **32-bit unsigned integer**.

The task is to reverse the order of the bits in the binary representation
of the number. The least significant bit becomes the most significant bit,
and vice versa.

Example:
If the binary representation of the number is:

00000010100101000001111010011100

After reversing, it becomes:

00111001011110000010100101000000

You should treat the number as a **32-bit value** regardless of leading zeros.`,

  examples: [
    {
      input: '43261596',
      output: '964176192',
      explanation: `43261596 -> 
00000010100101000001111010011100

Reversed ->
00111001011110000010100101000000
= 964176192`,
    },
    {
      input: '4294967293',
      output: '3221225471',
      explanation: `4294967293 ->
11111111111111111111111111111101

Reversed ->
10111111111111111111111111111111`,
    },
  ],

  constraints: [
    '0 ≤ n ≤ 2³² - 1',
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <cstdint>

using namespace std;

uint32_t reverseBits(uint32_t n) {
    uint32_t result = 0;
    for (int i = 0; i < 32; ++i) {
        result <<= 1;
        if (n & 1) {
            result |= 1;
        }
        n >>= 1;
    }
    return result;
}

int main() {
    uint32_t n;
    cin >> n;

    cout << reverseBits(n);
    return 0;
}`,
    java: `import java.util.*;

public class Main {

    public static int reverseBits(int n) {
        int result = 0;
        for (int i = 0; i < 32; i++) {
            result <<= 1;
            if ((n & 1) == 1) {
                result |= 1;
            }
            n >>= 1;
        }
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();

        System.out.print(reverseBits((int)n));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <cstdint>

using namespace std;

uint32_t reverseBits(uint32_t n) {
    uint32_t result = 0;
    for (int i = 0; i < 32; ++i) {
        result <<= 1;
        if (n & 1) {
            result |= 1;
        }
        n >>= 1;
    }
    return result;
}

int main() {
    uint32_t n;
    cin >> n;

    cout << reverseBits(n);
    return 0;
}`,
    java: `import java.util.*;

public class Main {

    public static int reverseBits(int n) {
        int result = 0;
        for (int i = 0; i < 32; i++) {
            result <<= 1;
            if ((n & 1) == 1) {
                result |= 1;
            }
            n >>= 1;
        }
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();

        System.out.print(reverseBits((int)n));
    }
}`,
  },

  testCases: [
    { input: '0', expected: '0' },
    { input: '1', expected: '2147483648' },
    { input: '2', expected: '1073741824' },
    { input: '43261596', expected: '964176192' },
    { input: '4294967293', expected: '3221225471' },
    { input: '2147483648', expected: '1' },
  ],
};