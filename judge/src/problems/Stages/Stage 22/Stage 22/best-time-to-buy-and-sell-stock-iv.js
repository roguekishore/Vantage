/**
 * Best Time to Buy and Sell Stock IV - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer k representing the maximum number of transactions
 *   Line 2: An integer n representing the number of days
 *   Line 3: n space-separated integers representing the stock prices on each day
 *
 * Output format (stdout):
 *   Print a single integer representing the maximum profit that can be achieved.
 */

module.exports = {
  id: 'best-time-to-buy-and-sell-stock-iv',
  conquestId: 'stage22-9',
  title: 'The Dragon Egg Trading Floor',
  difficulty: 'Hard',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Array', 'Stock Trading'],
  storyBriefing: `
You've gained access to the Gringotts Dragon Egg trading floor. You're given the daily prices of a rare dragon egg over a period of time. You are allowed to complete at most 'k' transactions (a transaction is one buy and one sell).

Your goal is to maximize your profit. Remember, you must sell an egg before you can buy another one. What is the maximum number of Galleons you can make?
`,
  description: `
You are given an integer **k** and an array **prices** where **prices[i]** is the price of a stock on day **i**.

You may complete **at most k transactions**.

A **transaction** consists of:
- Buying one stock
- Selling that stock later

Rules:
- You **must sell the stock before buying again**.
- You can complete **at most k transactions**.

Return the **maximum profit** you can achieve.

Dynamic Programming Idea:

Define:

- \`dp[t][i]\` = maximum profit using **at most t transactions up to day i**

Transition:

\`dp[t][i] = max(dp[t][i-1], prices[i] + maxDiff)\`

Where:

\`maxDiff = max(maxDiff, dp[t-1][i] - prices[i])\`

This reduces the time complexity to **O(k × n)**.
`,

  examples: [
    {
      input: '2\n6\n3 2 6 5 0 3',
      output: '7',
      explanation:
        'Buy at price 2 and sell at 6 (profit = 4), then buy at 0 and sell at 3 (profit = 3). Total profit = 7.'
    },
    {
      input: '2\n3\n2 4 1',
      output: '2',
      explanation:
        'Buy at 2 and sell at 4.'
    }
  ],

  constraints: [
    '0 ≤ k ≤ 100',
    '0 ≤ n ≤ 1000',
    '0 ≤ prices[i] ≤ 1000'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int maxProfit(int k, vector<int>& prices) {
        int n = prices.size();
        if (n <= 1 || k == 0) {
            return 0;
        }

        if (k >= n / 2) {
            int profit = 0;
            for (int i = 1; i < n; i++) {
                if (prices[i] > prices[i - 1]) {
                    profit += prices[i] - prices[i - 1];
                }
            }
            return profit;
        }

        vector<int> buy(k + 1, INT_MIN);
        vector<int> sell(k + 1, 0);

        for (int price : prices) {
            for (int i = 1; i <= k; i++) {
                buy[i] = max(buy[i], sell[i - 1] - price);
                sell[i] = max(sell[i], buy[i] + price);
            }
        }
        return sell[k];
    }
};

int main() {
    int k, n;
    cin >> k;
    cin >> n;

    vector<int> prices(n);
    for (int i = 0; i < n; i++)
        cin >> prices[i];

    Solution sol;
    cout << sol.maxProfit(k, prices);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Solution {
        public int maxProfit(int k, int[] prices) {
            int n = prices.length;
            if (n <= 1 || k == 0) {
                return 0;
            }

            if (k >= n / 2) {
                int profit = 0;
                for (int i = 1; i < n; i++) {
                    if (prices[i] > prices[i - 1]) {
                        profit += prices[i] - prices[i - 1];
                    }
                }
                return profit;
            }

            int[] buy = new int[k + 1];
            int[] sell = new int[k + 1];
            Arrays.fill(buy, Integer.MIN_VALUE);

            for (int price : prices) {
                for (int i = 1; i <= k; i++) {
                    buy[i] = Math.max(buy[i], sell[i - 1] - price);
                    sell[i] = Math.max(sell[i], buy[i] + price);
                }
            }
            return sell[k];
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int k = sc.nextInt();
        int n = sc.nextInt();

        int[] prices = new int[n];
        for (int i = 0; i < n; i++) {
            prices[i] = sc.nextInt();
        }

        Solution sol = new Solution();
        System.out.print(sol.maxProfit(k, prices));
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
    int maxProfit(int k, vector<int>& prices) {
        int n = prices.size();
        if (n <= 1 || k == 0) {
            return 0;
        }

        if (k >= n / 2) {
            int profit = 0;
            for (int i = 1; i < n; i++) {
                if (prices[i] > prices[i - 1]) {
                    profit += prices[i] - prices[i - 1];
                }
            }
            return profit;
        }

        vector<int> buy(k + 1, INT_MIN);
        vector<int> sell(k + 1, 0);

        for (int price : prices) {
            for (int i = 1; i <= k; i++) {
                buy[i] = max(buy[i], sell[i - 1] - price);
                sell[i] = max(sell[i], buy[i] + price);
            }
        }
        return sell[k];
    }
};

int main() {
    int k, n;
    cin >> k;
    cin >> n;

    vector<int> prices(n);
    for (int i = 0; i < n; i++)
        cin >> prices[i];

    Solution sol;
    cout << sol.maxProfit(k, prices);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Solution {
        public int maxProfit(int k, int[] prices) {
            int n = prices.length;
            if (n <= 1 || k == 0) {
                return 0;
            }

            if (k >= n / 2) {
                int profit = 0;
                for (int i = 1; i < n; i++) {
                    if (prices[i] > prices[i - 1]) {
                        profit += prices[i] - prices[i - 1];
                    }
                }
                return profit;
            }

            int[] buy = new int[k + 1];
            int[] sell = new int[k + 1];
            Arrays.fill(buy, Integer.MIN_VALUE);

            for (int price : prices) {
                for (int i = 1; i <= k; i++) {
                    buy[i] = Math.max(buy[i], sell[i - 1] - price);
                    sell[i] = Math.max(sell[i], buy[i] + price);
                }
            }
            return sell[k];
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int k = sc.nextInt();
        int n = sc.nextInt();

        int[] prices = new int[n];
        for (int i = 0; i < n; i++) {
            prices[i] = sc.nextInt();
        }

        Solution sol = new Solution();
        System.out.print(sol.maxProfit(k, prices));
    }
}`
  },

  testCases: [
    { input: '2\n6\n3 2 6 5 0 3', expected: '7' },
    { input: '2\n3\n2 4 1', expected: '2' },
    { input: '1\n5\n7 1 5 3 6', expected: '5' },
    { input: '3\n6\n1 2 3 4 5 6', expected: '5' },
    { input: '2\n5\n7 6 4 3 1', expected: '0' },
    { input: '3\n7\n3 3 5 0 0 3 1', expected: '5' },
    { input: '2\n4\n1 2 4 2', expected: '3' },
    { input: '4\n8\n1 3 2 8 4 9 2 5', expected: '15' },
    { input: '1\n1\n5', expected: '0' },
    { input: '5\n6\n2 4 1 7 5 3', expected: '8' }
  ],
};