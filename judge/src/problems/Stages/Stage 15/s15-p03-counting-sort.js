/**
 * Counting Sort - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Next n lines: n space-separated integers.
 *
 * Output format (stdout):
 * The sorted array as n space-separated integers.
 */

module.exports = {
  id: 'counting-sort',
  conquestId: 'stage15-3',
  title: 'Counting Sort',
  difficulty: 'Medium',
  category: 'Sorting',
  tags: ['Sorting', 'Non-Comparison Sort', 'Array'],

  storyBriefing: `Cedric Diggory, the other Hogwarts champion, is tasked with sorting a huge delivery of potion ingredients. Each ingredient is labeled with a number from 1 to 1000. "Comparison sorting is too slow," he says, wiping his brow. "Since we know the exact range of these labels, we can just count how many of each we have and then build the sorted list from the counts. It should be much faster. Can you help me set up the counting array?"`,

  description: `You are given an array of integers where the range of values is known to be relatively small. Your task is to sort this array using Counting Sort, a non-comparison-based algorithm that can achieve linear time complexity.

Counting Sort operates by creating a 'count' array to store the frequency of each unique element in the input array. It then iterates through the count array to reconstruct the original array in sorted order. This method is highly efficient when the range of input values is not significantly larger than the number of elements.

Return the sorted array as a single line of space-separated integers. You must implement the Counting Sort algorithm.`,

  examples: [
    {
      input: '7\n4 2 2 8 3 3 1',
      output: '1 2 2 3 3 4 8',
      explanation: 'Count array: index 1 has count 1, index 2 has 2, index 3 has 2, etc. The sorted array is built by placing 1 one time, 2 two times, 3 two times, and so on.'
    },
    {
      input: '5\n0 5 0 2 1',
      output: '0 0 1 2 5',
      explanation: 'The algorithm correctly handles zero and duplicate values.'
    },
    {
      input: '4\n5 5 5 5',
      output: '5 5 5 5',
      explanation: 'An array with all identical elements is already sorted, and the algorithm handles this correctly.'
    }
  ],

  constraints: [
    'The number of elements is between 1 and 10^6.',
    'The value of each element is between 0 and 100000.'
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
    { input: '7\n4 2 2 8 3 3 1', expected: '1 2 2 3 3 4 8' },
    { input: '5\n10 10 10 10 10', expected: '10 10 10 10 10' },
    { input: '6\n5 4 3 2 1 0', expected: '0 1 2 3 4 5' },
    { input: '4\n1 4 1 2', expected: '1 1 2 4' },
    { input: '1\n100000', expected: '100000' },
    { input: '2\n10 0', expected: '0 10'},
    { input: '10\n9 8 7 6 5 4 3 2 1 0', expected: '0 1 2 3 4 5 6 7 8 9'},
    { input: '5\n1 1 0 0 1', expected: '0 0 1 1 1'}
  ],
  
  solution: {
    approach: `Counting Sort first finds the maximum and minimum values in the array to determine the range of the data. It then creates a 'count' array of the size of this range to store the frequency of each element. After counting, it iterates from the minimum to the maximum value, placing each element into the original array according to its frequency in the count array. This reconstructs the array in sorted order. This implementation is a simple, non-stable version of Counting Sort.`,
    cpp: `    if (arr.empty()) return;

    int maxVal = arr[0];
    int minVal = arr[0];
    for (int x : arr) {
        if (x > maxVal) maxVal = x;
        if (x < minVal) minVal = x;
    }
    int range = maxVal - minVal + 1;

    std::vector<int> count(range, 0);
    for (int x : arr) {
        count[x - minVal]++;
    }

    int index = 0;
    for (int i = 0; i < range; i++) {
        while (count[i] > 0) {
            arr[index++] = i + minVal;
            count[i]--;
        }
    }`,
    java: `    if (arr.length == 0) {
        return;
    }

    int max = arr[0], min = arr[0];
    for (int num : arr) {
        if (num > max) max = num;
        if (num < min) min = num;
    }

    int range = max - min + 1;
    int[] count = new int[range];

    for (int num : arr) {
        count[num - min]++;
    }

    int index = 0;
    for (int i = 0; i < range; i++) {
        while (count[i] > 0) {
            arr[index++] = i + min;
            count[i]--;
        }
    }`
  }
};