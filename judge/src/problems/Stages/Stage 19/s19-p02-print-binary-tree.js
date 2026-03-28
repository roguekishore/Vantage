/**
 * Print Binary Tree - Problem Definition
 *
 * Input format (stdin):
 * A single line of space-separated values representing the level-order traversal.
 *
 * Output format (stdout):
 * A 2D formatted matrix (grid) representing the visual layout of the tree.
 */

module.exports = {
  id: 'print-binary-tree',
  conquestId: 'stage19-2',
  title: 'Print Binary Tree',
  difficulty: 'Hard',
  category: 'Trees – Views & Transformations',
  tags: ['Tree', 'Recursion', 'Matrix', 'DFS'],

  storyBriefing: `Professor Trelawney squints at your list. "Yes, yes, the signs are there... but this is not how one presents a celestial chart! I need a proper two-dimensional drawing of the constellation. The root must be centered, and each subsequent level must be properly spaced so the structure is clear. The Inner Eye requires order!"`,

  description: `You are given the root of a binary tree. Your task is to construct a 2D string array that represents the tree's visual layout according to a specific set of rules.

The grid's height should be equal to the tree's height, and its width should accommodate the widest level. The root node should be placed in the center of the top row. For any node at grid[r][c], its left child should be placed at grid[r+1][c - 2^(height-r-1)] and its right child at grid[r+1][c + 2^(height-r-1)].

This problem requires a two-pass approach. First, determine the height of the tree to calculate the grid dimensions. Second, perform a recursive traversal (DFS) to populate the grid, passing down the current row and column coordinates for each node.`,

  examples: [
    {
      input: '1 2',
      output: '[["", "1", ""], ["2", "", ""]]',
      explanation: 'The tree has height 1. The grid is 2 rows by 3 columns. The root 1 is at [0][1]. Its left child 2 is at [1][0].'
    },
    {
      input: '1 2 3 null 4',
      output: '[["", "", "", "1", "", "", ""], ["", "2", "", "", "", "3", ""], ["", "", "4", "", "", "", ""]]',
      explanation: 'The tree has height 2. The grid is 3 rows by 7 columns. The nodes are placed according to the positioning formula.'
    },
    {
      input: '1',
      output: '[["1"]]',
      explanation: 'A single-node tree has height 0, resulting in a 1x1 grid.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 1 and 200.',
    'The value of each node is between -99 and 99.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

std::vector<std::vector<std::string>> solve(TreeNode* root) {
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
    std::vector<std::vector<std::string>> result = solve(root);
    std::cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {
        std::cout << "[";
        for (size_t j = 0; j < result[i].size(); ++j) {
            std::cout << "\\"" << result[i][j] << "\\"";
            if (j < result[i].size() - 1) std::cout << ", ";
        }
        std::cout << "]";
        if (i < result.size() - 1) std::cout << ", ";
    }
    std::cout << "]" << std::endl;
    return 0;
}`,
    java: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int x) { val = x; }
}

class Solution {
    public static java.util.List<java.util.List<String>> solve(TreeNode root) {
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
        java.util.List<java.util.List<String>> result = Solution.solve(root);
        System.out.print("[");
        for (int i = 0; i < result.size(); i++) {
            System.out.print("[");
            for (int j = 0; j < result.get(i).size(); j++) {
                System.out.print("\\"" + result.get(i).get(j) + "\\"");
                if (j < result.get(i).size() - 1) System.out.print(", ");
            }
            System.out.print("]");
            if (i < result.size() - 1) System.out.print(", ");
        }
        System.out.println("]");
        sc.close();
    }
}`
  },

  testCases: [
    { input: '1 2', expected: '[["", "1", ""], ["2", "", ""]]' },
    { input: '1 2 3 null 4', expected: '[["", "", "", "1", "", "", ""], ["", "2", "", "", "", "3", ""], ["", "", "4", "", "", "", ""]]' },
    { input: '1', expected: '[["1"]]' },
    { input: '1 2 5 3 4 null 6', expected: '[["", "", "", "", "", "", "", "1", "", "", "", "", "", "", ""], ["", "", "", "2", "", "", "", "", "", "", "", "5", "", "", ""], ["", "3", "", "", "", "4", "", "", "", "", "", "", "", "6", ""]]' }
  ],
  
  solution: {
    approach: `The solution first requires a function to find the height of the tree. Once the height 'h' is known, a 2D array of strings with dimensions (h+1) x (2^(h+1) - 1) is created and initialized with empty strings. Then, a recursive 'fill' function is called, starting at the root. This function places the node's value at the given row 'r' and column 'c' and then makes two recursive calls for its children. The key is the formula for the children's columns: the left child is placed at column c - 2^(h-r-1) and the right child at c + 2^(h-r-1), correctly positioning them in the middle of their respective sub-quadrants.`,
    cpp: `    auto getHeight = [](TreeNode* root, auto& self) -> int {
        if (!root) return -1;
        return 1 + std::max(self(root->left, self), self(root->right, self));
    };
    int h = getHeight(root, getHeight);
    int m = h + 1;
    int n = (1 << (h + 1)) - 1;
    std::vector<std::vector<std::string>> res(m, std::vector<std::string>(n, ""));
    
    std::function<void(TreeNode*, int, int)> fill = 
        [&](TreeNode* node, int r, int c) {
        if (!node) return;
        res[r][c] = std::to_string(node->val);
        int offset = 1 << (h - r - 1);
        fill(node->left, r + 1, c - offset);
        fill(node->right, r + 1, c + offset);
    };
    
    fill(root, 0, (n - 1) / 2);
    return res;`,
    java: `    int height = getHeight(root);
    int rows = height + 1;
    int cols = (int) Math.pow(2, height + 1) - 1;
    java.util.List<java.util.List<String>> res = new java.util.ArrayList<>();
    for (int i = 0; i < rows; i++) {
        java.util.List<String> row = new java.util.ArrayList<>();
        for (int j = 0; j < cols; j++) row.add("");
        res.add(row);
    }
    fill(res, root, 0, (cols - 1) / 2, height);
    return res;
}

private int getHeight(TreeNode node) {
    if (node == null) return -1;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

private void fill(java.util.List<java.util.List<String>> res, TreeNode node, int r, int c, int h) {
    if (node == null) return;
    res.get(r).set(c, String.valueOf(node.val));
    fill(res, node.left, r + 1, c - (int) Math.pow(2, h - r - 1), h);
    fill(res, node.right, r + 1, c + (int) Math.pow(2, h - r - 1), h);`
  }
};