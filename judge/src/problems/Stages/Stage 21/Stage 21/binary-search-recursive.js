/**
 * Binary Search (Recursive) - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer n - size of the array
 *   Line 2: n space-separated integers in non-decreasing order
 *   Line 3: Integer target - the value to search
 *
 * Output format (stdout):
 *   Print the index (0-based) of the target if found.
 *   If the target does not exist in the array, print -1.
 */

module.exports = {
  id: 'binary-search-recursive',
  conquestId: 'stage21-4',
  title: 'Binary Search (Recursive)',
  difficulty: 'Easy',
  category: 'Recursion',
  tags: ['Binary Search', 'Recursion', 'Array'],

  description: `
**Binary Search** is an efficient algorithm used to find an element in a **sorted array**.

Instead of checking every element, Binary Search repeatedly **divides the search range in half**.

Steps:
1. Find the **middle element**.
2. If the middle element equals the target → return the index.
3. If the target is smaller → search the **left half**.
4. If the target is larger → search the **right half**.

In this problem, you must implement **Binary Search using recursion**.

Return the **0-based index** of the target element if it exists.  
If the element is not found, return **-1**.

Time Complexity: **O(log n)**  
Space Complexity (recursive stack): **O(log n)**
`,

  examples: [
    {
      input: '5\n1 3 5 7 9\n5',
      output: '2',
      explanation: 'Target 5 is found at index 2.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    '-10^9 ≤ array[i] ≤ 10^9',
    'Array is sorted in non-decreasing order'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& arr, int left, int right, int target) {
    // TODO: Implement recursive binary search
    return -1;
}

int main() {
    int n;
    cin >> n;

    vector<int> arr(n);
    for(int i = 0; i < n; i++)
        cin >> arr[i];

    int target;
    cin >> target;

    cout << binarySearch(arr, 0, n - 1, target);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static int binarySearch(int[] arr, int left, int right, int target) {
        // TODO: Implement recursive binary search
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[] arr = new int[n];
        for(int i = 0; i < n; i++)
            arr[i] = sc.nextInt();

        int target = sc.nextInt();

        System.out.print(binarySearch(arr, 0, n - 1, target));
    }
}`,
  },

  testCases: [
    { input: '1\n5\n5', expected: '0' },
    { input: '5\n1 3 5 7 9\n5', expected: '2' },
    { input: '5\n1 3 5 7 9\n1', expected: '0' },
    { input: '5\n1 3 5 7 9\n9', expected: '4' },
    { input: '5\n1 3 5 7 9\n6', expected: '-1' },
    { input: '6\n-10 -5 0 3 8 12\n-5', expected: '1' },
    { input: '6\n-10 -5 0 3 8 12\n12', expected: '5' },
    { input: '6\n-10 -5 0 3 8 12\n7', expected: '-1' },
    { input: '7\n2 4 6 8 10 12 14\n8', expected: '3' }
  ],
};