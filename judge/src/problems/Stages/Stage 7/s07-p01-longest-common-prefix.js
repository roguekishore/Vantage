/**
 * Longest Common Prefix - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of strings.
 * Next n lines: Each line contains one string.
 *
 * Output format (stdout):
 * A single string representing the longest common prefix. 
 * If no common prefix exists, return an empty string "".
 */

module.exports = {
  // ---- Identity ----
  id: 'longest-common-prefix',
  conquestId: 'stage7-1',
  title: 'Longest Common Prefix',
  difficulty: 'Easy',
  category: 'Advanced Strings',
  tags: ['String', 'Iteration'],

  // ---- Story Layer ----
  stageIntro: `Your success in Charms class has drawn the attention of Madam Pince, the stern librarian. Intrigued by your knack for patterns, she grants you supervised access to a dusty corner of the library where old, uncategorized manuscripts are stored. She suspects many of them belong to the same series of ancient spellbooks but their titles are fragmented. Your next set of challenges will involve deciphering and organizing these texts.`,
  storyBriefing: `Madam Pince hands you a list of manuscript titles. She believes they are all part of the same collection and should share a common prefix. Your first task is to examine all the titles and find the longest common starting sequence of letters among them. This will help you establish a category for this set of books.`,

  // ---- Technical Layer ----
  description: `You are given an array of n strings. Your task is to write a function to find the longest common prefix string amongst all of them. If there is no common prefix, you should return an empty string.

A simple and effective method is vertical scanning. Compare the characters at the first index of all strings, then the second index, and so on. The process stops when you find a character mismatch, or when you reach the end of the shortest string in the array. The common prefix is the substring from the start up to the point of the first mismatch.

Return a single string representing the longest common prefix.`,
  examples: [
    {
      input: '3\nflower\nflow\nflight',
      output: 'fl',
      explanation: 'The first character "f" is common to all. The second character "l" is common to all. The third character "o" is not common to "flight". So, the prefix is "fl".'
    },
    {
      input: '3\ndog\nracecar\ncar',
      output: '',
      explanation: 'There is no common first character among the strings, so the common prefix is an empty string.'
    },
    {
      input: '1\nalone',
      output: 'alone',
      explanation: 'When there is only one string, it is its own longest common prefix.'
    }
  ],
  constraints: [
    '1 <= n <= 200',
    '0 <= strs[i].length <= 200',
    'strs[i] consists of only lowercase English letters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

string solve(int n, vector<string>& strs) {
    if (n == 0) return "";
    // Your code here
    
    return "";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<string> strs(n);
    for (int i = 0; i < n; i++) cin >> strs[i];
    
    cout << solve(n, strs) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static String solve(int n, String[] strs) {
        if (n == 0) return "";
        // Your code here
        
        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        String[] strs = new String[n];
        for (int i = 0; i < n; i++) strs[i] = sc.next();
        
        System.out.println(solve(n, strs));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\nflower\nflow\nflight', expected: 'fl' },
    { input: '3\ndog\nracecar\ncar', expected: '' },
    { input: '1\nsolitary', expected: 'solitary' },
    { input: '2\napple\napply', expected: 'appl' },
    { input: '2\na\nb', expected: '' },
    { input: '3\naca\ncba\nbbb', expected: '' },
    { input: '3\nabab\naba\nab', expected: 'ab' },
    { input: '2\n\n', expected: '' },
    { input: '2\na\na', expected: 'a' },
    { input: '4\nprefix\npreface\npreview\npreen', expected: 'pre' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The vertical scanning approach is efficient and straightforward. Iterate through the characters of the first string, one by one. For each character at index 'i', compare it with the character at the same index 'i' in all other strings in the array. If any string is shorter than 'i' or has a different character at this position, the longest common prefix is the substring of the first string up to index 'i'. If the loop completes without mismatches, the entire first string is the common prefix.`,
    cpp: `string prefix = strs[0];
for (int i = 1; i < n; i++) {
    while (strs[i].find(prefix) != 0) {
        prefix = prefix.substr(0, prefix.length() - 1);
        if (prefix.empty()) return "";
    }
}
return prefix;`,
    java: `if (strs == null || strs.length == 0) return "";
String prefix = strs[0];
for (int i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) != 0) {
        prefix = prefix.substring(0, prefix.length() - 1);
        if (prefix.isEmpty()) return "";
    }
}
return prefix;`
  }
};