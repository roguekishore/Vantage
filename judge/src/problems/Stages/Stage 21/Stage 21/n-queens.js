/**
 * N-Queens - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer n - size of the chessboard (n × n)
 *
 * Output format (stdout):
 *   Print the total number of distinct ways to place n queens on the board
 *   such that no two queens attack each other.
 */

module.exports = {
  id: 'n-queens',
  conquestId: 'stage21-8',
  title: 'N-Queens',
  difficulty: 'Hard',
  category: 'Recursion',
  tags: ['Recursion', 'Backtracking', 'Chessboard'],

  description: `
The **N-Queens problem** asks you to place **n queens** on an **n × n chessboard** so that **no two queens attack each other**.

A queen can attack:
- Horizontally
- Vertically
- Diagonally

Therefore, the placement must ensure:
- No two queens share the **same row**
- No two queens share the **same column**
- No two queens share the **same diagonal**

Your task is to compute the **total number of distinct valid configurations** for placing the queens.

Example for **n = 4**:

Two valid arrangements exist, so the answer is **2**.

This problem is typically solved using **recursion and backtracking**, exploring all possible placements while eliminating invalid ones early.
`,

  examples: [
    {
      input: '4',
      output: '2',
      explanation: 'There are exactly 2 valid ways to place 4 queens on a 4×4 board.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 14',
    'Result fits within a 64-bit signed integer'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

bool isSafe(vector<int>& board, int row, int col) {
    for(int i = 0; i < row; i++) {
        int prevCol = board[i];
        if(prevCol == col || abs(prevCol - col) == abs(i - row))
            return false;
    }
    return true;
}

long long solve(int n, int row, vector<int>& board) {
    // TODO: Implement backtracking to count valid N-Queens solutions
    return 0;
}

int main() {
    int n;
    cin >> n;

    vector<int> board(n);

    cout << solve(n, 0, board);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static boolean isSafe(int[] board, int row, int col) {
        for(int i = 0; i < row; i++) {
            int prevCol = board[i];
            if(prevCol == col || Math.abs(prevCol - col) == Math.abs(i - row))
                return false;
        }
        return true;
    }

    static long solve(int n, int row, int[] board) {
        // TODO: Implement backtracking to count valid N-Queens solutions
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[] board = new int[n];

        System.out.print(solve(n, 0, board));
    }
}`,
  },

  testCases: [
    { input: '1', expected: '1' },
    { input: '2', expected: '0' },
    { input: '3', expected: '0' },
    { input: '4', expected: '2' },
    { input: '5', expected: '10' },
    { input: '6', expected: '4' },
    { input: '7', expected: '40' },
    { input: '8', expected: '92' },
    { input: '9', expected: '352' }
  ],
};