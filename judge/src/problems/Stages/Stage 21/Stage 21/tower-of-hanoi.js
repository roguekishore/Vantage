/**
 * Tower of Hanoi - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer n - number of disks
 *
 * Output format (stdout):
 *   Print the minimum number of moves required to move all disks
 *   from source peg to destination peg using Tower of Hanoi rules.
 */

module.exports = {
  id: 'tower-of-hanoi',
  conquestId: 'stage21-5',
  title: 'Tower of Hanoi',
  difficulty: 'Medium',
  category: 'Recursion',
  tags: ['Recursion', 'Backtracking', 'Mathematics'],

  description: `
The **Tower of Hanoi** is a classic recursive problem involving three rods:

- **Source**
- **Auxiliary**
- **Destination**

There are **n disks** of different sizes stacked on the source rod.  
The objective is to move the entire stack to the destination rod following these rules:

1. Only **one disk** can be moved at a time.
2. A disk can only be placed on **top of a larger disk**.
3. Only the **top disk** of any rod can be moved.

The minimum number of moves required to solve the Tower of Hanoi problem follows the formula:

moves(n) = 2ⁿ − 1

Your task is to compute the **minimum number of moves required** to move **n disks** from the source rod to the destination rod.

This problem demonstrates the power of **recursion**, where the solution for **n disks** is built from the solution for **n − 1 disks**.
`,

  examples: [
    {
      input: '3',
      output: '7',
      explanation: 'Minimum moves required = 2³ − 1 = 7.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 30',
    'The result fits within a 64-bit signed integer'
  ],

  boilerplate: {
    cpp: `#include <iostream>
using namespace std;

long long towerOfHanoi(int n) {
    // TODO: Compute minimum moves using recursion or formula
    return 0;
}

int main() {
    int n;
    cin >> n;

    cout << towerOfHanoi(n);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static long towerOfHanoi(int n) {
        // TODO: Compute minimum moves using recursion or formula
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        System.out.print(towerOfHanoi(n));
    }
}`,
  },

  testCases: [
    { input: '1', expected: '1' },
    { input: '2', expected: '3' },
    { input: '3', expected: '7' },
    { input: '4', expected: '15' },
    { input: '5', expected: '31' },
    { input: '6', expected: '63' },
    { input: '7', expected: '127' },
    { input: '10', expected: '1023' },
    { input: '20', expected: '1048575' }
  ],
};