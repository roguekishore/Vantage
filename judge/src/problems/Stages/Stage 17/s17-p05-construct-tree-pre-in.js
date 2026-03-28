/**
 * Construct Binary Tree from Preorder and Inorder Traversal - Problem Definition
 *
 * Input format (stdin):
 * Line 1: n space-separated integers (Pre-order traversal).
 * Line 2: n space-separated integers (In-order traversal).
 *
 * Output format (stdout):
 * The Level-order traversal of the reconstructed tree.
 */

module.exports = {
  id: 'construct-tree-pre-in',
  conquestId: 'stage17-5',
  title: 'Construct Tree from Preorder and Inorder',
  difficulty: 'Hard',
  category: 'Trees – Construction',
  tags: ['Tree', 'Recursion', 'DFS', 'Hash Map'],

  storyBriefing: `As you perfect the map, the fire in Lupin's office roars to life, and the face of Sirius Black appears in the flames. "That's a good map, but it's not how we Marauders built the original," he says with a grin. "We didn't have a level-by-level guide. We knew only two things: the exact order we first visited each secret room (pre-order), and the layout of rooms relative to the main corridors (in-order). From just those two sequences, you can uniquely reconstruct the original map. Try it."`,

  description: `You are given two integer arrays, 'preorder' and 'inorder', where 'preorder' is the preorder traversal of a binary tree and 'inorder' is the inorder traversal of the same tree. Your task is to construct and return the binary tree.

This is a classic tree problem that can be solved with a recursive approach. The key insight is that the first element of a preorder traversal is always the root of the tree. Once you have the root, you can find its position in the inorder traversal. All elements to the left of the root in the inorder array belong to the left subtree, and all elements to the right belong to the right subtree.

Return the root of the constructed binary tree. To make the lookup of root indices in the inorder array efficient, a hash map can be used.`,

  examples: [
    {
      input: '3 9 20 15 7\n9 3 15 20 7',
      output: '3 9 20 null null 15 7',
      explanation: 'From preorder, 3 is the root. In inorder, 9 is to the left of 3, and [15, 20, 7] is to the right. The algorithm recursively builds the left subtree from preorder [9] and inorder [9], and the right subtree from preorder [20, 15, 7] and inorder [15, 20, 7].'
    },
    {
      input: '-1\n-1',
      output: '-1',
      explanation: 'A tree with a single node has identical preorder and inorder traversals.'
    },
    {
      input: '1 2\n2 1',
      output: '1 2',
      explanation: 'From preorder, 1 is the root. In inorder, 2 is to the left of 1. So, 2 is the left child of 1.'
    }
  ],

  constraints: [
    'The number of elements in both arrays is between 1 and 3000.',
    'Node values are between -3000 and 3000.',
    'All values in the arrays are unique.',
    'preorder and inorder are guaranteed to be valid traversals of the same tree.'
  ],

  boilerplate: {
    cpp: `struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

TreeNode* solve(std::vector<int>& preorder, std::vector<int>& inorder) {
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
    std::vector<std::string> out;
    while(!q.empty()){
        TreeNode* curr = q.front(); q.pop();
        if(curr){
            out.push_back(std::to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        } else {
            out.push_back("null");
        }
    }
    while(!out.empty() && out.back() == "null") out.pop_back();
    for(size_t i=0; i<out.size(); ++i) std::cout << out[i] << (i == out.size()-1 ? "" : " ");
}

int main() {
    std::string line1, line2;
    std::getline(std::cin, line1);
    std::getline(std::cin, line2);
    
    std::stringstream ss1(line1), ss2(line2);
    std::vector<int> preorder, inorder;
    int val;
    while(ss1 >> val) preorder.push_back(val);
    while(ss2 >> val) inorder.push_back(val);
    
    TreeNode* root = solve(preorder, inorder);
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
    public TreeNode solve(int[] preorder, int[] inorder) {
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
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String[] preStr = sc.nextLine().split(" ");
        String[] inStr = sc.nextLine().split(" ");
        
        int[] preorder = java.util.Arrays.stream(preStr).mapToInt(Integer::parseInt).toArray();
        int[] inorder = java.util.Arrays.stream(inStr).mapToInt(Integer::parseInt).toArray();

        Solution solver = new Solution();
        TreeNode root = solver.solve(preorder, inorder);
        printLevelOrder(root);
        System.out.println();
        sc.close();
    }
}`
  },

  testCases: [
    { input: '3 9 20 15 7\n9 3 15 20 7', expected: '3 9 20 null null 15 7' },
    { input: '-1\n-1', expected: '-1' },
    { input: '1 2\n2 1', expected: '1 2' },
    { input: '1 2\n1 2', expected: '1 null 2' },
    { input: '1 2 3\n1 2 3', expected: '1 null 2 null 3' },
    { input: '1 2 3\n3 2 1', expected: '1 2 3' },
    { input: '4 2 1 3 6 5 7\n1 2 3 4 5 6 7', expected: '4 2 6 1 3 5 7'}
  ],
  
  solution: {
    approach: `The recursive solution uses a helper function that takes the boundaries of the current inorder subarray. A global index for the preorder array keeps track of the current root. For each call, we take the current preorder element as the root, find its index in the inorder array to determine the size of the left and right subtrees, and then make two recursive calls: one for the left subtree with the corresponding inorder and preorder segments, and one for the right. A hash map is used to store inorder element indices for O(1) lookup, making the overall algorithm O(n).`,
    cpp: `    std::unordered_map<int, int> inMap;
    for(int i = 0; i < inorder.size(); ++i) {
        inMap[inorder[i]] = i;
    }
    int preIndex = 0;
    
    std::function<TreeNode*(int, int)> build = 
        [&](int left, int right) -> TreeNode* {
        if (left > right) return nullptr;

        int rootVal = preorder[preIndex++];
        TreeNode* root = new TreeNode(rootVal);

        root->left = build(left, inMap[rootVal] - 1);
        root->right = build(inMap[rootVal] + 1, right);
        return root;
    };
    
    return build(0, inorder.size() - 1);`,
    java: `    private int preIndex = 0;
    private java.util.Map<Integer, Integer> inMap = new java.util.HashMap<>();

    public TreeNode solve(int[] preorder, int[] inorder) {
        for (int i = 0; i < inorder.length; i++) {
            inMap.put(inorder[i], i);
        }
        return build(preorder, 0, inorder.length - 1);
    }

    private TreeNode build(int[] preorder, int left, int right) {
        if (left > right) {
            return null;
        }
        int rootVal = preorder[preIndex++];
        TreeNode root = new TreeNode(rootVal);
        int mid = inMap.get(rootVal);
        root.left = build(preorder, left, mid - 1);
        root.right = build(preorder, mid + 1, right);
        return root;
    }`
  }
};