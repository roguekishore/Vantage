/**
 * Largest Rectangle in Histogram - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of bars in the histogram.
 * Line 2: n space-separated integers representing the height of each bar.
 *
 * Output format (stdout):
 * A single integer representing the area of the largest rectangle.
 */

module.exports = {
  id: 'largest-rectangle-in-histogram',
  conquestId: 'stage13-3',
  title: 'Largest Rectangle in Histogram',
  difficulty: 'Hard',
  category: 'Stack – Applications',
  tags: ['Stack', 'Monotonic Stack', 'Array'],

  storyBriefing: `Lupin leads you to the Room of Requirement, which has transformed into a vast, shifting chamber filled with defensive barriers of varying heights. "This is the ultimate challenge of adaptive shielding," he says gravely. "A truly powerful defensive charm doesn't just block one point- it creates the largest possible continuous protective field. Given this sequence of barrier heights, find the maximum rectangular area of magical energy you can project. The height of any field is limited by its shortest barrier. This will require everything you've learned about tracking boundaries."`,

  description: `You are given an array of non-negative integers representing the heights of bars in a histogram, where the width of each bar is 1. Your task is to find the area of the largest rectangle that can be formed within the histogram.

This is a classic and challenging problem that can be solved optimally in a single pass using a monotonic stack. For any given bar, the largest rectangle that can include it has that bar's height. The width of this rectangle is determined by how far you can extend to the left and right before encountering a bar shorter than the current one. The monotonic stack helps efficiently find these left and right boundaries for all bars.

Return a single integer representing the area of the largest possible rectangle.`,

  examples: [
    {
      input: '6\n2 1 5 6 2 3',
      output: '10',
      explanation: 'The largest rectangle has a height of 5 and a width of 2. It is formed by the bars of height 5 and 6, extending from index 2 to 3. The area is 5 * 2 = 10.'
    },
    {
      input: '2\n2 4',
      output: '4',
      explanation: 'Two rectangles can be formed: one with height 2 and width 2 (area 4), and one with height 4 and width 1 (area 4). The max area is 4.'
    },
    {
      input: '1\n5',
      output: '5',
      explanation: 'With a single bar of height 5 and width 1, the maximum area is 5.'
    }
  ],

  constraints: [
    'The number of bars (heights.length) is between 1 and 100000.',
    'The height of each bar is between 0 and 10000.'
  ],

  boilerplate: {
    cpp: `long long solve(int n, std::vector<int>& heights) {
    // Your code here
    return 0;
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
int main() {
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> heights(n);
    for (int i = 0; i < n; i++) std::cin >> heights[i];
    
    std::cout << solve(n, heights) << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static long solve(int n, int[] heights) {
        // Your code here
        return 0;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] heights = new int[n];
        for (int i = 0; i < n; i++) heights[i] = sc.nextInt();
        
        System.out.println(Solution.solve(n, heights));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '6\n2 1 5 6 2 3', expected: '10' },
    { input: '2\n2 4', expected: '4' },
    { input: '1\n5', expected: '5' },
    { input: '5\n1 2 3 4 5', expected: '9' },
    { input: '5\n5 4 3 2 1', expected: '9' },
    { input: '3\n2 1 2', expected: '3' },
    { input: '4\n0 0 0 0', expected: '0' },
    { input: '3\n5 5 5', expected: '15' },
    { input: '7\n6 2 5 4 5 1 6', expected: '12' },
    { input: '2\n1 100', expected: '100' }
  ],
  
  solution: {
    approach: `The O(n) solution uses a monotonic stack that stores the indices of histogram bars in increasing order of height. We iterate through the bars, including a virtual bar of height 0 at the end to flush the stack. For each bar, while the stack is not empty and the current bar's height is less than the height of the bar at the stack's top, we have found the right boundary for the bar at the top. We pop the stack, take its height, and calculate the width. The right boundary is the current index 'i', and the left boundary is the index now at the top of the stack. The area is height * (right_boundary - left_boundary - 1). We continuously update a max_area variable with the largest area found. After the check, we push the current index 'i' onto the stack.`,
    cpp: `    std::stack<int> st; // Stores indices
    long long maxArea = 0;
    
    for (int i = 0; i <= n; ++i) {
        int h = (i == n) ? 0 : heights[i];
        while (!st.empty() && h < heights[st.top()]) {
            int height = heights[st.top()];
            st.pop();
            int width = st.empty() ? i : i - st.top() - 1;
            maxArea = std::max(maxArea, (long long)height * width);
        }
        st.push(i);
    }
    
    return maxArea;`,
    java: `    java.util.Stack<Integer> stack = new java.util.Stack<>(); // Stores indices
    long maxArea = 0;
    
    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];
        
        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, (long)height * width);
        }
        stack.push(i);
    }
    
    return maxArea;`
  }
};