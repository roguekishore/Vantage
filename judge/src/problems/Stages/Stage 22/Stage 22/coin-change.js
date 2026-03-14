/**
 * Coin Change — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Two integers n and amount representing the number of coin types and the target amount
 *   Line 2: n integers representing the coin denominations
 *
 * Output format (stdout):
 *   Print a single integer representing the minimum number of coins required to make the given amount.
 *   If it is not possible to form the amount using the given coins, print -1.
 */

module.exports = {
  id: 'coin-change',
  conquestId: 'stage22-3',
  title: 'Coin Change',
  difficulty: 'Medium',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Array', 'Unbounded Knapsack'],

  description: `
You are given an array **coins** representing different coin denominations and an integer **amount** representing a total amount of money.

Return the **minimum number of coins** required to make up that amount.

If the amount **cannot be formed** using the given coins, return **-1**.

You may assume that you have **unlimited supply of each coin**.

This is a classic **Dynamic Programming** problem similar to the **Unbounded Knapsack**.

Define:

- \`dp[i]\` = minimum number of coins needed to make amount **i**

Transition:

- For each coin:
  
  \`dp[i] = min(dp[i], dp[i - coin] + 1)\`

Initialize:
- \`dp[0] = 0\`
- All other values start as **infinity**.

The answer is \`dp[amount]\`.
`,

  examples: [
    {
      input: '3 11\n1 2 5',
      output: '3',
      explanation: '11 = 5 + 5 + 1, so the minimum number of coins is 3.'
    },
    {
      input: '1 3\n2',
      output: '-1',
      explanation: 'It is impossible to make amount 3 with only coin 2.'
    },
    {
      input: '3 0\n1 2 5',
      output: '0',
      explanation: 'No coins are needed to make amount 0.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 50',
    '1 ≤ coins[i] ≤ 10⁴',
    '0 ≤ amount ≤ 10⁴'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // TODO: Implement DP solution
        return 0;
    }
};

int main() {
    int n, amount;
    cin >> n >> amount;

    vector<int> coins(n);
    for (int i = 0; i < n; i++) {
        cin >> coins[i];
    }

    Solution sol;
    cout << sol.coinChange(coins, amount);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public int coinChange(int[] coins, int amount) {
            // TODO: Implement DP solution
            return 0;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int amount = sc.nextInt();

        int[] coins = new int[n];
        for (int i = 0; i < n; i++) {
            coins[i] = sc.nextInt();
        }

        Solution sol = new Solution();
        System.out.print(sol.coinChange(coins, amount));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '3 11\n1 2 5', expected: '3' },
    { input: '1 3\n2', expected: '-1' },
    { input: '3 0\n1 2 5', expected: '0' },
    { input: '2 7\n2 4', expected: '-1' },
    { input: '3 6\n1 3 4', expected: '2' },
    { input: '4 27\n1 5 10 25', expected: '3' },
    { input: '2 8\n3 5', expected: '2' },
    { input: '1 10\n10', expected: '1' },
    { input: '2 1\n2 3', expected: '-1' },
    { input: '5 63\n1 5 10 21 25', expected: '3' }
  ],
};