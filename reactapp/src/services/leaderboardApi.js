const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:8080") + "/api";

/**
 * Fetch global XP leaderboard (all-time).
 * Returns a Spring Page: { content: GamificationLeaderboardEntryDTO[], totalPages, totalElements, ... }
 */
export async function fetchGlobalXPLeaderboard(page = 0, size = 20) {
  const res = await fetch(`${API_BASE}/gamification/leaderboard/global-xp?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Failed to fetch global XP leaderboard");
  return res.json();
}

/**
 * Fetch weekly XP leaderboard (this week only).
 */
export async function fetchWeeklyXPLeaderboard(page = 0, size = 20) {
  const res = await fetch(`${API_BASE}/gamification/leaderboard/weekly-xp?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Failed to fetch weekly XP leaderboard");
  return res.json();
}

/**
 * Fetch weekly coins leaderboard (this week only).
 */
export async function fetchWeeklyCoinsLeaderboard(page = 0, size = 20) {
  const res = await fetch(`${API_BASE}/gamification/leaderboard/weekly-coins?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Failed to fetch weekly coins leaderboard");
  return res.json();
}

/**
 * Fetch streak leaderboard (active streaks).
 */
export async function fetchStreakLeaderboard(page = 0, size = 20) {
  const res = await fetch(`${API_BASE}/gamification/leaderboard/streaks?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Failed to fetch streak leaderboard");
  return res.json();
}

/**
 * Fetch battle rating (ELO) leaderboard.
 */
export async function fetchBattleRatingLeaderboard(page = 0, size = 20) {
  const res = await fetch(`${API_BASE}/gamification/leaderboard/battle-rating?page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Failed to fetch battle rating leaderboard");
  return res.json();
}

/**
 * Fetch the current user's rank in a specific leaderboard.
 * @param {number} userId
 * @param {string} type - "global-xp" | "weekly-xp" | "weekly-coins" | "streaks"
 */
export async function fetchMyRank(userId, type = "global-xp") {
  const res = await fetch(`${API_BASE}/gamification/leaderboard/me?userId=${userId}&type=${type}`);
  if (!res.ok) throw new Error("Failed to fetch rank");
  return res.json();
}

/**
 * Fetch all institutions (for the institution leaderboard dropdown).
 * Returns: Array<{ id: number, name: string }>
 */
export async function fetchInstitutions() {
  const res = await fetch(`${API_BASE}/institutions`);
  if (!res.ok) throw new Error("Failed to fetch institutions");
  return res.json();
}

/**
 * Fetch XP leaderboard scoped to a specific institution.
 * @param {number} institutionId
 */
export async function fetchInstitutionLeaderboard(institutionId, page = 0, size = 20) {
  const res = await fetch(
    `${API_BASE}/gamification/leaderboard/institution/${institutionId}?page=${page}&size=${size}`
  );
  if (!res.ok) throw new Error("Failed to fetch institution leaderboard");
  return res.json();
}
