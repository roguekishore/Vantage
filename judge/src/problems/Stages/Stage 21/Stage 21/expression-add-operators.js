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
  title: "The Unspeakable's Code",
  difficulty: 'Hard',
  category: 'Backtracking',
  tags: ['Backtracking', 'Recursion', 'String', 'Math'],
  storyBriefing: `
You've intercepted a coded message from an Unspeakable, one of the secretive wizards who study the mysteries of the Department. The message is a string of digits and a target number.

To decipher it, you must insert addition (+), subtraction (-), or multiplication (*) operators between the digits to form an expression that equals the target. The order of the digits cannot be changed. Find all possible ways to decode the message.
`,
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
    cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

class Solution {
public:
    void backtrack(string& num, int target, int pos, long current_val, long prev_val, string current_expr, vector<string>& result) {
        if (pos == num.length()) {
            if (current_val == target) {
                result.push_back(current_expr);
            }
            return;
        }

        for (int i = pos; i < num.length(); ++i) {
            if (i != pos && num[pos] == '0') break;
            string part_str = num.substr(pos, i - pos + 1);
            long part_val = stol(part_str);

            if (pos == 0) {
                backtrack(num, target, i + 1, part_val, part_val, part_str, result);
            } else {
                backtrack(num, target, i + 1, current_val + part_val, part_val, current_expr + "+" + part_str, result);
                backtrack(num, target, i + 1, current_val - part_val, -part_val, current_expr + "-" + part_str, result);
                backtrack(num, target, i + 1, current_val - prev_val + prev_val * part_val, prev_val * part_val, current_expr + "*" + part_str, result);
            }
        }
    }

    vector<string> addOperators(string num, int target) {
        vector<string> result;
        if (num.empty()) return result;
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
        public List<String> addOperators(String num, int target) {
            List<String> result = new ArrayList<>();
            if (num == null || num.length() == 0) return result;
            backtrack(result, "", num, target, 0, 0, 0);
            return result;
        }

        private void backtrack(List<String> result, String path, String num, int target, int pos, long eval, long multed) {
            if (pos == num.length()) {
                if (target == eval) {
                    result.add(path);
                }
                return;
            }
            for (int i = pos; i < num.length(); i++) {
                if (i != pos && num.charAt(pos) == '0') break;
                long cur = Long.parseLong(num.substring(pos, i + 1));
                if (pos == 0) {
                    backtrack(result, path + cur, num, target, i + 1, cur, cur);
                } else {
                    backtrack(result, path + "+" + cur, num, target, i + 1, eval + cur, cur);
                    backtrack(result, path + "-" + cur, num, target, i + 1, eval - cur, -cur);
                    backtrack(result, path + "*" + cur, num, target, i + 1, eval - multed + multed * cur, multed * cur);
                }
            }
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String num = sc.next();
        int target = sc.nextInt();

        Solution sol = new Solution();
        List<String> result = sol.addOperators(num, target);

        Collections.sort(result);
        for (String s : result) {
            System.out.println(s);
        }
    }
}`
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

class Solution {
public:
    void backtrack(string& num, int target, int pos, long current_val, long prev_val, string current_expr, vector<string>& result) {
        if (pos == num.length()) {
            if (current_val == target) {
                result.push_back(current_expr);
            }
            return;
        }

        for (int i = pos; i < num.length(); ++i) {
            if (i != pos && num[pos] == '0') break;
            string part_str = num.substr(pos, i - pos + 1);
            long part_val = stol(part_str);

            if (pos == 0) {
                backtrack(num, target, i + 1, part_val, part_val, part_str, result);
            } else {
                backtrack(num, target, i + 1, current_val + part_val, part_val, current_expr + "+" + part_str, result);
                backtrack(num, target, i + 1, current_val - part_val, -part_val, current_expr + "-" + part_str, result);
                backtrack(num, target, i + 1, current_val - prev_val + prev_val * part_val, prev_val * part_val, current_expr + "*" + part_str, result);
            }
        }
    }

    vector<string> addOperators(string num, int target) {
        vector<string> result;
        if (num.empty()) return result;
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
        public List<String> addOperators(String num, int target) {
            List<String> result = new ArrayList<>();
            if (num == null || num.length() == 0) return result;
            backtrack(result, "", num, target, 0, 0, 0);
            return result;
        }

        private void backtrack(List<String> result, String path, String num, int target, int pos, long eval, long multed) {
            if (pos == num.length()) {
                if (target == eval) {
                    result.add(path);
                }
                return;
            }
            for (int i = pos; i < num.length(); i++) {
                if (i != pos && num.charAt(pos) == '0') break;
                long cur = Long.parseLong(num.substring(pos, i + 1));
                if (pos == 0) {
                    backtrack(result, path + cur, num, target, i + 1, cur, cur);
                } else {
                    backtrack(result, path + "+" + cur, num, target, i + 1, eval + cur, cur);
                    backtrack(result, path + "-" + cur, num, target, i + 1, eval - cur, -cur);
                    backtrack(result, path + "*" + cur, num, target, i + 1, eval - multed + multed * cur, multed * cur);
                }
            }
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String num = sc.next();
        int target = sc.nextInt();

        Solution sol = new Solution();
        List<String> result = sol.addOperators(num, target);

        Collections.sort(result);
        for (String s : result) {
            System.out.println(s);
        }
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