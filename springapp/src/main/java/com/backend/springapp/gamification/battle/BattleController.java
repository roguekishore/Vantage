package com.backend.springapp.gamification.battle;

import com.backend.springapp.common.CurrentUser;
import com.backend.springapp.judge.JudgeUnavailableException;
import com.backend.springapp.judge.queue.JudgeJobReader;
import com.backend.springapp.judge.queue.JudgeJobStatusDTO;
import com.backend.springapp.judge.queue.JudgeJobSubmitter;
import com.backend.springapp.judge.queue.JudgeQueueSettings;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * REST API for 1-v-1 battles.
 */
@RestController
@RequestMapping("/api/battle")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;
    private final MatchmakingService matchmakingService;
    private final BattleJudgingService judgingService;
    private final BattleLifecycleService lifecycleService;
    private final JudgeQueueSettings queueSettings;
    private final JudgeJobSubmitter jobSubmitter;
    private final JudgeJobReader jobReader;

    private static final Pattern IDEMPOTENCY_KEY = Pattern.compile("^[A-Za-z0-9-]{8,64}$");

    /* ── Matchmaking Queue ── */

    @PostMapping("/queue")
    public ResponseEntity<?> joinQueue(@Valid @RequestBody JoinQueueRequest req,
                                       HttpServletRequest request) {
        Long uid = CurrentUser.requireSelf(request, req.userId());
        Map<String, Object> result = matchmakingService.joinQueue(
                uid, req.mode(), req.difficulty(), req.problemCount(), req.durationMinutes());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/queue/status")
    public ResponseEntity<QueueStatusResponse> getQueueStatus(HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(matchmakingService.getQueueStatus(userId));
    }

    @GetMapping("/feature-flags")
    public ResponseEntity<Map<String, Object>> getBattleFeatureFlags() {
        return ResponseEntity.ok(battleService.getBattleFeatureFlags());
    }

    @DeleteMapping("/queue")
    public ResponseEntity<Void> leaveQueue(HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        matchmakingService.leaveQueue(userId);
        return ResponseEntity.noContent().build();
    }

    /* ── Lobby ── */

    @GetMapping("/{id}")
    public ResponseEntity<BattleLobbyDTO> getBattle(@PathVariable Long id,
                                                      HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.getBattle(id, userId));
    }

    @PostMapping("/{id}/ready")
    public ResponseEntity<BattleLobbyDTO> readyUp(@PathVariable Long id,
                                                    @RequestBody ReadyUpRequest req,
                                                    HttpServletRequest request) {
        Long uid = CurrentUser.requireSelf(request, req.userId());
        return ResponseEntity.ok(battleService.readyUp(id, uid, req.language()));
    }

    /* ── Active Battle ── */

    @GetMapping("/{id}/state")
    public ResponseEntity<BattleStateDTO> getBattleState(@PathVariable Long id,
                                                          HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.getBattleState(id, userId));
    }

    /**
     * Queue off: judges inline and returns 200 + SubmitResultDTO. Queue on: needs an Idempotency-Key header and returns
     * 202 + JudgeJobStatusDTO (poll GET /{id}/submissions/{jobId}); a repeated key returns the same job.
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitCode(@PathVariable Long id,
                                        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                                        @RequestBody SubmitCodeRequest req,
                                        HttpServletRequest request) {
        Long uid = CurrentUser.requireSelf(request, req.userId());
        try {
            if (!queueSettings.isEnabled()) {
                return ResponseEntity.ok(judgingService.submitCode(
                        id, uid, req.problemIndex(), req.language(), req.code()));
            }
            if (idempotencyKey == null || !IDEMPOTENCY_KEY.matcher(idempotencyKey).matches()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Idempotency-Key header required"));
            }
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(jobSubmitter.submit(
                    id, uid, req.problemIndex(), req.language(), req.code(), idempotencyKey));
        } catch (JudgeUnavailableException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", "Judge unavailable"));
        }
    }

    /** Poll one queued submission. Only the submitting user can read it. */
    @GetMapping("/{id}/submissions/{jobId}")
    public ResponseEntity<JudgeJobStatusDTO> getSubmission(@PathVariable Long id, @PathVariable Long jobId,
                                                           HttpServletRequest request) {
        Long uid = CurrentUser.requireSelfParam(request);
        return jobReader.find(jobId, id, uid).map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /* ── Results ── */

    @GetMapping("/{id}/result")
    public ResponseEntity<BattleResultDTO> getBattleResult(@PathVariable Long id,
                                                            HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.getBattleResult(id, userId));
    }

    /* ── Forfeit ── */

    @PostMapping("/{id}/forfeit")
    public ResponseEntity<Void> forfeit(@PathVariable Long id, HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        lifecycleService.forfeit(id, userId);
        return ResponseEntity.noContent().build();
    }

    /* ── Abandon (force-complete stuck battle) ── */

    @PostMapping("/{id}/abandon")
    public ResponseEntity<Void> abandonBattle(@PathVariable Long id, HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        lifecycleService.abandonBattle(id, userId);
        return ResponseEntity.noContent().build();
    }

    /* ── Battle History ── */

    @GetMapping("/history")
    public ResponseEntity<java.util.List<BattleHistoryDTO>> getBattleHistory(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.getBattleHistory(userId, page, size));
    }

    /* ═══════════════════════════════════════════════════════════
     * GROUP BATTLE - ROOM ENDPOINTS
     * ═══════════════════════════════════════════════════════════ */

    /** Create a new group room. */
    @PostMapping("/room")
    public ResponseEntity<RoomLobbyDTO> createRoom(HttpServletRequest request,
                                                    @RequestBody CreateRoomRequest req) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.createRoom(userId, req));
    }

    /** Get room details by 6-char code. */
    @GetMapping("/room/{code}")
    public ResponseEntity<RoomLobbyDTO> getRoomByCode(@PathVariable String code) {
        return ResponseEntity.ok(battleService.getRoomByCode(code));
    }

    /** Join a room by code. */
    @PostMapping("/room/{code}/join")
    public ResponseEntity<RoomLobbyDTO> joinRoom(@PathVariable String code,
                                                  HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.joinRoom(code, userId));
    }

    /** Leave a room. */
    @PostMapping("/room/{code}/leave")
    public ResponseEntity<RoomLobbyDTO> leaveRoom(@PathVariable String code,
                                                   HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        RoomLobbyDTO lobby = battleService.leaveRoom(code, userId);
        return lobby != null ? ResponseEntity.ok(lobby) : ResponseEntity.noContent().build();
    }

    /** Creator kicks a player from the room. */
    @PostMapping("/room/{code}/kick/{targetUserId}")
    public ResponseEntity<RoomLobbyDTO> kickFromRoom(@PathVariable String code,
                                                      HttpServletRequest request,
                                                      @PathVariable Long targetUserId) {
        return ResponseEntity.ok(battleService.kickFromRoom(code, CurrentUser.requireSelfKickerParam(request), targetUserId));
    }

    /** Creator starts the group battle. */
    @PostMapping("/room/{code}/start")
    public ResponseEntity<RoomLobbyDTO> startGroupBattle(@PathVariable String code,
                                                          HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.startGroupBattle(code, userId));
    }

    /** Get live group battle state (scoreboard). */
    @GetMapping("/{id}/group-state")
    public ResponseEntity<GroupBattleStateDTO> getGroupBattleState(@PathVariable Long id,
                                                                    HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.getGroupBattleState(id, userId));
    }

    /** Get group battle result (final placement). */
    @GetMapping("/{id}/group-result")
    public ResponseEntity<GroupBattleResultDTO> getGroupBattleResult(@PathVariable Long id,
                                                                      HttpServletRequest request) {
        Long userId = CurrentUser.requireSelfParam(request);
        return ResponseEntity.ok(battleService.getGroupBattleResult(id, userId));
    }

    /* ── Active Battle Check ── */

    @GetMapping("/active")
    public ResponseEntity<?> getActiveBattle(HttpServletRequest request) {
        Long userId = CurrentUser.require(request);
        return battleService.checkForActiveBattle(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
