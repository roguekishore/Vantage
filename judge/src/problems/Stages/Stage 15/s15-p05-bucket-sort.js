/**
 * Bucket Sort - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements.
 * Line 2: n space-separated floating-point numbers.
 *
 * Output format (stdout):
 * The sorted array as n space-separated numbers (formatted to 2 decimal places).
 */

module.exports = {
  id: 'bucket-sort',
  conquestId: 'stage15-5',
  title: 'Bucket Sort',
  difficulty: 'Medium',
  category: 'Sorting',
  tags: ['Sorting', 'Distribution Sort', 'Array'],

  storyBriefing: `Professor Sprout needs help in the greenhouses. She has a large number of seeds, each with a floating-point "magic potential" rating from 0.0 to 1.0. "These seeds are all roughly distributed," she explains. "We can sort them quickly by dropping them into enchanted buckets based on their potential. A seed with 0.82 potential goes in the 8th bucket, 0.34 goes in the 3rd, and so on. Then we just sort the few seeds in each bucket and we're done! Much faster."`,

  description: `You are given an array of floating-point numbers that are uniformly distributed over the range [0, 1). Your task is to sort this array using Bucket Sort, a distribution sort that is highly effective for such inputs.

Bucket Sort works by dividing the input range into a number of equal-sized 'buckets'. Each element from the input array is then placed into its corresponding bucket. Afterward, each bucket is sorted individually (often using a simple sort like Insertion Sort), and finally, the sorted buckets are concatenated to form the final sorted array.

Return the sorted array as a single line of space-separated numbers, formatted to two decimal places.`,

  examples: [
    {
      input: '5\n0.897 0.565 0.656 0.123 0.665',
      output: '0.12 0.57 0.66 0.67 0.90',
      explanation: 'The numbers are placed into 5 buckets. For 0.897, index is floor(5 * 0.897) = 4. For 0.123, index is floor(5 * 0.123) = 0. Each bucket is sorted, and the results are combined.'
    },
    {
      input: '3\n0.1 0.11 0.12',
      output: '0.10 0.11 0.12',
      explanation: 'Numbers close to each other may fall into the same bucket, which is then sorted internally.'
    },
    {
      input: '4\n0.99 0.01 0.55 0.33',
      output: '0.01 0.33 0.55 0.99',
      explanation: 'A well-distributed set of numbers is sorted efficiently.'
    }
  ],

  constraints: [
    'The number of elements is between 1 and 100000.',
    'The value of each element is between 0.0 (inclusive) and 1.0 (exclusive).'
  ],

  boilerplate: {
    cpp: `void solve(std::vector<float>& arr) {
    // Your code here
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <iomanip>
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n;
    if (!(std::cin >> n)) return 0;
    std::vector<float> arr(n);
    for (int i = 0; i < n; i++) std::cin >> arr[i];

    solve(arr);

    for (int i = 0; i < n; i++) {
        std::cout << std::fixed << std::setprecision(2) << arr[i] << (i == n - 1 ? "" : " ");
    }
    std::cout << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static void solve(float[] arr) {
        // Your code here
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        float[] arr = new float[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextFloat();

        Solution.solve(arr);

        for (int i = 0; i < n; i++) {
            System.out.printf("%.2f%s", arr[i], (i == n - 1 ? "" : " "));
        }
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '5\n0.897 0.565 0.656 0.123 0.665', expected: '0.12 0.57 0.66 0.67 0.90' },
    { input: '3\n0.1 0.1 0.1', expected: '0.10 0.10 0.10' },
    { input: '4\n0.9 0.7 0.5 0.3', expected: '0.30 0.50 0.70 0.90' },
    { input: '1\n0.42', expected: '0.42' },
    { input: '2\n0.99 0.01', expected: '0.01 0.99'},
    { input: '10\n0.8 0.4 0.1 0.5 0.3 0.44 0.2 0.6 0.28 0.0', expected: '0.00 0.10 0.20 0.28 0.30 0.40 0.44 0.50 0.60 0.80'},
    { input: '5\n0.5 0.5 0.5 0.5 0.5', expected: '0.50 0.50 0.50 0.50 0.50' }
  ],
  
  solution: {
    approach: `Bucket Sort is implemented by first creating 'n' empty buckets, where 'n' is the number of elements. We then iterate through the input array, placing each element into a bucket determined by its value. The bucket index for an element 'x' is calculated as floor(n * x). After distributing all elements, we sort each individual bucket (e.g., using insertion sort or a standard library sort). Finally, we concatenate the sorted elements from each bucket back into the original array in order, from bucket 0 to n-1.`,
    cpp: `    int n = arr.size();
    if (n <= 0) return;

    std::vector<std::vector<float>> buckets(n);

    for (int i = 0; i < n; i++) {
        int bucketIndex = n * arr[i];
        buckets[bucketIndex].push_back(arr[i]);
    }

    for (int i = 0; i < n; i++) {
        std::sort(buckets[i].begin(), buckets[i].end());
    }

    int index = 0;
    for (int i = 0; i < n; i++) {
        for (size_t j = 0; j < buckets[i].size(); j++) {
            arr[index++] = buckets[i][j];
        }
    }`,
    java: `    int n = arr.length;
    if (n <= 0) return;

    @SuppressWarnings("unchecked")
    java.util.List<Float>[] buckets = new java.util.ArrayList[n];
    for (int i = 0; i < n; i++) {
        buckets[i] = new java.util.ArrayList<Float>();
    }

    for (int i = 0; i < n; i++) {
        int bucketIndex = (int) (arr[i] * n);
        buckets[bucketIndex].add(arr[i]);
    }

    for (int i = 0; i < n; i++) {
        java.util.Collections.sort(buckets[i]);
    }

    int index = 0;
    for (int i = 0; i < n; i++) {
        for (float val : buckets[i]) {
            arr[index++] = val;
        }
    }`
  }
};