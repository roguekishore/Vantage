/**
 * Binary Tree Right Side View - Problem Definition
 *
 * Input format (stdin):
 * A single line of space-separated values representing the level-order traversal.
 *
 * Output format (stdout):
 * The values of the nodes you can see from the right side, ordered from top to bottom.
 */

module.exports = {
  id: 'binary-tree-right-side-view',
  conquestId: 'stage19-1',
  title: 'Binary Tree Right Side View',
  difficulty: 'Medium',
  category: 'Trees – Views & Transformations',
  tags: ['Tree', 'BFS', 'Level Order', 'DFS'],

  stageIntro: `Your success in mapping the Forbidden Forest has led you to your next lesson, this time high in the Astronomy Tower. Professor Trelawney, the Divination teacher, gestures to the stars, which seem to form a massive, twinkling binary tree in the night sky. "Reading the future requires seeing things from a different perspective," she says in her misty voice. "Today, we will not traverse the whole structure, but observe its outer shape."`,

  storyBriefing: `Professor Trelawney hands you a celestial chart. "Imagine you are viewing this constellation from the far right," she instructs. "Some stars will be hidden behind others. I want you to tell me which stars are visible from this vantage point, from top to bottom. A level-headed approach might be best-consider what you can see on each horizontal layer of the heavens."`,

  description: `You are given the root of a binary tree. Your task is to imagine yourself standing on the right side of it and return the values of the nodes you can see, ordered from top to bottom.

This problem can be solved effectively using a Level-Order Traversal (BFS). By traversing the tree level by level, you can identify that the last node encountered on each level is the one that will be visible from the right side. You simply need to collect these nodes.

Return an array of integers representing the right side view of the tree.`,

  examples: [
    {
      input: '1 2 3 null 5 null 4',
      output: '1 3 4',
      explanation: 'On level 0, you see node 1. On level 1, node 2 is hidden by node 3. On level 2, node 5 is hidden by node 4. The visible nodes are 1, 3, and 4.'
    },
    {
      input: '1 null 3',
      output: '1 3',
      explanation: 'On level 0, you see 1. On level 1, you see 3. The result is [1, 3].'
    },
    {
      input: '1 2',
      output: '1 2',
      explanation: 'On level 0, you see 1. On level 1, you see 2. The result is [1, 2].'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 0 and 100.',
    'The value of each node is between -100 and 100.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

std::vector<int> solve(TreeNode* root) {
    // Your code here
    return {};
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <queue>
#include <string>
#include <sstream>

TreeNode* buildTree(const std::vector<std::string>& nodes) {
    if (nodes.empty() || nodes[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(std::stoi(nodes[0]));
    std::queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < nodes.size()) {
        TreeNode* curr = q.front();
        q.pop();
        if (i < nodes.size() && nodes[i] != "null") {
            curr->left = new TreeNode(std::stoi(nodes[i]));
            q.push(curr->left);
        }
        i++;
        if (i < nodes.size() && nodes[i] != "null") {
            curr->right = new TreeNode(std::stoi(nodes[i]));
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::stringstream ss(line);
    std::string val_str;
    std::vector<std::string> nodes;
    while (ss >> val_str) {
        nodes.push_back(val_str);
    }
    TreeNode* root = buildTree(nodes);
    std::vector<int> result = solve(root);
    for (int i = 0; i < result.size(); ++i) {
        std::cout << result[i] << (i == result.size() - 1 ? "" : " ");
    }
    std::cout << std::endl;
    return 0;
}`,
    java: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int x) { val = x; }
}

class Solution {
    public static java.util.List<Integer> solve(TreeNode root) {
        // Your code here
        return new java.util.ArrayList<>();
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static TreeNode buildTree(String[] nodes) {
        if (nodes.length == 0 || nodes[0].equals("null") || nodes[0].isEmpty()) return null;
        TreeNode root = new TreeNode(Integer.parseInt(nodes[0]));
        java.util.Queue<TreeNode> q = new java.util.LinkedList<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < nodes.length) {
            TreeNode curr = q.poll();
            if (i < nodes.length && !nodes[i].equals("null")) {
                curr.left = new TreeNode(Integer.parseInt(nodes[i]));
                q.add(curr.left);
            }
            i++;
            if (i < nodes.length && !nodes[i].equals("null")) {
                curr.right = new TreeNode(Integer.parseInt(nodes[i]));
                q.add(curr.right);
            }
            i++;
        }
        return root;
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String line = sc.nextLine();
        String[] nodes = line.isEmpty() ? new String[0] : line.split(" ");
        TreeNode root = buildTree(nodes);
        java.util.List<Integer> result = Solution.solve(root);
        for (int i = 0; i < result.size(); ++i) {
            System.out.print(result.get(i) + (i == result.size() - 1 ? "" : " "));
        }
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '1 2 3 null 5 null 4', expected: '1 3 4' },
    { input: '1 null 3', expected: '1 3' },
    { input: '', expected: '' },
    { input: '1 2', expected: '1 2' },
    { input: '1 2 3 4', expected: '1 3 4' },
    { input: '1 2 3 null 4 null 5 null 6', expected: '1 3 5 6' },
    { input: '10 20 30 null 40 null 50', expected: '10 30 50' }
  ],
  
  solution: {
    approach: `The BFS (Level-Order Traversal) approach uses a queue to process the tree level by level. We start by adding the root to the queue. In a loop, we determine the number of nodes at the current level. We then iterate that many times, dequeuing each node. For each node, we add its left and right children to the queue for the next level's processing. The key is to identify the last node of each level; when our inner loop is at its final iteration, we add that node's value to our result list. This continues until the queue is empty.`,
    cpp: `    std::vector<int> res;
    if (!root) return res;

    std::queue<TreeNode*> q;
    q.push(root);

    while (!q.empty()) {
        int levelSize = q.size();
        for (int i = 0; i < levelSize; i++) {
            TreeNode* curr = q.front();
            q.pop();

            if (i == levelSize - 1) {
                res.push_back(curr->val);
            }

            if (curr->left) q.push(curr->left);
            if (curr->right) q.push(curr->right);
        }
    }
    return res;`,
    java: `    java.util.List<Integer> result = new java.util.ArrayList<>();
    if (root == null) return result;
    
    java.util.Queue<TreeNode> queue = new java.util.LinkedList<>();
    queue.add(root);
    
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            TreeNode current = queue.poll();
            if (i == size - 1) {
                result.add(current.val);
            }
            if (current.left != null) queue.add(current.left);
            if (current.right != null) queue.add(current.right);
        }
    }
    return result;`
  }
};