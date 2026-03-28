/**
 * Fibonacci - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n
 *
 * Output format (stdout):
 *   Print the n-th Fibonacci number.
 */

module.exports = {
  id: 'fibonacci',
  conquestId: 'stage21-2',
  title: 'The Time-Turner Room',
  difficulty: 'Easy',
  category: 'Recursion',
  tags: ['Recursion', 'Dynamic Programming', 'Fibonacci'],
  storyBriefing: `
You've entered the Time-Turner room, where past and future selves coexist. The flow of time here follows a strange magical sequence. The state of the room at any given moment 'n' is the sum of its states at the two preceding moments ('n-1' and 'n-2').

This is the Fibonacci sequence, a fundamental pattern in magic and nature. Your task is to calculate the state of the room at moment 'n'. Be wary; a simple recursive approach might trap you in an endless loop of past selves. An efficient solution is key.
`,
  description: `
The **Fibonacci sequence** is defined as:

- F(0) = 0  
- F(1) = 1  
- F(n) = F(n − 1) + F(n − 2) for n ≥ 2

Given an integer **n**, compute the **n-th Fibonacci number**.

The sequence begins as:

0, 1, 1, 2, 3, 5, 8, 13, 21, ...

You may solve this using:
- **Recursion**, or
- **Dynamic Programming / Iteration** for better efficiency.

Return the **n-th Fibonacci number**.
`,

  examples: [
    {
      input: '6',
      output: '8',
      explanation:
        'Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8. The 6th Fibonacci number is 8.'
    }
  ],

  constraints: [
    '0 ≤ n ≤ 45',
    'Result fits within a 32-bit signed integer'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

long long fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    vector<long long> dp(n + 1);
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

int main() {
    int n;
    cin >> n;

    cout << fibonacci(n);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static long fibonacci(int n) {
        if (n <= 1) {
            return n;
        }
        long[] dp = new long[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        System.out.print(fibonacci(n));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

long long fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    vector<long long> dp(n + 1);
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

int main() {
    int n;
    cin >> n;

    cout << fibonacci(n);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static long fibonacci(int n) {
        if (n <= 1) {
            return n;
        }
        long[] dp = new long[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        System.out.print(fibonacci(n));
    }
}`,
  },

  testCases: [
    { input: '0', expected: '0' },
    { input: '1', expected: '1' },
    { input: '2', expected: '1' },
    { input: '3', expected: '2' },
    { input: '5', expected: '5' },
    { input: '6', expected: '8' },
    { input: '7', expected: '13' },
    { input: '10', expected: '55' },
    { input: '20', expected: '6765' }
  ],
};