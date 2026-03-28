/**
 * Minimum Speed to Arrive on Time - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of train segments.
 * Line 2: n space-separated integers representing the distance of each segment.
 * Line 3: A double representing the total hour limit.
 *
 * Output format (stdout):
 * A single integer representing the minimum positive integer speed (km/h) 
 * needed to reach the office on time. If it's impossible, return -1.
 */

module.exports = {
  // ---- Identity ----
  id: 'min-speed-to-arrive-on-time',
  conquestId: 'stage9-5',
  title: 'Minimum Speed to Arrive on Time',
  difficulty: 'Medium',
  category: 'Binary Search – Advanced',
  tags: ['Array', 'Binary Search', 'Binary Search on Answer'],

  // ---- Story Layer ----
  storyBriefing: `Professor Dumbledore summons you with an urgent task. You must travel a sequence of 'n' magical passages, with known distances, to deliver a message. You have a strict time limit of 'hour'. Each passage, except the last, requires you to wait for the next whole hour before proceeding. Your job is to find the minimum integer speed you must maintain through all passages to arrive on time. If it's impossible, you must report back immediately.`,

  // ---- Technical Layer ----
  description: `You are given a floating-point number 'hour' and an integer array 'dist' of n distances. You must travel through n segments sequentially. For each of the first n-1 segments, you must wait until the next integer hour to depart for the next one. Your task is to find the minimum positive integer speed that allows you to complete the journey within the given 'hour' limit.

This problem is solved by performing a binary search on the answer (the speed). The search space for speed is from 1 to a reasonable upper bound (e.g., 10^7, as speeds higher than that won't significantly change the time for integer distances). For a given 'mid' speed, you can calculate the total time required. If this time is within the 'hour' limit, 'mid' is a possible answer, so you try for a lower speed. Otherwise, you need a higher speed.

Return the minimum integer speed, or -1 if it's impossible to arrive on time.`,
  examples: [
    {
      input: '3\n1 3 2\n6.0',
      output: '1',
      explanation: 'At speed 1, times are 1, 3, and 2. Total time is 1+3+2=6.0. This is within the limit.'
    },
    {
      input: '3\n1 3 2\n2.7',
      output: '3',
      explanation: 'At speed 3, time is ceil(1/3) + ceil(3/3) + 2/3 = 1 + 1 + 0.666... = 2.666..., which is <= 2.7. A speed of 2 would be too slow.'
    },
    {
      input: '3\n1 3 2\n1.9',
      output: '-1',
      explanation: 'It is impossible. The first two train rides require at least 1 hour each due to waiting, summing to 2 hours, which is greater than the 1.9-hour limit.'
    }
  ],
  constraints: [
    '1 <= dist.length <= 10^5',
    '1 <= dist[i] <= 10^5',
    '1.0 <= hour <= 10^9'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <cmath>
#include <iomanip>

using namespace std;

bool canReach(const vector<int>& dist, double hour, int speed) {
    // Your logic here
    return false;
}

int solve(int n, vector<int>& dist, double hour) {
    int left = 1, right = 1e7;
    int ans = -1;
    
    // Binary Search on Answer
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (canReach(dist, hour, mid)) {
            ans = mid;
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    return ans;
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> dist(n);
    for (int i = 0; i < n; i++) cin >> dist[i];
    double hour;
    cin >> hour;
    
    cout << solve(n, dist, hour) << endl;
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.Scanner;

public class Main {
    public static boolean canReach(int[] dist, double hour, int speed) {
        // Your logic here
        return false;
    }

    public static int solve(int n, int[] dist, double hour) {
        int left = 1, right = 10000000;
        int ans = -1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (canReach(dist, hour, mid)) {
                ans = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return ans;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] dist = new int[n];
        for (int i = 0; i < n; i++) dist[i] = sc.nextInt();
        double hour = sc.nextDouble();
        
        System.out.println(solve(n, dist, hour));
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '3\n1 3 2\n6.0', expected: '1' },
    { input: '3\n1 3 2\n2.7', expected: '3' },
    { input: '3\n1 3 2\n1.9', expected: '-1' },
    { input: '1\n100\n10.0', expected: '10' },
    { input: '1\n100\n9.9', expected: '11' },
    { input: '2\n1 1\n1.0', expected: '-1' },
    { input: '2\n1 1\n1.01', expected: '100' },
    { input: '4\n5 3 2 4\n5.5', expected: '4' },
    { input: '4\n5 3 2 4\n3.0', expected: '-1' },
    { input: '5\n10 10 10 10 10\n4.0', expected: '-1' }
  ],

  // ---- Solution ----
  solution: {
    approach: `This problem requires a binary search on the answer (speed). The search space for speed is from 1 to 10^7 (a sufficiently large number). For each 'mid' speed in the binary search, a helper function 'canReach' calculates the total time taken. This function iterates through the distances. For all but the last segment, time taken is ceil(dist[i] / speed). For the last segment, it's just dist[n-1] / speed. If the total time is within the 'hour' limit, 'mid' is a possible answer, so we try a smaller speed by setting 'right = mid - 1'. Otherwise, 'mid' is too slow, and we set 'left = mid + 1'. An initial check is needed: if 'hour' is less than or equal to 'n - 1', it's impossible, since each of the first n-1 segments takes at least 1 hour.`,
    cpp: `double time = 0.0;
for (int i = 0; i < dist.size(); ++i) {
    double t = (double)dist[i] / speed;
    if (i == dist.size() - 1) {
        time += t;
    } else {
        time += ceil(t);
    }
}
return time <= hour;`,
    java: `double time = 0.0;
for (int i = 0; i < dist.length; i++) {
    double t = (double)dist[i] / speed;
    if (i == dist.length - 1) {
        time += t;
    } else {
        time += Math.ceil(t);
    }
}
return time <= hour;`
  }
};