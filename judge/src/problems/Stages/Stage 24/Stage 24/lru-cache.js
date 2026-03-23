/**
 * LRU Cache - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer `capacity` - the capacity of the LRU cache.
 *   Line 2: An integer `q` - the number of operations.
 *   Next q lines: Each line represents an operation:
 *     - `put key value`
 *     - `get key`
 *
 * Output format (stdout):
 *   For every `get` operation, print the value associated with the key.
 *   If the key does not exist, print `-1`.
 *   Each output should appear on a new line in the order of the `get` operations.
 */

module.exports = {
  id: 'lru-cache',
  conquestId: 'stage24-3',
  title: 'LRU Cache',
  difficulty: 'Medium',
  category: 'Design',
  tags: ['Design', 'HashMap', 'Linked List'],

  description: `
Design a data structure that follows the **Least Recently Used (LRU)** cache policy.

Implement the **LRUCache** class with the following operations:

- \`LRUCache(int capacity)\` Initializes the cache with a positive size capacity.
- \`get(key)\` Returns the value of the key if it exists in the cache, otherwise returns \`-1\`.
- \`put(key, value)\` Updates the value of the key if it exists. Otherwise, adds the key-value pair to the cache.  
  If the number of keys exceeds the capacity, evict the **least recently used key**.

The operations **get** and **put** must run in **O(1)** average time complexity.

Typically this is implemented using a **HashMap + Doubly Linked List**.
`,

  examples: [
    {
      input: `2
6
put 1 1
put 2 2
get 1
put 3 3
get 2
get 3`,
      output: `1
-1
3`,
      explanation:
        'Cache capacity = 2. After inserting (1,1) and (2,2), get(1)=1. put(3,3) evicts key 2. get(2)=-1. get(3)=3.',
    },
  ],

  constraints: [
    '1 ≤ capacity ≤ 10⁴',
    '1 ≤ q ≤ 10⁵',
    '0 ≤ key ≤ 10⁵',
    '0 ≤ value ≤ 10⁵',
    'At most 10⁵ operations will be performed',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class LRUCache {
public:
    LRUCache(int capacity) {
        
    }

    int get(int key) {
        return -1;
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

    LRUCache cache(capacity);

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

class LRUCache {

    public LRUCache(int capacity) {
        
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

        LRUCache cache = new LRUCache(capacity);

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
6
put 1 1
put 2 2
get 1
put 3 3
get 2
get 3`,
      expected: `1
-1
3`,
    },
    {
      input: `1
5
put 1 1
get 1
put 2 2
get 1
get 2`,
      expected: `1
-1
2`,
    },
    {
      input: `2
5
put 2 1
put 1 1
put 2 3
get 2
get 1`,
      expected: `3
1`,
    },
    {
      input: `2
4
get 5
put 5 10
get 5
get 1`,
      expected: `-1
10
-1`,
    },
    {
      input: `3
7
put 1 10
put 2 20
put 3 30
get 2
put 4 40
get 1
get 4`,
      expected: `20
-1
40`,
    },
    {
      input: `2
7
put 1 1
put 2 2
get 2
put 3 3
get 1
get 3
get 2`,
      expected: `2
-1
3
2`,
    },
    {
      input: `3
6
put 1 1
put 2 2
put 3 3
get 1
get 2
get 3`,
      expected: `1
2
3`,
    },
    {
      input: `2
8
put 1 5
put 2 6
get 1
put 3 7
get 2
put 4 8
get 1
get 4`,
      expected: `5
-1
-1
8`,
    },
    {
      input: `1
4
put 1 100
put 2 200
get 1
get 2`,
      expected: `-1
200`,
    },
  ],
};