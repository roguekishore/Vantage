/**
 * Minimum Window Substring - Problem Definition
 *
 * Input format (stdin):
 * Line 1: String s.
 * Line 2: String t.
 *
 * Output format (stdout):
 * A single string representing the minimum window substring of s such that 
 * every character in t (including duplicates) is included in the window. 
 * If there is no such substring, return an empty string "".
 */

module.exports = {
  // ---- Identity ----
  id: 'minimum-window-substring',
  conquestId: 'stage5-4',
  title: 'Minimum Window Substring',
  difficulty: 'Hard',
  category: 'Sliding Window',
  tags: ['String', 'Sliding Window', 'Hash Table'],

  // ---- Story Layer ----
  storyBriefing: `Katie Bell, a Chaser on your team, presents you with a complex strategic problem. She gives you a long sequence of every play-by-play maneuver from an opponent's last game ('s'). She also gives you a shorter sequence of their key offensive plays ('t'). Your job is to find the smallest continuous window of plays in their game that contains all of their key offensive maneuvers, helping your team identify their most concentrated attack phase.`,

  // ---- Technical Layer ----
  description: `You are given two strings, 's' (the search string) and 't' (the pattern). Your task is to find the minimum-length contiguous substring of 's' that contains all the characters of 't', including duplicates. If no such substring exists, you should return an empty string.

This problem requires a sliding window approach with frequency maps. First, build a frequency map of the characters in 't'. Then, use two pointers, 'left' and 'right', to define a window in 's'. Expand the window by moving 'right' and update a window frequency map. Once the window contains all required characters from 't', try to shrink it from the 'left' to find the smallest possible valid window.

Return the minimum window substring. If no such window exists, return an empty string.`,
  examples: [
    {
      input: 'ADOBECODEBANC\nABC',
      output: 'BANC',
      explanation: 'The substring "BANC" is the shortest segment of the first string that contains one A, one B, and one C.'
    },
    {
      input: 'a\na',
      output: 'a',
      explanation: 'The string "a" contains "a", and is the shortest possible.'
    },
    {
      input: 'a\naa',
      output: '',
      explanation: 'The string "a" does not contain two "a"s, so no valid window exists.'
    }
  ],
  constraints: [
    '1 <= s.length, t.length <= 10^5',
    's and t consist of uppercase and lowercase English letters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <climits>

using namespace std;

string solve(string s, string t) {
    if (s.empty() || t.empty()) return "";
    // Your code here
    
    return "";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s, t;
    if (!(cin >> s >> t)) return 0;
    
    cout << solve(s, t) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static String solve(String s, String t) {
        if (s == null || t == null || s.length() < t.length()) return "";
        // Your code here
        
        return "";
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
    { input: 'ADOBECODEBANC\nABC', expected: 'BANC' },
    { input: 'a\na', expected: 'a' },
    { input: 'a\naa', expected: '' },
    { input: 'ab\nb', expected: 'b' },
    { input: 'aaflslflsldkalskaaa\naa', expected: 'aa' },
    { input: 'cabwefgewcwaefgcf\ncae', expected: 'cwae' },
    { input: 'a\nb', expected: '' },
    { input: 'adobecodebanc\nABCA', expected: 'ADOBECODEBA' },
    { input: 'aaaaaaaaaaa\na', expected: 'a' },
    { input: 'abac\ncab', expected: 'bac' }
  ],

  // ---- Solution ----
  solution: {
    approach: `This problem is solved using a sliding window and frequency maps. First, create a frequency map ('tFreq') for the characters in string 't'. Initialize a window frequency map ('windowFreq'), 'left' and 'right' pointers at 0, and variables to track the number of characters 'formed' and 'required'. Expand the window by moving 'right', updating 'windowFreq'. If a character's count in 'windowFreq' matches its count in 'tFreq', increment 'formed'. Once 'formed' equals 'required' (the number of unique characters in 't'), you have a valid window. Now, shrink the window from the left. While shrinking, update 'windowFreq'. If a character's count falls below its required count in 'tFreq', decrement 'formed' and stop shrinking. In each valid window, update the minimum length and result string.`,
    cpp: `unordered_map<char, int> t_freq, window_freq;
for (char c : t) {
    t_freq[c]++;
}

int left = 0, formed = 0, required = t_freq.size();
int min_len = INT_MAX, start_index = 0;

for (int right = 0; right < s.length(); ++right) {
    char c = s[right];
    window_freq[c]++;
    if (t_freq.count(c) && window_freq[c] == t_freq[c]) {
        formed++;
    }

    while (left <= right && formed == required) {
        if (right - left + 1 < min_len) {
            min_len = right - left + 1;
            start_index = left;
        }

        char left_char = s[left];
        window_freq[left_char]--;
        if (t_freq.count(left_char) && window_freq[left_char] < t_freq[left_char]) {
            formed--;
        }
        left++;
    }
}

return min_len == INT_MAX ? "" : s.substr(start_index, min_len);`,
    java: `Map<Character, Integer> tFreq = new HashMap<>();
for (char c : t.toCharArray()) {
    tFreq.put(c, tFreq.getOrDefault(c, 0) + 1);
}

int left = 0, formed = 0, required = tFreq.size();
int minLen = Integer.MAX_VALUE, startIndex = 0;
Map<Character, Integer> windowFreq = new HashMap<>();

for (int right = 0; right < s.length(); right++) {
    char c = s.charAt(right);
    windowFreq.put(c, windowFreq.getOrDefault(c, 0) + 1);

    if (tFreq.containsKey(c) && windowFreq.get(c).intValue() == tFreq.get(c).intValue()) {
        formed++;
    }

    while (left <= right && formed == required) {
        if (right - left + 1 < minLen) {
            minLen = right - left + 1;
            startIndex = left;
        }

        char leftChar = s.charAt(left);
        windowFreq.put(leftChar, windowFreq.get(leftChar) - 1);
        if (tFreq.containsKey(leftChar) && windowFreq.get(leftChar) < tFreq.get(leftChar)) {
            formed--;
        }
        left++;
    }
}

return minLen == Integer.MAX_VALUE ? "" : s.substring(startIndex, startIndex + minLen);`
  }
};