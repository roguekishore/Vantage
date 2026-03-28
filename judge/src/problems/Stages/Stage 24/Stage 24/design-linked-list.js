/**
 * Design a Magical Scroll
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
  title: 'Design a Magical Scroll',
  difficulty: 'Medium',
  category: 'Data Structure Design',
  tags: ['Linked List', 'Design'],
  storyBriefing: `
You've been tasked with creating a "Scroll of Records" for the Ministry of Magic. This scroll magically keeps a list of important events or names in a specific order.

You need to design the underlying magic (the data structure) for this scroll. It must allow wizards to:
- Add an entry to the beginning (\`addHead\`).
- Add an entry to the end (\`addTail\`).
- Insert an entry at a specific position (\`addIndex\`).
- Delete an entry from a specific position (\`deleteIndex\`).
- Read an entry at a specific position (\`get\`).

This will be a fundamental piece of magical record-keeping!
`,
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
    cpp: `#include <iostream>

using namespace std;

class MyLinkedList {
public:
    struct Node {
        int val;
        Node* next;
        Node* prev;
        Node(int v) : val(v), next(nullptr), prev(nullptr) {}
    };

    Node* head;
    Node* tail;
    int size;

    MyLinkedList() {
        head = nullptr;
        tail = nullptr;
        size = 0;
    }

    int get(int index) {
        if (index < 0 || index >= size) return -1;
        Node* current = head;
        for (int i = 0; i < index; ++i) {
            current = current->next;
        }
        return current->val;
    }

    void addHead(int val) {
        Node* newNode = new Node(val);
        if (!head) {
            head = tail = newNode;
        } else {
            newNode->next = head;
            head->prev = newNode;
            head = newNode;
        }
        size++;
    }

    void addTail(int val) {
        Node* newNode = new Node(val);
        if (!tail) {
            head = tail = newNode;
        } else {
            tail->next = newNode;
            newNode->prev = tail;
            tail = newNode;
        }
        size++;
    }

    void addIndex(int index, int val) {
        if (index < 0 || index > size) return;
        if (index == 0) {
            addHead(val);
            return;
        }
        if (index == size) {
            addTail(val);
            return;
        }
        Node* current = head;
        for (int i = 0; i < index; ++i) {
            current = current->next;
        }
        Node* newNode = new Node(val);
        newNode->next = current;
        newNode->prev = current->prev;
        current->prev->next = newNode;
        current->prev = newNode;
        size++;
    }

    void deleteIndex(int index) {
        if (index < 0 || index >= size) return;
        if (index == 0) {
            Node* temp = head;
            head = head->next;
            if (head) head->prev = nullptr;
            else tail = nullptr;
            delete temp;
            size--;
            return;
        }
        if (index == size - 1) {
            Node* temp = tail;
            tail = tail->prev;
            if (tail) tail->next = nullptr;
            else head = nullptr;
            delete temp;
            size--;
            return;
        }
        Node* current = head;
        for (int i = 0; i < index; ++i) {
            current = current->next;
        }
        current->prev->next = current->next;
        current->next->prev = current->prev;
        delete current;
        size--;
    }
};

int main() {
    int q;
    cin >> q;
    MyLinkedList list;
    string op;
    for (int i = 0; i < q; ++i) {
        cin >> op;
        if (op == "addHead") {
            int val;
            cin >> val;
            list.addHead(val);
        } else if (op == "addTail") {
            int val;
            cin >> val;
            list.addTail(val);
        } else if (op == "addIndex") {
            int index, val;
            cin >> index >> val;
            list.addIndex(index, val);
        } else if (op == "deleteIndex") {
            int index;
            cin >> index;
            list.deleteIndex(index);
        } else if (op == "get") {
            int index;
            cin >> index;
            cout << list.get(index) << "\\n";
        }
    }
    return 0;
}`,
    java: `import java.util.Scanner;

class MyLinkedList {
    class Node {
        int val;
        Node next;
        Node prev;

        Node(int val) {
            this.val = val;
        }
    }

    private Node head;
    private Node tail;
    private int size;

    public MyLinkedList() {
        size = 0;
    }

    public int get(int index) {
        if (index < 0 || index >= size) {
            return -1;
        }
        Node current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        return current.val;
    }

    public void addHead(int val) {
        Node newNode = new Node(val);
        if (head == null) {
            head = tail = newNode;
        } else {
            newNode.next = head;
            head.prev = newNode;
            head = newNode;
        }
        size++;
    }

    public void addTail(int val) {
        Node newNode = new Node(val);
        if (tail == null) {
            head = tail = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        size++;
    }

    public void addIndex(int index, int val) {
        if (index < 0 || index > size) {
            return;
        }
        if (index == 0) {
            addHead(val);
            return;
        }
        if (index == size) {
            addTail(val);
            return;
        }
        Node current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        Node newNode = new Node(val);
        newNode.next = current;
        newNode.prev = current.prev;
        current.prev.next = newNode;
        current.prev = newNode;
        size++;
    }

    public void deleteIndex(int index) {
        if (index < 0 || index >= size) {
            return;
        }
        if (index == 0) {
            head = head.next;
            if (head != null) {
                head.prev = null;
            } else {
                tail = null;
            }
            size--;
            return;
        }
        if (index == size - 1) {
            tail = tail.prev;
            if (tail != null) {
                tail.next = null;
            } else {
                head = null;
            }
            size--;
            return;
        }
        Node current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        current.prev.next = current.next;
        current.next.prev = current.prev;
        size--;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int q = sc.nextInt();
        MyLinkedList list = new MyLinkedList();
        for (int i = 0; i < q; i++) {
            String op = sc.next();
            if (op.equals("addHead")) {
                list.addHead(sc.nextInt());
            } else if (op.equals("addTail")) {
                list.addTail(sc.nextInt());
            } else if (op.equals("addIndex")) {
                list.addIndex(sc.nextInt(), sc.nextInt());
            } else if (op.equals("deleteIndex")) {
                list.deleteIndex(sc.nextInt());
            } else if (op.equals("get")) {
                System.out.println(list.get(sc.nextInt()));
            }
        }
        sc.close();
    }
}`,
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