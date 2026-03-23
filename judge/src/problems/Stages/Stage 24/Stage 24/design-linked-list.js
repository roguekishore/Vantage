/**
 * Design Linked List - Problem Definition
 *
 * Input format (stdin):
 *   The first line contains an integer q - the number of operations.
 *   The next q lines contain operations in one of the following formats:
 *
 *   addHead x        → Add node with value x at the beginning
 *   addTail x        → Add node with value x at the end
 *   addIndex i x     → Insert value x at index i (0-based)
 *   deleteIndex i    → Delete node at index i
 *   get i            → Get value of node at index i
 *
 * Output format (stdout):
 *   For every `get` operation, print the value of the node at index i.
 *   If the index is invalid, print -1.
 */

module.exports = {
  id: 'design-linked-list',
  conquestId: 'stage10-7',
  title: 'Design Linked List',
  difficulty: 'Medium',
  category: 'Linked List',
  tags: ['Linked List', 'Design'],

  description: `Design and implement your own **Linked List** data structure.

Your linked list should support the following operations:

- **addHead(x)** → Insert a node with value \`x\` at the beginning of the list.
- **addTail(x)** → Append a node with value \`x\` at the end of the list.
- **addIndex(i, x)** → Insert a node with value \`x\` at index \`i\` (0-based).
  - If \`i\` equals the length of the list, the node is appended.
  - If \`i\` is greater than the length, the operation is ignored.
- **deleteIndex(i)** → Delete the node at index \`i\`, if it exists.
- **get(i)** → Return the value of the node at index \`i\`.
  - If the index is invalid, return **-1**.

The input will contain a sequence of operations.  
For every **get** operation, output the corresponding result.

You may implement the list using a **singly linked list** or **doubly linked list**.`,

  examples: [
    {
      input: `7
addHead 1
addTail 3
addIndex 1 2
get 1
deleteIndex 1
get 1
get 3`,
      output: `2
3
-1`,
      explanation:
        'List becomes [1,2,3]. get(1)=2. After deleting index 1 → [1,3]. get(1)=3. get(3) invalid → -1.',
    },
  ],

  constraints: [
    '1 ≤ q ≤ 10^5',
    '-10^4 ≤ value ≤ 10^4',
    '0 ≤ index ≤ 10^4',
  ],

  boilerplate: {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class MyLinkedList {
public:
    struct Node {
        int val;
        Node* next;
        Node(int v) : val(v), next(nullptr) {}
    };

    Node* head;

    MyLinkedList() {
        head = nullptr;
    }

    int get(int index) {
        // TODO: implement
        return -1;
    }

    void addHead(int val) {
        // TODO: implement
    }

    void addTail(int val) {
        // TODO: implement
    }

    void addIndex(int index, int val) {
        // TODO: implement
    }

    void deleteIndex(int index) {
        // TODO: implement
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int q;
    cin >> q;
    cin.ignore();

    MyLinkedList list;
    string op;

    for(int i = 0; i < q; i++) {
        cin >> op;

        if(op == "addHead") {
            int x; cin >> x;
            list.addHead(x);
        }
        else if(op == "addTail") {
            int x; cin >> x;
            list.addTail(x);
        }
        else if(op == "addIndex") {
            int idx, x;
            cin >> idx >> x;
            list.addIndex(idx, x);
        }
        else if(op == "deleteIndex") {
            int idx;
            cin >> idx;
            list.deleteIndex(idx);
        }
        else if(op == "get") {
            int idx;
            cin >> idx;
            cout << list.get(idx) << "\\n";
        }
    }

    return 0;
}
`,

    java: `import java.util.*;

class MyLinkedList {

    class Node {
        int val;
        Node next;
        Node(int v) { val = v; }
    }

    Node head;

    public MyLinkedList() {
        head = null;
    }

    public int get(int index) {
        // TODO: implement
        return -1;
    }

    public void addHead(int val) {
        // TODO: implement
    }

    public void addTail(int val) {
        // TODO: implement
    }

    public void addIndex(int index, int val) {
        // TODO: implement
    }

    public void deleteIndex(int index) {
        // TODO: implement
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int q = sc.nextInt();
        MyLinkedList list = new MyLinkedList();

        for(int i = 0; i < q; i++) {
            String op = sc.next();

            if(op.equals("addHead")) {
                int x = sc.nextInt();
                list.addHead(x);
            }
            else if(op.equals("addTail")) {
                int x = sc.nextInt();
                list.addTail(x);
            }
            else if(op.equals("addIndex")) {
                int idx = sc.nextInt();
                int x = sc.nextInt();
                list.addIndex(idx, x);
            }
            else if(op.equals("deleteIndex")) {
                int idx = sc.nextInt();
                list.deleteIndex(idx);
            }
            else if(op.equals("get")) {
                int idx = sc.nextInt();
                System.out.println(list.get(idx));
            }
        }

        sc.close();
    }
}
`,
  },

  testCases: [
    {
      input: `7
addHead 1
addTail 3
addIndex 1 2
get 1
deleteIndex 1
get 1
get 3`,
      expected: `2
3
-1`,
    },
    {
      input: `5
addHead 10
get 0
get 1
deleteIndex 0
get 0`,
      expected: `10
-1
-1`,
    },
    {
      input: `6
addTail 5
addTail 6
addTail 7
get 2
get 0
get 5`,
      expected: `7
5
-1`,
    },
    {
      input: `6
addHead 4
addHead 3
addHead 2
get 0
get 1
get 2`,
      expected: `2
3
4`,
    },
    {
      input: `6
addTail 1
addTail 2
addTail 3
deleteIndex 1
get 1
get 2`,
      expected: `3
-1`,
    },
    {
      input: `7
addTail 1
addTail 2
addIndex 2 3
addIndex 1 4
get 0
get 1
get 2`,
      expected: `1
4
2`,
    },
    {
      input: `4
addIndex 1 10
get 0
addHead 8
get 0`,
      expected: `-1
8`,
    },
    {
      input: `5
addTail 100
addTail 200
addTail 300
deleteIndex 0
get 0`,
      expected: `200`,
    },
    {
      input: `5
addHead -1
addHead -2
addHead -3
get 1
get 2`,
      expected: `-2
-1`,
    },
  ],
};