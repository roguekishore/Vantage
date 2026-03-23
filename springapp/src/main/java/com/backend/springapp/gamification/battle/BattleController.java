package com.backend.springapp.gamification.battle;

import com.backend.springapp.common.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST API for 1-v-1 battles.
 */
@RestController
@RequestMapping("/api/battle")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    /* ── Matchmaking Queue ── */

    @PostMapping("/queue")
    public ResponseEntity<?> joinQueue(@Valid @RequestBody JoinQueueRequest req) {
        Map<String, Object> result = battleService.joinQueue(
                req.userId(), req.mode(), req.difficulty(), req.problemCount());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/queue/status")
    public ResponseEntity<QueueStatusResponse> getQueueStatus(@RequestParam Long userId) {
        return ResponseEntity.ok(battleService.getQueueStatus(userId));
    }

    @DeleteMapping("/queue")
    public ResponseEntity<Void> leaveQueue(@RequestParam Long userId) {
        battleService.leaveQueue(userId);
        return ResponseEntity.noContent().build();
    }

    /* ── Lobby ── */

    @GetMapping("/{id}")
    public ResponseEntity<BattleLobbyDTO> getBattle(@PathVariable Long id,
                                                      @RequestParam Long userId) {
        return ResponseEntity.ok(battleService.getBattle(id, userId));
    }

    @PostMapping("/{id}/ready")
    public ResponseEntity<BattleLobbyDTO> readyUp(@PathVariable Long id,
                                                    @RequestBody ReadyUpRequest req) {
        return ResponseEntity.ok(battleService.readyUp(id, req.userId(), req.language()));
    }

    /* ── Active Battle ── */

    @GetMapping("/{id}/state")
    public ResponseEntity<BattleStateDTO> getBattleState(@PathVariable Long id,
                                                          @RequestParam Long userId) {
        return ResponseEntity.ok(battleService.getBattleState(id, userId));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<SubmitResultDTO> submitCode(@PathVariable Long id,
                                                       @RequestBody SubmitCodeRequest req) {
        return ResponseEntity.ok(battleService.submitCode(
                id, req.userId(), req.problemIndex(), req.language(), req.code()));
    }

    /* ── Results ── */

    @GetMapping("/{id}/result")
    public ResponseEntity<BattleResultDTO> getBattleResult(@PathVariable Long id,
                                                            @RequestParam Long userId) {
        return ResponseEntity.ok(battleService.getBattleResult(id, userId));
    }

    /* ── Forfeit ── */

    @PostMapping("/{id}/forfeit")
    public ResponseEntity<Void> forfeit(@PathVariable Long id, @RequestParam Long userId) {
        battleService.forfeit(id, userId);
        return ResponseEntity.noContent().build();
    }

    /* ── Abandon (force-complete stuck battle) ── */

    @PostMapping("/{id}/abandon")
    public ResponseEntity<Void> abandonBattle(@PathVariable Long id, @RequestParam Long userId) {
        battleService.abandonBattle(id, userId);
        return ResponseEntity.noContent().build();
    }

    /* ── Battle History ── */

    @GetMapping("/history")
    public ResponseEntity<java.util.List<BattleHistoryDTO>> getBattleHistory(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(battleService.getBattleHistory(userId, page, size));
    }

    /* ═══════════════════════════════════════════════════════════
     * GROUP BATTLE - ROOM ENDPOINTS
     * ═══════════════════════════════════════════════════════════ */

    /** Create a new group room. */
    @PostMapping("/room")
    public ResponseEntity<RoomLobbyDTO> createRoom(@RequestParam Long userId,
                                                    @RequestBody CreateRoomRequest req) {
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
                                                  @RequestParam Long userId) {
        return ResponseEntity.ok(battleService.joinRoom(code, userId));
    }

    /** Leave a room. */
    @PostMapping("/room/{code}/leave")
    public ResponseEntity<RoomLobbyDTO> leaveRoom(@PathVariable String code,
                                                   @RequestParam Long userId) {
        RoomLobbyDTO lobby = battleService.leaveRoom(code, userId);
        return lobby != null ? ResponseEntity.ok(lobby) : ResponseEntity.noContent().build();
    }

    /** Creator kicks a player from the room. */
    @PostMapping("/room/{code}/kick/{targetUserId}")
    public ResponseEntity<RoomLobbyDTO> kickFromRoom(@PathVariable String code,
                                                      @RequestParam Long kickerId,
                                                      @PathVariable Long targetUserId) {
        return ResponseEntity.ok(battleService.kickFromRoom(code, kickerId, targetUserId));
    }

    /** Creator starts the group battle. */
    @PostMapping("/room/{code}/start")
    public ResponseEntity<RoomLobbyDTO> startGroupBattle(@PathVariable String code,
                                                          @RequestParam Long userId) {
        return ResponseEntity.ok(battleService.startGroupBattle(code, userId));
    }

    /** Get live group battle state (scoreboard). */
    @GetMapping("/{id}/group-state")
    public ResponseEntity<GroupBattleStateDTO> getGroupBattleState(@PathVariable Long id,
                                                                    @RequestParam Long userId) {
        return ResponseEntity.ok(battleService.getGroupBattleState(id, userId));
    }

    /** Get group battle result (final placement). */
    @GetMapping("/{id}/group-result")
    public ResponseEntity<GroupBattleResultDTO> getGroupBattleResult(@PathVariable Long id,
                                                                      @RequestParam Long userId) {
        return ResponseEntity.ok(battleService.getGroupBattleResult(id, userId));
    }

    /* ── Active Battle Check ── */

    @GetMapping("/active")
    public ResponseEntity<?> getActiveBattle(HttpServletRequest request) {
        Long userId = CurrentUser.resolve(request);
        if (userId == null) {
            // Return 401 if user cannot be resolved, but don't error.
            // It just means they are not logged in.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return battleService.checkForActiveBattle(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
