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
  title: 'The Transfiguration Vault',
  difficulty: 'Hard',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'String'],
  storyBriefing: `
In this vault, two magical scrolls display ancient words. To open the treasure chest, you must determine the minimum number of magical operations (transfigurations) needed to change the first word into the second.

You have three spells at your disposal:
1.  **Insert**: Add a character.
2.  **Delete**: Remove a character.
3.  **Replace**: Change one character into another.

Each spell costs one operation. Find the most efficient sequence of spells.
`,
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
    cpp: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.length();
        int n = word2.length();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1));

        for (int i = 0; i <= m; i++) {
            for (int j = 0; j <= n; j++) {
                if (i == 0) {
                    dp[i][j] = j;
                } else if (j == 0) {
                    dp[i][j] = i;
                } else if (word1[i - 1] == word2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});
                }
            }
        }
        return dp[m][n];
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
            int m = word1.length();
            int n = word2.length();
            int[][] dp = new int[m + 1][n + 1];

            for (int i = 0; i <= m; i++) {
                for (int j = 0; j <= n; j++) {
                    if (i == 0) {
                        dp[i][j] = j;
                    } else if (j == 0) {
                        dp[i][j] = i;
                    } else if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                        dp[i][j] = dp[i - 1][j - 1];
                    } else {
                        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
                    }
                }
            }
            return dp[m][n];
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String word1 = sc.next();
        String word2 = sc.next();

        Solution sol = new Solution();
        System.out.print(sol.minDistance(word1, word2));
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