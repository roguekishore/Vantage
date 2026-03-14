/**
 * Sudoku Solver — Problem Definition
 *
 * Input format (stdin):
 *   9 lines follow, each containing 9 space-separated integers.
 *   Each integer represents a cell in the Sudoku board:
 *     0 → empty cell
 *     1–9 → pre-filled digit
 *
 * Output format (stdout):
 *   Print the solved Sudoku board as 9 lines, each containing 9 space-separated integers.
 *   If no solution exists, print "No solution".
 */

module.exports = {
  id: 'sudoku-solver',
  conquestId: 'stage21-11',
  title: 'Sudoku Solver',
  difficulty: 'Hard',
  category: 'Recursion',
  tags: ['Recursion', 'Backtracking', 'Matrix'],

  description: `
Sudoku is a **9 × 9 puzzle** where the goal is to fill the board so that:

1. Each **row** contains digits **1–9 exactly once**
2. Each **column** contains digits **1–9 exactly once**
3. Each **3 × 3 subgrid** contains digits **1–9 exactly once**

Some cells are pre-filled, while empty cells are represented by **0**.

Your task is to **solve the Sudoku puzzle** and print the completed board.

This problem is typically solved using **recursion and backtracking**:
- Find an empty cell.
- Try digits **1–9**.
- Check if the placement is valid.
- Recursively attempt to fill the rest of the board.
- If a conflict occurs, **backtrack**.

If the puzzle has a valid solution, print the completed board.
Otherwise print **"No solution"**.
`,

  examples: [
    {
      input:
        '5 3 0 0 7 0 0 0 0\n6 0 0 1 9 5 0 0 0\n0 9 8 0 0 0 0 6 0\n8 0 0 0 6 0 0 0 3\n4 0 0 8 0 3 0 0 1\n7 0 0 0 2 0 0 0 6\n0 6 0 0 0 0 2 8 0\n0 0 0 4 1 9 0 0 5\n0 0 0 0 8 0 0 7 9',
      output:
        '5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9',
      explanation: 'The board is filled so that all Sudoku rules are satisfied.'
    }
  ],

  constraints: [
    'The board size is always 9 × 9',
    '0 ≤ cell value ≤ 9',
    'Input puzzle may or may not have a valid solution'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

bool isValid(vector<vector<int>>& board, int row, int col, int num) {
    // TODO: Check row, column and 3x3 box constraints
    return true;
}

bool solve(vector<vector<int>>& board) {
    // TODO: Implement backtracking Sudoku solver
    return false;
}

int main() {
    vector<vector<int>> board(9, vector<int>(9));

    for(int i = 0; i < 9; i++)
        for(int j = 0; j < 9; j++)
            cin >> board[i][j];

    if(solve(board)) {
        for(int i = 0; i < 9; i++) {
            for(int j = 0; j < 9; j++) {
                if(j) cout << " ";
                cout << board[i][j];
            }
            cout << endl;
        }
    } else {
        cout << "No solution";
    }

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static boolean isValid(int[][] board, int row, int col, int num) {
        // TODO: Check row, column and 3x3 box constraints
        return true;
    }

    static boolean solve(int[][] board) {
        // TODO: Implement backtracking Sudoku solver
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int[][] board = new int[9][9];

        for(int i = 0; i < 9; i++)
            for(int j = 0; j < 9; j++)
                board[i][j] = sc.nextInt();

        if(solve(board)) {
            for(int i = 0; i < 9; i++) {
                for(int j = 0; j < 9; j++) {
                    if(j > 0) System.out.print(" ");
                    System.out.print(board[i][j]);
                }
                System.out.println();
            }
        } else {
            System.out.print("No solution");
        }
    }
}`,
  },

  testCases: [
    {
      input:
        '5 3 0 0 7 0 0 0 0\n6 0 0 1 9 5 0 0 0\n0 9 8 0 0 0 0 6 0\n8 0 0 0 6 0 0 0 3\n4 0 0 8 0 3 0 0 1\n7 0 0 0 2 0 0 0 6\n0 6 0 0 0 0 2 8 0\n0 0 0 4 1 9 0 0 5\n0 0 0 0 8 0 0 7 9',
      expected:
        '5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9'
    },
    {
      input:
        '0 0 0 2 6 0 7 0 1\n6 8 0 0 7 0 0 9 0\n1 9 0 0 0 4 5 0 0\n8 2 0 1 0 0 0 4 0\n0 0 4 6 0 2 9 0 0\n0 5 0 0 0 3 0 2 8\n0 0 9 3 0 0 0 7 4\n0 4 0 0 5 0 0 3 6\n7 0 3 0 1 8 0 0 0',
      expected:
        '4 3 5 2 6 9 7 8 1\n6 8 2 5 7 1 4 9 3\n1 9 7 8 3 4 5 6 2\n8 2 6 1 9 5 3 4 7\n3 7 4 6 8 2 9 1 5\n9 5 1 7 4 3 6 2 8\n5 1 9 3 2 6 8 7 4\n2 4 8 9 5 7 1 3 6\n7 6 3 4 1 8 2 5 9'
    },
    {
      input:
        '0 0 0 0 0 0 0 0 0\n0 0 0 0 0 3 0 8 5\n0 0 1 0 2 0 0 0 0\n0 0 0 5 0 7 0 0 0\n0 0 4 0 0 0 1 0 0\n0 9 0 0 0 0 0 0 0\n5 0 0 0 0 0 0 7 3\n0 0 2 0 1 0 0 0 0\n0 0 0 0 4 0 0 0 9',
      expected:
        '9 8 7 6 5 4 3 2 1\n2 4 6 1 7 3 9 8 5\n3 5 1 9 2 8 7 4 6\n1 2 8 5 3 7 6 9 4\n6 3 4 8 9 2 1 5 7\n7 9 5 4 6 1 8 3 2\n5 1 9 2 8 6 4 7 3\n4 7 2 3 1 9 5 6 8\n8 6 3 7 4 5 2 1 9'
    },
    {
      input:
        '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8',
      expected:
        '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8'
    },
    {
      input:
        '0 0 0 0 0 0 0 1 2\n0 0 0 0 0 0 0 3 4\n0 0 0 0 0 0 0 5 6\n0 0 0 0 0 0 0 7 8\n0 0 0 0 0 0 0 9 1\n0 0 0 0 0 0 0 2 3\n0 0 0 0 0 0 0 4 5\n0 0 0 0 0 0 0 6 7\n0 0 0 0 0 0 0 8 9',
      expected:
        '3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 5 3 4\n9 1 2 3 4 5 7 5 6\n1 2 3 4 5 6 8 7 8\n4 5 6 7 8 9 2 9 1\n7 8 9 1 2 3 4 2 3\n2 3 4 8 9 1 6 4 5\n5 6 7 2 3 4 1 6 7\n8 9 1 5 6 7 3 8 9'
    },
    {
      input:
        '5 0 0 0 0 0 0 0 0\n0 0 0 0 0 3 0 8 5\n0 0 1 0 2 0 0 0 0\n0 0 0 5 0 7 0 0 0\n0 0 4 0 0 0 1 0 0\n0 9 0 0 0 0 0 0 0\n5 0 0 0 0 0 0 7 3\n0 0 2 0 1 0 0 0 0\n0 0 0 0 4 0 0 0 9',
      expected:
        '5 8 7 6 9 4 3 2 1\n2 4 6 1 7 3 9 8 5\n3 5 1 9 2 8 7 4 6\n1 2 8 5 3 7 6 9 4\n6 3 4 8 9 2 1 5 7\n7 9 5 4 6 1 8 3 2\n5 1 9 2 8 6 4 7 3\n4 7 2 3 1 9 5 6 8\n8 6 3 7 4 5 2 1 9'
    },
    {
      input:
        '0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0',
      expected:
        '1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8'
    },
    {
      input:
        '5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9',
      expected:
        '5 3 4 6 7 8 9 1 2\n6 7 2 1 9 5 3 4 8\n1 9 8 3 4 2 5 6 7\n8 5 9 7 6 1 4 2 3\n4 2 6 8 5 3 7 9 1\n7 1 3 9 2 4 8 5 6\n9 6 1 5 3 7 2 8 4\n2 8 7 4 1 9 6 3 5\n3 4 5 2 8 6 1 7 9'
    },
    {
      input:
        '1 0 0 0 0 7 0 9 0\n0 3 0 0 2 0 0 0 8\n0 0 9 6 0 0 5 0 0\n0 0 5 3 0 0 9 0 0\n0 1 0 0 8 0 0 0 2\n6 0 0 0 0 4 0 0 0\n3 0 0 0 0 0 0 1 0\n0 4 0 0 0 0 0 0 7\n0 0 7 0 0 0 3 0 0',
      expected:
        '1 6 2 8 5 7 4 9 3\n5 3 4 1 2 9 6 7 8\n7 8 9 6 4 3 5 2 1\n4 7 5 3 1 2 9 8 6\n9 1 3 5 8 6 7 4 2\n6 2 8 7 9 4 1 3 5\n3 5 6 4 7 8 2 1 9\n2 4 1 9 3 5 8 6 7\n8 9 7 2 6 1 3 5 4'
    }
  ],
};