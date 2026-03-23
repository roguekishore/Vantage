/**
 * Gas Station - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of gas stations
 *   Line 2: n space-separated integers representing the gas available at each station
 *   Line 3: n space-separated integers representing the cost to travel to the next station
 *
 * Output format (stdout):
 *   Print a single integer representing the starting gas station index
 *   from which you can travel around the circuit once in the clockwise direction.
 *   If it is not possible, print -1.
 */

module.exports = {
  id: 'gas-station',
  conquestId: 'stage23-8',
  title: 'Gas Station',
  difficulty: 'Medium',
  category: 'Greedy',
  tags: ['Array', 'Greedy'],

  description: `
There are **n gas stations** along a circular route.

You are given two integer arrays:

- **gas[i]** - the amount of gas available at station *i*
- **cost[i]** - the gas needed to travel from station *i* to station *(i + 1)*

You have a car with an **unlimited gas tank**, but you start with **0 gas**.

Return the **starting gas station index** if you can travel around the circuit once in the clockwise direction.  
Otherwise, return **-1**.

If a solution exists, it is guaranteed to be **unique**.

Greedy Insight:

1. If the **total gas < total cost**, completing the circuit is impossible.
2. Traverse the stations while maintaining a **current tank**.
3. If the tank becomes negative, reset the start position to the **next station**.

Time Complexity: **O(n)**  
Space Complexity: **O(1)**
`,

  examples: [
    {
      input: '5\n1 2 3 4 5\n3 4 5 1 2',
      output: '3',
      explanation: 'Start at station 3 → complete the circuit successfully.'
    },
    {
      input: '3\n2 3 4\n3 4 3',
      output: '-1',
      explanation: 'Total gas is less than total cost, so the trip is impossible.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 10^5',
    '0 ≤ gas[i], cost[i] ≤ 10^4'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
        // TODO: Implement greedy solution
        return 0;
    }
};

int main() {
    int n;
    cin >> n;

    vector<int> gas(n), cost(n);

    for (int i = 0; i < n; i++)
        cin >> gas[i];

    for (int i = 0; i < n; i++)
        cin >> cost[i];

    Solution sol;
    cout << sol.canCompleteCircuit(gas, cost);

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static class Solution {
        public int canCompleteCircuit(int[] gas, int[] cost) {
            // TODO: Implement greedy solution
            return 0;
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[] gas = new int[n];
        int[] cost = new int[n];

        for (int i = 0; i < n; i++)
            gas[i] = sc.nextInt();

        for (int i = 0; i < n; i++)
            cost[i] = sc.nextInt();

        Solution sol = new Solution();
        System.out.print(sol.canCompleteCircuit(gas, cost));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '5\n1 2 3 4 5\n3 4 5 1 2', expected: '3' },
    { input: '3\n2 3 4\n3 4 3', expected: '-1' },
    { input: '4\n5 1 2 3\n4 4 1 5', expected: '0' },
    { input: '1\n5\n4', expected: '0' },
    { input: '2\n2 2\n2 2', expected: '0' },
    { input: '4\n1 1 1 10\n2 2 2 2', expected: '3' },
    { input: '3\n3 3 4\n3 4 4', expected: '-1' },
    { input: '5\n2 3 4 5 1\n3 4 5 1 2', expected: '3' },
    { input: '3\n5 1 2\n4 4 1', expected: '2' },
    { input: '4\n4 6 7 4\n6 5 3 5', expected: '1' }
  ],
};