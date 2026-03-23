import { create } from "zustand";
import { fetchAllAchievements, fetchMyAchievements } from "@/services/achievementApi";

/**
 * Global achievement / badge store.
 *
 * Holds the full achievement catalog (with per-user progress) and the list of
 * badges the current user has already earned. Consumed by:
 *   - ZentryNavbar  → earned count badge on the Badges link
 *   - AchievementsPage → full catalog grid (avoids a redundant fetch)
 *
 * Refresh flow:
 *   loadAchievements(uid)   - full load on login / app init
 *   refresh(uid)            - lightweight re-fetch after a problem solve /
 *                             sync, so new badges appear without page refresh
 *   clearAchievements()     - on logout
 */
const useAchievementStore = create((set, get) => ({
  /* ── state ── */

  /** Full catalog: each item has progress + earned flag. */
  achievements: [],

  /** Just the earned badge objects (subset of achievements). */
  earned: [],

  /** Convenient count for the navbar badge pill. */
  earnedCount: 0,

  /** True while fetching. */
  loading: false,

  /** Last fetch error message, or null. */
  error: null,

  /** uid of the user whose data is currently loaded (prevents stale loads). */
  _loadedFor: null,

  /* ── actions ── */

  /**
   * Full load: fetches catalog with progress + earned list in parallel.
   * Call once on login / app init.
   */
  loadAchievements: async (userId) => {
    if (!userId) return;
    const current = get()._loadedFor;
    if (current === userId && get().achievements.length > 0) return; // already loaded

    set({ loading: true, error: null });
    try {
      const [catalog, earned] = await Promise.all([
        fetchAllAchievements(userId),
        fetchMyAchievements(userId).catch(() => []),
      ]);
      set({
        achievements: catalog,
        earned,
        earnedCount: earned.length,
        loading: false,
        _loadedFor: userId,
      });
    } catch (err) {
      console.warn("[AchievementStore] Failed to load achievements:", err);
      set({ error: err.message, loading: false });
    }
  },

  /**
   * Lightweight refresh after a problem solve / sync event.
   * Re-fetches both catalog and earned list to pick up any newly unlocked badges.
   */
  refresh: async (userId) => {
    if (!userId) return;
    try {
      const [catalog, earned] = await Promise.all([
        fetchAllAchievements(userId),
        fetchMyAchievements(userId).catch(() => []),
      ]);
      set({
        achievements: catalog,
        earned,
        earnedCount: earned.length,
        _loadedFor: userId,
      });
    } catch (err) {
      console.warn("[AchievementStore] Failed to refresh achievements:", err);
    }
  },

  /** Clear on logout. */
  clearAchievements: () =>
    set({ achievements: [], earned: [], earnedCount: 0, loading: false, error: null, _loadedFor: null }),
}));

export default useAchievementStore;
