/**
 * Sliding Window Maximum - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of elements in the array.
 * Line 2: n space-separated integers representing the array nums.
 * Line 3: An integer k, the size of the sliding window.
 *
 * Output format (stdout):
 * n - k + 1 space-separated integers representing the max element in each window.
 */

module.exports = {
  // ---- Identity ----
  id: 'sliding-window-maximum',
  conquestId: 'stage5-5',
  title: 'Sliding Window Maximum',
  difficulty: 'Hard',
  category: 'Sliding Window',
  tags: ['Array', 'Queue', 'Sliding Window', 'Monotonic Queue'],

  // ---- Story Layer ----
  storyBriefing: `For your final Quidditch trial, Oliver Wood wants to analyze your peak performance. He gives you a list of your speed readings during a long flight. You must analyze this data through a 'sliding window' of size 'k' to simulate looking at 'k' seconds of flight at a time. For each and every window, you need to report the absolute maximum speed you achieved. This will show your captain your highest burst of speed in any given phase of the flight.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers 'nums' and a window size 'k'. A sliding window of size k is moving from the very left to the very right of the array. You can only see the k numbers in the window. Your task is to find the maximum value within the window as it slides.

A naive approach would be to find the maximum in each window, leading to an O(n*k) complexity. An efficient O(n) solution uses a double-ended queue (deque) to maintain a monotonically decreasing sequence of indices. As the window slides, elements are added to and removed from the deque to ensure the index of the maximum element is always at the front, allowing for O(1) lookups for each window's maximum.

Return an array containing the maximum value for each sliding window. The elements should be space-separated on a single line.`,
  examples: [
    {
      input: '8\n1 3 -1 -3 5 3 6 7\n3',
      output: '3 3 5 5 6 7',
      explanation: 'Window 1: [1,3,-1] max is 3. Window 2: [3,-1,-3] max is 3. Window 3: [-1,-3,5] max is 5. And so on.'
    },
    {
      input: '1\n1\n1',
      output: '1',
      explanation: 'The only window is [1] and its max is 1.'
    },
    {
      input: '5\n5 4 3 2 1\n2',
      output: '5 4 3 2',
      explanation: 'For a decreasing array, the max of each window is its first element.'
    }
  ],
  constraints: [
    '1 <= n <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
    '1 <= k <= n'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <deque>

using namespace std;

vector<int> solve(int n, vector<int>& nums, int k) {
    vector<int> result;
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
    int k;
    cin >> k;
    
    vector<int> result = solve(n, nums, k);
    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    cout << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;
import java.util.Deque;
import java.util.LinkedList;

public class Main {
    public static int[] solve(int n, int[] nums, int k) {
        if (n == 0 || k == 0) return new int[0];
        int[] result = new int[n - k + 1];
        // Your code here
        
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int k = sc.nextInt();
        
        int[] result = solve(n, nums, k);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < result.length; i++) {
            sb.append(result[i]);
            if (i < result.length - 1) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '8\n1 3 -1 -3 5 3 6 7\n3', expected: '3 3 5 5 6 7' },
    { input: '1\n1\n1', expected: '1' },
    { input: '1\n-1\n1', expected: '-1' },
    { input: '3\n1 2 3\n3', expected: '3' },
    { input: '5\n1 2 3 4 5\n5', expected: '5' },
    { input: '5\n5 4 3 2 1\n2', expected: '5 4 3 2' },
    { input: '5\n1 1 1 1 1\n2', expected: '1 1 1 1' },
    { input: '4\n4 3 2 1\n4', expected: '4' },
    { input: '6\n-1 -2 -3 -4 -5 -6\n3', expected: '-1 -2 -3 -4' },
    { input: '3\n10 5 15\n2', expected: '10 15' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is solved in O(n) time using a deque (double-ended queue) to maintain a monotonic (decreasing) sequence of indices. Iterate through the array from left to right. For each element, first remove indices from the back of the deque if the elements they point to are less than or equal to the current element. This ensures the deque stays sorted by value. Then, add the current element's index to the back. Next, remove the index from the front of the deque if it has fallen out of the current window's bounds (i.e., index < i - k + 1). Finally, once the window is full (i >= k - 1), the element at the index at the front of the deque is the maximum for that window, so add it to the result list.`,
    cpp: `deque<int> dq;
for (int i = 0; i < n; ++i) {
    if (!dq.empty() && dq.front() == i - k) {
        dq.pop_front();
    }
    while (!dq.empty() && nums[dq.back()] < nums[i]) {
        dq.pop_back();
    }
    dq.push_back(i);
    if (i >= k - 1) {
        result.push_back(nums[dq.front()]);
    }
}
return result;`,
    java: `Deque<Integer> dq = new LinkedList<>();
int resultIndex = 0;
for (int i = 0; i < n; i++) {
    if (!dq.isEmpty() && dq.peekFirst() == i - k) {
        dq.pollFirst();
    }
    while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) {
        dq.pollLast();
    }
    dq.offerLast(i);
    if (i >= k - 1) {
        result[resultIndex++] = nums[dq.peekFirst()];
    }
}
return result;`
  }
};