/**
 * Task Scheduler - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n (number of tasks) and k (the cooling time).
 * Line 2: n space-separated characters representing the task types (A-Z).
 *
 * Output format (stdout):
 * A single integer representing the minimum number of units of time 
 * to complete all given tasks.
 */

module.exports = {
  id: 'task-scheduler',
  conquestId: 'stage16-3',
  title: 'Task Scheduler',
  difficulty: 'Medium',
  category: 'Heaps & Priority Queues',
  tags: ['Heap', 'Priority Queue', 'Greedy', 'Hash Map'],

  storyBriefing: `Now comes the real challenge: scheduling the dragon encounters. "Each dragon breed needs a 'cool-down' period 'k' after an encounter before it can be faced again," Crouch explains. "We have a list of dragon breeds we need to get through. To minimize the total time for the first task, we must be as efficient as possible. This means we should always prioritize the dragon breed we have the most of left to face, as long as it's not on cool-down. What's the minimum time this will take?"`,

  description: `You are given a list of tasks, where each task is represented by a character. Each task takes one unit of time. There is a non-negative integer 'k' which represents the cool-down period between two identical tasks. You need to find the minimum time required to complete all tasks.

This is a greedy scheduling problem. To minimize total time, you should always try to execute the task with the highest remaining frequency. A max-heap (or priority queue) is the perfect data structure for this, allowing you to always access the most frequent task in O(1) time. You process tasks in cycles, ensuring the cool-down period is respected by using idle time when necessary.

Return a single integer representing the minimum units of time required.`,

  examples: [
    {
      input: '6 2\nA A A B B B',
      output: '8',
      explanation: 'The schedule is A -> B -> idle -> A -> B -> idle -> A -> B. Each A is separated by at least 2 other operations. The total time is 8 units.'
    },
    {
      input: '6 0\nA A A B B B',
      output: '6',
      explanation: 'With a cool-down period of 0, tasks can be performed in any order without idle time. The total time is simply the number of tasks.'
    },
    {
      input: '4 2\nA A B B',
      output: '5',
      explanation: 'An optimal schedule is A -> B -> idle -> A -> B.'
    }
  ],

  constraints: [
    'The number of tasks is between 1 and 10000.',
    'The cool-down period k is between 0 and 100.',
    'Tasks are represented by uppercase English letters.'
  ],

  boilerplate: {
    cpp: `int solve(std::vector<char>& tasks, int k) {
    // Your code here
    return 0;
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <string>
int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    int n, k;
    if (!(std::cin >> n >> k)) return 0;
    std::vector<char> tasks(n);
    for (int i = 0; i < n; i++) std::cin >> tasks[i];
    
    std::cout << solve(tasks, k) << std::endl;
    return 0;
}`,
    java: `class Solution {
    public static int solve(char[] tasks, int k) {
        // Your code here
        return 0;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int k = sc.nextInt();
        char[] tasks = new char[n];
        for (int i = 0; i < n; i++) tasks[i] = sc.next().charAt(0);
        
        System.out.println(Solution.solve(tasks, k));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '6 2\nA A A B B B', expected: '8' },
    { input: '6 0\nA A A B B B', expected: '6' },
    { input: '12 2\nA A A A A A B C D E F G', expected: '16' },
    { input: '5 2\nA A A B C', expected: '7'}, // A B C A _ _ A
    { input: '4 1\nA A B B', expected: '4'}, // A B A B
    { input: '1\n100\nA', expected: '1'},
    { input: '2 100\nA A', expected: '102'}, // A idles... A
    { input: '7 1\nA A B B C C D', expected: '7'}
  ],
  
  solution: {
    approach: `There are two main approaches. The greedy heap-based simulation processes tasks in cycles. First, count task frequencies. Use a max-heap to store these frequencies. In a loop, simulate time cycles of size k+1. In each cycle, pull up to k+1 tasks from the heap, decrement their counts, and add them to a temporary list. Add the number of tasks processed in this cycle to the total time. After the cycle, add any tasks with remaining counts from the temporary list back to the heap. A much simpler mathematical approach calculates the time based on the most frequent task. The number of idle slots is determined by the frequency of the most common task and the cool-down period. The total time is then the number of tasks plus the number of idle slots. The final answer is the maximum of this calculated time and the actual number of tasks.`,
    cpp: `    std::vector<int> counts(26, 0);
    for (char c : tasks) {
        counts[c - 'A']++;
    }
    
    std::priority_queue<int> pq;
    for (int count : counts) {
        if (count > 0) {
            pq.push(count);
        }
    }
    
    int totalTime = 0;
    while (!pq.empty()) {
        int time = 0;
        std::vector<int> temp;
        for (int i = 0; i < k + 1; ++i) {
            if (!pq.empty()) {
                temp.push_back(pq.top() - 1);
                pq.pop();
                time++;
            }
        }
        
        for (int t : temp) {
            if (t > 0) {
                pq.push(t);
            }
        }
        
        totalTime += pq.empty() ? time : k + 1;
    }
    
    return totalTime;`,
    java: `    int[] freq = new int[26];
    for (char t : tasks) {
        freq[t - 'A']++;
    }
    
    java.util.PriorityQueue<Integer> pq = new java.util.PriorityQueue<>(java.util.Collections.reverseOrder());
    for (int f : freq) {
        if (f > 0) {
            pq.add(f);
        }
    }
    
    int time = 0;
    while (!pq.isEmpty()) {
        java.util.ArrayList<Integer> temp = new java.util.ArrayList<>();
        int i = 0;
        while (i <= k) {
            if (!pq.isEmpty()) {
                if (pq.peek() > 1) {
                    temp.add(pq.poll() - 1);
                } else {
                    pq.poll();
                }
            }
            time++;
            if (pq.isEmpty() && temp.isEmpty()) {
                break;
            }
            i++;
        }
        for (int l : temp) {
            pq.add(l);
        }
    }
    return time;`
  }
};