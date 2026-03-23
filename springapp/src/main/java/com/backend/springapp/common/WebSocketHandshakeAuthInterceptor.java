package com.backend.springapp.common;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;

/**
 * Resolves authenticated user for SockJS/WebSocket handshake.
 *
 * Stores {@code jwtUserId} in session attributes so STOMP CONNECT can
 * authenticate even when no Authorization header is present (cookie-only flow).
 */
@Component
@RequiredArgsConstructor
public class WebSocketHandshakeAuthInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        Long uid = null;

        // 1) Query token fallback
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String tokenParam = servletRequest.getServletRequest().getParameter("token");
            if (tokenParam != null && !tokenParam.isBlank() && jwtUtil.isValid(tokenParam)) {
                uid = jwtUtil.extractUserId(tokenParam);
            }
        }

        // 2) HttpOnly auth cookie (primary for web app)
        if (uid == null) {
            uid = extractUserFromCookieHeader(request.getHeaders());
        }

        if (uid != null) {
            attributes.put(JwtAuthFilter.JWT_USER_ID_ATTR, uid);
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // no-op
    }

    private Long extractUserFromCookieHeader(HttpHeaders headers) {
        List<String> cookieHeaders = headers.get(HttpHeaders.COOKIE);
        if (cookieHeaders == null || cookieHeaders.isEmpty()) return null;

        for (String header : cookieHeaders) {
            if (header == null || header.isBlank()) continue;

            String[] parts = header.split(";");
            for (String part : parts) {
                String trimmed = part.trim();
                int idx = trimmed.indexOf('=');
                if (idx <= 0) continue;

                String name = trimmed.substring(0, idx).trim();
                String value = trimmed.substring(idx + 1).trim();
                if (!JwtAuthFilter.AUTH_COOKIE_NAME.equals(name) || value.isBlank()) continue;

                if (!jwtUtil.isValid(value)) return null;
                return jwtUtil.extractUserId(value);
            }
        }

        return null;
    }
}
