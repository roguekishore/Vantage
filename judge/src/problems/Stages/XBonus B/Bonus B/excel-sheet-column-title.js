/**
 * Excel Sheet Column Title - Problem Definition
 *
 * Input format (stdin):
 *   A single integer n.
 *
 * Output format (stdout):
 *   Print the corresponding Excel column title.
 */

module.exports = {
  id: 'excel-sheet-column-title',
  conquestId: 'bonusB-2',
  title: 'Excel Sheet Column Title',
  difficulty: 'Easy',
  category: 'Math',
  tags: ['Math', 'String'],

  description: `Given an integer **n**, return its corresponding **Excel column title**.

Excel columns follow this pattern:

A  -> 1  
B  -> 2  
...  
Z  -> 26  
AA -> 27  
AB -> 28  
...  

This is similar to converting a number into **base-26**, but with characters **A–Z** representing digits **1–26** instead of **0–25**.

To solve this:

1. While **n > 0**
2. Decrement **n** by 1 to handle 1-based indexing.
3. Get the remainder when dividing by **26**.
4. Convert the remainder to a character using **'A' + remainder**.
5. Append it to the result.
6. Divide **n** by **26** and repeat.

Finally reverse the result string.`,

  examples: [
    {
      input: '1',
      output: 'A',
      explanation: 'Column 1 corresponds to A.',
    },
    {
      input: '28',
      output: 'AB',
      explanation: '28 corresponds to column AB.',
    },
    {
      input: '701',
      output: 'ZY',
      explanation: '701 corresponds to column ZY.',
    },
  ],

  constraints: [
    '1 ≤ n ≤ 2^31 - 1',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

string convertToTitle(int n) {
    // TODO: Implement your solution here
    return "";
}

int main() {
    int n;
    cin >> n;

    cout << convertToTitle(n);
    return 0;
}
`,

    java: `import java.util.*;

public class Main {

    public static String convertToTitle(int n) {
        // TODO: Implement your solution here
        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        System.out.print(convertToTitle(n));
    }
}
`,
  },

  testCases: [
    { input: '1', expected: 'A' },
    { input: '2', expected: 'B' },
    { input: '26', expected: 'Z' },
    { input: '27', expected: 'AA' },
    { input: '28', expected: 'AB' },
    { input: '52', expected: 'AZ' },
    { input: '701', expected: 'ZY' },
    { input: '702', expected: 'ZZ' },
    { input: '703', expected: 'AAA' },
  ],
};