/**
 * Problem API Service
 * Connects the React frontend to the Spring Boot backend for problem listing,
 * filtering, pagination, sorting, detail retrieval, and user progress.
 */

import { authFetch, API_BASE, getCurrentUserId } from "./api";

/**
 * Fetch paginated problems with optional filters.
 * Automatically sends userId if user is logged in so the backend
 * populates userStatus (NOT_STARTED / ATTEMPTED / SOLVED) on each problem.
 *
 * @param {Object} params
 * @param {number}  params.page    - Page number (0-indexed)
 * @param {number}  params.size    - Page size
 * @param {string}  params.sort    - Sort field and direction e.g. "title,asc"
 * @param {string} [params.stage]  - Filter by stage name
 * @param {string} [params.tag]    - Filter by difficulty (EASY, MEDIUM, HARD)
 * @param {string} [params.status] - Filter by user status (NOT_STARTED, ATTEMPTED, SOLVED)
 * @param {string} [params.keyword]- Search by title keyword
 * @returns {Promise<Object>} Spring Boot Page response
 */
export async function fetchProblems({ page = 0, size = 20, sort = "pid,asc", stage, tag, status, keyword } = {}) {
  // If keyword is provided, use the search endpoint
  if (keyword && keyword.trim()) {
    const params = new URLSearchParams({ keyword: keyword.trim(), page, size, sort });
    const res = await authFetch(`${API_BASE}/problems/search?${params}`);
    if (!res.ok) throw new Error("Failed to search problems");
    return res.json();
  }

  const params = new URLSearchParams({ page, size, sort });
  if (stage) params.append("stage", stage);
  if (tag) params.append("tag", tag);
  if (status) params.append("status", status);

  const res = await authFetch(`${API_BASE}/problems?${params}`);
  if (!res.ok) throw new Error("Failed to fetch problems");
  return res.json();
}

/**
 * Fetch a single problem by ID.
 * @param {number} id - Problem ID
 * @returns {Promise<Object>} ProblemResponseDTO
 */
export async function fetchProblemById(id) {
  const res = await authFetch(`${API_BASE}/problems/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch problem: ${id}`);
  return res.json();
}

/**
 * Fetch all stage names.
 * @returns {Promise<string[]>} Sorted list of stage names
 */
export async function fetchStages() {
  const res = await authFetch(`${API_BASE}/stages`);
  if (!res.ok) throw new Error("Failed to fetch stages");
  return res.json();
}

/**
 * Fetch all progress entries for the current user.
 * Returns Map<problemId, { status, attemptCount, firstAttemptedAt, solvedAt }>
 * or empty object if not logged in.
 */
export async function fetchAllProgress() {
  const userId = getCurrentUserId();
  if (!userId) return {};
  const res = await authFetch(`${API_BASE}/progress`);
  if (!res.ok) throw new Error("Failed to fetch user progress");
  return res.json();
}

/**
 * Fetch aggregate problem stats for the current user.
 * Returns { solved, attempted, notStarted, total } or null if not logged in.
 */
export async function fetchProgressStats() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const res = await authFetch(`${API_BASE}/progress/stats`);
  if (!res.ok) throw new Error("Failed to fetch progress stats");
  return res.json();
}
