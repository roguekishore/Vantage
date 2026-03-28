/**
 * Comb Sort - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * The sorted array as n space-separated integers.
 */

module.exports = {
  id: 'comb-sort',
  conquestId: 'stage15-7',
  title: 'Comb Sort',
  difficulty: 'Medium',
  category: 'Sorting',
  tags: ['Sorting', 'Bubble Sort', 'Optimization'],

  storyBriefing: `In another area, cauldrons are being sorted. The current method is a slow bubble sort, and the person in charge is complaining about "turtles"-small-numbered cauldrons at the end of the line that take ages to bubble to the front. You recall the gapped sorting idea. "Why only compare adjacent cauldrons?" you suggest. "Compare cauldrons that are far apart first, then gradually shrink the gap. You'll move the 'turtles' much faster."`,

  description: `You are asked to sort an array of integers using Comb Sort. Comb Sort is an improvement over Bubble Sort that eliminates "turtles" - small values near the end of the list that slow down Bubble Sort. It achieves this by using a gap between compared elements that is larger than 1.

The algorithm starts with a large gap and compares elements that are 'gap' positions apart. The gap is then progressively shrunk with each pass (typically by a "shrink factor" of 1.3) until it reaches 1. At this point, Comb Sort effectively becomes a standard Bubble Sort, but by then the array is mostly sorted, making the final pass very quick.

Return the sorted array as a single line of space-separated integers. You must implement the Comb Sort algorithm from scratch.`,

  examples: [
    {
      input: '5\n5 1 4 2 8',
      output: '1 2 4 5 8',
      explanation: 'The sorting process starts with a large gap (e.g., floor(5/1.3)=3), comparing elements 3 positions apart. The gap shrinks until it is 1, at which point a final bubble-sort-like pass finishes the sorting.'
    },
    {
      input: '6\n10 1 9 2 8 3',
      output: '1 2 3 8 9 10',
      explanation: 'Elements far from their final positions, like 1, 2, and 3, are moved much more quickly toward the beginning in the initial large-gap passes.'
    },
    {
      input: '4\n4 3 2 1',
      output: '1 2 3 4',
      explanation: 'Comb Sort is particularly effective on reverse-sorted lists compared to standard Bubble Sort.'
    }
  ],

  constraints: [
    'The number of elements is between 1 and 5000.',
    'The value of each element is between -10^9 and 10^9.'
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
    { input: '10\n8 4 1 56 3 -44 23 -6 28 0', expected: '-44 -6 0 1 3 4 8 23 28 56' },
    { input: '4\n4 3 2 1', expected: '1 2 3 4' },
    { input: '2\n100 -100', expected: '-100 100' },
    { input: '1\n42', expected: '42' },
    { input: '5\n1 2 3 4 5', expected: '1 2 3 4 5' },
    { input: '7\n-10 20 -30 40 0 -50 60', expected: '-50 -30 -10 0 20 40 60' },
    { input: '5\n3 3 1 1 2', expected: '1 1 2 3 3' },
    { input: '6\n0 0 0 -1 -1 -1', expected: '-1 -1 -1 0 0 0' }
  ],
  
  solution: {
    approach: `Comb Sort starts with a 'gap' equal to the array size and a boolean 'swapped' flag. In a loop that continues as long as the gap is greater than 1 or a swap occurred in the last pass, it first shrinks the gap by a factor of 1.3. Then, it iterates through the array, comparing and swapping elements that are 'gap' positions apart. If any swap occurs, the 'swapped' flag is set to true. This process quickly moves small elements ("turtles") from the end of the array towards the beginning, dramatically improving on Bubble Sort's performance. The final pass with a gap of 1 ensures the array is fully sorted.`,
    cpp: `    int n = arr.size();
    int gap = n;
    float shrink = 1.3f;
    bool swapped = true;

    while (gap != 1 || swapped == true) {
        gap = (int)(gap / shrink);
        if (gap < 1) {
            gap = 1;
        }

        swapped = false;
        for (int i = 0; i < n - gap; i++) {
            if (arr[i] > arr[i + gap]) {
                std::swap(arr[i], arr[i + gap]);
                swapped = true;
            }
        }
    }`,
    java: `    int n = arr.length;
    int gap = n;
    double shrink = 1.3;
    boolean swapped = true;

    while (gap != 1 || swapped) {
        gap = (int)(gap / shrink);
        if (gap < 1) {
            gap = 1;
        }
        
        swapped = false;
        for (int i = 0; i < n - gap; i++) {
            if (arr[i] > arr[i + gap]) {
                int temp = arr[i];
                arr[i] = arr[i + gap];
                arr[i + gap] = temp;
                swapped = true;
            }
        }
    }`
  }
};