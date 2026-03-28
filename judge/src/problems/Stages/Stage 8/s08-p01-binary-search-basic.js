/**
 * Binary Search Basic - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the sorted array.
 * Line 2: n space-separated sorted integers.
 * Line 3: An integer target to search for.
 *
 * Output format (stdout):
 * A single integer representing the 0-based index of the target.
 * If the target is not found, return -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'binary-search-basic',
  conquestId: 'stage8-1',
  title: 'Binary Search',
  difficulty: 'Easy',
  category: 'Binary Search – Core',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  stageIntro: `The incantation from the manuscript glows faintly, revealing a new clue that hints at secrets hidden within Hogwarts itself. Hermione, ever the researcher, believes the clue points to a specific book in a restricted section of the library, but the catalogue is magically sorted and immensely long. This calls for a more efficient search method than checking every single entry one by one. It's time to learn how to find things fast.`,
  storyBriefing: `Hermione hands you a perfectly sorted list of book serial numbers. She asks you to find the exact location (index) of a specific target serial number. The list is far too long to search linearly. 'You have to be clever about it,' she says. 'Don't look at every book. Split the list in half with each check. If your target is higher, check the upper half. If it's lower, check the lower half. It's the only way to find it before Madam Pince gets suspicious.'`,

  // ---- Technical Layer ----
  description: `You are given a sorted array of n unique integers, 'nums', and a target value. Your task is to search for the target in the array. If the target exists, return its 0-based index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity. The binary search algorithm achieves this by repeatedly dividing the search interval in half. Begin with an interval covering the whole array. If the value of the search key is less than the item in the middle of theinterval, narrow the interval to the lower half. Otherwise, narrow it to the upper half.

Return a single integer representing the index of the target, or -1 if it's not found.`,
  examples: [
    {
      input: '6\n-1 0 3 5 9 12\n9',
      output: '4',
      explanation: 'The target 9 is present in the array at index 4.'
    },
    {
      input: '6\n-1 0 3 5 9 12\n2',
      output: '-1',
      explanation: 'The target 2 is not present in the array, so we return -1.'
    },
    {
      input: '1\n5\n5',
      output: '0',
      explanation: 'The target 5 is found at index 0 in the single-element array.'
    }
  ],
  constraints: [
    '1 <= n <= 10^4',
    '-10^4 < nums[i], target < 10^4',
    'All integers in nums are unique.',
    'nums is sorted in ascending order.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

int solve(int n, vector<int>& nums, int target) {
    // Your code here
    
    return -1;
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
    
    cout << solve(n, nums, target) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, int[] nums, int target) {
        // Your code here
        
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        
        System.out.println(solve(n, nums, target));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '6\n-1 0 3 5 9 12\n9', expected: '4' },
    { input: '6\n-1 0 3 5 9 12\n2', expected: '-1' },
    { input: '1\n5\n5', expected: '0' },
    { input: '1\n5\n-5', expected: '-1' },
    { input: '2\n1 3\n1', expected: '0' },
    { input: '2\n1 3\n3', expected: '1' },
    { input: '5\n1 2 3 4 5\n1', expected: '0' },
    { input: '5\n1 2 3 4 5\n5', expected: '4' },
    { input: '5\n1 2 3 4 5\n3', expected: '2' },
    { input: '2\n-100 100\n0', expected: '-1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The binary search algorithm is implemented with two pointers, 'left' and 'right', initially at the start and end of the array, respectively. While 'left' is less than or equal to 'right', calculate the 'mid' index. If the element at 'mid' is the target, return 'mid'. If the element is less than the target, the target must be in the right half, so move the 'left' pointer to 'mid + 1'. Otherwise, the target must be in the left half, so move the 'right' pointer to 'mid - 1'. If the loop finishes without finding the target, it does not exist in the array, so return -1.`,
    cpp: `int left = 0, right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) {
        return mid;
    } else if (nums[mid] < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return -1;`,
    java: `int left = 0, right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) {
        return mid;
    } else if (nums[mid] < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return -1;`
  }
};