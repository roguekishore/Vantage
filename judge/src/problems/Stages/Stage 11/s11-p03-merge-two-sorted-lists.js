/**
 * Merge Two Sorted Lists - Problem Definition
 *
 * Input format (stdin):
 * Line 1: n1 (size of list1) and n2 (size of list2).
 * Line 2: n1 space-separated sorted integers (list1).
 * Line 3: n2 space-separated sorted integers (list2).
 *
 * Output format (stdout):
 * The values of the merged sorted linked list nodes separated by " -> " and ending with "NULL".
 */

module.exports = {
  id: 'merge-two-sorted-lists',
  conquestId: 'stage11-3',
  title: 'Merge Two Sorted Lists',
  difficulty: 'Easy',
  category: 'Linked List – LC Problems',
  tags: ['Linked List', 'Recursion', 'Iteration'],

  storyBriefing: `The stern wizard in the portrait nods, impressed. "Very good. You see how paths can change. Now, observe." He gestures to two separate, smaller staircases that shimmer into view. "Both of these paths lead to the library, but they originate from different corridors. We need a single, unified map that combines both routes, maintaining the correct ascending order of the steps. Provide me with this merged path."`,

  description: `You are given the heads of two sorted linked lists, list1 and list2. Your task is to merge the two lists into a single, sorted linked list and return the head of the merged list. The new list should be made by splicing together the nodes of the original two lists.

This is a fundamental operation used as a subroutine in algorithms like merge sort for linked lists. A common approach is to iterate through both lists simultaneously, comparing the current nodes of each and appending the smaller one to the merged list. A dummy node is often used to simplify handling the head of the new list.

Return the head of the merged, sorted linked list.`,

  examples: [
    {
      input: '3 3\n1 2 4\n1 3 4',
      output: '1 -> 1 -> 2 -> 3 -> 4 -> 4 -> NULL',
      explanation: 'Start with a dummy node. Compare 1 and 1, take the first 1. Compare 2 and 1, take the 1. Compare 2 and 3, take 2. Compare 4 and 3, take 3. Compare 4 and 4, take the first 4. Finally, append the last 4.'
    },
    {
      input: '0 1\n\n5',
      output: '5 -> NULL',
      explanation: 'Merging an empty list with a list containing a single node results in the single-node list.'
    },
    {
      input: '0 0\n\n',
      output: 'NULL',
      explanation: 'Merging two empty lists results in an empty list.'
    }
  ],

  constraints: [
    'The number of nodes in both lists is between 0 and 50.',
    'The value of each node is between -100 and 100.',
    'Both list1 and list2 are sorted in non-decreasing order.'
  ],

  boilerplate: {
    cpp: `struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* solve(Node* list1, Node* list2) {
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

Node* buildList(int n) {
    if (n == 0) return nullptr;
    int val;
    std::cin >> val;
    Node* head = new Node(val);
    Node* curr = head;
    for (int i = 1; i < n; i++) {
        std::cin >> val;
        curr->next = new Node(val);
        curr = curr->next;
    }
    return head;
}

int main() {
    int n1, n2;
    if (!(std::cin >> n1 >> n2)) return 0;
    Node* l1 = buildList(n1);
    Node* l2 = buildList(n2);
    
    Node* result = solve(l1, l2);
    printList(result);
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
    public static Node solve(Node list1, Node list2) {
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

    public static Node buildList(java.util.Scanner sc, int n) {
        if (n == 0) return null;
        Node head = new Node(sc.nextInt());
        Node curr = head;
        for (int i = 1; i < n; i++) {
            curr.next = new Node(sc.nextInt());
            curr = curr.next;
        }
        return head;
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n1 = sc.nextInt();
        int n2 = sc.nextInt();
        Node l1 = buildList(sc, n1);
        Node l2 = buildList(sc, n2);
        
        Node result = Solution.solve(l1, l2);
        printList(result);
        sc.close();
    }
}`
  },

  testCases: [
    { input: '3 3\n1 2 4\n1 3 4', expected: '1 -> 1 -> 2 -> 3 -> 4 -> 4 -> NULL' },
    { input: '0 0\n\n', expected: 'NULL' },
    { input: '0 1\n\n0', expected: '0 -> NULL' },
    { input: '1 0\n0\n', expected: '0 -> NULL' },
    { input: '2 2\n5 10\n1 15', expected: '1 -> 5 -> 10 -> 15 -> NULL' },
    { input: '1 3\n2\n1 3 4', expected: '1 -> 2 -> 3 -> 4 -> NULL' },
    { input: '4 4\n-10 -5 0 5\n-8 -4 1 2', expected: '-10 -> -8 -> -5 -> -4 -> 0 -> 1 -> 2 -> 5 -> NULL' },
    { input: '3 2\n1 2 3\n1 2', expected: '1 -> 1 -> 2 -> 2 -> 3 -> NULL' },
    { input: '2 3\n1 2\n1 2 3', expected: '1 -> 1 -> 2 -> 2 -> 3 -> NULL' },
    { input: '1 1\n100\n-100', expected: '-100 -> 100 -> NULL' }
  ],

  solution: {
    approach: `The iterative approach uses a dummy node to act as a placeholder for the head of the new merged list. A 'tail' pointer is initialized to this dummy node. We then iterate as long as both lists are not empty, comparing the values of the current nodes. The node with the smaller value is appended to the tail, and the corresponding list's pointer is advanced. After the loop, one of the lists may still have remaining nodes; we append this non-empty list to the tail. Finally, we return the 'next' of the dummy node, which is the true head of the merged list.`,
    cpp: `    if (!list1) return list2;
    if (!list2) return list1;

    Node dummy(0);
    Node* tail = &dummy;

    while (list1 && list2) {
        if (list1->data <= list2->data) {
            tail->next = list1;
            list1 = list1->next;
        } else {
            tail->next = list2;
            list2 = list2->next;
        }
        tail = tail->next;
    }

    if (list1) {
        tail->next = list1;
    } else {
        tail->next = list2;
    }

    return dummy.next;`,
    java: `    if (list1 == null) return list2;
    if (list2 == null) return list1;

    Node dummy = new Node(0);
    Node tail = dummy;

    while (list1 != null && list2 != null) {
        if (list1.data <= list2.data) {
            tail.next = list1;
            list1 = list1.next;
        } else {
            tail.next = list2;
            list2 = list2.next;
        }
        tail = tail.next;
    }

    if (list1 != null) {
        tail.next = list1;
    } else {
        tail.next = list2;
    }

    return dummy.next;`
  }
};