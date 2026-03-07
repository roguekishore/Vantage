import { create } from "zustand";

/**
 * Global user / auth store.
 *
 * This is the SINGLE REACTIVE SOURCE OF TRUTH for "who is logged in".
 * Components must read from here instead of calling localStorage.getItem("user")
 * directly, so that login/logout events propagate without a page refresh.
 *
 * localStorage is kept in sync so that:
 *   - Hard-refreshes still restore the session.
 *   - Legacy code that still reads localStorage keeps working.
 */

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const useUserStore = create((set) => ({
  /** The logged-in user object, or null when logged out. */
  user: readStoredUser(),

  /**
   * Call after a successful login or signup.
   * Persists to localStorage AND updates the store so all subscribers
   * re-render immediately (navbar, widgets, etc.).
   */
  setUser: (user) => {
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch { /* storage full / private mode */ }
    set({ user });
  },

  /**
   * Call on logout.
   * Removes the user from localStorage AND the store so all subscribers
   * see the logged-out state without a page refresh.
   * Also signals the Chrome extension to clear its stored credentials.
   */
  clearUser: () => {
    localStorage.removeItem("user");
    set({ user: null });
    // Notify the Chrome extension (content-script listens for this)
    try {
      window.postMessage({ type: 'VANTAGE_LOGOUT' }, '*');
    } catch { /* SSR / non-browser */ }
  },

  /**
   * Re-sync the store from localStorage.
   * Useful after external code writes to localStorage directly
   * (e.g. the Chrome extension / legacy code paths).
   */
  syncFromStorage: () => {
    set({ user: readStoredUser() });
  },
}));

export default useUserStore;
