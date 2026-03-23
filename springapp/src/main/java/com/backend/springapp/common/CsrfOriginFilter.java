package com.backend.springapp.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Lightweight CSRF protection for cookie-authenticated unsafe requests.
 *
 * <p>Rule:
 * - Applies only to mutating methods (POST/PUT/PATCH/DELETE).
 * - Applies only when auth cookie is present and no Bearer header is used.
 * - Requires Origin/Referer origin to match configured allowed origins
 *   (or this request's own backend origin).</p>
 */
@Component
public class CsrfOriginFilter extends OncePerRequestFilter {

    private static final Set<String> UNSAFE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final Set<String> allowedOrigins = new HashSet<>();

    public CsrfOriginFilter(
            @Value("${cors.allowed-origins:http://localhost:3000,https://localhost:3000}") String allowedOriginsRaw
    ) {
        Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(this::toOrigin)
                .filter(s -> !s.isBlank())
                .forEach(allowedOrigins::add);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String method = request.getMethod();
        if (!UNSAFE_METHODS.contains(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bearer auth requests are not cookie-CSRF susceptible.
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Apply only to cookie-authenticated requests.
        if (!hasAuthCookie(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String sourceOrigin = toOrigin(request.getHeader("Origin"));
        if (sourceOrigin.isBlank()) {
            sourceOrigin = toOrigin(request.getHeader("Referer"));
        }

        if (sourceOrigin.isBlank()) {
            reject(response, "Missing Origin/Referer for cookie-authenticated request");
            return;
        }

        String backendOrigin = requestOrigin(request);
        boolean allowed = sourceOrigin.equalsIgnoreCase(backendOrigin)
                || allowedOrigins.contains(sourceOrigin);

        if (!allowed) {
            reject(response, "CSRF origin check failed");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean hasAuthCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return false;
        for (Cookie cookie : cookies) {
            if (!JwtAuthFilter.AUTH_COOKIE_NAME.equals(cookie.getName())) continue;
            String value = cookie.getValue();
            if (value != null && !value.isBlank()) return true;
        }
        return false;
    }

    private String requestOrigin(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();

        boolean defaultPort = ("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443);
        return defaultPort
                ? String.format("%s://%s", scheme, host)
                : String.format("%s://%s:%d", scheme, host, port);
    }

    private String toOrigin(String raw) {
        if (raw == null || raw.isBlank()) return "";
        try {
            URI uri = URI.create(raw);
            if (uri.getScheme() == null || uri.getHost() == null) return "";
            int port = uri.getPort();
            boolean defaultPort = ("http".equalsIgnoreCase(uri.getScheme()) && port == 80)
                    || ("https".equalsIgnoreCase(uri.getScheme()) && port == 443)
                    || port == -1;
            return defaultPort
                    ? String.format("%s://%s", uri.getScheme(), uri.getHost())
                    : String.format("%s://%s:%d", uri.getScheme(), uri.getHost(), port);
        } catch (Exception e) {
            return "";
        }
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
