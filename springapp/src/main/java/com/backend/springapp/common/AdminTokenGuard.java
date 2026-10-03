package com.backend.springapp.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Admin = request header {@code X-Admin-Token} equal to {@code vantage.admin.token}.
 * A blank configured token means nobody is admin (fail closed). Comparison is constant time.
 */
@Component
public class AdminTokenGuard {

    public static final String HEADER = "X-Admin-Token";

    private final byte[] expected;

    public AdminTokenGuard(@Value("${vantage.admin.token:}") String token) {
        this.expected = token == null ? new byte[0] : token.getBytes(StandardCharsets.UTF_8);
    }

    public boolean isAdmin(HttpServletRequest request) {
        if (expected.length == 0) return false;
        String presented = request.getHeader(HEADER);
        if (presented == null) return false;
        return MessageDigest.isEqual(expected, presented.getBytes(StandardCharsets.UTF_8));
    }

    /** Admin only: anonymous with no admin header gets 401, anyone else 403. */
    public void requireAdmin(HttpServletRequest request) {
        if (isAdmin(request)) return;
        if (request.getHeader(HEADER) == null && CurrentUser.resolve(request) == null) {
            throw new ApiAuthException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        throw new ApiAuthException(HttpStatus.FORBIDDEN, "Admin access required");
    }

    /** The principal acting for itself, or an admin. Anonymous is 401, another user 403. */
    public void requireSelfOrAdmin(HttpServletRequest request, Long targetUserId) {
        if (isAdmin(request)) return;
        Long uid = CurrentUser.resolve(request);
        if (uid == null) {
            throw new ApiAuthException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (!uid.equals(targetUserId)) {
            throw new ApiAuthException(HttpStatus.FORBIDDEN, "Not allowed to act for another user");
        }
    }
}
