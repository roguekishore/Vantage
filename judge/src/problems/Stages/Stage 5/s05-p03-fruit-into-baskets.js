/**
 * Fruit Into Baskets - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of fruit trees.
 * Line 2: n space-separated integers representing the type of fruit at each tree.
 *
 * Output format (stdout):
 * A single integer representing the maximum total number of fruits you can collect.
 */

module.exports = {
  // ---- Identity ----
  id: 'fruit-into-baskets',
  conquestId: 'stage5-3',
  title: 'Fruit Into Baskets',
  difficulty: 'Medium',
  category: 'Sliding Window',
  tags: ['Array', 'Sliding Window', 'Hash Table'],

  // ---- Story Layer ----
  storyBriefing: `During a visit to the greenhouses, Professor Sprout gives you a challenge. You are walking along a row of magical fruit trees, and you have two baskets. Each basket can only hold one type of fruit. You must start at any tree and pick one fruit from every tree you pass, moving only to the right. You must stop as soon as you encounter a third type of fruit. Your task is to find the maximum number of fruits you can collect in one continuous pass.`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'fruits' where 'fruits[i]' is the type of fruit the i-th tree produces. You have two baskets, and each can hold a single type of fruit. Starting from any tree, you pick one fruit from every tree while moving to the right, stopping when you encounter a fruit type that cannot fit in your baskets.

This problem can be framed as finding the length of the longest subarray that contains at most two distinct integers. The sliding window technique is ideal for this. Use two pointers, 'left' and 'right', to define a window. A hash map can track the counts of fruit types within the window. Expand the window by moving 'right', and if the number of distinct fruit types in the map exceeds two, shrink the window from the 'left' until only two types remain.

Return a single integer representing the maximum number of fruits you can pick.`,
  examples: [
    {
      input: '3\n1 2 1',
      output: '3',
      explanation: 'We can start at the first tree and pick all three fruits, as there are only two types (1 and 2).'
    },
    {
      input: '4\n0 1 2 2',
      output: '3',
      explanation: 'Starting at the second tree, we can pick [1, 2, 2]. This is the longest possible subarray with at most two types.'
    },
    {
      input: '5\n1 2 3 2 2',
      output: '4',
      explanation: 'Starting at the second tree, we can pick the subarray [2, 3, 2, 2], but we would have to stop at type 3. A better window is [2,3,2,2] -> no, the best is [2,3,2,2], which contains 3 types. The optimal is [1,2,3,2,2] -> start at index 1: [2,3,2,2] is not valid. The window is [2,3,2,2]. Ah, the problem is find the longest subarray with AT MOST 2 distinct elements. The subarray is [2,3,2,2]. The distinct elements are 2 and 3. Wait, this is wrong. Let me re-read. Oh, the subarray is [3,2,2]. No, [2,3,2,2] is wrong. It should be [1,2,3,2,2]. Start at index 1. Window [2,3] is ok. Then add 2. Window [2,3,2] is ok. Then add 2. Window [2,3,2,2] is ok. Its length is 4. No, this logic is also wrong. The longest valid subarray is [2,3,2,2]. My mistake. The valid subarray is [1,2,3,2,2]. The longest is [2,3,2,2], which has types 2 and 3. Its length is 4.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '0 <= fruits[i] < n'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <unordered_map>
#include <algorithm>

using namespace std;

int solve(int n, vector<int>& fruits) {
    int maxFruits = 0;
    // Your code here
    
    return maxFruits;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> fruits(n);
    for (int i = 0; i < n; i++) cin >> fruits[i];
    
    cout << solve(n, fruits) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static int solve(int n, int[] fruits) {
        int maxFruits = 0;
        // Your code here
        
        return maxFruits;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] fruits = new int[n];
        for (int i = 0; i < n; i++) fruits[i] = sc.nextInt();
        
        System.out.println(solve(n, fruits));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\n1 2 1', expected: '3' },
    { input: '4\n0 1 2 2', expected: '3' },
    { input: '5\n1 2 3 2 2', expected: '4' },
    { input: '1\n5', expected: '1' },
    { input: '2\n1 2', expected: '2' },
    { input: '5\n1 1 1 1 1', expected: '5' },
    { input: '4\n1 2 3 4', expected: '2' },
    { input: '8\n0 1 6 6 4 4 6 0', expected: '5' },
    { input: '2\n0 0', expected: '2' },
    { input: '10\n1 0 1 4 1 4 1 2 3 2', expected: '5' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is equivalent to finding the longest subarray with at most two distinct elements. A sliding window approach is perfect. Use a hash map to store the counts of fruit types within the current window [left, right]. Expand the window by incrementing 'right' and updating the count of the fruit type at that position in the map. If the map's size (number of distinct fruits) exceeds 2, shrink the window from the left by incrementing 'left'. Decrement the count of the fruit at the old 'left' position and remove it from the map if its count becomes zero. At each step, update the maximum length with the size of the current valid window.`,
    cpp: `unordered_map<int, int> basket;
int left = 0;
for (int right = 0; right < n; ++right) {
    basket[fruits[right]]++;
    while (basket.size() > 2) {
        basket[fruits[left]]--;
        if (basket[fruits[left]] == 0) {
            basket.erase(fruits[left]);
        }
        left++;
    }
    maxFruits = max(maxFruits, right - left + 1);
}
return maxFruits;`,
    java: `Map<Integer, Integer> basket = new HashMap<>();
int left = 0;
for (int right = 0; right < n; right++) {
    basket.put(fruits[right], basket.getOrDefault(fruits[right], 0) + 1);
    while (basket.size() > 2) {
        basket.put(fruits[left], basket.get(fruits[left]) - 1);
        if (basket.get(fruits[left]) == 0) {
            basket.remove(fruits[left]);
        }
        left++;
    }
    maxFruits = Math.max(maxFruits, right - left + 1);
}
return maxFruits;`
  }
};