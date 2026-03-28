/**
 * Efficient Sorting - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * The sorted array as n space-separated integers.
 */

module.exports = {
  id: 'efficient-sorting',
  conquestId: 'stage15-2',
  title: 'Efficient Sorting Algorithms',
  difficulty: 'Medium',
  category: 'Sorting',
  tags: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Divide and Conquer'],

  storyBriefing: `Moody seems satisfied. "Not bad. But the first task involves sorting thousands of items, not just a handful. Your slow methods won't cut it." He points to a massive warehouse teeming with supplies. "We need to sort the registration numbers for every item here. You'll need a more efficient, 'divide and conquer' approach for this. Split the problem into smaller pieces, solve them, and combine the results. Show me you can handle a real challenge."`,

  description: `You are given an array of integers that is too large for a quadratic sorting algorithm. Your task is to sort the array in non-decreasing order using an efficient, O(n log n) time complexity algorithm, such as Merge Sort, Quick Sort, or Heap Sort.

These advanced algorithms are essential for handling large datasets. Merge Sort guarantees O(n log n) time but requires extra space. Quick Sort is often faster in practice and sorts in-place, but has a rare worst-case of O(n^2). Heap Sort provides the best of both worlds with guaranteed O(n log n) time and in-place sorting.

Return the sorted array as a single line of space-separated integers. You are encouraged to implement one of these three canonical sorting algorithms from scratch.`,

  examples: [
    {
      input: '6\n12 11 13 5 6 7',
      output: '5 6 7 11 12 13',
      explanation: 'The large, unsorted array is efficiently sorted into ascending order.'
    },
    {
      input: '5\n5 4 3 2 1',
      output: '1 2 3 4 5',
      explanation: 'A reverse-sorted array is handled efficiently, avoiding the O(n^2) pitfall that can affect a naive Quick Sort.'
    },
    {
      input: '8\n3 1 4 1 5 9 2 6',
      output: '1 1 2 3 4 5 6 9',
      explanation: 'The algorithm correctly handles duplicate elements, maintaining their count in the sorted output.'
    }
  ],

  constraints: [
    'The number of elements in the array is between 1 and 100000.',
    'The value of each element is between -10^9 and 10^9.'
  ],

  boilerplate: {
    cpp: `void solve(std::vector<int>& arr) {
    // Your code here. You can implement Merge, Quick, or Heap Sort.
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
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
        // Your code here. You can implement Merge, Quick, or Heap Sort.
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
    { input: '6\n12 11 13 5 6 7', expected: '5 6 7 11 12 13' },
    { input: '5\n5 4 3 2 1', expected: '1 2 3 4 5' },
    { input: '1\n100', expected: '100' },
    { input: '8\n3 1 4 1 5 9 2 6', expected: '1 1 2 3 4 5 6 9' },
    { input: '2\n-10 10', expected: '-10 10' },
    { input: '10\n0 9 8 1 7 2 6 3 5 4', expected: '0 1 2 3 4 5 6 7 8 9' },
    { input: '7\n1 1 1 1 1 1 1', expected: '1 1 1 1 1 1 1'},
    { input: '9\n100 20 80 30 70 40 60 50 90', expected: '20 30 40 50 60 70 80 90 100'}
  ],
  
  solution: {
    approach: `Merge Sort is a classic divide-and-conquer algorithm. It works by recursively splitting the input array into two halves until each subarray contains a single element (which is trivially sorted). Then, it repeatedly merges the sorted subarrays back together to produce new sorted subarrays until the entire array is a single, sorted unit. The key operation is the 'merge' step, where two sorted arrays are combined into one larger sorted array in linear time.`,
    cpp: `    if (arr.size() <= 1) return;
    int mid = arr.size() / 2;
    std::vector<int> left(arr.begin(), arr.begin() + mid);
    std::vector<int> right(arr.begin() + mid, arr.end());

    solve(left);
    solve(right);

    int i = 0, j = 0, k = 0;
    while (i < left.size() && j < right.size()) {
        if (left[i] <= right[j]) {
            arr[k++] = left[i++];
        } else {
            arr[k++] = right[j++];
        }
    }
    while (i < left.size()) {
        arr[k++] = left[i++];
    }
    while (j < right.size()) {
        arr[k++] = right[j++];
    }`,
    java: `    if (arr.length <= 1) {
        return;
    }
    int mid = arr.length / 2;
    int[] left = java.util.Arrays.copyOfRange(arr, 0, mid);
    int[] right = java.util.Arrays.copyOfRange(arr, mid, arr.length);

    solve(left);
    solve(right);

    int i = 0, j = 0, k = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            arr[k++] = left[i++];
        } else {
            arr[k++] = right[j++];
        }
    }
    while (i < left.length) {
        arr[k++] = left[i++];
    }
    while (j < right.length) {
        arr[k++] = right[j++];
    }`
  }
};