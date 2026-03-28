/**
 * Subarray Sum Equals K - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers representing the array nums.
 * Line 3: An integer k, the target sum.
 *
 * Output format (stdout):
 * A single integer representing the total number of subarrays whose sum equals to k.
 */

module.exports = {
  // ---- Identity ----
  id: 'subarray-sum-equals-k',
  conquestId: 'stage3-5',
  title: 'Subarray Sum Equals K',
  difficulty: 'Medium',
  category: 'Prefix & Subarray Thinking',
  tags: ['Array', 'Hash Table', 'Prefix Sum'],

  // ---- Story Layer ----
  storyBriefing: `Professor Flitwick has set a challenge in Charms class. He gives you a sequence of magical energy readings from a practice duel and a target energy level, 'k'. You need to find out how many contiguous segments of the duel had a total energy output that exactly matches 'k'. Succeed, and you'll earn valuable house points.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers 'nums' and a target integer 'k'. Your task is to find the total number of contiguous subarrays whose elements sum up to exactly k.

A highly efficient O(n) approach for this problem involves using a hash map to store the frequencies of cumulative prefix sums encountered so far. As you iterate through the array and calculate the current prefix sum, you check if 'prefix_sum - k' already exists in the hash map. If it does, the count of that existing sum is added to your total, as it signifies a subarray ending at the current position with the desired sum.

Return a single integer representing the total count of subarrays that sum to k.`,
  examples: [
    {
      input: '3\n1 1 1\n2',
      output: '2',
      explanation: 'The subarrays are [1, 1] (indices 0-1) and [1, 1] (indices 1-2). Both sum to 2. The total count is 2.'
    },
    {
      input: '3\n1 2 3\n3',
      output: '2',
      explanation: 'The subarrays are [1, 2] and [3]. Both sum to 3. The total count is 2.'
    },
    {
      input: '5\n1 -1 1 -1 1\n0',
      output: '6',
      explanation: 'The subarrays summing to 0 are [1, -1], [1, -1, 1, -1], [-1, 1], [-1, 1, -1, 1], [1, -1], [1, -1, 1, -1, 1]. Total is 6.'
    }
  ],
  constraints: [
    '1 <= n <= 2 * 10^4',
    '-1000 <= nums[i] <= 1000',
    '-10^7 <= k <= 10^7'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int solve(int n, vector<int>& nums, int k) {
    int count = 0;
    // Your code here
    
    return count;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int k;
    cin >> k;
    
    cout << solve(n, nums, k) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static int solve(int n, int[] nums, int k) {
        int count = 0;
        // Your code here
        
        return count;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();
        
        System.out.println(solve(n, nums, k));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\n1 1 1\n2', expected: '2' },
    { input: '3\n1 2 3\n3', expected: '2' },
    { input: '1\n1\n0', expected: '0' },
    { input: '1\n5\n5', expected: '1' },
    { input: '4\n0 0 0 0\n0', expected: '10' },
    { input: '5\n1 -1 1 -1 1\n0', expected: '6' },
    { input: '2\n-1 -1\n-2', expected: '1' },
    { input: '2\n1 1\n1', expected: '2' },
    { input: '5\n1 1 1 1 1\n3', expected: '3' },
    { input: '10\n-1 -1 2 -1 -1 2 -1 -1 2 0\n0', expected: '13' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is solved in O(n) time using a hash map to store prefix sum frequencies. Initialize a map with a prefix sum of 0 having a count of 1 to handle subarrays that start from index 0. Iterate through the array, maintaining a running 'currentSum'. For each element, add its value to 'currentSum'. Before storing the new 'currentSum' in the map, check if 'currentSum - k' exists as a key. If it does, it means there are subarrays ending at the current position with a sum of 'k', so add the frequency of 'currentSum - k' to the total count. Finally, update the frequency of the 'currentSum' in the map.`,
    cpp: `unordered_map<int, int> prefixSumFreq;
prefixSumFreq[0] = 1;
int currentSum = 0;
for (int i = 0; i < n; ++i) {
    currentSum += nums[i];
    if (prefixSumFreq.count(currentSum - k)) {
        count += prefixSumFreq[currentSum - k];
    }
    prefixSumFreq[currentSum]++;
}
return count;`,
    java: `Map<Integer, Integer> prefixSumFreq = new HashMap<>();
prefixSumFreq.put(0, 1);
int currentSum = 0;
for (int i = 0; i < n; i++) {
    currentSum += nums[i];
    if (prefixSumFreq.containsKey(currentSum - k)) {
        count += prefixSumFreq.get(currentSum - k);
    }
    prefixSumFreq.put(currentSum, prefixSumFreq.getOrDefault(currentSum, 0) + 1);
}
return count;`
  }
};