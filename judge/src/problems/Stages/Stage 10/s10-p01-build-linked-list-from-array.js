/**
 * Build Linked List from Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the size of the array.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * The values of the linked list nodes separated by " -> " and ending with "NULL".
 */

module.exports = {
  // ---- Identity ----
  id: 'build-linked-list-from-array',
  conquestId: 'stage10-1',
  title: 'Build Linked List from Array',
  difficulty: 'Easy',
  category: 'Linked List – Construction',
  tags: ['Linked List', 'Array', 'Data Structure'],

  // ---- Story Layer ----
  stageIntro: `After mastering the art of efficient searching, your attention turns to a new area of magic: Herbology with Professor Sprout. Unlike books on a shelf, many magical plants are connected in chains, like nodes in a sequence. Understanding how to build and manipulate these chains is fundamental. Professor Sprout introduces you to your first task: cultivating a chain of Fanged Geraniums from a given set of seeds.`,
  storyBriefing: `Professor Sprout gives you a container of seeds, represented by an array of integers. She asks you to plant them in a row, creating a 'linked list' of geraniums. Each plant must be linked to the next one in the sequence. Your task is to take the array of seeds and construct this chain, returning the very first plant (the 'head') of your newly grown list.`,

  // ---- Technical Layer ----
  description: `You are given an array of n integers. Your task is to convert this array into a singly linked list, where each element of the array becomes a node in the list, maintaining the original order.

A linked list is made of nodes, where each node contains a value and a pointer (or reference) to the next node in the sequence. To solve this, you will iterate through the array. For each element, create a new node. You'll need to keep track of the previous node so you can link its 'next' pointer to the current node you're creating.

Return the head node (the first node) of the newly created linked list. If the input array is empty, return null.`,
  examples: [
    {
      input: '4\n1 2 3 4',
      output: '1 -> 2 -> 3 -> 4 -> NULL',
      explanation: 'The array [1, 2, 3, 4] is converted into a linked list. The node with value 1 is the head.'
    },
    {
      input: '1\n10',
      output: '10 -> NULL',
      explanation: 'A single-element array becomes a single-node linked list.'
    },
    {
      input: '0\n',
      output: 'NULL',
      explanation: 'An empty array results in an empty (null) linked list.'
    }
  ],
  constraints: [
    '0 <= n <= 1000',
    '-10^5 <= arr[i] <= 10^5'
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

Node* solve(int n, vector<int>& arr) {
    if (n == 0) return nullptr;
    Node* head = new Node(arr[0]);
    Node* current = head;
    for (int i = 1; i < n; ++i) {
        current->next = new Node(arr[i]);
        current = current->next;
    }
    return head;
}

void printList(Node* head) {
    Node* temp = head;
    while (temp != nullptr) {
        cout << temp->data << " -> ";
        temp = temp->next;
    }
    cout << "NULL" << endl;
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    if (n == 0) {
        cout << "NULL" << endl;
        return 0;
    }
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    Node* head = solve(n, arr);
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
    public static Node solve(int n, int[] arr) {
        if (n == 0) return null;
        Node head = new Node(arr[0]);
        Node current = head;
        for (int i = 1; i < n; i++) {
            current.next = new Node(arr[i]);
            current = current.next;
        }
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
        if (n == 0) {
            System.out.println("NULL");
            return;
        }
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        
        Node head = solve(n, arr);
        printList(head);
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '4\n1 2 3 4', expected: '1 -> 2 -> 3 -> 4 -> NULL' },
    { input: '1\n10', expected: '10 -> NULL' },
    { input: '0\n', expected: 'NULL' },
    { input: '5\n0 0 0 0 0', expected: '0 -> 0 -> 0 -> 0 -> 0 -> NULL' },
    { input: '3\n-1 0 1', expected: '-1 -> 0 -> 1 -> NULL' },
    { input: '2\n1000 -1000', expected: '1000 -> -1000 -> NULL' }
  ],

  // ---- Solution ----
  solution: {
    approach: `To build a linked list from an array, first handle the edge case of an empty array by returning null. For a non-empty array, create the head node using the first element. Then, iterate from the second element of the array. In each iteration, create a new node and link it to the 'next' pointer of the previous node. A 'currentNode' pointer is used to keep track of the last node in the list being built.`,
    cpp: `Node* head = new Node(arr[0]);
Node* currentNode = head;
for (int i = 1; i < n; ++i) {
    Node* newNode = new Node(arr[i]);
    currentNode->next = newNode;
    currentNode = newNode;
}
return head;`,
    java: `Node head = new Node(arr[0]);
Node currentNode = head;
for (int i = 1; i < n; i++) {
    Node newNode = new Node(arr[i]);
    currentNode.next = newNode;
    currentNode = newNode;
}
return head;`
  }
};