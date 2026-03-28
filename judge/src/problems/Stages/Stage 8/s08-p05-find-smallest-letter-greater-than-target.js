/**
 * Find Smallest Letter Greater Than Target - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of characters in the array.
 * Line 2: n space-separated lowercase letters (sorted).
 * Line 3: A single character target.
 *
 * Output format (stdout):
 * A single character representing the smallest letter in letters 
 * that is lexicographically greater than target.
 */

module.exports = {
  // ---- Identity ----
  id: 'find-smallest-letter-greater-than-target',
  conquestId: 'stage8-5',
  title: 'Find Smallest Letter Greater Than Target',
  difficulty: 'Easy',
  category: 'Binary Search – Core',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  storyBriefing: `Gilderoy Lockhart, in a misguided attempt to be helpful, has 'organized' a set of ancient runes ('letters') for you. They are sorted, but he challenges you to find the smallest rune that comes lexicographically after a given 'target' rune. He adds a peculiar rule: if no such rune exists, the sequence 'wraps around', and the answer is the very first rune in the set. You suspect this is just a way for him to look clever, but you solve it instantly with binary search.`,

  // ---- Technical Layer ----
  description: `You are given a sorted array of characters 'letters' and a target character. Your task is to find the smallest character in the array that is lexicographically greater than the target. The letters array is sorted in non-decreasing order and is guaranteed to wrap around. This means if the target is 'z' and letters is ['a', 'b'], the answer is 'a'.

An O(log n) solution using binary search is required. Search for the target character. If the character at 'mid' is less than or equal to the target, the answer must be in the right half (left = mid + 1). Otherwise, the character at 'mid' is a potential answer, so you store it and search for a smaller, yet still valid, answer in the left half (right = mid - 1).

Return the smallest character in the array that is strictly greater than the target.`,
  examples: [
    {
      input: '3\nc f j\na',
      output: 'c',
      explanation: 'The target is "a". The smallest character in the array greater than "a" is "c".'
    },
    {
      input: '3\nc f j\nc',
      output: 'f',
      explanation: 'The target is "c". The smallest character strictly greater than "c" is "f".'
    },
    {
      input: '4\na b c d\nz',
      output: 'a',
      explanation: 'There is no character in the array greater than "z". Due to the wrap-around rule, the answer is the first character, "a".'
    }
  ],
  constraints: [
    '2 <= letters.length <= 10^4',
    'letters[i] is a lowercase English letter.',
    'letters is sorted in non-decreasing order.',
    'There are at least two different characters in letters.',
    'target is a lowercase English letter.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

char solve(int n, vector<char>& letters, char target) {
    // Your code here
    
    return letters[0];
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<char> letters(n);
    for (int i = 0; i < n; i++) cin >> letters[i];
    char target;
    cin >> target;
    
    cout << solve(n, letters, target) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static char solve(int n, char[] letters, char target) {
        // Your code here

        return letters[0];
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        char[] letters = new char[n];
        for (int i = 0; i < n; i++) letters[i] = sc.next().charAt(0);
        char target = sc.next().charAt(0);
        
        System.out.println(solve(n, letters, target));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\nc f j\na', expected: 'c' },
    { input: '3\nc f j\nc', expected: 'f' },
    { input: '3\nc f j\nd', expected: 'f' },
    { input: '3\nc f j\nj', expected: 'c' },
    { input: '3\nc f j\nk', expected: 'c' },
    { input: '4\ne e g g\ne', expected: 'g' },
    { input: '2\na b\na', expected: 'b' },
    { input: '2\na c\nb', expected: 'c' },
    { input: '2\na z\nz', expected: 'a' },
    { input: '2\ny z\nx', expected: 'y' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem can be solved with a variation of binary search. Initialize 'left' to 0 and 'right' to 'n - 1'. While 'left' <= 'right', find 'mid'. If the character at letters[mid] is less than or equal to the target, it means the answer must be in the right half of the array, so set 'left = mid + 1'. If letters[mid] is greater than the target, it is a potential answer, so we continue searching for a potentially better (smaller) answer in the left half by setting 'right = mid - 1'. After the loop, if 'left' is within the array bounds, it points to the smallest character greater than the target. If 'left' is out of bounds, it means no character was greater, so we wrap around and return the first character of the array.`,
    cpp: `int left = 0, right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (letters[mid] <= target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return left == n ? letters[0] : letters[left];`,
    java: `int left = 0, right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (letters[mid] <= target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return left == n ? letters[0] : letters[left];`
  }
};