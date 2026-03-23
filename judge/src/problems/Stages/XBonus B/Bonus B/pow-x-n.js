/**
 * Pow(x, n) - Problem Definition
 *
 * Input format (stdin):
 *   Two numbers:
 *   x (double) and n (integer)
 *
 * Output format (stdout):
 *   Print x raised to the power n.
 */

module.exports = {
  id: 'pow-x-n',
  conquestId: 'bonusB-4',
  title: 'Pow(x, n)',
  difficulty: 'Medium',
  category: 'Math',
  tags: ['Math', 'Recursion', 'Binary Exponentiation'],

  description: `Implement a function **pow(x, n)** which calculates **x raised to the power n (xⁿ)**.

The naive solution multiplies **x** by itself **n** times, resulting in **O(n)** time complexity.  
A more efficient approach is **Binary Exponentiation (Exponentiation by Squaring)** which reduces the complexity to **O(log n)**.

Key ideas:

1. If **n = 0**, return **1**.
2. If **n < 0**, compute **1 / pow(x, -n)**.
3. Recursively compute **half = pow(x, n / 2)**.
4. If **n** is even → **result = half × half**.
5. If **n** is odd → **result = half × half × x**.

This technique dramatically reduces the number of multiplications needed.`,

  examples: [
    {
      input: '2.00000 10',
      output: '1024.00000',
      explanation: '2¹⁰ = 1024',
    },
    {
      input: '2.10000 3',
      output: '9.26100',
      explanation: '2.1³ = 9.261',
    },
    {
      input: '2.00000 -2',
      output: '0.25000',
      explanation: '2⁻² = 1 / 4 = 0.25',
    },
  ],

  constraints: [
    '-100.0 < x < 100.0',
    '-2^31 ≤ n ≤ 2^31 - 1',
    'n is an integer',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

double myPow(double x, int n) {
    // TODO: Implement your solution here
    return 0.0;
}

int main() {
    double x;
    int n;
    cin >> x >> n;

    cout << fixed << setprecision(5) << myPow(x, n);
    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static double myPow(double x, int n) {
        // TODO: Implement your solution here
        return 0.0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double x = sc.nextDouble();
        int n = sc.nextInt();

        System.out.printf("%.5f", myPow(x, n));
    }
}
`,
  },

  testCases: [
    { input: '2.0 10', expected: '1024.00000' },
    { input: '2.1 3', expected: '9.26100' },
    { input: '2.0 -2', expected: '0.25000' },
    { input: '5.0 0', expected: '1.00000' },
    { input: '1.5 4', expected: '5.06250' },
  ],
};