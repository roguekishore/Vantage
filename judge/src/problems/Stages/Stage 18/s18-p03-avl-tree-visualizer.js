/**
 * AVL Tree Visualizer - Implementation
 * * An AVL tree maintains a "Balance Factor" for every node.
 * Balance Factor = Height(Left Subtree) - Height(Right Subtree)
 * If |Balance Factor| > 1, a rotation is triggered.
 */

module.exports = {
  id: 'avl-tree-visualizer',
  conquestId: 'stage18-3',
  title: 'AVL Tree',
  difficulty: 'Hard',
  category: 'Trees – Traversals & Properties',
  tags: ['Tree', 'AVL', 'Self-Balancing', 'Recursion'],

  storyBriefing: `Firenze is impressed. "You see the importance of order. But a simple BST map can become unbalanced if new passages are discovered in a sequence. It can become as inefficient as a simple corridor. A superior map would balance itself automatically as new rooms are added. Observe the magic of an AVL tree-it performs 'rotations' to maintain its balance and ensure the path to any room remains short."`,

  description: `An AVL Tree is a self-balancing Binary Search Tree. It maintains a 'balance factor' for every node, which is the difference between the heights of its left and right subtrees. If at any point this factor becomes greater than 1 or less than -1, the tree performs a series of 'rotations' to restore its balance.

This problem is a visualizer. There is no specific task to solve, but rather code to demonstrate how AVL tree insertions and rotations work to maintain balance, ensuring that operations like search, insert, and delete remain O(log n).`,

  examples: [],
  constraints: [],
  boilerplate: {
    cpp: `#include <iostream>
#include <algorithm>
#include <vector>

using namespace std;

struct Node {
    int key;
    Node *left, *right;
    int height;
    Node(int k) : key(k), left(nullptr), right(nullptr), height(1) {}
};

int getHeight(Node* n) { return n ? n->height : 0; }
int getBalance(Node* n) { return n ? getHeight(n->left) - getHeight(n->right) : 0; }

Node* rightRotate(Node* y) {
    Node* x = y->left;
    Node* T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    return x;
}

Node* leftRotate(Node* x) {
    Node* y = x->right;
    Node* T2 = y->left;
    y->left = x;
    x->right = T2;
    x->height = max(getHeight(x->left), getHeight(x->right)) + 1;
    y->height = max(getHeight(y->left), getHeight(y->right)) + 1;
    return y;
}

Node* insert(Node* node, int key) {
    if (!node) return new Node(key);
    if (key < node->key) node->left = insert(node->left, key);
    else if (key > node->key) node->right = insert(node->right, key);
    else return node;

    node->height = 1 + max(getHeight(node->left), getHeight(node->right));
    int balance = getBalance(node);

    // Left Left Case
    if (balance > 1 && key < node->left->key) return rightRotate(node);
    // Right Right Case
    if (balance < -1 && key > node->right->key) return leftRotate(node);
    // Left Right Case
    if (balance > 1 && key > node->left->key) {
        node->left = leftRotate(node->left);
        return rightRotate(node);
    }
    // Right Left Case
    if (balance < -1 && key < node->right->key) {
        node->right = rightRotate(node->right);
        return leftRotate(node);
    }
    return node;
}

void visualize(Node* root, string indent, bool last) {
    if (root != nullptr) {
        cout << indent;
        if (last) {
            cout << "R----";
            indent += "     ";
        } else {
            cout << "L----";
            indent += "|    ";
        }
        cout << root->key << " (h:" << root->height << ")" << endl;
        visualize(root->left, indent, false);
        visualize(root->right, indent, true);
    }
}

int main() {
    Node* root = nullptr;
    vector<int> keys = {10, 20, 30, 40, 50, 25};
    
    for (int k : keys) {
        cout << "\\nInserting " << k << "..." << endl;
        root = insert(root, k);
        visualize(root, "", true);
    }
    return 0;
}`
  },
  testCases: [],
  solution: {
    approach: `This file demonstrates the logic of an AVL tree. The solution involves implementing the four rotation types (Left-Left, Right-Right, Left-Right, and Right-Left) that are triggered when a node's balance factor exceeds 1 or -1 after an insertion. The core 'insert' function is recursive, similar to a standard BST, but after each insertion, it backtracks up the tree, updating heights and checking balance factors at each node, performing rotations as needed to maintain the AVL property.`,
    cpp: `// The provided boilerplate contains the full implementation for demonstration purposes.`,
    java: `// The provided boilerplate contains the full implementation for demonstration purposes.`
  }
};