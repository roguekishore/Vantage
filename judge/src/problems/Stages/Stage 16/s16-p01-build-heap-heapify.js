/**
 * Build Heap (Heapify) - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers representing an unsorted array.
 *
 * Output format (stdout):
 * n space-separated integers representing the array in Max-Heap order.
 */

module.exports = {
  id: 'build-heap-heapify',
  conquestId: 'stage16-1',
  title: 'Build Heap (Heapify)',
  difficulty: 'Medium',
  category: 'Heaps & Priority Queues',
  tags: ['Heap', 'Data Structure', 'Array', 'Sorting'],

  stageIntro: `The first task of the Triwizard Tournament is announced: each champion must face a dragon and retrieve a golden egg. To prepare, you are taken to a magical menagerie filled with creatures of varying power levels. The tournament officials need to organize these creatures based on their threat level to ensure a fair challenge. This calls for a data structure that can efficiently manage priorities-a heap.`,

  storyBriefing: `Before you can use a heap, you must first structure the data correctly. Ludo Bagman, a tournament official, hands you a chaotic list of the creatures' power levels. "We need to turn this mess into a proper Max-Heap!" he says enthusiastically. "That way, the most powerful creature is always right at the top, at index 0. Reorganize this list so that every 'parent' creature is more powerful than its two 'children'. This process is called 'heapifying'."`,

  description: `You are given an array of integers. Your task is to convert this array into a Max-Heap in-place. A Max-Heap is a binary tree structure where the value of each parent node is greater than or equal to the values of its children.

An efficient way to build a heap is to use a bottom-up approach. Starting from the last non-leaf node and moving up to the root, you apply a 'heapify' (or 'sift-down') operation on each node. This operation ensures that the subtree rooted at the current node satisfies the Max-Heap property. This O(n) method is faster than inserting elements one by one.

Return the heap-ordered array as a single line of space-separated integers.`,

  examples: [
    {
      input: '5\n4 10 3 5 1',
      output: '10 5 3 4 1',
      explanation: 'The initial array is [4, 10, 3, 5, 1]. Starting heapify from the last non-leaf node (at index 1, value 10), we see its children are 5 and 1, so it is valid. At index 0 (value 4), its children are 10 and 3. Since 10 is greater than 4, they are swapped. The array becomes [10, 4, 3, 5, 1]. Now we check the new position of 4. Its children is 5, which is greater, so they swap. The final heap is [10, 5, 3, 4, 1].'
    },
    {
      input: '4\n1 2 3 4',
      output: '4 2 3 1',
      explanation: 'The array is rearranged to satisfy the Max-Heap property, where every parent is greater than or equal to its children.'
    },
    {
      input: '1\n100',
      output: '100',
      explanation: 'A single-element array is already a valid heap.'
    }
  ],

  constraints: [
    'The number of elements is between 1 and 100000.',
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
    { input: '5\n4 10 3 5 1', expected: '10 5 3 4 1' },
    { input: '6\n1 3 5 4 6 13', expected: '13 6 5 4 3 1' },
    { input: '1\n7', expected: '7' },
    { input: '4\n1 2 3 4', expected: '4 2 3 1' },
    { input: '7\n10 5 3 2 4 12 18', expected: '18 5 12 2 4 3 10' },
    { input: '8\n1 2 3 4 5 6 7 8', expected: '8 5 7 4 1 6 3 2' },
    { input: '2\n10 1', expected: '10 1' },
    { input: '2\n1 10', expected: '10 1' }
  ],
  
  solution: {
    approach: `The O(n) 'buildHeap' algorithm works by starting at the last non-leaf node (index n/2 - 1) and iterating backwards to the root (index 0). For each node, it calls a 'heapify' (or 'siftDown') function. The 'heapify' function takes a node index and ensures the subtree rooted at that index obeys the Max-Heap property. It compares the node with its left and right children, finds the largest of the three, and if the current node is not the largest, it swaps with the largest child and recursively calls 'heapify' on the affected child's subtree.`,
    cpp: `    auto heapify = [&](std::vector<int>& arr, int n, int i) {
        int largest = i;
        int l = 2 * i + 1;
        int r = 2 * i + 2;

        if (l < n && arr[l] > arr[largest])
            largest = l;

        if (r < n && arr[r] > arr[largest])
            largest = r;

        if (largest != i) {
            std::swap(arr[i], arr[largest]);
            heapify(arr, n, largest);
        }
    };
    
    int n = arr.size();
    for (int i = n / 2 - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }`,
    java: `    int n = arr.length;
    for (int i = n / 2 - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }
}

private static void heapify(int[] arr, int n, int i) {
    int largest = i;
    int l = 2 * i + 1;
    int r = 2 * i + 2;

    if (l < n && arr[l] > arr[largest]) {
        largest = l;
    }

    if (r < n && arr[r] > arr[largest]) {
        largest = r;
    }

    if (largest != i) {
        int swap = arr[i];
        arr[i] = arr[largest];
        arr[largest] = swap;
        heapify(arr, n, largest);
    }`
  }
};