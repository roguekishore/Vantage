/**
 * Factorial — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer n
 *
 * Output format (stdout):
 *   Print the factorial of n.
 */

module.exports = {
  id: 'factorial',
  conquestId: 'stage21-3',
  title: 'Factorial',
  difficulty: 'Easy',
  category: 'Recursion',
  tags: ['Recursion', 'Math'],

  description: `
The **factorial** of a non-negative integer **n** is defined as:

- **0! = 1**
- **n! = n × (n − 1)!** for **n > 0**

Factorial represents the number of ways to arrange **n distinct objects**.

Examples:
- 1! = 1
- 3! = 3 × 2 × 1 = 6
- 5! = 5 × 4 × 3 × 2 × 1 = 120

Given an integer **n**, compute **n! (n factorial)**.

This problem is commonly solved using **recursion**, where each function call reduces the problem size by **1** until reaching the base case **0! = 1**.
`,

  examples: [
    {
      input: '5',
      output: '120',
      explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120.'
    }
  ],

  constraints: [
    '0 ≤ n ≤ 20',
    'The result fits within a 64-bit signed integer'
  ],

  boilerplate: {
    cpp: `#include <iostream>
using namespace std;

long long factorial(int n) {
    // TODO: Implement factorial using recursion or iteration
    return 0;
}

int main() {
    int n;
    cin >> n;

    cout << factorial(n);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static long factorial(int n) {
        // TODO: Implement factorial using recursion or iteration
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        System.out.print(factorial(n));
    }
}`,
  },

  testCases: [
    { input: '0', expected: '1' },
    { input: '1', expected: '1' },
    { input: '2', expected: '2' },
    { input: '3', expected: '6' },
    { input: '4', expected: '24' },
    { input: '5', expected: '120' },
    { input: '6', expected: '720' },
    { input: '10', expected: '3628800' },
    { input: '20', expected: '2432902008176640000' }
  ],
};