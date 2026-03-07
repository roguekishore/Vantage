import { authFetch, API_BASE } from "./api";

/**
 * Fetch current player's gamification stats.
 * JWT identifies the current user; userId param kept for call-site compat.
 */
export async function fetchPlayerStats(userId) {
  const res = await authFetch(`${API_BASE}/me/stats`);
  if (!res.ok) throw new Error("Failed to fetch player stats");
  return res.json();
}

/**
 * Fetch public gamification stats for any user.
 */
export async function fetchPublicPlayerStats(userId) {
  const res = await authFetch(`${API_BASE}/users/${userId}/stats`);
  if (!res.ok) throw new Error("Failed to fetch player stats");
  return res.json();
}

/**
 * Fetch paginated coin transaction history.
 * Returns a Spring Page object: { content: [...], totalPages, totalElements, ... }
 */
export async function fetchCoinHistory(userId, page = 0, size = 20) {
  const res = await authFetch(`${API_BASE}/me/coin-history?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Failed to fetch coin history");
  return res.json();
}

/**
 * Fetch current player's streak info.
 * Returns: { currentStreak, longestStreak, multiplier, solvedToday, nextMilestone, nextMilestoneCoins, nextMilestoneXp, lastActivityDate }
 */
export async function fetchStreak(userId) {
  const res = await authFetch(`${API_BASE}/me/streak`);
  if (!res.ok) throw new Error("Failed to fetch streak data");
  return res.json();
}
