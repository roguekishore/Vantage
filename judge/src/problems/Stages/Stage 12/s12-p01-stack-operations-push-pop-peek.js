/**
 * Stack Operations: Push, Pop, Peek - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer q, the number of operations.
 * Next q lines: The operation name followed by its argument (if any).
 * * Operations:
 * - push(val): Push an integer onto the stack. No output.
 * - pop(): Remove the top element. If empty, output "Underflow".
 * - peek(): Output the top element. If empty, output "Empty".
 * - isEmpty(): Output "true" or "false".
 *
 * Output format (stdout):
 * The result of each peek, pop (on error), and isEmpty operation on a new line.
 */

module.exports = {
  id: 'stack-operations-push-pop-peek',
  conquestId: 'stage12-1',
  title: 'Stack: Basic Operations',
  difficulty: 'Easy',
  category: 'Stack – Fundamentals',
  tags: ['Stack', 'Data Structure', 'LIFO'],

  stageIntro: `Your success with the moving staircases has earned you a bit of a reputation, which reaches the ears of Fred and George Weasley. Intrigued, they invite you to their secret workshop where they prototype their joke products for Weasleys' Wizard Wheezes. The room is a chaotic marvel of enchanted items, half-finished inventions, and boxes piled high to the ceiling.`,
  
  storyBriefing: `Fred gestures to a tall, narrow stack of boxes. "Simple, this one. It's our latest shipment of Extendable Ears. We just pile new boxes on top. When we need one, we take it off the top. Last one in, first one out! Show us you understand. We'll call out 'push' to add a box, 'pop' to take one off, and 'peek' to check the serial number of the top one. Keep track for us."`,

  description: `You are given a series of operations to perform on a stack data structure. A stack operates on a Last-In-First-Out (LIFO) principle, meaning the last element added is the first one to be removed. Your task is to simulate a stack and report the results of certain operations.

You will need to handle four basic commands: 'push' to add an element to the top of the stack, 'pop' to remove the top element, 'peek' to view the top element without removing it, and 'isEmpty' to check if the stack is empty. You must also handle underflow errors gracefully.

Process all the given operations. The 'peek' and 'isEmpty' operations, as well as errors from 'pop', should produce output.`,

  examples: [
    {
      input: '6\npush 10\npush 20\npeek\npop\npeek\nisEmpty',
      output: '20\n10\nfalse',
      explanation: 'Push 10, stack is [10]. Push 20, stack is [10, 20]. Peek returns 20. Pop removes 20, stack is [10]. Peek returns 10. IsEmpty returns false.'
    },
    {
      input: '3\npop\npeek\nisEmpty',
      output: 'Underflow\nEmpty\ntrue',
      explanation: 'The initial stack is empty. Popping causes an Underflow. Peeking reports Empty. IsEmpty returns true.'
    },
    {
      input: '5\npush 5\npeek\npop\npeek\nisEmpty',
      output: '5\nEmpty\ntrue',
      explanation: 'Push 5, stack is [5]. Peek returns 5. Pop removes 5, stack is []. Peeking an empty stack reports Empty. IsEmpty returns true.'
    }
  ],

  constraints: [
    'The number of operations is between 1 and 1000.',
    'The value for push operations is between -100000 and 100000.'
  ],

  boilerplate: {
    cpp: `class MyStack {
public:
    void push(int val) {
        // Your code here
    }
    
    void pop() {
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
    MyStack st;
    int q;
    std::cin >> q;
    while (q--) {
        std::string op;
        std::cin >> op;
        if (op == "push") {
            int val; std::cin >> val; st.push(val);
        } else if (op == "pop") {
            st.pop();
        } else if (op == "peek") {
            st.peek();
        } else if (op == "isEmpty") {
            std::cout << (st.isEmpty() ? "true" : "false") << std::endl;
        }
    }
    return 0;
}`,
    java: `class MyStack {
    // Choose your underlying data structure

    public void push(int val) {
        // Your code here
    }

    public void pop() {
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
        MyStack st = new MyStack();
        if (!sc.hasNextInt()) return;
        int q = sc.nextInt();
        while (q-- > 0) {
            String op = sc.next();
            if (op.equals("push")) {
                st.push(sc.nextInt());
            } else if (op.equals("pop")) {
                st.pop();
            } else if (op.equals("peek")) {
                st.peek();
            } else if (op.equals("isEmpty")) {
                System.out.println(st.isEmpty());
            }
        }
        sc.close();
    }
}`
  },

  testCases: [
    { input: '6\npush 10\npush 20\npeek\npop\npeek\nisEmpty', expected: '20\n10\nfalse' },
    { input: '3\npop\npeek\nisEmpty', expected: 'Underflow\nEmpty\ntrue' },
    { input: '1\nisEmpty', expected: 'true' },
    { input: '2\npush 1\nisEmpty', expected: 'false' },
    { input: '8\npush 1\npush 2\npop\npeek\npop\nisEmpty\npeek\npop', expected: '1\ntrue\nEmpty\nUnderflow' },
    { input: '4\npush 0\npeek\npop\nisEmpty', expected: '0\ntrue' },
    { input: '5\npush -100\npeek\npop\npeek\npop', expected: '-100\nEmpty\nUnderflow' },
    { input: '10\npush 1\npush 2\npush 3\npush 4\npush 5\npeek\npop\npeek\npop\npeek', expected: '5\n4\n3' }
  ],
  
  solution: {
    approach: `To implement a stack, we can use a dynamic array (like std::vector in C++ or ArrayList in Java). For 'push', we add the element to the end of the array. For 'pop', we check if the array is empty to handle underflow, otherwise we remove the element from the end. For 'peek', we check for an empty array, otherwise we return the last element without removing it. 'isEmpty' simply checks if the array's size is zero.`,
    cpp: `private:
    std::vector<int> data;
public:
    void push(int val) {
        data.push_back(val);
    }
    
    void pop() {
        if (isEmpty()) {
            std::cout << "Underflow" << std::endl;
            return;
        }
        data.pop_back();
    }
    
    void peek() {
        if (isEmpty()) {
            std::cout << "Empty" << std::endl;
            return;
        }
        std::cout << data.back() << std::endl;
    }
    
    bool isEmpty() {
        return data.empty();
    }`,
    java: `    private java.util.ArrayList<Integer> data = new java.util.ArrayList<>();

    public void push(int val) {
        data.add(val);
    }

    public void pop() {
        if (isEmpty()) {
            System.out.println("Underflow");
            return;
        }
        data.remove(data.size() - 1);
    }

    public void peek() {
        if (isEmpty()) {
            System.out.println("Empty");
            return;
        }
        System.out.println(data.get(data.size() - 1));
    }

    public boolean isEmpty() {
        return data.isEmpty();
    }`
  }
};