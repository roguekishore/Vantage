# Vantage DSA - Storyline & Problem Quality Guide

> Reference document for AI sessions working on the gamified storytelling layer across all 164 problems in the judge problem files.

---

## Table of Contents

1. [Objective](#objective)
2. [Architecture Overview](#architecture-overview)
3. [File Schema](#file-schema)
4. [Storyline Design](#storyline-design)
5. [Stage-by-Stage Storyline Plan](#stage-by-stage-storyline-plan)
6. [Problem Quality Standards](#problem-quality-standards)
7. [Description Writing Guide](#description-writing-guide)
8. [Example Writing Guide](#example-writing-guide)
9. [Constraint Writing Guide](#constraint-writing-guide)
10. [Formatting Rules](#formatting-rules)
11. [Checklist Before Committing](#checklist-before-committing)
12. [Progress Tracker](#progress-tracker)

---

## Objective

Every problem in the Vantage DSA platform has two layers:

1. **Technical layer** - A clean, professional, LeetCode-quality problem statement (`description`, `examples`, `constraints`).
2. **Story layer** - A Harry Potter-themed narrative wrapper (`stageIntro`, `storyBriefing`) that makes the learning journey feel like a continuous adventure.

The story layer is purely cosmetic flavour text. It MUST NOT alter the technical problem or confuse the solver. Both layers are rendered in the frontend but kept completely separate in the data.

---

## Architecture Overview

### Where the files live

```
judge/src/problems/Stages/
  Stage 1/
    find-maximum-element.js    (conquestId: stage1-1)
    find-minute-element.js     (conquestId: stage1-2)
    array-sum.js               (conquestId: stage1-3)
    reverse-array.js           (conquestId: stage1-4)
    count-zeros-in-array.js    (conquestId: stage1-5)
    insert-element-at-index.js (conquestId: stage1-6)
    delete-element-at-index.js (conquestId: stage1-7)
  Stage 2/
    ...
  Stage 3/
    ...
```

### How they load

- `judge/src/problemStore.js` recursively reads every `.js` file under `Stages/`.
- `judge/src/routes/problems.js` exposes all fields to the API EXCEPT `testCases` (only the first 2 are returned as `sampleTestCases`).
- `reactapp/src/pages/judge/JudgePage.jsx` renders `stageIntro` (purple "Prologue" card) and `storyBriefing` (amber "Story" card) above the problem description. Both are conditional - they only render if the field exists.

### Conquest map reference

- `reactapp/src/data/dsa-conquest-map.js` contains the master list of all 164 problems, their `conquestId`, stage number, order within stage, country mapping, and difficulty.
- The `conquestId` format is `stageX-Y` where X is the stage number and Y is the problem order within that stage.
- ALWAYS follow the conquest map order when writing storylines. Problem order within a stage defines the narrative sequence.

---

## File Schema

Every problem file exports a single object with these fields:

```javascript
module.exports = {
  // ---- Identity ----
  id: 'find-max-element',           // Unique slug (used in API)
  conquestId: 'stage1-1',           // Links to dsa-conquest-map.js
  title: 'Find Maximum Element',    // Display title
  difficulty: 'Easy',               // Easy | Medium | Hard
  category: 'Arrays',               // Data structure category
  tags: ['Array', 'Basics'],        // Searchable tags

  // ---- Story Layer (optional per-problem, but required for completed stages) ----
  stageIntro: `...`,                // ONLY on the FIRST problem of each stage (order: 1)
  storyBriefing: `...`,             // On EVERY problem in the stage

  // ---- Technical Layer ----
  description: `...`,               // LeetCode-quality problem statement
  examples: [                       // 2-3 examples with input/output/explanation
    { input: '...', output: '...', explanation: '...' }
  ],
  constraints: ['...'],             // Array of constraint strings
  boilerplate: {                    // Starter code with solve() function
    cpp: `...`,
    java: `...`
  },
  testCases: [                      // 8-10 test cases covering edge cases
    { input: '...', expected: '...' }
  ]
};
```

### Key rules

- `stageIntro` goes ONLY on the first problem of each stage (the one with `order: 1` in the conquest map).
- `storyBriefing` goes on EVERY problem in the stage.
- Both story fields are plain text strings. NO markdown. NO special unicode characters.

---

## Storyline Design

### Theme

The storyline follows the Harry Potter universe across the student's years at Hogwarts. Each stage represents a chapter or arc in the journey. Problems within a stage form a continuous mini-narrative.

### Characters

Use ONLY canonical Harry Potter characters. Never invent new characters or names.

**Characters used so far (Stage 1):**
- Harry Potter (the solver's POV - addressed as "you")
- Albus Dumbledore
- Severus Snape
- Hermione Granger
- Ron Weasley
- Remus Lupin
- Rubeus Hagrid
- Madam Pince
- Minerva McGonagall

**Characters available for future stages:**
- Neville Longbottom
- Draco Malfoy
- Fred & George Weasley
- Luna Lovegood
- Dobby
- Sirius Black
- Mad-Eye Moody
- Dolores Umbridge
- Flitwick
- Sprout
- Trelawney
- Cedric Diggory
- Cho Chang
- Oliver Wood
- Hagrid's creatures (Buckbeak, Fang, Norbert, etc.)
- Peeves
- Nearly Headless Nick
- Filch & Mrs. Norris
- Tom Riddle / Voldemort (later stages only - the "final boss")

### Narrative rules

1. **Continuous timeline**: The story progresses linearly. Stage 1 = first week at Hogwarts, later stages = later in the school year or subsequent years.
2. **Each stage has a theme**: The stage's DSA topic should loosely connect to the narrative setting (e.g., sorting = organizing potion ingredients, binary search = finding things in the library).
3. **stageIntro sets the scene**: Written once per stage on the first problem. Establishes where we are, what's happening, who's involved.
4. **storyBriefing is per-problem**: Each problem gets a unique story moment. It should naturally lead into the problem's concept without being a tutorial.
5. **No spoilers**: The story should hint at the approach but never explain the algorithm.
6. **Tone**: Immersive, slightly dramatic, faithful to the HP world. Not too long - 2-4 sentences max for storyBriefing, 3-5 sentences for stageIntro.
7. **POV**: Second person ("you") - the solver IS the student at Hogwarts.

---

## Stage-by-Stage Storyline Plan

Below is the planned narrative arc for all 27 stages. Each stage has a suggested setting, characters, and story arc. The actual `stageIntro` and `storyBriefing` text should be written when implementing each stage.

### Year 1 - First Year at Hogwarts (Stages 1-7)

#### Stage 1: Absolute Programming Basics (7 problems) - COMPLETED
- **Setting**: First week at Hogwarts
- **Arc**: Arrival via Hogwarts Express -> Sorting Ceremony -> First classes
- **Characters**: Dumbledore, Snape, Hermione, Ron, Lupin, Hagrid, Madam Pince, McGonagall
- **Flow**:
  1. `stage1-1` Find Max - Prologue: Great Hall arrival. Story: Snape's Potions - find hottest cauldron
  2. `stage1-2` Find Min - Snape continues - find coldest cauldron
  3. `stage1-3` Array Sum - Hermione after Potions - sum all cauldron heat outputs
  4. `stage1-4` Reverse Array - Ron before Lupin's class - spell written backwards
  5. `stage1-5` Count Zeros - Hagrid's hut - count zero-feed days in records
  6. `stage1-6` Insert at Index - Madam Pince library - insert book at exact catalogue position
  7. `stage1-7` Delete at Index - McGonagall - remove Confundus name from register. Arc closes.

#### Stage 2: Array Index Manipulation (5 problems)
- **Setting**: Settling into routine, exploring the castle
- **Arc**: Quidditch tryouts approaching, navigating classes
- **Suggested characters**: Oliver Wood / Madam Hooch (Quidditch), Fred & George (pranks), Filch (trouble)
- **Flow**:
  1. `stage2-1` Linear Search Basic - Prologue: Second week begins. Story: Looking for a specific item
  2. `stage2-2` Linear Search - Searching more thoroughly
  3. `stage2-3` Move Zeros - Clearing out/reorganizing something
  4. `stage2-4` Rotate Array - Rotating patrol schedules or similar
  5. `stage2-5` Squares of Sorted Array - Quidditch stat calculations

#### Stage 3: Prefix & Subarray Thinking (6 problems)
- **Setting**: Deeper into studies, homework piling up
- **Arc**: Building up to first exams, Hermione's study sessions
- **Suggested characters**: Hermione (study lead), Neville (struggling), Snape (tough assignments)
- **Flow**:
  1. `stage3-1` Prefix Sum - Prologue: Exams approaching. Story: Hermione's revision system
  2. `stage3-2` Maximum Subarray - Best stretch of practice performance
  3. `stage3-3` Product Except Self - Potion recipe calculations
  4. `stage3-4` Subarray Ranges - Tracking grade fluctuations
  5. `stage3-5` Subarray Sum Equals K - Meeting a target score
  6. `stage3-6` Split Array Largest Sum - Dividing work among study groups

#### Stage 4: Two Pointers (5 problems)
- **Setting**: Making friends, working in pairs
- **Arc**: Duelling club / Defence practice, paired exercises
- **Suggested characters**: Lupin (defence instructor), Neville & Seamus (duel partners), Draco (rival)
- **Flow**:
  1. `stage4-1` Two Sum - Prologue: Paired practice begins. Story: Finding matching pairs
  2. `stage4-2` 3Sum - Group formations
  3. `stage4-3` 4Sum - Team duelling
  4. `stage4-4` Container With Most Water - Maximizing potion vessel capacity
  5. `stage4-5` Trapping Rain Water - First real challenge / mini-boss feel

#### Stage 5: Sliding Window (5 problems)
- **Setting**: Quidditch season, tracking performance streaks
- **Arc**: First Quidditch matches and training montage
- **Suggested characters**: Oliver Wood, Madam Hooch, Katie Bell, opposing team seekers
- **Flow**:
  1. `stage5-1` Max Consecutive Ones III - Prologue: Quidditch season opens. Story: Tracking catching streaks
  2. `stage5-2` Longest Substring - Longest rally in practice
  3. `stage5-3` Fruit Into Baskets - Collecting items under constraints
  4. `stage5-4` Minimum Window Substring - Finding the critical play window
  5. `stage5-5` Sliding Window Maximum - Peak performance analysis

#### Stage 6: String Fundamentals (5 problems)
- **Setting**: Charms class, spellwork with words
- **Arc**: Learning incantations, Flitwick's Charms lessons
- **Suggested characters**: Flitwick, Hermione (pronunciation expert), Seamus (mishaps)
- **Flow**:
  1. `stage6-1` Palindrome Check - Prologue: Charms class begins. Story: Checking mirror spells
  2. `stage6-2` Reverse String - Reversing an incantation
  3. `stage6-3` Count Vowels - Pronunciation rules
  4. `stage6-4` Valid Anagram - Anagram-based magic
  5. `stage6-5` First Unique Character - Finding the key syllable

#### Stage 7: Advanced Strings (6 problems)
- **Setting**: Library research, deciphering texts
- **Arc**: Restricted Section exploration, old manuscripts
- **Suggested characters**: Madam Pince, Hermione, possibly hints of mystery (Philosopher's Stone parallel)
- **Flow**:
  1. `stage7-1` Longest Common Prefix - Prologue: Library deep dive. Story: Categorizing old texts
  2. `stage7-2` String Compression - Encoding secret messages
  3. `stage7-3` Reverse Words - Deciphering reversed riddles
  4. `stage7-4` Is Subsequence - Checking hidden words in texts
  5. `stage7-5` Group Anagrams - Sorting scrambled spell names
  6. `stage7-6` Longest Palindromic Substring - Finding the key incantation

### Year 2 - Growing Skills (Stages 8-14)

#### Stage 8: Binary Search Core (5 problems)
- **Setting**: Exploring Hogwarts' hidden areas, finding things efficiently
- **Arc**: Chamber of Secrets parallel - searching for clues
- **Suggested characters**: Dobby (warnings), Myrtle (clues), Lockhart (useless help), Hermione (research)

#### Stage 9: Binary Search Advanced (9 problems)
- **Setting**: The mystery deepens, more complex searching
- **Arc**: Navigating twisted corridors and rotated passages
- **Suggested characters**: Nearly Headless Nick, Aragog (danger), Dumbledore (guidance)

#### Stage 10: Linked List Construction (7 problems)
- **Setting**: Building things, connecting pieces
- **Arc**: Herbology/Potions - building chains of ingredients
- **Suggested characters**: Sprout, Neville (Herbology strength), Hagrid (creature chains)

#### Stage 11: Linked List LC Problems (5 problems)
- **Setting**: Reversals, cycles, merging paths
- **Arc**: Navigating moving staircases, dealing with loops
- **Suggested characters**: Peeves (chaos/cycles), portraits (linked paths)

#### Stage 12: Stack Fundamentals (4 problems)
- **Setting**: Stacking and unstacking
- **Arc**: Fred & George's joke shop inventory
- **Suggested characters**: Fred, George, Lee Jordan

#### Stage 13: Stack Applications (4 problems)
- **Setting**: Applying stacking to real challenges
- **Arc**: Building defences, removing weak links
- **Suggested characters**: Lupin (DADA), possibly dementors arriving (dark tone)

#### Stage 14: Queue (4 problems)
- **Setting**: Lines, ordering, waiting
- **Arc**: Hogsmeade visit - queuing for things, fair ordering
- **Suggested characters**: Honeydukes shopkeeper, Three Broomsticks, Madam Rosmerta

### Year 3 - Rising Challenges (Stages 15-19)

#### Stage 15: Sorting (8 problems)
- **Setting**: Organizing chaos
- **Arc**: Triwizard Tournament preparation (parallel to GoF), sorting participants/supplies
- **Suggested characters**: Dumbledore, other school heads, Cedric, Mad-Eye Moody

#### Stage 16: Heaps & Priority Queues (4 problems)
- **Setting**: Prioritization under pressure
- **Arc**: Tournament tasks - what's most urgent?
- **Suggested characters**: Tournament judges, Cedric, dragons (priorities)

#### Stage 17: Trees Construction (5 problems)
- **Setting**: Family trees, organizational hierarchies
- **Arc**: Discovering the Marauder's Map, mapping Hogwarts
- **Suggested characters**: Lupin (Marauders history), Sirius Black (family tree)

#### Stage 18: Trees Traversals & Properties (5 problems)
- **Setting**: Walking through tree structures
- **Arc**: Forbidden Forest exploration, navigating paths
- **Suggested characters**: Hagrid, centaurs (Firenze), forest creatures

#### Stage 19: Trees Views & Transformations (4 problems)
- **Setting**: Seeing from different perspectives
- **Arc**: Views from the Astronomy Tower, transforming understanding
- **Suggested characters**: Trelawney (divination/seeing), McGonagall (Transfiguration)

### Year 4 - Mastery Arc (Stages 20-24)

#### Stage 20: Graphs & Grids (9 problems)
- **Setting**: Mapping the wizarding world, connections between everything
- **Arc**: Order of the Phoenix - connecting allies, navigating the network
- **Suggested characters**: Sirius, Tonks, the Order members, Ministry encounters

#### Stage 21: Recursion & Backtracking (13 problems)
- **Setting**: Going deeper, exploring every possibility
- **Arc**: Department of Mysteries - rooms within rooms, trying every door
- **Suggested characters**: Luna, Neville (DA heroes), Death Eaters (obstacles)

#### Stage 22: Dynamic Programming (9 problems)
- **Setting**: Optimizing decisions, learning from the past
- **Arc**: Half-Blood Prince's textbook - building on previous knowledge
- **Suggested characters**: Snape (Half-Blood Prince), Slughorn (memories), Dumbledore (wisdom)

#### Stage 23: Greedy Algorithms (8 problems)
- **Setting**: Making the best choice at each step
- **Arc**: The Horcrux hunt begins - each decision matters
- **Suggested characters**: Harry, Ron, Hermione (the trio on the run), Dobby

#### Stage 24: Design & Systems (4 problems)
- **Setting**: Building something greater than the sum of its parts
- **Arc**: The Battle of Hogwarts - designing defences, final preparations
- **Suggested characters**: McGonagall, Neville, the DA, all houses united

### Bonus Stages - Specializations

#### Bonus A: Bit Manipulation (5 problems)
- **Setting**: The smallest magical details
- **Arc**: Studying ancient runes, binary enchantments
- **Suggested characters**: Ancient Runes professor, Hermione

#### Bonus B: Mathematical & Miscellaneous (5 problems)
- **Setting**: Arithmancy class
- **Arc**: Mathematical magic, number theory
- **Suggested characters**: Vector (Arithmancy), Hermione

#### Bonus C: Hashing Patterns (2 problems)
- **Setting**: Quick lookups, remembering everything
- **Arc**: Pensieve memories - instant recall
- **Suggested characters**: Dumbledore, Snape (memories)

---

## Problem Quality Standards

Every problem description should meet the quality bar of a professional competitive programming platform (LeetCode, Codeforces, HackerRank). Here are the rules:

### General principles

1. **Clarity over brevity**: A solver should understand exactly what is expected after one read-through.
2. **No ambiguity**: Every edge case should be addressed in either the description or constraints.
3. **Self-contained**: The description should not require external context to understand.
4. **Consistent voice**: Use "You are given..." to open, imperative sentences for instructions ("Return...", "Print...").

---

## Description Writing Guide

### Structure (3 paragraphs)

**Paragraph 1 - The task statement:**
- Open with "You are given..." describing the input.
- State what to compute or return in one clear sentence.

**Paragraph 2 - The approach hint:**
- Describe the expected approach at a high level without giving away the algorithm.
- Mention key concepts (traversal, two pointers, etc.) as hints.
- Call out any non-obvious requirements (in-place, 64-bit integers, etc.).

**Paragraph 3 - The output instruction:**
- Start with "Return" or "Print" followed by the exact output format.
- If the output is an array, specify "space-separated integers on a single line".
- If the output is a single value, specify "a single integer".

### Example description (good):

```
You are given an array of n integers. Return the largest element in the array.

Traverse the array from left to right, maintaining the greatest value seen so far.
Initialize your running maximum with the first element, then update it whenever you
encounter a larger value.

Do not use built-in sort or max functions. Return a single integer - the maximum
element in the array.
```

### Avoid

- "Implement a function that..." (too implementation-focused)
- "Given an array..." (should be "You are given an array...")
- One-line descriptions with no detail
- Mentioning specific language features
- Markdown formatting (no `**`, `##`, backticks, etc.)

---

## Example Writing Guide

### Count

- Provide **3 examples** per problem (2 minimum for very simple problems).
- Example 1: Standard/happy path case
- Example 2: Edge case or tricky scenario (negatives, zeros, boundary)
- Example 3: Minimal input (single element, empty result, etc.)

### Input/Output format

- Must match the exact stdin/stdout format the judge expects
- Use `\n` for line breaks in the input string
- No trailing spaces or newlines

### Explanation format

- Walk through the solution step by step
- Show intermediate state where possible (running totals, pointer positions)
- Use concrete numbers from the example, not abstract descriptions
- End with "Return X." or "The result is X."

### Example explanation (good):

```
Scanning left to right: max = 3, then 1 < 3 (no change), then 4 > 3 (max = 4),
then 1 < 4 (no change), then 5 > 4 (max = 5). Return 5.
```

### Example explanation (bad):

```
The largest number in the set {1, 5, 3, 9, 2} is 9.
```

(This just restates the answer without showing how to arrive at it.)

---

## Constraint Writing Guide

- Use Unicode superscripts for powers: `10^5` -> write as `10 followed by superscript 5`
- Use the `<=` symbol: write as the actual <= character
- Always include:
  - Array size constraint (n)
  - Element value constraint (array[i])
  - "The array contains at least one element." if n >= 1
  - Any overflow considerations ("fits within a 64-bit signed integer")

### Standard constraint templates:

```
Easy problems:     1 <= n <= 10^5, values in [-10^9, 10^9]
Medium problems:   1 <= n <= 10^5 or 10^4 depending on expected O(n log n) vs O(n^2)
Hard problems:     Varies, state clearly
```

---

## Formatting Rules

These rules apply to ALL text fields in the problem files (`stageIntro`, `storyBriefing`, `description`, `explanation`):

1. **NO em dashes** - Use a regular hyphen `-` instead of `--` or the long dash character.
2. **NO unicode arrows** - Use `->` instead of the arrow character. Use `<->` instead of the double arrow character.
3. **NO special unicode** - No `+-` symbol, no fancy quotes. Use `+/-` and regular ASCII quotes.
4. **NO markdown** - No `**bold**`, no `## headings`, no backtick code blocks, no `$math$`.
5. **Plain text only** - Everything should render correctly as a plain string in the frontend.
6. **Use template literals** - Wrap in backticks for multi-line strings in JS files.
7. **Constraint symbols are OK** - The `<=` and superscript characters in constraints are fine since they render as plain text.

---

## Checklist Before Committing

When completing a stage, verify all of the following:

- [ ] `stageIntro` exists ONLY on the first problem (order: 1) of the stage
- [ ] `storyBriefing` exists on every problem in the stage
- [ ] Story follows the correct `conquestId` order (stage1-1, stage1-2, etc.)
- [ ] Story uses only canonical Harry Potter characters
- [ ] Story continues naturally from the previous stage's ending
- [ ] All descriptions follow the 3-paragraph structure
- [ ] All examples have step-by-step explanations
- [ ] At least 2-3 examples per problem
- [ ] Constraints are complete and accurate
- [ ] No em dashes, unicode arrows, markdown, or special characters
- [ ] The comment header at the top of the file uses `-` not a long dash
- [ ] Test cases cover: normal input, all-same values, single element, all-negative, large values, zeros

---

## Progress Tracker

| Stage | Problems | Story | Description | Examples | Status |
|-------|----------|-------|-------------|----------|--------|
| 1 | 7 | Done | Done | Done | COMPLETE |
| 2 | 5 | Not started | Not started | Not started | TODO |
| 3 | 6 | Not started | Not started | Not started | TODO |
| 4 | 5 | Not started | Not started | Not started | TODO |
| 5 | 5 | Not started | Not started | Not started | TODO |
| 6 | 5 | Not started | Not started | Not started | TODO |
| 7 | 6 | Not started | Not started | Not started | TODO |
| 8 | 5 | Not started | Not started | Not started | TODO |
| 9 | 9 | Not started | Not started | Not started | TODO |
| 10 | 7 | Not started | Not started | Not started | TODO |
| 11 | 5 | Not started | Not started | Not started | TODO |
| 12 | 4 | Not started | Not started | Not started | TODO |
| 13 | 4 | Not started | Not started | Not started | TODO |
| 14 | 4 | Not started | Not started | Not started | TODO |
| 15 | 8 | Not started | Not started | Not started | TODO |
| 16 | 4 | Not started | Not started | Not started | TODO |
| 17 | 5 | Not started | Not started | Not started | TODO |
| 18 | 5 | Not started | Not started | Not started | TODO |
| 19 | 4 | Not started | Not started | Not started | TODO |
| 20 | 9 | Not started | Not started | Not started | TODO |
| 21 | 13 | Not started | Not started | Not started | TODO |
| 22 | 9 | Not started | Not started | Not started | TODO |
| 23 | 8 | Not started | Not started | Not started | TODO |
| 24 | 4 | Not started | Not started | Not started | TODO |
| A | 5 | Not started | Not started | Not started | TODO |
| B | 5 | Not started | Not started | Not started | TODO |
| C | 2 | Not started | Not started | Not started | TODO |

**Total: 164 problems | 1 stage complete | 26 stages remaining**
