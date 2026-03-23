/**
 * Flood Fill - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers m and n - number of rows and columns in the image
 *   Next m lines: n space-separated integers representing the image
 *   Next line: Two integers sr and sc - starting row and starting column
 *   Last line: Integer newColor - the new color to apply
 *
 * Output format (stdout):
 *   Print the updated image after performing flood fill.
 *   Output m lines, each containing n space-separated integers.
 */

module.exports = {
  id: 'flood-fill',
  conquestId: 'stage20-4',
  title: 'Flood Fill',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'DFS', 'BFS', 'Grid'],

  description: `
You are given an **m × n image** represented as a grid of integers, where each integer represents the **color of a pixel**.

You are also given a starting pixel \`(sr, sc)\` and a \`newColor\`.

Perform a **flood fill** starting from the pixel \`(sr, sc)\`.

Flood fill means:
- Change the color of the starting pixel.
- Recursively change the color of **all 4-directionally connected pixels** (up, down, left, right)
- Only pixels that have the **same original color** as the starting pixel should be changed.

Return the **modified image** after the flood fill operation.

This problem can be solved using **DFS or BFS traversal on a grid**.
`,

  examples: [
    {
      input: '3 3\n1 1 1\n1 1 0\n1 0 1\n1 1\n2',
      output: '2 2 2\n2 2 0\n2 0 1',
      explanation:
        'Starting at (1,1), all connected pixels with value 1 are changed to 2.'
    }
  ],

  constraints: [
    '1 ≤ m, n ≤ 50',
    '0 ≤ image[i][j] ≤ 65535',
    '0 ≤ sr < m',
    '0 ≤ sc < n'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

void dfs(vector<vector<int>>& image, int r, int c, int oldColor, int newColor) {
    // TODO: Implement flood fill DFS
}

vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int newColor) {
    // TODO: Perform flood fill
    return image;
}

int main() {
    int m, n;
    cin >> m >> n;

    vector<vector<int>> image(m, vector<int>(n));

    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> image[i][j];

    int sr, sc;
    cin >> sr >> sc;

    int newColor;
    cin >> newColor;

    vector<vector<int>> result = floodFill(image, sr, sc, newColor);

    for(int i = 0; i < m; i++) {
        for(int j = 0; j < n; j++) {
            if(j) cout << " ";
            cout << result[i][j];
        }
        if(i < m - 1) cout << "\\n";
    }

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static void dfs(int[][] image, int r, int c, int oldColor, int newColor) {
        // TODO: Implement flood fill DFS
    }

    static int[][] floodFill(int[][] image, int sr, int sc, int newColor) {
        // TODO: Perform flood fill
        return image;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int m = sc.nextInt();
        int n = sc.nextInt();

        int[][] image = new int[m][n];

        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                image[i][j] = sc.nextInt();

        int sr = sc.nextInt();
        int scCol = sc.nextInt();

        int newColor = sc.nextInt();

        int[][] result = floodFill(image, sr, scCol, newColor);

        for(int i = 0; i < m; i++) {
            for(int j = 0; j < n; j++) {
                if(j > 0) System.out.print(" ");
                System.out.print(result[i][j]);
            }
            if(i < m - 1) System.out.println();
        }
    }
}`,
  },

  testCases: [
    {
      input: '3 3\n1 1 1\n1 1 0\n1 0 1\n1 1\n2',
      expected: '2 2 2\n2 2 0\n2 0 1'
    },
    {
      input: '2 2\n0 0\n0 0\n0 0\n1',
      expected: '1 1\n1 1'
    },
    {
      input: '3 3\n1 1 1\n1 0 1\n1 1 1\n1 1\n2',
      expected: '2 2 2\n2 0 2\n2 2 2'
    },
    {
      input: '1 4\n1 1 1 1\n0 1\n3',
      expected: '3 3 3 3'
    },
    {
      input: '3 3\n1 2 3\n4 5 6\n7 8 9\n1 1\n10',
      expected: '1 2 3\n4 10 6\n7 8 9'
    },
    {
      input: '2 3\n1 1 1\n1 1 1\n0 0\n2',
      expected: '2 2 2\n2 2 2'
    },
    {
      input: '3 3\n1 1 0\n1 0 0\n0 0 1\n0 0\n5',
      expected: '5 5 0\n5 0 0\n0 0 1'
    },
    {
      input: '1 1\n7\n0 0\n3',
      expected: '3'
    }
  ],
};