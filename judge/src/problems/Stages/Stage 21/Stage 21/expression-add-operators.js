/**
 * Expression Add Operators - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: A numeric string `num` consisting of digits (0-9)
 *   Line 2: An integer `target`
 *
 * Output format (stdout):
 *   Print all valid expressions that evaluate to the target value.
 *   Each expression should be printed on a new line.
 *   If no expression exists, print an empty line.
 */

module.exports = {
  id: 'expression-add-operators',
  conquestId: 'stage21-12',
  title: 'Expression Add Operators',
  difficulty: 'Hard',
  category: 'Backtracking',
  tags: ['Backtracking', 'Recursion', 'String', 'Math'],

  description: `
Given a string **num** that contains only digits and an integer **target**, return **all possible expressions** by inserting the binary operators \`+\`, \`-\`, or \`*\` between the digits so that the resulting expression evaluates to **target**.

You must **not change the order of digits** in the string.

Notes:
- Numbers in the expression cannot contain **leading zeros** unless the number itself is \`0\`.
- The multiplication operator \`*\` has **higher precedence** than \`+\` and \`-\`.
- Return **all valid expressions** that evaluate to the target.

This problem is typically solved using **backtracking**, where we recursively try placing each operator between digits and evaluate expressions while maintaining previous results.
`,

  examples: [
    {
      input: '123\n6',
      output: '1+2+3\n1*2*3',
      explanation: 'Both expressions evaluate to 6.'
    },
    {
      input: '232\n8',
      output: '2*3+2\n2+3*2',
      explanation: 'Both valid expressions evaluate to 8.'
    },
    {
      input: '105\n5',
      output: '1*0+5\n10-5',
      explanation: 'Leading zeros are not allowed, but "0" itself is allowed.'
    }
  ],

  constraints: [
    '1 ≤ num.length ≤ 10',
    'num consists of digits only',
    '-2³¹ ≤ target ≤ 2³¹ - 1'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void backtrack(string num, long target, int pos, long value, long prev,
                   string expr, vector<string>& result) {
        // TODO: Implement backtracking logic
    }

    vector<string> addOperators(string num, long target) {
        vector<string> result;
        backtrack(num, target, 0, 0, 0, "", result);
        return result;
    }
};

int main() {
    string num;
    long target;
    cin >> num;
    cin >> target;

    Solution sol;
    vector<string> result = sol.addOperators(num, target);

    sort(result.begin(), result.end());
    for (string &s : result) {
        cout << s << endl;
    }

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {

        void backtrack(String num, long target, int pos, long value, long prev,
                       String expr, List<String> result) {
            // TODO: Implement backtracking logic
        }

        public List<String> addOperators(String num, long target) {
            List<String> result = new ArrayList<>();
            backtrack(num, target, 0, 0, 0, "", result);
            return result;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        String num = sc.next();
        long target = sc.nextLong();

        Solution sol = new Solution();
        List<String> result = sol.addOperators(num, target);

        Collections.sort(result);
        for (String s : result) {
            System.out.println(s);
        }

        sc.close();
    }
}`
  },

  testCases: [
    {
      input: '123\n6',
      expected: '1*2*3\n1+2+3'
    },
    {
      input: '232\n8',
      expected: '2*3+2\n2+3*2'
    },
    {
      input: '105\n5',
      expected: '1*0+5\n10-5'
    },
    {
      input: '00\n0',
      expected: '0*0\n0+0\n0-0'
    },
    {
      input: '3456237490\n9191',
      expected: ''
    },
    {
      input: '123\n123',
      expected: '123'
    },
    {
      input: '111\n3',
      expected: '1*1+1\n1+1+1'
    },
    {
      input: '222\n6',
      expected: '2*2+2\n2+2+2'
    },
    {
      input: '12\n2',
      expected: '1*2'
    },
    {
      input: '999\n27',
      expected: '9*9+9\n9+9*9'
    }
  ],
};