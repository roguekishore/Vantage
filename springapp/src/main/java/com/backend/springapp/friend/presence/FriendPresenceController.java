package com.backend.springapp.friend.presence;

import com.backend.springapp.common.CurrentUser;
import com.backend.springapp.friend.presence.dto.FriendPresenceDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends/presence")
@RequiredArgsConstructor
public class FriendPresenceController {

    private final FriendPresenceService presenceService;

    @PostMapping("/ping")
    public ResponseEntity<Map<String, String>> ping(HttpServletRequest request) {
        Long userId = requireUser(request);
        presenceService.ping(userId);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/friends")
    public ResponseEntity<List<FriendPresenceDTO>> friendsPresence(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(presenceService.getFriendsPresence(userId));
    }

    private Long requireUser(HttpServletRequest request) {
        Long userId = CurrentUser.resolve(request);
        if (userId == null) throw new IllegalStateException("Authentication required");
        return userId;
    }
}
