/**
 * Best Time to Buy and Sell Stock II - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of days
 *   Line 2: n space-separated integers representing the stock prices
 *
 * Output format (stdout):
 *   Print a single integer representing the maximum profit that can be achieved.
 */

module.exports = {
  id: 'best-time-to-buy-and-sell-stock-ii',
  conquestId: 'stage23-2',
  title: 'Best Time to Buy and Sell Stock II',
  difficulty: 'Easy',
  category: 'Arrays',
  tags: ['Array', 'Greedy', 'Dynamic Programming'],

  description: `
You are given an array **prices** where **prices[i]** is the price of a stock on day **i**.

You may complete **as many transactions as you like** (buy one and sell one share of the stock multiple times).

However, you must **sell the stock before buying again**.

Return the **maximum profit** you can achieve.

Key Idea:

Whenever the price increases from one day to the next, you can capture that profit.

If:

\`prices[i] > prices[i-1]\`

then profit +=

\`prices[i] - prices[i-1]\`

This greedy approach effectively captures every upward movement in price.

Time Complexity: **O(n)**  
Space Complexity: **O(1)**
`,

  examples: [
    {
      input: '6\n7 1 5 3 6 4',
      output: '7',
      explanation:
        'Buy at 1 → sell at 5 (profit 4), buy at 3 → sell at 6 (profit 3). Total profit = 7.'
    },
    {
      input: '5\n1 2 3 4 5',
      output: '4',
      explanation:
        'Buy at 1 and sell at 5 by capturing every increase.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    '0 ≤ prices[i] ≤ 10^4'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // TODO: Implement solution
        return 0;
    }
};

int main() {
    int n;
    cin >> n;

    vector<int> prices(n);
    for (int i = 0; i < n; i++)
        cin >> prices[i];

    Solution sol;
    cout << sol.maxProfit(prices);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public int maxProfit(int[] prices) {
            // TODO: Implement solution
            return 0;
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[] prices = new int[n];
        for (int i = 0; i < n; i++)
            prices[i] = sc.nextInt();

        Solution sol = new Solution();
        System.out.print(sol.maxProfit(prices));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '6\n7 1 5 3 6 4', expected: '7' },
    { input: '5\n1 2 3 4 5', expected: '4' },
    { input: '5\n7 6 4 3 1', expected: '0' },
    { input: '1\n5', expected: '0' },
    { input: '2\n1 10', expected: '9' },
    { input: '6\n1 2 1 2 1 2', expected: '3' },
    { input: '5\n5 5 5 5 5', expected: '0' },
    { input: '4\n3 2 6 5', expected: '4' },
    { input: '6\n2 1 2 0 1 2', expected: '3' },
    { input: '4\n1 3 2 8', expected: '8' }
  ],
};