/**
 * Remove K Digits - Problem Definition
 *
 * Input format (stdin):
 * Line 1: A string representing a non-negative integer 'num'.
 * Line 2: An integer 'k'.
 *
 * Output format (stdout):
 * The smallest possible integer after removing k digits, as a string.
 */

module.exports = {
  id: 'remove-k-digits',
  conquestId: 'stage13-2',
  title: 'Remove K Digits',
  difficulty: 'Medium',
  category: 'Stack – Applications',
  tags: ['Stack', 'Greedy', 'Monotonic Stack', 'String'],
  
  storyBriefing: `Lupin smiles. "Excellent. Now for a more complex application. Imagine this long number represents the magical signature of a curse. We've discovered that we can weaken the curse by removing 'k' digits from its signature. To make the curse as weak as possible, we need to make the resulting number as small as possible. The key is to remove larger digits that appear before smaller ones. How would you determine the weakest possible signature?"`,

  description: `You are given a string 'num' representing a non-negative integer, and an integer 'k'. Your task is to remove 'k' digits from the number so that the new number is the smallest possible.

This problem can be solved greedily using a monotonic stack. The goal is to keep the digits in the resulting number as small as possible from left to right. By iterating through the digits, you can use a stack to build the result. If the current digit is smaller than the digit at the top of the stack, popping the stack effectively removes a larger, more significant digit, which is the optimal greedy choice.

Return the smallest possible number as a string after removing 'k' digits. You must also handle leading zeros and cases where the result is an empty string.`,

  examples: [
    {
      input: '1432219\n3',
      output: '1219',
      explanation: 'To get the smallest number, we remove the peaks. Remove 4 (since 3 is smaller). Stack is [1, 3]. Remove 3 (since 2 is smaller). Stack is [1, 2]. Remove 2 (since 1 is smaller). Stack is [1, 2, 1]. After processing, the stack-based result is 1219.'
    },
    {
      input: '10200\n1',
      output: '200',
      explanation: 'Removing the leading 1 gives the smallest result. The output \'0200\' is formatted as \'200\'.'
    },
    {
      input: '10\n2',
      output: '0',
      explanation: 'Removing both digits \'1\' and \'0\' results in an empty string, which should be represented as \'0\'.'
    }
  ],

  constraints: [
    'The length of num is between 1 and 100000.',
    'k is between 0 and the length of num.',
    'num consists of only digits and does not have any leading zeros except for the zero itself.'
  ],

  boilerplate: {
    cpp: `std::string solve(std::string num, int k) {
    // Your code here
    return "";
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <string>
#include <vector>
int main() {
    std::string num;
    int k;
    if (!(std::cin >> num >> k)) return 0;
    std::cout << solve(num, k) << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static String solve(String num, int k) {
        // Your code here
        return "";
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNext()) return;
        String num = sc.next();
        int k = sc.nextInt();
        System.out.println(Solution.solve(num, k));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '1432219\n3', expected: '1219' },
    { input: '10200\n1', expected: '200' },
    { input: '10\n2', expected: '0' },
    { input: '10\n1', expected: '0' },
    { input: '112\n1', expected: '11' },
    { input: '54321\n2', expected: '321' },
    { input: '12345\n2', expected: '123' },
    { input: '9\n1', expected: '0' },
    { input: '4321\\n4', expected: '0' },
    { input: '2341\\n2', expected: '21' }
  ],
  
  solution: {
    approach: `The algorithm uses a stack-like structure (a string or a character stack) to build the result. We iterate through each digit of the input number. While the stack is not empty, the current digit is smaller than the top of the stack, and we still have removals (k > 0), we pop from the stack and decrement k. This greedily removes larger digits that appear before smaller ones. After this loop, we push the current digit onto the stack. After iterating through all digits, if k is still greater than 0, it means the remaining digits on the stack are in increasing order, so we remove the largest ones from the end (top of the stack). Finally, we remove any leading zeros and handle the case of an empty result, which should be '0'.`,
    cpp: `    std::string s;
    for (char c : num) {
        while (!s.empty() && k > 0 && s.back() > c) {
            s.pop_back();
            k--;
        }
        s.push_back(c);
    }

    while (k > 0) {
        s.pop_back();
        k--;
    }

    size_t first_digit = s.find_first_not_of('0');
    if (std::string::npos != first_digit) {
        return s.substr(first_digit);
    }
    
    return s.empty() ? "0" : s;`,
    java: `    if (k >= num.length()) return "0";

    java.util.Stack<Character> stack = new java.util.Stack<>();

    for (char c : num.toCharArray()) {
        while (!stack.isEmpty() && k > 0 && stack.peek() > c) {
            stack.pop();
            k--;
        }
        stack.push(c);
    }

    while (k > 0) {
        stack.pop();
        k--;
    }

    StringBuilder sb = new StringBuilder();
    while(!stack.isEmpty()) {
        sb.append(stack.pop());
    }
    sb.reverse();

    while (sb.length() > 1 && sb.charAt(0) == '0') {
        sb.deleteCharAt(0);
    }

    return sb.length() == 0 ? "0" : sb.toString();`
  }
};