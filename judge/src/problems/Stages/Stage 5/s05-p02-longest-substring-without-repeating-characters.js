/**
 * Longest Substring Without Repeating Characters - Problem Definition
 *
 * Input format (stdin):
 * Line 1: A string s.
 *
 * Output format (stdout):
 * A single integer representing the length of the longest substring 
 * without repeating characters.
 */

module.exports = {
  // ---- Identity ----
  id: 'longest-substring-without-repeating-characters',
  conquestId: 'stage5-2',
  title: 'Longest Substring Without Repeating Characters',
  difficulty: 'Medium',
  category: 'Sliding Window',
  tags: ['String', 'Sliding Window', 'Hash Table'],

  // ---- Story Layer ----
  storyBriefing: `Madam Hooch, the flying instructor, gives you a new challenge involving the Golden Snitch. She provides you with a string representing the Snitch's erratic flight path, with each character being a specific maneuver. You need to find the length of the longest continuous sequence of maneuvers (a substring) that does not contain any repeated moves. This will identify the Snitch's most complex and unique flight pattern.`,

  // ---- Technical Layer ----
  description: `You are given a string 's'. Your task is to find the length of the longest substring within 's' that does not contain any repeating characters. A substring is a contiguous sequence of characters within a string.

An optimal O(n) solution uses the sliding window technique with a hash map to keep track of characters and their most recent indices. As you expand the window with a 'right' pointer, store each character's index in the map. If you encounter a character that's already in the map and its index is within the current window, you must shrink the window by moving the 'left' pointer to the position right after the previous occurrence of that character.

Return a single integer representing the length of the longest substring without repeating characters.`,
  examples: [
    {
      input: 'abcabcbb',
      output: '3',
      explanation: 'The longest substring without repeating characters is "abc", which has a length of 3.'
    },
    {
      input: 'bbbbb',
      output: '1',
      explanation: 'The longest substring is "b", with a length of 1.'
    },
    {
      input: 'pwwkew',
      output: '3',
      explanation: 'The longest substring is "wke", with a length of 3. Note that "pwke" is a subsequence, not a substring.'
    }
  ],
  constraints: [
    '0 <= s.length <= 5 * 10^4',
    's can consist of English letters, digits, symbols, and spaces.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <unordered_map>
#include <algorithm>

using namespace std;

int solve(string s) {
    int maxLen = 0;
    // Your code here
    
    return maxLen;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    getline(cin, s);
    
    cout << solve(s) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static int solve(String s) {
        int maxLen = 0;
        // Your code here
        
        return maxLen;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        
        System.out.println(solve(s));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: 'abcabcbb', expected: '3' },
    { input: 'bbbbb', expected: '1' },
    { input: 'pwwkew', expected: '3' },
    { input: '', expected: '0' },
    { input: ' ', expected: '1' },
    { input: 'a', expected: '1' },
    { input: 'au', expected: '2' },
    { input: 'dvdf', expected: '3' },
    { input: 'abba', expected: '2' },
    { input: 'abcdefg', expected: '7' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is solved using a sliding window with a hash map (or an integer array as a frequency map for ASCII characters). A 'left' pointer marks the start of the window. Iterate through the string with a 'right' pointer. For each character, check the map for its last seen index. If the character was seen before and is inside the current window (its last index >= left), move the 'left' pointer to 'last index + 1'. Update the character's current index in the map. The maximum length is updated at each step by calculating 'right - left + 1'.`,
    cpp: `unordered_map<char, int> char_map;
int left = 0;
for (int right = 0; right < s.length(); ++right) {
    char currentChar = s[right];
    if (char_map.count(currentChar) && char_map[currentChar] >= left) {
        left = char_map[currentChar] + 1;
    }
    char_map[currentChar] = right;
    maxLen = max(maxLen, right - left + 1);
}
return maxLen;`,
    java: `Map<Character, Integer> charMap = new HashMap<>();
int left = 0;
for (int right = 0; right < s.length(); right++) {
    char currentChar = s.charAt(right);
    if (charMap.containsKey(currentChar)) {
        left = Math.max(left, charMap.get(currentChar) + 1);
    }
    charMap.put(currentChar, right);
    maxLen = Math.max(maxLen, right - left + 1);
}
return maxLen;`
  }
};