/**
 * Quadratic Sorting - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * The sorted array as n space-separated integers.
 */

module.exports = {
  id: 'quadratic-sorting',
  conquestId: 'stage15-1',
  title: 'Quadratic Sorting Algorithms',
  difficulty: 'Easy',
  category: 'Sorting',
  tags: ['Sorting', 'Bubble Sort', 'Selection Sort', 'Insertion Sort'],

  stageIntro: `The new school year begins with a monumental announcement from Dumbledore in the Great Hall: Hogwarts will host the Triwizard Tournament! The air buzzes with excitement and apprehension. Champions from three schools will compete, and the first task involves organizing a vast, chaotic collection of magical artifacts, creatures, and supplies. This is a logistical nightmare, and the ministry officials are looking for students who can bring order to chaos-a perfect application for sorting algorithms.`,

  storyBriefing: `Mad-Eye Moody, the new Defence Against the Dark Arts teacher, gruffly presents you with a small, jumbled pile of enchanted stones, each with a different weight. "Before you can handle a dragon, you need to handle these," he growls. "Sort them by weight. Use a simple method. Compare them pair by pair, or find the lightest and put it first. It'll be slow, but it's reliable. Don't move on until this is done." This is your first test: sorting a small batch, where simple, methodical approaches are sufficient.`,

  description: `You are given an array of integers. Your task is to sort the array in non-decreasing order using a quadratic time complexity algorithm, such as Bubble Sort, Selection Sort, or Insertion Sort. These algorithms are fundamental but are generally too slow for large datasets.

These sorting methods are characterized by their O(n^2) time complexity. Bubble Sort repeatedly swaps adjacent elements. Selection Sort repeatedly finds the minimum element and places it at the beginning. Insertion Sort builds the final sorted array one item at a time, inserting each element into its proper place.

Return the sorted array as a single line of space-separated integers. You are encouraged to implement one of these three methods from scratch.`,

  examples: [
    {
      input: '5\n5 1 4 2 8',
      output: '1 2 4 5 8',
      explanation: 'The unsorted array is processed by a quadratic sorting algorithm and returned in ascending order.'
    },
    {
      input: '6\n10 9 8 7 6 5',
      output: '5 6 7 8 9 10',
      explanation: 'A reverse-sorted array represents a worst-case scenario for some quadratic sorts, but the output must still be correct.'
    },
    {
      input: '3\n-5 10 0',
      output: '-5 0 10',
      explanation: 'The algorithm must correctly handle negative numbers and zero.'
    }
  ],

  constraints: [
    'The number of elements in the array is between 1 and 1000.',
    'The value of each element is between -100000 and 100000.'
  ],

  boilerplate: {
    cpp: `void solve(std::vector<int>& arr) {
    // Your code here. You can implement Bubble, Selection, or Insertion Sort.
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
int main() {
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
        // Your code here. You can implement Bubble, Selection, or Insertion Sort.
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

        for (int i = 0; i < n; i++) {
            System.out.print(arr[i] + (i == n - 1 ? "" : " "));
        }
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '5\n5 1 4 2 8', expected: '1 2 4 5 8' },
    { input: '1\n42', expected: '42' },
    { input: '6\n10 9 8 7 6 5', expected: '5 6 7 8 9 10' },
    { input: '4\n1 2 3 4', expected: '1 2 3 4' },
    { input: '5\n2 2 1 1 0', expected: '0 1 1 2 2' },
    { input: '2\n100 -100', expected: '-100 100' },
    { input: '7\n-1 -5 3 0 2 -10 8', expected: '-10 -5 -1 0 2 3 8'},
    { input: '10\n0 0 0 0 0 0 0 0 0 0', expected: '0 0 0 0 0 0 0 0 0 0'}
  ],

  solution: {
    approach: `Insertion sort is one of the classic quadratic sorting algorithms. It iterates from arr[1] to arr[n-1]. At each position 'i', it takes the value and 'inserts' it into the sorted portion of the array (from index 0 to i-1). This is done by shifting all larger elements to the right until the correct spot for the current value is found. While less efficient on average than O(n log n) algorithms, it is simple to implement and performs well on small or nearly-sorted datasets.`,
    cpp: `    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }`,
    java: `    int n = arr.length;
    for (int i = 1; i < n; ++i) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }`
  }
};