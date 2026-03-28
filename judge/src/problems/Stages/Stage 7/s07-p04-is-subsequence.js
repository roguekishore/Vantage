/**
 * Is Subsequence - Problem Definition
 *
 * Input format (stdin):
 * Line 1: String s (the potential subsequence).
 * Line 2: String t (the target string).
 *
 * Output format (stdout):
 * "true" if s is a subsequence of t, "false" otherwise.
 */

module.exports = {
  // ---- Identity ----
  id: 'is-subsequence',
  conquestId: 'stage7-4',
  title: 'Is Subsequence',
  difficulty: 'Easy',
  category: 'Advanced Strings',
  tags: ['String', 'Two Pointers', 'Dynamic Programming'],

  // ---- Story Layer ----
  storyBriefing: `Hermione suspects a smaller, coded message ('s') is hidden within a larger manuscript ('t'). A message is a subsequence if all its characters appear in the manuscript in the same order, but not necessarily consecutively. Your task is to check if the coded message is indeed a subsequence of the main text.`,

  // ---- Technical Layer ----
  description: `You are given two strings, 's' and 't'. Your task is to determine if 's' is a subsequence of 't'. A subsequence is formed from the original string by deleting some (or none) of the characters without changing the order of the remaining characters.

An efficient O(n) solution uses two pointers. One pointer ('i') tracks your position in the subsequence 's', and another pointer ('j') tracks your position in the main string 't'. Iterate through 't' with 'j'. If the character at 's[i]' matches the character at 't[j]', it means you've found the next character of the subsequence, so you increment 'i'. Regardless of a match, 'j' always increments.

Return "true" if you successfully find all characters of 's' in order (i.e., 'i' reaches the end of 's'), and "false" otherwise.`,
  examples: [
    {
      input: 'abc\nahbgdc',
      output: 'true',
      explanation: 'The characters "a", "b", and "c" appear in "ahbgdc" in the correct relative order.'
    },
    {
      input: 'axc\nahbgdc',
      output: 'false',
      explanation: 'The character "x" is not found in "ahbgdc", so "axc" cannot be a subsequence.'
    },
    {
      input: '\nabc',
      output: 'true',
      explanation: 'An empty string is a subsequence of any string.'
    }
  ],
  constraints: [
    '0 <= s.length <= 100',
    '0 <= t.length <= 10^4',
    's and t consist of only lowercase English letters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>

using namespace std;

bool solve(string s, string t) {
    // Your code here
    
    return false;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s, t;
    getline(cin, s);
    getline(cin, t);
    
    cout << (solve(s, t) ? "true" : "false") << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static boolean solve(String s, String t) {
        // Your code here
        
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        String t = sc.hasNextLine() ? sc.nextLine() : "";
        
        System.out.println(solve(s, t));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: 'abc\nahbgdc', expected: 'true' },
    { input: 'axc\nahbgdc', expected: 'false' },
    { input: '\nabc', expected: 'true' },
    { input: 'a\n', expected: 'false' },
    { input: 'aaaa\nbbaaa', expected: 'false' },
    { input: 'ace\nabcde', expected: 'true' },
    { input: 'leetcoder\nleetcode', expected: 'false' },
    { input: 'book\nnotebook', expected: 'true' },
    { input: 'cat\ndog', expected: 'false' },
    { input: 'sing\nsinging', expected: 'true' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is solved using a two-pointer approach. Initialize pointer 'i' for string 's' and pointer 'j' for string 't', both starting at 0. Iterate through string 't' with pointer 'j'. If the character at s[i] matches t[j], it means we've found the next character of our subsequence, so we increment 'i'. We always increment 'j' to continue scanning 't'. If 'i' reaches the end of 's' (i.e., becomes equal to s.length()), it means all characters of 's' were found in order, and we can return true. If the loop finishes before this, return false.`,
    cpp: `int i = 0, j = 0;
while (i < s.length() && j < t.length()) {
    if (s[i] == t[j]) {
        i++;
    }
    j++;
}
return i == s.length();`,
    java: `int i = 0, j = 0;
while (i < s.length() && j < t.length()) {
    if (s.charAt(i) == t.charAt(j)) {
        i++;
    }
    j++;
}
return i == s.length();`
  }
};