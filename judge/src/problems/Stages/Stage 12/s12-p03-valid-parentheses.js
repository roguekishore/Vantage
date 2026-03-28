/**
 * Valid Parentheses - Problem Definition
 *
 * Input format (stdin):
 * A single string s containing just the characters '(', ')', '{', '}', '[' and ']'.
 *
 * Output format (stdout):
 * "true" if the input string is valid, otherwise "false".
 */

module.exports = {
  id: 'valid-parentheses',
  conquestId: 'stage12-3',
  title: 'Valid Parentheses',
  difficulty: 'Easy',
  category: 'Stack – Fundamentals',
  tags: ['Stack', 'String', 'Validation'],

  storyBriefing: `Fred pulls out a long scroll of parchment covered in complex spell incantations. "Here's a real head-scratcher. Some of these new spells use nested magical brackets. If the brackets - round, curly, or square - aren't perfectly matched and closed in the right order, the spell backfires spectacularly. We need you to write a quick charm to validate these incantations before we try them."`,

  description: `You are given a string containing just the characters '(', ')', '{', '}', '[' and ']'. Your task is to determine if the input string is valid. An input string is valid if open brackets are closed by the same type of bracket and in the correct order.

This is a classic use case for a stack. By iterating through the string, you can push opening brackets onto the stack. When you encounter a closing bracket, you check if the stack is empty or if the top of the stack is the corresponding opening bracket. If it matches, you pop from the stack; otherwise, the string is invalid.

Return true if the string is a valid set of parentheses, and false otherwise. After iterating through the entire string, the stack must also be empty for the string to be valid.`,

  examples: [
    {
      input: '()[]{}',
      output: 'true',
      explanation: 'Each opening bracket is immediately closed by the same type, and there are no unmatched brackets. The stack is empty at the end.'
    },
    {
      input: '(]',
      output: 'false',
      explanation: 'The opening bracket is \'(\' but it is met with a closing \']\'. This is a mismatch, so the string is invalid.'
    },
    {
      input: '([)]',
      output: 'false',
      explanation: 'The sequence is opened with \'([\'. The \')\' closes the \'[\' which is incorrect order. The LIFO rule is violated.'
    }
  ],

  constraints: [
    'The length of the input string is between 1 and 10000.',
    "The string consists of parentheses only: '()[]{}'."
  ],

  boilerplate: {
    cpp: `bool solve(std::string s) {
    // Your code here
    return true;
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <string>
#include <vector>
int main() {
    std::string s;
    std::cin >> s;
    std::cout << (solve(s) ? "true" : "false") << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static boolean solve(String s) {
        // Your code here
        return true;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        System.out.println(Solution.solve(s));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '()', expected: 'true' },
    { input: '()[]{}', expected: 'true' },
    { input: '(]', expected: 'false' },
    { input: '([)]', expected: 'false' },
    { input: '{[]}', expected: 'true' },
    { input: '(', expected: 'false' },
    { input: ')', expected: 'false' },
    { input: '((()))', expected: 'true' },
    { input: '(()', expected: 'false' },
        { input: '[{()}]', expected: 'true' }
  ],
  
  solution: {
    approach: `The algorithm iterates through the input string. A stack is used to keep track of opening brackets. If the current character is an opening bracket ('(', '{', '['), it's pushed onto the stack. If it's a closing bracket, we check if the stack is empty (which would be invalid) or if the top of the stack does not match the corresponding opening bracket. If either is true, the string is invalid. If they do match, we pop the stack. After the loop, the string is valid only if the stack is empty, ensuring all opening brackets were closed.`,
    cpp: `    std::stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) {
                return false;
            }
            if (c == ')' && st.top() != '(') {
                return false;
            }
            if (c == '}' && st.top() != '{') {
                return false;
            }
            if (c == ']' && st.top() != '[') {
                return false;
            }
            st.pop();
        }
    }
    return st.empty();`,
    java: `    java.util.Stack<Character> stack = new java.util.Stack<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) {
                return false;
            }
            char top = stack.pop();
            if (c == ')' && top != '(') {
                return false;
            }
            if (c == '}' && top != '{') {
                return false;
            }
            if (c == ']' && top != '[') {
                return false;
            }
        }
    }
    return stack.isEmpty();`
  }
};