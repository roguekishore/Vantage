/**
 * Insert at Tail - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of existing nodes.
 * Line 2: n space-separated integers (the initial list).
 * Line 3: An integer value to be inserted at the tail.
 *
 * Output format (stdout):
 * The values of the linked list nodes separated by " -> " and ending with "NULL".
 */

module.exports = {
  // ---- Identity ----
  id: 'insert-at-tail',
  conquestId: 'stage10-3',
  title: 'Insert at Tail',
  difficulty: 'Easy',
  category: 'Linked List – Construction',
  tags: ['Linked List', 'Pointers', 'Traversal'],

  // ---- Story Layer ----
  storyBriefing: `Professor Sprout now asks you to add a Devil's Snare seedling to the end of an existing chain of plants. Unlike inserting at the head, this requires you to traverse the entire chain to find the very last plant before you can add the new one.`,

  // ---- Technical Layer ----
  description: `You are given the head of a singly linked list and an integer 'val'. Your task is to insert a new node with this value at the end (tail) of the list. This operation requires traversing the list to find the last node.

First, create a new node with the given value. If the list is empty (head is null), the new node simply becomes the head. Otherwise, you must start from the head and iterate through the list using a temporary pointer until you reach the last node (the one whose 'next' pointer is null). Once you find the last node, update its 'next' pointer to point to your new node.

Return the original head of the list.`,
  examples: [
    {
      input: '3\n1 2 3\n4',
      output: '1 -> 2 -> 3 -> 4 -> NULL',
      explanation: 'Traverse to the end (node 3) and set its `next` pointer to the new node with value 4.'
    },
    {
      input: '0\n\n10',
      output: '10 -> NULL',
      explanation: 'The list is empty, so the new node becomes the head.'
    },
    {
      input: '1\n-5\n-10',
      output: '-5 -> -10 -> NULL',
      explanation: 'Traverse to the first node (which is also the last) and attach the new node.'
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
    if (head == nullptr) return newNode;
    
    Node* current = head;
    while (current->next != nullptr) {
        current = current->next;
    }
    current->next = newNode;
    
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
        if (head == null) return newNode;
        
        Node current = head;
        while (current.next != null) {
            current = current.next;
        }
        current.next = newNode;
        
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
        
        head = solve(head, val);
        printList(head);
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\n1 2 3\n4', expected: '1 -> 2 -> 3 -> 4 -> NULL' },
    { input: '0\n\n10', expected: '10 -> NULL' },
    { input: '1\n-5\n-10', expected: '-5 -> -10 -> NULL' },
    { input: '5\n1 1 1 1 1\n1', expected: '1 -> 1 -> 1 -> 1 -> 1 -> 1 -> NULL' },
    { input: '2\n-1 0\n1', expected: '-1 -> 0 -> 1 -> NULL' }
  ],

  // ---- Solution ----
  solution: {
    approach: `To insert a node at the tail, first, create the new node. Handle the edge case where the list is empty by returning the new node as the head. If the list is not empty, create a 'current' pointer starting at the head. Traverse the list by moving 'current' to 'current.next' until 'current.next' is null, which indicates you are at the last node. Finally, set 'current.next' to point to the new node.`,
    cpp: `Node* current = head;
while (current->next != nullptr) {
    current = current->next;
}
current->next = newNode;
return head;`,
    java: `Node current = head;
while (current.next != null) {
    current = current.next;
}
current.next = newNode;
return head;`
  }
};