/**
 * Count Vowels - Problem Definition
 *
 * Input format (stdin):
 * Line 1: A string s.
 *
 * Output format (stdout):
 * A single integer representing the number of vowels in the string.
 */

module.exports = {
  // ---- Identity ----
  id: 'count-vowels',
  conquestId: 'stage6-3',
  title: 'Count Vowels',
  difficulty: 'Easy',
  category: 'String Fundamentals',
  tags: ['String', 'Iteration'],

  // ---- Story Layer ----
  storyBriefing: `Professor Flitwick moves on to the importance of pronunciation. He explains that the power of many spells lies in their vowel sounds. To demonstrate, he gives you a long, complex incantation from a textbook and asks you to count the total number of vowels ('a', 'e', 'i', 'o', 'u') it contains, treating both uppercase and lowercase as the same.`,

  // ---- Technical Layer ----
  description: `You are given a string 's'. Your task is to count the total number of vowels within the string. For this problem, the vowels are 'a', 'e', 'i', 'o', 'u', and the check should be case-insensitive, meaning 'A', 'E', 'I', 'O', 'U' should also be counted.

The approach for this problem is a simple linear scan of the string. Iterate through each character of the input string. For each character, convert it to lowercase and check if it is one of the five vowels. If it is, increment a counter.

Return a single integer representing the total count of vowels found in the string.`,
  examples: [
    {
      input: 'Hello World',
      output: '3',
      explanation: 'The vowels are e, o, o. The total count is 3.'
    },
    {
      input: 'AEIOUaeiou',
      output: '10',
      explanation: 'All ten characters are vowels (five uppercase, five lowercase).'
    },
    {
      input: 'rhythm',
      output: '0',
      explanation: 'There are no vowels in this string.'
    }
  ],
  constraints: [
    '0 <= s.length <= 10^5',
    's consists of English letters, spaces, and punctuation.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <cctype>

using namespace std;

int solve(string s) {
    int count = 0;
    // Your code here
    
    return count;
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

public class Main {
    public static int solve(String s) {
        int count = 0;
        // Your code here
        
        return count;
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
    { input: 'Hello World', expected: '3' },
    { input: 'AEIOU', expected: '5' },
    { input: 'rhythm', expected: '0' },
    { input: 'The quick brown fox jumps over the lazy dog', expected: '11' },
    { input: '12345', expected: '0' },
    { input: '', expected: '0' },
    { input: 'a', expected: '1' },
    { input: 'b', expected: '0' },
    { input: 'programming is fun', expected: '5' },
    { input: 'UPPERCASE', expected: '4' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The solution involves iterating through each character of the input string. For each character, convert it to lowercase to handle case-insensitivity. Then, check if the lowercase character is 'a', 'e', 'i', 'o', or 'u'. A counter, initialized to zero, is incremented for each vowel found. After checking all characters, the final count is returned.`,
    cpp: `for (char c : s) {
    char lower_c = tolower(c);
    if (lower_c == 'a' || lower_c == 'e' || lower_c == 'i' || lower_c == 'o' || lower_c == 'u') {
        count++;
    }
}
return count;`,
    java: `for (char c : s.toCharArray()) {
    char lowerC = Character.toLowerCase(c);
    if (lowerC == 'a' || lowerC == 'e' || lowerC == 'i' || lowerC == 'o' || lowerC == 'u') {
        count++;
    }
}
return count;`
  }
};