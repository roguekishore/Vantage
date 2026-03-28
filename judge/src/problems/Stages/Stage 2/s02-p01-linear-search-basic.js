/**
 * Linear Search in Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 * Line 3: An integer target, the value to search for.
 *
 * Output format (stdout):
 * The 0-based index of the first occurrence of the target. 
 * If the target is not found, output -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'linear-search-basic',
  conquestId: 'stage2-1',
  title: 'Linear Search in Array',
  difficulty: 'Easy',
  category: 'Array Index Manipulation',
  tags: ['Array', 'Searching', 'Basics'],

  // ---- Story Layer ----
  stageIntro: `Your first week at Hogwarts flew by in a whirlwind of new faces and magical lessons. Now, as you begin to navigate the castle's countless corridors with more confidence, a new excitement is in the air. Quidditch tryouts are just around the corner, and the house teams are buzzing with anticipation. It's time to prove your skills extend beyond the classroom.`,
  storyBriefing: `Before you can even think about tryouts, you've misplaced your brand-new Silver Arrow broomstick catalogue. You remember leaving it in the common room, but it's buried somewhere in a messy pile of books and scrolls left by other students. You'll have to check each item one by one to find it.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers and a target value. Your task is to find the 0-based index of the first occurrence of the target in the array.

The fundamental approach for this is a linear scan. You will need to iterate through the array from the first element to the last, comparing each element with the target value. The first time you find a match, you should immediately report its index.

Return a single integer representing the 0-based index of the target. If the target is not found after checking every element, return -1.`,
  examples: [
    {
      input: '5\n10 20 30 40 50\n30',
      output: '2',
      explanation: 'Starting from index 0: 10 is not 30. 20 is not 30. 30 is a match at index 2. Return 2.'
    },
    {
      input: '4\n1 2 3 4\n10',
      output: '-1',
      explanation: 'We scan the entire array: 1, 2, 3, and 4. None of them match the target 10. We reach the end of the array, so we return -1.'
    },
    {
      input: '1\n100\n100',
      output: '0',
      explanation: 'The array has only one element, 100. It matches the target at index 0. Return 0.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '-10^9 <= array[i], target <= 10^9'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

int solve(int n, const vector<int>& arr, int target) {
    // Your code here
    return -1;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int target;
    cin >> target;
    cout << solve(n, arr, target) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, int[] arr, int target) {
        // Your code here
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        if (!sc.hasNextInt()) return;
        int target = sc.nextInt();
        System.out.println(solve(n, arr, target));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '5\n10 20 30 40 50\n30', expected: '2' },
    { input: '1\n42\n42', expected: '0' },
    { input: '5\n7 7 7 7 7\n7', expected: '0' },
    { input: '4\n-10 -5 -20 -15\n-20', expected: '2' },
    { input: '6\n0 15 0 -5 0 10\n-5', expected: '3' },
    { input: '2\n2147483647 -2147483648\n-2147483648', expected: '1' },
    { input: '5\n99 1 2 3 4\n99', expected: '0' },
    { input: '5\n1 2 3 4 99\n99', expected: '4' },
    { input: '2\n10 20\n20', expected: '1' },
    { input: '5\n1 2 3 4 5\n6', expected: '-1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The linear search algorithm iterates through each element of the array from start to end. It compares each element with the target value. If a match is found, the index of that element is returned immediately. If the end of the array is reached without finding the target, -1 is returned.`,
    cpp: `for (int i = 0; i < n; ++i) {
    if (arr[i] == target) {
        return i;
    }
}
return -1;`,
    java: `for (int i = 0; i < n; i++) {
    if (arr[i] == target) {
        return i;
    }
}
return -1;`
  }
};