/**
 * 4Sum - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array nums.
 * Line 2: n space-separated integers representing the array nums.
 * Line 3: An integer target.
 *
 * Output format (stdout):
 * Each unique quadruplet that sums to target on a new line.
 * The numbers within each quadruplet should be sorted in non-decreasing order.
 * The quadruplets themselves should be sorted lexicographically.
 */

module.exports = {
  // ---- Identity ----
  id: '4sum',
  conquestId: 'stage4-3',
  title: '4Sum',
  difficulty: 'Medium',
  category: 'Two Pointers',
  tags: ['Array', 'Two Pointers', 'Sorting'],

  // ---- Story Layer ----
  storyBriefing: `The duelling practice intensifies into a team-based challenge. Professor Lupin now asks you to find all unique teams of four students whose combined magical energy signatures sum to a specific target value. This requires more complex coordination. Find all valid quadruplets to demonstrate your mastery of group dynamics.`,

  // ---- Technical Layer ----
  description: `You are given an array 'nums' of n integers and a target integer. Your task is to find all unique quadruplets [nums[a], nums[b], nums[c], nums[d]] from the array such that their sum equals the target. The indices a, b, c, and d must be distinct.

This problem is an extension of 3Sum and can be solved in O(n^3) time. First, sort the array. Then, use two nested loops to fix the first two numbers of the potential quadruplet. For each pair, use the two-pointer technique on the remaining part of the array to find the other two numbers that complete the sum. Diligent duplicate checking is required at all levels to ensure the uniqueness of the final quadruplets.

The output should be all unique quadruplets, one per line. Numbers within a quadruplet must be sorted, and the quadruplets themselves must be sorted lexicographically. If no such quadruplets exist, output nothing.`,
  examples: [
    {
      input: '6\n1 0 -1 0 -2 2\n0',
      output: '-2 -1 1 2\n-2 0 0 2\n-1 0 0 1',
      explanation: 'The three unique combinations of four numbers that sum to 0 are shown.'
    },
    {
      input: '5\n2 2 2 2 2\n8',
      output: '2 2 2 2',
      explanation: 'There is only one combination of four 2s that sums to 8.'
    },
    {
      input: '4\n-1 0 1 2\n2',
      output: '-1 0 1 2',
      explanation: 'The entire array is the only combination that sums to 2.'
    }
  ],
  constraints: [
    '1 <= n <= 200',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

vector<vector<int>> solve(int n, vector<int>& nums, int target) {
    vector<vector<int>> result;
    // Your code here
    
    return result;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;
    
    vector<vector<int>> result = solve(n, nums, target);
    for (const auto& quad : result) {
        for (int i = 0; i < 4; i++) {
            cout << quad[i] << (i == 3 ? "" : " ");
        }
        cout << "\\n";
    }
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static List<List<Integer>> solve(int n, int[] nums, int target) {
        List<List<Integer>> result = new ArrayList<>();
        // Your code here
        
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        
        List<List<Integer>> result = solve(n, nums, target);
        for (List<Integer> quad : result) {
            System.out.println(quad.get(0) + " " + quad.get(1) + " " + quad.get(2) + " " + quad.get(3));
        }
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '6\n1 0 -1 0 -2 2\n0', expected: '-2 -1 1 2\n-2 0 0 2\n-1 0 0 1' },
    { input: '5\n2 2 2 2 2\n8', expected: '2 2 2 2' },
    { input: '4\n1 1 1 1\n4', expected: '1 1 1 1' },
    { input: '4\n1 1 1 1\n3', expected: '' },
    { input: '4\n0 0 0 0\n0', expected: '0 0 0 0' },
    { input: '7\n-3 -1 0 2 4 5 6\n0', expected: '-3 -1 0 4' },
    { input: '4\n1 2 3 4\n10', expected: '1 2 3 4' },
    { input: '1\n1\n1', expected: '' },
    { input: '5\n-2 -1 0 1 2\n0', expected: '-2 -1 1 2' },
    { input: '8\n-2 -1 0 0 1 2 3 4\n3', expected: '-2 -1 2 4\n-2 0 1 4\n-2 0 2 3\n-1 0 0 4\n-1 0 1 3\n0 0 1 2' }
  ],

  // ---- Solution ----
  solution: {
    approach: `This problem extends the 3Sum approach. First, sort the input array. Use a nested loop to fix the first two numbers, 'a' and 'b'. For each pair of 'a' and 'b', use a two-pointer approach (left and right) on the remainder of the array to find a pair 'c' and 'd' such that a + b + c + d equals the target. To avoid duplicate quadruplets, skip identical elements for 'a', 'b', and also for 'c' and 'd' within the two-pointer loop after a valid quadruplet is found.`,
    cpp: `sort(nums.begin(), nums.end());
for (int i = 0; i < n - 3; ++i) {
    if (i > 0 && nums[i] == nums[i - 1]) continue;
    for (int j = i + 1; j < n - 2; ++j) {
        if (j > i + 1 && nums[j] == nums[j - 1]) continue;
        long long new_target = (long long)target - nums[i] - nums[j];
        int left = j + 1;
        int right = n - 1;
        while (left < right) {
            long long sum = (long long)nums[left] + nums[right];
            if (sum == new_target) {
                result.push_back({nums[i], nums[j], nums[left], nums[right]});
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;
                left++;
                right--;
            } else if (sum < new_target) {
                left++;
            } else {
                right--;
            }
        }
    }
}
return result;`,
    java: `Arrays.sort(nums);
for (int i = 0; i < n - 3; i++) {
    if (i > 0 && nums[i] == nums[i - 1]) continue;
    for (int j = i + 1; j < n - 2; j++) {
        if (j > i + 1 && nums[j] == nums[j - 1]) continue;
        long newTarget = (long)target - nums[i] - nums[j];
        int left = j + 1;
        int right = n - 1;
        while (left < right) {
            long sum = (long)nums[left] + nums[right];
            if (sum == newTarget) {
                result.add(Arrays.asList(nums[i], nums[j], nums[left], nums[right]));
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;
                left++;
                right--;
            } else if (sum < newTarget) {
                left++;
            } else {
                right--;
            }
        }
    }
}
return result;`
  }
};