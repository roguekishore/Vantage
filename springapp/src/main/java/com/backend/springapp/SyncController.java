package com.backend.springapp;

import com.backend.springapp.common.CurrentUser;
import com.backend.springapp.sync.AttemptRequestDTO;
import com.backend.springapp.sync.SyncRequestDTO;
import com.backend.springapp.sync.SyncResponseDTO;
import com.backend.springapp.sync.SyncService;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;
    private final UserService userService;

    // ── Endpoints ────────────────────────────────────────────────────────────

    /**
     * Called by the browser extension after the user clicks "Sync".
     * Body: { "lcusername": "john_doe", "leetcodeSlugs": ["two-sum", "..."] }
     * Requires authenticated cookie/JWT (web token or extension-scoped token).
     *
     * The token MUST belong to the same user whose lcusername is in the body.
     * This prevents one user from syncing solutions to another user's account.
     */
    @PostMapping
    public ResponseEntity<?> sync(
            HttpServletRequest request,
            @RequestBody SyncRequestDTO payload) {
        try {
            Long jwtUid = CurrentUser.resolve(request);
            if (jwtUid == null) {
                return ResponseEntity.status(401).body("Authentication required.");
            }
            User caller = userService.getUserEntityById(jwtUid);

            // The token resolved to a real user - use THEIR lcusername,
            // ignoring whatever the client sent (prevents impersonation).
            String trustedLc = caller.getLcusername();
            if (trustedLc == null || trustedLc.isBlank()) {
                return ResponseEntity.status(400).body(
                    "Your account has no LeetCode username set. " +
                    "Please update your profile first.");
            }
            SyncResponseDTO result = syncService.syncProgress(trustedLc, payload.getLeetcodeSlugs());
            return ResponseEntity.ok(result);

        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        }
    }

    /**
     * Called by the browser extension for every non-accepted submission attempt.
     * Body: { "lcusername": "john_doe", "lcslug": "two-sum" }
     * Requires authenticated cookie/JWT (web token or extension-scoped token).
     */
    @PostMapping("/attempt")
    public ResponseEntity<?> markAttempted(
            HttpServletRequest request,
            @RequestBody AttemptRequestDTO payload) {
        try {
            Long jwtUid = CurrentUser.resolve(request);
            if (jwtUid == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Authentication required."));
            }
            User caller = userService.getUserEntityById(jwtUid);

            String lcusername = caller.getLcusername();
            if (lcusername == null || lcusername.isBlank()) {
                return ResponseEntity.status(400)
                        .body(Map.of("error", "No LeetCode username on your account."));
            }

            if (payload.getLcslug() == null || payload.getLcslug().isBlank()) {
                return ResponseEntity.status(400)
                        .body(Map.of("error", "Missing lcslug."));
            }

            boolean recorded = syncService.markAttempted(lcusername, payload.getLcslug());
            return ResponseEntity.ok(Map.of("recorded", recorded, "slug", payload.getLcslug()));
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
