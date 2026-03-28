/**
 * Flatten Binary Tree to Linked List - Problem Definition
 *
 * Input format (stdin):
 * A single line of space-separated values representing the level-order traversal.
 *
 * Output format (stdout):
 * The level-order traversal of the flattened tree (which will look like a right-skewed list).
 */

module.exports = {
  id: 'flatten-binary-tree',
  conquestId: 'stage19-4',
  title: 'Flatten Binary Tree to Linked List',
  difficulty: 'Medium',
  category: 'Trees – Views & Transformations',
  tags: ['Tree', 'DFS', 'Linked List', 'Recursion'],

  storyBriefing: `As you leave the Astronomy tower, you run into Professor McGonagall. She looks over your celestial charts. "Divination is imprecise nonsense," she says sharply. "True magic is about transformation. A complex structure can be changed into a simple one. Take this tree structure and transfigure it into a simple, linear list, in-place. All nodes must be connected via their 'right' pointers, and all 'left' pointers must be null. Show me you understand true transformation."`,

  description: `You are given the root of a binary tree. Your task is to "flatten" the tree into a linked-list-like structure in-place. After flattening, the left child of every node should be null, and the right child should point to the next node in a pre-order traversal sequence.

This can be solved with a clever recursive approach that performs a reversed pre-order traversal (Right, Left, Root). By keeping track of the previously visited node, you can re-wire the current node's pointers: set its left child to null and its right child to the 'previous' node. This efficiently re-links the nodes into the desired flattened structure.

You must modify the tree in-place; do not create a new list.`,

  examples: [
    {
      input: '1 2 5 3 4 null 6',
      output: '1 null 2 null 3 null 4 null 5 null 6',
      explanation: 'The tree is re-wired so that each node only has a right child, following the pre-order sequence: 1, 2, 3, 4, 5, 6.'
    },
    {
      input: '',
      output: '',
      explanation: 'An empty tree remains an empty tree.'
    },
    {
      input: '1 2',
      output: '1 null 2',
      explanation: 'The node 2 becomes the right child of node 1.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 0 and 2000.',
    'The value of each node is between -100 and 100.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

void solve(TreeNode* root) {
    // Your code here
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <queue>
#include <string>
#include <sstream>

void printLevelOrder(TreeNode* root) {
    if (!root) return;
    std::queue<TreeNode*> q;
    q.push(root);
    std::vector<std::string> res;
    while (!q.empty()) {
        TreeNode* curr = q.front(); q.pop();
        if (curr) {
            res.push_back(std::to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        } else {
            res.push_back("null");
        }
    }
    while (!res.empty() && res.back() == "null") res.pop_back();
    for (size_t i = 0; i < res.size(); i++) {
        std::cout << res[i] << (i == res.size() - 1 ? "" : " ");
    }
}

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
    solve(root);
    printLevelOrder(root);
    std::cout << std::endl;
    return 0;
}`,
    java: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int x) { val = x; }
}

class Solution {
    public static void solve(TreeNode root) {
        // Your code here
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void printLevelOrder(TreeNode root) {
        if (root == null) return;
        java.util.Queue<TreeNode> q = new java.util.LinkedList<>();
        q.add(root);
        java.util.List<String> result = new java.util.ArrayList<>();
        while (!q.isEmpty()) {
            TreeNode node = q.poll();
            if (node != null) {
                result.add(String.valueOf(node.val));
                q.add(node.left);
                q.add(node.right);
            } else {
                result.add("null");
            }
        }
        int lastNonNull = -1;
        for (int i = 0; i < result.size(); i++) {
            if (!result.get(i).equals("null")) {
                lastNonNull = i;
            }
        }
        for (int i = 0; i <= lastNonNull; i++) {
            System.out.print(result.get(i) + (i == lastNonNull ? "" : " "));
        }
    }

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
        Solution.solve(root);
        printLevelOrder(root);
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '1 2 5 3 4 null 6', expected: '1 null 2 null 3 null 4 null 5 null 6' },
    { input: '', expected: '' },
    { input: '0', expected: '0' },
    { input: '1 2', expected: '1 null 2' },
    { input: '1 null 2', expected: '1 null 2' },
    { input: '1 2 3', expected: '1 null 2 null 3' }
  ],
  
  solution: {
    approach: `The most common and elegant in-place solution uses a recursive, reversed pre-order traversal (Right, Left, Root). A global or member variable 'prev' is used to keep track of the previously visited node. In the recursive function for a given 'root', we first make a recursive call on the right child, then the left child. After these calls return, we are at the 'Root' part of the traversal. We then re-wire the pointers: set root.right to 'prev', set root.left to null, and finally, update 'prev' to be the current root. This process, when unwound, correctly links all nodes in a pre-order sequence.`,
    cpp: `    TreeNode* prev = nullptr;
    std::function<void(TreeNode*)> flatten_helper = 
        [&](TreeNode* node) {
        if (!node) return;
        flatten_helper(node->right);
        flatten_helper(node->left);
        node->right = prev;
        node->left = nullptr;
        prev = node;
    };
    flatten_helper(root);`,
    java: `    private TreeNode prev = null;
    public void solve(TreeNode root) {
        if (root == null) {
            return;
        }
        solve(root.right);
        solve(root.left);
        root.right = prev;
        root.left = null;
        prev = root;
    }`
  }
};