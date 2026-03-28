/**
 * Assign Cookies - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of children
 *   Line 2: n space-separated integers representing the greed factor of each child
 *   Line 3: An integer m representing the number of cookies
 *   Line 4: m space-separated integers representing the size of each cookie
 *
 * Output format (stdout):
 *   Print a single integer representing the maximum number of children that can be satisfied.
 */

module.exports = {
  id: 'assign-cookies',
  conquestId: 'stage23-3',
  title: "The First Task: Dragon's Nest",
  difficulty: 'Easy',
  category: 'Greedy',
  tags: ['Greedy', 'Array', 'Sorting'],
  storyBriefing: `
Welcome, champions, to the first task of the Triwizard Tournament! Before you is a nest of dragons, each guarding a golden egg. To create a diversion, you've been given a bag of enchanted snacks.

Each dragon has a 'hunger' level (greed factor), and each snack has a 'satisfaction' value (size). A snack can satisfy a dragon only if its value is greater than or equal to the dragon's hunger.

Your task is to be clever and greedy. Use your limited supply of snacks to satisfy the maximum number of dragons, allowing you to retrieve an egg.
`,
  description: `
You are given two integer arrays:

- **g[i]** - the greed factor of the **iᵗʰ child**
- **s[j]** - the size of the **jᵗʰ cookie**

A child **i** can be satisfied if:

\`s[j] ≥ g[i]\`

Each child can receive **at most one cookie**, and each cookie can be assigned to **only one child**.

Your goal is to **maximize the number of satisfied children**.

Approach:

1. Sort both arrays.
2. Use a **two-pointer greedy approach**:
   - Try to satisfy the child with the smallest greed using the smallest available cookie that fits.

Time Complexity: **O(n log n + m log m)**  
Space Complexity: **O(1)** (excluding sorting)
`,

  examples: [
    {
      input: '3\n1 2 3\n2\n1 1',
      output: '1',
      explanation: 'Only the child with greed factor 1 can be satisfied.'
    },
    {
      input: '2\n1 2\n3\n1 2 3',
      output: '2',
      explanation: 'Both children can be satisfied.'
    }
  ],

  constraints: [
    '1 ≤ n, m ≤ 3 × 10^4',
    '0 ≤ g[i], s[j] ≤ 10^9'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        sort(g.begin(), g.end());
        sort(s.begin(), s.end());
        int i = 0, j = 0;
        while (i < g.size() && j < s.size()) {
            if (s[j] >= g[i]) {
                i++;
            }
            j++;
        }
        return i;
    }
};

int main() {
    int n;
    cin >> n;

    vector<int> g(n);
    for (int i = 0; i < n; i++)
        cin >> g[i];

    int m;
    cin >> m;

    vector<int> s(m);
    for (int i = 0; i < m; i++)
        cin >> s[i];

    Solution sol;
    cout << sol.findContentChildren(g, s);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Solution {
        public int findContentChildren(int[] g, int[] s) {
            Arrays.sort(g);
            Arrays.sort(s);
            int i = 0, j = 0;
            while (i < g.length && j < s.length) {
                if (s[j] >= g[i]) {
                    i++;
                }
                j++;
            }
            return i;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] g = new int[n];
        for (int i = 0; i < n; i++) {
            g[i] = sc.nextInt();
        }

        int m = sc.nextInt();
        int[] s = new int[m];
        for (int i = 0; i < m; i++) {
            s[i] = sc.nextInt();
        }

        Solution sol = new Solution();
        System.out.print(sol.findContentChildren(g, s));
    }
}`
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        sort(g.begin(), g.end());
        sort(s.begin(), s.end());
        int i = 0, j = 0;
        while (i < g.size() && j < s.size()) {
            if (s[j] >= g[i]) {
                i++;
            }
            j++;
        }
        return i;
    }
};

int main() {
    int n;
    cin >> n;

    vector<int> g(n);
    for (int i = 0; i < n; i++)
        cin >> g[i];

    int m;
    cin >> m;

    vector<int> s(m);
    for (int i = 0; i < m; i++)
        cin >> s[i];

    Solution sol;
    cout << sol.findContentChildren(g, s);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Solution {
        public int findContentChildren(int[] g, int[] s) {
            Arrays.sort(g);
            Arrays.sort(s);
            int i = 0, j = 0;
            while (i < g.length && j < s.length) {
                if (s[j] >= g[i]) {
                    i++;
                }
                j++;
            }
            return i;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] g = new int[n];
        for (int i = 0; i < n; i++) {
            g[i] = sc.nextInt();
        }

        int m = sc.nextInt();
        int[] s = new int[m];
        for (int i = 0; i < m; i++) {
            s[i] = sc.nextInt();
        }

        Solution sol = new Solution();
        System.out.print(sol.findContentChildren(g, s));
    }
}`
  },

  testCases: [
    { input: '3\n1 2 3\n2\n1 1', expected: '1' },
    { input: '2\n1 2\n3\n1 2 3', expected: '2' },
    { input: '1\n5\n1\n3', expected: '0' },
    { input: '4\n1 2 3 4\n4\n1 2 3 4', expected: '4' },
    { input: '5\n2 3 4 5 6\n3\n1 2 3', expected: '2' },
    { input: '3\n10 9 8\n3\n5 6 7', expected: '0' },
    { input: '3\n1 1 1\n2\n1 1', expected: '2' },
    { input: '4\n1 2 3 4\n2\n3 3', expected: '2' },
    { input: '2\n2 3\n2\n3 3', expected: '2' },
    { input: '3\n4 5 6\n3\n1 2 10', expected: '1' }
  ],
};