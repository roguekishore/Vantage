/**
 * Prime Palindrome - Problem Definition
 *
 * Input format (stdin):
 *   A single integer n.
 *
 * Output format (stdout):
 *   Print the smallest prime palindrome greater than or equal to n.
 */

module.exports = {
  id: 'prime-palindrome',
  conquestId: 'bonusB-5',
  title: 'Prime Palindrome',
  difficulty: 'Medium',
  category: 'Math',
  tags: ['Math', 'Prime', 'Palindrome'],

  description: `Given an integer **n**, return the **smallest prime palindrome** that is **greater than or equal to n**.

A **prime number** is a number greater than 1 that has no positive divisors other than **1 and itself**.

A **palindrome** is a number that reads the same forward and backward.

To solve this problem:

1. Start from **n** and check numbers one by one.
2. For each number:
   - Check if it is a **palindrome**.
   - Check if it is **prime**.
3. Return the first number that satisfies both conditions.

Optimizations:
- All **even-length palindromes greater than 11 are divisible by 11**, so they cannot be prime.
- Therefore, we can generate only **odd-length palindromes** (except 11) to reduce checks.

Constraints allow checking values up to **2 × 10⁸**, so efficient palindrome generation and primality checking is important.`,

  examples: [
    {
      input: '6',
      output: '7',
      explanation: '7 is the smallest prime palindrome ≥ 6.',
    },
    {
      input: '8',
      output: '11',
      explanation: '11 is both prime and palindrome.',
    },
    {
      input: '13',
      output: '101',
      explanation: '101 is the next prime palindrome ≥ 13.',
    },
  ],

  constraints: [
    '1 ≤ n ≤ 2 * 10^8',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

bool isPrime(int x) {
    // TODO: implement prime check
    return false;
}

bool isPalindrome(int x) {
    // TODO: implement palindrome check
    return false;
}

int primePalindrome(int n) {
    // TODO: Implement your solution here
    return 0;
}

int main() {
    int n;
    cin >> n;

    cout << primePalindrome(n);
    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static boolean isPrime(int x) {
        // TODO: implement prime check
        return false;
    }

    public static boolean isPalindrome(int x) {
        // TODO: implement palindrome check
        return false;
    }

    public static int primePalindrome(int n) {
        // TODO: Implement your solution here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        System.out.print(primePalindrome(n));
    }
}
`,
  },

  testCases: [
    { input: '1', expected: '2' },
    { input: '6', expected: '7' },
    { input: '8', expected: '11' },
    { input: '13', expected: '101' },
    { input: '31', expected: '101' },
    { input: '100', expected: '101' },
  ],
};