/**
 * Rotate Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 * Line 3: An integer k, the number of steps to rotate the array to the right.
 *
 * Output format (stdout):
 * n space-separated integers representing the array after rotation.
 */

module.exports = {
  // ---- Identity ----
  id: 'rotate-array',
  conquestId: 'stage2-4',
  title: 'Rotate Array',
  difficulty: 'Medium',
  category: 'Array Index Manipulation',
  tags: ['Array', 'Math', 'Two Pointers'],

  // ---- Story Layer ----
  storyBriefing: `Impressed by your organizing skills, Argus Filch, the caretaker, grudgingly assigns you to a new task. The portraits in the Grand Staircase have their patrol schedules all mixed up. He hands you a list of their current positions and a number 'k'. You must rotate the entire schedule to the right by 'k' positions to fix the sequence for the evening.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers and a non-negative integer k. Your task is to rotate the array to the right by k steps. This means the last k elements will become the first k elements, and the preceding elements will be shifted accordingly.

A key insight is that rotating k times is the same as rotating k % n times, which simplifies cases where k is larger than n. An efficient in-place solution involves three reverse operations: first, reverse the entire array. Then, reverse the first k elements. Finally, reverse the remaining n-k elements.

This is a void function, so you do not return anything. Modify the input array directly. The final rotated array will be printed to the console with its elements space-separated on a single line.`,
  examples: [
    {
      input: '7\n1 2 3 4 5 6 7\n3',
      output: '5 6 7 1 2 3 4',
      explanation: 'Rotating right by 3 moves 5, 6, 7 to the front. The original elements 1, 2, 3, 4 are shifted after them.'
    },
    {
      input: '4\n-1 -100 3 99\n2',
      output: '3 99 -1 -100',
      explanation: 'Rotating right by 2 moves 3, 99 to the front.'
    },
    {
      input: '5\n1 2 3 4 5\n5',
      output: '1 2 3 4 5',
      explanation: 'Rotating by 5 (the size of the array) results in the original array. k becomes 5 % 5 = 0.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '-2^31 <= array[i] <= 2^31 - 1',
    '0 <= k <= 10^5'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void solve(int n, vector<int>& arr, int k) {
    // Your code here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int k;
    cin >> k;
    
    solve(n, arr, k);
    
    for (int i = 0; i < n; i++) {
        cout << arr[i] << (i == n - 1 ? "" : " ");
    }
    cout << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static void solve(int n, int[] arr, int k) {
        // Your code here
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int k = sc.nextInt();
        
        solve(n, arr, k);
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(arr[i]);
            if (i < n - 1) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '7\n1 2 3 4 5 6 7\n3', expected: '5 6 7 1 2 3 4' },
    { input: '4\n-1 -100 3 99\n2', expected: '3 99 -1 -100' },
    { input: '5\n1 2 3 4 5\n0', expected: '1 2 3 4 5' },
    { input: '5\n1 2 3 4 5\n5', expected: '1 2 3 4 5' },
    { input: '3\n10 20 30\n4', expected: '30 10 20' },
    { input: '1\n42\n100', expected: '42' },
    { input: '2\n1 2\n3', expected: '2 1' },
    { input: '5\n8 8 8 8 8\n2', expected: '8 8 8 8 8' },
    { input: '4\n1 2 3 4\n3', expected: '2 3 4 1' },
    { input: '4\n1 2 3 4\n1', expected: '4 1 2 3' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem can be solved in O(n) time and O(1) space using an algorithm based on reversing subarrays. First, handle k being larger than n by taking k = k % n. The core logic is: 1. Reverse the entire array. 2. Reverse the first k elements (from index 0 to k-1). 3. Reverse the rest of the elements (from index k to n-1). This sequence of reversals correctly places all elements in their rotated positions.`,
    cpp: `if (n == 0) return;
k = k % n;
if (k == 0) return;
reverse(arr.begin(), arr.end());
reverse(arr.begin(), arr.begin() + k);
reverse(arr.begin() + k, arr.end());`,
    java: `if (n == 0) return;
k = k % n;
if (k == 0) return;

// Reverse entire array
int start = 0, end = n - 1;
while (start < end) {
    int temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;
    start++;
    end--;
}

// Reverse first k elements
start = 0;
end = k - 1;
while (start < end) {
    int temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;
    start++;
    end--;
}

// Reverse remaining n-k elements
start = k;
end = n - 1;
while (start < end) {
    int temp = arr[start];
    arr[start] = arr[end];
    arr[end] = temp;
    start++;
    end--;
}`
  }
};