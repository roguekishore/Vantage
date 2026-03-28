/**
 * Kth Missing Positive Number - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated positive integers (sorted).
 * Line 3: An integer k.
 *
 * Output format (stdout):
 * A single integer representing the k-th missing positive integer.
 */

module.exports = {
  // ---- Identity ----
  id: 'kth-missing-positive-number',
  conquestId: 'stage8-4',
  title: 'Kth Missing Positive Number',
  difficulty: 'Easy',
  category: 'Binary Search – Core',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  storyBriefing: `Moaning Myrtle, haunting the second-floor girls' bathroom, presents you with a new puzzle. She shows you a sequence of pipes ('arr'), sorted by size, but she knows that some pipes are missing from the sequence. She wails, 'I'm looking for the k-th missing pipe! Find it for me!' Your task is to figure out which pipe size is the k-th positive integer missing from her sorted list.`,

  // ---- Technical Layer ----
  description: `You are given an array 'arr' of positive integers sorted in a strictly increasing order, and an integer 'k'. Your task is to find the k-th positive integer that is missing from this array.

This problem can be solved in O(log n) time using binary search. The key insight is that for any index 'mid', the number of positive integers missing before 'arr[mid]' is given by 'arr[mid] - (mid + 1)'. You can use this formula to binary search for the correct position. If the number of missing elements at 'mid' is less than 'k', the k-th missing number must be in the right half. Otherwise, it is in the left half.

Return a single integer, which is the k-th missing positive number.`,
  examples: [
    {
      input: '5\n2 3 4 7 11\n5',
      output: '9',
      explanation: 'The missing positive integers are [1, 5, 6, 8, 9, 10, ...]. The 5th missing positive integer is 9.'
    },
    {
      input: '4\n1 2 3 4\n2',
      output: '6',
      explanation: 'The array contains all numbers from 1 to 4. The missing positive integers start from 5. The 2nd missing one is 6.'
    },
    {
      input: '1\n2\n1',
      output: '1',
      explanation: 'The first missing positive integer is 1.'
    }
  ],
  constraints: [
    '1 <= arr.length <= 1000',
    '1 <= arr[i] <= 1000',
    '1 <= k <= 1000',
    'arr is sorted in a strictly increasing order.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

int solve(int n, vector<int>& arr, int k) {
    int left = 0, right = n - 1;
    // Your code here
    
    return left + k;
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
    
    cout << solve(n, arr, k) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, int[] arr, int k) {
        int left = 0, right = n - 1;
        // Your code here
        
        return left + k;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int k = sc.nextInt();
        
        System.out.println(solve(n, arr, k));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '5\n2 3 4 7 11\n5', expected: '9' },
    { input: '4\n1 2 3 4\n2', expected: '6' },
    { input: '1\n2\n1', expected: '1' },
    { input: '1\n1\n1', expected: '2' },
    { input: '5\n1 2 3 4 5\n5', expected: '10' },
    { input: '3\n10 11 12\n5', expected: '5' },
    { input: '5\n2 3 4 5 6\n1', expected: '1' },
    { input: '5\n2 3 4 5 6\n2', expected: '7' },
    { input: '10\n10 20 30 40 50 60 70 80 90 100\n9', expected: '9' },
    { input: '10\n10 20 30 40 50 60 70 80 90 100\n10', expected: '11' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The number of missing positive integers before index 'mid' is 'arr[mid] - (mid + 1)'. We can use binary search to find the turning point where the number of missing integers is less than 'k'. Initialize 'left' to 0 and 'right' to 'n - 1'. While 'left' <= 'right', calculate 'mid'. If 'arr[mid] - (mid + 1)' is less than 'k', it means the k-th missing number is on the right side of 'mid', so we set 'left = mid + 1'. Otherwise, it is on the left, so we set 'right = mid - 1'. The loop ends when 'left' points to the first index where the number of missing elements is 'k' or more. The k-th missing number is then 'left + k'.`,
    cpp: `while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] - (mid + 1) < k) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return left + k;`,
    java: `while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] - (mid + 1) < k) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return left + k;`
  }
};