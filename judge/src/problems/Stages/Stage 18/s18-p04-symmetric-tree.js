/**
 * Symmetric Tree - Problem Definition
 *
 * Input format (stdin):
 * A single line of space-separated values representing the level-order traversal.
 *
 * Output format (stdout):
 * "true" if the tree is a mirror of itself, "false" otherwise.
 */

module.exports = {
  id: 'symmetric-tree',
  conquestId: 'stage18-4',
  title: 'Symmetric Tree',
  difficulty: 'Easy',
  category: 'Trees – Traversals & Properties',
  tags: ['Tree', 'Recursion', 'Mirror', 'DFS'],

  storyBriefing: `You find a curious clearing in the forest where a tree stands perfectly reflected in a still, magical pond. Hagrid chuckles. "Ah, a Mirror-Image tree. Perfectly symmetrical. A tree is symmetrical if its left side is a perfect mirror image of its right side. It's a sign of powerful, balanced magic. Can you write a charm to verify if a tree has this property?"`,

  description: `You are given the root of a binary tree. Your task is to check whether it is a mirror of itself (i.e., symmetric around its center).

For a tree to be symmetric, the root's left subtree must be a mirror image of its right subtree. This can be solved with a recursive helper function that compares two nodes at a time. The function would check if the left node's left child is a mirror of the right node's right child, and if the left node's right child is a mirror of the right node's left child.

Return true if the tree is symmetric, and false otherwise.`,

  examples: [
    {
      input: '1 2 2 3 4 4 3',
      output: 'true',
      explanation: 'The left subtree [2, 3, 4] is a mirror image of the right subtree [2, 4, 3]. Therefore, the tree is symmetric.'
    },
    {
      input: '1 2 2 null 3 null 3',
      output: 'false',
      explanation: 'The left subtree is [2, null, 3] while the right subtree is [2, null, 3]. This is not a mirror image, so the tree is not symmetric.'
    },
    {
      input: '1',
      output: 'true',
      explanation: 'A single-node tree is always symmetric.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 0 and 1000.',
    'The value of each node is between -100 and 100.'
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
        System.out.println(Solution.solve(root));
        sc.close();
    }
}`
  },

  testCases: [
    { input: '1 2 2 3 4 4 3', expected: 'true' },
    { input: '1 2 2 null 3 null 3', expected: 'false' },
    { input: '1 2 2 2 null 2', expected: 'false' },
    { input: '', expected: 'true' },
    { input: '1', expected: 'true' },
    { input: '1 2 3', expected: 'false' },
    { input: '1 2 2 3 null null 3', expected: 'true' },
    { input: '2 3 3 4 5 5 4 null 6 7 8 8 7 6 null', expected: 'true'}
  ],
  
  solution: {
    approach: `The solution involves a recursive helper function, 'isMirror', that takes two nodes as arguments. The main function calls this helper with the root's left and right children. The 'isMirror' function has several base cases: if both nodes are null, they are symmetric (true). If one is null but the other isn't, they are not (false). If their values don't match, they are not (false). The recursive step is the crucial part: it returns true only if the left node's left child is a mirror of the right node's right child, AND the left node's right child is a mirror of the right node's left child.`,
    cpp: `    if (!root) return true;
    
    std::function<bool(TreeNode*, TreeNode*)> isMirror = 
        [&](TreeNode* t1, TreeNode* t2) -> bool {
        if (!t1 && !t2) return true;
        if (!t1 || !t2) return false;
        return (t1->val == t2->val) && 
               isMirror(t1->left, t2->right) && 
               isMirror(t1->right, t2->left);
    };
    
    return isMirror(root->left, root->right);`,
    java: `    if (root == null) return true;
    return isMirror(root.left, root.right);
}

private static boolean isMirror(TreeNode t1, TreeNode t2) {
    if (t1 == null && t2 == null) return true;
    if (t1 == null || t2 == null) return false;
    return (t1.val == t2.val)
        && isMirror(t1.right, t2.left)
        && isMirror(t1.left, t2.right);`
  }
};