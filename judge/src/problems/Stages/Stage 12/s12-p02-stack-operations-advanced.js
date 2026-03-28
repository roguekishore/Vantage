/**
 * Stack Operations: Advanced Features - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer q, the number of operations.
 * Next q lines: The operation name followed by its argument (if any).
 * * Operations:
 * - push(val): Push an integer onto the stack.
 * - pop(): Remove and return the top element. If empty, return -1.
 * - top(): Return the top element without removing it. If empty, return -1.
 * - size(): Return the current number of elements in the stack.
 * - clear(): Remove all elements from the stack.
 *
 * Output format (stdout):
 * The result of each top, pop, and size operation on a new line.
 */

module.exports = {
  id: 'stack-operations-advanced',
  conquestId: 'stage12-2',
  title: 'Stack Operations',
  difficulty: 'Easy',
  category: 'Stack – Fundamentals',
  tags: ['Stack', 'Data Structure', 'LIFO', 'Array'],
  
  storyBriefing: `George is impressed. "You've got the basics. But our inventory system is a bit more demanding. We also need to know the 'size' of any stack of boxes at a moment's notice, and sometimes we need to 'clear' a whole stack at once if an invention goes haywire. Let's try again, but this time, the operations will return a value. If you try to pop or peek an empty stack, just return -1 for now."`,

  description: `You are given a series of operations for a stack data structure that must return values. A stack operates on a Last-In-First-Out (LIFO) principle. Your task is to implement a stack that can handle these commands and return the appropriate values.

You will implement a stack supporting 'push', 'pop', 'top', 'size', and 'clear'. The key difference from a basic stack is that 'pop' and 'top' must return the value of the element. If these operations are called on an empty stack, you should return -1 as an error indicator.

Process all the given operations and print the return value for each 'pop', 'top', and 'size' command on a new line.`,

  examples: [
    {
      input: '7\npush 5\npush 10\nsize\ntop\npop\ntop\nclear',
      output: '2\n10\n10\n5',
      explanation: 'Push 5, stack [5]. Push 10, stack [5, 10]. Size returns 2. Top returns 10. Pop removes and returns 10. Top now returns 5. Clear empties the stack.'
    },
    {
      input: '4\npop\ntop\nsize\nclear',
      output: '-1\n-1\n0',
      explanation: 'Operations on an empty stack correctly return -1 or 0 for size.'
    },
    {
      input: '5\npush 1\npush 2\nclear\nsize\ntop',
      output: '0\n-1',
      explanation: 'After clearing the stack, its size is 0 and topping it returns -1.'
    }
  ],

  constraints: [
    'The number of operations is between 1 and 5000.',
    'The value for push operations is between -10^9 and 10^9.'
  ],

  boilerplate: {
    cpp: `class MyStack {
public:
    void push(int x) {
        // Your code here
    }

    int pop() {
        // Your code here
        return -1;
    }

    int top() {
        // Your code here
        return -1;
    }

    int size() {
        // Your code here
        return 0;
    }

    void clear() {
        // Your code here
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
            int x; std::cin >> x; st.push(x);
        } else if (op == "pop") {
            std::cout << st.pop() << std::endl;
        } else if (op == "top") {
            std::cout << st.top() << std::endl;
        } else if (op == "size") {
            std::cout << st.size() << std::endl;
        } else if (op == "clear") {
            st.clear();
        }
    }
    return 0;
}`,
    java: `class MyStack {
    // Choose your underlying data structure

    public void push(int x) {
        // Your code here
    }

    public int pop() {
        // Your code here
        return -1;
    }

    public int top() {
        // Your code here
        return -1;
    }

    public int size() {
        // Your code here
        return 0;
    }

    public void clear() {
        // Your code here
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
            switch (op) {
                case "push": st.push(sc.nextInt()); break;
                case "pop": System.out.println(st.pop()); break;
                case "top": System.out.println(st.top()); break;
                case "size": System.out.println(st.size()); break;
                case "clear": st.clear(); break;
            }
        }
        sc.close();
    }
}`
  },

  testCases: [
    { input: '7\npush 5\npush 10\nsize\ntop\npop\ntop\nclear', expected: '2\n10\n10\n5' },
    { input: '4\npop\ntop\nsize\nclear', expected: '-1\n-1\n0' },
    { input: '1\nsize', expected: '0' },
    { input: '2\npush 10\nsize', expected: '1' },
    { input: '8\npush 1\npush 2\npop\ntop\npop\nsize\ntop\npop', expected: '2\n1\n1\n0\n-1\n-1' },
    { input: '4\npush 0\ntop\npop\nsize', expected: '0\n0\n0' },
    { input: '5\npush -100\ntop\npop\ntop\npop', expected: '-100\n-100\n-1\n-1' },
    { input: '6\npush 1\npush 2\nclear\nsize\ntop\npop', expected: '0\n-1\n-1' },
    { input: '2\npush 1000000000\ntop', expected: '1000000000' },
    { input: '2\npush -1000000000\ntop', expected: '-1000000000' }
  ],
  
  solution: {
    approach: `Using a dynamic array (like std::vector or ArrayList) is a straightforward way to implement this stack. 'push' adds to the end of the array. 'pop' checks if the array is empty (returning -1 if so), otherwise it retrieves and then removes the last element. 'top' also checks for empty, returning -1 or the last element without removal. 'size' simply returns the current size of the array, and 'clear' reinitializes the array to an empty state.`,
    cpp: `private:
    std::vector<int> data;
public:
    void push(int x) {
        data.push_back(x);
    }

    int pop() {
        if (data.empty()) return -1;
        int topVal = data.back();
        data.pop_back();
        return topVal;
    }

    int top() {
        if (data.empty()) return -1;
        return data.back();
    }

    int size() {
        return data.size();
    }

    void clear() {
        data.clear();
    }`,
    java: `    private java.util.ArrayList<Integer> stack = new java.util.ArrayList<>();

    public void push(int x) {
        stack.add(x);
    }

    public int pop() {
        if (stack.isEmpty()) return -1;
        return stack.remove(stack.size() - 1);
    }

    public int top() {
        if (stack.isEmpty()) return -1;
        return stack.get(stack.size() - 1);
    }

    public int size() {
        return stack.size();
    }

    public void clear() {
        stack.clear();
    }`
  }
};