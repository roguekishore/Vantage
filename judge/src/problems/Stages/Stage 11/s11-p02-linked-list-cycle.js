/**
 * Linked List Cycle - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of nodes.
 * Line 2: n space-separated integers (the list values).
 * Line 3: An integer pos, the index (0-based) that the tail points back to. 
 * If pos is -1, there is no cycle.
 *
 * Output format (stdout):
 * "true" if there is a cycle, "false" otherwise.
 */

module.exports = {
  id: 'linked-list-cycle',
  conquestId: 'stage11-2',
  title: 'Linked List Cycle',
  difficulty: 'Easy',
  category: 'Linked List – LC Problems',
  tags: ['Linked List', 'Two Pointers', "Floyd's Cycle-Finding"],

  storyBriefing: `Peeves cackles, delighted by the chaos he's causing. "Flipping them is fun, but making them go round and round is even better!" he shrieks, touching another flight of stairs. The staircase shudders and its end connects back to one of its middle steps, creating an endless loop. A nearby portrait sighs, "He's trapped the stairs in a time loop. You'll walk forever if you step on that! Before you proceed, can you simply tell us if this path is a trap? Does it contain a cycle?"`,

  description: `You are given the head of a linked list. Your task is to determine if the linked list has a cycle in it. A cycle exists if some node in the list can be reached again by continuously following the 'next' pointer.

A highly efficient way to solve this is using Floyd's Cycle-Finding Algorithm, also known as the "tortoise and the hare" method. This involves two pointers moving at different speeds. If the list has a cycle, the faster pointer will eventually lap the slower pointer, and they will meet. If there is no cycle, the fast pointer will reach the end of the list.

Return true if there is a cycle in the linked list. Otherwise, return false.`,

  examples: [
    {
      input: '4\n3 2 0 -4\n1',
      output: 'true',
      explanation: 'The list is 3 -> 2 -> 0 -> -4. The tail node (-4) connects back to the node at index 1 (value 2), creating a cycle. A fast and slow pointer would eventually meet inside this loop.'
    },
    {
      input: '2\n1 2\n-1',
      output: 'false',
      explanation: 'The list is 1 -> 2 -> NULL. There is no cycle, as the list terminates.'
    },
    {
      input: '1\n1\n-1',
      output: 'false',
      explanation: 'A single-node list cannot have a cycle.'
    }
  ],

  constraints: [
    'The number of nodes in the list is between 0 and 10000.',
    'The value of each node is between -100000 and 100000.',
    'pos is -1 or a valid index in the linked-list.'
  ],

  boilerplate: {
    cpp: `struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

bool solve(Node* head) {
    // Your code here
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
int main() {
    int n, pos, val;
    if (!(std::cin >> n)) return 0;
    std::vector<Node*> nodes;
    Node *head = nullptr, *tail = nullptr;
    for (int i = 0; i < n; i++) {
        std::cin >> val;
        Node* newNode = new Node(val);
        nodes.push_back(newNode);
        if (!head) head = newNode;
        else tail->next = newNode;
        tail = newNode;
    }
    std::cin >> pos;
    if (pos != -1 && tail && n > 0) {
        tail->next = nodes[pos];
    }
    
    std::cout << (solve(head) ? "true" : "false") << std::endl;
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
    public static boolean solve(Node head) {
        // Your code here
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        java.util.List<Node> nodes = new java.util.ArrayList<>();
        Node head = null, tail = null;
        for (int i = 0; i < n; i++) {
            int data = sc.nextInt();
            Node newNode = new Node(data);
            nodes.add(newNode);
            if (head == null) head = newNode;
            else tail.next = newNode;
            tail = newNode;
        }
        int pos = sc.nextInt();
        if (pos != -1 && tail != null && n > 0) {
            tail.next = nodes.get(pos);
        }
        
        System.out.println(Solution.solve(head) ? "true" : "false");
        sc.close();
    }
}`
  },

  testCases: [
    { input: '4\n3 2 0 -4\n1', expected: 'true' },
    { input: '2\n1 2\n0', expected: 'true' },
    { input: '1\n1\n-1', expected: 'false' },
    { input: '0\n\n-1', expected: 'false' },
    { input: '3\n1 2 3\n-1', expected: 'false' },
    { input: '5\n1 2 3 4 5\n2', expected: 'true' },
    { input: '2\n1 1\n1', expected: 'true' },
    { input: '6\n1 2 3 4 5 6\n0', expected: 'true' },
    { input: '6\n1 2 3 4 5 6\n5', expected: 'true' },
    { input: '10\n1 2 3 4 5 6 7 8 9 10\n-1', expected: 'false' }
  ],

  solution: {
    approach: `The "tortoise and the hare" algorithm uses two pointers, a 'slow' pointer and a 'fast' pointer. The slow pointer moves one step at a time, while the fast pointer moves two steps. If the list contains a cycle, the fast pointer will eventually enter the cycle and lap the slow pointer, at which point they will be at the same node. If the fast pointer reaches null, it means there is no cycle.`,
    cpp: `    if (!head || !head->next) {
        return false;
    }
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            return true;
        }
    }
    return false;`,
    java: `    if (head == null || head.next == null) {
        return false;
    }
    Node slow = head;
    Node fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next;
        if (fast != null) {
            fast = fast.next;
        }
        if (slow == fast) {
            return true;
        }
    }
    return false;`
  }
};