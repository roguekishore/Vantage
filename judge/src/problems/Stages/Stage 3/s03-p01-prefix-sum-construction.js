/**
 * Prefix Sum Construction - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * n space-separated integers representing the prefix sum array.
 */

module.exports = {
  // ---- Identity ----
  id: 'prefix-sum-construction',
  conquestId: 'stage3-1',
  title: 'Prefix Sum Construction',
  difficulty: 'Easy',
  category: 'Prefix & Subarray Thinking',
  tags: ['Prefix Sum', 'Array', 'Basics'],

  // ---- Story Layer ----
  stageIntro: `With the Quidditch season behind you, the academic pressure at Hogwarts begins to mount. First-year final exams are looming, and the sheer volume of revision is daunting. Hermione, ever the diligent student, has developed a system to track study progress cumulatively throughout the term. She believes this is the key to avoiding last-minute cramming.`,
  storyBriefing: `Hermione shows you her revision planner, a list of chapters read each day. To see the total progress over time, she wants you to create a 'cumulative reading log'. For each day, calculate the total number of chapters read from the very first day up to the current day. This running total will help you both visualize your study momentum.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers. Your task is to construct and return its prefix sum array. A prefix sum array is one where each element at index i is the sum of all elements from the original array from index 0 up to and including index i.

The approach is to iterate through the array while maintaining a running total. The first element of the prefix sum array is the same as the first element of the original array. For each subsequent index i, the value is the sum of the element at index i in the original array and the prefix sum at index i-1.

Return an array of integers representing the computed prefix sums. The elements should be space-separated on a single line. Note that the sums can exceed the capacity of a standard 32-bit integer.`,
  examples: [
    {
      input: '5\n1 2 3 4 5',
      output: '1 3 6 10 15',
      explanation: 'The sums are: 1, 1+2=3, 3+3=6, 6+4=10, 10+5=15.'
    },
    {
      input: '4\n10 -2 5 1',
      output: '10 8 13 14',
      explanation: 'The sums are: 10, 10+(-2)=8, 8+5=13, 13+1=14.'
    },
    {
      input: '1\n-5',
      output: '-5',
      explanation: 'For a single element array, the prefix sum array is just the element itself.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '-10^9 <= arr[i] <= 10^9',
    'The prefix sums will fit within a 64-bit signed integer.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

vector<long long> solve(int n, const vector<int>& arr) {
    vector<long long> prefixSum(n);
    // Your code here
    
    return prefixSum;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    vector<long long> result = solve(n, arr);
    
    for (int i = 0; i < n; i++) {
        cout << result[i] << (i == n - 1 ? "" : " ");
    }
    cout << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static long[] solve(int n, int[] arr) {
        long[] prefixSum = new long[n];
        // Your code here
        
        return prefixSum;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        
        long[] result = solve(n, arr);
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(result[i]);
            if (i < n - 1) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '5\n1 2 3 4 5', expected: '1 3 6 10 15' },
    { input: '1\n100', expected: '100' },
    { input: '5\n-1 -2 -3 -4 -5', expected: '-1 -3 -6 -10 -15' },
    { input: '4\n0 0 0 0', expected: '0 0 0 0' },
    { input: '2\n-1000000000 1000000000', expected: '-1000000000 0' },
    { input: '2\n-5 5', expected: '-5 0' },
    { input: '2\n5 -5', expected: '5 0' },
    { input: '4\n1 10 100 1000', expected: '1 11 111 1111' },
    { input: '3\n-1 0 1', expected: '-1 -1 0' },
    { input: '5\n10 20 -30 5 10', expected: '10 30 0 5 15' }
  ],

  // ---- Solution ----
  solution: {
    approach: `To construct the prefix sum array, initialize the first element of the result array to be the same as the first element of the input array. Then, iterate from the second element to the end of the input array. For each element at index i, calculate the prefix sum by adding the current element (arr[i]) to the previously calculated prefix sum (prefixSum[i-1]). This creates a running total efficiently in a single pass.`,
    cpp: `if (n == 0) return {};
prefixSum[0] = arr[0];
for (int i = 1; i < n; ++i) {
    prefixSum[i] = prefixSum[i-1] + arr[i];
}
return prefixSum;`,
    java: `if (n == 0) return new long[0];
prefixSum[0] = arr[0];
for (int i = 1; i < n; i++) {
    prefixSum[i] = prefixSum[i-1] + arr[i];
}
return prefixSum;`
  }
};