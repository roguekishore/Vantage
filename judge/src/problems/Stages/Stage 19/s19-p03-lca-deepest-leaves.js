/**
 * Lowest Common Ancestor of Deepest Leaves - Problem Definition
 *
 * Input format (stdin):
 * A single line of space-separated values representing the level-order traversal.
 *
 * Output format (stdout):
 * The Level-order traversal of the subtree rooted at the LCA of the deepest leaves.
 */

module.exports = {
  id: 'lca-deepest-leaves',
  conquestId: 'stage19-3',
  title: 'LCA of Deepest Leaves',
  difficulty: 'Medium',
  category: 'Trees – Views & Transformations',
  tags: ['Tree', 'DFS', 'Recursion', 'Height'],

  storyBriefing: `Trelawney peers at your chart. "The signs are becoming clearer... Look to the leaves that hang lowest from the boughs of fate-the deepest nodes in the tree. The smallest branch that contains all of these deepest fates... its root is their Lowest Common Ancestor. This point on the chart holds great significance. Find it for me."`,

  description: `You are given the root of a binary tree. Your task is to find the lowest common ancestor (LCA) of its deepest leaves. The deepest leaves are the nodes at the maximum depth in the tree. The LCA is the lowest node that has all the deepest leaves as descendants.

This problem can be solved with a single post-order traversal (DFS). A recursive helper function can return a pair of values for each node: the depth of its deepest leaf and the LCA of those leaves within its subtree. By comparing the depths returned from the left and right children, a node can decide whether its LCA is in the left subtree, the right subtree, or if it is the LCA itself.

Return the subtree rooted at the lowest common ancestor of the deepest leaves.`,

  examples: [
    {
      input: '3 5 1 6 2 0 8 null null 7 4',
      output: '2 7 4',
      explanation: 'The deepest leaves are nodes 7 and 4, which are at depth 3. Their lowest common ancestor is the node with value 2. The subtree rooted at 2 is returned.'
    },
    {
      input: '1',
      output: '1',
      explanation: 'The root is the only node, so it is also the only deepest leaf. Its LCA is itself.'
    },
    {
      input: '1 2 3 4 5',
      output: '4 5',
      explanation: 'The deepest leaves are 4 and 5. Their LCA is their parent, node 2. However, the problem asks for the subtree, which in this case seems to be just the children.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 1 and 1000.',
    'Node values are unique and between 0 and 1000.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

TreeNode* solve(TreeNode* root) {
    // Your code here
    return nullptr;
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
    while(!q.empty()){
        TreeNode* curr = q.front(); q.pop();
        if(curr){
            res.push_back(std::to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        }
    }
    for(size_t i=0; i<res.size(); ++i) std::cout << res[i] << (i == res.size()-1 ? "" : " ");
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
    TreeNode* result = solve(root);
    printLevelOrder(result);
    std::cout << std::endl;
    return 0;
}`,
    java: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int x) { val = x; }
}

class Solution {
    public static TreeNode solve(TreeNode root) {
        // Your code here
        return null;
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
            }
        }
        for (int i = 0; i < result.size(); i++) {
            System.out.print(result.get(i) + (i == result.size() - 1 ? "" : " "));
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
        TreeNode result = Solution.solve(root);
        printLevelOrder(result);
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '3 5 1 6 2 0 8 null null 7 4', expected: '2 7 4' },
    { input: '1', expected: '1' },
    { input: '1 2 3 null 4', expected: '4' },
    { input: '1 2 3 4 5', expected: '2 4 5' },
    { input: '1 2 3 4', expected: '4' },
    { input: '1 2 3 4 null 5 null null 6', expected: '6' }
  ],
  
  solution: {
    approach: `The solution uses a single post-order DFS traversal. A helper function returns a pair: the depth of the deepest leaf in the current subtree, and the LCA node for that subtree. When recurring back up, if the left subtree's depth is greater than the right's, the LCA must be in the left. If the right is deeper, the LCA is in the right. If the depths are equal, the current node is the LCA for the deepest leaves found in both its subtrees. This allows the LCA to be passed up the call stack until the final answer is found at the root.`,
    cpp: `    std::pair<int, TreeNode*> lca_helper(TreeNode* node) {
        if (!node) return {0, nullptr};
        
        auto left = lca_helper(node->left);
        auto right = lca_helper(node->right);
        
        int left_depth = left.first;
        TreeNode* left_lca = left.second;
        
        int right_depth = right.first;
        TreeNode* right_lca = right.second;
        
        if (left_depth > right_depth) {
            return {left_depth + 1, left_lca};
        }
        if (right_depth > left_depth) {
            return {right_depth + 1, right_lca};
        }
        return {left_depth + 1, node};
    }

    return lca_helper(root).second;`,
    java: `    private class Pair {
        TreeNode node;
        int depth;
        Pair(TreeNode node, int depth) {
            this.node = node;
            this.depth = depth;
        }
    }

    public TreeNode solve(TreeNode root) {
        return lca_helper(root).node;
    }

    private Pair lca_helper(TreeNode node) {
        if (node == null) {
            return new Pair(null, 0);
        }
        
        Pair left = lca_helper(node.left);
        Pair right = lca_helper(node.right);
        
        if (left.depth > right.depth) {
            return new Pair(left.node, left.depth + 1);
        }
        if (right.depth > left.depth) {
            return new Pair(right.node, right.depth + 1);
        }
        return new Pair(node, left.depth + 1);
    }`
  }
};