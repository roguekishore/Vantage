/**
 * Search in Sorted Array of Unknown Size - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer target.
 * Line 2: n space-separated sorted integers (representing the hidden array).
 *
 * Output format (stdout):
 * A single integer representing the 0-based index of the target.
 * If target is not found, return -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'search-in-sorted-array-of-unknown-size',
  conquestId: 'stage9-8',
  title: 'Search in Sorted Array of Unknown Size',
  difficulty: 'Medium',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search'],

  // ---- Story Layer ----
  storyBriefing: `The chamber leads to a vast, ethereal library where the bookshelves stretch into an infinite-seeming darkness. You need to find a specific book ('target'), but the library has no catalogue and its size is unknown. You are accompanied by a magical wisp ('ArrayReader') that can retrieve a book from any shelf number you request. If you ask for a shelf that doesn't exist, the wisp simply returns a symbol for infinity. You must find the book's index efficiently.`,

  // ---- Technical Layer ----
  description: `You are given access to a sorted array of unique integers through an 'ArrayReader' interface, but you do not know the size of the array. The 'ArrayReader.get(k)' method returns the element at index k, or a very large integer if k is out of bounds. Your task is to find the index of a given 'target'.

This problem requires a two-phase approach. First, you must find a search range for your target. Start with a small range and exponentially expand it (e.g., doubling the right boundary) until the element at the right boundary is greater than or equal to the target. Second, once you have established a valid range [left, right] that is guaranteed to contain the target (if it exists), perform a standard binary search within this range.

Return the 0-based index of the target. If the target does not exist, return -1.`,
  examples: [
    {
      input: '9\n-1 0 3 5 9 12',
      output: '4',
      explanation: 'The target 9 is found at index 4.'
    },
    {
      input: '2\n-1 0 3 5 9 12',
      output: '-1',
      explanation: 'The target 2 is not found in the array.'
    },
    {
      input: '0\n0',
      output: '0',
      explanation: 'Target 0 is at index 0.'
    }
  ],
  constraints: [
    'All integers in the array are unique.',
    'The array is sorted in ascending order.',
    'Values are between -9999 and 9999.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

using namespace std;

// Mocking the ArrayReader interface
class ArrayReader {
    vector<int> data;
public:
    ArrayReader(vector<int> arr) : data(arr) {}
    int get(int index) {
        if (index >= data.size()) return 2147483647;
        return data[index];
    }
};

int solve(ArrayReader& reader, int target) {
    // Your code here
    
    return -1;
}

int main() {
    int target, val;
    cin >> target;
    vector<int> arr;
    while (cin >> val) arr.push_back(val);
    
    ArrayReader reader(arr);
    cout << solve(reader, target) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.*;

class ArrayReader {
    private int[] data;
    public ArrayReader(int[] arr) { this.data = arr; }
    public int get(int index) {
        if (index >= data.length) return Integer.MAX_VALUE;
        return data[index];
    }
}

public class Main {
    public static int solve(ArrayReader reader, int target) {
        // Your code here
        
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int target = sc.nextInt();
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] arr = list.stream().mapToInt(i -> i).toArray();
        
        ArrayReader reader = new ArrayReader(arr);
        System.out.println(solve(reader, target));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '9\n-1 0 3 5 9 12', expected: '4' },
    { input: '2\n-1 0 3 5 9 12', expected: '-1' },
    { input: '0\n0', expected: '0' },
    { input: '1\n1', expected: '0' },
    { input: '100\n1 2 3 100', expected: '3' },
    { input: '0\n-5 0 5', expected: '1' },
    { input: '-1\n-1 0 1', expected: '0' },
    { input: '1\n-1 0 1', expected: '2' },
    { input: '1000\n1 10 100 1000', expected: '3' },
    { input: '-1000\n-1000 -500 0 500', expected: '0' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The solution is a two-step process. First, we must find a search boundary. We can do this by starting with a right boundary of 1 and doubling it until 'reader.get(right)' is greater than or equal to the target. This establishes a range [left, right] where the target might be. The 'left' pointer for this range will be the previous 'right' pointer. Once this range is found, perform a standard binary search within these bounds. During the binary search, use 'reader.get(mid)' to access elements. If 'reader.get(mid)' returns the out-of-bounds value, treat it as positive infinity and adjust the search range accordingly.`,
    cpp: `int right = 1;
while (reader.get(right) < target) {
    right *= 2;
}
int left = right / 2;

while (left <= right) {
    int mid = left + (right - left) / 2;
    int val = reader.get(mid);
    if (val == target) {
        return mid;
    } else if (val < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return -1;`,
    java: `int right = 1;
while (reader.get(right) < target) {
    right *= 2;
}
int left = right / 2;

while (left <= right) {
    int mid = left + (right - left) / 2;
    int val = reader.get(mid);
    if (val == target) {
        return mid;
    } else if (val < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return -1;`
  }
};