/**
 * Valid Anagram - Problem Definition
 *
 * Input format (stdin):
 * Line 1: String s.
 * Line 2: String t.
 *
 * Output format (stdout):
 * "true" if t is an anagram of s, and "false" otherwise.
 */

module.exports = {
  // ---- Identity ----
  id: 'valid-anagram',
  conquestId: 'stage6-4',
  title: 'Valid Anagram',
  difficulty: 'Easy',
  category: 'String Fundamentals',
  tags: ['String', 'Hash Table', 'Sorting'],

  // ---- Story Layer ----
  storyBriefing: `Hermione, deep in study, discovers a form of word-based magic that relies on anagrams. She explains that two spells are magically equivalent if one is an anagram of the other-meaning they use the exact same letters with the same frequencies. She gives you two spell incantations, 's' and 't', and asks you to determine if they are magically equivalent.`,

  // ---- Technical Layer ----
  description: `You are given two strings, 's' and 't'. Your task is to determine if 't' is an anagram of 's'. An anagram is a word or phrase formed by rearranging the letters of another, using all the original letters exactly once. For this problem, both strings consist of only lowercase English letters.

A simple O(n log n) approach is to sort both strings and check if they are equal. A more optimal O(n) solution uses a frequency counter. You can use an array of size 26 to represent the alphabet. Iterate through the first string 's' and increment the count for each character. Then, iterate through the second string 't' and decrement the count for each character. If the strings are anagrams, all counts in the array will be zero at the end.

Return "true" if 't' is an anagram of 's', and "false" otherwise.`,
  examples: [
    {
      input: 'anagram\nnagaram',
      output: 'true',
      explanation: 'Both strings use the same characters with the same counts: three "a"s, one "g", one "m", one "n", and one "r".'
    },
    {
      input: 'rat\ncar',
      output: 'false',
      explanation: 'The characters are different ("t" vs "c"), so they cannot be anagrams.'
    },
    {
      input: 'a\nab',
      output: 'false',
      explanation: 'The lengths are different, so they cannot be anagrams.'
    }
  ],
  constraints: [
    '1 <= s.length, t.length <= 5 * 10^4',
    's and t consist of lowercase English letters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <algorithm>
#include <vector>

using namespace std;

bool solve(string s, string t) {
    // Your code here
    return false;
}

int main() {
    string s, t;
    if (!(cin >> s >> t)) return 0;
    
    cout << (solve(s, t) ? "true" : "false") << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.Arrays;

public class Main {
    public static boolean solve(String s, String t) {
        // Your code here
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        String t = sc.next();
        
        System.out.println(solve(s, t));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: 'anagram\nnagaram', expected: 'true' },
    { input: 'rat\ncar', expected: 'false' },
    { input: 'a\na', expected: 'true' },
    { input: 'a\nb', expected: 'false' },
    { input: 'ab\na', expected: 'false' },
    { input: 'aabbc\nbacab', expected: 'true' },
    { input: 'aacc\nccac', expected: 'false' },
    { input: 'abc\ncba', expected: 'true' },
    { input: 'zyxw\nwxyz', expected: 'true' },
    { input: 'apple\npaple', expected: 'true' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem can be solved in O(n) time using a frequency array. First, check if the lengths of the two strings are different; if so, they cannot be anagrams. Create an integer array of size 26, initialized to zeros, to store character counts. Iterate through the first string 's', incrementing the count for each character (e.g., 'a' maps to index 0). Then, iterate through the second string 't', decrementing the count for each character. Finally, iterate through the frequency array. If any count is not zero, the strings are not anagrams. If all counts are zero, they are.`,
    cpp: `if (s.length() != t.length()) {
    return false;
}
vector<int> counts(26, 0);
for (int i = 0; i < s.length(); ++i) {
    counts[s[i] - 'a']++;
    counts[t[i] - 'a']--;
}
for (int count : counts) {
    if (count != 0) {
        return false;
    }
}
return true;`,
    java: `if (s.length() != t.length()) {
    return false;
}
int[] counts = new int[26];
for (int i = 0; i < s.length(); i++) {
    counts[s.charAt(i) - 'a']++;
    counts[t.charAt(i) - 'a']--;
}
for (int count : counts) {
    if (count != 0) {
        return false;
    }
}
return true;`
  }
};