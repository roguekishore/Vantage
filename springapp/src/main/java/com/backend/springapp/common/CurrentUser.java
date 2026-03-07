package com.backend.springapp.common;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Phase 2 — Bridge helper to extract the current user ID.
 *
 * <p>Checks (in order):</p>
 * <ol>
 *   <li>JWT-derived {@code jwtUserId} request attribute (set by {@link JwtAuthFilter})</li>
 *   <li>Legacy {@code ?userId=} query parameter (existing frontend behaviour)</li>
 * </ol>
 *
 * <p>Controllers can start using {@code CurrentUser.resolve(request)} today.
 * In <b>Phase 3</b>, once all frontends send JWTs, the query-param fallback
 * will be removed.</p>
 */
public final class CurrentUser {

    private CurrentUser() {} // utility class

    /**
     * Resolve the current user's ID from the request.
     *
     * @return the user ID, or {@code null} if neither JWT nor query param is present
     */
    public static Long resolve(HttpServletRequest request) {
        // 1. Prefer JWT-authenticated user
        Object jwtUid = request.getAttribute(JwtAuthFilter.JWT_USER_ID_ATTR);
        if (jwtUid instanceof Long id) {
            return id;
        }

        // 2. Fallback to query param (backward compat — Phase 2 bridge)
        String param = request.getParameter("userId");
        if (param != null && !param.isBlank()) {
            try {
                return Long.parseLong(param);
            } catch (NumberFormatException ignored) {
                // bad param — return null
            }
        }

        return null;
    }
}
