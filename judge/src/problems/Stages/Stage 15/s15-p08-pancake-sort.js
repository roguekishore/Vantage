/**
 * Pancake Sort - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * The sorted array as n space-separated integers.
 */

module.exports = {
  id: 'pancake-sort',
  conquestId: 'stage15-8',
  title: 'Pancake Sort',
  difficulty: 'Medium',
  category: 'Sorting',
  tags: ['Sorting', 'Array', 'Greedy'],

  storyBriefing: `Finally, you arrive at the Great Hall, where house-elves are trying to sort giant stacks of enchanted pancakes for the welcoming feast. They can't swap individual pancakes; their magic only allows them to stick a giant spatula in and flip the entire sub-stack above it. "It's chaos!" one squeaks. "We need to get the largest on the bottom, then the next largest, and so on, but all we can do is flip!" This unusual constraint requires a new way of thinking about sorting.`,

  description: `You are given an array of integers that you must sort using only a specific operation: a 'flip'. A flip consists of choosing an index 'k' and reversing the subarray from the beginning of the array up to 'k'. This problem is known as Pancake Sort.

The goal is to sort the array in ascending order by performing a series of these flips. A common strategy is to find the largest unsorted element, flip it to the front of the array, and then flip it to its correct sorted position at the end of the unsorted section. This process is repeated for the remaining unsorted elements.

Return the sorted array as a single line of space-separated integers. You must implement the Pancake Sort algorithm.`,

  examples: [
    {
      input: '4\n3 2 4 1',
      output: '1 2 3 4',
      explanation: '1. Max is 4 at index 2. Flip(2) -> [4, 2, 3, 1]. 2. Flip(3) -> [1, 3, 2, 4]. Now 4 is sorted. 3. Max is 3 at index 1. Flip(1) -> [3, 1, 2, 4]. 4. Flip(2) -> [2, 1, 3, 4]. Now 3 is sorted. ...and so on.'
    },
    {
      input: '5\n1 5 2 4 3',
      output: '1 2 3 4 5',
      explanation: 'The array is sorted by repeatedly finding the max in the unsorted portion and moving it to its correct final position using two flips.'
    },
    {
      input: '3\n1 2 3',
      output: '1 2 3',
      explanation: 'An already sorted array requires no flips.'
    }
  ],

  constraints: [
    'The number of elements is between 1 and 500.',
    'The value of each element is between 1 and 10^9 and are unique.'
  ],

  boilerplate: {
    cpp: `void solve(std::vector<int>& arr) {
    // Your code here
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; i++) std::cin >> arr[i];

    solve(arr);

    for (int i = 0; i < n; i++) {
        std::cout << arr[i] << (i == n - 1 ? "" : " ");
    }
    std::cout << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static void solve(int[] arr) {
        // Your code here
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

        Solution.solve(arr);

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(arr[i]).append(i == n - 1 ? "" : " ");
        }
        System.out.println(sb.toString());
        sc.close();
    }
}`
  },

  testCases: [
    { input: '4\n3 2 4 1', expected: '1 2 3 4' },
    { input: '5\n1 2 3 4 5', expected: '1 2 3 4 5' },
    { input: '6\n10 5 8 2 9 1', expected: '1 2 5 8 9 10' },
    { input: '1\n100', expected: '100' },
    { input: '2\n10 1', expected: '1 10' },
    { input: '8\n8 7 6 5 4 3 2 1', expected: '1 2 3 4 5 6 7 8' },
    { input: '5\n1 3 2 5 4', expected: '1 2 3 4 5' },
    { input: '3\n3 1 2', expected: '1 2 3' }
  ],
  
  solution: {
    approach: `Pancake sort works by iteratively placing the largest unsorted element into its correct final position. For each pass, starting from the end of the array, we find the index of the maximum element in the current unsorted portion. Then, we perform a 'flip' operation from the start of the array to this index, which brings the maximum element to the front. We then perform a second flip on the entire unsorted portion, which moves the maximum element to its correct sorted position at the end of that portion. We then shrink the unsorted portion by one and repeat the process until the entire array is sorted.`,
    cpp: `    auto flip = [](std::vector<int>& arr, int k) {
        std::reverse(arr.begin(), arr.begin() + k + 1);
    };

    int n = arr.size();
    for (int curr_size = n; curr_size > 1; --curr_size) {
        int max_idx = 0;
        for (int i = 1; i < curr_size; ++i) {
            if (arr[i] > arr[max_idx]) {
                max_idx = i;
            }
        }

        if (max_idx != curr_size - 1) {
            if (max_idx != 0) {
                flip(arr, max_idx);
            }
            flip(arr, curr_size - 1);
        }
    }`,
    java: `    int n = arr.length;
    for (int curr_size = n; curr_size > 1; --curr_size) {
        int max_idx = 0;
        for (int i = 1; i < curr_size; ++i) {
            if (arr[i] > arr[max_idx]) {
                max_idx = i;
            }
        }

        if (max_idx != curr_size - 1) {
            flip(arr, max_idx);
            flip(arr, curr_size - 1);
        }
    }
}

private static void flip(int[] arr, int k) {
    int start = 0;
    while (start < k) {
        int temp = arr[start];
        arr[start] = arr[k];
        arr[k] = temp;
        start++;
        k--;
    }`
  }
};