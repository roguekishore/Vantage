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
