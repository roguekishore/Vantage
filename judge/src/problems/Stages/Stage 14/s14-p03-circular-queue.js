/**
 * Circular Queue - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer k (capacity of the queue) and q (number of operations).
 * Next q lines: The operation name followed by its argument (if any).
 * * Operations:
 * - enqueue(val): Add an integer to the rear. Return true if successful, false if full.
 * - dequeue(): Remove the front element. Return true if successful, false if empty.
 * - Front(): Return the front element. If empty, return -1.
 * - Rear(): Return the last element. If empty, return -1.
 * - isEmpty(): Return true or false.
 * - isFull(): Return true or false.
 *
 * Output format (stdout):
 * The boolean result or the value returned by each operation on a new line.
 */

module.exports = {
  id: 'circular-queue',
  conquestId: 'stage14-3',
  title: 'Circular Queue',
  difficulty: 'Medium',
  category: 'Queue',
  tags: ['Queue', 'Design', 'Array', 'Modulo'],

  storyBriefing: `Inside Honeydukes, you notice the clever system they use for displaying Fizzing Whizzbees. They are arranged on a circular shelf with a fixed number of spots. When a customer takes one from the front, a mechanism rotates the shelf, and the shopkeeper restocks it at the newly opened spot at the back. This way, they reuse the space efficiently without ever 'running out' of shelf. "A circular queue!" you realize. The shopkeeper overhears you. "Indeed! Think you can manage it? Keep track of the items for me."`,

  description: `You are asked to design a circular queue. A circular queue (also known as a ring buffer) is a fixed-size queue in which the last position is connected back to the first, creating a circle. This structure efficiently reuses empty space in the array that is created by dequeuing elements.

Your implementation should use a fixed-size array and pointers for the head and tail. The key to making it circular is using the modulo operator for incrementing the pointers, which allows them to "wrap around" to the beginning of the array. You must also reliably detect when the queue is full or empty.

Implement the MyCircularQueue class, which supports all standard queue operations in O(1) time complexity.`,

  examples: [
    {
      input: '3 8\nenqueue 1\nenqueue 2\nenqueue 3\nenqueue 4\nRear\nisFull\ndequeue\nenqueue 4',
      output: 'true\ntrue\ntrue\nfalse\n3\ntrue\ntrue\ntrue',
      explanation: 'Create a queue of size 3. Enqueue 1, 2, 3 works. Enqueue 4 fails because it is full. Rear is 3. isFull is true. Dequeue succeeds. Now there is space, so enqueue 4 succeeds.'
    },
    {
      input: '2 5\nenqueue 1\nenqueue 2\ndequeue\nFront\ndequeue',
      output: 'true\ntrue\ntrue\n2\ntrue',
      explanation: 'Enqueue 1, 2. Queue is [1, 2]. Dequeue removes 1. Front is now 2. Dequeue removes 2. Queue is now empty.'
    },
    {
      input: '2 2\nFront\nRear',
      output: '-1\n-1',
      explanation: 'Checking Front and Rear on an empty queue returns -1.'
    }
  ],

  constraints: [
    'The capacity of the queue (k) is between 1 and 1000.',
    'The number of operations is between 1 and 3000.',
    'Values for enqueue are between 0 and 1000.'
  ],

  boilerplate: {
    cpp: `class MyCircularQueue {
public:
    MyCircularQueue(int k) {
        // Your code here
    }
    
    bool enQueue(int value) {
        // Your code here
        return false;
    }
    
    bool deQueue() {
        // Your code here
        return false;
    }
    
    int Front() {
        // Your code here
        return -1;
    }
    
    int Rear() {
        // Your code here
        return -1;
    }
    
    bool isEmpty() {
        // Your code here
        return true;
    }
    
    bool isFull() {
        // Your code here
        return false;
    }
private:
    // Choose your underlying data structure
};

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
int main() {
    int k, q;
    std::cin >> k >> q;
    MyCircularQueue* obj = new MyCircularQueue(k);
    while(q--) {
        std::string op; std::cin >> op;
        if(op == "enQueue") {
            int val; std::cin >> val; std::cout << (obj->enQueue(val) ? "true" : "false") << std::endl;
        } else if(op == "deQueue") {
            std::cout << (obj->deQueue() ? "true" : "false") << std::endl;
        } else if(op == "Front") {
            std::cout << obj->Front() << std::endl;
        } else if(op == "Rear") {
            std::cout << obj->Rear() << std::endl;
        } else if(op == "isEmpty") {
            std::cout << (obj->isEmpty() ? "true" : "false") << std::endl;
        } else if(op == "isFull") {
            std::cout << (obj->isFull() ? "true" : "false") << std::endl;
        }
    }
    delete obj;
    return 0;
}`,
    java: `class MyCircularQueue {
    // Choose your underlying data structure
    
    public MyCircularQueue(int k) {
        // Your code here
    }
    
    public boolean enQueue(int value) {
        // Your code here
        return false;
    }
    
    public boolean deQueue() {
        // Your code here
        return false;
    }
    
    public int Front() {
        // Your code here
        return -1;
    }
    
    public int Rear() {
        // Your code here
        return -1;
    }
    
    public boolean isEmpty() {
        // Your code here
        return true;
    }
    
    public boolean isFull() {
        // Your code here
        return false;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if(!sc.hasNextInt()) return;
        int k = sc.nextInt();
        int q = sc.nextInt();
        MyCircularQueue obj = new MyCircularQueue(k);
        while(q-- > 0) {
            String op = sc.next();
            if(op.equals("enQueue")) System.out.println(obj.enQueue(sc.nextInt()));
            else if(op.equals("deQueue")) System.out.println(obj.deQueue());
            else if(op.equals("Front")) System.out.println(obj.Front());
            else if(op.equals("Rear")) System.out.println(obj.Rear());
            else if(op.equals("isEmpty")) System.out.println(obj.isEmpty());
            else if(op.equals("isFull")) System.out.println(obj.isFull());
        }
        sc.close();
    }
}`
  },

  testCases: [
    { input: '3 8\nenQueue 1\nenQueue 2\nenQueue 3\nenQueue 4\nRear\nisFull\ndeQueue\nenQueue 4', expected: 'true\ntrue\ntrue\nfalse\n3\ntrue\ntrue\ntrue' },
    { input: '3 2\nisEmpty\nisFull', expected: 'true\nfalse' },
    { input: '2 6\nenQueue 1\nenQueue 2\ndeQueue\nFront\ndeQueue\nFront', expected: 'true\ntrue\ntrue\n2\ntrue\n-1' },
    { input: '1 2\nenQueue 10\ndeQueue', expected: 'true\ntrue' },
    { input: '2 2\ndeQueue\nenQueue 1', expected: 'false\ntrue' },
    { input: '6 11\nenQueue 6\nRear\nRear\ndeQueue\nenQueue 5\nRear\ndeQueue\nFront\ndeQueue\ndeQueue\ndeQueue', expected: 'true\n6\n6\ntrue\ntrue\n5\ntrue\n-1\nfalse\nfalse\nfalse'},
    { input: '3 5\nenQueue 1\nenQueue 2\nFront\nRear\ndeQueue', expected: 'true\ntrue\n1\n2\ntrue'},
    { input: '3 5\nisEmpty\nenQueue 1\nisEmpty\nFront\nRear', expected: 'true\ntrue\nfalse\n1\n1'}
  ],
  
  solution: {
    approach: `The circular queue is implemented with a fixed-size array, a 'head' pointer, a 'tail' pointer, and a 'size' counter. The constructor initializes these values. 'enQueue' checks if the queue is full; if not, it calculates the new tail position using (tail + 1) % capacity, places the element there, and increments the size. 'deQueue' checks if the queue is empty; if not, it simply increments the head pointer using (head + 1) % capacity and decrements the size. 'Front' and 'Rear' return the elements at the head and tail indices, respectively, after checking for emptiness. 'isEmpty' and 'isFull' return true based on the 'size' counter.`,
    cpp: `private:
    std::vector<int> q;
    int head;
    int tail;
    int size;
    int capacity;
public:
    MyCircularQueue(int k) {
        capacity = k;
        q.resize(k);
        head = 0;
        tail = -1;
        size = 0;
    }
    
    bool enQueue(int value) {
        if (isFull()) return false;
        tail = (tail + 1) % capacity;
        q[tail] = value;
        size++;
        return true;
    }
    
    bool deQueue() {
        if (isEmpty()) return false;
        head = (head + 1) % capacity;
        size--;
        return true;
    }
    
    int Front() {
        return isEmpty() ? -1 : q[head];
    }
    
    int Rear() {
        return isEmpty() ? -1 : q[tail];
    }
    
    bool isEmpty() {
        return size == 0;
    }
    
    bool isFull() {
        return size == capacity;
    }`,
    java: `    private final int[] data;
    private int head;
    private int tail;
    private int size;

    public MyCircularQueue(int k) {
        data = new int[k];
        head = -1;
        tail = -1;
        size = 0;
    }
    
    public boolean enQueue(int value) {
        if (isFull()) {
            return false;
        }
        if (isEmpty()) {
            head = 0;
        }
        tail = (tail + 1) % data.length;
        data[tail] = value;
        size++;
        return true;
    }
    
    public boolean deQueue() {
        if (isEmpty()) {
            return false;
        }
        if (head == tail) {
            head = -1;
            tail = -1;
        } else {
            head = (head + 1) % data.length;
        }
        size--;
        return true;
    }
    
    public int Front() {
        if (isEmpty()) {
            return -1;
        }
        return data[head];
    }
    
    public int Rear() {
        if (isEmpty()) {
            return -1;
        }
        return data[tail];
    }
    
    public boolean isEmpty() {
        return size == 0;
    }
    
    public boolean isFull() {
        return size == data.length;
    }`
  }
};