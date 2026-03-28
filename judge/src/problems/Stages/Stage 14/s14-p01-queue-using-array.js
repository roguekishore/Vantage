/**
 * Queue Implementation using Array - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer q, the number of operations.
 * Next q lines: The operation name followed by its argument (if any).
 * * Operations:
 * - enqueue(val): Add an integer to the end of the queue.
 * - dequeue(): Remove and return the front element. If empty, return -1.
 * - front(): Return the front element without removing it. If empty, return -1.
 * - size(): Return the current number of elements in the queue.
 *
 * Output format (stdout):
 * The result of each dequeue, front, and size operation on a new line.
 */

module.exports = {
  id: 'queue-using-array',
  conquestId: 'stage14-1',
  title: 'Queue: Basic Operations',
  difficulty: 'Easy',
  category: 'Queue',
  tags: ['Queue', 'Data Structure', 'FIFO', 'Array'],

  stageIntro: `Your masterclass in stack-based magic has greatly improved the Weasleys' inventory system. As a reward, they treat you to a trip to Hogsmeade. You arrive outside the famous Honeydukes sweet shop, where a long, orderly queue of students is waiting to get in. The queue operates on a simple, fair principle: First-In, First-Out.`,

  storyBriefing: `The shopkeeper, a cheerful wizard, is managing the line. "It's simple!" he says. "New students 'enqueue' at the back. I 'dequeue' from the front to let them in. I sometimes need to know the 'size' of the line, or check who is at the 'front'. Could you help me keep track? When someone enters, tell me their ticket number. If the line is empty and I try to let someone in, just let me know."`,

  description: `You are asked to implement a queue data structure using an array. A queue follows the First-In-First-Out (FIFO) principle, where the first element added is the first to be removed. You will handle a series of operations and report the results.

Your implementation must support 'enqueue' (add to the back), 'dequeue' (remove from the front), 'front' (view the first element), and 'size'. A naive array implementation where you shift elements after a dequeue is inefficient (O(n)). To achieve an efficient O(1) dequeue, you can use a 'head' pointer to track the front of the queue, effectively treating the array like a sliding window.

Process all given operations and print the return value for each 'dequeue', 'front', and 'size' command. For 'dequeue' and 'front' on an empty queue, return -1.`,

  examples: [
    {
      input: '6\nenqueue 10\nenqueue 20\nfront\ndequeue\nfront\nsize',
      output: '10\n10\n20\n1',
      explanation: 'Enqueue 10, queue is [10]. Enqueue 20, queue is [10, 20]. Front is 10. Dequeue removes and returns 10. Front is now 20. Size is 1.'
    },
    {
      input: '3\ndequeue\nfront\nsize',
      output: '-1\n-1\n0',
      explanation: 'Operations on an empty queue return -1 or 0 for size.'
    },
    {
      input: '4\nenqueue 5\ndequeue\nfront\nsize',
      output: '5\n-1\n0',
      explanation: 'Enqueue 5, then dequeue it. The queue is now empty. Front returns -1 and size returns 0.'
    }
  ],

  constraints: [
    'The number of operations is between 1 and 5000.',
    'The value for enqueue operations is between -10^9 and 10^9.'
  ],

  boilerplate: {
    cpp: `class MyQueue {
public:
    void enqueue(int x) {
        // Your code here
    }

    int dequeue() {
        // Your code here
        return -1;
    }

    int front() {
        // Your code here
        return -1;
    }

    int size() {
        // Your code here
        return 0;
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
    int queries;
    std::cin >> queries;
    while (queries--) {
        std::string op;
        std::cin >> op;
        if (op == "enqueue") {
            int x; std::cin >> x; q.enqueue(x);
        } else if (op == "dequeue") {
            std::cout << q.dequeue() << std::endl;
        } else if (op == "front") {
            std::cout << q.front() << std::endl;
        } else if (op == "size") {
            std::cout << q.size() << std::endl;
        }
    }
    return 0;
}`,
    java: `class MyQueue {
    // Choose your underlying data structure

    public void enqueue(int x) {
        // Your code here
    }

    public int dequeue() {
        // Your code here
        return -1;
    }

    public int front() {
        // Your code here
        return -1;
    }

    public int size() {
        // Your code here
        return 0;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        MyQueue q = new MyQueue();
        if (!sc.hasNextInt()) return;
        int queries = sc.nextInt();
        while (queries-- > 0) {
            String op = sc.next();
            if (op.equals("enqueue")) {
                q.enqueue(sc.nextInt());
            } else if (op.equals("dequeue")) {
                System.out.println(q.dequeue());
            } else if (op.equals("front")) {
                System.out.println(q.front());
            } else if (op.equals("size")) {
                System.out.println(q.size());
            }
        }
        sc.close();
    }
}`
  },

  testCases: [
    { input: '6\nenqueue 10\nenqueue 20\nfront\ndequeue\nfront\nsize', expected: '10\n10\n20\n1' },
    { input: '3\ndequeue\nfront\nsize', expected: '-1\n-1\n0' },
    { input: '1\nsize', expected: '0' },
    { input: '2\nfront\ndequeue', expected: '-1\n-1' },
    { input: '8\nenqueue 1\nenqueue 2\ndequeue\nfront\ndequeue\nsize\nfront\ndequeue', expected: '1\n2\n2\n0\n-1\n-1' },
    { input: '4\nenqueue 0\nfront\ndequeue\nsize', expected: '0\n0\n0' },
    { input: '5\nenqueue -100\nfront\ndequeue\nfront\ndequeue', expected: '-100\n-100\n-1\n-1' },
    { input: '10\nenqueue 1\nenqueue 2\nenqueue 3\nenqueue 4\nenqueue 5\nsize\ndequeue\nsize\ndequeue\nsize', expected: '5\n1\n4\n2\n3' }
  ],
  
  solution: {
    approach: `To achieve an amortized O(1) time complexity for queue operations with an array, we use two pointers: a 'head' index to track the front of the queue, and rely on the dynamic array's size for the rear. For 'enqueue', we add the element to the end of the array. For 'dequeue', we check if the queue is empty (head >= array size). If not, we retrieve the element at the 'head' index and then increment 'head'. 'front' similarly checks for an empty queue and returns the element at 'head' without moving the pointer. 'size' is calculated as the difference between the array's total size and the 'head' index. This avoids costly element shifting.`,
    cpp: `private:
    std::vector<int> data;
    int head = 0;
public:
    void enqueue(int x) {
        data.push_back(x);
    }

    int dequeue() {
        if (size() == 0) return -1;
        return data[head++];
    }

    int front() {
        if (size() == 0) return -1;
        return data[head];
    }

    int size() {
        return data.size() - head;
    }`,
    java: `    private java.util.ArrayList<Integer> data = new java.util.ArrayList<>();
    private int head = 0;

    public void enqueue(int x) {
        data.add(x);
    }

    public int dequeue() {
        if (size() == 0) {
            return -1;
        }
        return data.get(head++);
    }

    public int front() {
        if (size() == 0) {
            return -1;
        }
        return data.get(head);
    }

    public int size() {
        return data.size() - head;
    }`
  }
};