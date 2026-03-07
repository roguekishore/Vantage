package com.backend.springapp.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Phase 3 — JWT authentication filter with enforcement.
 *
 * <p>Extracts JWT from the {@code Authorization: Bearer} header <b>or</b>
 * a {@code ?token=} query parameter (needed for SSE / EventSource which
 * cannot send custom headers).</p>
 *
 * <p>When a valid JWT is present, the filter wraps the request so that
 * {@code request.getParameter("userId")} returns the JWT-authenticated user
 * ID.  This means <b>existing controllers need zero code changes</b> —
 * their {@code @RequestParam Long userId} annotations keep working.</p>
 *
 * <p>Protected paths that receive no JWT (or an invalid one) are rejected
 * with HTTP 401.</p>
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    /** Request attribute name where the authenticated user ID is stored. */
    public static final String JWT_USER_ID_ATTR = "jwtUserId";

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Let CORS preflight through — browser sends OPTIONS with no auth header
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractToken(request);
        Long userId = null;

        if (token != null) {
            if (jwtUtil.isValid(token)) {
                userId = jwtUtil.extractUserId(token);
            } else {
                // Token present but invalid — check if it's an old sessionToken
                // on the /api/sync path (backward-compat for the Chrome extension
                // during the transition period while users re-login to get JWTs).
                String path = request.getRequestURI();
                if (path.startsWith("/api/sync")) {
                    // Let the SyncController handle its own sessionToken auth
                    filterChain.doFilter(request, response);
                    return;
                }
                reject(response, "Invalid or expired token");
                return;
            }
        }

        String path = request.getRequestURI();

        // No valid JWT on a protected path → 401
        if (userId == null && isProtected(path)) {
            reject(response, "Authentication required");
            return;
        }

        if (userId != null) {
            request.setAttribute(JWT_USER_ID_ATTR, userId);
            filterChain.doFilter(new JwtRequestWrapper(request, userId), response);
        } else {
            filterChain.doFilter(request, response);
        }
    }

    // ─── Token extraction ─────────────────────────────────────────────────

    private String extractToken(HttpServletRequest request) {
        // 1. Authorization header (standard)
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        // 2. Query param (for SSE EventSource / WebSocket which can't send headers)
        String param = request.getParameter("token");
        if (param != null && !param.isBlank()) {
            return param;
        }
        return null;
    }

    // ─── Path protection ──────────────────────────────────────────────────

    /** Returns true if the path requires a valid JWT. */
    private boolean isProtected(String path) {
        if (!path.startsWith("/api/")) return false;

        // ── Always public (no JWT needed) ──
        if (path.startsWith("/api/auth/"))         return false;
        if (path.startsWith("/api/problems"))       return false;
        if (path.startsWith("/api/stages"))         return false;
        if (path.startsWith("/api/users/"))         return false;
        if (path.startsWith("/api/institutions"))   return false;

        // Public leaderboards — except the /me rank endpoint
        if (path.startsWith("/api/gamification/leaderboard/")
                && !path.endsWith("/me"))           return false;

        // ── Everything else under /api/ is protected ──
        return true;
    }

    // ─── Error response ───────────────────────────────────────────────────

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    // ─── Request wrapper ──────────────────────────────────────────────────

    /**
     * Wraps the original request so that {@code getParameter("userId")}
     * (and "kickerId") returns the JWT-authenticated user ID.
     * This lets existing {@code @RequestParam Long userId} controller
     * parameters work transparently without code changes.
     */
    private static class JwtRequestWrapper extends HttpServletRequestWrapper {

        private final Long jwtUserId;

        JwtRequestWrapper(HttpServletRequest request, Long jwtUserId) {
            super(request);
            this.jwtUserId = jwtUserId;
        }

        @Override
        public String getParameter(String name) {
            // JWT userId always takes precedence for these params
            if ("userId".equals(name) || "kickerId".equals(name)) {
                return String.valueOf(jwtUserId);
            }
            return super.getParameter(name);
        }

        @Override
        public String[] getParameterValues(String name) {
            if ("userId".equals(name) || "kickerId".equals(name)) {
                return new String[]{ String.valueOf(jwtUserId) };
            }
            return super.getParameterValues(name);
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> map = new HashMap<>(super.getParameterMap());
            map.put("userId", new String[]{ String.valueOf(jwtUserId) });
            return Collections.unmodifiableMap(map);
        }
    }
}
