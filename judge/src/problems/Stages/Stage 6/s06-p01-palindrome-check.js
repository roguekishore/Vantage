/**
 * Palindrome Check - Problem Definition
 *
 * Input format (stdin):
 * Line 1: A string s.
 *
 * Output format (stdout):
 * "true" if the string is a palindrome, "false" otherwise.
 */

module.exports = {
  // ---- Identity ----
  id: 'palindrome-check',
  conquestId: 'stage6-1',
  title: 'Palindrome Check',
  difficulty: 'Easy',
  category: 'String Fundamentals',
  tags: ['String', 'Two Pointers'],

  // ---- Story Layer ----
  stageIntro: `Your journey into the magical arts continues as you step into Charms class for the first time. The classroom is a vibrant, bustling place filled with humming feathers and floating books. The diminutive Professor Flitwick, standing atop a pile of books to see over his desk, greets you with a cheerful, 'Welcome, aspiring masters of the subtle arts! Today, we begin with the fundamentals of incantations, where precision of speech is paramount.'`,
  storyBriefing: `Professor Flitwick introduces you to 'mirror spells,' incantations that must read the same forwards and backwards to function correctly. He gives you a string of text from an old spellbook, cluttered with punctuation and mixed-case letters. You must determine if the core alphanumeric characters of the spell form a perfect palindrome.`,

  // ---- Technical Layer ----
  description: `You are given a string 's'. A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Your task is to determine if the given string is a palindrome under these rules.

An efficient O(n) approach uses two pointers, one at the start (left) and one at the end (right) of the string. Move the pointers inward, skipping any non-alphanumeric characters. At each step, compare the lowercase versions of the characters at the pointers. If they are not the same, the string is not a palindrome. If the pointers cross, the string is a palindrome.

Return "true" if the string is a palindrome, and "false" otherwise.`,
  examples: [
    {
      input: 'A man, a plan, a canal: Panama',
      output: 'true',
      explanation: 'After removing non-alphanumeric characters and converting to lowercase, the string becomes "amanaplanacanalpanama", which is a palindrome.'
    },
    {
      input: 'race a car',
      output: 'false',
      explanation: 'After cleaning, the string becomes "raceacar", which is not a palindrome.'
    },
    {
      input: ' ',
      output: 'true',
      explanation: 'After removing non-alphanumeric characters, the string becomes empty. An empty string is considered a palindrome.'
    }
  ],
  constraints: [
    '0 <= s.length <= 2 * 10^5',
    's consists only of printable ASCII characters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <cctype>

using namespace std;

bool solve(string s) {
    // Your code here
    return true;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    getline(cin, s);
    
    cout << (solve(s) ? "true" : "false") << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static boolean solve(String s) {
        // Your code here
        return true;
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
    { input: 'A man, a plan, a canal: Panama', expected: 'true' },
    { input: 'race a car', expected: 'false' },
    { input: ' ', expected: 'true' },
    { input: '0P', expected: 'false' },
    { input: 'No "x" in Nixon', expected: 'true' },
    { input: 'Was it a car or a cat I saw?', expected: 'true' },
    { input: '12321', expected: 'true' },
    { input: 'a', expected: 'true' },
    { input: '.,', expected: 'true' },
    { input: 'Taco cat', expected: 'true' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is solved using a two-pointer approach. Initialize a 'left' pointer at the start and a 'right' pointer at the end of the string. In a loop, advance the 'left' pointer until it points to an alphanumeric character. Similarly, move the 'right' pointer backward until it finds an alphanumeric character. Compare the lowercase versions of the characters at the 'left' and 'right' pointers. If they don't match, return false. Otherwise, move both pointers inward and continue the process until 'left' is greater than or equal to 'right'. If the loop completes, it's a palindrome.`,
    cpp: `int left = 0, right = s.length() - 1;
while (left < right) {
    while (left < right && !isalnum(s[left])) {
        left++;
    }
    while (left < right && !isalnum(s[right])) {
        right--;
    }
    if (tolower(s[left]) != tolower(s[right])) {
        return false;
    }
    left++;
    right--;
}
return true;`,
    java: `int left = 0, right = s.length() - 1;
while (left < right) {
    while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
        left++;
    }
    while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
        right--;
    }
    if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
        return false;
    }
    left++;
    right--;
}
return true;`
  }
};