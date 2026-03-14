/**
 * LFU Cache — Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer `capacity` — capacity of the LFU cache
 *   Line 2: Integer `q` — number of operations
 *   Next q lines: Operations of two types:
 *     - `put key value`
 *     - `get key`
 *
 * Output format (stdout):
 *   For every `get` operation, print the value associated with the key.
 *   If the key does not exist, print `-1`.
 *   Each result must appear on a new line.
 */

module.exports = {
  id: 'lfu-cache',
  conquestId: 'stage24-4',
  title: 'LFU Cache',
  difficulty: 'Hard',
  category: 'Design',
  tags: ['Design', 'HashMap', 'Linked List', 'Frequency'],

  description: `
Design and implement a **Least Frequently Used (LFU) Cache**.

The LFU cache removes the key with the **lowest frequency of access** when the capacity is exceeded.  
If multiple keys have the same frequency, the **Least Recently Used (LRU)** among them is removed.

Implement the following operations:

- \`LFUCache(int capacity)\` → Initialize the cache with a given capacity.
- \`get(key)\` → Return the value of the key if present, otherwise return \`-1\`.
  Accessing the key **increases its frequency by 1**.
- \`put(key, value)\` → Insert or update the value of the key.
  If the cache exceeds capacity, remove the **least frequently used key**.
  If multiple keys share the same frequency, remove the **least recently used** among them.

Both operations must run in **O(1) average time complexity**.

A typical implementation uses:
- HashMap: key → node
- HashMap: frequency → doubly linked list
- Track minimum frequency
`,

  examples: [
    {
      input: `2
7
put 1 1
put 2 2
get 1
put 3 3
get 2
get 3
get 1`,
      output: `1
-1
3
1`,
      explanation:
        'Key 2 is evicted because it has lower frequency than key 1.',
    },
  ],

  constraints: [
    '0 ≤ capacity ≤ 10^4',
    '1 ≤ q ≤ 10^5',
    '0 ≤ key ≤ 10^5',
    '0 ≤ value ≤ 10^5',
    'At most 10^5 operations will be performed',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class LFUCache {
public:
    LFUCache(int capacity) {

    }

    int get(int key) {

    }

    void put(int key, int value) {

    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int capacity;
    cin >> capacity;

    int q;
    cin >> q;

    LFUCache cache(capacity);

    while (q--) {
        string op;
        cin >> op;

        if (op == "put") {
            int key, value;
            cin >> key >> value;
            cache.put(key, value);
        } else if (op == "get") {
            int key;
            cin >> key;
            cout << cache.get(key) << "\\n";
        }
    }

    return 0;
}
`,

    java: `import java.util.*;

class LFUCache {

    public LFUCache(int capacity) {

    }

    public int get(int key) {
        return -1;
    }

    public void put(int key, int value) {

    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int capacity = sc.nextInt();
        int q = sc.nextInt();

        LFUCache cache = new LFUCache(capacity);

        while (q-- > 0) {
            String op = sc.next();

            if (op.equals("put")) {
                int key = sc.nextInt();
                int value = sc.nextInt();
                cache.put(key, value);
            } else if (op.equals("get")) {
                int key = sc.nextInt();
                System.out.println(cache.get(key));
            }
        }

        sc.close();
    }
}
`,
  },

  testCases: [
    {
      input: `2
7
put 1 1
put 2 2
get 1
put 3 3
get 2
get 3
get 1`,
      expected: `1
-1
3
1`,
    },
    {
      input: `1
5
put 1 10
get 1
put 2 20
get 1
get 2`,
      expected: `10
-1
20`,
    },
    {
      input: `2
6
put 2 2
put 1 1
get 2
get 1
put 3 3
get 3`,
      expected: `2
1
3`,
    },
    {
      input: `2
5
put 1 10
put 2 20
put 3 30
get 1
get 3`,
      expected: `-1
30`,
    },
    {
      input: `3
7
put 1 1
put 2 2
put 3 3
get 1
get 1
put 4 4
get 2`,
      expected: `1
1
-1`,
    },
    {
      input: `0
3
put 1 1
get 1
put 2 2`,
      expected: `-1`,
    },
    {
      input: `2
8
put 1 5
put 2 6
get 1
get 1
put 3 7
get 2
get 3
get 1`,
      expected: `5
5
-1
7
5`,
    },
    {
      input: `3
6
put 10 100
put 20 200
put 30 300
get 10
get 20
get 30`,
      expected: `100
200
300`,
    },
  ],
};