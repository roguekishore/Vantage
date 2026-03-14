/**
 * Recursion Call Stack Visualization — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer n
 *
 * Output format (stdout):
 *   Line 1: The factorial of n
 *   Line 2: The maximum recursion call stack depth reached while computing factorial(n)
 */

module.exports = {
  id: 'recursion-call-stack-visualization',
  conquestId: 'stage21-1',
  title: 'Recursion Call Stack Visualization',
  difficulty: 'Easy',
  category: 'Recursion',
  tags: ['Recursion', 'Call Stack', 'Factorial'],

  description: `
Recursion works by placing **function calls on a call stack**.  
Each recursive call adds a new **stack frame**, and when the function returns, the frame is removed.

In this problem, you must compute the **factorial of a number using recursion** and also determine the **maximum recursion depth (call stack height)** reached during the computation.

Factorial definition:

- factorial(0) = 1
- factorial(n) = n × factorial(n − 1)

Example call stack for **n = 3**:

main()  
→ factorial(3)  
→ factorial(2)  
→ factorial(1)  
→ factorial(0)

Maximum stack depth here is **4**.

Your task:
1. Compute **factorial(n)** using recursion.
2. Track the **maximum recursion depth** reached.
3. Print both values.

This problem helps visualize how **recursive calls grow and shrink the call stack**.
`,

  examples: [
    {
      input: '3',
      output: '6\n4',
      explanation:
        'factorial(3) = 6. The recursive chain is factorial(3) → factorial(2) → factorial(1) → factorial(0), giving a maximum depth of 4.'
    }
  ],

  constraints: [
    '0 ≤ n ≤ 12',
    'Factorial values fit within 32-bit integer range'
  ],

  boilerplate: {
    cpp: `#include <iostream>
using namespace std;

int maxDepth = 0;

long long factorial(int n, int depth) {
    // TODO: Track maximum recursion depth and compute factorial
    return 0;
}

int main() {
    int n;
    cin >> n;

    long long result = factorial(n, 1);

    cout << result << endl;
    cout << maxDepth;

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static int maxDepth = 0;

    static long factorial(int n, int depth) {
        // TODO: Track maximum recursion depth and compute factorial
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        long result = factorial(n, 1);

        System.out.println(result);
        System.out.print(maxDepth);
    }
}`,
  },

  testCases: [
    { input: '0', expected: '1\n1' },
    { input: '1', expected: '1\n2' },
    { input: '2', expected: '2\n3' },
    { input: '3', expected: '6\n4' },
    { input: '4', expected: '24\n5' },
    { input: '5', expected: '120\n6' },
    { input: '6', expected: '720\n7' },
    { input: '7', expected: '5040\n8' },
    { input: '10', expected: '3628800\n11' }
  ],
};