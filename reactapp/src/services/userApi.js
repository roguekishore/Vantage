import { authFetch, API_BASE } from "./api";
import useUserStore from "@/stores/useUserStore";

/**
 * Get the current logged-in user from localStorage.
 * Returns null if not logged in.
 */
export function getStoredUser() {
  return useUserStore.getState().user ?? null;
}

/**
 * Fetch user stats (solved, attempted, notStarted, total).
 */
export async function fetchUserStats(userId) {
  const res = await authFetch(`${API_BASE}/progress/stats`);
  if (!res.ok) throw new Error("Failed to fetch user stats");
  return res.json();
}

/**
 * Fetch user profile by ID.
 */
export async function fetchUserProfile(userId) {
  const res = await authFetch(`${API_BASE}/users/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}
