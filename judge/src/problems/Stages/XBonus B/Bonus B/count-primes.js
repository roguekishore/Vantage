/**
 * Count Primes — Problem Definition
 *
 * Input format (stdin):
 *   A single integer n.
 *
 * Output format (stdout):
 *   Print the number of prime numbers strictly less than n.
 */

module.exports = {
  id: 'count-primes',
  conquestId: 'bonusA-6',
  title: 'Count Primes',
  difficulty: 'Medium',
  category: 'Math',
  tags: ['Math', 'Sieve of Eratosthenes'],

  description: `Given an integer **n**, return the number of **prime numbers**
that are strictly **less than n**.

A **prime number** is a number greater than **1** that has no divisors other
than **1** and itself.

To solve this efficiently for large **n**, you can use the **Sieve of Eratosthenes**:

1. Create a boolean array to track prime numbers.
2. Initially mark all numbers as prime.
3. Starting from **2**, eliminate all multiples of each prime.
4. Continue this process up to **√n**.

Finally, count the numbers that remain marked as prime.

This approach runs in approximately **O(n log log n)** time.`,

  examples: [
    {
      input: '10',
      output: '4',
      explanation: 'Prime numbers less than 10 are: 2, 3, 5, 7.',
    },
    {
      input: '0',
      output: '0',
      explanation: 'There are no prime numbers less than 0.',
    },
    {
      input: '1',
      output: '0',
      explanation: 'There are no prime numbers less than 1.',
    },
  ],

  constraints: [
    '0 ≤ n ≤ 5 * 10^6',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int countPrimes(int n) {
    // TODO: Implement your solution here
    return 0;
}

int main() {
    int n;
    cin >> n;

    cout << countPrimes(n);
    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static int countPrimes(int n) {
        // TODO: Implement your solution here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        System.out.print(countPrimes(n));
    }
}
`,
  },

  testCases: [
    { input: '0', expected: '0' },
    { input: '1', expected: '0' },
    { input: '2', expected: '0' },
    { input: '3', expected: '1' },
    { input: '10', expected: '4' },
    { input: '20', expected: '8' },
    { input: '100', expected: '25' },
    { input: '1000', expected: '168' },
  ],
};