/**
 * Longest Palindromic Substring - Problem Definition
 *
 * Input format (stdin):
 * Line 1: A string s.
 *
 * Output format (stdout):
 * A single string representing the longest palindromic substring.
 */

module.exports = {
  // ---- Identity ----
  id: 'longest-palindromic-substring',
  conquestId: 'stage7-6',
  title: 'Longest Palindromic Substring',
  difficulty: 'Medium',
  category: 'Advanced Strings',
  tags: ['String', 'Dynamic Programming', 'Two Pointers'],

  // ---- Story Layer ----
  storyBriefing: `You've found it - a powerful, central incantation hidden within one of the manuscripts. Hermione believes the core of the spell is the longest palindromic sequence of characters within the text. Your final task in the library is to analyze this incantation and extract the longest contiguous substring that reads the same forwards and backwards. This might just be the key you were looking for.`,

  // ---- Technical Layer ----
  description: `You are given a string 's'. Your task is to find and return the longest palindromic substring in 's'. A substring is a contiguous sequence of characters within a string, and a palindrome is a sequence that reads the same forwards and backward.

An efficient O(n^2) time complexity and O(1) space complexity solution is the "Expand Around Center" method. Since a palindrome is symmetric around its center, you can iterate through all possible centers. For a string of length n, there are 2n-1 possible centers (n single-character centers and n-1 in-between-character centers). For each center, expand outwards with two pointers as long as the characters match and you are within bounds.

Return a single string that is the longest palindromic substring found. If there are multiple palindromes of the same maximum length, any one of them is an acceptable answer.`,
  examples: [
    {
      input: 'babad',
      output: 'bab',
      explanation: '"aba" is also a valid answer, but "bab" is another longest palindromic substring.'
    },
    {
      input: 'cbbd',
      output: 'bb',
      explanation: 'The longest palindromic substring is "bb".'
    },
    {
      input: 'a',
      output: 'a',
      explanation: 'A single character is always a palindrome.'
    }
  ],
  constraints: [
    '1 <= s.length <= 1000',
    's consists of only digits and English letters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <vector>

using namespace std;

string solve(string s) {
    if (s.length() < 1) return "";
    // Your code here
    
    return "";
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
    public static String solve(String s) {
        if (s == null || s.length() < 1) return "";
        // Your code here
        
        return "";
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
    { input: 'babad', expected: 'bab' },
    { input: 'cbbd', expected: 'bb' },
    { input: 'a', expected: 'a' },
    { input: 'ac', expected: 'a' },
    { input: 'racecar', expected: 'racecar' },
    { input: 'abcdefg', expected: 'a' },
    { input: 'noon', expected: 'noon' },
    { input: 'abacaba', expected: 'abacaba' },
    { input: 'zzza', expected: 'zzz' },
    { input: 'forgeeksskeegfor', expected: 'geeksskeeg' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The 'Expand Around Center' algorithm iterates through every character of the string, treating each as a potential center of a palindrome. For each character, it checks for two types of palindromes: one with an odd length (centered at the character itself) and one with an even length (centered between the character and its right neighbor). A helper function can handle the expansion logic: given a left and right pointer, it expands outwards as long as the pointers are in bounds and the characters match. The main function keeps track of the start and end indices of the longest palindrome found so far and returns the corresponding substring at the end.`,
    cpp: `int start = 0, end = 0;

auto expand_around_center = [&](int left, int right) {
    while (left >= 0 && right < s.length() && s[left] == s[right]) {
        left--;
        right++;
    }
    return right - left - 1;
};

for (int i = 0; i < s.length(); ++i) {
    int len1 = expand_around_center(i, i);
    int len2 = expand_around_center(i, i + 1);
    int len = max(len1, len2);
    if (len > end - start) {
        start = i - (len - 1) / 2;
        end = i + len / 2;
    }
}
return s.substr(start, end - start + 1);`,
    java: `int start = 0, end = 0;

for (int i = 0; i < s.length(); i++) {
    int len1 = expandAroundCenter(s, i, i);
    int len2 = expandAroundCenter(s, i, i + 1);
    int len = Math.max(len1, len2);
    if (len > end - start) {
        start = i - (len - 1) / 2;
        end = i + len / 2;
    }
}
return s.substring(start, end + 1);
}

private int expandAroundCenter(String s, int left, int right) {
    while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
        left--;
        right++;
    }
    return right - left - 1;`
  }
};