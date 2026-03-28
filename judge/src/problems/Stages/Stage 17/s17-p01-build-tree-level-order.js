/**
 * Build Binary Tree (Level Order) - Problem Definition
 *
 * Input format (stdin):
 * A single line of space-separated values representing the level-order traversal.
 * Use "null" or "-1" to represent a missing node.
 *
 * Output format (stdout):
 * The In-order traversal of the built tree to verify structure.
 */

module.exports = {
  id: 'build-tree-level-order',
  conquestId: 'stage17-1',
  title: 'Build Binary Tree (Level Order)',
  difficulty: 'Medium',
  category: 'Trees – Construction',
  tags: ['Tree', 'Queue', 'BFS'],

  stageIntro: `After the intensity of the first Triwizard task, Professor Lupin pulls you aside. "The tournament tests bravery, but true magic requires understanding structure," he says, revealing a blank piece of parchment. "This is a copy of a map made by my old friends and me. To unlock its secrets, you must first learn to think hierarchically, like the castle itself is structured. We'll start by mapping the main halls and corridors."`,

  storyBriefing: `"To begin our map," Lupin says, tapping the parchment, "we need to translate this simple layout into a proper tree structure. This list describes the castle's main sections, floor by floor, from top to bottom-a level-order traversal. Can you construct the binary tree that represents this layout? We'll check if it's correct by traversing it in-order afterward."`,

  description: `You are given a sequence of integer values representing the level-order traversal of a binary tree. 'null' values indicate the absence of a node. Your task is to construct the corresponding binary tree from this sequence.

A common method to build a tree from a level-order traversal is to use a queue. Start by creating the root node from the first value and add it to the queue. Then, iterate through the remaining values. For each node you process from the queue, assign its left and right children using the next two values in the sequence, adding the newly created children back into the queue to continue the process.

To verify the structure, the final output should be the in-order traversal of the tree you have built.`,

  examples: [
    {
      input: '1 2 3',
      output: '2 1 3',
      explanation: 'The input represents a tree with root 1, left child 2, and right child 3. The in-order traversal is Left-Root-Right, which is 2, 1, 3.'
    },
    {
      input: '1 null 2 3',
      output: '1 3 2',
      explanation: 'The tree has root 1. Its left child is null. Its right child is 2. The node 2 has a left child 3. The in-order traversal is 1, 3, 2.'
    },
    {
      input: '10 5 15 null null 6 20',
      output: '5 10 6 15 20',
      explanation: 'A more complex tree is built, and its in-order traversal confirms the structure.'
    }
  ],

  constraints: [
    'The number of values in the input is between 0 and 10000.',
    'The value of each node is between -1000 and 1000.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

// This function is provided for you. You do not need to modify it.
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
    // This function is provided for you. You do not need to modify it.
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
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
    public static void inOrder(TreeNode root, java.util.List<Integer> result) {
        if (root == null) return;
        inOrder(root.left, result);
        result.add(root.val);
        inOrder(root.right, result);
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] nodes = sc.nextLine().split(" ");
        TreeNode root = Solution.buildTree(nodes);
        
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
    { input: '1 2 3 null null 4 5', expected: '2 1 4 3 5' },
    { input: '10 20 30 40 50', expected: '40 20 50 10 30' },
    { input: '1 null 2 null 3', expected: '1 2 3' },
    { input: '1', expected: '1' },
    { input: 'null', expected: '' },
    { input: '10 5 -3 null 2 null 11 3 -2', expected: '5 2 3 -2 10 -3 11' },
    { input: '1 2 null 3 null 4 null 5', expected: '5 4 3 2 1' },
    { input: '1 2 3 4 5 6 7', expected: '4 2 5 1 6 3 7' }
  ],
  
  solution: {
    approach: `The problem is primarily about setting up the environment correctly, as the core logic for building the tree from a level-order array is typically provided or straightforward. The main task is to call the 'buildTree' function with the parsed input and then perform an in-order traversal on the resulting tree root. An in-order traversal recursively visits the left subtree, then processes the current node, then visits the right subtree. This naturally prints the node values in ascending order for a Binary Search Tree, and in a specific structural order for a regular Binary Tree.`,
    cpp: `// The solution is to correctly call the provided buildTree function
// and then perform an in-order traversal. The boilerplate already
// contains the full solution structure. No code is needed in a solve() function.`,
    java: `// The solution is to correctly call the provided buildTree method
// and then perform an in-order traversal. The boilerplate already
// contains the full solution structure. No code is needed in a solve() method.`
  }
};