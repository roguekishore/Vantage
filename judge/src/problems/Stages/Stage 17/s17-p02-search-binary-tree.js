/**
 * Search in a Binary Tree - Problem Definition
 *
 * Input format (stdin):
 * Line 1: Space-separated values representing the level-order traversal of the tree.
 * Line 2: An integer target, the value to search for.
 *
 * Output format (stdout):
 * "true" if the target exists in the tree, "false" otherwise.
 */

module.exports = {
  id: 'search-binary-tree',
  conquestId: 'stage17-2',
  title: 'Search in Binary Tree',
  difficulty: 'Easy',
  category: 'Trees – Construction',
  tags: ['Tree', 'Recursion', 'DFS', 'BFS'],

  storyBriefing: `Lupin nods, pleased with the constructed tree. "Good. The basic structure is sound. Now, a map is useless if you can't find anything on it. I need to know if a particular room-let's say the Divination classroom, room number 4-exists in this section of the castle. You'll have to traverse the tree to find out. There's no special order to this map yet, so you'll have to check every path."`,

  description: `You are given the root of a binary tree and a target integer value. Your task is to determine if a node with the target value exists anywhere in the tree.

Because a standard binary tree has no inherent order, you must traverse its nodes until you either find the target value or have visited every node. This can be done using either Depth-First Search (DFS) or Breadth-First Search (BFS). A recursive DFS approach is often the most elegant solution.

Return true if a node with the target value is found, otherwise return false.`,

  examples: [
    {
      input: '4 2 7 1 3\n2',
      output: 'true',
      explanation: 'The traversal finds the node with value 2 in the tree.'
    },
    {
      input: '4 2 7 1 3\n5',
      output: 'false',
      explanation: 'The traversal completes without finding a node with value 5.'
    },
    {
      input: '1 null 2 null 3\n3',
      output: 'true',
      explanation: 'The target value 3 exists in the tree.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 0 and 10000.',
    'The value of each node and the target is between -10^9 and 10^9.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

bool solve(TreeNode* root, int target) {
    // Your code here
    return false;
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
    int target;
    std::cin >> target;
    TreeNode* root = buildTree(nodes);
    std::cout << (solve(root, target) ? "true" : "false") << std::endl;
    return 0;
}`,
    java: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int x) { val = x; }
}

class Solution {
    public static boolean solve(TreeNode root, int target) {
        // Your code here
        return false;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static TreeNode buildTree(String[] nodes) {
        if (nodes.length == 0 || nodes[0].equals("null")) return null;
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
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine();
        int target = sc.nextInt();
        TreeNode root = buildTree(line.split(" "));
        System.out.println(Solution.solve(root, target));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '4 2 7 1 3\n5', expected: 'false' },
    { input: '4 2 7 1 3\n2', expected: 'true' },
    { input: '1\n1', expected: 'true' },
    { input: '1\n0', expected: 'false' },
    { input: 'null\n10', expected: 'false' },
    { input: '1 2 3 4 5 6 7\n7', expected: 'true' },
    { input: '1 2 3 4 5 6 7\n8', expected: 'false' },
    { input: '0\n0', expected: 'true' },
    { input: '-10 5 -3 null 2 null 11 3 -2\n-2', expected: 'true' }
  ],
  
  solution: {
    approach: `The recursive Depth-First Search (DFS) approach is natural for tree traversal. The base case for the recursion is a null node, which means the target isn't in that branch, so we return false. Otherwise, we check if the current node's value matches the target. If it does, we return true. If not, we make two recursive calls: one on the left child and one on the right child. If either of these calls returns true (using the OR || operator), it means the target was found in one of the subtrees, and we propagate this true value up the call stack.`,
    cpp: `    if (root == NULL) {
        return false;
    }
    if (root->val == target) {
        return true;
    }
    return solve(root->left, target) || solve(root->right, target);`,
    java: `    if (root == null) {
        return false;
    }
    if (root.val == target) {
        return true;
    }
    return solve(root.left, target) || solve(root.right, target);`
  }
};