/**
 * Edit Distance - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: A string word1
 *   Line 2: A string word2
 *
 * Output format (stdout):
 *   Print a single integer representing the minimum number of operations
 *   required to convert word1 into word2.
 */

module.exports = {
  id: 'edit-distance',
  conquestId: 'stage22-6',
  title: 'Edit Distance',
  difficulty: 'Hard',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'String'],

  description: `
Given two strings **word1** and **word2**, return the **minimum number of operations** required to convert **word1** into **word2**.

You are allowed to perform the following operations:

- **Insert** a character
- **Delete** a character
- **Replace** a character

This problem is also known as the **Levenshtein Distance**.

Define:

- \`dp[i][j]\` = minimum number of operations required to convert the first **i characters of word1** into the first **j characters of word2**.

Transition:

- If characters match:

  \`dp[i][j] = dp[i-1][j-1]\`

- If characters differ:

  \`dp[i][j] = 1 + min(
      dp[i-1][j],    // delete
      dp[i][j-1],    // insert
      dp[i-1][j-1]   // replace
  )\`

Base cases:

- Converting empty string to length **j** requires **j insertions**
- Converting length **i** to empty string requires **i deletions**
`,

  examples: [
    {
      input: 'horse\nros',
      output: '3',
      explanation: 'horse → rorse (replace h with r), rorse → rose (delete r), rose → ros (delete e).'
    },
    {
      input: 'intention\nexecution',
      output: '5',
      explanation: 'Minimum operations required is 5.'
    },
    {
      input: 'abc\nabc',
      output: '0',
      explanation: 'Both strings are identical.'
    }
  ],

  constraints: [
    '0 ≤ word1.length, word2.length ≤ 500',
    'word1 and word2 consist of lowercase English letters'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minDistance(string word1, string word2) {
        // TODO: Implement DP solution
        return 0;
    }
};

int main() {
    string word1, word2;
    cin >> word1;
    cin >> word2;

    Solution sol;
    cout << sol.minDistance(word1, word2);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public int minDistance(String word1, String word2) {
            // TODO: Implement DP solution
            return 0;
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        String word1 = sc.next();
        String word2 = sc.next();

        Solution sol = new Solution();
        System.out.print(sol.minDistance(word1, word2));

        sc.close();
    }
}`
  },

  testCases: [
    { input: 'horse\nros', expected: '3' },
    { input: 'intention\nexecution', expected: '5' },
    { input: 'abc\nabc', expected: '0' },
    { input: 'abc\n', expected: '3' },
    { input: '\nabc', expected: '3' },
    { input: 'kitten\nsitting', expected: '3' },
    { input: 'flaw\nlawn', expected: '2' },
    { input: 'a\nb', expected: '1' },
    { input: 'abcd\nabdc', expected: '2' },
    { input: 'algorithm\naltruistic', expected: '6' }
  ],
};