import { create } from "zustand";
import { fetchPlayerStats, fetchStreak } from "@/services/gamificationApi";
import { getStoredUser } from "@/services/userApi";

/**
 * Global gamification store — coins, XP, level, streaks.
 * Loaded once on app start for logged-in users.
 * Updated optimistically after problem solves.
 */
const useGamificationStore = create((set, get) => ({
  /* ── state ── */
  stats: null,       // PlayerStatsDTO from backend
  streak: null,      // StreakDTO from backend
  loading: false,
  error: null,
  /** One-time toast: set when a streak shield was used today */
  shieldToast: null,

  /* ── actions ── */

  /** Fetch stats from backend and update store. */
  loadStats: async (userId) => {
    const uid = userId ?? getStoredUser()?.uid;
    if (!uid) return;
    set({ loading: true, error: null });
    try {
      const [data, streakData] = await Promise.all([
        fetchPlayerStats(uid),
        fetchStreak(uid).catch(() => null),
      ]);

      // Phase 3: Detect if a Streak Shield saved the streak today
      let shieldToast = null;
      if (streakData?.shieldUsedToday && streakData.currentStreak > 0) {
        shieldToast = `🛡️ Your Streak Shield saved your ${streakData.currentStreak}-day streak!`;
      }

      set({ stats: data, streak: streakData, loading: false, shieldToast });
    } catch (err) {
      console.warn("Failed to load gamification stats:", err);
      set({ error: err.message, loading: false });
    }
  },

  /** Clear the shield toast after it has been shown. */
  dismissShieldToast: () => set({ shieldToast: null }),

  /** Reload only streak data (lighter call after a solve). */
  loadStreak: async (userId) => {
    const uid = userId ?? getStoredUser()?.uid;
    if (!uid) return;
    try {
      const streakData = await fetchStreak(uid);
      set({ streak: streakData });
    } catch (err) {
      console.warn("Failed to load streak:", err);
    }
  },

  /**
   * Optimistic update after a problem solve.
   * Adds approximate reward locally so the UI feels instant.
   * The next loadStats() call will reconcile with the real backend values.
   */
  optimisticSolve: (tag, isFirstAttempt = false) => {
    const { stats, streak } = get();
    if (!stats) return;

    const coinTable = { BASIC: 3, EASY: 5, MEDIUM: 15, HARD: 30 };
    const xpTable   = { BASIC: 5, EASY: 10, MEDIUM: 25, HARD: 50 };
    
    let coins = coinTable[tag] || 5;
    const xp = xpTable[tag] || 10;

    if (isFirstAttempt) {
      coins = Math.ceil(coins * 1.2);
    }

    // Apply streak multiplier if available
    if (streak) {
      coins = Math.ceil(coins * streak.multiplier);
    }

    set({
      stats: {
        ...stats,
        coins: stats.coins + coins,
        xp: stats.xp + xp,
      },
    });
  },

  /** Clear store on logout. */
  clearStats: () => set({ stats: null, streak: null, loading: false, error: null, shieldToast: null }),
}));

export default useGamificationStore;
