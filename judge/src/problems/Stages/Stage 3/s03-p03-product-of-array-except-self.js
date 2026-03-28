/**
 * Product of Array Except Self - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * n space-separated integers representing the product of all elements except the one at each index.
 */

module.exports = {
  // ---- Identity ----
  id: 'product-of-array-except-self',
  conquestId: 'stage3-3',
  title: 'Product of Array Except Self',
  difficulty: 'Medium',
  category: 'Prefix & Subarray Thinking',
  tags: ['Prefix Sum', 'Suffix Sum', 'Array'],

  // ---- Story Layer ----
  storyBriefing: `Professor Snape has given you a particularly tricky Potions assignment. You have a list of n magical ingredients, each with a potency value. For each ingredient, you must calculate the combined potency of all *other* ingredients in the list. Snape warns you sternly, 'You must solve this without the Divisio charm (the division operation), and do it efficiently, or it's detention for a month!'`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'nums' of size n. Your task is to return an array 'answer' where 'answer[i]' is equal to the product of all the elements of 'nums' except 'nums[i]'. You are guaranteed that the product of any prefix or suffix of 'nums' will fit in a 32-bit integer.

The main challenge is to solve this problem in O(n) time without using the division operator. This can be achieved by making two passes through the array. In the first pass, compute the prefix products where the result at each index i stores the product of all elements before it. In the second pass, iterate backward, multiplying the prefix products by the suffix products to get the final result.

Return a new array of n integers. The elements should be space-separated on a single line.`,
  examples: [
    {
      input: '4\n1 2 3 4',
      output: '24 12 8 6',
      explanation: 'answer[0] = 2*3*4=24. answer[1] = 1*3*4=12. answer[2] = 1*2*4=8. answer[3] = 1*2*3=6.'
    },
    {
      input: '5\n-1 1 0 -3 3',
      output: '0 0 9 0 0',
      explanation: 'Any product involving the zero at index 2 will be zero. The only non-zero result is at index 2, which is (-1)*1*(-3)*3 = 9.'
    },
    {
      input: '2\n5 10',
      output: '10 5',
      explanation: 'answer[0] is 10. answer[1] is 5.'
    }
  ],
  constraints: [
    '2 <= n <= 10^5',
    '-30 <= nums[i] <= 30',
    'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

vector<int> solve(int n, vector<int>& nums) {
    vector<int> result(n, 1);
    // Your code here
    
    return result;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    
    vector<int> result = solve(n, nums);
    
    for (int i = 0; i < n; i++) {
        cout << result[i] << (i == n - 1 ? "" : " ");
    }
    cout << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.Arrays;

public class Main {
    public static int[] solve(int n, int[] nums) {
        int[] result = new int[n];
        // Your code here
        
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        
        int[] result = solve(n, nums);
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(result[i]);
            if (i < n - 1) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '4\n1 2 3 4', expected: '24 12 8 6' },
    { input: '5\n-1 1 0 -3 3', expected: '0 0 9 0 0' },
    { input: '2\n10 20', expected: '20 10' },
    { input: '3\n1 1 1', expected: '1 1 1' },
    { input: '4\n0 0 1 2', expected: '0 0 0 0' },
    { input: '5\n1 -1 1 -1 1', expected: '1 -1 1 -1 1' },
    { input: '3\n5 10 2', expected: '20 10 50' },
    { input: '6\n1 2 3 0 5 6', expected: '0 0 0 180 0 0' },
    { input: '4\n-2 -1 -3 -4', expected: '-12 -24 -8 -6' },
    { input: '2\n-5 5', expected: '5 -5' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem can be solved in O(n) time and O(1) extra space (the result array doesn't count) by using two passes. First, create a result array. In the first pass, iterate from left to right, calculating the prefix product. For each index i, result[i] will store the product of all elements to its left. In the second pass, iterate from right to left, maintaining a variable for the suffix product. Multiply the current result[i] by the suffix product to get the final value.`,
    cpp: `int prefix = 1;
for (int i = 0; i < n; ++i) {
    result[i] = prefix;
    prefix *= nums[i];
}
int suffix = 1;
for (int i = n - 1; i >= 0; --i) {
    result[i] *= suffix;
    suffix *= nums[i];
}
return result;`,
    java: `Arrays.fill(result, 1);
int prefix = 1;
for (int i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
}
int suffix = 1;
for (int i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
}
return result;`
  }
};