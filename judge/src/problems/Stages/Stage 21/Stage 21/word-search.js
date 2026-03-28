/**
 * Word Search - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers m and n - number of rows and columns
 *   Next m lines: n space-separated characters representing the board
 *   Last line: A string word
 *
 * Output format (stdout):
 *   Print "true" if the word exists in the board.
 *   Otherwise print "false".
 */

module.exports = {
  id: 'word-search',
  conquestId: 'stage21-10',
  title: 'The Prophecy Vault',
  difficulty: 'Medium',
  category: 'Recursion',
  tags: ['Recursion', 'Backtracking', 'Matrix', 'DFS'],
  storyBriefing: `
You are in the Hall of Prophecy, a vast chamber filled with glowing orbs. The prophecies are not spoken but written as scattered letters on a massive grid on the wall. You have been given a specific prophecy to find.

The letters of the prophecy must be adjacent (up, down, left, or right) and in the correct sequence. You cannot use the same letter tile twice for one prophecy. Your mission is to find out if the prophecy exists on this wall.
`,
  description: `
Given an **m × n board of characters** and a **target word**, determine whether the word exists in the grid.

The word can be constructed from **adjacent cells**, where adjacency means:
- **Up**
- **Down**
- **Left**
- **Right**

Rules:
- The **same cell cannot be used more than once** in a single word path.
- The letters must appear **in order**.

Example:

Board:
A B C E  
S F C S  
A D E E  

Word: **ABCCED**

Path:
A → B → C → C → E → D

Output: **true**

This problem is typically solved using **DFS with backtracking**, exploring possible paths while marking visited cells and backtracking when the path becomes invalid.
`,

  examples: [
    {
      input: '3 4\nA B C E\nS F C S\nA D E E\nABCCED',
      output: 'true',
      explanation: 'The word can be constructed using adjacent cells.'
    }
  ],

  constraints: [
    '1 ≤ m, n ≤ 10',
    '1 ≤ word.length ≤ 15',
    'Board contains uppercase English letters'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

bool dfs(vector<vector<char>>& board, string& word, int x, int y, int index) {
    int m = board.size();
    int n = board[0].size();

    if (index == word.length()) {
        return true;
    }

    if (x < 0 || x >= m || y < 0 || y >= n || board[x][y] != word[index]) {
        return false;
    }

    char temp = board[x][y];
    board[x][y] = '#'; // Mark as visited

    bool found = dfs(board, word, x + 1, y, index + 1) ||
                 dfs(board, word, x - 1, y, index + 1) ||
                 dfs(board, word, x, y + 1, index + 1) ||
                 dfs(board, word, x, y - 1, index + 1);

    board[x][y] = temp; // Backtrack
    return found;
}

int main() {
    int m, n;
    cin >> m >> n;

    vector<vector<char>> board(m, vector<char>(n));
    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> board[i][j];

    string word;
    cin >> word;

    bool found = false;
    for(int i = 0; i < m; i++) {
        for(int j = 0; j < n; j++) {
            if(dfs(board, word, i, j, 0)) {
                found = true;
                break;
            }
        }
        if(found) break;
    }

    cout << (found ? "true" : "false");

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    public static boolean dfs(char[][] board, String word, int x, int y, int index) {
        int m = board.length;
        int n = board[0].length;

        if (index == word.length()) {
            return true;
        }

        if (x < 0 || x >= m || y < 0 || y >= n || board[x][y] != word.charAt(index)) {
            return false;
        }

        char temp = board[x][y];
        board[x][y] = '#'; // Mark as visited

        boolean found = dfs(board, word, x + 1, y, index + 1) ||
                        dfs(board, word, x - 1, y, index + 1) ||
                        dfs(board, word, x, y + 1, index + 1) ||
                        dfs(board, word, x, y - 1, index + 1);

        board[x][y] = temp; // Backtrack
        return found;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int m = sc.nextInt();
        int n = sc.nextInt();

        char[][] board = new char[m][n];
        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                board[i][j] = sc.next().charAt(0);

        String word = sc.next();

        boolean found = false;
        for(int i = 0; i < m; i++) {
            for(int j = 0; j < n; j++) {
                if(dfs(board, word, i, j, 0)) {
                    found = true;
                    break;
                }
            }
            if(found) break;
        }

        System.out.print(found ? "true" : "false");
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

bool dfs(vector<vector<char>>& board, string& word, int x, int y, int index) {
    int m = board.size();
    int n = board[0].size();

    if (index == word.length()) {
        return true;
    }

    if (x < 0 || x >= m || y < 0 || y >= n || board[x][y] != word[index]) {
        return false;
    }

    char temp = board[x][y];
    board[x][y] = '#'; // Mark as visited

    bool found = dfs(board, word, x + 1, y, index + 1) ||
                 dfs(board, word, x - 1, y, index + 1) ||
                 dfs(board, word, x, y + 1, index + 1) ||
                 dfs(board, word, x, y - 1, index + 1);

    board[x][y] = temp; // Backtrack
    return found;
}

int main() {
    int m, n;
    cin >> m >> n;

    vector<vector<char>> board(m, vector<char>(n));
    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> board[i][j];

    string word;
    cin >> word;

    bool found = false;
    for(int i = 0; i < m; i++) {
        for(int j = 0; j < n; j++) {
            if(dfs(board, word, i, j, 0)) {
                found = true;
                break;
            }
        }
        if(found) break;
    }

    cout << (found ? "true" : "false");

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    public static boolean dfs(char[][] board, String word, int x, int y, int index) {
        int m = board.length;
        int n = board[0].length;

        if (index == word.length()) {
            return true;
        }

        if (x < 0 || x >= m || y < 0 || y >= n || board[x][y] != word.charAt(index)) {
            return false;
        }

        char temp = board[x][y];
        board[x][y] = '#'; // Mark as visited

        boolean found = dfs(board, word, x + 1, y, index + 1) ||
                        dfs(board, word, x - 1, y, index + 1) ||
                        dfs(board, word, x, y + 1, index + 1) ||
                        dfs(board, word, x, y - 1, index + 1);

        board[x][y] = temp; // Backtrack
        return found;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int m = sc.nextInt();
        int n = sc.nextInt();

        char[][] board = new char[m][n];
        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                board[i][j] = sc.next().charAt(0);

        String word = sc.next();

        boolean found = false;
        for(int i = 0; i < m; i++) {
            for(int j = 0; j < n; j++) {
                if(dfs(board, word, i, j, 0)) {
                    found = true;
                    break;
                }
            }
            if(found) break;
        }

        System.out.print(found ? "true" : "false");
    }
}`,
  },

  testCases: [
    { input: '1 1\nA\nA', expected: 'true' },
    { input: '1 1\nA\nB', expected: 'false' },
    {
      input: '3 4\nA B C E\nS F C S\nA D E E\nABCCED',
      expected: 'true'
    },
    {
      input: '3 4\nA B C E\nS F C S\nA D E E\nSEE',
      expected: 'true'
    },
    {
      input: '3 4\nA B C E\nS F C S\nA D E E\nABCB',
      expected: 'false'
    },
    {
      input: '2 2\nA B\nC D\nABCD',
      expected: 'false'
    },
    {
      input: '2 3\nA B C\nD E F\nABE',
      expected: 'true'
    },
    {
      input: '3 3\nA A A\nA A A\nA A A\nAAAA',
      expected: 'true'
    },
    {
      input: '2 2\nA B\nC D\nACDB',
      expected: 'true'
    }
  ],
};