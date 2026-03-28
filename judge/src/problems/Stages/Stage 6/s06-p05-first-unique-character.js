/**
 * First Unique Character - Problem Definition
 *
 * Input format (stdin):
 * Line 1: A string s.
 *
 * Output format (stdout):
 * A single integer representing the 0-based index of the first 
 * non-repeating character. If it does not exist, return -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'first-unique-character',
  conquestId: 'stage6-5',
  title: 'First Unique Character in a String',
  difficulty: 'Easy',
  category: 'String Fundamentals',
  tags: ['String', 'Hash Table', 'Frequency Array'],

  // ---- Story Layer ----
  storyBriefing: `Your final Charms challenge from Professor Flitwick is to find the 'keystone' of an incantation. He explains that the first unique, non-repeating character in a spell often holds the key to its power. He gives you a long spell string and asks you to find the index of the very first character that appears only once.`,

  // ---- Technical Layer ----
  description: `You are given a string 's' consisting of only lowercase English letters. Your task is to find the first non-repeating character in the string and return its 0-based index. If no such character exists, you should return -1.

This problem can be solved efficiently in O(n) time with two passes over the string. In the first pass, populate a frequency map (or an array of size 26) to count the occurrences of each character. In the second pass, iterate through the string again from the beginning. The first character you encounter that has a count of 1 in your frequency map is the answer.

Return a single integer: the index of the first unique character, or -1 if none exists.`,
  examples: [
    {
      input: 'leetcode',
      output: '0',
      explanation: 'The character "l" appears only once and is the first such character. Its index is 0.'
    },
    {
      input: 'loveleetcode',
      output: '2',
      explanation: 'The characters "l", "o", and "v" are candidates. "v" appears first at index 2.'
    },
    {
      input: 'aabb',
      output: '-1',
      explanation: 'Every character in the string repeats. There are no unique characters.'
    }
  ],
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of only lowercase English letters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <vector>

using namespace std;

int solve(string s) {
    // Your code here
    
    return -1;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    if (!(cin >> s)) return 0;
    
    cout << solve(s) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(String s) {
        // Your code here
        
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        
        System.out.println(solve(s));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: 'leetcode', expected: '0' },
    { input: 'loveleetcode', expected: '2' },
    { input: 'aabb', expected: '-1' },
    { input: 'a', expected: '0' },
    { input: 'abacabad', expected: '6' },
    { input: 'z', expected: '0' },
    { input: 'zz', expected: '-1' },
    { input: 'statistics', expected: '2' },
    { input: 'abacddbec', expected: '-1' },
    { input: 'xxyyzzw', expected: '6' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The solution uses a frequency array of size 26 for all lowercase letters. The first pass iterates through the input string to populate this array, counting the occurrences of each character. The second pass iterates through the string again, from left to right. For each character, it checks its count in the frequency array. The index of the first character with a count of 1 is returned. If the second loop completes without finding any such character, it means all characters are repeated, and -1 is returned.`,
    cpp: `vector<int> counts(26, 0);
for (char c : s) {
    counts[c - 'a']++;
}
for (int i = 0; i < s.length(); ++i) {
    if (counts[s[i] - 'a'] == 1) {
        return i;
    }
}
return -1;`,
    java: `int[] counts = new int[26];
for (int i = 0; i < s.length(); i++) {
    counts[s.charAt(i) - 'a']++;
}
for (int i = 0; i < s.length(); i++) {
    if (counts[s.charAt(i) - 'a'] == 1) {
        return i;
    }
}
return -1;`
  }
};