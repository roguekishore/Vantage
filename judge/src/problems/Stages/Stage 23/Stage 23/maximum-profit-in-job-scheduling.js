/**
 * Maximum Profit in Job Scheduling - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer n representing the number of jobs
 *   Line 2: n space-separated integers representing the start times
 *   Line 3: n space-separated integers representing the end times
 *   Line 4: n space-separated integers representing the profits
 *
 * Output format (stdout):
 *   Print a single integer representing the maximum profit achievable without overlapping jobs.
 */

module.exports = {
  id: 'maximum-profit-in-job-scheduling',
  conquestId: 'stage23-5',
  title: 'Maximum Profit in Job Scheduling',
  difficulty: 'Hard',
  category: 'Dynamic Programming',
  tags: ['Dynamic Programming', 'Binary Search', 'Sorting', 'Greedy'],

  description: `
You are given **n jobs**, where every job has:

- **startTime[i]** - start time of the job
- **endTime[i]** - end time of the job
- **profit[i]** - profit earned if the job is completed

Your goal is to select a subset of **non-overlapping jobs** that **maximizes the total profit**.

Two jobs are **compatible** if the start time of the next job is **greater than or equal to** the end time of the previous job.

Approach:

1. Combine jobs into tuples: **(start, end, profit)**.
2. **Sort jobs by start time**.
3. Use **Dynamic Programming + Binary Search**.
4. For each job, decide:
   - **Take the job** → profit + next compatible job
   - **Skip the job**

DP Transition:

\`dp[i] = max(profit[i] + dp[nextIndex], dp[i+1])\`

Where **nextIndex** is found using **binary search** to locate the next job whose start time ≥ current end time.

Time Complexity: **O(n log n)**  
Space Complexity: **O(n)**
`,

  examples: [
    {
      input: '4\n1 2 3 3\n3 4 5 6\n50 10 40 70',
      output: '120',
      explanation:
        'Choose jobs (1→3, profit 50) and (3→6, profit 70). Total = 120.'
    },
    {
      input: '3\n1 2 3\n3 4 5\n50 10 40',
      output: '90',
      explanation:
        'Choose job1 and job3.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 5 * 10^4',
    '1 ≤ startTime[i] < endTime[i] ≤ 10^9',
    '1 ≤ profit[i] ≤ 10^4'
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int jobScheduling(vector<int>& startTime, vector<int>& endTime, vector<int>& profit) {
        // TODO: Implement DP + Binary Search solution
        return 0;
    }
};

int main() {
    int n;
    cin >> n;

    vector<int> startTime(n), endTime(n), profit(n);

    for (int i = 0; i < n; i++) cin >> startTime[i];
    for (int i = 0; i < n; i++) cin >> endTime[i];
    for (int i = 0; i < n; i++) cin >> profit[i];

    Solution sol;
    cout << sol.jobScheduling(startTime, endTime, profit);

    return 0;
}`,

    java: `import java.util.*;

public class Main {

    static class Solution {
        public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
            // TODO: Implement DP + Binary Search solution
            return 0;
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[] startTime = new int[n];
        int[] endTime = new int[n];
        int[] profit = new int[n];

        for (int i = 0; i < n; i++) startTime[i] = sc.nextInt();
        for (int i = 0; i < n; i++) endTime[i] = sc.nextInt();
        for (int i = 0; i < n; i++) profit[i] = sc.nextInt();

        Solution sol = new Solution();
        System.out.print(sol.jobScheduling(startTime, endTime, profit));

        sc.close();
    }
}`
  },

  testCases: [
    { input: '4\n1 2 3 3\n3 4 5 6\n50 10 40 70', expected: '120' },
    { input: '3\n1 2 3\n3 4 5\n50 10 40', expected: '90' },
    { input: '3\n1 1 1\n2 3 4\n5 6 4', expected: '6' },
    { input: '5\n1 2 3 4 6\n3 5 10 6 9\n20 20 100 70 60', expected: '150' },
    { input: '2\n1 2\n2 3\n50 10', expected: '60' },
    { input: '4\n1 3 6 2\n2 5 19 100\n50 20 100 200', expected: '250' },
    { input: '1\n1\n2\n5', expected: '5' },
    { input: '3\n1 2 3\n4 5 6\n10 20 30', expected: '60' },
    { input: '3\n1 2 3\n2 3 4\n10 20 30', expected: '40' },
    { input: '4\n4 2 4 8\n5 5 5 10\n1 2 8 10', expected: '18' }
  ],
};