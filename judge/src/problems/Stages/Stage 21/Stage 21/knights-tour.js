/**
 * Knight's Tour - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the size of the chessboard (n × n)
 *
 * Output format (stdout):
 *   Print an n × n matrix representing the knight's tour.
 *   Each cell contains the step number when the knight visits it (starting from 0).
 *   The knight always starts at position (0,0).
 *   If no valid tour exists, print:
 *   No solution
 */

module.exports = {
  id: 'knights-tour',
  conquestId: 'stage21-13',
  title: "The Enchanted Chessboard",
  difficulty: 'Hard',
  category: 'Backtracking',
  tags: ['Backtracking', 'Recursion', 'Matrix', 'DFS'],
  storyBriefing: `
You enter a chamber with a giant, enchanted chessboard. To proceed, you must complete the Knight's Tour. A spectral knight appears at the starting square (0,0).

Your task is to guide the knight across the n x n board, ensuring it visits every single square exactly once. The knight moves in its classic 'L' shape. If you succeed, the door to the next chamber will unlock.
`,
  description: `
The **Knight's Tour** problem asks you to move a knight on a chessboard such that it visits **every square exactly once**.

A knight moves in an **L-shape**:
- Two squares in one direction
- One square perpendicular to that direction

Your task is to determine a sequence of moves so that the knight visits **all n × n cells exactly once**, starting from the **top-left corner (0,0)**.

If a valid tour exists, print the board showing the **order of moves**.  
If no solution exists, print **"No solution"**.

The problem is typically solved using **backtracking**, exploring all possible knight moves and undoing moves that lead to dead ends.
`,

  examples: [
    {
      input: '1',
      output: '0',
      explanation: 'Only one cell exists, so the knight starts and ends there.'
    },
    {
      input: '2',
      output: 'No solution',
      explanation: 'A knight cannot visit all squares on a 2×2 board.'
    },
    {
      input: '5',
      output:
`0 5 14 9 20
13 8 19 4 15
18 1 6 21 10
7 12 23 16 3
24 17 2 11 22`,
      explanation: 'One valid knight tour on a 5×5 board.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 6',
    'The knight always starts at position (0,0)',
    'Output any valid tour if multiple solutions exist'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <iomanip>

using namespace std;

class Solution {
public:
    bool isSafe(int x, int y, int n, const vector<vector<int>>& board) {
        return (x >= 0 && x < n && y >= 0 && y < n && board[x][y] == -1);
    }

    bool solveKTUtil(int x, int y, int movei, vector<vector<int>>& board, int n, const vector<int>& dx, const vector<int>& dy) {
        if (movei == n * n) {
            return true;
        }

        for (int k = 0; k < 8; k++) {
            int next_x = x + dx[k];
            int next_y = y + dy[k];
            if (isSafe(next_x, next_y, n, board)) {
                board[next_x][next_y] = movei;
                if (solveKTUtil(next_x, next_y, movei + 1, board, n, dx, dy)) {
                    return true;
                } else {
                    board[next_x][next_y] = -1; // Backtrack
                }
            }
        }
        return false;
    }

    bool solveKT(int n, vector<vector<int>>& board) {
        vector<int> dx = {2, 1, -1, -2, -2, -1, 1, 2};
        vector<int> dy = {1, 2, 2, 1, -1, -2, -2, -1};

        board[0][0] = 0;

        if (!solveKTUtil(0, 0, 1, board, n, dx, dy)) {
            return false;
        }
        return true;
    }
};

int main() {
    int n;
    cin >> n;

    vector<vector<int>> board(n, vector<int>(n, -1));

    Solution sol;
    if (!sol.solveKT(n, board)) {
        cout << "No solution";
    } else {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                cout << board[i][j] << (j == n - 1 ? "" : " ");
            }
            cout << endl;
        }
    }

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Solution {
        int[] dx = {2, 1, -1, -2, -2, -1, 1, 2};
        int[] dy = {1, 2, 2, 1, -1, -2, -2, -1};

        boolean isSafe(int x, int y, int n, int[][] board) {
            return (x >= 0 && x < n && y >= 0 && y < n && board[x][y] == -1);
        }

        boolean solveKTUtil(int x, int y, int movei, int[][] board, int n) {
            if (movei == n * n) {
                return true;
            }

            for (int k = 0; k < 8; k++) {
                int next_x = x + dx[k];
                int next_y = y + dy[k];
                if (isSafe(next_x, next_y, n, board)) {
                    board[next_x][next_y] = movei;
                    if (solveKTUtil(next_x, next_y, movei + 1, board, n)) {
                        return true;
                    } else {
                        board[next_x][next_y] = -1; // Backtrack
                    }
                }
            }
            return false;
        }

        boolean solveKT(int n, int[][] board) {
            board[0][0] = 0;

            if (!solveKTUtil(0, 0, 1, board, n)) {
                return false;
            }
            return true;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        int[][] board = new int[n][n];
        for (int i = 0; i < n; i++) {
            Arrays.fill(board[i], -1);
        }

        Solution sol = new Solution();
        if (!sol.solveKT(n, board)) {
            System.out.print("No solution");
        } else {
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    System.out.print(board[i][j] + (j == n - 1 ? "" : " "));
                }
                System.out.println();
            }
        }
    }
}`
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <iomanip>

using namespace std;

class Solution {
public:
    bool isSafe(int x, int y, int n, const vector<vector<int>>& board) {
        return (x >= 0 && x < n && y >= 0 && y < n && board[x][y] == -1);
    }

    bool solveKTUtil(int x, int y, int movei, vector<vector<int>>& board, int n, const vector<int>& dx, const vector<int>& dy) {
        if (movei == n * n) {
            return true;
        }

        for (int k = 0; k < 8; k++) {
            int next_x = x + dx[k];
            int next_y = y + dy[k];
            if (isSafe(next_x, next_y, n, board)) {
                board[next_x][next_y] = movei;
                if (solveKTUtil(next_x, next_y, movei + 1, board, n, dx, dy)) {
                    return true;
                } else {
                    board[next_x][next_y] = -1; // Backtrack
                }
            }
        }
        return false;
    }

    bool solveKT(int n, vector<vector<int>>& board) {
        vector<int> dx = {2, 1, -1, -2, -2, -1, 1, 2};
        vector<int> dy = {1, 2, 2, 1, -1, -2, -2, -1};

        board[0][0] = 0;

        if (!solveKTUtil(0, 0, 1, board, n, dx, dy)) {
            return false;
        }
        return true;
    }
};

int main() {
    int n;
    cin >> n;

    vector<vector<int>> board(n, vector<int>(n, -1));

    Solution sol;
    if (!sol.solveKT(n, board)) {
        cout << "No solution";
    } else {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                cout << board[i][j] << (j == n - 1 ? "" : " ");
            }
            cout << endl;
        }
    }

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Solution {
        int[] dx = {2, 1, -1, -2, -2, -1, 1, 2};
        int[] dy = {1, 2, 2, 1, -1, -2, -2, -1};

        boolean isSafe(int x, int y, int n, int[][] board) {
            return (x >= 0 && x < n && y >= 0 && y < n && board[x][y] == -1);
        }

        boolean solveKTUtil(int x, int y, int movei, int[][] board, int n) {
            if (movei == n * n) {
                return true;
            }

            for (int k = 0; k < 8; k++) {
                int next_x = x + dx[k];
                int next_y = y + dy[k];
                if (isSafe(next_x, next_y, n, board)) {
                    board[next_x][next_y] = movei;
                    if (solveKTUtil(next_x, next_y, movei + 1, board, n)) {
                        return true;
                    } else {
                        board[next_x][next_y] = -1; // Backtrack
                    }
                }
            }
            return false;
        }

        boolean solveKT(int n, int[][] board) {
            board[0][0] = 0;

            if (!solveKTUtil(0, 0, 1, board, n)) {
                return false;
            }
            return true;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();

        int[][] board = new int[n][n];
        for (int i = 0; i < n; i++) {
            Arrays.fill(board[i], -1);
        }

        Solution sol = new Solution();
        if (!sol.solveKT(n, board)) {
            System.out.print("No solution");
        } else {
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    System.out.print(board[i][j] + (j == n - 1 ? "" : " "));
                }
                System.out.println();
            }
        }
    }
}`
  },

  testCases: [
    {
      input: '1',
      expected: '0'
    },
    {
      input: '2',
      expected: 'No solution'
    },
    {
      input: '3',
      expected: 'No solution'
    },
    {
      input: '4',
      expected: 'No solution'
    },
    {
      input: '5',
      expected:
`0 5 14 9 20
13 8 19 4 15
18 1 6 21 10
7 12 23 16 3
24 17 2 11 22`
    },
    {
      input: '6',
      expected: 'No solution'
    },
    {
      input: '1',
      expected: '0'
    },
    {
      input: '2',
      expected: 'No solution'
    },
    {
      input: '3',
      expected: 'No solution'
    },
    {
      input: '5',
      expected:
`0 5 14 9 20
13 8 19 4 15
18 1 6 21 10
7 12 23 16 3
24 17 2 11 22`
    }
  ],
};