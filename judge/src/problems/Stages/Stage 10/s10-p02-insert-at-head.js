/**
 * Insert at Head - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of existing nodes.
 * Line 2: n space-separated integers (the initial list).
 * Line 3: An integer value to be inserted at the head.
 *
 * Output format (stdout):
 * The values of the linked list nodes separated by " -> " and ending with "NULL".
 */

module.exports = {
  // ---- Identity ----
  id: 'insert-at-head',
  conquestId: 'stage10-2',
  title: 'Insert at Head',
  difficulty: 'Easy',
  category: 'Linked List – Construction',
  tags: ['Linked List', 'Pointers'],

  // ---- Story Layer ----
  storyBriefing: `Neville, encouraged by your help, wants to add a fast-growing Mimbulus mimbletonia to the very front of his plant chain. Because this new plant needs the most sunlight, it must be the new head of the list. You need to perform this insertion and show him the updated chain.`,

  // ---- Technical Layer ----
  description: `You are given the head of a singly linked list and an integer 'val'. Your task is to insert a new node with this value at the beginning of the list. This is a fundamental O(1) operation for a linked list.

To insert at the head, you first create a new node with the given value. Then, you set the 'next' pointer of this new node to point to the current head of the list. Finally, you update the head of the list to be your new node.

Return the new head of the modified linked list.`,
  examples: [
    {
      input: '3\n1 2 3\n0',
      output: '0 -> 1 -> 2 -> 3 -> NULL',
      explanation: 'A new node with value 0 is created. Its `next` is set to the old head (1). The new node becomes the head.'
    },
    {
      input: '0\n\n5',
      output: '5 -> NULL',
      explanation: 'The list is initially empty. The new node becomes the head, and its `next` pointer is null.'
    },
    {
      input: '1\n10\n-5',
      output: '-5 -> 10 -> NULL',
      explanation: 'A new node with -5 is inserted at the front.'
    }
  ],
  constraints: [
    '0 <= n <= 1000',
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

Node* solve(Node* head, int val) {
    Node* newNode = new Node(val);
    newNode->next = head;
    return newNode;
}

void printList(Node* head) {
    while (head != nullptr) {
        cout << head->data << " -> ";
        head = head->next;
    }
    cout << "NULL" << endl;
}

int main() {
    int n, val, temp_val;
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
    cin >> val;
    
    head = solve(head, val);
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
    public static Node solve(Node head, int val) {
        Node newNode = new Node(val);
        newNode.next = head;
        return newNode;
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
        
        head = solve(head, val);
        printList(head);
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\n1 2 3\n0', expected: '0 -> 1 -> 2 -> 3 -> NULL' },
    { input: '0\n\n5', expected: '5 -> NULL' },
    { input: '1\n10\n-5', expected: '-5 -> 10 -> NULL' },
    { input: '5\n1 2 3 4 5\n0', expected: '0 -> 1 -> 2 -> 3 -> 4 -> 5 -> NULL' },
    { input: '2\n-1 -2\n0', expected: '0 -> -1 -> -2 -> NULL' }
  ],

  // ---- Solution ----
  solution: {
    approach: `To insert a node at the head of a linked list, first create a new node with the specified value. Then, set the 'next' pointer of this new node to the current head of the list. This links the new node to the rest of the list. Finally, update the head pointer to point to the new node, making it the new first element. This is an O(1) operation.`,
    cpp: `Node* newNode = new Node(val);
newNode->next = head;
return newNode;`,
    java: `Node newNode = new Node(val);
newNode.next = head;
return newNode;`
  }
};