package com.backend.springapp.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

/**
 * Extracts the authenticated user from the request. Only the JWT-derived {@code jwtUserId} attribute (set by
 * {@link JwtAuthFilter}) counts; a {@code ?userId=} query parameter is never an identity.
 */
public final class CurrentUser {

    /** Raw client-sent {@code userId} param, kept by the filter before it overwrites the visible one. */
    static final String RAW_USER_ID_ATTR = "rawUserIdParam";
    static final String RAW_KICKER_ID_ATTR = "rawKickerIdParam";

    private CurrentUser() {} // utility class

    /** @return the authenticated user ID, or {@code null} when the request carries no valid JWT */
    public static Long resolve(HttpServletRequest request) {
        Object jwtUid = request.getAttribute(JwtAuthFilter.JWT_USER_ID_ATTR);
        return jwtUid instanceof Long id ? id : null;
    }

    /** The authenticated user, or 401. */
    public static Long require(HttpServletRequest request) {
        Long uid = resolve(request);
        if (uid == null) {
            throw new ApiAuthException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return uid;
    }

    /**
     * The authenticated user, after checking that the id the client claims (param or body field) is the same
     * person. Null claim means the client did not send one. A different id is 403.
     */
    public static Long requireSelf(HttpServletRequest request, Long claimed) {
        Long uid = require(request);
        if (claimed != null && !claimed.equals(uid)) {
            throw new ApiAuthException(HttpStatus.FORBIDDEN, "Not allowed to act for another user");
        }
        return uid;
    }

    /** {@link #requireSelf} for the {@code userId} query parameter the frontend still sends. */
    public static Long requireSelfParam(HttpServletRequest request) {
        return requireSelf(request, rawParam(request, RAW_USER_ID_ATTR));
    }

    /** {@link #requireSelf} for the legacy {@code kickerId} query parameter. */
    public static Long requireSelfKickerParam(HttpServletRequest request) {
        return requireSelf(request, rawParam(request, RAW_KICKER_ID_ATTR));
    }

    private static Long rawParam(HttpServletRequest request, String attr) {
        Object raw = request.getAttribute(attr);
        if (!(raw instanceof String s) || s.isBlank()) return null;
        try {
            return Long.parseLong(s.trim());
        } catch (NumberFormatException e) {
            return -1L; // never equals a real uid, so it is rejected as someone else
        }
    }
}
