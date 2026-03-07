package com.backend.springapp.common;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Phase 2 — JWT utility: generate, validate, and parse tokens.
 *
 * <p>The secret and expiration are read from {@code application.properties}
 * (with sensible dev defaults so nothing breaks locally).</p>
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret:default-dev-secret-change-me-in-production-please-32chars!!}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /** Generate a JWT containing the user's id, username, and email. */
    public String generateToken(Long uid, String username, String email) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(uid))
                .claim("username", username)
                .claim("email", email)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
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

    /** Parse and return the claims. Throws on invalid/expired token. */
    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
