package com.backend.springapp.friend.challenge;

import com.backend.springapp.common.CurrentUser;
import com.backend.springapp.friend.challenge.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends/challenges")
@RequiredArgsConstructor
public class FriendChallengeController {

    private final FriendChallengeService challengeService;

    @PostMapping
    public ResponseEntity<FriendChallengeCreateResponseDTO> createChallenge(
            @Valid @RequestBody FriendChallengeCreateDTO body,
            HttpServletRequest request
    ) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(challengeService.createChallenge(userId, body));
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<FriendChallengeDTO>> incoming(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(challengeService.getIncomingChallenges(userId));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<FriendChallengeDTO> accept(@PathVariable Long id, HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(challengeService.acceptChallenge(userId, id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<FriendChallengeDTO> reject(@PathVariable Long id, HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(challengeService.rejectChallenge(userId, id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<FriendChallengeDTO> cancel(@PathVariable Long id, HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(challengeService.cancelChallenge(userId, id));
    }

    @PostMapping("/mute")
    public ResponseEntity<ChallengeMuteStatusDTO> mute(
            @Valid @RequestBody ChallengeMuteRequestDTO body,
            HttpServletRequest request
    ) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(challengeService.muteChallenges(userId, body.minutes()));
    }

    @GetMapping("/mute")
    public ResponseEntity<ChallengeMuteStatusDTO> muteStatus(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(challengeService.getMuteStatus(userId));
    }

    @DeleteMapping("/mute")
    public ResponseEntity<ChallengeMuteStatusDTO> clearMute(HttpServletRequest request) {
        Long userId = requireUser(request);
        return ResponseEntity.ok(challengeService.clearMute(userId));
    }

    private Long requireUser(HttpServletRequest request) {
        Long userId = CurrentUser.resolve(request);
        if (userId == null) throw new IllegalStateException("Authentication required");
        return userId;
    }
}
