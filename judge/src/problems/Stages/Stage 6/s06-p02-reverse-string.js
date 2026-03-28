/**
 * Reverse String - Problem Definition
 *
 * Input format (stdin):
 * Line 1: A string s.
 *
 * Output format (stdout):
 * The string s reversed.
 */

module.exports = {
  // ---- Identity ----
  id: 'reverse-string',
  conquestId: 'stage6-2',
  title: 'Reverse String',
  difficulty: 'Easy',
  category: 'String Fundamentals',
  tags: ['String', 'Two Pointers'],

  // ---- Story Layer ----
  storyBriefing: `Seamus Finnigan accidentally casts a jumbling jinx on a simple 'Lumos' incantation, writing it backwards on the blackboard. To help him fix it before Professor Flitwick notices, you need to quickly reverse the string of the incantation back to its correct form.`,

  // ---- Technical Layer ----
  description: `You are given a string 's'. Your task is to write a function that reverses the string in-place. You should not allocate extra space for another array; modify the input array directly.

The standard way to solve this is with a two-pointer approach. Place one pointer at the start of the string (left) and another at the end (right). Swap the characters at these pointers, then move the left pointer forward and the right pointer backward. Continue this process until the pointers meet or cross in the middle of the string.

Modify the string in-place. The judge will print the resulting reversed string.`,
  examples: [
    {
      input: 'hello',
      output: 'olleh',
      explanation: 'The characters are swapped from the ends inward: h/o -> o/h, e/l -> l/e. The middle l stays.'
    },
    {
      input: 'Hannah',
      output: 'hannaH',
      explanation: 'The case of the characters is preserved. H/h swap, a/n swap, n/n swap.'
    },
    {
      input: 'a',
      output: 'a',
      explanation: 'A single character string is its own reverse.'
    }
  ],
  constraints: [
    '1 <= s.length <= 10^5',
    's consists of printable ASCII characters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

string solve(string s) {
    // Your code here
    
    return s;
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
        char[] chars = s.toCharArray();
        // Your code here
        
        return new String(chars);
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
    { input: 'hello', expected: 'olleh' },
    { input: 'Hannah', expected: 'hannaH' },
    { input: 'a', expected: 'a' },
    { input: 'ab', expected: 'ba' },
    { input: 'abc', expected: 'cba' },
    { input: '12345', expected: '54321' },
    { input: 'racecar', expected: 'racecar' },
    { input: 'abcdef', expected: 'fedcba' },
    { input: 'A', expected: 'A' },
    { input: 'string', expected: 'gnirts' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is solved by using two pointers, 'left' starting at the beginning of the string and 'right' at the end. In a loop that continues as long as 'left' is less than 'right', swap the characters at the 'left' and 'right' indices. After the swap, increment 'left' and decrement 'right' to move the pointers closer to the center. This process effectively reverses the string in-place.`,
    cpp: `int left = 0, right = s.length() - 1;
while (left < right) {
    swap(s[left], s[right]);
    left++;
    right--;
}
return s;`,
    java: `int left = 0, right = chars.length - 1;
while (left < right) {
    char temp = chars[left];
    chars[left] = chars[right];
    chars[right] = temp;
    left++;
    right--;
}
return new String(chars);`
  }
};