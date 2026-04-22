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
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed) return null;

    // Legacy compatibility: older builds used alternative token field names.
    // Normalize into `token` so authFetch/STOMP can use it consistently.
    const normalizedToken =
      parsed.token ||
      parsed.jwt ||
      parsed.accessToken ||
      parsed.tsession ||
      null;

    return normalizedToken && !parsed.token
      ? { ...parsed, token: normalizedToken }
      : parsed;
  } catch {
    return null;
  }
}

function sanitizeUserForStorage(user) {
  if (!user) return null;
  return user;
}

function broadcastLogoutSignals() {
  try {
    window.postMessage({ type: "VANTAGE_LOGOUT" }, "*");
  } catch { /* SSR / non-browser */ }
}

function emitAuthExpired(message = "Session expired. Please log in again.") {
  try {
    window.dispatchEvent(
      new CustomEvent("vantage:auth-expired", {
        detail: { message },
      })
    );
  } catch { /* SSR / non-browser */ }
}

const useUserStore = create((set, get) => ({
  /** The logged-in user object, or null when logged out. */
  user: readStoredUser(),

  /**
   * Call after a successful login or signup.
   * Persists to localStorage AND updates the store so all subscribers
   * re-render immediately (navbar, widgets, etc.).
   */
  setUser: (user) => {
    try {
      localStorage.setItem("user", JSON.stringify(sanitizeUserForStorage(user)));
    } catch { /* storage full / private mode */ }
    set({ user });
  },

  /**
   * Local-only session cleanup.
   * Used for token expiry / unauthorized flows where we want immediate UI reset.
   */
  forceLogout: (reason = "Session expired. Please log in again.") => {
    const hadUser = Boolean(get().user?.uid || readStoredUser()?.uid);
    localStorage.removeItem("user");
    set({ user: null });
    broadcastLogoutSignals();
    if (hadUser) emitAuthExpired(reason);
  },

  /**
   * Call on logout.
   * Removes the user from localStorage AND the store so all subscribers
   * see the logged-out state without a page refresh.
   * Also signals the Chrome extension to clear its stored credentials.
   */
  clearUser: async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8080";
      await fetch(`${apiBase}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // network failure should not block local logout cleanup
    }

    localStorage.removeItem("user");
    set({ user: null });
    broadcastLogoutSignals();
  },

  /**
   * Re-sync the store from localStorage.
   * Useful after external code writes to localStorage directly
   * (e.g. the Chrome extension / legacy code paths).
   */
  syncFromStorage: () => {
    set({ user: readStoredUser() });
  },

  /**
   * Cookie-session bootstrap.
   * If no local user is cached, ask backend who is authenticated via HttpOnly cookie.
   */
  hydrateSession: async () => {
    const existing = readStoredUser();
    if (existing?.uid) {
      set({ user: existing });
    }

    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8080";
      const cachedToken = get().user?.token ?? existing?.token ?? null;
      const headers = cachedToken
        ? { Authorization: `Bearer ${cachedToken}` }
        : undefined;

      const res = await fetch(`${apiBase}/api/auth/me`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        // Auth is invalid -> clear stale local auth state immediately.
        if (res.status === 401 || get().user?.uid || existing?.uid) {
          get().forceLogout("Session expired. Please log in again.");
        }
        return;
      }

      const user = await res.json();
      const hydratedUser = user?.token
        ? user
        : (cachedToken ? { ...user, token: cachedToken } : user);
      try {
        localStorage.setItem("user", JSON.stringify(sanitizeUserForStorage(hydratedUser)));
      } catch { /* storage full / private mode */ }
      set({ user: hydratedUser });
    } catch {
      // network/auth failures are non-fatal; app remains logged-out
    }
  },
}));

export default useUserStore;
