/**
 * Min Stack - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer q, the number of operations.
 * Next q lines: The operation name followed by its argument (if any).
 * * Operations:
 * - push(val): Push an integer onto the stack.
 * - pop(): Remove the element on the top of the stack.
 * - top(): Get the top element.
 * - getMin(): Retrieve the minimum element in the stack.
 *
 * Output format (stdout):
 * The result of each top and getMin operation on a new line.
 */

module.exports = {
  id: 'min-stack',
  conquestId: 'stage12-4',
  title: 'Min Stack',
  difficulty: 'Medium',
  category: 'Stack – Fundamentals',
  tags: ['Stack', 'Design', 'Data Structure'],

  storyBriefing: `George nods approvingly. "Perfect. Now for the real genius of our operation." He points to a stack of Fanged Frisbees. "We need to know the serial number of the 'tames' Fanged Frisbee in this stack at all times, which corresponds to the minimum value. We can't just rummage through the whole stack to find it- that's a recipe for losing a finger. We need a system to get the minimum value instantly, in constant time."`,

  description: `You are asked to design a stack that, in addition to the standard push, pop, and top operations, also supports retrieving the minimum element in constant time. A naive solution would be to search for the minimum element on every call, but this would be inefficient (O(n) time).

To achieve constant time retrieval, you can use an auxiliary stack that keeps track of the minimum value at each stage. When you push a new element, you also push the new minimum (either the element itself or the previous minimum) onto the auxiliary stack. When you pop, you pop from both stacks, keeping them synchronized.

Implement a MinStack class that supports push, pop, top, and getMin operations, all in O(1) time complexity.`,

  examples: [
    {
      input: '8\npush -2\npush 0\npush -3\ngetMin\npop\ntop\ngetMin\npop',
      output: '-3\n0\n-2',
      explanation: 'Push -2, min is -2. Push 0, min is still -2. Push -3, min becomes -3. getMin returns -3. Pop -3. Top is now 0. getMin returns the new minimum, -2. Pop 0.'
    },
    {
      input: '5\npush 10\npush 5\ngetMin\npop\ngetMin',
      output: '5\n10',
      explanation: 'Push 10, min is 10. Push 5, min is 5. getMin returns 5. Pop 5. The minimum reverts to 10. getMin returns 10.'
    },
    {
      input: '3\npush 0\npush -1\ngetMin',
      output: '-1',
      explanation: 'The minimum is correctly tracked as -1.'
    }
  ],

  constraints: [
    'The number of operations is between 1 and 10000.',
    'The value for push operations is a 32-bit signed integer.',
    'The pop, top, and getMin operations will always be called on non-empty stacks.'
  ],

  boilerplate: {
    cpp: `class MinStack {
public:
    void push(int val) {
        // Your code here
    }
    
    void pop() {
        // Your code here
    }
    
    int top() {
        // Your code here
        return 0;
    }
    
    int getMin() {
        // Your code here
        return 0;
    }
private:
    // Choose your underlying data structure(s)
};

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <string>
#include <vector>
int main() {
    MinStack* obj = new MinStack();
    int q;
    std::cin >> q;
    while(q--) {
        std::string op;
        std::cin >> op;
        if(op == "push") {
            int val; std::cin >> val; obj->push(val);
        } else if(op == "pop") {
            obj->pop();
        } else if(op == "top") {
            std::cout << obj->top() << std::endl;
        } else if(op == "getMin") {
            std::cout << obj->getMin() << std::endl;
        }
    }
    delete obj;
    return 0;
}`,
    java: `class MinStack {
    // Choose your underlying data structure(s)

    public void push(int val) {
        // Your code here
    }

    public void pop() {
        // Your code here
    }

    public int top() {
        // Your code here
        return 0;
    }

    public int getMin() {
        // Your code here
        return 0;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        MinStack obj = new MinStack();
        if(!sc.hasNextInt()) return;
        int q = sc.nextInt();
        while(q-- > 0) {
            String op = sc.next();
            if(op.equals("push")) obj.push(sc.nextInt());
            else if(op.equals("pop")) obj.pop();
            else if(op.equals("top")) System.out.println(obj.top());
            else if(op.equals("getMin")) System.out.println(obj.getMin());
        }
        sc.close();
    }
}`
  },

  testCases: [
    { input: '8\npush -2\npush 0\npush -3\ngetMin\npop\ntop\ngetMin\npop', expected: '-3\n0\n-2' },
    { input: '4\npush 0\ngetMin\ntop\npop', expected: '0\n0' },
    { input: '5\npush 2\npush 3\npush 1\ngetMin\npop', expected: '1' },
    { input: '6\npush 2\npush 1\ngetMin\npop\ngetMin\ntop', expected: '1\n2\n2' },
    { input: '7\npush 10\ngetMin\npush 5\ngetMin\npop\ngetMin\ntop', expected: '10\n5\n10\n10' },
    { input: '3\npush -10\npush -10\ngetMin', expected: '-10' },
    { input: '4\npush -10\npush -10\npop\ngetMin', expected: '-10' },
    { input: '4\npush 2147483647\npush -2147483648\ngetMin\ntop', expected: '-2147483648\n-2147483648' }
  ],
  
  solution: {
    approach: `The problem can be solved efficiently using two stacks. The primary stack functions as a normal stack. The second, auxiliary stack (the 'min stack'), stores the minimum element found so far at each level. When pushing a value, we push it onto the primary stack. We then compare this value with the top of the min stack and push the smaller of the two onto the min stack. When popping, we pop from both stacks. This ensures the top of the min stack always holds the minimum value of the current primary stack in O(1) time.`,
    cpp: `private:
    std::stack<long> s;
    std::stack<long> minS;
public:
    MinStack() {
        minS.push(2147483648L); // Sentinel value
    }

    void push(int val_int) {
        long val = val_int;
        s.push(val);
        minS.push(std::min(minS.top(), val));
    }
    
    void pop() {
        s.pop();
        minS.pop();
    }
    
    int top() {
        return s.top();
    }
    
    int getMin() {
        return minS.top();
    }`,
    java: `    private java.util.Stack<Integer> s = new java.util.Stack<>();
    private java.util.Stack<Integer> minS = new java.util.Stack<>();

    public void push(int val) {
        s.push(val);
        if (minS.isEmpty() || val <= minS.peek()) {
            minS.push(val);
        }
    }

    public void pop() {
        if (s.peek().equals(minS.peek())) {
            minS.pop();
        }
        s.pop();
    }

    public int top() {
        return s.peek();
    }

    public int getMin() {
        return minS.peek();
    }`
  }
};