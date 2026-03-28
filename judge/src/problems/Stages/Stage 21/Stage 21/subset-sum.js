/**
 * Subset Sum - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer n - number of elements
 *   Line 2: n space-separated integers
 *   Line 3: Integer target - the desired sum
 *
 * Output format (stdout):
 *   Print "true" if there exists a subset whose sum equals the target.
 *   Otherwise print "false".
 */

module.exports = {
  id: 'subset-sum',
  conquestId: 'stage21-6',
  title: 'The Space Room',
  difficulty: 'Medium',
  category: 'Recursion',
  tags: ['Recursion', 'Backtracking', 'Dynamic Programming'],
  storyBriefing: `
The Space Room contains a collection of floating planets, each with a specific gravitational mass. You've been tasked with creating a stable planetary system with a precise total mass.

Given the masses of all available planets, you must determine if a *subset* of them can be combined to achieve a target gravitational mass. For each planet, you have a choice: include it in your system or not. This binary choice at each step is the heart of this recursive problem.
`,
  description: `
Given a set of **n integers** and a **target sum**, determine whether there exists a **subset** of the numbers whose sum equals the target.

A **subset** can include or exclude each element independently.

Example:
Array: [3, 34, 4, 12, 5, 2]  
Target: 9  

Possible subset:
4 + 5 = 9 → **true**

You may solve this problem using:
- **Recursion / Backtracking**, or
- **Dynamic Programming** for better performance.

Return **true** if such a subset exists, otherwise return **false**.
`,

  examples: [
    {
      input: '6\n3 34 4 12 5 2\n9',
      output: 'true',
      explanation: 'Subset {4, 5} sums to 9.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 30',
    '-10^4 ≤ array[i] ≤ 10^4',
    '-10^5 ≤ target ≤ 10^5'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

bool subsetSum(vector<int>& arr, int index, int target) {
    if (target == 0) {
        return true;
    }
    if (index >= arr.size()) { // Simplified base case
        return false;
    }
    // Exclude the current element
    if (subsetSum(arr, index + 1, target)) {
        return true;
    }
    // Include the current element
    if (subsetSum(arr, index + 1, target - arr[index])) {
        return true;
    }
    return false;
}

int main() {
    int n;
    cin >> n;

    vector<int> arr(n);
    for(int i = 0; i < n; i++)
        cin >> arr[i];

    int target;
    cin >> target;

    cout << (subsetSum(arr, 0, target) ? "true" : "false");

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static boolean subsetSum(int[] arr, int index, int target) {
        if (target == 0) {
            return true;
        }
        if (index >= arr.length) { // Simplified base case
            return false;
        }
        // Exclude the current element
        if (subsetSum(arr, index + 1, target)) {
            return true;
        }
        // Include the current element
        if (subsetSum(arr, index + 1, target - arr[index])) {
            return true;
        }
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[] arr = new int[n];
        for(int i = 0; i < n; i++)
            arr[i] = sc.nextInt();

        int target = sc.nextInt();

        System.out.print(subsetSum(arr, 0, target) ? "true" : "false");
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

bool subsetSum(vector<int>& arr, int index, int target) {
    if (target == 0) {
        return true;
    }
    if (index >= arr.size()) { // Simplified base case
        return false;
    }
    // Exclude the current element
    if (subsetSum(arr, index + 1, target)) {
        return true;
    }
    // Include the current element
    if (subsetSum(arr, index + 1, target - arr[index])) {
        return true;
    }
    return false;
}

int main() {
    int n;
    cin >> n;

    vector<int> arr(n);
    for(int i = 0; i < n; i++)
        cin >> arr[i];

    int target;
    cin >> target;

    cout << (subsetSum(arr, 0, target) ? "true" : "false");

    return 0;
}`,
    java: `import java.util.*;

public class Main {

    static boolean subsetSum(int[] arr, int index, int target) {
        if (target == 0) {
            return true;
        }
        if (index >= arr.length) { // Simplified base case
            return false;
        }
        // Exclude the current element
        if (subsetSum(arr, index + 1, target)) {
            return true;
        }
        // Include the current element
        if (subsetSum(arr, index + 1, target - arr[index])) {
            return true;
        }
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        int[] arr = new int[n];
        for(int i = 0; i < n; i++)
            arr[i] = sc.nextInt();

        int target = sc.nextInt();

        System.out.print(subsetSum(arr, 0, target) ? "true" : "false");
    }
}`,
  },

  testCases: [
    { input: '6\n3 34 4 12 5 2\n9', expected: 'true' },
    { input: '5\n1 2 3 4 5\n11', expected: 'true' },
    { input: '4\n2 4 6 8\n5', expected: 'false' },
    { input: '3\n10 20 30\n50', expected: 'true' },
    { input: '3\n1 1 1\n2', expected: 'true' },
    { input: '3\n5 10 12\n3', expected: 'false' },
    { input: '1\n7\n7', expected: 'true' },
    { input: '1\n7\n5', expected: 'false' },
    { input: '5\n-1 2 3 7 5\n6', expected: 'true' }
  ],
};