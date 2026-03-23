/**
 * Permutations - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer n - number of elements
 *   Line 2: n space-separated integers
 *
 * Output format (stdout):
 *   Print the total number of distinct permutations that can be formed
 *   using all elements of the array.
 */

module.exports = {
  id: 'permutations',
  conquestId: 'stage21-7',
  title: 'Permutations',
  difficulty: 'Medium',
  category: 'Recursion',
  tags: ['Recursion', 'Backtracking', 'Permutations'],

  description: `
A **permutation** is an arrangement of elements in a specific order.

Given **n distinct integers**, your task is to determine how many **different permutations** can be formed using **all the elements exactly once**.

For example:

Array: [1, 2, 3]

Permutations:
1 2 3  
1 3 2  
2 1 3  
2 3 1  
3 1 2  
3 2 1  

Total permutations = **6**

In general, the number of permutations of **n distinct elements** is:

**n! (n factorial)**

You may implement this using **recursion/backtracking** to generate permutations, or directly compute **n!**.

Return the **total number of permutations**.
`,

  examples: [
    {
      input: '3\n1 2 3',
      output: '6',
      explanation: 'There are 3! = 6 permutations.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 12',
    'Array elements are distinct integers'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

long long countPermutations(int n) {
    // TODO: Compute number of permutations using recursion or factorial
    return 0;
}

int main() {
    int n;
    cin >> n;

    vector<int> arr(n);
    for(int i = 0; i < n; i++)
        cin >> arr[i];

    cout << countPermutations(n);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static long countPermutations(int n) {
        // TODO: Compute number of permutations using recursion or factorial
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[] arr = new int[n];
        for(int i = 0; i < n; i++)
            arr[i] = sc.nextInt();

        System.out.print(countPermutations(n));
    }
}`,
  },

  testCases: [
    { input: '1\n5', expected: '1' },
    { input: '2\n1 2', expected: '2' },
    { input: '3\n1 2 3', expected: '6' },
    { input: '4\n1 2 3 4', expected: '24' },
    { input: '5\n1 2 3 4 5', expected: '120' },
    { input: '6\n1 2 3 4 5 6', expected: '720' },
    { input: '7\n1 2 3 4 5 6 7', expected: '5040' },
    { input: '8\n1 2 3 4 5 6 7 8', expected: '40320' },
    { input: '10\n1 2 3 4 5 6 7 8 9 10', expected: '3628800' }
  ],
};