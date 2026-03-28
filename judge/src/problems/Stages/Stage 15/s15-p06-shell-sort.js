/**
 * Shell Sort - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * The sorted array as n space-separated integers.
 */

module.exports = {
  id: 'shell-sort',
  conquestId: 'stage15-6',
  title: 'Shell Sort',
  difficulty: 'Medium',
  category: 'Sorting',
  tags: ['Sorting', 'Insertion Sort', 'Optimization'],

  storyBriefing: `Next, you're sent to help sort the enchanted keys for the first task. They are all jumbled up. An official from the Department of Magical Games and Sports scoffs at your careful, one-by-one sorting method. "Too slow! We don't have all day. Start by sorting keys that are far apart-every 10th key, then every 5th, then every 2nd, and so on. By the time you get to sorting adjacent keys, your job will be nearly finished."`,

  description: `You are given an array of integers to sort using Shell Sort. Shell Sort is an optimization of Insertion Sort that allows the exchange of items that are far apart. It works by sorting elements at a specific 'gap' from each other, then progressively reducing that gap until it becomes 1.

The algorithm begins with a large gap and performs a 'gapped' insertion sort. It then shrinks the gap (e.g., divides by 2) and repeats the process. The final pass, with a gap of 1, is equivalent to a regular Insertion Sort. However, because the previous gapped passes have moved elements closer to their final positions, this final pass is very efficient.

Return the sorted array as a single line of space-separated integers. You should implement the Shell Sort algorithm from scratch.`,

  examples: [
    {
      input: '5\n12 34 54 2 3',
      output: '2 3 12 34 54',
      explanation: 'First, a gapped sort is performed (e.g., with gap 2), comparing (12, 54, 3) and (34, 2). Then, a final insertion sort (gap 1) finishes the job on the nearly-sorted array.'
    },
    {
      input: '6\n5 1 4 2 8 3',
      output: '1 2 3 4 5 8',
      explanation: 'The array is sorted by progressively reducing the gap size and performing gapped insertion sorts.'
    },
    {
      input: '4\n4 3 2 1',
      output: '1 2 3 4',
      explanation: 'A reverse-sorted array is handled more efficiently by Shell Sort than by a standard Insertion Sort because large-scale swaps happen in the initial passes.'
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
    { input: '5\n12 34 54 2 3', expected: '2 3 12 34 54' },
    { input: '4\n10 9 8 7', expected: '7 8 9 10' },
    { input: '6\n3 1 4 1 5 9', expected: '1 1 3 4 5 9' },
    { input: '1\n100', expected: '100' },
    { input: '2\n50 -50', expected: '-50 50' },
    { input: '7\n4 2 7 1 9 5 3', expected: '1 2 3 4 5 7 9' },
    { input: '8\n8 7 6 5 4 3 2 1', expected: '1 2 3 4 5 6 7 8' },
    { input: '5\n1 1 1 1 1', expected: '1 1 1 1 1' }
  ],

  solution: {
    approach: `Shell Sort improves on Insertion Sort by starting with a large 'gap' and sorting sub-arrays of elements that are 'gap' positions apart. This allows elements to make large jumps towards their correct sorted positions early on. The algorithm proceeds by reducing the gap in each pass (a common sequence is to divide the gap by 2). The process continues until the gap is 1, at which point the algorithm performs a final, standard Insertion Sort on an array that is already nearly sorted, making it very fast.`,
    cpp: `    int n = arr.size();
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j;
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                arr[j] = arr[j - gap];
            }
            arr[j] = temp;
        }
    }`,
    java: `    int n = arr.length;
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j;
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                arr[j] = arr[j - gap];
            }
            arr[j] = temp;
        }
    }`
  }
};