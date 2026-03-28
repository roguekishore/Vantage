/**
 * Group Anagrams - Problem Definition
 *
 * Input format (stdin):
 * Line 1: An integer n, the number of strings.
 * Next n lines: Each line contains one string.
 *
 * Output format (stdout):
 * Groups of anagrams. Each group should be on a new line.
 * Words within a group should be sorted alphabetically.
 * Groups should be sorted by their first word alphabetically.
 */

module.exports = {
  // ---- Identity ----
  id: 'group-anagrams',
  conquestId: 'stage7-5',
  title: 'Group Anagrams',
  difficulty: 'Medium',
  category: 'Advanced Strings',
  tags: ['String', 'Hash Table', 'Sorting'],

  // ---- Story Layer ----
  storyBriefing: `Your work organizing the manuscripts has revealed a new puzzle. Many of the spell names appear to be scrambled. Hermione realizes they are anagrams of each other and likely variations of the same core spell. She gives you a list of all the scrambled spell names and asks you to group them together into their correct anagram families.`,

  // ---- Technical Layer ----
  description: `You are given an array of n strings. Your task is to group the anagrams together. An anagram is a word formed by rearranging the letters of another, using all original letters exactly once.

The most common solution to this problem involves using a hash map. For each string in the input array, you need to generate a unique key that is the same for all its anagrams. A simple way to create this key is to sort the characters of the string. This sorted string then serves as the key in the hash map, where the value is a list of all original strings that produce this key.

The output should present each group of anagrams on a new line. Within each group, the words should be sorted alphabetically. The groups themselves should also be sorted based on their first word alphabetically.`,
  examples: [
    {
      input: '6\neat\ntea\ntan\nate\nnat\nbat',
      output: 'ate eat tea\nbat\nnat tan',
      explanation: '"eat", "tea", and "ate" are anagrams. "tan" and "nat" are anagrams. "bat" has no anagrams in the list.'
    },
    {
      input: '1\na',
      output: 'a',
      explanation: 'A single string is in a group by itself.'
    },
    {
      input: '2\nab\nba',
      output: 'ab ba',
      explanation: '"ab" and "ba" are anagrams and are grouped together.'
    }
  ],
  constraints: [
    '1 <= n <= 10^4',
    '0 <= strs[i].length <= 100',
    'strs[i] consists of lowercase English letters.'
  ],

  // ---- Boilerplate ----
  boilerplate: {
    cpp: `// Do not change this function's name and signature.
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
#include <map>

using namespace std;

vector<vector<string>> solve(int n, vector<string>& strs) {
    // Your code here
    
    return {};
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<string> strs(n);
    for (int i = 0; i < n; i++) cin >> strs[i];
    
    vector<vector<string>> result = solve(n, strs);
    for (auto& group : result) {
        for (int i = 0; i < group.size(); i++) {
            cout << group[i] << (i == group.size() - 1 ? "" : " ");
        }
        cout << "\\n";
    }
    return 0;
}`,
    java: `// Do not change this function's name and signature.
import java.util.*;

public class Main {
    public static List<List<String>> solve(int n, String[] strs) {
        // Your code here
        
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        String[] strs = new String[n];
        for (int i = 0; i < n; i++) strs[i] = sc.next();
        
        List<List<String>> result = solve(n, strs);
        for (List<String> group : result) {
            System.out.println(String.join(" ", group));
        }
    }
}`
  },

  // ---- Test Cases ----
  testCases: [
    { input: '6\neat\ntea\ntan\nate\nnat\nbat', expected: 'ate eat tea\nbat\nnat tan' },
    { input: '1\na', expected: 'a' },
    { input: '1\n', expected: '' },
    { input: '2\na\na', expected: 'a a' },
    { input: '4\nstop\ntops\npots\nspot', expected: 'pots spot stop tops' },
    { input: '3\nabc\nbca\nacb', expected: 'abc acb bca' },
    { input: '3\na\nb\nc', expected: 'a\nb\nc' },
    { input: '2\nab\nac', expected: 'ab\nac' },
    { input: '5\ncat\ndog\nact\ngod\ntac', expected: 'act cat tac\ndog god' },
    { input: '5\nill\nlli\nopo\npoo\nlil', expected: 'ill lil lli\nopo poo' }
  ],

  // ---- Solution ----
  solution: {
    approach: `The problem is solved using a hash map to group anagrams. Iterate through each string in the input array. For each string, sort its characters to create a canonical key. Use this sorted string as a key in the hash map. The value associated with each key will be a list of the original strings that, when sorted, produce that key. After populating the map, extract the lists of anagrams from the map's values. For the final output, sort the strings within each group alphabetically and then sort the groups themselves based on their first element.`,
    cpp: `unordered_map<string, vector<string>> anagram_groups;
for (const string& s : strs) {
    string key = s;
    sort(key.begin(), key.end());
    anagram_groups[key].push_back(s);
}

vector<vector<string>> result;
for (auto const& [key, val] : anagram_groups) {
    vector<string> group = val;
    sort(group.begin(), group.end());
    result.push_back(group);
}

sort(result.begin(), result.end(), [](const vector<string>& a, const vector<string>& b) {
    return a[0] < b[0];
});

return result;`,
    java: `if (strs == null || n == 0) return new ArrayList<>();
Map<String, List<String>> map = new HashMap<>();
for (String s : strs) {
    char[] charArray = s.toCharArray();
    Arrays.sort(charArray);
    String key = String.valueOf(charArray);
    if (!map.containsKey(key)) {
        map.put(key, new ArrayList<>());
    }
    map.get(key).add(s);
}

List<List<String>> result = new ArrayList<>(map.values());
for (List<String> group : result) {
    Collections.sort(group);
}
result.sort(Comparator.comparing(list -> list.get(0)));
return result;`
  }
};