/**
 * Implement Trie (Prefix Tree) — Problem Definition
 *
 * Input format (stdin):
 * A sequence of commands: "Trie" (initialize), "insert", "search", "startsWith".
 * Followed by the arguments for each command.
 *
 * Output format (stdout):
 * A sequence of results: null (for init/insert), true, or false.
 */

module.exports = {
  id: 'implement-trie',
  conquestId: 'stage18-5',
  title: 'Implement Trie (Prefix Tree)',
  difficulty: 'Medium',
  category: 'Trees – Traversals & Properties',
  tags: ['Trie', 'String', 'Tree', 'Design'],

  description: `A **Trie** (pronounced "try") or **Prefix Tree** is a special type of tree used to efficiently store and retrieve keys in a dataset of strings. 

Unlike a Binary Tree, where nodes store the actual keys, a Trie node stores a single character. The "path" from the root to a specific node represents the string.

### Why use a Trie?
- **Fast Lookups**: Searching for a string of length $L$ takes $O(L)$ time, regardless of how many millions of words are in the Trie.
- **Prefix Matching**: It is the engine behind "Autocomplete" and "Spell Checkers" because it can instantly find all words starting with a specific prefix.

### The Structure
Each node contains:
1.  **Links**: An array (usually size 26 for 'a'-'z') or a map where each index represents a character.
2.  **isEndOfWord**: A boolean flag that marks if a complete word ends at this node.

### Task
Implement the following methods:
- \`insert(word)\`: Inserts the string into the trie.
- \`search(word)\`: Returns \`true\` if the word is in the trie.
- \`startsWith(prefix)\`: Returns \`true\` if there is any word in the trie that starts with the given prefix.`,

  examples: [
    {
      input: 'insert("apple"), search("apple"), search("app"), startsWith("app"), insert("app"), search("app")',
      output: 'null, true, false, true, null, true',
      explanation: 'Initially "app" is just a prefix, not a full word. After inserting "app", search returns true.'
    }
  ],

  constraints: [
    '1 ≤ word.length, prefix.length ≤ 2000',
    'Words consist only of lowercase English letters.',
    'At most 30,000 calls will be made in total.'
  ],

  boilerplate: {
    cpp: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

class TrieNode {
public:
    TrieNode* children[26];
    bool isEndOfWord;

    TrieNode() {
        isEndOfWord = false;
        for (int i = 0; i < 26; i++) children[i] = nullptr;
    }
};

class Trie {
private:
    TrieNode* root;

public:
    Trie() {
        root = new TrieNode();
    }

    void insert(string word) {
        TrieNode* curr = root;
        for (char c : word) {
            int idx = c - 'a';
            if (!curr->children[idx]) {
                curr->children[idx] = new TrieNode();
            }
            curr = curr->children[idx];
        }
        curr->isEndOfWord = true;
    }

    bool search(string word) {
        TrieNode* curr = root;
        for (char c : word) {
            int idx = c - 'a';
            if (!curr->children[idx]) return false;
            curr = curr->children[idx];
        }
        return curr->isEndOfWord;
    }

    bool startsWith(string prefix) {
        TrieNode* curr = root;
        for (char c : prefix) {
            int idx = c - 'a';
            if (!curr->children[idx]) return false;
            curr = curr->children[idx];
        }
        return true;
    }
};

int main() {
    int q;
    if (!(cin >> q)) return 0;
    Trie* obj = new Trie();
    vector<string> res;
    while(q--) {
        string cmd, word;
        cin >> cmd >> word;
        if(cmd == "insert") {
            obj->insert(word);
            res.push_back("null");
        } else if(cmd == "search") {
            res.push_back(obj->search(word) ? "true" : "false");
        } else if(cmd == "startsWith") {
            res.push_back(obj->startsWith(word) ? "true" : "false");
        }
    }
    for(int i=0; i<res.size(); i++) {
        cout << res[i] << (i == res.size()-1 ? "" : " ");
    }
    cout << endl;
    return 0;
}`,
    java: `import java.util.*;

class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEndOfWord = false;
}

class Trie {
    private TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

    public void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) {
                curr.children[idx] = new TrieNode();
            }
            curr = curr.children[idx];
        }
        curr.isEndOfWord = true;
    }

    public boolean search(String word) {
        TrieNode node = find(word);
        return node != null && node.isEndOfWord;
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;
    }

    private TrieNode find(String str) {
        TrieNode curr = root;
        for (char c : str.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) return null;
            curr = curr.children[idx];
        }
        return curr;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(!sc.hasNextInt()) return;
        int q = sc.nextInt();
        Trie obj = new Trie();
        List<String> res = new ArrayList<>();
        while(q-- > 0) {
            String cmd = sc.next();
            String word = sc.next();
            if(cmd.equals("insert")) {
                obj.insert(word);
                res.add("null");
            } else if(cmd.equals("search")) {
                res.add(obj.search(word) ? "true" : "false");
            } else if(cmd.equals("startsWith")) {
                res.add(obj.startsWith(word) ? "true" : "false");
            }
        }
        for(int i=0; i<res.size(); i++) {
            System.out.print(res.get(i) + (i == res.size()-1 ? "" : " "));
        }
        System.out.println();
    }
}`
  },

  testCases: [
    { input: '6\ninsert apple\nsearch apple\nsearch app\nstartsWith app\ninsert app\nsearch app', expected: 'null true false true null true' },
    { input: '4\ninsert hello\nsearch hello\nsearch hell\nstartsWith hell', expected: 'null true false true' }
  ]
};