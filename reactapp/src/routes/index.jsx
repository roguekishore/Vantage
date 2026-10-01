import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { topicConfig } from "./config";
import VisualizerPage from "../pages/visualizer/VisualizerPage";
import { lazyVisualizer } from "../pages/visualizer/legacyViz";

const TopicPage = lazy(() => import("../pages/topics/TopicPage"));
const TopicsPage = lazy(() => import("../pages/topics/TopicsPage"));
const AlgoCards = lazy(() => import("../components/problems/AlgoCards"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="home-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', color: 'var(--home-muted)' }}>
      <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Loading...</div>
    </div>
  </div>
);

// Helper to create visualizer routes with layout wrapper
const VisualizerRoute = ({ component: Component, title, topic }) => {
  const config = topicConfig[topic];
  return (
    <VisualizerPage
      title={title}
      icon={config.icon}
    >
      <Component />
    </VisualizerPage>
  );
};

// Lazy load all visualizer components
// SORTING
const BubbleSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/BubbleSort"));
const MergeSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/MergeSort"));
const QuickSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/QuickSort"));
const InsertionSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/InsertionSort"));
const RadixSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/RadixSort"));
const CountingSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/CountingSort"));
const HeapSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/HeapSort"));
const SelectionSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/SelectionSort"));
const CombSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/CombSort"));
const BucketSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/BucketSort"));
const ShellSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/ShellSort"));
const PancakeSort = lazyVisualizer(() => import("../pages/algorithms/Sorting/PancakeSort"));

// ARRAYS
const TrappingRainWater = lazyVisualizer(() => import("../pages/algorithms/Arrays/TrappingRainWater"));
const ContainerWithMostWater = lazyVisualizer(() => import("../pages/algorithms/Arrays/ContainerWithMostWater"));
const MaxConsecutiveOnesIIIArrays = lazyVisualizer(() => import("../pages/algorithms/Arrays/MaxConsecutiveOnesIII"));
const SubarrayRangesArrays = lazyVisualizer(() => import("../pages/algorithms/Arrays/SubarrayRanges"));
const FindMaxElement = lazyVisualizer(() => import("../pages/algorithms/Arrays/FindMaxElement"));
const FindMinElement = lazyVisualizer(() => import("../pages/algorithms/Arrays/FindMinElement"));
const MoveZeros = lazyVisualizer(() => import("../pages/algorithms/Arrays/MoveZeros"));
const CountZeros = lazyVisualizer(() => import("../pages/algorithms/Arrays/CountZeros"));
const ArraySum = lazyVisualizer(() => import("../pages/algorithms/Arrays/ArraySum"));
const ReverseArray = lazyVisualizer(() => import("../pages/algorithms/Arrays/ReverseArray"));
const TwoSum = lazyVisualizer(() => import("../pages/algorithms/Arrays/TwoSum"));
const ThreeSum = lazyVisualizer(() => import("../pages/algorithms/Arrays/3Sum"));
const FourSum = lazyVisualizer(() => import("../pages/algorithms/Arrays/4-sum"));
const SplitArrayLargestSum = lazyVisualizer(() => import("../pages/algorithms/Arrays/SplitArrayLargestSum"));
const SquaresOfSortedArray = lazyVisualizer(() => import("../pages/algorithms/Arrays/SquaresOfSortedArray.tsx"));
const ProductOfArrayExceptSelf = lazyVisualizer(() => import("../pages/algorithms/Arrays/ProductOfArrayExceptSelf"));
const MaximumSubarray = lazyVisualizer(() => import("../pages/algorithms/Arrays/MaximumSubarray"));
const MergeIntervals = lazyVisualizer(() => import("../pages/algorithms/Arrays/MergeIntervals"));
const RotateArray = lazyVisualizer(() => import("../pages/algorithms/Arrays/RotateArray"));
const MaximumGap = lazyVisualizer(() => import("../pages/algorithms/Arrays/MaximumGap"));

// BINARY SEARCH
const BinarySearchBasic = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/BinarySearchBasic"));
const FindFirstAndLastPosition = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/FindFirstAndLastPosition"));
const FindMinimumInRotatedSortedArray = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/FindMinimumInRotatedSortedArray"));
const FindPeakElement = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/FindPeakElement"));
const MedianOfTwoSortedArrays = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/MedianOfTwoSortedArrays"));
const MinSpeedToArriveOnTime = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/MinSpeedToArriveOnTime"));
const PeakIndexInMountainArray = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/PeakIndexInMountainArray"));
const Search2DMatrix = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/Search2DMatrix"));
const SearchInRotatedSortedArray = lazyVisualizer(() => import("../pages/algorithms/BinarySearch/SearchInRotatedSortedArray"));

// GRAPHS
const BFSGraphs = lazyVisualizer(() => import("../pages/algorithms/Graphs/BFS"));
const DFSGraphs = lazyVisualizer(() => import("../pages/algorithms/Graphs/DFS"));
const Dijkstra = lazyVisualizer(() => import("../pages/algorithms/Graphs/Dijkstra"));
const TopologicalSort = lazyVisualizer(() => import("../pages/algorithms/Graphs/TopologicalSort"));
const Kruskal = lazyVisualizer(() => import("../pages/algorithms/Graphs/Kruskal"));
const NetworkFlow = lazyVisualizer(() => import("../pages/algorithms/Graphs/NetworkFlow"));

// TREES
const AVLTree = lazyVisualizer(() => import("../pages/algorithms/Trees/AVLTree"));
const BinaryTreeRightSideView = lazyVisualizer(() => import("../pages/algorithms/Trees/BinaryTreeRightSideView"));
const ConstructBinaryTree = lazyVisualizer(() => import("../pages/algorithms/Trees/ConstructBinaryTree"));
const FlattenBinaryTree = lazyVisualizer(() => import("../pages/algorithms/Trees/FlattenBinaryTree"));
const LCAofDeepestLeaves = lazyVisualizer(() => import("../pages/algorithms/Trees/LCAofDeepestLeaves"));
const MorrisTraversal = lazyVisualizer(() => import("../pages/algorithms/Trees/MorrisTraversal"));
const PrintBinaryTree = lazyVisualizer(() => import("../pages/algorithms/Trees/PrintBinaryTree"));
const SymmetricTreeVisualizer = lazyVisualizer(() => import("../pages/algorithms/Trees/SymmetricTreeVisualizer"));
const ValidateBST = lazyVisualizer(() => import("../pages/algorithms/Trees/ValidateBST"));

// STACK
const LargestRectangleHistogram = lazyVisualizer(() => import("../pages/algorithms/Stack/LargestRectangleHistogram"));
const NextGreaterElement = lazyVisualizer(() => import("../pages/algorithms/Stack/NextGreaterElement"));
const PermutationStack = lazyVisualizer(() => import("../pages/algorithms/Stack/Permutation"));
const RemoveKDigits = lazyVisualizer(() => import("../pages/algorithms/Stack/RemoveKDigits"));
const StackOperation = lazyVisualizer(() => import("../pages/algorithms/Stack/StackOperstion"));
const SubarrayRangesStack = lazyVisualizer(() => import("../pages/algorithms/Stack/SubarrayRanges"));

// LINKED LIST
const LinkedListCycle = lazyVisualizer(() => import("../pages/algorithms/LinkedList/LinkedListCycle"));
const MergeTwoSortedLists = lazyVisualizer(() => import("../pages/algorithms/LinkedList/MergeTwoSortedLists"));
const ReverseLinkedList = lazyVisualizer(() => import("../pages/algorithms/LinkedList/ReverseLinkedList"));
const SortList = lazyVisualizer(() => import("../pages/algorithms/LinkedList/SortList"));
const SwapPairs = lazyVisualizer(() => import("../pages/algorithms/LinkedList/SwapPairs"));

// DYNAMIC PROGRAMMING
const BurstBalloons = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/BurstBalloons"));
const BurstBalloonsTopDown = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/BurstBallonsTopDown"));
const CoinChange = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/CoinChange"));
const EditDistance = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/EditDistance"));
const KnapSack = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/KnapSack"));
const LISubsequence = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/LISubsequence"));
const LongestCommonSubsequence = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/LongestCommonSubsequence"));
const SellStockIV = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/SellStockIVVisualizer"));
const UniquePaths = lazyVisualizer(() => import("../pages/algorithms/DynamicProgramming/UniquePaths"));

// SLIDING WINDOWS
const FruitsIntoBaskets = lazyVisualizer(() => import("../pages/algorithms/SlidingWindows/FruitsIntoBaskets"));
const LongestSubstring = lazyVisualizer(() => import("../pages/algorithms/SlidingWindows/LongestSubstring"));
const MaxConsecutiveOnesIII = lazyVisualizer(() => import("../pages/algorithms/SlidingWindows/MaxConsecutiveOnesIII"));
const MinimumWindow = lazyVisualizer(() => import("../pages/algorithms/SlidingWindows/MinimumWindow"));
const SlidingWindowMaximum = lazyVisualizer(() => import("../pages/algorithms/SlidingWindows/SlidingWindowMaximum"));

// BACKTRACKING
const ExpressionAddOperators = lazyVisualizer(() => import("../pages/algorithms/Backtracking/ExpressionAddOperators"));
const KnightsTour = lazyVisualizer(() => import("../pages/algorithms/Backtracking/KnightsTour"));
const Permutations = lazyVisualizer(() => import("../pages/algorithms/Backtracking/Permutations"));
const SudokuSolver = lazyVisualizer(() => import("../pages/algorithms/Backtracking/SudokuSolver"));
const WordSearch = lazyVisualizer(() => import("../pages/algorithms/Backtracking/WordSearch"));

// STRINGS
const CountVowels = lazyVisualizer(() => import("../pages/algorithms/Strings/CountVowels"));
const IsSubSequence = lazyVisualizer(() => import("../pages/algorithms/Strings/IsSubSequence"));
const LongestCP = lazyVisualizer(() => import("../pages/algorithms/Strings/LongestCP"));
const PalindromeCheck = lazyVisualizer(() => import("../pages/algorithms/Strings/PalindromeCheck"));
const ReverseString = lazyVisualizer(() => import("../pages/algorithms/Strings/ReverseString"));
const ReverseWords = lazyVisualizer(() => import("../pages/algorithms/Strings/ReverseWords"));
const StringCompression = lazyVisualizer(() => import("../pages/algorithms/Strings/StringCompression"));
const ValidAnagramStrings = lazyVisualizer(() => import("../pages/algorithms/Strings/ValidAnagram"));

// QUEUE
const BasicQueue = lazyVisualizer(() => import("../pages/algorithms/Queue/BasicQueue"));
const CircularQueue = lazyVisualizer(() => import("../pages/algorithms/Queue/CircularQueue"));
const QueueUsingStacks = lazyVisualizer(() => import("../pages/algorithms/Queue/QueueUsingStacks"));

// HEAPS
const Heapify = lazyVisualizer(() => import("../pages/algorithms/Heaps/Heapify"));
const TaskScheduler = lazyVisualizer(() => import("../pages/algorithms/Heaps/TaskScheduler"));
const TopKFrequent = lazyVisualizer(() => import("../pages/algorithms/Heaps/TopKFrequentVisualizer"));

// HASHING
const EqualRowsColumnPair = lazyVisualizer(() => import("../pages/algorithms/Hashing/EqualRowsColumnPair"));
const LongestConsecutiveSequence = lazyVisualizer(() => import("../pages/algorithms/Hashing/LongestConsecutiveSequence"));
const SubarraySumEqualsK = lazyVisualizer(() => import("../pages/algorithms/Hashing/SubarraySumEqualsK"));
const ValidAnagramHashing = lazyVisualizer(() => import("../pages/algorithms/Hashing/ValidAnagram"));

// RECURSION
const BinarySearchRecursive = lazyVisualizer(() => import("../pages/algorithms/Recursion/BinarySearchRecursive"));
const Factorial = lazyVisualizer(() => import("../pages/algorithms/Recursion/Factorial"));
const Fibonacci = lazyVisualizer(() => import("../pages/algorithms/Recursion/Fibonacci"));
const NQueens = lazyVisualizer(() => import("../pages/algorithms/Recursion/NQueens"));
const SubsetSum = lazyVisualizer(() => import("../pages/algorithms/Recursion/SubsetSum"));
const TowerOfHanoi = lazyVisualizer(() => import("../pages/algorithms/Recursion/TowerOfHanoi"));

// BIT MANIPULATION
const CountingBits = lazyVisualizer(() => import("../pages/algorithms/BitManipulation/CountingBits"));
const NumberOf1Bits = lazyVisualizer(() => import("../pages/algorithms/BitManipulation/NumberOf1Bits"));
const PowerOfTwo = lazyVisualizer(() => import("../pages/algorithms/BitManipulation/PowerOfTwo"));
const ReverseBits = lazyVisualizer(() => import("../pages/algorithms/BitManipulation/ReverseBits"));
const SingleNumber = lazyVisualizer(() => import("../pages/algorithms/BitManipulation/SingleNumber"));

// GREEDY
const AssignCookies = lazyVisualizer(() => import("../pages/algorithms/GreedyAlgorithms/AssignCookies"));
const BestTimeStockII = lazyVisualizer(() => import("../pages/algorithms/GreedyAlgorithms/BestTimeStockII"));
const BestTimeStock = lazyVisualizer(() => import("../pages/algorithms/Arrays/BestTimeToBuyAndSellStock"));
const JobScheduling = lazyVisualizer(() => import("../pages/algorithms/GreedyAlgorithms/JobScheduling"));
const TwoCityScheduling = lazyVisualizer(() => import("../pages/algorithms/GreedyAlgorithms/TwoCityScheduling"));

// MATHS
const CountPrimes = lazyVisualizer(() => import("../pages/algorithms/MathematicalMiscellaneous/CountPrimes"));
const ExcelSheetColumnTitle = lazyVisualizer(() => import("../pages/algorithms/MathematicalMiscellaneous/ExcelSheetColumnTitle"));
const FactorialZeroes = lazyVisualizer(() => import("../pages/algorithms/MathematicalMiscellaneous/FactorialZeroes"));
const Power = lazyVisualizer(() => import("../pages/algorithms/MathematicalMiscellaneous/Power"));
const PrimePalindrome = lazyVisualizer(() => import("../pages/algorithms/MathematicalMiscellaneous/PrimePalindrome"));

// SEARCHING
const ExponentialSearch = lazyVisualizer(() => import("../pages/algorithms/Searching/ExponentialSearch"));
const KthMissingNumber = lazyVisualizer(() => import("../pages/algorithms/Searching/KthMissingNumber"));
const LinearSearch = lazyVisualizer(() => import("../pages/algorithms/Searching/LinearSearch"));
const SmallestLetter = lazyVisualizer(() => import("../pages/algorithms/Searching/SmallestLetter"));
const SpecialArray = lazyVisualizer(() => import("../pages/algorithms/Searching/specialArray"));
const UnknownSizeSearch = lazyVisualizer(() => import("../pages/algorithms/Searching/UnknownSizeSearch"));

// DESIGN
const DesignHashMap = lazyVisualizer(() => import("../pages/algorithms/Design/DesignHashMap"));
const DesignLinkedList = lazyVisualizer(() => import("../pages/algorithms/Design/DesignLinkedList"));
const ImplementTrie = lazyVisualizer(() => import("../pages/algorithms/Design/ImplementTrie"));
const LFUCache = lazyVisualizer(() => import("../pages/algorithms/Design/LFUCache"));
const LRUCache = lazyVisualizer(() => import("../pages/algorithms/Design/LRUCache"));
const MinStack = lazyVisualizer(() => import("../pages/algorithms/Design/MinStack"));

// PATHFINDING
const AStarPathfinding = lazyVisualizer(() => import("../pages/algorithms/Pathfinding/AStar"));
const BFSPathfinding = lazyVisualizer(() => import("../pages/algorithms/Pathfinding/BFS"));
const ColorIslands = lazyVisualizer(() => import("../pages/algorithms/Pathfinding/ColorIslands").then((m) => ({ default: m.ColorIslands })));
const FloodFill = lazyVisualizer(() => import("../pages/algorithms/Pathfinding/FloodFill").then((m) => ({ default: m.FloodFill })));
const RatInMaze = lazyVisualizer(() => import("../pages/algorithms/Pathfinding/RatInMaze"));

/**
 * AppRoutes - All application routes
 */
const AppRoutes = () => {
  const { sorting, arrays, binarysearch, strings, searching, hashing, linkedlist,
    recursion, bitmanipulation, stack, queue, slidingwindows, heaps, trees,
    graphs, pathfinding, greedy, backtracking, dp, design, maths } = topicConfig;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* VISUALIZERS PAGE */}
        <Route path="/visualizers" element={<TopicsPage />} />
        <Route path="/explore" element={<AlgoCards />} />

        {/* SORTING */}
        <Route path={sorting.path} element={
          <TopicPage {...sorting} basePath={sorting.path} topicKey={sorting.key} />
        } />
        <Route path={`${sorting.path}/BubbleSort`} element={<VisualizerRoute component={BubbleSort} title="Bubble Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/MergeSort`} element={<VisualizerRoute component={MergeSort} title="Merge Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/QuickSort`} element={<VisualizerRoute component={QuickSort} title="Quick Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/InsertionSort`} element={<VisualizerRoute component={InsertionSort} title="Insertion Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/RadixSort`} element={<VisualizerRoute component={RadixSort} title="Radix Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/CountingSort`} element={<VisualizerRoute component={CountingSort} title="Counting Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/HeapSort`} element={<VisualizerRoute component={HeapSort} title="Heap Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/SelectionSort`} element={<VisualizerRoute component={SelectionSort} title="Selection Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/CombSort`} element={<VisualizerRoute component={CombSort} title="Comb Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/BucketSort`} element={<VisualizerRoute component={BucketSort} title="Bucket Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/ShellSort`} element={<VisualizerRoute component={ShellSort} title="Shell Sort" topic="sorting" />} />
        <Route path={`${sorting.path}/PancakeSort`} element={<VisualizerRoute component={PancakeSort} title="Pancake Sort" topic="sorting" />} />

        {/* ARRAYS */}
        <Route path={arrays.path} element={
          <TopicPage {...arrays} basePath={arrays.path} topicKey={arrays.key} />
        } />
        <Route path={`${arrays.path}/TrappingRainWater`} element={<VisualizerRoute component={TrappingRainWater} title="Trapping Rain Water" topic="arrays" />} />
        <Route path={`${arrays.path}/ContainerWithMostWater`} element={<VisualizerRoute component={ContainerWithMostWater} title="Container With Most Water" topic="arrays" />} />
        <Route path={`${arrays.path}/MaxConsecutiveOnesIII`} element={<VisualizerRoute component={MaxConsecutiveOnesIIIArrays} title="Max Consecutive Ones III" topic="arrays" />} />
        <Route path={`${arrays.path}/SubarrayRanges`} element={<VisualizerRoute component={SubarrayRangesArrays} title="Subarray Ranges" topic="arrays" />} />
        <Route path={`${arrays.path}/FindMaxElement`} element={<VisualizerRoute component={FindMaxElement} title="Find Max Element" topic="arrays" />} />
        <Route path={`${arrays.path}/FindMinElement`} element={<VisualizerRoute component={FindMinElement} title="Find Min Element" topic="arrays" />} />
        <Route path={`${arrays.path}/MoveZeros`} element={<VisualizerRoute component={MoveZeros} title="Move Zeros" topic="arrays" />} />
        <Route path={`${arrays.path}/CountZeros`} element={<VisualizerRoute component={CountZeros} title="Count Zeros" topic="arrays" />} />
        <Route path={`${arrays.path}/ArraySum`} element={<VisualizerRoute component={ArraySum} title="Array Sum" topic="arrays" />} />
        <Route path={`${arrays.path}/ReverseArray`} element={<VisualizerRoute component={ReverseArray} title="Reverse Array" topic="arrays" />} />
        <Route path={`${arrays.path}/TwoSum`} element={<VisualizerRoute component={TwoSum} title="Two Sum" topic="arrays" />} />
        <Route path={`${arrays.path}/ThreeSum`} element={<VisualizerRoute component={ThreeSum} title="3Sum" topic="arrays" />} />
        <Route path={`${arrays.path}/4-Sum`} element={<VisualizerRoute component={FourSum} title="4Sum" topic="arrays" />} />
        <Route path={`${arrays.path}/SplitArrayLargestSum`} element={<VisualizerRoute component={SplitArrayLargestSum} title="Split Array Largest Sum" topic="arrays" />} />
        <Route path={`${arrays.path}/SquaresOfSortedArray`} element={<VisualizerRoute component={SquaresOfSortedArray} title="Squares of Sorted Array" topic="arrays" />} />
        <Route path={`${arrays.path}/ProductOfArrayExceptSelf`} element={<VisualizerRoute component={ProductOfArrayExceptSelf} title="Product of Array Except Self" topic="arrays" />} />
        <Route path={`${arrays.path}/MaximumSubarray`} element={<VisualizerRoute component={MaximumSubarray} title="Maximum Subarray" topic="arrays" />} />
        <Route path={`${arrays.path}/MergeIntervals`} element={<VisualizerRoute component={MergeIntervals} title="Merge Intervals" topic="arrays" />} />
        <Route path={`${arrays.path}/RotateArray`} element={<VisualizerRoute component={RotateArray} title="Rotate Array" topic="arrays" />} />
        <Route path={`${arrays.path}/MaximumGap`} element={<VisualizerRoute component={MaximumGap} title="Maximum Gap" topic="arrays" />} />

        {/* BINARY SEARCH */}
        <Route path={binarysearch.path} element={
          <TopicPage {...binarysearch} basePath={binarysearch.path} topicKey={binarysearch.key} />
        } />
        <Route path={`${binarysearch.path}/BinarySearchBasic`} element={<VisualizerRoute component={BinarySearchBasic} title="Binary Search" topic="binarysearch" />} />
        <Route path={`${binarysearch.path}/FindFirstAndLastPosition`} element={<VisualizerRoute component={FindFirstAndLastPosition} title="Find First and Last Position" topic="binarysearch" />} />
        <Route path={`${binarysearch.path}/FindMinimumInRotatedSortedArray`} element={<VisualizerRoute component={FindMinimumInRotatedSortedArray} title="Find Minimum in Rotated Sorted Array" topic="binarysearch" />} />
        <Route path={`${binarysearch.path}/FindPeakElement`} element={<VisualizerRoute component={FindPeakElement} title="Find Peak Element" topic="binarysearch" />} />
        <Route path={`${binarysearch.path}/MedianOfTwoSortedArrays`} element={<VisualizerRoute component={MedianOfTwoSortedArrays} title="Median of Two Sorted Arrays" topic="binarysearch" />} />
        <Route path={`${binarysearch.path}/MinSpeedToArriveOnTime`} element={<VisualizerRoute component={MinSpeedToArriveOnTime} title="Min Speed to Arrive on Time" topic="binarysearch" />} />
        <Route path={`${binarysearch.path}/PeakIndexInMountainArray`} element={<VisualizerRoute component={PeakIndexInMountainArray} title="Peak Index in Mountain Array" topic="binarysearch" />} />
        <Route path={`${binarysearch.path}/Search2DMatrix`} element={<VisualizerRoute component={Search2DMatrix} title="Search 2D Matrix" topic="binarysearch" />} />
        <Route path={`${binarysearch.path}/SearchInRotatedSortedArray`} element={<VisualizerRoute component={SearchInRotatedSortedArray} title="Search in Rotated Sorted Array" topic="binarysearch" />} />

        {/* GRAPHS */}
        <Route path={graphs.path} element={
          <TopicPage {...graphs} basePath={graphs.path} topicKey={graphs.key} />
        } />
        <Route path={`${graphs.path}/BFS`} element={<VisualizerRoute component={BFSGraphs} title="Breadth-First Search" topic="graphs" />} />
        <Route path={`${graphs.path}/DFS`} element={<VisualizerRoute component={DFSGraphs} title="Depth-First Search" topic="graphs" />} />
        <Route path={`${graphs.path}/Dijkstra`} element={<VisualizerRoute component={Dijkstra} title="Dijkstra's Algorithm" topic="graphs" />} />
        <Route path={`${graphs.path}/TopologicalSort`} element={<VisualizerRoute component={TopologicalSort} title="Topological Sort" topic="graphs" />} />
        <Route path={`${graphs.path}/Kruskal`} element={<VisualizerRoute component={Kruskal} title="Kruskal's Algorithm" topic="graphs" />} />
        <Route path={`${graphs.path}/NetworkFlow`} element={<VisualizerRoute component={NetworkFlow} title="Network Flow" topic="graphs" />} />

        {/* TREES */}
        <Route path={trees.path} element={
          <TopicPage {...trees} basePath={trees.path} topicKey={trees.key} />
        } />
        <Route path={`${trees.path}/AVLTree`} element={<VisualizerRoute component={AVLTree} title="AVL Tree" topic="trees" />} />
        <Route path={`${trees.path}/BinaryTreeRightSideView`} element={<VisualizerRoute component={BinaryTreeRightSideView} title="Binary Tree Right Side View" topic="trees" />} />
        <Route path={`${trees.path}/ConstructBinaryTree`} element={<VisualizerRoute component={ConstructBinaryTree} title="Construct Binary Tree" topic="trees" />} />
        <Route path={`${trees.path}/FlattenBinaryTree`} element={<VisualizerRoute component={FlattenBinaryTree} title="Flatten Binary Tree" topic="trees" />} />
        <Route path={`${trees.path}/LCAofDeepestLeaves`} element={<VisualizerRoute component={LCAofDeepestLeaves} title="LCA of Deepest Leaves" topic="trees" />} />
        <Route path={`${trees.path}/MorrisTraversal`} element={<VisualizerRoute component={MorrisTraversal} title="Morris Traversal" topic="trees" />} />
        <Route path={`${trees.path}/PrintBinaryTree`} element={<VisualizerRoute component={PrintBinaryTree} title="Print Binary Tree" topic="trees" />} />
        <Route path={`${trees.path}/SymmetricTree`} element={<VisualizerRoute component={SymmetricTreeVisualizer} title="Symmetric Tree" topic="trees" />} />
        <Route path={`${trees.path}/ValidateBST`} element={<VisualizerRoute component={ValidateBST} title="Validate BST" topic="trees" />} />

        {/* STACK */}
        <Route path={stack.path} element={
          <TopicPage {...stack} basePath={stack.path} topicKey={stack.key} />
        } />
        <Route path={`${stack.path}/LargestRectangleHistogram`} element={<VisualizerRoute component={LargestRectangleHistogram} title="Largest Rectangle in Histogram" topic="stack" />} />
        <Route path={`${stack.path}/NextGreaterElement`} element={<VisualizerRoute component={NextGreaterElement} title="Next Greater Element" topic="stack" />} />
        <Route path={`${stack.path}/Permutation`} element={<VisualizerRoute component={PermutationStack} title="Permutation" topic="stack" />} />
        <Route path={`${stack.path}/RemoveKDigits`} element={<VisualizerRoute component={RemoveKDigits} title="Remove K Digits" topic="stack" />} />
        <Route path={`${stack.path}/StackOperation`} element={<VisualizerRoute component={StackOperation} title="Stack Operations" topic="stack" />} />
        <Route path={`${stack.path}/SubarrayRanges`} element={<VisualizerRoute component={SubarrayRangesStack} title="Subarray Ranges" topic="stack" />} />

        {/* LINKED LIST */}
        <Route path={linkedlist.path} element={
          <TopicPage {...linkedlist} basePath={linkedlist.path} topicKey={linkedlist.key} />
        } />
        <Route path={`${linkedlist.path}/LinkedListCycle`} element={<VisualizerRoute component={LinkedListCycle} title="Linked List Cycle" topic="linkedlist" />} />
        <Route path={`${linkedlist.path}/MergeTwoSortedLists`} element={<VisualizerRoute component={MergeTwoSortedLists} title="Merge Two Sorted Lists" topic="linkedlist" />} />
        <Route path={`${linkedlist.path}/ReverseLinkedList`} element={<VisualizerRoute component={ReverseLinkedList} title="Reverse Linked List" topic="linkedlist" />} />
        <Route path={`${linkedlist.path}/SortList`} element={<VisualizerRoute component={SortList} title="Sort List" topic="linkedlist" />} />
        <Route path={`${linkedlist.path}/SwapPairs`} element={<VisualizerRoute component={SwapPairs} title="Swap Pairs" topic="linkedlist" />} />

        {/* DYNAMIC PROGRAMMING */}
        <Route path={dp.path} element={
          <TopicPage {...dp} basePath={dp.path} topicKey={dp.key} />
        } />
        <Route path={`${dp.path}/BurstBalloons`} element={<VisualizerRoute component={BurstBalloons} title="Burst Balloons" topic="dp" />} />
        <Route path={`${dp.path}/BurstBalloonsTopDown`} element={<VisualizerRoute component={BurstBalloonsTopDown} title="Burst Balloons (Top Down)" topic="dp" />} />
        <Route path={`${dp.path}/CoinChange`} element={<VisualizerRoute component={CoinChange} title="Coin Change" topic="dp" />} />
        <Route path={`${dp.path}/EditDistance`} element={<VisualizerRoute component={EditDistance} title="Edit Distance" topic="dp" />} />
        <Route path={`${dp.path}/KnapSack`} element={<VisualizerRoute component={KnapSack} title="Knapsack" topic="dp" />} />
        <Route path={`${dp.path}/LISubsequence`} element={<VisualizerRoute component={LISubsequence} title="Longest Increasing Subsequence" topic="dp" />} />
        <Route path={`${dp.path}/LongestCommonSubsequence`} element={<VisualizerRoute component={LongestCommonSubsequence} title="Longest Common Subsequence" topic="dp" />} />
        <Route path={`${dp.path}/SellStockIV`} element={<VisualizerRoute component={SellStockIV} title="Best Time to Buy and Sell Stock IV" topic="dp" />} />
        <Route path={`${dp.path}/UniquePaths`} element={<VisualizerRoute component={UniquePaths} title="Unique Paths" topic="dp" />} />

        {/* SLIDING WINDOWS */}
        <Route path={slidingwindows.path} element={
          <TopicPage {...slidingwindows} basePath={slidingwindows.path} topicKey={slidingwindows.key} />
        } />
        <Route path={`${slidingwindows.path}/FruitsIntoBaskets`} element={<VisualizerRoute component={FruitsIntoBaskets} title="Fruits Into Baskets" topic="slidingwindows" />} />
        <Route path={`${slidingwindows.path}/LongestSubstring`} element={<VisualizerRoute component={LongestSubstring} title="Longest Substring" topic="slidingwindows" />} />
        <Route path={`${slidingwindows.path}/MaxConsecutiveOnesIII`} element={<VisualizerRoute component={MaxConsecutiveOnesIII} title="Max Consecutive Ones III" topic="slidingwindows" />} />
        <Route path={`${slidingwindows.path}/MinimumWindow`} element={<VisualizerRoute component={MinimumWindow} title="Minimum Window" topic="slidingwindows" />} />
        <Route path={`${slidingwindows.path}/SlidingWindowMaximum`} element={<VisualizerRoute component={SlidingWindowMaximum} title="Sliding Window Maximum" topic="slidingwindows" />} />

        {/* BACKTRACKING */}
        <Route path={backtracking.path} element={
          <TopicPage {...backtracking} basePath={backtracking.path} topicKey={backtracking.key} />
        } />
        <Route path={`${backtracking.path}/ExpressionAddOperators`} element={<VisualizerRoute component={ExpressionAddOperators} title="Expression Add Operators" topic="backtracking" />} />
        <Route path={`${backtracking.path}/KnightsTour`} element={<VisualizerRoute component={KnightsTour} title="Knight's Tour" topic="backtracking" />} />
        <Route path={`${backtracking.path}/Permutations`} element={<VisualizerRoute component={Permutations} title="Permutations" topic="backtracking" />} />
        <Route path={`${backtracking.path}/SudokuSolver`} element={<VisualizerRoute component={SudokuSolver} title="Sudoku Solver" topic="backtracking" />} />
        <Route path={`${backtracking.path}/WordSearch`} element={<VisualizerRoute component={WordSearch} title="Word Search" topic="backtracking" />} />

        {/* STRINGS */}
        <Route path={strings.path} element={
          <TopicPage {...strings} basePath={strings.path} topicKey={strings.key} />
        } />
        <Route path={`${strings.path}/CountVowels`} element={<VisualizerRoute component={CountVowels} title="Count Vowels" topic="strings" />} />
        <Route path={`${strings.path}/IsSubSequence`} element={<VisualizerRoute component={IsSubSequence} title="Is Subsequence" topic="strings" />} />
        <Route path={`${strings.path}/LongestCP`} element={<VisualizerRoute component={LongestCP} title="Longest Common Prefix" topic="strings" />} />
        <Route path={`${strings.path}/PalindromeCheck`} element={<VisualizerRoute component={PalindromeCheck} title="Palindrome Check" topic="strings" />} />
        <Route path={`${strings.path}/ReverseString`} element={<VisualizerRoute component={ReverseString} title="Reverse String" topic="strings" />} />
        <Route path={`${strings.path}/ReverseWords`} element={<VisualizerRoute component={ReverseWords} title="Reverse Words" topic="strings" />} />
        <Route path={`${strings.path}/StringCompression`} element={<VisualizerRoute component={StringCompression} title="String Compression" topic="strings" />} />
        <Route path={`${strings.path}/ValidAnagram`} element={<VisualizerRoute component={ValidAnagramStrings} title="Valid Anagram" topic="strings" />} />

        {/* QUEUE */}
        <Route path={queue.path} element={
          <TopicPage {...queue} basePath={queue.path} topicKey={queue.key} />
        } />
        <Route path={`${queue.path}/BasicQueue`} element={<VisualizerRoute component={BasicQueue} title="Basic Queue" topic="queue" />} />
        <Route path={`${queue.path}/CircularQueue`} element={<VisualizerRoute component={CircularQueue} title="Circular Queue" topic="queue" />} />
        <Route path={`${queue.path}/QueueUsingStacks`} element={<VisualizerRoute component={QueueUsingStacks} title="Queue Using Stacks" topic="queue" />} />

        {/* HEAPS */}
        <Route path={heaps.path} element={
          <TopicPage {...heaps} basePath={heaps.path} topicKey={heaps.key} />
        } />
        <Route path={`${heaps.path}/Heapify`} element={<VisualizerRoute component={Heapify} title="Heapify" topic="heaps" />} />
        <Route path={`${heaps.path}/TaskScheduler`} element={<VisualizerRoute component={TaskScheduler} title="Task Scheduler" topic="heaps" />} />
        <Route path={`${heaps.path}/TopKFrequent`} element={<VisualizerRoute component={TopKFrequent} title="Top K Frequent Elements" topic="heaps" />} />

        {/* HASHING */}
        <Route path={hashing.path} element={
          <TopicPage {...hashing} basePath={hashing.path} topicKey={hashing.key} />
        } />
        <Route path={`${hashing.path}/EqualRowsColumnPair`} element={<VisualizerRoute component={EqualRowsColumnPair} title="Equal Rows Column Pair" topic="hashing" />} />
        <Route path={`${hashing.path}/LongestConsecutiveSequence`} element={<VisualizerRoute component={LongestConsecutiveSequence} title="Longest Consecutive Sequence" topic="hashing" />} />
        <Route path={`${hashing.path}/SubarraySumEqualsK`} element={<VisualizerRoute component={SubarraySumEqualsK} title="Subarray Sum Equals K" topic="hashing" />} />
        <Route path={`${hashing.path}/ValidAnagram`} element={<VisualizerRoute component={ValidAnagramHashing} title="Valid Anagram" topic="hashing" />} />

        {/* RECURSION */}
        <Route path={recursion.path} element={
          <TopicPage {...recursion} basePath={recursion.path} topicKey={recursion.key} />
        } />
        <Route path={`${recursion.path}/BinarySearchRecursive`} element={<VisualizerRoute component={BinarySearchRecursive} title="Binary Search (Recursive)" topic="recursion" />} />
        <Route path={`${recursion.path}/Factorial`} element={<VisualizerRoute component={Factorial} title="Factorial" topic="recursion" />} />
        <Route path={`${recursion.path}/Fibonacci`} element={<VisualizerRoute component={Fibonacci} title="Fibonacci" topic="recursion" />} />
        <Route path={`${recursion.path}/NQueens`} element={<VisualizerRoute component={NQueens} title="N-Queens" topic="recursion" />} />
        <Route path={`${recursion.path}/SubsetSum`} element={<VisualizerRoute component={SubsetSum} title="Subset Sum" topic="recursion" />} />
        <Route path={`${recursion.path}/TowerOfHanoi`} element={<VisualizerRoute component={TowerOfHanoi} title="Tower of Hanoi" topic="recursion" />} />

        {/* BIT MANIPULATION */}
        <Route path={bitmanipulation.path} element={
          <TopicPage {...bitmanipulation} basePath={bitmanipulation.path} topicKey={bitmanipulation.key} />
        } />
        <Route path={`${bitmanipulation.path}/CountingBits`} element={<VisualizerRoute component={CountingBits} title="Counting Bits" topic="bitmanipulation" />} />
        <Route path={`${bitmanipulation.path}/NumberOf1Bits`} element={<VisualizerRoute component={NumberOf1Bits} title="Number of 1 Bits" topic="bitmanipulation" />} />
        <Route path={`${bitmanipulation.path}/PowerOfTwo`} element={<VisualizerRoute component={PowerOfTwo} title="Power of Two" topic="bitmanipulation" />} />
        <Route path={`${bitmanipulation.path}/ReverseBits`} element={<VisualizerRoute component={ReverseBits} title="Reverse Bits" topic="bitmanipulation" />} />
        <Route path={`${bitmanipulation.path}/SingleNumber`} element={<VisualizerRoute component={SingleNumber} title="Single Number" topic="bitmanipulation" />} />

        {/* GREEDY */}
        <Route path={greedy.path} element={
          <TopicPage {...greedy} basePath={greedy.path} topicKey={greedy.key} />
        } />
        <Route path={`${greedy.path}/AssignCookies`} element={<VisualizerRoute component={AssignCookies} title="Assign Cookies" topic="greedy" />} />
        <Route path={`${greedy.path}/BestTimeStockII`} element={<VisualizerRoute component={BestTimeStockII} title="Best Time to Buy and Sell Stock II" topic="greedy" />} />
        <Route path={`${greedy.path}/BestTimeStock`} element={<VisualizerRoute component={BestTimeStock} title="Best Time to Buy and Sell Stock" topic="greedy" />} />
        <Route path={`${greedy.path}/JobScheduling`} element={<VisualizerRoute component={JobScheduling} title="Job Scheduling" topic="greedy" />} />
        <Route path={`${greedy.path}/TwoCityScheduling`} element={<VisualizerRoute component={TwoCityScheduling} title="Two City Scheduling" topic="greedy" />} />

        {/* MATHS */}
        <Route path={maths.path} element={
          <TopicPage {...maths} basePath={maths.path} topicKey={maths.key} />
        } />
        <Route path={`${maths.path}/CountPrimes`} element={<VisualizerRoute component={CountPrimes} title="Count Primes" topic="maths" />} />
        <Route path={`${maths.path}/ExcelSheetColumnTitle`} element={<VisualizerRoute component={ExcelSheetColumnTitle} title="Excel Sheet Column Title" topic="maths" />} />
        <Route path={`${maths.path}/FactorialZeroes`} element={<VisualizerRoute component={FactorialZeroes} title="Factorial Zeroes" topic="maths" />} />
        <Route path={`${maths.path}/Power`} element={<VisualizerRoute component={Power} title="Power" topic="maths" />} />
        <Route path={`${maths.path}/PrimePalindrome`} element={<VisualizerRoute component={PrimePalindrome} title="Prime Palindrome" topic="maths" />} />

        {/* SEARCHING */}
        <Route path={searching.path} element={
          <TopicPage {...searching} basePath={searching.path} topicKey={searching.key} />
        } />
        <Route path={`${searching.path}/ExponentialSearch`} element={<VisualizerRoute component={ExponentialSearch} title="Exponential Search" topic="searching" />} />
        <Route path={`${searching.path}/KthMissingNumber`} element={<VisualizerRoute component={KthMissingNumber} title="Kth Missing Number" topic="searching" />} />
        <Route path={`${searching.path}/LinearSearch`} element={<VisualizerRoute component={LinearSearch} title="Linear Search" topic="searching" />} />
        <Route path={`${searching.path}/SmallestLetter`} element={<VisualizerRoute component={SmallestLetter} title="Smallest Letter" topic="searching" />} />
        <Route path={`${searching.path}/SpecialArray`} element={<VisualizerRoute component={SpecialArray} title="Special Array" topic="searching" />} />
        <Route path={`${searching.path}/UnknownSizeSearch`} element={<VisualizerRoute component={UnknownSizeSearch} title="Unknown Size Search" topic="searching" />} />

        {/* DESIGN */}
        <Route path={design.path} element={
          <TopicPage {...design} basePath={design.path} topicKey={design.key} />
        } />
        <Route path={`${design.path}/DesignHashMap`} element={<VisualizerRoute component={DesignHashMap} title="Design HashMap" topic="design" />} />
        <Route path={`${design.path}/DesignLinkedList`} element={<VisualizerRoute component={DesignLinkedList} title="Design Linked List" topic="design" />} />
        <Route path={`${design.path}/ImplementTrie`} element={<VisualizerRoute component={ImplementTrie} title="Implement Trie" topic="design" />} />
        <Route path={`${design.path}/LFUCache`} element={<VisualizerRoute component={LFUCache} title="LFU Cache" topic="design" />} />
        <Route path={`${design.path}/LRUCache`} element={<VisualizerRoute component={LRUCache} title="LRU Cache" topic="design" />} />
        <Route path={`${design.path}/MinStack`} element={<VisualizerRoute component={MinStack} title="Min Stack" topic="design" />} />

        {/* PATHFINDING */}
        <Route path={pathfinding.path} element={
          <TopicPage {...pathfinding} basePath={pathfinding.path} topicKey={pathfinding.key} />
        } />
        <Route path={`${pathfinding.path}/AStar`} element={<VisualizerRoute component={AStarPathfinding} title="A* Algorithm" topic="pathfinding" />} />
        <Route path={`${pathfinding.path}/BFS`} element={<VisualizerRoute component={BFSPathfinding} title="Breadth-First Search" topic="pathfinding" />} />
        <Route path={`${pathfinding.path}/ColorIslands`} element={<VisualizerRoute component={ColorIslands} title="Color Islands" topic="pathfinding" />} />
        <Route path={`${pathfinding.path}/FloodFill`} element={<VisualizerRoute component={FloodFill} title="Flood Fill" topic="pathfinding" />} />
        <Route path={`${pathfinding.path}/RatInMaze`} element={<VisualizerRoute component={RatInMaze} title="Rat in Maze" topic="pathfinding" />} />

        {/* 404 catch-all - must be last */}
        <Route path="*" element={
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--home-muted, #888)' }}>
            <h1 style={{ fontSize: '3rem', margin: 0 }}>404</h1>
            <p>Page not found</p>
          </div>
        } />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
