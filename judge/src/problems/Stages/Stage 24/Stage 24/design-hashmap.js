/**
 * Design HashMap - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: An integer q representing the number of operations
 *   Next q lines: Each line represents an operation in one of the following forms:
 *     put key value
 *     get key
 *     remove key
 *
 * Output format (stdout):
 *   For every "get" operation, print the value associated with the key.
 *   If the key does not exist, print -1.
 */

module.exports = {
  id: 'design-hashmap',
  conquestId: 'stage24-1',
  title: "Design a Remembrall",
  difficulty: 'Easy',
  category: 'Data Structure Design',
  tags: ['Hash Table', 'Design', 'Array'],
  storyBriefing: `
Welcome to the Department of Magical Artifacts! Your first assignment is to design a "Remembrall," a magical sphere that helps wizards remember things.

You need to create a system that can store memories (key-value pairs), retrieve them, and remove them. This artifact will be crucial for Ministry officials who have too much on their minds.
`,
  description: `
Design a **HashMap** without using any built-in hash table libraries.

Implement the **MyHashMap** class with the following operations:

- **put(key, value)** - Insert a *(key, value)* pair into the HashMap.  
  If the key already exists, update the value.

- **get(key)** - Return the value associated with the key.  
  If the key does not exist, return **-1**.

- **remove(key)** - Remove the key and its corresponding value if it exists.

Typical Approach:

Use **separate chaining** or **open addressing** to handle collisions.

Example implementation strategies:
- Array of buckets with linked lists
- Array of vectors
- Fixed size hash table with modulo hashing

Example hash function:

\`index = key % bucketSize\`

Time Complexity (Average):
- **put** → O(1)
- **get** → O(1)
- **remove** → O(1)
`,

  examples: [
    {
      input: '7\nput 1 1\nput 2 2\nget 1\nget 3\nput 2 1\nget 2\nremove 2',
      output: '1\n-1\n1',
      explanation:
        'Key 1 returns 1. Key 3 does not exist. Key 2 updated to value 1.'
    }
  ],

  constraints: [
    '1 ≤ q ≤ 10^4',
    '0 ≤ key, value ≤ 10^6'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <list>

using namespace std;

class MyHashMap {
private:
    vector<list<pair<int, int>>> buckets;
    int size = 1000;

    int hash(int key) {
        return key % size;
    }

public:
    MyHashMap() {
        buckets.resize(size);
    }
    
    void put(int key, int value) {
        int index = hash(key);
        for (auto it = buckets[index].begin(); it != buckets[index].end(); ++it) {
            if (it->first == key) {
                it->second = value;
                return;
            }
        }
        buckets[index].push_back({key, value});
    }
    
    int get(int key) {
        int index = hash(key);
        for (auto const& [k, v] : buckets[index]) {
            if (k == key) {
                return v;
            }
        }
        return -1;
    }
    
    void remove(int key) {
        int index = hash(key);
        buckets[index].remove_if([key](const pair<int, int>& p) {
            return p.first == key;
        });
    }
};

int main() {
    int q;
    cin >> q;

    MyHashMap map;
    string op;

    for (int i = 0; i < q; ++i) {
        cin >> op;
        if (op == "put") {
            int key, value;
            cin >> key >> value;
            map.put(key, value);
        } else if (op == "get") {
            int key;
            cin >> key;
            cout << map.get(key) << "\\n";
        } else if (op == "remove") {
            int key;
            cin >> key;
            map.remove(key);
        }
    }

    return 0;
}`,
    java: `import java.util.*;

class MyHashMap {
    private class Node {
        int key, value;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private Node[] buckets;
    private int size = 1000;

    public MyHashMap() {
        buckets = new Node[size];
    }

    private int hash(int key) {
        return key % size;
    }

    public void put(int key, int value) {
        int index = hash(key);
        if (buckets[index] == null) {
            buckets[index] = new Node(key, value);
            return;
        }
        Node prev = null;
        Node current = buckets[index];
        while (current != null) {
            if (current.key == key) {
                current.value = value;
                return;
            }
            prev = current;
            current = current.next;
        }
        prev.next = new Node(key, value);
    }

    public int get(int key) {
        int index = hash(key);
        Node current = buckets[index];
        while (current != null) {
            if (current.key == key) {
                return current.value;
            }
            current = current.next;
        }
        return -1;
    }

    public void remove(int key) {
        int index = hash(key);
        if (buckets[index] == null) return;
        
        if (buckets[index].key == key) {
            buckets[index] = buckets[index].next;
            return;
        }

        Node prev = buckets[index];
        Node current = buckets[index].next;
        while (current != null) {
            if (current.key == key) {
                prev.next = current.next;
                return;
            }
            prev = current;
            current = current.next;
        }
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int q = sc.nextInt();

        MyHashMap map = new MyHashMap();

        for (int i = 0; i < q; ++i) {
            String op = sc.next();
            if (op.equals("put")) {
                int key = sc.nextInt();
                int value = sc.nextInt();
                map.put(key, value);
            } else if (op.equals("get")) {
                int key = sc.nextInt();
                System.out.println(map.get(key));
            } else if (op.equals("remove")) {
                int key = sc.nextInt();
                map.remove(key);
            }
        }
        sc.close();
    }
}`
  },

  solution: {
    cpp: `#include <iostream>
#include <vector>
#include <list>

using namespace std;

class MyHashMap {
private:
    vector<list<pair<int, int>>> buckets;
    int size = 1000;

    int hash(int key) {
        return key % size;
    }

public:
    MyHashMap() {
        buckets.resize(size);
    }
    
    void put(int key, int value) {
        int index = hash(key);
        for (auto it = buckets[index].begin(); it != buckets[index].end(); ++it) {
            if (it->first == key) {
                it->second = value;
                return;
            }
        }
        buckets[index].push_back({key, value});
    }
    
    int get(int key) {
        int index = hash(key);
        for (auto const& [k, v] : buckets[index]) {
            if (k == key) {
                return v;
            }
        }
        return -1;
    }
    
    void remove(int key) {
        int index = hash(key);
        buckets[index].remove_if([key](const pair<int, int>& p) {
            return p.first == key;
        });
    }
};

int main() {
    int q;
    cin >> q;

    MyHashMap map;
    string op;

    for (int i = 0; i < q; ++i) {
        cin >> op;
        if (op == "put") {
            int key, value;
            cin >> key >> value;
            map.put(key, value);
        } else if (op == "get") {
            int key;
            cin >> key;
            cout << map.get(key) << "\\n";
        } else if (op == "remove") {
            int key;
            cin >> key;
            map.remove(key);
        }
    }

    return 0;
}`,
    java: `import java.util.*;

class MyHashMap {
    private class Node {
        int key, value;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private Node[] buckets;
    private int size = 1000;

    public MyHashMap() {
        buckets = new Node[size];
    }

    private int hash(int key) {
        return key % size;
    }

    public void put(int key, int value) {
        int index = hash(key);
        if (buckets[index] == null) {
            buckets[index] = new Node(key, value);
            return;
        }
        Node prev = null;
        Node current = buckets[index];
        while (current != null) {
            if (current.key == key) {
                current.value = value;
                return;
            }
            prev = current;
            current = current.next;
        }
        prev.next = new Node(key, value);
    }

    public int get(int key) {
        int index = hash(key);
        Node current = buckets[index];
        while (current != null) {
            if (current.key == key) {
                return current.value;
            }
            current = current.next;
        }
        return -1;
    }

    public void remove(int key) {
        int index = hash(key);
        if (buckets[index] == null) return;
        
        if (buckets[index].key == key) {
            buckets[index] = buckets[index].next;
            return;
        }

        Node prev = buckets[index];
        Node current = buckets[index].next;
        while (current != null) {
            if (current.key == key) {
                prev.next = current.next;
                return;
            }
            prev = current;
            current = current.next;
        }
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int q = sc.nextInt();

        MyHashMap map = new MyHashMap();

        for (int i = 0; i < q; ++i) {
            String op = sc.next();
            if (op.equals("put")) {
                int key = sc.nextInt();
                int value = sc.nextInt();
                map.put(key, value);
            } else if (op.equals("get")) {
                int key = sc.nextInt();
                System.out.println(map.get(key));
            } else if (op.equals("remove")) {
                int key = sc.nextInt();
                map.remove(key);
            }
        }
        sc.close();
    }
}`
  },

  testCases: [
    {
      input: '7\nput 1 1\nput 2 2\nget 1\nget 3\nput 2 1\nget 2\nremove 2',
      expected: '1\n-1\n1'
    },
    {
      input: '5\nput 5 10\nget 5\nremove 5\nget 5\nget 1',
      expected: '10\n-1\n-1'
    },
    {
      input: '4\nput 100 200\nget 100\nput 100 300\nget 100',
      expected: '200\n300'
    },
    {
      input: '3\nget 10\nget 20\nget 30',
      expected: '-1\n-1\n-1'
    },
    {
      input: '6\nput 1 10\nput 2 20\nremove 1\nget 1\nget 2\nget 3',
      expected: '-1\n20\n-1'
    },
    {
      input: '4\nput 0 5\nget 0\nremove 0\nget 0',
      expected: '5\n-1'
    },
    {
      input: '6\nput 10 100\nput 20 200\nput 30 300\nget 10\nget 20\nget 30',
      expected: '100\n200\n300'
    },
    {
      input: '5\nput 7 7\nput 7 8\nget 7\nremove 7\nget 7',
      expected: '8\n-1'
    },
    {
      input: '4\nput 999999 1\nget 999999\nremove 999999\nget 999999',
      expected: '1\n-1'
    },
    {
      input: '5\nput 3 30\nput 4 40\nremove 3\nget 3\nget 4',
      expected: '-1\n40'
    }
  ],
};