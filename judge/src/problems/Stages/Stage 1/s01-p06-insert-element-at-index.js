/**
 * Insert Element at Index - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the current number of elements in the array.
 * Line 2: n space-separated integers.
 * Line 3: An integer element, the value to be inserted.
 * Line 4: An integer index, the position where the element should be inserted (0-indexed).
 *
 * Output format (stdout):
 * n+1 space-separated integers representing the array after insertion.
 */

module.exports = {
  id: 'insert-element-at-index',
  conquestId: 'stage1-6',
  title: 'Insert Element at Index',
  difficulty: 'Easy',
  category: 'Absolute Programming Basics',
  tags: ['Array', 'Basics', 'Shifting'],

  storyBriefing: `In the library, Madam Pince intercepts you with a stack of ledgers. "The restricted section catalogue is strictly ordered," she hisses. "A new volume arrived this morning and it must be placed at a very precise position - not the front, not the end. Shift everything else along and slot it in exactly where I say, or the catalogue's enchantment will unravel."`,

  description: `You are given an array of n integers, a value element, and a zero-indexed position index. Insert element into the array at position index.

All elements currently at positions index through n-1 must each shift one position to the right to make room for the new value. The resulting array will have n+1 elements. Insertion at index 0 shifts the entire array right; insertion at index n appends to the end with no shifting.

Print n+1 space-separated integers on a single line - the array after the insertion.`,

  examples: [
    {
      input: '4\n10 20 30 40\n99\n2',
      output: '10 20 99 30 40',
      explanation: '99 is inserted at index 2. Elements at indices 2 and 3 (30 and 40) each shift right by one position. Array grows from size 4 to size 5.'
    },
    {
      input: '3\n1 2 3\n0\n0',
      output: '0 1 2 3',
      explanation: '0 is inserted at the front (index 0). All three existing elements shift right by one position.'
    },
    {
      input: '3\n1 2 3\n9\n3',
      output: '1 2 3 9',
      explanation: '9 is inserted at index 3, which is one past the last element. No shifting is needed - it becomes the new last element.'
    }
  ],

  constraints: [
    '1 ≤ n ≤ 1000',
    '0 ≤ index ≤ n',
    '-10⁹ ≤ array[i], element ≤ 10⁹'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>

using namespace std;

/**
 * Inserts the element at the specified index and returns the new array.
 */
vector<int> solve(int n, vector<int>& arr, int element, int index) {
    vector<int> result;
    // Your code here
    
    return result;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int element, index;
    cin >> element >> index;
    
    vector<int> result = solve(n, arr, element, index);
    
    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    cout << endl;
    return 0;
}`,
    java: `import java.util.Scanner;
import java.util.ArrayList;
import java.util.List;

public class Main {
    /**
     * Inserts the element at the specified index and returns the new array.
     */
    public static List<Integer> solve(int n, int[] arr, int element, int index) {
        List<Integer> result = new ArrayList<>();
        // Your code here
        
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int element = sc.nextInt();
        int index = sc.nextInt();
        
        List<Integer> result = solve(n, arr, element, index);
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < result.size(); i++) {
            sb.append(result.get(i));
            if (i < result.size() - 1) sb.append(" ");
        }
        System.out.println(sb.toString());
    }
}`
  },

  testCases: [
    { input: '4\n10 20 30 40\n99\n1', expected: '10 99 20 30 40' },
    { input: '3\n1 2 3\n5\n3', expected: '1 2 3 5' },
    { input: '3\n1 2 3\n0\n0', expected: '0 1 2 3' },
    { input: '1\n100\n50\n0', expected: '50 100' },
    { input: '1\n100\n150\n1', expected: '100 150' },
    { input: '5\n1 1 1 1 1\n2\n2', expected: '1 1 2 1 1 1' },
    { input: '2\n-1 -3\n-2\n1', expected: '-1 -2 -3' },
    { input: '4\n0 0 0 0\n1\n2', expected: '0 0 1 0 0' },
    { input: '10\n1 2 3 4 5 6 7 8 9 10\n11\n5', expected: '1 2 3 4 5 11 6 7 8 9 10' }
  ]
};