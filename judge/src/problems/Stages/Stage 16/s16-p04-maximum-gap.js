/**
 * Maximum Gap - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * A single integer representing the maximum gap.
 */

module.exports = {
  id: 'maximum-gap',
  conquestId: 'stage16-4',
  title: 'Maximum Gap',
  difficulty: 'Hard',
  category: 'Heaps & Priority Queues',
  tags: ['Bucket Sort', 'Pigeonhole Principle', 'Array'],

  storyBriefing: `As a final preparation, the dragons are positioned in the arena. Each dragon has a "ferocity" rating. For safety, the officials need to know the largest difference in ferocity between any two adjacent dragons if they were to be sorted by this rating. "We can't take the time to sort them fully," Crouch says, concerned. "That would take too long. We need a linear time solution. Perhaps you can group them into buckets and find the answer that way?"`,

  description: `You are given an unsorted array of non-negative integers. Your task is to find the maximum difference between successive elements in the array's sorted form. If the array contains fewer than two elements, the gap is 0.

A solution that first sorts the array would be O(n log n), but this problem can be solved in O(n) linear time. This can be achieved using a technique similar to bucket sort. By using the pigeonhole principle, we can create buckets and only store the minimum and maximum values that fall into each bucket. The maximum gap must exist between the maximum of one bucket and the minimum of the next non-empty bucket.

Return a single integer representing the maximum gap.`,

  examples: [
    {
      input: '4\n3 6 9 1',
      output: '3',
      explanation: 'In the sorted form, the array is [1, 3, 6, 9]. The successive differences are (3-1)=2, (6-3)=3, and (9-6)=3. The maximum difference is 3.'
    },
    {
      input: '2\n10 1',
      output: '9',
      explanation: 'The sorted form is [1, 10]. The difference is 10 - 1 = 9.'
    },
    {
      input: '1\n100',
      output: '0',
      explanation: 'The array has fewer than two elements, so the maximum gap is 0.'
    }
  ],

  constraints: [
    'The number of elements is between 1 and 100000.',
    'The value of each element is between 0 and 10^9.'
  ],

  boilerplate: {
    cpp: `int solve(std::vector<int>& nums) {
    // Your code here
    return 0;
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; i++) std::cin >> arr[i];
    std::cout << solve(arr) << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static int solve(int[] nums) {
        // Your code here
        return 0;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        System.out.println(Solution.solve(nums));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '4\n3 6 9 1', expected: '3' },
    { input: '2\n10 1', expected: '9' },
    { input: '1\n100', expected: '0' },
    { input: '5\n1 1 1 1 1', expected: '0' },
    { input: '6\n1 10 2 9 3 8', expected: '3' }, // Sorted: 1 2 3 8 9 10
    { input: '4\n10 20 30 40', expected: '10' },
    { input: '4\n40 30 20 10', expected: '10' },
    { input: '3\n0 100 50', expected: '50' }
  ],
  
  solution: {
    approach: `The linear time solution for Maximum Gap uses a form of bucket sort. First, we find the minimum and maximum values in the array. If all elements are the same, the gap is 0. Otherwise, we calculate an average gap size and determine the number of buckets needed. We create two arrays to store the minimum and maximum value for each bucket. We then iterate through the input array, placing each number into its corresponding bucket and updating that bucket's min and max values. Since the maximum gap cannot be within a single bucket, we only need to iterate through the bucket arrays, comparing the maximum of the previous non-empty bucket with the minimum of the current one to find the largest difference.`,
    cpp: `    int n = nums.size();
    if (n < 2) return 0;

    int minVal = nums[0], maxVal = nums[0];
    for (int x : nums) {
        minVal = std::min(minVal, x);
        maxVal = std::max(maxVal, x);
    }

    if (minVal == maxVal) return 0;

    int bucketSize = std::max(1, (maxVal - minVal) / (n - 1));
    int bucketCount = (maxVal - minVal) / bucketSize + 1;

    std::vector<int> bMin(bucketCount, 2e9);
    std::vector<int> bMax(bucketCount, -2e9);

    for (int x : nums) {
        int idx = (x - minVal) / bucketSize;
        bMin[idx] = std::min(bMin[idx], x);
        bMax[idx] = std::max(bMax[idx], x);
    }

    int maxGap = 0;
    int prevMax = minVal;
    for (int i = 0; i < bucketCount; i++) {
        if (bMin[i] == 2e9) continue;
        maxGap = std::max(maxGap, bMin[i] - prevMax);
        prevMax = bMax[i];
    }

    return maxGap;`,
    java: `    if (nums == null || nums.length < 2) {
        return 0;
    }

    int min = Integer.MAX_VALUE;
    int max = Integer.MIN_VALUE;
    for (int i : nums) {
        min = Math.min(min, i);
        max = Math.max(max, i);
    }

    if (min == max) return 0;

    int n = nums.length;
    int bucketSize = Math.max(1, (max - min) / (n - 1));
    int bucketCount = (max - min) / bucketSize + 1;

    int[] bMin = new int[bucketCount];
    int[] bMax = new int[bucketCount];
    java.util.Arrays.fill(bMin, Integer.MAX_VALUE);
    java.util.Arrays.fill(bMax, Integer.MIN_VALUE);

    for (int i : nums) {
        int idx = (i - min) / bucketSize;
        bMin[idx] = Math.min(bMin[idx], i);
        bMax[idx] = Math.max(bMax[idx], i);
    }

    int maxGap = 0;
    int prevMax = min;
    for (int i = 0; i < bucketCount; i++) {
        if (bMin[i] == Integer.MAX_VALUE) continue;
        maxGap = Math.max(maxGap, bMin[i] - prevMax);
        prevMax = bMax[i];
    }

    return maxGap;`
  }
};