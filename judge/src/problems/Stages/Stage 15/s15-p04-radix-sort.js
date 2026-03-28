/**
 * Radix Sort - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Line 2: n space-separated non-negative integers.
 *
 * Output format (stdout):
 * The sorted array as n space-separated integers.
 */

module.exports = {
  id: 'radix-sort',
  conquestId: 'stage15-4',
  title: 'Radix Sort',
  difficulty: 'Hard',
  category: 'Sorting',
  tags: ['Sorting', 'Non-Comparison Sort', 'Radix Sort', 'Counting Sort'],

  storyBriefing: `Professor Flitwick is helping organize the visitor registry for the tournament, which includes some very large numbers. "Counting sort is wonderful, my dear student, but look at these numbers! We can't possibly make a counting array large enough. But notice... they're just numbers. We can sort them digit by digit! If we sort by the ones place first, then the tens, and so on, using a stable sort each time, the whole list will be sorted. A most charming piece of magic!"`,

  description: `You are given an array of non-negative integers. Your task is to sort this array using Radix Sort. This algorithm is effective for sorting integers, especially when the numbers are large, because it avoids comparisons and sorts digit by digit.

Radix Sort processes numbers from the least significant digit to the most significant digit. In each pass, it uses a stable sorting algorithm (like Counting Sort) to sort the elements based on the current digit's value. The stability is crucial because it preserves the relative order of elements that have the same digit in the current place value, respecting the sorting done in previous passes.

Return the sorted array as a single line of space-separated integers. You will need to implement Radix Sort, likely using Counting Sort as a subroutine for each digit place.`,

  examples: [
    {
      input: '8\n170 45 75 90 802 24 2 66',
      output: '2 24 45 66 75 90 170 802',
      explanation: 'First, the array is sorted by the 1s place (170, 90, 802, 2, ...). Then, it is stably sorted by the 10s place, and finally by the 100s place, resulting in a fully sorted array.'
    },
    {
      input: '3\n1000 100 10',
      output: '10 100 1000',
      explanation: 'The algorithm correctly handles numbers with different numbers of digits.'
    },
    {
      input: '4\n9 8 7 6',
      output: '6 7 8 9',
      explanation: 'For single-digit numbers, Radix Sort performs one pass of Counting Sort.'
    }
  ],

  constraints: [
    'The number of elements is between 1 and 100000.',
    'The value of each element is between 0 and 10^9.'
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
    std::cin >> n;
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
    { input: '8\n170 45 75 90 802 24 2 66', expected: '2 24 45 66 75 90 170 802' },
    { input: '3\n1000 100 10', expected: '10 100 1000' },
    { input: '5\n55 44 33 22 11', expected: '11 22 33 44 55' },
    { input: '4\n0 0 1 0', expected: '0 0 0 1' },
    { input: '1\n987654321', expected: '987654321'},
    { input: '2\n1 0', expected: '0 1'},
    { input: '10\n10 9 8 7 6 5 4 3 2 1', expected: '1 2 3 4 5 6 7 8 9 10'},
    { input: '5\n123 1 23 2 3', expected: '1 2 3 23 123' }
  ],
  
  solution: {
    approach: `Radix Sort works by sorting the input array digit by digit, from least significant to most significant. It begins by finding the maximum element to determine the number of digits in the largest number, which dictates how many passes are needed. In each pass, it uses a stable sorting algorithm, Counting Sort, to sort the numbers based on the current digit (1s place, 10s place, 100s place, etc.). The stability of Counting Sort is vital, as it ensures that the ordering from previous, less significant digit passes is preserved. After the final pass on the most significant digit, the entire array is sorted.`,
    cpp: `    if (arr.empty()) return;

    auto countingSortForRadix = [](std::vector<int>& arr, int exp) {
        int n = arr.size();
        std::vector<int> output(n);
        std::vector<int> count(10, 0);

        for (int i = 0; i < n; i++) {
            count[(arr[i] / exp) % 10]++;
        }

        for (int i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        for (int i = n - 1; i >= 0; i--) {
            output[count[(arr[i] / exp) % 10] - 1] = arr[i];
            count[(arr[i] / exp) % 10]--;
        }

        for (int i = 0; i < n; i++) {
            arr[i] = output[i];
        }
    };

    int maxVal = arr[0];
    for(int x : arr) {
        if (x > maxVal) maxVal = x;
    }

    for (int exp = 1; maxVal / exp > 0; exp *= 10) {
        countingSortForRadix(arr, exp);
    }`,
    java: `    if (arr.length == 0) return;

    int maxVal = arr[0];
    for (int val : arr) {
        if (val > maxVal) {
            maxVal = val;
        }
    }

    for (int exp = 1; maxVal / exp > 0; exp *= 10) {
        countSort(arr, exp);
    }
}

private static void countSort(int[] arr, int exp) {
    int n = arr.length;
    int[] output = new int[n];
    int[] count = new int[10];

    for (int i = 0; i < n; i++) {
        count[(arr[i] / exp) % 10]++;
    }

    for (int i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }

    for (int i = n - 1; i >= 0; i--) {
        output[count[(arr[i] / exp) % 10] - 1] = arr[i];
        count[(arr[i] / exp) % 10]--;
    }

    System.arraycopy(output, 0, arr, 0, n);`
  }
};