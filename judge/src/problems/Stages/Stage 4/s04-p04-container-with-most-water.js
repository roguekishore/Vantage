/**
 * Container With Most Water - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of vertical lines.
 * Line 2: n space-separated integers representing the height of each line.
 *
 * Output format (stdout):
 * A single integer representing the maximum amount of water a container can store.
 */

module.exports = {
  // ---- Identity ----
  id: 'container-with-most-water',
  conquestId: 'stage4-4',
  title: 'Container With Most Water',
  difficulty: 'Medium',
  category: 'Two Pointers',
  tags: ['Array', 'Two Pointers', 'Greedy'],

  // ---- Story Layer ----
  storyBriefing: `Away from the duelling grounds, Professor Snape presents a challenge in the Potions storeroom. You are shown a series of vertical potion barriers of different heights. You must choose two barriers to form the sides of a container that will hold a magical liquid. Your goal is to find the pair of barriers that can contain the maximum possible amount of this liquid, a task requiring careful consideration of both height and distance.`,

  // ---- Technical Layer ----
  description: `You are given an integer array 'height' of length n, where 'height[i]' is the height of the i-th vertical line. Your goal is to find two lines that, together with the x-axis, form a container that can hold the most water. The width of the container is the distance between the two lines, and its height is determined by the shorter of the two lines.

This problem can be solved in O(n) time using a two-pointer approach. Start with one pointer at the beginning of the array (left) and one at the end (right). Calculate the area and keep track of the maximum area found. In each step, to maximize the potential for a larger area, you should move the pointer corresponding to the shorter of the two lines inward.

Return a single integer representing the maximum amount of water that can be contained.`,
  examples: [
    {
      input: '9\n1 8 6 2 5 4 8 3 7',
      output: '49',
      explanation: 'The two lines are at index 1 (height 8) and index 8 (height 7). The width is 8-1=7. The height is limited by the shorter line, min(8, 7) = 7. The area is 7 * 7 = 49.'
    },
    {
      input: '2\n1 1',
      output: '1',
      explanation: 'With two lines of height 1, the width is 1 and the height is 1, so the area is 1.'
    },
    {
      input: '5\n4 3 2 1 4',
      output: '16',
      explanation: 'The widest container is between the first and last lines. Width = 4, Height = min(4, 4) = 4. Area = 4 * 4 = 16.'
    }
  ],
  constraints: [
    '2 <= n <= 10^5',
    '0 <= height[i] <= 10^4'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int solve(int n, vector<int>& height) {
    int maxWater = 0;
    // Your code here
    
    return maxWater;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> height(n);
    for (int i = 0; i < n; i++) cin >> height[i];
    
    cout << solve(n, height) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static int solve(int n, int[] height) {
        int maxWater = 0;
        // Your code here
        
        return maxWater;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] height = new int[n];
        for (int i = 0; i < n; i++) height[i] = sc.nextInt();
        
        System.out.println(solve(n, height));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '9\n1 8 6 2 5 4 8 3 7', expected: '49' },
    { input: '2\n1 1', expected: '1' },
    { input: '5\n4 3 2 1 4', expected: '16' },
    { input: '4\n1 2 4 3', expected: '4' },
    { input: '6\n10 1 1 1 1 10', expected: '50' },
    { input: '3\n1 2 1', expected: '2' },
    { input: '2\n1 100', expected: '1' },
    { input: '5\n10 9 8 7 6', expected: '18' },
    { input: '5\n6 7 8 9 10', expected: '18' },
    { input: '4\n1 10 10 1', expected: '10' }
  ],

  // ---- Solution ----
  solution: {
    approach: `This problem is solved efficiently with a two-pointer approach. Initialize a 'left' pointer at the start of the array and a 'right' pointer at the end. Maintain a 'maxWater' variable. In a loop, calculate the area formed by the current 'left' and 'right' pointers: 'width * min(height[left], height[right])'. Update 'maxWater' if this area is larger. To find a potentially larger area, you must increase either the width or the height. Since the width only decreases, we must seek a greater height. Therefore, move the pointer associated with the shorter height inward, as this is the only move that could potentially increase the container's height.`,
    cpp: `int left = 0, right = n - 1;
while (left < right) {
    int width = right - left;
    int h = min(height[left], height[right]);
    maxWater = max(maxWater, width * h);
    if (height[left] < height[right]) {
        left++;
    } else {
        right--;
    }
}
return maxWater;`,
    java: `int left = 0, right = n - 1;
while (left < right) {
    int width = right - left;
    int h = Math.min(height[left], height[right]);
    maxWater = Math.max(maxWater, width * h);
    if (height[left] < height[right]) {
        left++;
    } else {
        right--;
    }
}
return maxWater;`
  }
};