const fs = require("fs");
const path = require("path");

const problemsDir = path.join(__dirname, "problems");
const problemsCache = new Map();

/**
 * Recursively collect all .js files under a directory, sorted so that
 * stage folders come in numeric order and files within each stage come
 * in filename order (s01-p01-…, s01-p02-…, etc.).
 */
function collectJsFiles(dir) {
  let results = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    // Numeric sort for "Stage N" directories; lexicographic for files
    const numA = parseInt(a.name.replace(/\D/g, ''), 10);
    const numB = parseInt(b.name.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.name.localeCompare(b.name);
  });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Load all problem definitions from the problems directory (including subdirectories).
 */
function loadProblems() {
  problemsCache.clear();
  const files = collectJsFiles(problemsDir);
  for (const fullPath of files) {
    try {
      // Clear require cache so re-runs always pick up fresh content
      delete require.cache[require.resolve(fullPath)];
      const problem = require(fullPath);
      if (problem && problem.id) {
        problemsCache.set(problem.id, problem);
      } else {
        console.warn(`⚠  Skipping ${path.relative(problemsDir, fullPath)} — no 'id' field`);
      }
    } catch (err) {
      console.error(`✗  Failed to load ${path.relative(problemsDir, fullPath)}:`, err.message);
    }
  }
  console.log(`📚 Loaded ${problemsCache.size} problem(s)`);
}

/**
 * Get all problems (summary list)
 */
function getAllProblems() {
  return Array.from(problemsCache.values()).map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category,
    tags: p.tags,
  }));
}

/**
 * Get a single problem by ID (full details)
 */
function getProblem(id) {
  return problemsCache.get(id) || null;
}

// Load problems on startup
loadProblems();

module.exports = { getAllProblems, getProblem, loadProblems };
