/**
 * 3Sum - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array nums.
 * Line 2: n space-separated integers representing the array nums.
 *
 * Output format (stdout):
 * Each unique triplet that sums to zero on a new line. 
 * The numbers within each triplet should be sorted in non-decreasing order.
 * The triplets themselves should be sorted lexicographically.
 */

module.exports = {
  // ---- Identity ----
  id: '3sum',
  conquestId: 'stage4-2',
  title: '3Sum',
  difficulty: 'Medium',
  category: 'Two Pointers',
  tags: ['Array', 'Two Pointers', 'Sorting'],

  // ---- Story Layer ----
  storyBriefing: `The duelling exercise evolves. Professor Lupin now wants you to form groups of three. This time, the goal is to find all unique combinations of three students whose energy signatures perfectly balance each other out, summing to zero. Draco Malfoy scoffs, claiming it's impossible. It's up to you to prove him wrong by finding every valid trio.`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'nums' of size n. Your task is to find all unique triplets [nums[i], nums[j], nums[k]] such that i, j, and k are distinct indices and their corresponding values sum to zero. The solution set must not contain duplicate triplets.

An efficient O(n^2) approach is required. First, sort the input array. Then, iterate through the array with a primary loop, fixing one element at a time. For each fixed element, use the two-pointer technique on the rest of the array to find pairs that sum to the negative of the fixed element. Careful handling of duplicates is essential to ensure the uniqueness of the resulting triplets.

The output should consist of each unique triplet on a new line. The numbers within each triplet must be sorted, and the triplets themselves should be sorted lexicographically. If no such triplets exist, output nothing.`,
  examples: [
    {
      input: '6\n-1 0 1 2 -1 -4',
      output: '-1 -1 2\n-1 0 1',
      explanation: 'After sorting, the array is [-4, -1, -1, 0, 1, 2]. The triplets that sum to zero are (-1, -1, 2) and (-1, 0, 1).'
    },
    {
      input: '3\n0 1 1',
      output: '',
      explanation: 'No combination of three numbers sums to zero.'
    },
    {
      input: '3\n0 0 0',
      output: '0 0 0',
      explanation: 'The only triplet is [0, 0, 0], which sums to zero.'
    }
  ],
  constraints: [
    '3 <= n <= 3000',
    '-10^5 <= nums[i] <= 10^5'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

vector<vector<int>> solve(int n, vector<int>& nums) {
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
    
    vector<vector<int>> result = solve(n, nums);
    for (const auto& triplet : result) {
        cout << triplet[0] << " " << triplet[1] << " " << triplet[2] << "\\n";
    }
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static List<List<Integer>> solve(int n, int[] nums) {
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
        
        List<List<Integer>> result = solve(n, nums);
        for (List<Integer> triplet : result) {
            System.out.println(triplet.get(0) + " " + triplet.get(1) + " " + triplet.get(2));
        }
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '6\n-1 0 1 2 -1 -4', expected: '-1 -1 2\n-1 0 1' },
    { input: '3\n0 0 0', expected: '0 0 0' },
    { input: '3\n-1 0 1', expected: '-1 0 1' },
    { input: '3\n1 2 3', expected: '' },
    { input: '5\n-2 0 1 1 2', expected: '-2 0 2\n-2 1 1' },
    { input: '5\n0 0 0 0 0', expected: '0 0 0' },
    { input: '4\n1 2 -2 -1', expected: '-2 1 1\n-1 -1 2' },
    { input: '3\n-5 1 4', expected: '-5 1 4' },
    { input: '4\n-1 -1 2 0', expected: '-1 -1 2' },
    { input: '7\n-1 0 1 2 -1 -4 -1', expected: '-1 -1 2\n-1 0 1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `To solve 3Sum efficiently and handle duplicates, first sort the array. Then, iterate through the array with a for-loop, fixing one number 'a'. For each 'a', use two pointers, 'left' and 'right', to scan the rest of the array for two numbers 'b' and 'c' such that a + b + c = 0. To avoid duplicate triplets, skip over any identical elements for 'a'. Similarly, inside the two-pointer loop, after finding a valid triplet, increment the 'left' pointer and decrement the 'right' pointer while they are pointing to duplicate values to ensure each found triplet is unique.`,
    cpp: `sort(nums.begin(), nums.end());
for (int i = 0; i < n - 2; ++i) {
    if (i > 0 && nums[i] == nums[i - 1]) continue;
    int left = i + 1;
    int right = n - 1;
    int target = -nums[i];
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) {
            result.push_back({nums[i], nums[left], nums[right]});
            while (left < right && nums[left] == nums[left + 1]) left++;
            while (left < right && nums[right] == nums[right - 1]) right--;
            left++;
            right--;
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
}
return result;`,
    java: `Arrays.sort(nums);
for (int i = 0; i < n - 2; i++) {
    if (i > 0 && nums[i] == nums[i - 1]) continue;
    int left = i + 1;
    int right = n - 1;
    int target = -nums[i];
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) {
            result.add(Arrays.asList(nums[i], nums[left], nums[right]));
            while (left < right && nums[left] == nums[left + 1]) left++;
            while (left < right && nums[right] == nums[right - 1]) right--;
            left++;
            right--;
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
}
return result;`
  }
};