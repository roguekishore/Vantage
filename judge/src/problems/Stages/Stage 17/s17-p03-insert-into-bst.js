/**
 * Insert into a Binary Search Tree - Problem Definition
 *
 * Input format (stdin):
 * Line 1: Space-separated values representing the initial BST in level-order.
 * Line 2: An integer val, the value to insert.
 *
 * Output format (stdout):
 * The In-order traversal of the BST after insertion.
 */

module.exports = {
  id: 'insert-into-bst',
  conquestId: 'stage17-3',
  title: 'Insert in Binary Search Tree',
  difficulty: 'Medium',
  category: 'Trees – Construction',
  tags: ['BST', 'Recursion', 'Binary Tree'],

  storyBriefing: `Lupin smiles. "Searching aimlessly is slow. We need a more intelligent map. From now on, our map will be a Binary Search Tree. All rooms with a lower number will be to the left, and all with a higher number to the right. A new secret passage, number 5, has just been discovered. Insert it into our map, making sure to maintain the BST property."`,

  description: `You are given the root of a Binary Search Tree (BST) and a value to insert. Your task is to insert the value into the BST and return the root of the modified tree. The insertion must maintain the BST property: all values in the left subtree must be less than the node's value, and all values in the right subtree must be greater.

The algorithm for insertion follows the search path down the tree. Starting from the root, you compare the new value with the current node's value to decide whether to go left or right. You continue this process until you reach a null pointer, which is the correct position to insert the new node.

Return the root of the BST after insertion. The value to be inserted is guaranteed to not exist in the original BST.`,

  examples: [
    {
      input: '4 2 7 1 3\n5',
      output: '1 2 3 4 5 7',
      explanation: 'Starting at root 4, 5 is greater, so go right to 7. 5 is less than 7, so go left. The left child of 7 is null, so the new node with value 5 is inserted there. The in-order traversal confirms the new structure.'
    },
    {
      input: '40 20 60 10 30 50 70\n25',
      output: '10 20 25 30 40 50 60 70',
      explanation: 'The value 25 is inserted as the right child of node 20.'
    },
    {
      input: 'null\n5',
      output: '5',
      explanation: 'Inserting into an empty tree creates a new root node.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 0 and 10000.',
    'The value of each node and the value to insert are between -10^8 and 10^8.',
    'All values in the original BST are unique.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

TreeNode* solve(TreeNode* root, int val) {
    // Your code here
    return root;
}

// DO NOT MODIFY THE MAIN FUNCTION
#include <iostream>
#include <vector>
#include <queue>
#include <string>
#include <sstream>

void inOrder(TreeNode* root, std::vector<int>& result) {
    if (!root) return;
    inOrder(root->left, result);
    result.push_back(root->val);
    inOrder(root->right, result);
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
    int val;
    std::cin >> val;
    TreeNode* root = buildTree(nodes);
    root = solve(root, val);

    std::vector<int> result;
    inOrder(root, result);
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
    public static TreeNode solve(TreeNode root, int val) {
        // Your code here
        return root;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void inOrder(TreeNode root, java.util.List<Integer> result) {
        if (root == null) return;
        inOrder(root.left, result);
        result.add(root.val);
        inOrder(root.right, result);
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
        int val = sc.nextInt();
        TreeNode root = buildTree(nodes);
        root = Solution.solve(root, val);
        
        java.util.List<Integer> result = new java.util.ArrayList<>();
        inOrder(root, result);
        for (int i = 0; i < result.size(); ++i) {
            System.out.print(result.get(i) + (i == result.size() - 1 ? "" : " "));
        }
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '4 2 7 1 3\n5', expected: '1 2 3 4 5 7' },
    { input: '40 20 60 10 30 50 70\n25', expected: '10 20 25 30 40 50 60 70' },
    { input: '\n5', expected: '5' },
    { input: '10\n12', expected: '10 12' },
    { input: '10\n8', expected: '8 10' },
    { input: '10 5 15\n12', expected: '5 10 12 15' },
    { input: '10 5 15\n7', expected: '5 7 10 15' },
    { input: '1\n0', expected: '0 1' }
  ],
  
  solution: {
    approach: `The insertion algorithm for a BST can be implemented recursively or iteratively. The recursive approach is often more concise. The base case is when we reach a null node, at which point we create and return a new node with the given value. In the recursive step, we compare the value to be inserted with the current node's value. If the new value is less than the current node's value, we make a recursive call on the left child. If it's greater, we call on the right child. The return value of the recursive call is assigned back to the corresponding child pointer, effectively linking the new node into the tree.`,
    cpp: `    if (root == NULL) {
        return new TreeNode(val);
    }
    if (val < root->val) {
        root->left = solve(root->left, val);
    } else {
        root->right = solve(root->right, val);
    }
    return root;`,
    java: `    if (root == null) {
        return new TreeNode(val);
    }
    if (val < root.val) {
        root.left = solve(root.left, val);
    } else {
        root.right = solve(root.right, val);
    }
    return root;`
  }
};