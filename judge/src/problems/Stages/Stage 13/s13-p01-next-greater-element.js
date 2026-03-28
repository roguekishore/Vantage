/**
 * Next Greater Element I - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated integers representing the array.
 *
 * Output format (stdout):
 * n space-separated integers where each element is the next greater element 
 * of the input at that position. If no greater element exists, output -1.
 */

module.exports = {
  id: 'next-greater-element',
  conquestId: 'stage13-1',
  title: 'Next Greater Element',
  difficulty: 'Medium',
  category: 'Stack – Applications',
  tags: ['Stack', 'Monotonic Stack', 'Array'],

  stageIntro: `Your work in the Weasleys' workshop has not gone unnoticed. Professor Lupin, impressed by your logical thinking, decides to introduce you to more advanced defensive magic applications. He explains that in a duel, anticipating an opponent's next move is key. Often, this means identifying the next spell in a sequence that is more powerful than the current one. This concept of finding the "next greater element" is crucial for building magical shields that can adapt to escalating threats.`,

  storyBriefing: `Lupin creates a sequence of magical training dummies, each with a specific power level. "For each dummy in this line," he instructs, "I want you to identify the power level of the very first dummy to its right that is stronger. If no stronger dummy exists to its right, note that. This will train you to quickly assess future threats in a sequence. A well-organized stack of notes might help you keep track of the dummies you've seen but haven't yet found a greater one for."`,

  description: `You are given an array of integers. For each element in the array, your task is to find the first element to its right that is strictly greater than it. This is known as the "Next Greater Element" (NGE). If no such element exists, the Next Greater Element is considered to be -1.

A naive approach using nested loops would be too slow for large inputs. A more optimal solution uses a monotonic stack, which processes the array in a single pass. The stack stores indices of elements for which the NGE has not yet been found, maintaining them in a decreasing order of value.

Return an array of the same size, where each index contains the Next Greater Element for the corresponding index in the input array.`,

  examples: [
    {
      input: '4\n4 5 2 25',
      output: '5 25 25 -1',
      explanation: 'For 4, the next greater is 5. For 5, the next greater is 25. For 2, the next greater is 25. For 25, there is no greater element to its right, so it is -1.'
    },
    {
      input: '5\n5 4 3 2 1',
      output: '-1 -1 -1 -1 -1',
      explanation: 'In a strictly decreasing array, no element has a next greater element to its right.'
    },
    {
      input: '1\n100',
      output: '-1',
      explanation: 'A single element array has no elements to its right, so its Next Greater Element is -1.'
    }
  ],

  constraints: [
    'The size of the array is between 1 and 100000.',
    'The value of each element is between 0 and 10^9.'
  ],

  boilerplate: {
    cpp: `std::vector<int> solve(int n, std::vector<int>& arr) {
    // Your code here
    return {};
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
int main() {
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; i++) std::cin >> arr[i];
    
    std::vector<int> result = solve(n, arr);
    for (int i = 0; i < n; i++) {
        std::cout << result[i] << (i == n - 1 ? "" : " ");
    }
    std::cout << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static int[] solve(int n, int[] arr) {
        // Your code here
        return new int[n];
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        
        int[] result = Solution.solve(n, arr);
        for (int i = 0; i < n; i++) {
            System.out.print(result[i] + (i == n - 1 ? "" : " "));
        }
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '4\n4 5 2 25', expected: '5 25 25 -1' },
    { input: '5\n5 4 3 2 1', expected: '-1 -1 -1 -1 -1' },
    { input: '5\n1 2 3 4 5', expected: '2 3 4 5 -1' },
    { input: '1\n100', expected: '-1' },
    { input: '2\n10 20', expected: '20 -1' },
    { input: '2\n20 10', expected: '-1 -1' },
    { input: '7\n1 5 2 10 3 4 12', expected: '5 10 10 12 4 12 -1' },
    { input: '6\n3 3 3 3 3 3', expected: '-1 -1 -1 -1 -1 -1' },
    { input: '8\n8 1 2 4 9 5 3 10', expected: '9 2 4 9 10 10 10 -1' },
    { input: '5\n0 1 0 1 0', expected: '1 -1 1 -1 -1' }
  ],
  
  solution: {
    approach: `The optimal O(n) approach uses a monotonic stack that stores indices of the elements. We iterate through the array from left to right. For each element, we check if the stack is non-empty and if the current element is greater than the element at the index on top of the stack. If it is, we've found the Next Greater Element for the index at the top. We pop the stack and update our result array, repeating this until the condition is no longer met. Finally, we push the current element's index onto the stack. This ensures the stack always maintains indices of elements in decreasing order of their values.`,
    cpp: `    std::vector<int> res(n, -1);
    std::stack<int> st; // Stores indices
    
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && arr[i] > arr[st.top()]) {
            res[st.top()] = arr[i];
            st.pop();
        }
        st.push(i);
    }
    
    return res;`,
    java: `    int[] res = new int[n];
    java.util.Arrays.fill(res, -1);
    java.util.Stack<Integer> st = new java.util.Stack<>(); // Stores indices
    
    for (int i = 0; i < n; ++i) {
        while (!st.isEmpty() && arr[i] > arr[st.peek()]) {
            res[st.pop()] = arr[i];
        }
        st.push(i);
    }
    
    return res;`
  }
};