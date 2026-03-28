/**
 * Reverse Words in a String - Problem Definition
 *
 * Input format (stdin):
 * Line 1: A string s containing words separated by at least one space.
 *
 * Output format (stdout):
 * A single string representing the words in reverse order, joined by a single space.
 */

module.exports = {
  // ---- Identity ----
  id: 'reverse-words-in-a-string',
  conquestId: 'stage7-3',
  title: 'Reverse Words in a String',
  difficulty: 'Medium',
  category: 'Advanced Strings',
  tags: ['String', 'Two Pointers'],

  // ---- Story Layer ----
  storyBriefing: `Hermione finds an ancient riddle in one of the manuscripts, but it appears to be enchanted with a jumbling charm that has reversed the order of its words. 'Blue is sky the,' it reads. To decipher it, you must reverse the order of the words back to their proper sequence, ensuring any extra spaces from the faulty spell are cleaned up.`,

  // ---- Technical Layer ----
  description: `You are given an input string 's' that contains words separated by one or more spaces. Your task is to reverse the order of the words and return a new string. A word is a sequence of non-space characters. The returned string must have only a single space separating the words and must not contain any leading or trailing spaces.

An effective in-place strategy involves three steps. First, remove any leading, trailing, and multiple in-between spaces. Second, reverse the entire cleaned string. Third, iterate through the reversed string and reverse each individual word back to its original form.

Return a single string with the words in reverse order and properly spaced.`,
  examples: [
    {
      input: 'the sky is blue',
      output: 'blue is sky the',
      explanation: 'The order of the four words is reversed.'
    },
    {
      input: '  hello world  ',
      output: 'world hello',
      explanation: 'Extra spaces at the beginning and end are removed, and the words are reversed.'
    },
    {
      input: 'a good   example',
      output: 'example good a',
      explanation: 'Multiple spaces between "good" and "example" are reduced to a single space in the output.'
    }
  ],
  constraints: [
    '1 <= s.length <= 10^4',
    's contains English letters (upper-case and lower-case), digits, and spaces \' \'.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <string>
#include <algorithm>
#include <vector>
#include <sstream>

using namespace std;

string solve(string s) {
    // Your code here
    
    return "";
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
import java.util.Collections;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static String solve(String s) {
        // Your code here
        
        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String s = sc.nextLine();
        
        System.out.println(solve(s));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: 'the sky is blue', expected: 'blue is sky the' },
    { input: '  hello world  ', expected: 'world hello' },
    { input: 'a good   example', expected: 'example good a' },
    { input: 'word', expected: 'word' },
    { input: '  leading', expected: 'leading' },
    { input: 'trailing  ', expected: 'trailing' },
    { input: 'a b c', expected: 'c b a' },
    { input: '  ', expected: '' },
    { input: '1 22 333', expected: '333 22 1' },
    { input: '  test   case  ', expected: 'case test' }
  ],

  // ---- Solution ----
  solution: {
    approach: `A clean way to solve this in many languages is to use built-in functions. First, trim any leading or trailing whitespace from the string. Then, split the string into an array of words using one or more spaces as the delimiter. Reverse the order of the elements in this array. Finally, join the elements of the reversed array back into a single string, using a single space as the separator. This handles all spacing requirements cleanly.`,
    cpp: `stringstream ss(s);
string word;
vector<string> words;
while (ss >> word) {
    words.push_back(word);
}
reverse(words.begin(), words.end());
string result = "";
for (int i = 0; i < words.size(); ++i) {
    result += words[i];
    if (i != words.size() - 1) {
        result += " ";
    }
}
return result;`,
    java: `s = s.trim();
List<String> words = Arrays.asList(s.split("\\\\s+"));
Collections.reverse(words);
return String.join(" ", words);`
  }
};