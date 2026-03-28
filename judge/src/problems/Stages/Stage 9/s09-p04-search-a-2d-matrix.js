/**
 * Search a 2D Matrix - Problem Definition
 *
 * Input format (stdin):
 * Line 1: Two integers m and n (rows and columns).
 * Next m lines: n space-separated integers representing the matrix.
 * Last line: An integer target.
 *
 * Output format (stdout):
 * "true" if the target is in the matrix, "false" otherwise.
 */

module.exports = {
  // ---- Identity ----
  id: 'search-a-2d-matrix',
  conquestId: 'stage9-4',
  title: 'Search a 2D Matrix',
  difficulty: 'Medium',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search', 'Matrix'],

  // ---- Story Layer ----
  storyBriefing: `The peak of the mountain reveals an entrance to a hidden chamber. Inside, you find a large, rectangular grid of magical tiles, each inscribed with a number. The numbers are sorted from left to right in each row, and the first number of each row is greater than the last of the previous row. A disembodied voice echoes, 'Find the target tile, and the path forward shall be revealed.' You must search this 2D matrix for a specific target number.`,

  // ---- Technical Layer ----
  description: `You are given an m x n integer matrix that is sorted in a special way: each row is sorted from left to right, and the first integer of each row is greater than the last integer of the previous row. Your task is to write an efficient algorithm that searches for a 'target' value in this matrix.

The properties of the matrix allow you to treat it as a single, large sorted array of length m * n. This means you can apply a standard binary search. To do this, you'll need a way to convert a 1D index from your binary search ('mid') into 2D matrix coordinates ('row', 'col'). This can be done with the formulas: row = mid / n and col = mid % n.

Return "true" if the target is found in the matrix, and "false" otherwise. The solution must have a time complexity of O(log(m*n)).`,
  examples: [
    {
      input: '3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3',
      output: 'true',
      explanation: 'The target value 3 is present in the matrix at row 0, column 1.'
    },
    {
      input: '3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n13',
      output: 'false',
      explanation: 'The target value 13 is not present in the matrix.'
    },
    {
      input: '1 1\n5\n5',
      output: 'true',
      explanation: 'The target value 5 is present in the single-cell matrix.'
    }
  ],
  constraints: [
    '1 <= m, n <= 100',
    '-10^4 <= matrix[i][j], target <= 10^4'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

bool solve(int m, int n, vector<vector<int>>& matrix, int target) {
    int left = 0, right = m * n - 1;
    // Your code here
    
    return false;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int m, n;
    if (!(cin >> m >> n)) return 0;
    vector<vector<int>> matrix(m, vector<int>(n));
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) cin >> matrix[i][j];
    }
    int target;
    cin >> target;
    
    cout << (solve(m, n, matrix, target) ? "true" : "false") << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static boolean solve(int m, int n, int[][] matrix, int target) {
        int left = 0, right = m * n - 1;
        // Your code here
        
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int m = sc.nextInt();
        int n = sc.nextInt();
        int[][] matrix = new int[m][n];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) matrix[i][j] = sc.nextInt();
        }
        int target = sc.nextInt();
        
        System.out.println(solve(m, n, matrix, target));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3', expected: 'true' },
    { input: '3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n13', expected: 'false' },
    { input: '1 1\n5\n5', expected: 'true' },
    { input: '1 1\n5\n4', expected: 'false' },
    { input: '2 2\n1 2\n3 4\n1', expected: 'true' },
    { input: '2 2\n1 2\n3 4\n4', expected: 'true' },
    { input: '2 2\n1 2\n3 4\n5', expected: 'false' },
    { input: '1 5\n1 2 3 4 5\n5', expected: 'true' },
    { input: '5 1\n1\n2\n3\n4\n5\n5', expected: 'true' },
    { input: '2 1\n-10\n-8\n-10', expected: 'true' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is solved by applying binary search to the 2D matrix as if it were a 1D sorted array of size m * n. The search space is from index 0 to (m * n) - 1. In each step of the binary search, calculate the 'mid' index. Convert this 1D 'mid' index to 2D coordinates: 'row = mid / n' and 'col = mid % n'. Compare the matrix element at these coordinates with the target. If it matches, return true. If it's smaller, search the right half (left = mid + 1). If it's larger, search the left half (right = mid - 1). If the loop completes, the target was not found, so return false.`,
    cpp: `while (left <= right) {
    int mid = left + (right - left) / 2;
    int row = mid / n;
    int col = mid % n;
    int val = matrix[row][col];

    if (val == target) {
        return true;
    } else if (val < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return false;`,
    java: `while (left <= right) {
    int mid = left + (right - left) / 2;
    int row = mid / n;
    int col = mid % n;
    int val = matrix[row][col];

    if (val == target) {
        return true;
    } else if (val < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return false;`
  }
};