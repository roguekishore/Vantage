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
  title: 'The Symmetrical Prime',
  difficulty: 'Medium',
  category: 'Math & Number Theory',
  tags: ['Math', 'Prime', 'Palindrome'],
  storyBriefing: `
For your final Arithmancy exam, Professor Vector presents a truly esoteric challenge: finding a "Prime Palindrome." This is a number that is both a prime number and a palindrome (reads the same forwards and backward).

These numbers are considered to have perfect magical symmetry and are of great interest in advanced spellcraft. Your task is to find the smallest prime palindrome greater than or equal to a given number \`N\`. This will require combining your knowledge of number theory and numerical manipulation to pass the exam.
`,
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
    cpp: `#include <iostream>
#include <string>
#include <algorithm>
#include <cmath>

using namespace std;

bool is_prime(int n) {
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;
    for (int i = 3; i * i <= n; i += 2) {
        if (n % i == 0) return false;
    }
    return true;
}

int primePalindrome(int N) {
    if (N >= 8 && N <= 11) return 11;
    for (int x = 1; x < 100000; ++x) {
        string s = to_string(x), r(s);
        reverse(r.begin(), r.end());
        int y = stoi(s + r.substr(1));
        if (y >= N && is_prime(y)) return y;
    }
    return -1;
}

int main() {
    int n;
    cin >> n;
    cout << primePalindrome(n);
    return 0;
}`,
    java: `import java.util.Scanner;

public class Main {
    public static int primePalindrome(int N) {
        if (N >= 8 && N <= 11) return 11;
        for (int x = 1; x < 100000; x++) {
            String s = Integer.toString(x);
            String r = new StringBuilder(s).reverse().toString();
            int y = Integer.parseInt(s + r.substring(1));
            if (y >= N && isPrime(y)) return y;
        }
        return -1;
    }

    public static boolean isPrime(int n) {
        if (n < 2) return false;
        if (n == 2) return true;
        if (n % 2 == 0) return false;
        for (int i = 3; i * i <= n; i += 2) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(primePalindrome(n));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <string>
#include <algorithm>
#include <cmath>

using namespace std;

bool is_prime(int n) {
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;
    for (int i = 3; i * i <= n; i += 2) {
        if (n % i == 0) return false;
    }
    return true;
}

int primePalindrome(int N) {
    if (N >= 8 && N <= 11) return 11;
    for (int x = 1; x < 100000; ++x) {
        string s = to_string(x), r(s);
        reverse(r.begin(), r.end());
        int y = stoi(s + r.substr(1));
        if (y >= N && is_prime(y)) return y;
    }
    return -1;
}

int main() {
    int n;
    cin >> n;
    cout << primePalindrome(n);
    return 0;
}`,
    java: `import java.util.Scanner;

public class Main {
    public static int primePalindrome(int N) {
        if (N >= 8 && N <= 11) return 11;
        for (int x = 1; x < 100000; x++) {
            String s = Integer.toString(x);
            String r = new StringBuilder(s).reverse().toString();
            int y = Integer.parseInt(s + r.substring(1));
            if (y >= N && isPrime(y)) return y;
        }
        return -1;
    }

    public static boolean isPrime(int n) {
        if (n < 2) return false;
        if (n == 2) return true;
        if (n % 2 == 0) return false;
        for (int i = 3; i * i <= n; i += 2) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(primePalindrome(n));
    }
}`,
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