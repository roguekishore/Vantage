/**
 * Longest Common Subsequence - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: A string text1
 *   Line 2: A string text2
 *
 * Output format (stdout):
 *   Print a single integer representing the length of the longest common subsequence.
 */

module.exports = {
  id: 'longest-common-subsequence',
  conquestId: 'stage22-5',
  title: 'Longest Common Subsequence',
  difficulty: 'Medium',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Strings'],

  description: `
Given two strings **text1** and **text2**, return the **length of their longest common subsequence (LCS)**.

A **subsequence** of a string is a new string generated from the original string with some characters (possibly none) deleted **without changing the relative order of the remaining characters**.

A **common subsequence** is a subsequence that appears in **both strings**.

For example:
- For \`text1 = "abcde"\` and \`text2 = "ace"\`, the longest common subsequence is **"ace"**, which has length **3**.

If there is **no common subsequence**, return **0**.

This problem is commonly solved using **Dynamic Programming**.

Define:
- \`dp[i][j]\` = length of LCS of the first **i characters of text1** and the first **j characters of text2**.

Transition:
- If characters match:  
  \`dp[i][j] = 1 + dp[i-1][j-1]\`
- Otherwise:  
  \`dp[i][j] = max(dp[i-1][j], dp[i][j-1])\`
`,

  examples: [
    {
      input: 'abcde\nace',
      output: '3',
      explanation: 'The LCS is "ace" which has length 3.'
    },
    {
      input: 'abc\nabc',
      output: '3',
      explanation: 'The entire string matches.'
    },
    {
      input: 'abc\ndef',
      output: '0',
      explanation: 'There are no common characters.'
    }
  ],

  constraints: [
    '1 ≤ text1.length, text2.length ≤ 1000',
    'text1 and text2 consist of lowercase English letters'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        // TODO: Implement DP solution
        return 0;
    }
};

int main() {
    string text1, text2;
    cin >> text1;
    cin >> text2;

    Solution sol;
    cout << sol.longestCommonSubsequence(text1, text2);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public int longestCommonSubsequence(String text1, String text2) {
            // TODO: Implement DP solution
            return 0;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        String text1 = sc.next();
        String text2 = sc.next();

        Solution sol = new Solution();
        System.out.print(sol.longestCommonSubsequence(text1, text2));

        sc.close();
    }
}`
  },

  testCases: [
    { input: 'abcde\nace', expected: '3' },
    { input: 'abc\nabc', expected: '3' },
    { input: 'abc\ndef', expected: '0' },
    { input: 'aggtab\ngxtxayb', expected: '4' },
    { input: 'aaaa\naa', expected: '2' },
    { input: 'abcdef\nfbdamn', expected: '2' },
    { input: 'abcdgh\naedfhr', expected: '3' },
    { input: 'abcba\nabcbcba', expected: '5' },
    { input: 'xyz\nxyzxyz', expected: '3' },
    { input: 'abc\ncba', expected: '1' }
  ],
};