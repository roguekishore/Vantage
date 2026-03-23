package com.backend.springapp.user;

import com.backend.springapp.common.CurrentUser;
import com.backend.springapp.common.JwtAuthFilter;
import com.backend.springapp.user.dto.LoginRequestDTO;
import com.backend.springapp.user.dto.SignupRequestDTO;
import com.backend.springapp.user.dto.UserResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Value("${auth.cookie.secure:false}")
    private boolean authCookieSecure;

    @Value("${auth.cookie.same-site:Lax}")
    private String authCookieSameSite;

    @Value("${auth.cookie.max-age-seconds:86400}")
    private long authCookieMaxAgeSeconds;

    @Value("${auth.extension-token.expiration-ms:21600000}")
    private long extensionTokenExpirationMs;

    private ResponseCookie buildAuthCookie(String token) {
        return ResponseCookie.from(JwtAuthFilter.AUTH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(authCookieSecure)
                .sameSite(authCookieSameSite)
                .path("/")
                .maxAge(authCookieMaxAgeSeconds)
                .build();
    }

    private ResponseCookie clearAuthCookie() {
        return ResponseCookie.from(JwtAuthFilter.AUTH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(authCookieSecure)
                .sameSite(authCookieSameSite)
                .path("/")
                .maxAge(0)
                .build();
    }

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO dto) {
        try {
            UserResponseDTO user = userService.login(dto);
            ResponseCookie cookie = buildAuthCookie(user.getToken());
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/auth/signup */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequestDTO dto) {
        try {
            UserResponseDTO user = userService.signup(dto);
            ResponseCookie cookie = buildAuthCookie(user.getToken());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Returns the currently authenticated user profile (resolved from JWT/cookie).
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        Long uid = CurrentUser.resolve(request);
        if (uid == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        try {
            return ResponseEntity.ok(userService.getUserById(uid));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }
    }

    /**
     * Clears the auth cookie to terminate web session.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAuthCookie().toString())
                .body(Map.of("ok", true));
    }

    /**
     * Mint a short-lived extension-scoped token from a cookie-authenticated web session.
     */
    @PostMapping("/extension/token")
    public ResponseEntity<?> mintExtensionToken(HttpServletRequest request) {
        Long uid = CurrentUser.resolve(request);
        if (uid == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        String token = userService.issueExtensionToken(uid, extensionTokenExpirationMs);
        long expiresAtEpochMs = System.currentTimeMillis() + extensionTokenExpirationMs;

        return ResponseEntity.ok(Map.of(
                "token", token,
                "scope", "ext",
                "expiresInMs", extensionTokenExpirationMs,
                "expiresAt", expiresAtEpochMs
        ));
    }
}
