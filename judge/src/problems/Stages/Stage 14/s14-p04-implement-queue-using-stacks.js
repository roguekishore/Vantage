/**
 * Implement Queue using Stacks - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer q, the number of operations.
 * Next q lines: The operation name followed by its argument (if any).
 * * Operations:
 * - push(val): Push element x to the back of the queue.
 * - pop(): Removes the element from the front of the queue and returns it.
 * - peek(): Returns the element at the front of the queue.
 * - empty(): Returns true if the queue is empty, false otherwise.
 *
 * Output format (stdout):
 * The result of each pop, peek, and empty operation on a new line.
 */

module.exports = {
  id: 'implement-queue-using-stacks',
  conquestId: 'stage14-4',
  title: 'Implement Queue using Stacks',
  difficulty: 'Medium',
  category: 'Queue',
  tags: ['Stack', 'Queue', 'Design'],

  storyBriefing: `As you leave Hogsmeade, you bump into Fred and George again. They're holding two empty, identical-looking enchanted bags. "Last challenge of the day," says Fred. "These bags are stacks - Last-In, First-Out." George continues, "But we need them to behave like a queue - First-In, First-Out - to deliver Zonko's products in the right order. Using only these two stack-bags, can you create a system that works like a proper queue?"`,

  description: `You are asked to implement a First-In-First-Out (FIFO) queue using only two stacks. This is a classic data structures problem that tests your understanding of how to reverse the inherent Last-In-First-Out (LIFO) behavior of a stack.

The core idea is to use one stack for 'push' operations (an 'input' stack) and another for 'pop' and 'peek' operations (an 'output' stack). When the output stack is empty and a pop or peek is requested, you transfer all elements from the input stack to the output stack. This transfer process reverses the order of the elements, effectively turning the LIFO sequence into a FIFO sequence.

Implement a queue that supports 'push', 'pop', 'peek', and 'empty' operations. The implemented queue should have an amortized O(1) time complexity for each operation.`,

  examples: [
    {
      input: '5\npush 1\npush 2\npeek\npop\nempty',
      output: '1\n1\nfalse',
      explanation: 'Push 1, input stack is [1]. Push 2, input stack is [1, 2]. Peek is called. Output stack is empty, so transfer [1, 2] from input to output. Output stack becomes [2, 1]. Peek returns 1. Pop removes and returns 1. The queue is not empty.'
    },
    {
      input: '4\npush 10\npop\nempty\npeek',
      output: '10\ntrue',
      explanation: 'Push 10. Pop is called, so 10 is moved to the output stack and returned. The queue is now empty. A subsequent peek is on an empty queue, but the problem constraints guarantee this will not happen.'
    },
    {
      input: '3\npush 1\npush 2\npop',
      output: '1',
      explanation: 'Push 1, then 2. To pop, elements are moved to the output stack, reversing them. The first element in, 1, is correctly the first element out.'
    }
  ],

  constraints: [
    'The number of operations is between 1 and 1000.',
    'Values for push are between 1 and 100.',
    'All calls to pop and peek will be on non-empty queues.'
  ],

  boilerplate: {
    cpp: `class MyQueue {
public:
    void push(int x) {
        // Your code here
    }
    
    int pop() {
        // Your code here
        return 0;
    }
    
    int peek() {
        // Your code here
        return 0;
    }
    
    bool empty() {
        // Your code here
        return true;
    }
private:
    // Choose your underlying data structure(s)
};

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <stack>
#include <string>
int main() {
    MyQueue q;
    int n;
    std::cin >> n;
    while (n--) {
        std::string op;
        std::cin >> op;
        if (op == "push") {
            int x; std::cin >> x; q.push(x);
        } else if (op == "pop") {
            std::cout << q.pop() << std::endl;
        } else if (op == "peek") {
            std::cout << q.peek() << std::endl;
        } else if (op == "empty") {
            std::cout << (q.empty() ? "true" : "false") << std::endl;
        }
    }
    return 0;
}`,
    java: `class MyQueue {
    // Choose your underlying data structure(s)
    
    public void push(int x) {
        // Your code here
    }

    public int pop() {
        // Your code here
        return 0;
    }

    public int peek() {
        // Your code here
        return 0;
    }

    public boolean empty() {
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
            if (op.equals("push")) {
                q.push(sc.nextInt());
            } else if (op.equals("pop")) {
                System.out.println(q.pop());
            } else if (op.equals("peek")) {
                System.out.println(q.peek());
            } else if (op.equals("empty")) {
                System.out.println(q.empty());
            }
        }
        sc.close();
    }
}`
  },

  testCases: [
    { input: '5\npush 1\npush 2\npeek\npop\nempty', expected: '1\n1\nfalse' },
    { input: '3\npush 5\npop\nempty', expected: '5\ntrue' },
    { input: '6\npush 1\npush 2\npush 3\npop\npop\npop', expected: '1\n2\n3' },
    { input: '1\nempty', expected: 'true' },
    { input: '2\npush 1\nempty', expected: 'false' },
    { input: '7\npush 1\npush 2\npop\npeek\npush 3\npop\npop', expected: '1\n2\n2\n3' },
    { input: '8\npush 1\npop\npush 2\npeek\npush 3\npop\nempty\npop', expected: '1\n2\n2\nfalse\n3' },
    { input: '2\npush 100\npeek', expected: '100' }
  ],
  
  solution: {
    approach: `This implementation uses two stacks: 'input' and 'output'. The 'push' operation is simple: it always pushes the element onto the 'input' stack. The 'pop' and 'peek' operations are more complex. First, they check if the 'output' stack is empty. If it is, they transfer all elements from 'input' to 'output'. This transfer reverses the element order. After this potential transfer, 'peek' returns the top element of 'output', and 'pop' returns and removes the top of 'output'. The 'empty' operation is true only if both stacks are empty.`,
    cpp: `private:
    std::stack<int> input;
    std::stack<int> output;

    void transfer() {
        if (output.empty()) {
            while (!input.empty()) {
                output.push(input.top());
                input.pop();
            }
        }
    }

public:
    void push(int x) {
        input.push(x);
    }
    
    int pop() {
        transfer();
        int topVal = output.top();
        output.pop();
        return topVal;
    }
    
    int peek() {
        transfer();
        return output.top();
    }
    
    bool empty() {
        return input.empty() && output.empty();
    }`,
    java: `    private java.util.Stack<Integer> input = new java.util.Stack<>();
    private java.util.Stack<Integer> output = new java.util.Stack<>();
    
    private void transfer() {
        if (output.isEmpty()) {
            while (!input.isEmpty()) {
                output.push(input.pop());
            }
        }
    }

    public void push(int x) {
        input.push(x);
    }

    public int pop() {
        transfer();
        return output.pop();
    }

    public int peek() {
        transfer();
        return output.peek();
    }

    public boolean empty() {
        return input.isEmpty() && output.isEmpty();
    }`
  }
};