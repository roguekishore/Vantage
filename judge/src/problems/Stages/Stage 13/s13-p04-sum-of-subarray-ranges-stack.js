/**
 * Sum of Subarray Ranges (O(n) Stack) - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single long long integer representing the sum of all subarray ranges.
 */

module.exports = {
  id: 'sum-of-subarray-ranges-stack',
  conquestId: 'stage13-4',
  title: 'Sum of Subarray Ranges',
  difficulty: 'Hard',
  category: 'Stack – Applications',
  tags: ['Stack', 'Monotonic Stack', 'Array', 'Math'],

  storyBriefing: `"Outstanding," Lupin says, dismantling the barriers. "You have a true talent for this. One final thought exercise. Instead of finding one maximum area, consider all possible continuous sub-sequences of barriers. For each one, find the difference between its tallest and shortest barrier-its 'range'. Your final task is to calculate the sum of all such ranges. This will give us a total measure of the chamber's volatility. It's a complex calculation, but a clever witch or wizard might realize that the sum of maximums minus the sum of minimums gives the answer."`,

  description: `You are given an array of integers 'nums'. The range of a subarray is the difference between the largest and smallest elements in that subarray. Your task is to calculate the sum of all subarray ranges of 'nums'.

A brute-force O(n^2) approach would iterate through all subarrays, find their min and max, and sum the differences, which is too slow. The optimal O(n) solution relies on a mathematical insight: the sum of all ranges is equal to (the sum of all subarray maximums) - (the sum of all subarray minimums). We can find these two sums separately using a monotonic stack.

For each element, calculate its contribution as a minimum and as a maximum to all subarrays it belongs to. This is done by finding its Previous/Next Smaller/Greater element to define its boundaries, a classic monotonic stack application.`,

  examples: [
    {
      input: '3\n1 2 3',
      output: '4',
      explanation: 'Subarrays are [1], [2], [3], [1, 2], [2, 3], [1, 2, 3]. Ranges are 0, 0, 0, 1, 1, 2. The sum is 0+0+0+1+1+2 = 4.'
    },
    {
      input: '4\n1 3 3 2',
      output: '8',
      explanation: 'The ranges are: [1]:0, [3]:0, [3]:0, [2]:0, [1,3]:2, [3,3]:0, [3,2]:1, [1,3,3]:2, [3,3,2]:1, [1,3,3,2]:2. Sum = 0+0+0+0+2+0+1+2+1+2 = 8.'
    },
    {
      input: '1\n10',
      output: '0',
      explanation: 'A single element subarray has a range of 10 - 10 = 0.'
    }
  ],

  constraints: [
    'The length of the array is between 1 and 100000.',
    'The value of each element is between -10^9 and 10^9.'
  ],

  boilerplate: {
    cpp: `long long solve(int n, std::vector<int>& nums) {
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
    std::vector<int> nums(n);
    for (int i = 0; i < n; i++) std::cin >> nums[i];
    std::cout << solve(n, nums) << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static long solve(int n, int[] nums) {
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
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        System.out.println(Solution.solve(n, nums));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '3\n1 2 3', expected: '4' },
    { input: '3\n3 2 1', expected: '4' },
    { input: '1\n100', expected: '0' },
    { input: '4\n1 3 3 1', expected: '8' },
    { input: '4\n1 1 1 1', expected: '0' },
    { input: '2\n10 1', expected: '9' },
    { input: '5\n1 2 3 4 5', expected: '20' },
    { input: '5\n5 4 3 2 1', expected: '20' },
    { input: '2\n-1 1', expected: '2' },
    { input: '4\n4 -2 -3 4', expected: '59' }
  ],
  
  solution: {
    approach: `The solution calculates the sum of maximums for all subarrays and subtracts the sum of minimums for all subarrays. To do this in O(n) time, we run a monotonic stack algorithm four times: to find the previous smaller, next smaller, previous greater, and next greater element for every element in the array. For each element nums[i], the number of subarrays where it is the minimum is (i - prev_smaller_index) * (next_smaller_index - i). We multiply this count by nums[i] to get its total contribution to the sum of minimums. We do the same for maximums using the greater element boundaries and sum up the contributions for all elements.`,
    cpp: `    long long sum_max = 0, sum_min = 0;
    std::vector<int> ple(n), nle(n), pge(n), nge(n);
    std::stack<int> st;

    // Prev smaller
    for(int i = 0; i < n; ++i) {
        while(!st.empty() && nums[st.top()] > nums[i]) st.pop();
        ple[i] = st.empty() ? -1 : st.top();
        st.push(i);
    }
    while(!st.empty()) st.pop();

    // Next smaller
    for(int i = n - 1; i >= 0; --i) {
        while(!st.empty() && nums[st.top()] >= nums[i]) st.pop();
        nle[i] = st.empty() ? n : st.top();
        st.push(i);
    }
    while(!st.empty()) st.pop();

    // Prev greater
    for(int i = 0; i < n; ++i) {
        while(!st.empty() && nums[st.top()] < nums[i]) st.pop();
        pge[i] = st.empty() ? -1 : st.top();
        st.push(i);
    }
    while(!st.empty()) st.pop();

    // Next greater
    for(int i = n - 1; i >= 0; --i) {
        while(!st.empty() && nums[st.top()] <= nums[i]) st.pop();
        nge[i] = st.empty() ? n : st.top();
        st.push(i);
    }

    for(int i = 0; i < n; ++i) {
        long long left_min = i - ple[i];
        long long right_min = nle[i] - i;
        sum_min += nums[i] * left_min * right_min;
        
        long long left_max = i - pge[i];
        long long right_max = nge[i] - i;
        sum_max += nums[i] * left_max * right_max;
    }

    return sum_max - sum_min;`,
    java: `    long sumMax = 0, sumMin = 0;
    int[] prevSmaller = new int[n];
    int[] nextSmaller = new int[n];
    int[] prevGreater = new int[n];
    int[] nextGreater = new int[n];
    java.util.Stack<Integer> st = new java.util.Stack<>();

    // Prev smaller
    for(int i = 0; i < n; ++i) {
        while(!st.isEmpty() && nums[st.peek()] > nums[i]) st.pop();
        prevSmaller[i] = st.isEmpty() ? -1 : st.peek();
        st.push(i);
    }
    st.clear();

    // Next smaller
    for(int i = n - 1; i >= 0; --i) {
        while(!st.isEmpty() && nums[st.peek()] >= nums[i]) st.pop();
        nextSmaller[i] = st.isEmpty() ? n : st.peek();
        st.push(i);
    }
    st.clear();

    // Prev greater
    for(int i = 0; i < n; ++i) {
        while(!st.isEmpty() && nums[st.peek()] < nums[i]) st.pop();
        prevGreater[i] = st.isEmpty() ? -1 : st.peek();
        st.push(i);
    }
    st.clear();

    // Next greater
    for(int i = n - 1; i >= 0; --i) {
        while(!st.isEmpty() && nums[st.peek()] <= nums[i]) st.pop();
        nextGreater[i] = st.isEmpty() ? n : st.peek();
        st.push(i);
    }

    for(int i = 0; i < n; ++i) {
        long leftMin = i - prevSmaller[i];
        long rightMin = nextSmaller[i] - i;
        sumMin += (long)nums[i] * leftMin * rightMin;
        
        long leftMax = i - prevGreater[i];
        long rightMax = nextGreater[i] - i;
        sumMax += (long)nums[i] * leftMax * rightMax;
    }

    return sumMax - sumMin;`
  }
};