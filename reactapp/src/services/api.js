/**
 * Shared API client.
 *
 * Primary auth mode: HttpOnly cookie (credentials: include).
 * Bridge mode: in-memory JWT header (for flows that still expect Bearer).
 */

import useUserStore from "../stores/useUserStore";

export const API_BASE =
  (process.env.REACT_APP_API_URL || "http://localhost:8080") + "/api";

/** Read the JWT token from the stored user object. */
export function getToken() {
  try {
    const user = useUserStore.getState().user;
    if (user?.token) return user.token;
    if (user?.jwt) return user.jwt;
    if (user?.accessToken) return user.accessToken;
    if (user?.tsession) return user.tsession;

    // Legacy browser storage compatibility (pre-zustand / old auth migrations)
    const directKeys = ["tsession", "token", "jwt", "accessToken", "vantage_token"];
    for (const key of directKeys) {
      const raw = localStorage.getItem(key);
      if (raw && raw !== "null" && raw !== "undefined") return raw;
    }

    // Some old builds stored a serialized user in localStorage without
    // using the current zustand store shape.
    const legacyUserRaw = localStorage.getItem("user");
    if (legacyUserRaw) {
      try {
        const legacyUser = JSON.parse(legacyUserRaw);
        const legacyToken =
          legacyUser?.token ||
          legacyUser?.jwt ||
          legacyUser?.accessToken ||
          legacyUser?.tsession ||
          null;
        if (legacyToken) return legacyToken;
      } catch {
        // ignore malformed legacy payload
      }
    }
  } catch {
    // non-critical
  }
  return null;
}

/** Read the current user's ID from the stored user object. */
export function getCurrentUserId() {
  try {
    const user = useUserStore.getState().user;
    return user?.uid ?? user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Authenticated fetch wrapper.
 * Injects `Authorization: Bearer <jwt>` when a token is available.
 * Safe to call even when logged out - just skips the header.
 */
export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  });

  if (res.status === 401) {
    const state = useUserStore.getState();
    if (typeof state?.forceLogout === "function") {
      state.forceLogout("Your session expired. Please log in again.");
    }
  }

  return res;
}
