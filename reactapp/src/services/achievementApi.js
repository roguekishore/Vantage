const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:8080") + "/api";

/**
 * Fetch the full achievement catalog with the user's progress.
 * Hidden badges show "???" until earned.
 */
export async function fetchAllAchievements(userId) {
  const res = await fetch(`${API_BASE}/achievements?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch achievements");
  return res.json();
}

/**
 * Fetch only the user's earned badges.
 */
export async function fetchMyAchievements(userId) {
  const res = await fetch(`${API_BASE}/me/achievements?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch my achievements");
  return res.json();
}

/**
 * Fetch another player's earned badges (public profile).
 */
export async function fetchUserAchievements(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}/achievements`);
  if (!res.ok) throw new Error("Failed to fetch user achievements");
  return res.json();
}
