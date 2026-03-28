/**
 * Two Sum - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array nums.
 * Line 2: n space-separated integers representing the array nums.
 * Line 3: An integer target.
 *
 * Output format (stdout):
 * Two space-separated integers representing the 0-based indices of the two 
 * numbers such that they add up to the target.
 */

module.exports = {
  // ---- Identity ----
  id: 'two-sum',
  conquestId: 'stage4-1',
  title: 'Two Sum',
  difficulty: 'Easy',
  category: 'Two Pointers',
  tags: ['Array', 'Hash Table'],

  // ---- Story Layer ----
  stageIntro: `After weeks of intense study, Professor Lupin announces a practical component for Defence Against the Dark Arts: a duelling club. The focus is on teamwork and paired exercises, teaching you to anticipate your partner's moves and combine spells effectively. This new chapter will test your ability to think cooperatively and efficiently under pressure, a skill crucial for any wizard.`,
  storyBriefing: `Professor Lupin begins the first lesson. He has assigned each student a number representing their magical energy signature. To create a perfectly balanced defensive charm, two students' energies must sum to a specific target value. He gives you the list of students' energy signatures and a target number. Your task is to find the exact pair of students who can cast the spell.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers 'nums' and a target integer. Your task is to find the indices of two numbers in the array such that they add up to the target. It is guaranteed that each input has exactly one solution, and you may not use the same element twice.

A highly efficient O(n) approach uses a hash map to achieve a single-pass solution. As you iterate through the array, for each element, calculate its 'complement' (target - current element). Check if this complement exists in the hash map. If it does, you have found the solution. If not, add the current element and its index to the map for future lookups.

Return the two 0-based indices as a pair of space-separated integers.`,
  examples: [
    {
      input: '4\n2 7 11 15\n9',
      output: '0 1',
      explanation: 'nums[0] + nums[1] equals 2 + 7 = 9. The indices are 0 and 1.'
    },
    {
      input: '3\n3 2 4\n6',
      output: '1 2',
      explanation: 'nums[1] + nums[2] equals 2 + 4 = 6. The indices are 1 and 2.'
    },
    {
      input: '2\n-3 5\n2',
      output: '0 1',
      explanation: 'nums[0] + nums[1] equals -3 + 5 = 2. The indices are 0 and 1.'
    }
  ],
  constraints: [
    '2 <= n <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Exactly one valid solution exists.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> solve(int n, vector<int>& nums, int target) {
    // Your code here
    return {};
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
    
    vector<int> result = solve(n, nums, target);
    if (result.size() == 2) {
        cout << result[0] << " " << result[1] << endl;
    }
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static int[] solve(int n, int[] nums, int target) {
        // Your code here
        return new int[0];
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        
        int[] result = solve(n, nums, target);
        if (result.length == 2) {
            System.out.println(result[0] + " " + result[1]);
        }
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '4\n2 7 11 15\n9', expected: '0 1' },
    { input: '3\n3 2 4\n6', expected: '1 2' },
    { input: '2\n3 3\n6', expected: '0 1' },
    { input: '4\n1 5 8 3\n11', expected: '2 3' },
    { input: '5\n-1 -5 10 15 2\n0', expected: '1 4' },
    { input: '2\n-10 20\n10', expected: '0 1' },
    { input: '4\n0 4 3 0\n0', expected: '0 3' },
    { input: '3\n-1 -2 -3\n-5', expected: '1 2' },
    { input: '2\n-1000000000 1000000000\n0', expected: '0 1' },
    { input: '10\n1 2 3 4 5 6 7 8 9 10\n19', expected: '8 9' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem can be solved in a single pass using a hash map. Iterate through the array. For each element 'num', calculate the 'complement' needed to reach the target (target - num). Check if the complement exists as a key in the hash map. If it does, you have found the pair, and you can return the current index and the index stored in the map. If the complement is not found, add the current number and its index to the map to be checked against future elements.`,
    cpp: `unordered_map<int, int> num_map;
for (int i = 0; i < n; ++i) {
    int complement = target - nums[i];
    if (num_map.count(complement)) {
        return {num_map[complement], i};
    }
    num_map[nums[i]] = i;
}
return {};`,
    java: `Map<Integer, Integer> numMap = new HashMap<>();
for (int i = 0; i < n; i++) {
    int complement = target - nums[i];
    if (numMap.containsKey(complement)) {
        return new int[] {numMap.get(complement), i};
    }
    numMap.put(nums[i], i);
}
return new int[0];`
  }
};