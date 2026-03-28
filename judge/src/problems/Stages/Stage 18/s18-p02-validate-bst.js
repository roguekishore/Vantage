/**
 * Validate Binary Search Tree - Problem Definition
 *
 * Input format (stdin):
 * A single line of space-separated values representing the level-order traversal of the tree.
 * Use "null" to represent missing nodes.
 *
 * Output format (stdout):
 * "true" if the tree is a valid BST, "false" otherwise.
 */

module.exports = {
  id: 'validate-bst',
  conquestId: 'stage18-2',
  title: 'Validate Binary Search Tree',
  difficulty: 'Medium',
  category: 'Trees – Traversals & Properties',
  tags: ['Tree', 'Recursion', 'BST', 'DFS'],

  storyBriefing: `While exploring, you encounter a centaur, Firenze. He studies your magical map. "A noble effort," he says, his voice echoing, "but this path is flawed. A proper Binary Search Tree requires not just that a node is greater than its direct left child, but that it is greater than ALL nodes in its left subtree. Your map violates this. Verify your entire map's structure. Every node must be within the correct bounds set by its ancestors."`,

  description: `You are given the root of a binary tree. Your task is to determine if it is a valid Binary Search Tree (BST). A valid BST is defined as follows: the left subtree of a node contains only nodes with values less than the node's value, the right subtree contains only nodes with values greater than the node's value, and both the left and right subtrees must also be binary search trees.

A simple check between a node and its immediate children is not sufficient. The entire subtree's values must be considered. A common and robust way to solve this is to perform a recursive traversal, passing down valid range boundaries (min and max) for each node to adhere to.

Return true if the tree is a valid BST, and false otherwise.`,

  examples: [
    {
      input: '2 1 3',
      output: 'true',
      explanation: 'The root 2 is greater than its left child 1 and less than its right child 3. This is a valid BST.'
    },
    {
      input: '5 1 4 null null 3 6',
      output: 'false',
      explanation: 'This is not a valid BST. The node with value 3 is in the right subtree of the root 5, which violates the rule that all nodes in the right subtree must be greater than 5.'
    },
    {
      input: '10 5 15 null null 6 20',
      output: 'false',
      explanation: 'The node with value 6 is in the right subtree of node 5, which is correct. However, it is also in the left subtree of root 10, and 6 is not less than 10. The violation is at a higher level.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 0 and 10000.',
    'Node values are 32-bit signed integers.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

bool solve(TreeNode* root) {
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
    TreeNode* root = buildTree(nodes);
    std::cout << (solve(root) ? "true" : "false") << std::endl;
    return 0;
}`,
    java: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int x) { val = x; }
}

class Solution {
    public static boolean solve(TreeNode root) {
        // Your code here
        return false;
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
                curr->left = new TreeNode(Integer.parseInt(nodes[i]));
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
        System.out.println(Solution.solve(root));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '2 1 3', expected: 'true' },
    { input: '5 1 4 null null 3 6', expected: 'false' },
    { input: '10 5 15 null null 6 20', expected: 'false' },
    { input: '2147483647', expected: 'true' },
    { input: '1 1 1', expected: 'false' },
    { input: '', expected: 'true' },
    { input: '1', expected: 'true' },
    { input: '5 4 6 null null 3 7', expected: 'false'}
  ],
  
  solution: {
    approach: `The most reliable way to validate a BST is with a recursive helper function that passes down valid range boundaries for each node. The initial call on the root would have boundaries from negative infinity to positive infinity. For each node, we check if its value falls within the accepted range. If it does, we make two recursive calls: one for the left child, updating the maximum boundary to the current node's value; and one for the right child, updating the minimum boundary to the current node's value. If any check fails at any point, we immediately return false up the call stack. If the entire tree is traversed without any failures, it's a valid BST.`,
    cpp: `    std::function<bool(TreeNode*, long, long)> isValid = 
        [&](TreeNode* node, long min, long max) -> bool {
        if (!node) return true;
        if (node->val <= min || node->val >= max) return false;
        return isValid(node->left, min, node->val) && isValid(node->right, node->val, max);
    };
    return isValid(root, -2147483649L, 2147483648L);`,
    java: `    return isValid(root, null, null);
}

private static boolean isValid(TreeNode node, Integer min, Integer max) {
    if (node == null) {
        return true;
    }
    if ((min != null && node.val <= min) || (max != null && node.val >= max)) {
        return false;
    }
    return isValid(node.left, min, node.val) && isValid(node.right, node.val, max);`
  }
};