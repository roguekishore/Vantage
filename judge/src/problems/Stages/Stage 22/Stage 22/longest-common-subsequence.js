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
  title: 'The Ancestral Tapestry Vault',
  difficulty: 'Medium',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Strings'],
  storyBriefing: `
You're in a Gringotts vault containing two ancient tapestries, each depicting a lineage as a sequence of magical symbols (strings). To unlock the main chest, you must find the length of the longest ancestral line (subsequence of symbols) that is common to both tapestries.

This requires careful comparison, as the symbols must appear in the same relative order, but not necessarily consecutively.
`,
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
    cpp: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int m = text1.length();
        int n = text2.length();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1[i - 1] == text2[j - 1]) {
                    dp[i][j] = 1 + dp[i - 1][j - 1];
                } else {
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[m][n];
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
            int m = text1.length();
            int n = text2.length();
            int[][] dp = new int[m + 1][n + 1];

            for (int i = 1; i <= m; i++) {
                for (int j = 1; j <= n; j++) {
                    if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                        dp[i][j] = 1 + dp[i - 1][j - 1];
                    } else {
                        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                    }
                }
            }
            return dp[m][n];
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String text1 = sc.next();
        String text2 = sc.next();

        Solution sol = new Solution();
        System.out.print(sol.longestCommonSubsequence(text1, text2));
    }
}`
  },

  solution: {
    cpp: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int m = text1.length();
        int n = text2.length();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1[i - 1] == text2[j - 1]) {
                    dp[i][j] = 1 + dp[i - 1][j - 1];
                } else {
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[m][n];
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
            int m = text1.length();
            int n = text2.length();
            int[][] dp = new int[m + 1][n + 1];

            for (int i = 1; i <= m; i++) {
                for (int j = 1; j <= n; j++) {
                    if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                        dp[i][j] = 1 + dp[i - 1][j - 1];
                    } else {
                        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                    }
                }
            }
            return dp[m][n];
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String text1 = sc.next();
        String text2 = sc.next();

        Solution sol = new Solution();
        System.out.print(sol.longestCommonSubsequence(text1, text2));
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