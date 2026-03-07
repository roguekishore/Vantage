/**
 * Phase 3 — Shared API client with JWT authentication.
 *
 * Every Spring Boot call should go through authFetch() so the JWT
 * is automatically injected. The backend's JwtAuthFilter then extracts
 * the userId from the token and injects it as a request parameter,
 * meaning existing @RequestParam Long userId annotations still work
 * without any controller changes.
 */

export const API_BASE =
  (process.env.REACT_APP_API_URL || "http://localhost:8080") + "/api";

/** Read the JWT token from the stored user object. */
export function getToken() {
  try {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    return user?.token ?? null;
  } catch {
    return null;
  }
}

/** Read the current user's ID from the stored user object. */
export function getCurrentUserId() {
  try {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    return user?.uid ?? user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Authenticated fetch wrapper.
 * Injects `Authorization: Bearer <jwt>` when a token is available.
 * Safe to call even when logged out — just skips the header.
 */
export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}
