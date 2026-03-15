package com.backend.springapp.friend;

import com.backend.springapp.common.CurrentUser;
import com.backend.springapp.friend.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping("/search")
    public ResponseEntity<Page<FriendSearchResultDTO>> searchUsers(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(friendService.searchUsers(userId, q, page, size));
    }

    @PostMapping("/requests")
    public ResponseEntity<FriendRequestDTO> sendRequest(
            @Valid @RequestBody SendFriendRequestDTO body,
            HttpServletRequest request
    ) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(friendService.sendRequest(userId, body.targetUserId()));
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<List<FriendRequestDTO>> incomingRequests(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(friendService.getIncomingRequests(userId));
    }

    @GetMapping("/requests/outgoing")
    public ResponseEntity<List<FriendRequestDTO>> outgoingRequests(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(friendService.getOutgoingRequests(userId));
    }

    @GetMapping("/requests/incoming/count")
    public ResponseEntity<Map<String, Long>> incomingCount(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(Map.of("count", friendService.getIncomingCount(userId)));
    }

    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<FriendRequestDTO> acceptRequest(
            @PathVariable Long requestId,
            HttpServletRequest request
    ) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(friendService.acceptRequest(userId, requestId));
    }

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<FriendRequestDTO> rejectRequest(
            @PathVariable Long requestId,
            HttpServletRequest request
    ) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(friendService.rejectRequest(userId, requestId));
    }

    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<Void> cancelRequest(
            @PathVariable Long requestId,
            HttpServletRequest request
    ) {
        Long userId = requireUser(request);
        friendService.cancelRequest(userId, requestId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/list")
    public ResponseEntity<List<FriendUserDTO>> friends(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(friendService.getFriends(userId));
    }

    @GetMapping("/overview")
    public ResponseEntity<FriendOverviewDTO> overview(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(friendService.getOverview(userId));
    }

    private Long requireUser(HttpServletRequest request) {
        Long userId = CurrentUser.resolve(request);
        if (userId == null) {
            throw new IllegalStateException("Authentication required");
        }
        return userId;
    }
}
