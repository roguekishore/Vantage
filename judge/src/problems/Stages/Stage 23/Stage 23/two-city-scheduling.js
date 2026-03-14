/**
 * Two City Scheduling — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of people (always even)
 *   Next n lines: Each line contains two integers a and b
 *                 where a = cost to fly to city A
 *                 and b = cost to fly to city B
 *
 * Output format (stdout):
 *   Print a single integer representing the minimum total cost to send exactly n/2 people to each city.
 */

module.exports = {
  id: 'two-city-scheduling',
  conquestId: 'stage21-4',
  title: 'Two City Scheduling',
  difficulty: 'Medium',
  category: 'Greedy',
  tags: ['Greedy', 'Sorting', 'Array'],

  description: `
There are **2n people** planning to fly to **two cities: A and B**.

The cost of flying the **iᵗʰ person** to city A is **costs[i][0]**  
The cost of flying the **iᵗʰ person** to city B is **costs[i][1]**

Return the **minimum cost** to fly every person to a city such that:

- Exactly **n people go to city A**
- Exactly **n people go to city B**

Greedy Idea:

Compute the **cost difference** between sending a person to city A vs city B:

\`diff = costA - costB\`

1. Sort people based on this difference.
2. Send the **first n people to city A**
3. Send the **remaining n people to city B**

This guarantees the minimum total cost.

Time Complexity: **O(n log n)**  
Space Complexity: **O(1)** (excluding sorting)
`,

  examples: [
    {
      input: '4\n10 20\n30 200\n400 50\n30 20',
      output: '110',
      explanation:
        'Send person1 and person2 to city A, and person3 and person4 to city B for minimum cost.'
    },
    {
      input: '2\n10 100\n20 30',
      output: '40',
      explanation:
        'Send first person to city A (10) and second to city B (30).'
    }
  ],

  constraints: [
    '2 ≤ n ≤ 100',
    'n is even',
    '1 ≤ costA, costB ≤ 1000'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int twoCitySchedCost(vector<vector<int>>& costs) {
        // TODO: Implement greedy solution
        return 0;
    }
};

int main() {
    int n;
    cin >> n;

    vector<vector<int>> costs(n, vector<int>(2));

    for (int i = 0; i < n; i++) {
        cin >> costs[i][0] >> costs[i][1];
    }

    Solution sol;
    cout << sol.twoCitySchedCost(costs);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public int twoCitySchedCost(int[][] costs) {
            // TODO: Implement greedy solution
            return 0;
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[][] costs = new int[n][2];

        for (int i = 0; i < n; i++) {
            costs[i][0] = sc.nextInt();
            costs[i][1] = sc.nextInt();
        }

        Solution sol = new Solution();
        System.out.print(sol.twoCitySchedCost(costs));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '4\n10 20\n30 200\n400 50\n30 20', expected: '110' },
    { input: '2\n10 100\n20 30', expected: '40' },
    { input: '4\n10 100\n20 50\n30 60\n40 30', expected: '110' },
    { input: '4\n100 10\n90 20\n80 30\n70 40', expected: '100' },
    { input: '6\n10 20\n30 200\n400 50\n30 20\n50 50\n60 10', expected: '170' },
    { input: '2\n50 60\n70 80', expected: '130' },
    { input: '4\n5 100\n6 90\n7 80\n8 70', expected: '168' },
    { input: '4\n20 30\n40 50\n60 70\n80 90', expected: '200' },
    { input: '2\n5 5\n5 5', expected: '10' },
    { input: '4\n1000 1\n1 1000\n500 500\n400 600', expected: '902' }
  ],
};