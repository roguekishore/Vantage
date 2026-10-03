package com.backend.springapp.common;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Date;

/**
 * Phase 2 - JWT utility: generate, validate, and parse tokens.
 *
 * <p>The secret and expiration are read from {@code application.properties}
 * (no default; startup fails if it is blank or under 32 bytes).</p>
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret:}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(requireValidSecret(secret));
        this.expirationMs = expirationMs;
    }

    /** Minimum HMAC-SHA256 key length in bytes (UTF-8). */
    static final int MIN_SECRET_BYTES = 32;

    /**
     * Fails startup if {@code jwt.secret} is missing, blank or shorter than 32 UTF-8 bytes.
     * There is deliberately no fallback value: set JWT_SECRET (or jwt.secret).
     */
    static byte[] requireValidSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "jwt.secret is not set. Provide JWT_SECRET (at least 32 bytes); there is no default.");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("jwt.secret is too short (" + bytes.length
                    + " bytes); at least " + MIN_SECRET_BYTES + " bytes are required.");
        }
        return bytes;
    }

    /** Generate a JWT containing the user's id, username, and email. */
    public String generateToken(Long uid, String username, String email) {
        return generateToken(uid, username, email, "web", expirationMs);
        }

        /** Generate a JWT with explicit scope and expiration override. */
        public String generateToken(Long uid,
                    String username,
                    String email,
                    String scope,
                    long customExpirationMs) {
        Date now = new Date();
        Map<String, Object> claims = new HashMap<>();
        claims.put("username", username);
        claims.put("email", email);
        claims.put("scope", scope == null || scope.isBlank() ? "web" : scope);

        return Jwts.builder()
                .subject(String.valueOf(uid))
            .claims(claims)
                .issuedAt(now)
            .expiration(new Date(now.getTime() + Math.max(1, customExpirationMs)))
                .signWith(key)
                .compact();
    }

    /** Extract the user ID (subject) from a valid token. Returns null on any failure. */
    public Long extractUserId(String token) {
        try {
            Claims claims = parseToken(token);
            return Long.parseLong(claims.getSubject());
        } catch (Exception e) {
            return null;
        }
    }

    /** Validate the token signature and expiry. */
    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Extract token scope, defaulting to "web" for older tokens with no scope claim. */
    public String extractScope(String token) {
        try {
            Claims claims = parseToken(token);
            Object scope = claims.get("scope");
            if (scope == null) return "web";
            String str = String.valueOf(scope).trim();
            return str.isBlank() ? "web" : str;
        } catch (Exception e) {
            return "web";
        }
    }

    /** Parse and return the claims. Throws on invalid/expired token. */
    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
