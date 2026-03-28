/**
 * Move Zeros - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * n space-separated integers where all zeros are moved to the end while maintaining 
 * the relative order of the non-zero elements.
 */

module.exports = {
  // ---- Identity ----
  id: 'move-zeros',
  conquestId: 'stage2-3',
  title: 'Move Zeros',
  difficulty: 'Easy',
  category: 'Array Index Manipulation',
  tags: ['Array', 'Two Pointers', 'In-place'],

  // ---- Story Layer ----
  storyBriefing: `Fred and George Weasley find your predicament hilarious. They offer to 'help' by enchanting a pile of enchanted, self-shuffling parchments. Your task is to organize them: all the important, non-blank parchments must be moved to one side of the enchanted drawer, while the blank ones (represented by zeros) must be sent to the other, all while keeping the important parchments in their original relative order.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers. Your task is to modify the array in-place by moving all the zeros to the end of it. The relative order of the non-zero elements must be maintained.

A common approach is to use two pointers. One pointer iterates through the array to find non-zero elements, and another pointer keeps track of the next position to place a non-zero element. After all non-zero elements have been moved to the front, the remaining positions in the array can be filled with zeros.

This is a void function, so you do not return anything. Modify the input array directly. The output will be the modified array printed with space-separated integers on a single line.`,
  examples: [
    {
      input: '5\n0 1 0 3 12',
      output: '1 3 12 0 0',
      explanation: 'The non-zero elements 1, 3, and 12 are kept in order. The two zeros are moved to the end.'
    },
    {
      input: '3\n1 2 3',
      output: '1 2 3',
      explanation: 'The array contains no zeros, so it remains unchanged.'
    },
    {
      input: '4\n0 0 0 0',
      output: '0 0 0 0',
      explanation: 'The array contains only zeros, so it remains unchanged.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '-2^31 <= array[i] <= 2^31 - 1'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

void solve(int n, vector<int>& arr) {
    // Your code here
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    solve(n, arr);
    
    for (int i = 0; i < n; i++) {
        cout << arr[i] << (i == n - 1 ? "" : " ");
    }
    cout << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static void solve(int n, int[] arr) {
        // Your code here
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        
        solve(n, arr);
        
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
    { input: '5\n0 1 0 3 12', expected: '1 3 12 0 0' },
    { input: '1\n0', expected: '0' },
    { input: '1\n5', expected: '5' },
    { input: '5\n0 0 0 0 0', expected: '0 0 0 0 0' },
    { input: '3\n1 2 3', expected: '1 2 3' },
    { input: '4\n4 5 0 0', expected: '4 5 0 0' },
    { input: '4\n0 0 4 5', expected: '4 5 0 0' },
    { input: '2\n0 1', expected: '1 0' },
    { input: '6\n-1 0 -2 0 3 0', expected: '-1 -2 3 0 0 0' },
    { input: '10\n1 0 2 3 0 4 0 0 5 6', expected: '1 2 3 4 5 6 0 0 0 0' }
  ],

  // ---- Solution ----
  solution: {
    approach: `This problem can be solved efficiently using a two-pointer technique in a single pass. A 'write pointer' (or 'insert position') tracks where the next non-zero element should be placed. Iterate through the array with a 'read pointer'; whenever a non-zero element is found, place it at the 'write pointer's position and increment the 'write pointer'. After the first pass, all non-zero elements are at the beginning of the array in their original relative order. The remaining positions from the 'write pointer' to the end of the array are then filled with zeros.`,
    cpp: `int insertPos = 0;
for (int i = 0; i < n; ++i) {
    if (arr[i] != 0) {
        arr[insertPos++] = arr[i];
    }
}
while (insertPos < n) {
    arr[insertPos++] = 0;
}`,
    java: `int insertPos = 0;
for (int i = 0; i < n; i++) {
    if (arr[i] != 0) {
        arr[insertPos++] = arr[i];
    }
}
while (insertPos < n) {
    arr[insertPos++] = 0;
}`
  }
};