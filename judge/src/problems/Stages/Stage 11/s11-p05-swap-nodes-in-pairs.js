/**
 * Swap Nodes in Pairs - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of nodes.
 * Line 2: n space-separated integers.
 *
 * Output format (stdout):
 * The values of the modified linked list nodes separated by " -> " and ending with "NULL".
 */

module.exports = {
  id: 'swap-nodes-in-pairs',
  conquestId: 'stage11-5',
  title: 'Swap Nodes in Pairs',
  difficulty: 'Medium',
  category: 'Linked List – LC Problems',
  tags: ['Linked List', 'Recursion', 'Pointer Manipulation'],

  storyBriefing: `As you finish sorting the armor, Peeves makes one last attempt to cause trouble. He zooms past the Grand Staircase, and with a flick of his wrist, every pair of adjacent steps magically swaps places, turning the elegant stairway into a hazardous, uneven path. "One last trick!" he screeches. "Fix the map for this! Swap every single pair of steps. That should keep you busy!" With that, he vanishes, leaving you with the final challenge of the moving staircases.`,

  description: `You are given a linked list. Your task is to swap every two adjacent nodes and return the modified head of the list. This operation must be done without modifying the values within the nodes themselves- only the pointers can be changed.

This problem is a rigorous test of pointer manipulation. You must carefully manage the connections between four nodes at a time: the node before the pair, the first node of the pair, the second node, and the node after the pair. Using a dummy node can help simplify the logic, especially for handling the swap of the first two nodes in the list.

Return the head of the modified list. If the list has an odd number of nodes, the final node should remain in its original position.`,

  examples: [
    {
      input: '4\n1 2 3 4',
      output: '2 -> 1 -> 4 -> 3 -> NULL',
      explanation: 'The node pair (1, 2) is swapped to become (2, 1). The node pair (3, 4) is swapped to become (4, 3). The new list is 2 -> 1 -> 4 -> 3.'
    },
    {
      input: '3\n1 2 3',
      output: '2 -> 1 -> 3 -> NULL',
      explanation: 'The node pair (1, 2) is swapped. The last node, 3, has no adjacent node to swap with, so it remains in place.'
    },
    {
      input: '1\n1',
      output: '1 -> NULL',
      explanation: 'A list with a single node has no pairs to swap, so it remains unchanged.'
    }
  ],

  constraints: [
    'The number of nodes in the list is between 0 and 100.',
    'The value of each node is between 0 and 100.'
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
    while (head) {
        std::cout << head->data << " -> ";
        head = head->next;
    }
    std::cout << "NULL" << std::endl;
}

int main() {
    int n, val;
    if (!(std::cin >> n)) return 0;
    if (n == 0) { std::cout << "NULL" << std::endl; return 0; }
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
        while (head != null) {
            System.out.print(head.data + " -> ");
            head = head.next;
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
    { input: '4\n1 2 3 4', expected: '2 -> 1 -> 4 -> 3 -> NULL' },
    { input: '0\n', expected: 'NULL' },
    { input: '1\n10', expected: '10 -> NULL' },
    { input: '3\n1 2 3', expected: '2 -> 1 -> 3 -> NULL' },
    { input: '2\n100 200', expected: '200 -> 100 -> NULL' },
    { input: '5\n1 2 3 4 5', expected: '2 -> 1 -> 4 -> 3 -> 5 -> NULL' },
    { input: '6\n10 20 30 40 50 60', expected: '20 -> 10 -> 40 -> 30 -> 60 -> 50 -> NULL' },
    { input: '7\n0 1 2 3 4 5 6', expected: '1 -> 0 -> 3 -> 2 -> 5 -> 4 -> 6 -> NULL' }
  ],

  solution: {
    approach: `The iterative solution uses a dummy node to handle the head of the list gracefully. We use three main pointers: 'prev_node' (which points to the node before the pair being swapped), 'first_node', and 'second_node'. We iterate through the list as long as there are at least two nodes left to swap. In each iteration, we rewire the pointers: 'prev_node' now points to 'second_node', 'first_node' points to where 'second_node' was pointing, and 'second_node' points back to 'first_node'. 'prev_node' is then updated to point to 'first_node' for the next iteration.`,
    cpp: `    Node dummy(0);
    dummy.next = head;
    Node* prev_node = &dummy;

    while (head != nullptr && head->next != nullptr) {
        Node* first_node = head;
        Node* second_node = head->next;

        // Swapping
        prev_node->next = second_node;
        first_node->next = second_node->next;
        second_node->next = first_node;

        // Re-initializing for next iteration
        prev_node = first_node;
        head = first_node->next;
    }

    return dummy.next;`,
    java: `    Node dummy = new Node(0);
    dummy.next = head;
    Node prev_node = dummy;

    while (head != null && head.next != null) {
        Node first_node = head;
        Node second_node = head.next;

        // Swapping
        prev_node.next = second_node;
        first_node.next = second_node.next;
        second_node.next = first_node;

        // Re-initializing for next iteration
        prev_node = first_node;
        head = first_node.next;
    }

    return dummy.next;`
  }
};