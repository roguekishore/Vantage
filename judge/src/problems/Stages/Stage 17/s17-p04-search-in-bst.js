/**
 * Search in a Binary Search Tree - Problem Definition
 *
 * Input format (stdin):
 * Line 1: Space-separated values representing the BST in level-order.
 * Line 2: An integer target, the value to search for.
 *
 * Output format (stdout):
 * The Level-order traversal of the subtree rooted at the target node.
 * If target is not found, output "null".
 */

module.exports = {
  id: 'search-in-bst',
  conquestId: 'stage17-4',
  title: 'Search in Binary Search Tree',
  difficulty: 'Easy',
  category: 'Trees – Construction',
  tags: ['BST', 'Recursion', 'Binary Tree', 'Optimization'],

  storyBriefing: `Lupin nods. "Excellent. The map is growing, and its structure makes it powerful. Now, prove its efficiency. Find the location of the Potions classroom, room number 2. With this map's ordering, you shouldn't have to search aimlessly. Follow the 'less than, greater than' rule, and it will guide you directly there. Show me the sub-map rooted at that classroom."`,

  description: `You are given the root of a Binary Search Tree (BST) and a target value. Your task is to find the node in the BST that has the given value. If such a node exists, you should return the subtree rooted at that node.

Unlike a regular binary tree search, a BST search is highly efficient. Because the tree is ordered, you can eliminate half of the remaining nodes at each step. By comparing the target value with the current node's value, you can decide to go left if the target is smaller, go right if it's larger, or stop if you've found a match.

Return the subtree of the found node. If the node is not found, return null. The time complexity for this operation is O(log n) on a balanced tree.`,

  examples: [
    {
      input: '4 2 7 1 3\n2',
      output: '2 1 3',
      explanation: 'Search starts at root 4. Target 2 is less than 4, so go left. Current node is 2. Target 2 matches node value. The subtree rooted at 2, which is [2, 1, 3], is returned.'
    },
    {
      input: '4 2 7 1 3\n5',
      output: 'null',
      explanation: 'Search starts at root 4, goes right to 7. Target 5 is less than 7, go left. Current node is null. Target not found, return null.'
    },
    {
      input: '18 2 22 null null null 63\n22',
      output: '22 null 63',
      explanation: 'The node with value 22 is found, and its subtree [22, null, 63] is returned.'
    }
  ],

  constraints: [
    'The number of nodes in the tree is between 1 and 5000.',
    'The value of each node is unique and between 1 and 10^7.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

TreeNode* solve(TreeNode* root, int val) {
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
    if (!root) { std::cout << "null"; return; }
    std::queue<TreeNode*> q;
    q.push(root);
    std::vector<std::string> res;
    while (!q.empty()) {
        TreeNode* curr = q.front(); q.pop();
        if (curr) {
            res.push_back(std::to_string(curr->val));
            if (curr->left || curr->right) {
                 q.push(curr->left);
                 q.push(curr->right);
            } else if (!q.empty()) {
                 q.push(curr->left);
                 q.push(curr->right);
            }
        } else {
             res.push_back("null");
        }
    }
    while (!res.empty() && res.back() == "null") res.pop_back();
    for (size_t i = 0; i < res.size(); i++) std::cout << res[i] << (i == res.size() - 1 ? "" : " ");
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
    int target;
    std::cin >> target;
    TreeNode* root = buildTree(nodes);
    TreeNode* res = solve(root, target);
    printLevelOrder(res);
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
        return null;
    }
}

// DO NOT MODIFY THE MAIN CLASS
public class Main {
     public static void printLevelOrder(TreeNode root) {
        if (root == null) {
            System.out.print("null");
            return;
        }
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
        int target = sc.nextInt();
        TreeNode root = buildTree(nodes);
        TreeNode res = Solution.solve(root, target);
        printLevelOrder(res);
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '4 2 7 1 3\n2', expected: '2 1 3' },
    { input: '4 2 7 1 3\n5', expected: 'null' },
    { input: '18 2 22 null null 21 63\n22', expected: '22 21 63' },
    { input: '1\n1', expected: '1' },
    { input: '10 5 15\n15', expected: '15' },
    { input: '10 5 15\n4', expected: 'null'},
    { input: '10 5 15\n16', expected: 'null'}
  ],
  
  solution: {
    approach: `The search can be performed either recursively or iteratively. The iterative approach uses a loop that continues as long as the current node is not null. Inside the loop, if the current node's value matches the target, we return the node. If the target is less than the current node's value, we traverse to the left child. Otherwise, we traverse to the right child. If the loop finishes without finding the target, it means we've fallen off the tree, and we return null.`,
    cpp: `    while (root != NULL && root->val != val) {
        root = val < root->val ? root->left : root->right;
    }
    return root;`,
    java: `    while (root != null && root.val != val) {
        root = val < root.val ? root.left : root.right;
    }
    return root;`
  }
};