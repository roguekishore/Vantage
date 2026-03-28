/**
 * Reverse Linked List - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of nodes.
 * Line 2: n space-separated integers (the list).
 *
 * Output format (stdout):
 * The values of the reversed linked list nodes separated by " -> " and ending with "NULL".
 */

module.exports = {
  id: 'reverse-linked-list',
  conquestId: 'stage11-1',
  title: 'Reverse Linked List',
  difficulty: 'Easy',
  category: 'Linked List – LC Problems',
  tags: ['Linked List', 'Pointers', 'Iteration'],
  
  stageIntro: `After mastering the basics of magical construction, you return to Hogwarts to find the castle itself seems to be testing you. The Grand Staircase, famous for its shifting flights of stairs, has become unusually chaotic. Portraits whisper that Peeves the Poltergeist has been meddling with the castle's ancient magic, causing stairways to reverse their direction at a moment's notice. To navigate safely, you must be able to update your mental map of these paths instantly.`,

  storyBriefing: `As you approach the Charms corridor, a portrait of a stern-looking wizard calls out, "Halt! The path ahead has flipped! The step that was last is now first, and the first is now last. If you wish to pass, show me you understand this reversal. Remap this sequence of steps in your mind and tell me the new order." He points to a floating, shimmering magical path that resembles a linked list of glowing platforms.`,

  description: `You are given the head of a singly linked list of integers. Your task is to reverse the order of the nodes in the list and return the new head.

This is a foundational pointer manipulation problem. The key is to iterate through the list, changing the direction of each node's 'next' pointer to point to its previous node. You will need to carefully track the previous, current, and next nodes in the sequence to avoid losing the rest of the list.

Return the head of the now-reversed list. You must do this in-place, without creating a new list.`,

  examples: [
    {
      input: '5\n1 2 3 4 5',
      output: '5 -> 4 -> 3 -> 2 -> 1 -> NULL',
      explanation: 'The list 1 -> 2 -> 3 -> 4 -> 5 is reversed. The node with value 5 becomes the new head, and all pointers are flipped to point to their previous node.'
    },
    {
      input: '2\n13 20',
      output: '20 -> 13 -> NULL',
      explanation: 'In a two-node list, the head and tail simply swap positions.'
    },
    {
      input: '1\n42',
      output: '42 -> NULL',
      explanation: 'A list with a single node is already reversed. Its head remains the same.'
    }
  ],

  constraints: [
    'The number of nodes in the list is between 0 and 5000.',
    'The value of each node is between -5000 and 5000.'
  ],

  boilerplate: {
    cpp: `struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* solve(Node* head) {
    // Your code here
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
void printList(Node* head) {
    while (head != nullptr) {
        std::cout << head->data << " -> ";
        head = head->next;
    }
    std::cout << "NULL" << std::endl;
}

int main() {
    int n, val;
    if (!(std::cin >> n)) return 0;
    Node *head = nullptr, *tail = nullptr;
    for (int i = 0; i < n; i++) {
        std::cin >> val;
        Node* newNode = new Node(val);
        if (!head) head = newNode;
        else tail->next = newNode;
        tail = newNode;
    }
    
    head = solve(head);
    printList(head);
    return 0;
}`,
    java: `class Node {
    int data;
    Node next;
    Node(int data) {
        this.data = data;
        this.next = null;
    }
}

class Solution {
    public static Node solve(Node head) {
        // Your code here
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void printList(Node head) {
        Node temp = head;
        while (temp != null) {
            System.out.print(temp.data + " -> ");
            temp = temp.next;
        }
        System.out.println("NULL");
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
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
        
        head = Solution.solve(head);
        printList(head);
        sc.close();
    }
}`
  },

  testCases: [
    { input: '5\n1 2 3 4 5', expected: '5 -> 4 -> 3 -> 2 -> 1 -> NULL' },
    { input: '1\n100', expected: '100 -> NULL' },
    { input: '0\n', expected: 'NULL' },
    { input: '2\n99 1', expected: '1 -> 99 -> NULL' },
    { input: '3\n-10 0 10', expected: '10 -> 0 -> -10 -> NULL' },
    { input: '7\n1 1 2 2 3 3 3', expected: '3 -> 3 -> 3 -> 2 -> 2 -> 1 -> 1 -> NULL' },
    { input: '4\n5000 0 -5000 1', expected: '1 -> -5000 -> 0 -> 5000 -> NULL' },
    { input: '6\n10 20 30 40 50 60', expected: '60 -> 50 -> 40 -> 30 -> 20 -> 10 -> NULL' }
  ],

  solution: {
    approach: `The standard iterative approach uses three pointers: 'prev', 'curr', and 'next_temp'. 'prev' is initialized to null and 'curr' to the head. We iterate while 'curr' is not null. In each step, we store the next node in 'next_temp', then reverse the current node's pointer to 'prev'. Finally, we move 'prev' and 'curr' one step forward for the next iteration. The new head will be 'prev' after the loop finishes.`,
    cpp: `    Node* prev = nullptr;
    Node* curr = head;
    while (curr != nullptr) {
        Node* next_temp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next_temp;
    }
    return prev;`,
    java: `    Node prev = null;
    Node curr = head;
    while (curr != null) {
        Node next_temp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next_temp;
    }
    return prev;`
  }
};