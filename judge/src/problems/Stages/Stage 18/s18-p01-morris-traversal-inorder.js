/**
 * Morris Inorder Traversal - Problem Definition
 *
 * Input format (stdin):
 * A single line of space-separated values representing the level-order traversal.
 *
 * Output format (stdout):
 * The In-order traversal of the tree using O(1) extra space.
 */

module.exports = {
  id: 'morris-traversal-inorder',
  conquestId: 'stage18-1',
  title: 'Morris Inorder Traversal',
  difficulty: 'Hard',
  category: 'Trees – Traversals & Properties',
  tags: ['Tree', 'Traversal', 'Threaded Binary Tree', 'O(1) Space'],

  stageIntro: `Hagrid, hearing of your map-making skills, asks for your help. "The Forbidden Forest is a right mess," he says, leading you to the forest's edge. "The paths twist and turn, but they follow a sort of 'tree' structure. I need a way to walk every path-a traversal-but me memory's not what it used to be. I can't be usin' a great stack o' notes or goin' back and forth recursively. I need a way to do it with just a few pebbles in me pocket to keep track."`,

  storyBriefing: `Hagrid points to a large, gnarled tree. "Let's start here. We need an in-order traversal. But here's the trick: you can't use recursion or a stack. You can, however, temporarily tie a bit o' string from one branch to another to find your way back. It's an old groundskeeper's secret. By creating these temporary 'threads', you can navigate the whole tree without gettin' lost or needin' extra storage. Show me how it's done."`,

  description: `You are given the root of a binary tree. Your task is to perform an in-order traversal of the tree and return the node values. However, you must do so with O(1) extra space, meaning you cannot use recursion (which uses the call stack) or an explicit stack.

This requires the Morris Traversal algorithm. This clever technique uses the empty right pointers of nodes to create temporary links (or "threads") back to their in-order successors. This allows you to navigate back up the tree without needing a stack. The algorithm carefully creates and then removes these threads, restoring the tree to its original structure upon completion.

Return a single line of space-separated integers representing the in-order traversal of the tree.`,

  examples: [
    {
      input: '1 null 2 3',
      output: '1 3 2',
      explanation: 'The tree has root 1, a null left child, and a right child 2. Node 2 has a left child 3. The in-order traversal (Left, Root, Right) is 1, then the subtree of 2 which is (3, 2). Result: 1 3 2.'
    },
    {
      input: '4 2 5 1 3',
      output: '1 2 3 4 5',
      explanation: 'The in-order traversal of a Binary Search Tree produces a sorted sequence of its values. The Morris traversal correctly achieves this.'
    },
    {
      input: '1',
      output: '1',
      explanation: 'For a single-node tree, the in-order traversal is just the root itself.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 0 and 100000.',
    'The value of each node is between -10^9 and 10^9.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

void solve(TreeNode* root, std::vector<int>& result) {
    // Your code here
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
    std::vector<int> result;
    solve(root, result);
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
    { input: '1 2 3 4 5', expected: '4 2 5 1 3' },
    { input: '1 null 2 3', expected: '1 3 2' },
    { input: '10 5 15', expected: '5 10 15' },
    { input: '1', expected: '1' },
    { input: '', expected: '' },
    { input: '4 2 7 1 3 6 9', expected: '1 2 3 4 6 7 9' },
    { input: '1 2 null 3 null 4 null 5', expected: '5 4 3 2 1' },
    { input: '1 null 2 3 4 null 5', expected: '1 3 5 4 2' }
  ],
  
  solution: {
    approach: `The Morris Traversal algorithm initializes a 'current' pointer to the root. While 'current' is not null, it checks if there is a left child. If not, it processes the current node and moves to the right. If there is a left child, it finds the in-order predecessor (the rightmost node in the left subtree). If the predecessor's right child is null, a 'thread' is created from the predecessor back to the 'current' node, and the algorithm moves to the left child. If the predecessor's right child is already pointing to the 'current' node, it means the left subtree has been visited. The algorithm then breaks the thread, processes the 'current' node, and moves to the right child. This continues until the entire tree is traversed.`,
    cpp: `    TreeNode* curr = root;
    while (curr != NULL) {
        if (curr->left == NULL) {
            result.push_back(curr->val);
            curr = curr->right;
        } else {
            TreeNode* pre = curr->left;
            while (pre->right != NULL && pre->right != curr) {
                pre = pre->right;
            }

            if (pre->right == NULL) {
                pre->right = curr;
                curr = curr->left;
            } else {
                pre->right = NULL;
                result.push_back(curr->val);
                curr = curr->right;
            }
        }
    }`,
    java: `    java.util.List<Integer> result = new java.util.ArrayList<>();
    TreeNode curr = root;
    while (curr != null) {
        if (curr.left == null) {
            result.add(curr.val);
            curr = curr.right;
        } else {
            TreeNode pre = curr.left;
            while (pre.right != null && pre.right != curr) {
                pre = pre.right;
            }

            if (pre.right == null) {
                pre.right = curr;
                curr = curr.left;
            } else {
                pre.right = null;
                result.add(curr.val);
                curr = curr.right;
            }
        }
    }
    return result;`
  }
};