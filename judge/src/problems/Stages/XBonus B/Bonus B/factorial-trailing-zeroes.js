/**
 * Factorial Trailing Zeroes - Problem Definition
 *
 * Input format (stdin):
 *   A single integer n.
 *
 * Output format (stdout):
 *   Print the number of trailing zeroes in n!.
 */

module.exports = {
  id: 'factorial-trailing-zeroes',
  conquestId: 'bonusB-3',
  title: 'Magical Potential Echoes',
  difficulty: 'Medium',
  category: 'Math & Number Theory',
  tags: ['Math', 'Number Theory'],
  storyBriefing: `
In Arithmancy, the factorial of a number (\`n!\`) reveals its "deep magical potential." A key indicator of this potential is the number of trailing zeroes in the resulting integer. These zeroes are considered "echoes" of latent magical power.

Professor Vector challenges you to find an efficient way to count these echoes for any given number 'n' without needing to calculate the enormous factorial itself.
`,
  description: `Given an integer **n**, return the number of **trailing zeroes** in **n! (n factorial)**.

A trailing zero is created by a factor of **10**, and **10 = 2 × 5**.

In factorials, there are usually **more factors of 2 than 5**, so the number of trailing zeroes is determined by the number of **factors of 5** in the numbers from **1 to n**.

To compute this efficiently:

1. Count how many multiples of **5** exist in **n** → **n / 5**
2. Count additional factors from **25, 125, 625, ...**  
3. Continue dividing by **5** until the quotient becomes **0**

Total trailing zeroes =  
**⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + ...**

This runs in **O(log₅ n)** time and avoids computing the factorial.`,

  examples: [
    {
      input: '3',
      output: '0',
      explanation: '3! = 6 → no trailing zero.',
    },
    {
      input: '5',
      output: '1',
      explanation: '5! = 120 → one trailing zero.',
    },
    {
      input: '10',
      output: '2',
      explanation: '10! = 3628800 → two trailing zeroes.',
    },
  ],

  constraints: [
    '0 ≤ n ≤ 10^9',
  ],

  boilerplate: {
    cpp: `#include <iostream>

using namespace std;

int trailingZeroes(int n) {
    int count = 0;
    for (long long i = 5; n / i >= 1; i *= 5) {
        count += n / i;
    }
    return count;
}

int main() {
    int n;
    cin >> n;

    cout << trailingZeroes(n);
    return 0;
}`,
    java: `import java.util.*;

public class Main {

    public static int trailingZeroes(int n) {
        int count = 0;
        for (long i = 5; n / i >= 1; i *= 5) {
            count += n / i;
        }
        return count;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        System.out.print(trailingZeroes(n));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>

using namespace std;

int trailingZeroes(int n) {
    int count = 0;
    for (long long i = 5; n / i >= 1; i *= 5) {
        count += n / i;
    }
    return count;
}

int main() {
    int n;
    cin >> n;

    cout << trailingZeroes(n);
    return 0;
}`,
    java: `import java.util.*;

public class Main {

    public static int trailingZeroes(int n) {
        int count = 0;
        for (long i = 5; n / i >= 1; i *= 5) {
            count += n / i;
        }
        return count;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        System.out.print(trailingZeroes(n));
    }
}`,
  },

  testCases: [
    { input: '0', expected: '0' },
    { input: '3', expected: '0' },
    { input: '5', expected: '1' },
    { input: '10', expected: '2' },
    { input: '25', expected: '6' },
    { input: '50', expected: '12' },
    { input: '100', expected: '24' },
  ],
};