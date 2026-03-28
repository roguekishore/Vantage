/**
 * Sort List - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of nodes.
 * Line 2: n space-separated integers (the unsorted list).
 *
 * Output format (stdout):
 * The values of the sorted linked list nodes separated by " -> " and ending with "NULL".
 */

module.exports = {
  id: 'sort-list',
  conquestId: 'stage11-4',
  title: 'Sort List',
  difficulty: 'Medium',
  category: 'Linked List – LC Problems',
  tags: ['Linked List', 'Divide and Conquer', 'Merge Sort', 'Two Pointers'],

  storyBriefing: `Peeves appears again, this time beside a long, messy chain of enchanted suits of armor, all linked together and stumbling around in a chaotic line. "Nice work merging paths," he snorts, "but what if the path itself is a complete jumble? This lot was supposed to be in a neat procession for the school inspection, sorted by their registry number. Put them in the correct order, if you can!"`,

  description: `You are given the head of a linked list. Your task is to sort the list in ascending order and return the head of the sorted list.

A highly efficient approach for sorting a linked list is merge sort. This algorithm avoids the performance pitfalls of quick sort's random access requirement and the high space complexity of other sorts. The process involves recursively splitting the list into halves until you have single-node lists (which are inherently sorted), and then merging these sorted halves back together.

Return the head of the sorted linked list. The solution should aim for O(n log n) time complexity and O(log n) space complexity due to the recursion stack.`,

  examples: [
    {
      input: '4\n4 2 1 3',
      output: '1 -> 2 -> 3 -> 4 -> NULL',
      explanation: 'The list is split into [4, 2] and [1, 3]. These are split further, sorted, and then merged back. [4, 2] becomes [2, 4]. [1, 3] is already sorted. Merging [2, 4] and [1, 3] gives 1 -> 2 -> 3 -> 4.'
    },
    {
      input: '5\n-1 5 3 4 0',
      output: '-1 -> 0 -> 3 -> 4 -> 5 -> NULL',
      explanation: 'The same merge sort process works correctly with negative numbers and zero, resulting in a fully sorted list.'
    },
    {
      input: '1\n10',
      output: '10 -> NULL',
      explanation: 'A list with a single node is already sorted.'
    }
  ],

  constraints: [
    'The number of nodes in the list is between 0 and 50000.',
    'The value of each node is between -100000 and 100000.'
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
    { input: '4\n4 2 1 3', expected: '1 -> 2 -> 3 -> 4 -> NULL' },
    { input: '5\n-1 5 3 4 0', expected: '-1 -> 0 -> 3 -> 4 -> 5 -> NULL' },
    { input: '0\n', expected: 'NULL' },
    { input: '1\n10', expected: '10 -> NULL' },
    { input: '2\n10 1', expected: '1 -> 10 -> NULL' },
    { input: '6\n10 10 10 10 10 10', expected: '10 -> 10 -> 10 -> 10 -> 10 -> 10 -> NULL' },
    { input: '3\n3 2 1', expected: '1 -> 2 -> 3 -> NULL' },
    { input: '7\n1 2 3 4 5 6 7', expected: '1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> NULL' },
    { input: '7\n7 6 5 4 3 2 1', expected: '1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> NULL' }
  ],

  solution: {
    approach: `Merge sort for a linked list involves three main steps. First, find the middle of the list using the fast and slow pointer technique and split the list into two halves. Second, recursively call the sort function on both halves until the base case is reached (a list with zero or one node, which is already sorted). Third, merge the two sorted halves back into a single sorted list using the standard merge logic from the "Merge Two Sorted Lists" problem. This divide-and-conquer approach sorts the list efficiently.`,
    cpp: `    if (!head || !head->next) {
        return head;
    }

    // Find middle
    Node* slow = head;
    Node* fast = head->next;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    Node* mid = slow->next;
    slow->next = nullptr;

    // Recursive calls
    Node* left = solve(head);
    Node* right = solve(mid);

    // Merge
    Node dummy(0);
    Node* tail = &dummy;
    while (left && right) {
        if (left->data <= right->data) {
            tail->next = left;
            left = left->next;
        } else {
            tail->next = right;
            right = right->next;
        }
        tail = tail->next;
    }
    tail->next = left ? left : right;
    
    return dummy.next;`,
    java: `    if (head == null || head.next == null) {
        return head;
    }

    // Find middle
    Node slow = head;
    Node fast = head.next;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    Node mid = slow.next;
    slow.next = null;

    // Recursive calls
    Node left = solve(head);
    Node right = solve(mid);

    // Merge
    Node dummy = new Node(0);
    Node tail = dummy;
    while (left != null && right != null) {
        if (left.data <= right.data) {
            tail.next = left;
            left = left.next;
        } else {
            tail.next = right;
            right = right.next;
        }
        tail = tail.next;
    }
    tail.next = (left != null) ? left : right;
    
    return dummy.next;`
  }
};