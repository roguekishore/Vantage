/**
 * 0/1 Knapsack — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and W representing the number of items and the knapsack capacity
 *   Line 2: n integers representing the weights of the items
 *   Line 3: n integers representing the values of the items
 *
 * Output format (stdout):
 *   Print a single integer representing the maximum value that can be obtained
 *   without exceeding the knapsack capacity.
 */

module.exports = {
  id: 'zero-one-knapsack',
  conquestId: 'stage22-2',
  title: '0/1 Knapsack',
  difficulty: 'Medium',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Knapsack', 'Optimization'],

  description: `
You are given **n items**, each with a **weight** and a **value**, and a knapsack with capacity **W**.

Your goal is to determine the **maximum total value** that can be obtained by selecting items to place in the knapsack.

Rules:
- Each item can be **either taken or not taken** (0/1 choice).
- The **total weight must not exceed W**.
- You **cannot take fractional items**.

This is the classic **0/1 Knapsack Problem**, commonly solved using **dynamic programming**.

Let:

- \`dp[i][w]\` represent the **maximum value using the first i items with capacity w**.

Transition:

- If the item is **not taken**:
  
  \`dp[i][w] = dp[i-1][w]\`

- If the item **is taken**:

  \`dp[i][w] = value[i] + dp[i-1][w - weight[i]]\`

Take the **maximum** of both choices.
`,

  examples: [
    {
      input: '3 50\n10 20 30\n60 100 120',
      output: '220',
      explanation: 'Take items with weights 20 and 30 giving value 100 + 120 = 220.'
    },
    {
      input: '3 5\n1 2 3\n6 10 12',
      output: '22',
      explanation: 'Take items with weights 2 and 3 for total value 22.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 100',
    '1 ≤ W ≤ 1000',
    '1 ≤ weight[i] ≤ 100',
    '1 ≤ value[i] ≤ 1000'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int knapsack(int n, int W, vector<int>& wt, vector<int>& val) {
        // TODO: Implement DP solution
        return 0;
    }
};

int main() {
    int n, W;
    cin >> n >> W;

    vector<int> wt(n), val(n);

    for (int i = 0; i < n; i++)
        cin >> wt[i];

    for (int i = 0; i < n; i++)
        cin >> val[i];

    Solution sol;
    cout << sol.knapsack(n, W, wt, val);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {

        public int knapsack(int n, int W, int[] wt, int[] val) {
            // TODO: Implement DP solution
            return 0;
        }

    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int W = sc.nextInt();

        int[] wt = new int[n];
        int[] val = new int[n];

        for (int i = 0; i < n; i++)
            wt[i] = sc.nextInt();

        for (int i = 0; i < n; i++)
            val[i] = sc.nextInt();

        Solution sol = new Solution();
        System.out.print(sol.knapsack(n, W, wt, val));

        sc.close();
    }
}`
  },

  testCases: [
    {
      input: '3 50\n10 20 30\n60 100 120',
      expected: '220'
    },
    {
      input: '3 5\n1 2 3\n6 10 12',
      expected: '22'
    },
    {
      input: '4 7\n1 3 4 5\n1 4 5 7',
      expected: '9'
    },
    {
      input: '1 10\n5\n10',
      expected: '10'
    },
    {
      input: '1 4\n5\n10',
      expected: '0'
    },
    {
      input: '5 10\n2 3 4 5 9\n3 4 5 8 10',
      expected: '15'
    },
    {
      input: '4 8\n2 3 5 6\n6 8 12 13',
      expected: '20'
    },
    {
      input: '3 4\n4 5 1\n1 2 3',
      expected: '3'
    },
    {
      input: '5 12\n3 4 6 5 7\n2 3 1 4 6',
      expected: '10'
    },
    {
      input: '3 3\n4 5 6\n1 2 3',
      expected: '0'
    }
  ],
};