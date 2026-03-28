/**
 * Longest Consecutive Sequence - Problem Definition
 *
 * Input format (stdin):
 *   First line: integer n (size of array)
 *   Second line: n space-separated integers
 *
 * Output format (stdout):
 *   Print the length of the longest consecutive elements sequence.
 */

module.exports = {
  id: 'longest-consecutive-sequence',
  conquestId: 'bonusC-2',
  title: 'Rune Sequence Alignment',
  difficulty: 'Medium',
  category: 'Array',
  tags: ['Array', 'Hash Set'],
  storyBriefing: `
In the Ancient Runes class, you are studying a scattered set of magical runes. To unlock their power, you must find the longest "sequence alignment"—a chain of runes with consecutive numerical values.

For example, if you have runes with values {100, 4, 200, 1, 3, 2}, the longest alignment is {1, 2, 3, 4}, with a length of 4. Your task is to find the length of the longest such alignment from any given set of unsorted runes. This must be done efficiently to avoid magical feedback.
`,
  description: `Given an **unsorted array of integers**, return the **length of the longest consecutive elements sequence**.

A consecutive sequence means numbers appear in order with a difference of **1**, for example:  
1, 2, 3, 4

The algorithm must run in **O(n)** time.

Efficient approach:

1. Insert all elements into a **HashSet**.
2. Iterate through each number in the set.
3. Only start counting when the number is the **start of a sequence**  
   (i.e., **num - 1 is not in the set**).
4. Expand the sequence while **num + 1 exists** in the set.
5. Track the **maximum length** encountered.

This ensures each number is processed only once.`,

  examples: [
    {
      input: `6
100 4 200 1 3 2`,
      output: '4',
      explanation: 'The longest consecutive sequence is 1, 2, 3, 4.',
    },
    {
      input: `7
0 3 7 2 5 8 4`,
      output: '4',
      explanation: 'The longest consecutive sequence is 2, 3, 4, 5.',
    },
  ],

  constraints: [
    '0 ≤ n ≤ 10^5',
    '-10^9 ≤ nums[i] ≤ 10^9',
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <unordered_set>
#include <algorithm>

using namespace std;

int longestConsecutive(vector<int>& nums) {
    if (nums.empty()) {
        return 0;
    }

    unordered_set<int> num_set(nums.begin(), nums.end());
    int longest_streak = 0;

    for (int num : num_set) {
        if (num_set.find(num - 1) == num_set.end()) {
            int current_num = num;
            int current_streak = 1;

            while (num_set.find(current_num + 1) != num_set.end()) {
                current_num += 1;
                current_streak += 1;
            }

            longest_streak = max(longest_streak, current_streak);
        }
    }

    return longest_streak;
}

int main() {
    int n;
    cin >> n;

    vector<int> nums(n);
    for(int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    cout << longestConsecutive(nums);
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    public static int longestConsecutive(int[] nums) {
        if (nums == null || nums.length == 0) {
            return 0;
        }

        Set<Integer> numSet = new HashSet<>();
        for (int num : nums) {
            numSet.add(num);
        }

        int longestStreak = 0;

        for (int num : numSet) {
            if (!numSet.contains(num - 1)) {
                int currentNum = num;
                int currentStreak = 1;

                while (numSet.contains(currentNum + 1)) {
                    currentNum += 1;
                    currentStreak += 1;
                }

                longestStreak = Math.max(longestStreak, currentStreak);
            }
        }

        return longestStreak;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        System.out.println(longestConsecutive(nums));
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <unordered_set>
#include <algorithm>

using namespace std;

int longestConsecutive(vector<int>& nums) {
    if (nums.empty()) {
        return 0;
    }

    unordered_set<int> num_set(nums.begin(), nums.end());
    int longest_streak = 0;

    for (int num : num_set) {
        if (num_set.find(num - 1) == num_set.end()) {
            int current_num = num;
            int current_streak = 1;

            while (num_set.find(current_num + 1) != num_set.end()) {
                current_num += 1;
                current_streak += 1;
            }

            longest_streak = max(longest_streak, current_streak);
        }
    }

    return longest_streak;
}

int main() {
    int n;
    cin >> n;

    vector<int> nums(n);
    for(int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    cout << longestConsecutive(nums);
    return 0;
}`,
    java: `import java.util.*;

public class Main {
    public static int longestConsecutive(int[] nums) {
        if (nums == null || nums.length == 0) {
            return 0;
        }

        Set<Integer> numSet = new HashSet<>();
        for (int num : nums) {
            numSet.add(num);
        }

        int longestStreak = 0;

        for (int num : numSet) {
            if (!numSet.contains(num - 1)) {
                int currentNum = num;
                int currentStreak = 1;

                while (numSet.contains(currentNum + 1)) {
                    currentNum += 1;
                    currentStreak += 1;
                }

                longestStreak = Math.max(longestStreak, currentStreak);
            }
        }

        return longestStreak;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        System.out.println(longestConsecutive(nums));
    }
}`,
  },

  testCases: [
    { input: `0\n`, expected: '0' },
    { input: `1\n5`, expected: '1' },
    { input: `6\n100 4 200 1 3 2`, expected: '4' },
    { input: `7\n0 3 7 2 5 8 4`, expected: '4' },
    { input: `8\n1 2 0 1 3 4 5 6`, expected: '7' },
  ],
};