/**
 * Basic Queue - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer q, the number of operations.
 * Next q lines: The operation name followed by its argument (if any).
 * * Operations:
 * - enqueue(val): Add an integer to the rear of the queue.
 * - dequeue(): Remove the front element. If empty, output "Underflow".
 * - peek(): Output the front element. If empty, output "Empty".
 * - isEmpty(): Output "true" or "false".
 *
 * Output format (stdout):
 * The result of each peek, dequeue (on error), and isEmpty operation on a new line.
 */

module.exports = {
  id: 'basic-queue-ops',
  conquestId: 'stage14-2',
  title: 'Basic Queue',
  difficulty: 'Easy',
  category: 'Queue',
  tags: ['Queue', 'Data Structure', 'FIFO'],

  storyBriefing: `Next, you visit the Three Broomsticks, which is just as busy. Madam Rosmerta is managing the queue for Butterbeer. Her system is similar, but her terminology is a bit different. She shouts 'Underflow!' if she tries to serve from an empty queue and 'Empty!' if someone asks who's next when no one is there. "Right then," she says, "Help me manage this lot, will you? Keep track of the queue, and use my exact phrases when things go wrong!"`,

  description: `You are asked to implement a basic queue that handles a series of operations. A queue follows the First-In, First-Out (FIFO) principle. This problem is similar to a standard queue implementation, but with specific string outputs required for error conditions.

Your implementation must support 'enqueue', 'dequeue', 'peek', and 'isEmpty'. For 'dequeue' on an empty queue, you must print "Underflow". For 'peek' on an empty queue, you must print "Empty". These specific output requirements test your ability to handle edge cases according to a given specification.

Process all the given operations. The 'peek' and 'isEmpty' operations, as well as error messages from 'dequeue', should produce output.`,

  examples: [
    {
      input: '5\nenqueue 1\nenqueue 2\npeek\ndequeue\npeek',
      output: '1\n2',
      explanation: 'Enqueue 1, queue is [1]. Enqueue 2, queue is [1, 2]. Peek returns 1. Dequeue removes 1. Peek now returns 2.'
    },
    {
      input: '3\ndequeue\npeek\nisEmpty',
      output: 'Underflow\nEmpty\ntrue',
      explanation: 'Operations on an empty queue produce the specified error messages "Underflow" and "Empty".'
    },
    {
      input: '4\nenqueue 100\npeek\ndequeue\nisEmpty',
      output: '100\ntrue',
      explanation: 'Enqueue 100, peek returns 100. Dequeue removes it. The queue is now empty, so isEmpty returns true.'
    }
  ],

  constraints: [
    'The number of operations is between 1 and 1000.',
    'The value for enqueue operations is between -100000 and 100000.'
  ],

  boilerplate: {
    cpp: `class MyQueue {
public:
    void enqueue(int val) {
        // Your code here
    }
    
    void dequeue() {
        // Your code here
    }
    
    void peek() {
        // Your code here
    }
    
    bool isEmpty() {
        // Your code here
        return true;
    }
private:
    // Choose your underlying data structure
};

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
int main() {
    MyQueue q;
    int n;
    std::cin >> n;
    while (n--) {
        std::string op;
        std::cin >> op;
        if (op == "enqueue") {
            int val; std::cin >> val; q.enqueue(val);
        } else if (op == "dequeue") {
            q.dequeue();
        } else if (op == "peek") {
            q.peek();
        } else if (op == "isEmpty") {
            std::cout << (q.isEmpty() ? "true" : "false") << std::endl;
        }
    }
    return 0;
}`,
    java: `class MyQueue {
    // Choose your underlying data structure

    public void enqueue(int val) {
        // Your code here
    }

    public void dequeue() {
        // Your code here
    }

    public void peek() {
        // Your code here
    }

    public boolean isEmpty() {
        // Your code here
        return true;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        MyQueue q = new MyQueue();
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        while (n-- > 0) {
            String op = sc.next();
            if (op.equals("enqueue")) {
                q.enqueue(sc.nextInt());
            } else if (op.equals("dequeue")) {
                q.dequeue();
            } else if (op.equals("peek")) {
                q.peek();
            } else if (op.equals("isEmpty")) {
                System.out.println(q.isEmpty());
            }
        }
        sc.close();
    }
}`
  },

  testCases: [
    { input: '5\nenqueue 1\nenqueue 2\npeek\ndequeue\npeek', expected: '1\n2' },
    { input: '3\ndequeue\npeek\nisEmpty', expected: 'Underflow\nEmpty\ntrue' },
    { input: '1\nisEmpty', expected: 'true' },
    { input: '2\npeek\ndequeue', expected: 'Empty\nUnderflow' },
    { input: '8\nenqueue 1\nenqueue 2\ndequeue\npeek\ndequeue\nisEmpty\npeek\ndequeue', expected: '2\ntrue\nEmpty\nUnderflow' },
    { input: '4\nenqueue 0\npeek\ndequeue\nisEmpty', expected: '0\ntrue' },
    { input: '5\nenqueue -100\npeek\ndequeue\npeek\ndequeue', expected: '-100\nEmpty\nUnderflow' },
    { input: '10\nenqueue 1\nenqueue 2\nenqueue 3\nenqueue 4\nenqueue 5\nisEmpty\ndequeue\nisEmpty\ndequeue\nisEmpty', expected: 'false\nfalse\nfalse' }
  ],
  
  solution: {
    approach: `This implementation uses a dynamic array and a 'head' pointer for efficiency. 'enqueue' adds an element to the end of the array. 'dequeue' checks if the queue is empty (head >= array size); if so, it prints "Underflow". Otherwise, it simply increments the 'head' pointer. 'peek' also checks for empty, printing "Empty" or the element at the 'head' index. 'isEmpty' returns true if the 'head' pointer has moved past the end of the written data in the array. This avoids O(n) element shifting.`,
    cpp: `private:
    std::vector<int> data;
    int head = 0;
public:
    void enqueue(int val) {
        data.push_back(val);
    }
    
    void dequeue() {
        if (isEmpty()) {
            std::cout << "Underflow" << std::endl;
            return;
        }
        head++;
    }
    
    void peek() {
        if (isEmpty()) {
            std::cout << "Empty" << std::endl;
            return;
        }
        std::cout << data[head] << std::endl;
    }
    
    bool isEmpty() {
        return head >= data.size();
    }`,
    java: `    private java.util.ArrayList<Integer> data = new java.util.ArrayList<>();
    private int head = 0;

    public void enqueue(int val) {
        data.add(val);
    }

    public void dequeue() {
        if (isEmpty()) {
            System.out.println("Underflow");
            return;
        }
        head++;
    }

    public void peek() {
        if (isEmpty()) {
            System.out.println("Empty");
            return;
        }
        System.out.println(data.get(head));
    }

    public boolean isEmpty() {
        return head >= data.size();
    }`
  }
};