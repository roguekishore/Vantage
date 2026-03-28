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
  conquestId: 's20-p04',
  title: 'Ink Spill in the Library',
  difficulty: 'Medium',
  category: 'Graphs',
  tags: ['Graph', 'DFS', 'BFS', 'Grid', 'Hogwarts'],

  storyBriefing: `
"Oh no, the ink!" Hermione cries as a bottle of magical ink tips over onto an ancient parchment. The ink is spreading rapidly across the page, but only through sections of the same texture. "Quick, if we can identify the spread, maybe we can cast a Siphoning Charm before it ruins the whole text!"

Starting from a specific pixel, perform a **Flood Fill** to identify how the magical ink spreads across the grid of the parchment.
`,

  description: `
You are given an **m × n image** represented as a grid of integers, where each integer represents the **color of a pixel**.

You are also given a starting pixel \`(sr, sc)\` and a \`newColor\`.

Perform a **flood fill** starting from the pixel \`(sr, sc)\`.

Flood fill means:
- Change the color of the starting pixel.
- Recursively change the color of **all 4-directionally connected pixels** (up, down, left, right)
- Only pixels that have the **same original color** as the starting pixel should be changed.

Return the **modified image** after the flood fill operation.
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

void dfs(vector<vector<int>>& image, int r, int c, int oldColor, int newColor, int m, int n) {
    if (r < 0 || r >= m || c < 0 || c >= n || image[r][c] != oldColor) return;
    
    image[r][c] = newColor;
    dfs(image, r + 1, c, oldColor, newColor, m, n);
    dfs(image, r - 1, c, oldColor, newColor, m, n);
    dfs(image, r, c + 1, oldColor, newColor, m, n);
    dfs(image, r, c - 1, oldColor, newColor, m, n);
}

vector<vector<int>> floodFill(vector<vector<int>>& image, int sr, int sc, int newColor) {
    int oldColor = image[sr][sc];
    if (oldColor != newColor) {
        dfs(image, sr, sc, oldColor, newColor, image.size(), image[0].size());
    }
    return image;
}

int main() {
    int m, n;
    if (!(cin >> m >> n)) return 0;

    vector<vector<int>> image(m, vector<int>(n));
    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> image[i][j];

    int sr, sc, newColor;
    cin >> sr >> sc >> newColor;

    floodFill(image, sr, sc, newColor);

    for(int i = 0; i < m; i++) {
        for(int j = 0; j < n; j++) {
            cout << image[i][j] << (j == n - 1 ? "" : " ");
        }
        cout << "\\n";
    }
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static void dfs(int[][] image, int r, int c, int oldColor, int newColor, int m, int n) {
        if (r < 0 || r >= m || c < 0 || c >= n || image[r][c] != oldColor) return;
        
        image[r][c] = newColor;
        dfs(image, r + 1, c, oldColor, newColor, m , n);
        dfs(image, r - 1, c, oldColor, newColor, m , n);
        dfs(image, r, c + 1, oldColor, newColor, m , n);
        dfs(image, r, c - 1, oldColor, newColor, m , n);
    }

    static int[][] floodFill(int[][] image, int sr, int sc, int newColor) {
        int oldColor = image[sr][sc];
        if (oldColor != newColor) {
            dfs(image, sr, sc, oldColor, newColor, image.length, image[0].length);
        }
        return image;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;

        int m = sc.nextInt();
        int n = sc.nextInt();

        int[][] image = new int[m][n];
        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                image[i][j] = sc.nextInt();

        int sr = sc.nextInt();
        int scCol = sc.nextInt();
        int newColor = sc.nextInt();

        floodFill(image, sr, scCol, newColor);

        for(int i = 0; i < m; i++) {
            for(int j = 0; j < n; j++) {
                System.out.print(image[i][j] + (j == n - 1 ? "" : " "));
            }
            System.out.println();
        }
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>

using namespace std;

void dfs(vector<vector<int>>& image, int r, int c, int oldColor, int newColor, int m, int n) {
    if (r < 0 || r >= m || c < 0 || c >= n || image[r][c] != oldColor) return;
    
    image[r][c] = newColor;
    dfs(image, r + 1, c, oldColor, newColor, m, n);
    dfs(image, r - 1, c, oldColor, newColor, m, n);
    dfs(image, r, c + 1, oldColor, newColor, m, n);
    dfs(image, r, c - 1, oldColor, newColor, m, n);
}

int main() {
    int m, n;
    if (!(cin >> m >> n)) return 0;
    vector<vector<int>> image(m, vector<int>(n));
    for(int i = 0; i < m; i++)
        for(int j = 0; j < n; j++)
            cin >> image[i][j];
    int sr, sc, newColor;
    cin >> sr >> sc >> newColor;
    int oldColor = image[sr][sc];
    if (oldColor != newColor) {
        dfs(image, sr, sc, oldColor, newColor, m, n);
    }
    for(int i = 0; i < m; i++) {
        for(int j = 0; j < n; j++) {
            cout << image[i][j] << (j == n - 1 ? "" : " ");
        }
        cout << "\\n";
    }
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    static void dfs(int[][] image, int r, int c, int oldColor, int newColor, int m, int n) {
        if (r < 0 || r >= m || c < 0 || c >= n || image[r][c] != oldColor) return;
        image[r][c] = newColor;
        dfs(image, r + 1, c, oldColor, newColor, m, n);
        dfs(image, r - 1, c, oldColor, newColor, m, n);
        dfs(image, r, c + 1, oldColor, newColor, m, n);
        dfs(image, r, c - 1, oldColor, newColor, m, n);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int m = sc.nextInt();
        int n = sc.nextInt();
        int[][] image = new int[m][n];
        for(int i = 0; i < m; i++)
            for(int j = 0; j < n; j++)
                image[i][j] = sc.nextInt();
        int sr = sc.nextInt();
        int scCol = sc.nextInt();
        int newColor = sc.nextInt();
        int oldColor = image[sr][scCol];
        if (oldColor != newColor) {
            dfs(image, sr, scCol, oldColor, newColor, m, n);
        }
        for(int i = 0; i < m; i++) {
            for(int j = 0; j < n; j++) {
                System.out.print(image[i][j] + (j == n - 1 ? "" : " "));
            }
            if(i != m - 1) System.out.println();
        }
    }
}`
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