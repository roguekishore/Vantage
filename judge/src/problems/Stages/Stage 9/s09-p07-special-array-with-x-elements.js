/**
 * Special Array With X Elements Greater Than or Equal X - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated non-negative integers.
 *
 * Output format (stdout):
 * A single integer x if the array is special, otherwise -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'special-array-with-x-elements',
  conquestId: 'stage9-7',
  title: 'Special Array With X Elements Greater Than or Equal X',
  difficulty: 'Easy',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search', 'Sorting'],

  // ---- Story Layer ----
  storyBriefing: `Nearly Headless Nick praises your progress and offers one final, peculiar puzzle from the castle's archives. He calls an array 'special' if there's a number 'x' where exactly 'x' elements in the array are greater than or equal to 'x'. He provides you with an array of ghostly energy readings and asks you to find this special number 'x'.`,

  // ---- Technical Layer ----
  description: `You are given an array 'nums' of non-negative integers. The array is 'special' if there exists a number 'x' such that there are exactly 'x' numbers in 'nums' that are greater than or equal to 'x'. The number 'x' does not have to be an element in 'nums'.

If the array is special, the value 'x' is unique. Your task is to find and return 'x'. If the array is not special, return -1. While sorting and iterating provides one solution, this can also be solved by binary searching on the answer 'x'. The possible values for 'x' range from 0 to the length of the array.

Return the special number 'x' if it exists, otherwise return -1.`,
  examples: [
    {
      input: '2\n3 5',
      output: '2',
      explanation: 'If x=2, there are exactly two numbers (3 and 5) that are >= 2. So, 2 is the special number.'
    },
    {
      input: '2\n0 0',
      output: '-1',
      explanation: 'If x=0, there are 2 numbers >= 0. If x=1, there are 0 numbers >= 1. If x=2, there are 0 numbers >= 2. No value of x works.'
    },
    {
      input: '5\n0 4 3 0 4',
      output: '3',
      explanation: 'If x=3, there are exactly three numbers (4, 3, and 4) that are >= 3. So, 3 is the special number.'
    }
  ],
  constraints: [
    '1 <= nums.length <= 100',
    '0 <= nums[i] <= 1000'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int solve(int n, vector<int>& nums) {
    // Your code here
    
    return -1;
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    
    cout << solve(n, nums) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.Arrays;

public class Main {
    public static int solve(int n, int[] nums) {
        // Your code here
        
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        
        System.out.println(solve(n, nums));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '2\n3 5', expected: '2' },
    { input: '2\n0 0', expected: '-1' },
    { input: '5\n0 4 3 0 4', expected: '3' },
    { input: '1\n100', expected: '1' },
    { input: '1\n0', expected: '-1' },
    { input: '3\n1 2 3', expected: '2' },
    { input: '5\n1 1 1 1 1', expected: '-1' },
    { input: '5\n5 5 5 5 5', expected: '5' },
    { input: '5\n0 0 0 0 0', expected: '-1' },
    { input: '4\n1 2 3 4', expected: '-1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `A straightforward approach is to iterate through all possible values of 'x' from 0 to the length of the array. For each 'x', count how many numbers in the 'nums' array are greater than or equal to 'x'. If this count is exactly equal to 'x', then we have found the special number and can return it immediately. If the loop finishes without finding such an 'x', the array is not special, and we return -1.`,
    cpp: `for (int x = 0; x <= n; ++x) {
    int count = 0;
    for (int num : nums) {
        if (num >= x) {
            count++;
        }
    }
    if (count == x) {
        return x;
    }
}
return -1;`,
    java: `for (int x = 0; x <= n; x++) {
    int count = 0;
    for (int num : nums) {
        if (num >= x) {
            count++;
        }
    }
    if (count == x) {
        return x;
    }
}
return -1;`
  }
};