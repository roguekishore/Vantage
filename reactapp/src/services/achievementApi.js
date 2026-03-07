import { authFetch, API_BASE } from "./api";

/**
 * Fetch the full achievement catalog with the user's progress.
 * JWT identifies the current user; userId param kept for call-site compat.
 */
export async function fetchAllAchievements(userId) {
  const res = await authFetch(`${API_BASE}/achievements`);
  if (!res.ok) throw new Error("Failed to fetch achievements");
  return res.json();
}

/**
 * Fetch only the user's earned badges.
 */
export async function fetchMyAchievements(userId) {
  const res = await authFetch(`${API_BASE}/me/achievements`);
  if (!res.ok) throw new Error("Failed to fetch my achievements");
  return res.json();
}

/**
 * Fetch another player's earned badges (public profile).
 */
export async function fetchUserAchievements(userId) {
  const res = await authFetch(`${API_BASE}/users/${userId}/achievements`);
  if (!res.ok) throw new Error("Failed to fetch user achievements");
  return res.json();
}
