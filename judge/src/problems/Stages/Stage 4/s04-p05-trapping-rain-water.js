/**
 * Trapping Rain Water - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of bars.
 * Line 2: n space-separated integers representing the height of each bar.
 *
 * Output format (stdout):
 * A single integer representing the total units of water trapped between the bars.
 */

module.exports = {
  // ---- Identity ----
  id: 'trapping-rain-water',
  conquestId: 'stage4-5',
  title: 'Trapping Rain Water',
  difficulty: 'Hard',
  category: 'Two Pointers',
  tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],

  // ---- Story Layer ----
  storyBriefing: `Your skills are put to a true test during a sudden magical downpour in the Hogwarts courtyards. The uneven flagstones have formed a series of barriers. Professor McGonagall tasks you with a challenge of magical engineering: calculate the total amount of rainwater that can be trapped between these stone barriers. This will require you to consider the heights of walls on both sides of any given point to determine how much water can be held.`,

  // ---- Technical Layer ----
  description: `You are given an array of n non-negative integers representing an elevation map where the width of each bar is 1. Your task is to compute how much water can be trapped between the bars after raining.

An efficient O(n) time and O(1) space solution uses a two-pointer approach. Initialize 'left' and 'right' pointers at the ends of the array, and 'leftMax' and 'rightMax' variables to track the maximum height seen from each side. At each step, compare the heights at the pointers. If the height at 'left' is less than at 'right', process the left side. The water trapped at the 'left' pointer is determined by 'leftMax'. Similarly, process the right side if its height is smaller.

Return a single integer representing the total units of water trapped.`,
  examples: [
    {
      input: '12\n0 1 0 2 1 0 1 3 2 1 2 1',
      output: '6',
      explanation: 'The structure traps 1 unit of water at index 2, 1 at index 4, 2 at index 5, 1 at index 6, and 1 at index 9. Total is 1+1+2+1+1=6.'
    },
    {
      input: '6\n4 2 0 3 2 5',
      output: '9',
      explanation: 'At index 1 (height 2), leftMax is 4, so it traps 2 units. At index 2 (height 0), leftMax is 4, traps 4 units. At index 3 (height 3), leftMax is 4, rightMax is 5, traps 1 unit. At index 4 (height 2), rightMax is 5, traps 3 units. Total = 2+4+1+2=9.'
    },
    {
      input: '3\n5 1 3',
      output: '2',
      explanation: 'At index 1 (height 1), leftMax is 5 and rightMax will be 3. The water level is min(5,3)=3. Water trapped is 3-1=2.'
    }
  ],
  constraints: [
    '1 <= n <= 2 * 10^4',
    '0 <= height[i] <= 10^5'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int solve(int n, vector<int>& height) {
    if (n == 0) return 0;
    int trappedWater = 0;
    // Your code here
    
    return trappedWater;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> height(n);
    for (int i = 0; i < n; i++) cin >> height[i];
    
    cout << solve(n, height) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, int[] height) {
        if (n == 0) return 0;
        int trappedWater = 0;
        // Your code here
        
        return trappedWater;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] height = new int[n];
        for (int i = 0; i < n; i++) height[i] = sc.nextInt();
        
        System.out.println(solve(n, height));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expected: '6' },
    { input: '6\n4 2 0 3 2 5', expected: '9' },
    { input: '1\n10', expected: '0' },
    { input: '2\n10 20', expected: '0' },
    { input: '5\n5 4 3 2 1', expected: '0' },
    { input: '5\n1 2 3 4 5', expected: '0' },
    { input: '5\n5 5 5 5 5', expected: '0' },
    { input: '6\n5 0 0 0 0 5', expected: '20' },
    { input: '4\n0 0 0 0', expected: '0' },
    { input: '7\n10 0 10 0 10 0 10', expected: '30' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The most space-efficient O(n) solution uses two pointers and two variables to track the maximum height seen from the left and right. Initialize 'left' at 0, 'right' at n-1, 'leftMax' at 0, and 'rightMax' at 0. While 'left' is less than 'right', compare height[left] and height[right]. If height[left] is smaller, update 'leftMax' and add 'leftMax - height[left]' to the total trapped water, then increment 'left'. Otherwise, do the same for the right side: update 'rightMax', add 'rightMax - height[right]' to the total, and decrement 'right'. The water trapped at any point is determined by the minimum of the max heights on either side.`,
    cpp: `int left = 0, right = n - 1;
int leftMax = 0, rightMax = 0;
while (left < right) {
    if (height[left] < height[right]) {
        if (height[left] >= leftMax) {
            leftMax = height[left];
        } else {
            trappedWater += leftMax - height[left];
        }
        left++;
    } else {
        if (height[right] >= rightMax) {
            rightMax = height[right];
        } else {
            trappedWater += rightMax - height[right];
        }
        right--;
    }
}
return trappedWater;`,
    java: `int left = 0, right = n - 1;
int leftMax = 0, rightMax = 0;
while (left < right) {
    if (height[left] < height[right]) {
        if (height[left] >= leftMax) {
            leftMax = height[left];
        } else {
            trappedWater += leftMax - height[left];
        }
        left++;
    } else {
        if (height[right] >= rightMax) {
            rightMax = height[right];
        } else {
            trappedWater += rightMax - height[right];
        }
        right--;
    }
}
return trappedWater;`
  }
};