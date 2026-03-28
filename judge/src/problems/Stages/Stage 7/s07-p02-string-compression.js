/**
 * String Compression - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of characters.
 * Line 2: n space-separated characters representing the array chars.
 *
 * Output format (stdout):
 * A single integer representing the new length of the array after compression.
 * (Note: The actual logic requires modifying the array in-place, 
 * but for this challenge, we return the compressed length).
 */

module.exports = {
  // ---- Identity ----
  id: 'string-compression',
  conquestId: 'stage7-2',
  title: 'String Compression',
  difficulty: 'Medium',
  category: 'Advanced Strings',
  tags: ['String', 'Two Pointers'],

  // ---- Story Layer ----
  storyBriefing: `To save space on the library's magical archiving shelves, Madam Pince needs you to compress the text of long spell scrolls. She explains a method where consecutive repeating characters are replaced by the character itself, followed by its count. For example, 'aaaa' becomes 'a4'. Your task is to apply this compression to a given array of characters in-place and report the new, shorter length of the text.`,

  // ---- Technical Layer ----
  description: `You are given an array of characters 'chars'. Your task is to compress it in-place. For each group of consecutive repeating characters, if the group's length is 1, append the character. Otherwise, append the character followed by the group's length as a sequence of digits.

This problem should be solved in O(n) time and O(1) extra space. Use a 'read' pointer to iterate through the input array and a 'write' pointer to keep track of the position in the modified part of the array. For each group of identical characters, count them, then write the character and its count (if greater than 1) to the 'write' position.

After modifying the input array in-place, return the new length of the compressed array.`,
  examples: [
    {
      input: '7\na a b b c c c',
      output: '6',
      explanation: 'The groups are "aa", "bb", and "ccc". This compresses to "a2b2c3". The modified array begins with these 6 characters.'
    },
    {
      input: '1\na',
      output: '1',
      explanation: 'The group "a" has length 1, so it remains "a". The length is 1.'
    },
    {
      input: '13\na b b b b b b b b b b b b',
      output: '4',
      explanation: 'The groups are "a" and "bbbbbbbbbbbb" (12 \'b\'s). This compresses to "ab12". The length is 4.'
    }
  ],
  constraints: [
    '1 <= chars.length <= 2000',
    'chars[i] is a lowercase English letter, uppercase English letter, digit, or symbol.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int solve(int n, vector<char>& chars) {
    if (n == 0) return 0;
    // Your code here
    
    return 0;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<char> chars(n);
    for (int i = 0; i < n; i++) cin >> chars[i];
    
    cout << solve(n, chars) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, char[] chars) {
        if (n == 0) return 0;
        // Your code here
        
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        char[] chars = new char[n];
        for (int i = 0; i < n; i++) chars[i] = sc.next().charAt(0);
        
        System.out.println(solve(n, chars));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '7\na a b b c c c', expected: '6' },
    { input: '1\na', expected: '1' },
    { input: '13\na b b b b b b b b b b b b', expected: '4' },
    { input: '6\na a a b b b', expected: '4' },
    { input: '1\n#', expected: '1' },
    { input: '10\na a a a a a a a a a', expected: '3' },
    { input: '4\na b c d', expected: '4' },
    { input: '5\na b b c c', expected: '5' },
    { input: '2\n1 1', expected: '2' },
    { input: '3\\na b b', expected: '3' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The in-place compression is achieved using a read pointer 'i' and a write pointer 'write_idx'. Iterate 'i' through the array to identify groups of consecutive characters. For each group starting at 'i', find its end 'j' and count its length. Write the character at 'i' to 'write_idx' and increment 'write_idx'. If the group length is greater than 1, convert the length to a string. Then, write each digit of the length string to the subsequent positions starting from 'write_idx'. Finally, move 'i' to 'j' to start processing the next group. The final value of 'write_idx' is the compressed length.`,
    cpp: `int write_idx = 0;
int i = 0;
while (i < n) {
    int j = i;
    while (j < n && chars[j] == chars[i]) {
        j++;
    }
    chars[write_idx++] = chars[i];
    if (j - i > 1) {
        string count = to_string(j - i);
        for (char c : count) {
            chars[write_idx++] = c;
        }
    }
    i = j;
}
return write_idx;`,
    java: `int writeIdx = 0;
int i = 0;
while (i < n) {
    int j = i;
    while (j < n && chars[j] == chars[i]) {
        j++;
    }
    chars[writeIdx++] = chars[i];
    if (j - i > 1) {
        String count = Integer.toString(j - i);
        for (char c : count.toCharArray()) {
            chars[writeIdx++] = c;
        }
    }
    i = j;
}
return writeIdx;`
  }
};