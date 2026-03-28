/**
 * Median of Two Sorted Arrays - Problem Definition
 *
 * Input format (stdin):
 * Line 1: Two integers m and n (sizes of the two arrays).
 * Line 2: m space-separated sorted integers (nums1).
 * Line 3: n space-separated sorted integers (nums2).
 *
 * Output format (stdout):
 * A double representing the median of the two sorted arrays.
 */

module.exports = {
  // ---- Identity ----
  id: 'median-of-two-sorted-arrays',
  conquestId: 'stage9-6',
  title: 'Median of Two Sorted Arrays',
  difficulty: 'Hard',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search', 'Divide and Conquer'],

  // ---- Story Layer ----
  storyBriefing: `The path forward splits into two different, sorted lists of ancient magical artifacts. To proceed, you must find the true median value of the combined collection without actually merging them, as doing so would trigger a magical trap. This requires an advanced partitioning technique to find the middle element of the conceptual combined list.`,

  // ---- Technical Layer ----
  description: `You are given two sorted arrays, 'nums1' and 'nums2', of size m and n respectively. Your task is to find and return the median of the two sorted arrays. The overall time complexity of your solution must be O(log(m+n)).

To achieve this, you must use a binary search approach on the smaller of the two arrays. The goal is to partition both arrays into left and right halves such that every element in the combined left half is less than or equal to every element in the combined right half. Once this correct partition is found, the median can be calculated from the boundary elements in O(1) time.

Return a double representing the median. The output should be formatted to one decimal place.`,
  examples: [
    {
      input: '2 1\n1 3\n2',
      output: '2.0',
      explanation: 'The conceptually merged array is [1, 2, 3]. The median is the middle element, which is 2.'
    },
    {
      input: '2 2\n1 2\n3 4',
      output: '2.5',
      explanation: 'The conceptually merged array is [1, 2, 3, 4]. The median is the average of the two middle elements, (2 + 3) / 2 = 2.5.'
    },
    {
      input: '0 1\n\n1',
      output: '1.0',
      explanation: 'The merged array is [1], so the median is 1.'
    }
  ],
  constraints: [
    'nums1.length == m',
    'nums2.length == n',
    '0 <= m, n <= 1000',
    '1 <= m + n <= 2000',
    '-10^6 <= nums1[i], nums2[i] <= 10^6'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>
#include <iomanip>

using namespace std;

double solve(vector<int>& nums1, vector<int>& nums2) {
    if (nums1.size() > nums2.size()) return solve(nums2, nums1);
    
    int m = nums1.size();
    int n = nums2.size();
    int left = 0, right = m;
    
    // Your binary search logic here
    
    return 0.0;
}

int main() {
    int m, n;
    if (!(cin >> m >> n)) return 0;
    vector<int> nums1(m), nums2(n);
    for (int i = 0; i < m; i++) cin >> nums1[i];
    for (int i = 0; i < n; i++) cin >> nums2[i];
    
    cout << fixed << setprecision(1) << solve(nums1, nums2) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static double solve(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) return solve(nums2, nums1);
        
        int m = nums1.length;
        int n = nums2.length;
        int left = 0, right = m;
        
        // Your binary search logic here
        
        return 0.0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int m = sc.nextInt();
        int n = sc.nextInt();
        int[] nums1 = new int[m];
        int[] nums2 = new int[n];
        for (int i = 0; i < m; i++) nums1[i] = sc.nextInt();
        for (int i = 0; i < n; i++) nums2[i] = sc.nextInt();
        
        System.out.printf("%.1f\\n", solve(nums1, nums2));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '2 1\n1 3\n2', expected: '2.0' },
    { input: '2 2\n1 2\n3 4', expected: '2.5' },
    { input: '0 1\n\n1', expected: '1.0' },
    { input: '1 0\n1\n', expected: '1.0' },
    { input: '2 0\n1 2\n', expected: '1.5' },
    { input: '1 1\n1\n2', expected: '1.5' },
    { input: '4 3\n1 3 5 7\n2 4 6', expected: '4.0' },
    { input: '3 4\n10 20 30\n5 15 25 35', expected: '20.0' },
    { input: '2 2\n1 5\n2 3', expected: '2.5' },
    { input: '2 2\n-1 0\n1 2', expected: '0.5' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The solution involves a binary search on the smaller of the two arrays to find the correct partition point. Let nums1 be the smaller array. We search for a partition index 'partitionX' in nums1. This determines a corresponding 'partitionY' in nums2 such that the total number of elements in the left partitions of both arrays is (m+n+1)/2. The key is to check if the max element on the left side of the partition is less than or equal to the min element on the right side. If this condition (maxLeftX <= minRightY and maxLeftY <= minRightX) is met, we have found the median. If not, we adjust the binary search range in nums1 until the condition is met.`,
    cpp: `while (left <= right) {
    int partitionX = (left + right) / 2;
    int partitionY = (m + n + 1) / 2 - partitionX;

    int maxLeftX = (partitionX == 0) ? INT_MIN : nums1[partitionX - 1];
    int minRightX = (partitionX == m) ? INT_MAX : nums1[partitionX];
    
    int maxLeftY = (partitionY == 0) ? INT_MIN : nums2[partitionY - 1];
    int minRightY = (partitionY == n) ? INT_MAX : nums2[partitionY];

    if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
        if ((m + n) % 2 == 0) {
            return (double)(max(maxLeftX, maxLeftY) + min(minRightX, minRightY)) / 2;
        } else {
            return (double)max(maxLeftX, maxLeftY);
        }
    } else if (maxLeftX > minRightY) {
        right = partitionX - 1;
    } else {
        left = partitionX + 1;
    }
}
return 0.0;`,
    java: `while (left <= right) {
    int partitionX = (left + right) / 2;
    int partitionY = (m + n + 1) / 2 - partitionX;

    int maxLeftX = (partitionX == 0) ? Integer.MIN_VALUE : nums1[partitionX - 1];
    int minRightX = (partitionX == m) ? Integer.MAX_VALUE : nums1[partitionX];
    
    int maxLeftY = (partitionY == 0) ? Integer.MIN_VALUE : nums2[partitionY - 1];
    int minRightY = (partitionY == n) ? Integer.MAX_VALUE : nums2[partitionY];

    if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
        if ((m + n) % 2 == 0) {
            return ((double)Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;
        } else {
            return (double)Math.max(maxLeftX, maxLeftY);
        }
    } else if (maxLeftX > minRightY) {
        right = partitionX - 1;
    } else {
        left = partitionX + 1;
    }
}
return 0.0;`
  }
};