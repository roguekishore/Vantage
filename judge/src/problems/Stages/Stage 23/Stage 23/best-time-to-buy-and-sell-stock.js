/**
 * Best Time to Buy and Sell Stock - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of days
 *   Line 2: n space-separated integers representing the stock prices
 *
 * Output format (stdout):
 *   Print a single integer representing the maximum profit that can be achieved.
 */

module.exports = {
  id: 'best-time-to-buy-and-sell-stock',
  conquestId: 'stage23-1',
  title: 'Best Time to Buy and Sell Stock',
  difficulty: 'Easy',
  category: 'Arrays',
  tags: ['Array', 'Greedy', 'Dynamic Programming'],

  description: `
You are given an array **prices** where **prices[i]** is the price of a given stock on day **i**.

You want to **maximize your profit by choosing a single day to buy one stock and choosing a different future day to sell that stock**.

Return the **maximum profit** you can achieve from this transaction.

If you cannot achieve any profit, return **0**.

Key Idea:

Track the **minimum price seen so far**, and compute the profit if selling on the current day.

\`profit = prices[i] - minPrice\`

Update the maximum profit during the iteration.

Time Complexity: **O(n)**  
Space Complexity: **O(1)**
`,

  examples: [
    {
      input: '6\n7 1 5 3 6 4',
      output: '5',
      explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6). Profit = 5.'
    },
    {
      input: '5\n7 6 4 3 1',
      output: '0',
      explanation: 'Prices always decrease, so no profit can be made.'
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
    { input: '6\n7 1 5 3 6 4', expected: '5' },
    { input: '5\n7 6 4 3 1', expected: '0' },
    { input: '1\n5', expected: '0' },
    { input: '2\n1 10', expected: '9' },
    { input: '5\n2 4 1 7 5', expected: '6' },
    { input: '6\n3 2 6 5 0 3', expected: '4' },
    { input: '5\n5 5 5 5 5', expected: '0' },
    { input: '4\n1 2 3 4', expected: '3' },
    { input: '4\n4 3 2 1', expected: '0' },
    { input: '6\n2 1 2 1 0 1', expected: '1' }
  ],
};