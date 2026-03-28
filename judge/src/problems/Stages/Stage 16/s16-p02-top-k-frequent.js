/**
 * Top K Frequent Elements - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n (number of elements) and k (the number of top frequent elements to find).
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * k space-separated integers (the most frequent elements), in any order.
 */

module.exports = {
  id: 'top-k-frequent',
  conquestId: 'stage16-2',
  title: 'Top K Frequent Elements',
  difficulty: 'Medium',
  category: 'Heaps & Priority Queues',
  tags: ['Heap', 'Priority Queue', 'Hash Map', 'Bucket Sort'],

  storyBriefing: `The tournament judges are impressed with your organizational skills. "Now for a real task," says Barty Crouch Sr. "We have records of all the spells cast during the champions' training sessions. We need to know the 'k' most frequently cast spells to check for any use of forbidden magic. Manually counting is too slow. A priority queue would be perfect for keeping track of the top 'k' spells as you go through the list."`,

  description: `You are given an array of integers 'nums' and an integer 'k'. Your task is to return the 'k' most frequent elements from the array. The order of the returned elements does not matter.

This problem requires you to first count the occurrences of each number and then find the 'k' numbers with the highest counts. A common approach combines a hash map and a min-heap. First, populate the hash map with the frequency of each number. Then, iterate through the map and add elements to a min-heap of size 'k', which is ordered by frequency. If the heap's size exceeds 'k', remove the element with the smallest frequency.

Return an array containing the 'k' most frequent elements. Your solution's time complexity should be better than O(n log n).`,

  examples: [
    {
      input: '6 2\n1 1 1 2 2 3',
      output: '1 2',
      explanation: 'The number 1 appears 3 times, 2 appears 2 times, and 3 appears once. The two most frequent elements are 1 and 2.'
    },
    {
      input: '1 1\n1',
      output: '1',
      explanation: 'With only one element in the array, it is by definition the most frequent.'
    },
    {
      input: '5 1\n4 1 -1 2 -1',
      output: '-1',
      explanation: 'The number -1 appears twice, while all other numbers appear once. The single most frequent element is -1.'
    }
  ],

  constraints: [
    'The length of the array is between 1 and 100000.',
    'k is between 1 and the number of unique elements in the array.',
    'It is guaranteed that the answer is unique.'
  ],

  boilerplate: {
    cpp: `std::vector<int> solve(std::vector<int>& nums, int k) {
    // Your code here
    return {};
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n, k;
    std::cin >> n >> k;
    std::vector<int> nums(n);
    for (int i = 0; i < n; i++) std::cin >> nums[i];

    std::vector<int> res = solve(nums, k);
    std::sort(res.begin(), res.end());
    for (int i = 0; i < k; i++) {
        std::cout << res[i] << (i == k - 1 ? "" : " ");
    }
    std::cout << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static int[] solve(int[] nums, int k) {
        // Your code here
        return new int[k];
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        int n = sc.nextInt();
        int k = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

        int[] result = Solution.solve(nums, k);
        java.util.Arrays.sort(result);
        for (int i = 0; i < k; i++) {
            System.out.print(result[i] + (i == k - 1 ? "" : " "));
        }
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '6 2\n1 1 1 2 2 3', expected: '1 2' },
    { input: '1 1\n7', expected: '7' },
    { input: '10 3\n1 2 1 2 1 2 3 3 4 5', expected: '1 2 3' },
    { input: '4 1\n1 1 2 2', expected: '1' }, // Or 2, order doesn't matter, sorted output is '1'
    { input: '5 2\n-1 -1 0 0 1', expected: '-1 0' },
    { input: '3 3\n1 2 3', expected: '1 2 3' },
    { input: '7 1\n1 2 3 4 5 1 2', expected: '1' }, // Or 2, sorted output is '1'
    { input: '4 2\n1 2 3 4', expected: '1 2' } // Sorted output
  ],

  solution: {
    approach: `The O(n log k) solution involves two main steps. First, we iterate through the input array and use a hash map to count the frequency of each number. This takes O(n) time. Second, we create a min-heap (priority queue) of a fixed size 'k'. We iterate through the entries of our frequency map. For each element, we push it onto the heap. If the heap's size exceeds 'k', we pop the smallest element (which is at the top of a min-heap). This ensures that the heap always contains the 'k' elements with the highest frequencies seen so far. Finally, we extract the elements from the heap to form the result.`,
    cpp: `    std::unordered_map<int, int> counts;
    for (int num : nums) {
        counts[num]++;
    }

    std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, std::greater<std::pair<int, int>>> pq;

    for (auto const& [num, freq] : counts) {
        pq.push({freq, num});
        if (pq.size() > k) {
            pq.pop();
        }
    }

    std::vector<int> result;
    while (!pq.empty()) {
        result.push_back(pq.top().second);
        pq.pop();
    }
    return result;`,
    java: `    java.util.Map<Integer, Integer> count = new java.util.HashMap<>();
    for (int n : nums) {
        count.put(n, count.getOrDefault(n, 0) + 1);
    }

    java.util.PriorityQueue<Integer> heap = new java.util.PriorityQueue<>((n1, n2) -> count.get(n1) - count.get(n2));

    for (int n : count.keySet()) {
        heap.add(n);
        if (heap.size() > k) {
            heap.poll();
        }
    }

    int[] top = new int[k];
    for(int i = k - 1; i >= 0; --i) {
        top[i] = heap.poll();
    }
    return top;`
  }
};