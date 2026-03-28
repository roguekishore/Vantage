/**
 * LFU Cache - Problem Definition
 *
 * Input format (stdin):
 *   Line 1: Integer `capacity` - capacity of the LFU cache
 *   Line 2: Integer `q` - number of operations
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
  title: 'Design a Pensieve (LFU Cache)',
  difficulty: 'Hard',
  category: 'Data Structure Design',
  tags: ['Design', 'HashMap', 'Linked List', 'Frequency'],
  storyBriefing: `
You are tasked with designing a personal Pensieve, a magical basin used to store and review memories. A Pensieve has a limited capacity for how many memories it can hold at once.

Your Pensieve must be efficient. When it's full and a new memory needs to be added, it should automatically discard the **least frequently accessed** memory to make space. If there's a tie in frequency, it should discard the **least recently accessed** memory among them.

You need to implement:
- \`put(key, value)\`: Store or update a memory.
- \`get(key)\`: Retrieve a memory, which also counts as an access.

This advanced artifact will be a great asset for any powerful wizard.
`,

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
    cpp: `#include <iostream>
#include <unordered_map>
#include <list>

using namespace std;

class LFUCache {
    int capacity;
    int minFreq;
    unordered_map<int, pair<int, int>> keyVal; // key -> {value, freq}
    unordered_map<int, list<int>> freqKeys; // freq -> list of keys
    unordered_map<int, list<int>::iterator> keyIter; // key -> iterator in freqKeys list

    void updateFreq(int key) {
        int freq = keyVal[key].second;
        freqKeys[freq].erase(keyIter[key]);
        if (freqKeys[freq].empty() && freq == minFreq) {
            minFreq++;
        }
        
        freq++;
        keyVal[key].second = freq;
        freqKeys[freq].push_front(key);
        keyIter[key] = freqKeys[freq].begin();
    }

public:
    LFUCache(int capacity) {
        this->capacity = capacity;
        this->minFreq = 0;
    }

    int get(int key) {
        if (keyVal.find(key) == keyVal.end()) {
            return -1;
        }
        updateFreq(key);
        return keyVal[key].first;
    }

    void put(int key, int value) {
        if (capacity <= 0) return;

        if (keyVal.find(key) != keyVal.end()) {
            keyVal[key].first = value;
            updateFreq(key);
            return;
        }

        if (keyVal.size() >= capacity) {
            int key_to_evict = freqKeys[minFreq].back();
            freqKeys[minFreq].pop_back();
            keyVal.erase(key_to_evict);
            keyIter.erase(key_to_evict);
        }

        minFreq = 1;
        keyVal[key] = {value, 1};
        freqKeys[1].push_front(key);
        keyIter[key] = freqKeys[1].begin();
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int capacity;
    cin >> capacity;

    LFUCache cache(capacity);

    int q;
    cin >> q;
    string op;
    for (int i = 0; i < q; ++i) {
        cin >> op;
        if (op == "put") {
            int key, value;
            cin >> key >> value;
            cache.put(key, value);
        } else { // get
            int key;
            cin >> key;
            cout << cache.get(key) << "\\n";
        }
    }

    return 0;
}`,
    java: `import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Scanner;

class LFUCache {
    private HashMap<Integer, Integer> keyToVal;
    private HashMap<Integer, Integer> keyToFreq;
    private HashMap<Integer, LinkedHashSet<Integer>> freqToKeys;
    private int capacity;
    private int minFreq;

    public LFUCache(int capacity) {
        this.capacity = capacity;
        this.minFreq = 0;
        this.keyToVal = new HashMap<>();
        this.keyToFreq = new HashMap<>();
        this.freqToKeys = new HashMap<>();
    }

    public int get(int key) {
        if (!keyToVal.containsKey(key)) {
            return -1;
        }
        updateFreq(key);
        return keyToVal.get(key);
    }

    public void put(int key, int value) {
        if (capacity <= 0) {
            return;
        }

        if (keyToVal.containsKey(key)) {
            keyToVal.put(key, value);
            updateFreq(key);
            return;
        }

        if (keyToVal.size() >= capacity) {
            int keyToEvict = freqToKeys.get(minFreq).iterator().next();
            freqToKeys.get(minFreq).remove(keyToEvict);
            keyToVal.remove(keyToEvict);
            keyToFreq.remove(keyToEvict);
        }

        keyToVal.put(key, value);
        keyToFreq.put(key, 1);
        freqToKeys.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(key);
        minFreq = 1;
    }

    private void updateFreq(int key) {
        int freq = keyToFreq.get(key);
        freqToKeys.get(freq).remove(key);
        if (freqToKeys.get(freq).isEmpty()) {
            freqToKeys.remove(freq);
            if (freq == minFreq) {
                minFreq++;
            }
        }
        
        int newFreq = freq + 1;
        keyToFreq.put(key, newFreq);
        freqToKeys.computeIfAbsent(newFreq, k -> new LinkedHashSet<>()).add(key);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int capacity = sc.nextInt();
        LFUCache cache = new LFUCache(capacity);
        int q = sc.nextInt();
        for (int i = 0; i < q; i++) {
            String op = sc.next();
            if (op.equals("put")) {
                cache.put(sc.nextInt(), sc.nextInt());
            } else { // get
                System.out.println(cache.get(sc.nextInt()));
            }
        }
        sc.close();
    }
}`,
  },

  solution: {
    cpp: `#include <iostream>
#include <unordered_map>
#include <list>

using namespace std;

class LFUCache {
    int capacity;
    int minFreq;
    unordered_map<int, pair<int, int>> keyVal; // key -> {value, freq}
    unordered_map<int, list<int>> freqKeys; // freq -> list of keys
    unordered_map<int, list<int>::iterator> keyIter; // key -> iterator in freqKeys list

    void updateFreq(int key) {
        int freq = keyVal[key].second;
        freqKeys[freq].erase(keyIter[key]);
        if (freqKeys[freq].empty() && freq == minFreq) {
            minFreq++;
        }
        
        freq++;
        keyVal[key].second = freq;
        freqKeys[freq].push_front(key);
        keyIter[key] = freqKeys[freq].begin();
    }

public:
    LFUCache(int capacity) {
        this->capacity = capacity;
        this->minFreq = 0;
    }

    int get(int key) {
        if (keyVal.find(key) == keyVal.end()) {
            return -1;
        }
        updateFreq(key);
        return keyVal[key].first;
    }

    void put(int key, int value) {
        if (capacity <= 0) return;

        if (keyVal.find(key) != keyVal.end()) {
            keyVal[key].first = value;
            updateFreq(key);
            return;
        }

        if (keyVal.size() >= capacity) {
            int key_to_evict = freqKeys[minFreq].back();
            freqKeys[minFreq].pop_back();
            keyVal.erase(key_to_evict);
            keyIter.erase(key_to_evict);
        }

        minFreq = 1;
        keyVal[key] = {value, 1};
        freqKeys[1].push_front(key);
        keyIter[key] = freqKeys[1].begin();
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    int capacity;
    cin >> capacity;

    LFUCache cache(capacity);

    int q;
    cin >> q;
    string op;
    for (int i = 0; i < q; ++i) {
        cin >> op;
        if (op == "put") {
            int key, value;
            cin >> key >> value;
            cache.put(key, value);
        } else { // get
            int key;
            cin >> key;
            cout << cache.get(key) << "\\n";
        }
    }

    return 0;
}`,
    java: `import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Scanner;

class LFUCache {
    private HashMap<Integer, Integer> keyToVal;
    private HashMap<Integer, Integer> keyToFreq;
    private HashMap<Integer, LinkedHashSet<Integer>> freqToKeys;
    private int capacity;
    private int minFreq;

    public LFUCache(int capacity) {
        this.capacity = capacity;
        this.minFreq = 0;
        this.keyToVal = new HashMap<>();
        this.keyToFreq = new HashMap<>();
        this.freqToKeys = new HashMap<>();
    }

    public int get(int key) {
        if (!keyToVal.containsKey(key)) {
            return -1;
        }
        updateFreq(key);
        return keyToVal.get(key);
    }

    public void put(int key, int value) {
        if (capacity <= 0) {
            return;
        }

        if (keyToVal.containsKey(key)) {
            keyToVal.put(key, value);
            updateFreq(key);
            return;
        }

        if (keyToVal.size() >= capacity) {
            int keyToEvict = freqToKeys.get(minFreq).iterator().next();
            freqToKeys.get(minFreq).remove(keyToEvict);
            keyToVal.remove(keyToEvict);
            keyToFreq.remove(keyToEvict);
        }

        keyToVal.put(key, value);
        keyToFreq.put(key, 1);
        freqToKeys.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(key);
        minFreq = 1;
    }

    private void updateFreq(int key) {
        int freq = keyToFreq.get(key);
        freqToKeys.get(freq).remove(key);
        if (freqToKeys.get(freq).isEmpty()) {
            freqToKeys.remove(freq);
            if (freq == minFreq) {
                minFreq++;
            }
        }
        
        int newFreq = freq + 1;
        keyToFreq.put(key, newFreq);
        freqToKeys.computeIfAbsent(newFreq, k -> new LinkedHashSet<>()).add(key);
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int capacity = sc.nextInt();
        LFUCache cache = new LFUCache(capacity);
        int q = sc.nextInt();
        for (int i = 0; i < q; i++) {
            String op = sc.next();
            if (op.equals("put")) {
                cache.put(sc.nextInt(), sc.nextInt());
            } else { // get
                System.out.println(cache.get(sc.nextInt()));
            }
        }
        sc.close();
    }
}`,
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