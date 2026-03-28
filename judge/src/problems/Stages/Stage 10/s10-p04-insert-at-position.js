/**
 * Insert at Position - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of existing nodes.
 * Line 2: n space-separated integers (the initial list).
 * Line 3: Two space-separated integers: val (to insert) and pos (0-based index).
 *
 * Output format (stdout):
 * The values of the linked list nodes separated by " -> " and ending with "NULL".
 */

module.exports = {
  // ---- Identity ----
  id: 'insert-at-position',
  conquestId: 'stage10-4',
  title: 'Insert at Position',
  difficulty: 'Easy',
  category: 'Linked List – Construction',
  tags: ['Linked List', 'Pointers', 'Traversal'],

  // ---- Story Layer ----
  storyBriefing: `Professor Sprout is impressed. 'One last test of your cultivation skills,' she says. She gives you a new seedling ('val') and a specific position ('pos') in the plant chain. You must carefully insert the new seedling at that exact spot without disturbing the rest of the chain.`,

  // ---- Technical Layer ----
  description: `You are given the head of a singly linked list, an integer 'val', and a 0-based index 'pos'. Your task is to insert a new node with the value 'val' at the specified position in the list.

To solve this, handle the case where 'pos' is 0 as an insertion at the head. Otherwise, you need to traverse the list to find the node at position 'pos - 1'. Once you have this 'previous' node, create your new node, link its 'next' pointer to 'previous.next', and then update 'previous.next' to point to your new node. Be sure to handle edge cases, such as inserting at the end of the list.

Return the head of the modified linked list.`,
  examples: [
    {
      input: '3\n10 20 30\n15 1',
      output: '10 -> 15 -> 20 -> 30 -> NULL',
      explanation: 'Traverse to index 0 (node 10). Insert the new node (15) after it. The new node now points to the original node at index 1 (node 20).'
    },
    {
      input: '2\n1 2\n0 0',
      output: '0 -> 1 -> 2 -> NULL',
      explanation: 'Inserting at position 0 is the same as inserting at the head.'
    },
    {
      input: '2\n1 2\n3 2',
      output: '1 -> 2 -> 3 -> NULL',
      explanation: 'Inserting at a position equal to the list length is the same as inserting at the tail.'
    }
  ],
  constraints: [
    '0 <= n <= 1000',
    '0 <= pos <= n',
    '-10^5 <= val <= 10^5'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* solve(Node* head, int val, int pos) {
    Node* newNode = new Node(val);
    if (pos == 0) {
        newNode->next = head;
        return newNode;
    }
    
    Node* prev = head;
    for (int i = 0; i < pos - 1; ++i) {
        if (prev == nullptr) return head; // Position is out of bounds
        prev = prev->next;
    }
    if (prev == nullptr) return head; // Position is out of bounds

    newNode->next = prev->next;
    prev->next = newNode;
    
    return head; 
}

void printList(Node* head) {
    while (head != nullptr) {
        cout << head->data << " -> ";
        head = head->next;
    }
    cout << "NULL" << endl;
}

int main() {
    int n, val, pos, temp_val;
    if (!(cin >> n)) return 0;
    Node* head = nullptr;
    Node* tail = nullptr;
    for (int i = 0; i < n; i++) {
        cin >> temp_val;
        Node* newNode = new Node(temp_val);
        if (!head) head = newNode;
        else tail->next = newNode;
        tail = newNode;
    }
    cin >> val >> pos;
    
    head = solve(head, val, pos);
    printList(head);
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

class Node {
    int data;
    Node next;
    Node(int data) {
        this.data = data;
        this.next = null;
    }
}

public class Main {
    public static Node solve(Node head, int val, int pos) {
        Node newNode = new Node(val);
        if (pos == 0) {
            newNode.next = head;
            return newNode;
        }
        
        Node prev = head;
        for (int i = 0; i < pos - 1; i++) {
            if (prev == null) return head; // Position is out of bounds
            prev = prev.next;
        }
        if (prev == null) return head; // Position is out of bounds

        newNode.next = prev.next;
        prev.next = newNode;
        
        return head;
    }

    public static void printList(Node head) {
        Node temp = head;
        while (temp != null) {
            System.out.print(temp.data + " -> ");
            temp = temp.next;
        }
        System.out.println("NULL");
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        Node head = null, tail = null;
        for (int i = 0; i < n; i++) {
            int data = sc.nextInt();
            Node newNode = new Node(data);
            if (head == null) head = newNode;
            else tail.next = newNode;
            tail = newNode;
        }
        int val = sc.nextInt();
        int pos = sc.nextInt();
        
        head = solve(head, val, pos);
        printList(head);
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\n10 20 30\n15 1', expected: '10 -> 15 -> 20 -> 30 -> NULL' },
    { input: '2\n1 2\n0 0', expected: '0 -> 1 -> 2 -> NULL' },
    { input: '2\n1 2\n3 2', expected: '1 -> 2 -> 3 -> NULL' },
    { input: '0\n\n100 0', expected: '100 -> NULL' },
    { input: '1\n10\n5 0', expected: '5 -> 10 -> NULL' },
    { input: '1\n10\n20 1', expected: '10 -> 20 -> NULL' }
  ],

  // ---- Solution ----
  solution: {
    approach: `To insert a node at a specific position, first handle the edge case of inserting at the head (position 0). For other positions, traverse the list to find the node at 'pos - 1'. A 'current' pointer and a counter can be used for this traversal. Once you reach the node at 'pos - 1', insert the new node by setting its 'next' pointer to the 'current' node's next, and then updating the 'current' node's 'next' to point to the new node. Ensure you handle the case where 'pos' is out of bounds gracefully.`,
    cpp: `Node* prev = head;
for (int i = 0; i < pos - 1; ++i) {
    if (prev == nullptr) return head; // Position is out of bounds
    prev = prev->next;
}
if (prev == nullptr) return head; // Position is out of bounds

newNode->next = prev->next;
prev->next = newNode;

return head;`,
    java: `Node prev = head;
for (int i = 0; i < pos - 1; i++) {
    if (prev == null) return head; // Position is out of bounds
    prev = prev.next;
}
if (prev == null) return head; // Position is out of bounds

newNode.next = prev.next;
prev.next = newNode;

return head;`
  }
};