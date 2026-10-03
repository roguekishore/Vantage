package com.backend.springapp.gamification.battle;

import com.backend.springapp.gamification.GamificationService;
import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import com.backend.springapp.gamification.achievement.AchievementService;
import com.backend.springapp.gamification.coins.TransactionSource;
import com.backend.springapp.problem.Problem;
import com.backend.springapp.problem.ProblemRepository;
import com.backend.springapp.problem.Tag;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserProgressRepository;
import com.backend.springapp.user.UserRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Objects;
import com.backend.springapp.realtime.RealtimePublisher;

/**
 * Battle lobby, state, result, history and group-room reads/writes.
 * Matchmaking, judging and lifecycle (completion/forfeit/ELO/rewards) live in
 * {@link MatchmakingService}, {@link BattleJudgingService} and {@link BattleLifecycleService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BattleService {

    private final BattleRepository battleRepo;
    private final BattleParticipantRepository participantRepo;
    private final BattleProblemRepository battleProblemRepo;
    private final BattleSubmissionRepository submissionRepo;
    private final ProblemRepository problemRepo;
    private final UserRepository userRepo;
    private final UserProgressRepository progressRepo;
    private final GamificationService gamificationService;
    private final RealtimePublisher realtimePublisher;
    private final RestTemplate judgeRestTemplate;
    private final BattleViews battleViews;
    private final JudgeProblemIdResolver judgeIdResolver;
    @Value("${judge.base-url:http://localhost:9000}")
    private String judgeBaseUrl;
    @Value("${battle.customTimer1v1.enabled:true}")
    private boolean customTimer1v1Enabled = true;
    @Value("${battle.continueAfterFirstFinisher.enabled:true}")
    private boolean continueAfterFirstFinisherEnabled = true;

    private static final int MIN_1V1_DURATION_MINUTES = 10;
    private static final int MAX_1V1_DURATION_MINUTES = 180;
    private static final int MIN_GROUP_DURATION_MINUTES = 10;
    private static final int MAX_GROUP_DURATION_MINUTES = 180;
    private static final String ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final java.util.Random random = new java.util.Random();

    /** Look for the most recent WAITING or ACTIVE battle for a user. */
    public Optional<Battle> findRecentBattleForUser(Long userId) {
        // Get all battles in WAITING state, check if user is participant
        List<Battle> waitingBattles = battleRepo.findByState(BattleState.WAITING);
        for (Battle b : waitingBattles) {
            if (participantRepo.findByBattleIdAndUserId(b.getId(), userId).isPresent()) {
                return Optional.of(b);
            }
        }
        List<Battle> activeBattles = battleRepo.findByState(BattleState.ACTIVE);
        for (Battle b : activeBattles) {
            if (participantRepo.findByBattleIdAndUserId(b.getId(), userId).isPresent()) {
                return Optional.of(b);
            }
        }
        return Optional.empty();
    }

    /**
     * Look for the most recent WAITING/ACTIVE 1v1 battle for a user.
     * Group battles are intentionally excluded to avoid routing 1v1 UI
     * (queue/lobby/rejoin overlay) into group rooms.
     */
    public Optional<Battle> findRecentOneVsOneBattleForUser(Long userId) {
        return findRecentBattleForUser(userId)
                .filter(b -> b.getMode() == BattleMode.CASUAL_1V1 || b.getMode() == BattleMode.RANKED_1V1);
    }

    /** Look for a WAITING/ACTIVE group battle for a user. */
    public Optional<Battle> findRecentActiveGroupBattleForUser(Long userId) {
        return findRecentBattleForUser(userId)
                .filter(b -> b.getMode() == BattleMode.GROUP_FFA);
    }

    @Transactional(readOnly = true)
    public boolean hasActiveOrWaitingBattle(Long userId) {
        return findRecentBattleForUser(userId).isPresent();
    }

    @Transactional
    public Battle createDirectChallengeBattle(Long challengerId, Long challengeeId,
                                              BattleMode mode, Tag difficulty, int problemCount,
                                              Integer durationMinutes) {
        if (mode != BattleMode.CASUAL_1V1 && mode != BattleMode.RANKED_1V1) {
            throw new IllegalArgumentException("Friend challenge supports only 1v1 modes");
        }
        if (problemCount < 1 || problemCount > 3) {
            throw new IllegalArgumentException("problemCount must be between 1 and 3");
        }

        if (hasActiveOrWaitingBattle(challengerId) || hasActiveOrWaitingBattle(challengeeId)) {
            throw new IllegalStateException("One of the players is already in an active battle");
        }

        Battle battle = new Battle();
        battle.setMode(mode);
        battle.setDifficulty(difficulty);
        battle.setProblemCount(problemCount);
        battle.setDurationMinutes(resolveOneVsOneDurationMinutes(mode, problemCount, durationMinutes));
        battle.setState(BattleState.WAITING);
        battleRepo.saveAndFlush(battle);

        PlayerStats challengerStats = gamificationService.getOrCreateStats(challengerId);
        PlayerStats challengeeStats = gamificationService.getOrCreateStats(challengeeId);
        createParticipant(battle.getId(), challengerId, challengerStats.getBattleRating());
        createParticipant(battle.getId(), challengeeId, challengeeStats.getBattleRating());

        selectProblems(battle.getId(), difficulty, problemCount, List.of(challengerId, challengeeId));

        log.info("⚔️ Friend challenge battle {} created: {} vs {} (mode={}, diff={}, problems={})",
                battle.getId(), challengerId, challengeeId, mode, difficulty, problemCount);

        return battle;
    }

    public void createParticipant(Long battleId, Long userId, int ratingBefore) {
        BattleParticipant bp = new BattleParticipant();
        bp.setBattleId(battleId);
        bp.setUserId(userId);
        bp.setRatingBefore(ratingBefore);
        participantRepo.saveAndFlush(bp);
    }

    public void selectProblems(Long battleId, Tag difficulty, int count, List<Long> userIds) {
        // Get all problems of this difficulty that have an lcslug (needed for judge)
        List<Problem> candidates = problemRepo.findAll().stream()
                .filter(p -> p.getTag() == difficulty)
                .filter(p -> p.getLcslug() != null && !p.getLcslug().isBlank())
                .collect(Collectors.toList());

        // Prefer problems neither user has solved
        Set<Long> solvedByEither = new HashSet<>();
        for (Long uid : userIds) {
            progressRepo.findAllByUserId(uid).stream()
                    .filter(up -> up.getStatus().name().equals("SOLVED"))
                    .forEach(up -> solvedByEither.add(up.getProblem().getPid()));
        }

        List<Problem> fresh = candidates.stream()
                .filter(p -> !solvedByEither.contains(p.getPid()))
                .collect(Collectors.toList());

        // Use fresh problems first, fall back to all if not enough
        List<Problem> pool = fresh.size() >= count ? fresh : candidates;
        Collections.shuffle(pool);
        List<Problem> selected = pool.stream().limit(count).toList();

        for (int i = 0; i < selected.size(); i++) {
            Problem p = selected.get(i);
            BattleProblem bp = new BattleProblem();
            bp.setBattleId(battleId);
            bp.setProblemId(p.getPid());
            bp.setJudgeProblemId(resolveJudgeProblemId(p.getLcslug(), p));
            bp.setProblemIndex(i);
            battleProblemRepo.saveAndFlush(bp);
        }
    }

    /* ═══════════════════════════════════════════════════════════
     * LOBBY
     * ═══════════════════════════════════════════════════════════ */

    @Transactional(readOnly = true)
    public BattleLobbyDTO getBattle(Long battleId, Long userId) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found: " + battleId));

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        BattleParticipant me = participants.stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("You are not in this battle"));
        BattleParticipant opp = participants.stream()
                .filter(p -> !p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Opponent not found"));

        long lobbyTimeRemaining = 0;
        if (battle.getState() == BattleState.WAITING) {
            long elapsed = Duration.between(battle.getCreatedAt(), LocalDateTime.now()).toMillis();
            lobbyTimeRemaining = Math.max(0, 60_000 - elapsed);
        }

        return new BattleLobbyDTO(
                battle.getId(),
                battle.getMode().name(),
                battle.getDifficulty().name(),
                battle.getProblemCount(),
                battle.getDurationMinutes(),
                battle.getState().name(),
                toParticipantInfo(me),
                toParticipantInfo(opp),
                lobbyTimeRemaining
        );
    }

    private BattleLobbyDTO.ParticipantInfo toParticipantInfo(BattleParticipant bp) {
        String username = userRepo.findById(bp.getUserId())
                .map(User::getUsername).orElse("Unknown");
        PlayerStats stats = gamificationService.getOrCreateStats(bp.getUserId());
        return new BattleLobbyDTO.ParticipantInfo(
                bp.getUserId(),
                username,
                bp.getRatingBefore(),
                stats.getLevel(),
                bp.isReady(),
                bp.getLanguage()
        );
    }

    @Transactional
    public BattleLobbyDTO readyUp(Long battleId, Long userId, String language) {
        // Row lock first: both players ready up the instant they are matched. Without it each transaction reads the
        // participants before the other commits, sees "not everyone ready", and the battle never starts.
        Battle battle = battleRepo.findByIdForUpdate(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));

        if (battle.getState() != BattleState.WAITING) {
            throw new IllegalStateException("Battle is not in WAITING state");
        }

        BattleParticipant me = participantRepo.findByBattleIdAndUserId(battleId, userId)
                .orElseThrow(() -> new IllegalStateException("You are not in this battle"));

        me.setReady(true);
        me.setLanguage(language);
        participantRepo.saveAndFlush(me);

        // Check if BOTH are ready → start battle
        List<BattleParticipant> all = participantRepo.findByBattleId(battleId);
        boolean allReady = all.stream().allMatch(BattleParticipant::isReady);
        if (allReady) {
            battle.setState(BattleState.ACTIVE);
            battle.setStartedAt(LocalDateTime.now());
            battleRepo.saveAndFlush(battle);
            log.info("⚔️ Battle {} is now ACTIVE!", battleId);
        }

        BattleLobbyDTO lobbyDTO = getBattle(battleId, userId);

        // ── WebSocket: broadcast lobby update to each player (perspective-specific) ──
        List<BattleParticipant> allParticipants = participantRepo.findByBattleId(battleId);
        for (BattleParticipant p : allParticipants) {
            try {
                BattleLobbyDTO perUserLobby = getBattle(battleId, p.getUserId());
                realtimePublisher.toTopic("/topic/battle/" + battleId + "/lobby/" + p.getUserId(), perUserLobby);
            } catch (Exception e) {
                log.warn("Failed to broadcast lobby to user {}: {}", p.getUserId(), e.getMessage());
            }
        }

        return lobbyDTO;
    }

    /* ═══════════════════════════════════════════════════════════
     * BATTLE STATE (polling during active battle)
     * ═══════════════════════════════════════════════════════════ */

    @Transactional(readOnly = true)
    public BattleStateDTO getBattleState(Long battleId, Long userId) {
        return battleViews.getBattleState(battleId, userId);
    }

    public int resolveOneVsOneDurationMinutes(BattleMode mode, int problemCount, Integer requestedDurationMinutes) {
        if (mode != BattleMode.CASUAL_1V1 && mode != BattleMode.RANKED_1V1) {
            throw new IllegalArgumentException("Only 1v1 modes support custom duration");
        }
        if (problemCount < 1 || problemCount > 3) {
            throw new IllegalArgumentException("problemCount must be between 1 and 3");
        }

        int fallback = problemCount * 15;
        if (!customTimer1v1Enabled) {
            return fallback;
        }
        int candidate = requestedDurationMinutes == null ? fallback : requestedDurationMinutes;

        if (candidate < MIN_1V1_DURATION_MINUTES || candidate > MAX_1V1_DURATION_MINUTES) {
            throw new IllegalArgumentException("1v1 duration must be between " + MIN_1V1_DURATION_MINUTES + " and " + MAX_1V1_DURATION_MINUTES + " minutes");
        }
        return candidate;
    }

    private int normalizeGroupDurationMinutes(int problemCount, int requestedDurationMinutes) {
        int fallback = problemCount * 15;
        int candidate = requestedDurationMinutes > 0 ? requestedDurationMinutes : fallback;
        if (candidate < MIN_GROUP_DURATION_MINUTES || candidate > MAX_GROUP_DURATION_MINUTES) {
            throw new IllegalArgumentException("Group duration must be between " + MIN_GROUP_DURATION_MINUTES + " and " + MAX_GROUP_DURATION_MINUTES + " minutes");
        }
        return candidate;
    }

    /* ═══════════════════════════════════════════════════════════
     * BATTLE RESULT
     * ═══════════════════════════════════════════════════════════ */

    @Transactional(readOnly = true)
    public BattleResultDTO getBattleResult(Long battleId, Long userId) {
        return battleViews.getBattleResult(battleId, userId);
    }

    public Map<String, Object> getBattleFeatureFlags() {
        return Map.of(
                "customTimer1v1Enabled", customTimer1v1Enabled,
                "continueAfterFirstFinisherEnabled", continueAfterFirstFinisherEnabled,
                "min1v1Duration", MIN_1V1_DURATION_MINUTES,
                "max1v1Duration", MAX_1V1_DURATION_MINUTES,
                "minGroupDuration", MIN_GROUP_DURATION_MINUTES,
                "maxGroupDuration", MAX_GROUP_DURATION_MINUTES
        );
    }

    /* ═══════════════════════════════════════════════════════════
     * BATTLE HISTORY
     * ═══════════════════════════════════════════════════════════ */

    @Transactional(readOnly = true)
    public List<BattleHistoryDTO> getBattleHistory(Long userId, int page, int size) {
        List<BattleParticipant> myParticipations = participantRepo.findByUserIdOrderByBattleIdDesc(userId);

        // Paginate manually (simple offset/limit on small result set)
        int start = page * size;
        if (start >= myParticipations.size()) return List.of();
        int end = Math.min(start + size, myParticipations.size());
        List<BattleParticipant> slice = myParticipations.subList(start, end);

        List<BattleHistoryDTO> history = new ArrayList<>();
        for (BattleParticipant me : slice) {
            Battle battle = battleRepo.findById(me.getBattleId()).orElse(null);
            if (battle == null) continue;

            // Group battles are shown in a separate endpoint
            if (battle.getMode() == BattleMode.GROUP_FFA) continue;

            // Find opponent
            List<BattleParticipant> all = participantRepo.findByBattleId(battle.getId());
            BattleParticipant opp = all.stream()
                    .filter(p -> !p.getUserId().equals(userId)).findFirst().orElse(null);
            if (opp == null) continue;

            String oppUsername = userRepo.findById(opp.getUserId())
                    .map(User::getUsername).orElse("Unknown");

            String outcome;
            if (battle.getState() == BattleState.CANCELLED) {
                outcome = "CANCELLED";
            } else if (battle.getState() != BattleState.COMPLETED) {
                outcome = "IN_PROGRESS";
            } else if (battle.getWinnerId() == null) {
                outcome = "DRAW";
            } else if (battle.getWinnerId().equals(userId)) {
                outcome = "WIN";
            } else {
                outcome = "LOSS";
            }

            int ratingChange = 0;
            if (me.getRatingAfter() != null) {
                ratingChange = me.getRatingAfter() - me.getRatingBefore();
            }

            history.add(new BattleHistoryDTO(
                    battle.getId(),
                    battle.getMode().name(),
                    battle.getState().name(),
                    outcome,
                    battle.getDifficulty().name(),
                    battle.getProblemCount(),
                    battle.getDurationMinutes(),
                    opp.getUserId(),
                    oppUsername,
                    me.getProblemsSolved(),
                    opp.getProblemsSolved(),
                    me.getTotalSubmissions(),
                    me.getTotalSolveTimeMs(),
                    me.getRatingBefore(),
                    me.getRatingAfter(),
                    ratingChange,
                    battle.getCreatedAt(),
                    battle.getCompletedAt()
            ));
        }
        return history;
    }

    /* ═══════════════════════════════════════════════════════════
     * GROUP BATTLE - ROOM MANAGEMENT
     * ═══════════════════════════════════════════════════════════ */

    @Transactional
    public RoomLobbyDTO createRoom(Long userId, CreateRoomRequest req) {
        if (hasActiveOrWaitingBattle(userId)) {
            throw new IllegalStateException("You are already in an active battle");
        }

        if (req.problemCount() < 1 || req.problemCount() > 3) {
            throw new IllegalArgumentException("problemCount must be between 1 and 3");
        }

        if (req.maxPlayers() < 3 || req.maxPlayers() > 8) {
            throw new IllegalArgumentException("Group battles require 3–8 players");
        }
        BattleMode mode;
        try {
            mode = BattleMode.valueOf(req.mode());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid mode: " + req.mode());
        }
        if (mode != BattleMode.GROUP_FFA) {
            throw new IllegalArgumentException("Only GROUP_FFA is supported for room creation");
        }
        Tag difficulty;
        try {
            difficulty = Tag.valueOf(req.difficulty());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid difficulty: " + req.difficulty());
        }

        // Generate unique 6-char room code
        String roomCode;
        do {
            roomCode = generateRoomCode();
        } while (battleRepo.findByRoomCode(roomCode).isPresent());

        Battle battle = new Battle();
        battle.setMode(mode);
        battle.setDifficulty(difficulty);
        battle.setProblemCount(req.problemCount());
        battle.setMaxPlayers(req.maxPlayers());
        battle.setDurationMinutes(normalizeGroupDurationMinutes(req.problemCount(), req.durationMinutes()));
        battle.setState(BattleState.WAITING);
        battle.setRoomCode(roomCode);
        battle.setCreatorId(userId);
        battleRepo.saveAndFlush(battle);

        // Add creator as first participant
        PlayerStats stats = gamificationService.getOrCreateStats(userId);
        createParticipant(battle.getId(), userId, stats.getBattleRating());

        log.info("🏟️ Room {} created by user {} (mode={}, diff={}, max={})",
                roomCode, userId, mode, difficulty, req.maxPlayers());
        return getRoomLobby(battle.getId());
    }

    @Transactional(readOnly = true)
    public RoomLobbyDTO getRoomByCode(String roomCode) {
        Battle battle = battleRepo.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new NoSuchElementException("Room not found: " + roomCode));
        return getRoomLobby(battle.getId());
    }

    @Transactional
    public RoomLobbyDTO joinRoom(String roomCode, Long userId) {
        Battle battle = battleRepo.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new NoSuchElementException("Room not found: " + roomCode));

        // Allow rejoin if already a participant in THIS battle
        List<BattleParticipant> participants = participantRepo.findByBattleId(battle.getId());
        boolean alreadyIn = participants.stream().anyMatch(p -> p.getUserId().equals(userId));
        if (alreadyIn) {
            return getRoomLobby(battle.getId());
        }

        // Block joining if user is in a DIFFERENT active battle
        if (hasActiveOrWaitingBattle(userId)) {
            throw new IllegalStateException("You are already in an active battle");
        }

        if (battle.getState() != BattleState.WAITING) {
            throw new IllegalStateException("Battle has already started or ended");
        }

        if (participants.size() >= battle.getMaxPlayers()) {
            throw new IllegalStateException("Room is full (" + battle.getMaxPlayers() + "/" + battle.getMaxPlayers() + ")");
        }

        PlayerStats stats = gamificationService.getOrCreateStats(userId);
        createParticipant(battle.getId(), userId, stats.getBattleRating());

        log.info("🏟️ User {} joined room {} (battle={})", userId, roomCode, battle.getId());
        RoomLobbyDTO lobby = getRoomLobby(battle.getId());
        realtimePublisher.toTopic("/topic/battle/" + battle.getId() + "/room", lobby);
        return lobby;
    }

    @Transactional
    public RoomLobbyDTO leaveRoom(String roomCode, Long userId) {
        Battle battle = battleRepo.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new NoSuchElementException("Room not found: " + roomCode));

        // Idempotent close path for creator: if room is already closed, treat as no-op.
        if (userId.equals(battle.getCreatorId())
                && (battle.getState() == BattleState.CANCELLED || battle.getState() == BattleState.COMPLETED)) {
            return null;
        }

        if (battle.getState() != BattleState.WAITING) {
            throw new IllegalStateException("Cannot leave an active battle");
        }

        BattleParticipant me = participantRepo.findByBattleIdAndUserId(battle.getId(), userId).orElse(null);

        // Creator leaving should always close the room for everyone.
        if (userId.equals(battle.getCreatorId())) {
            if (me != null) {
                participantRepo.delete(me);
                participantRepo.flush();
            }
            closeRoomAsCreatorLeft(battle, roomCode);
            return null;
        }

        if (me == null) {
            throw new IllegalStateException("You are not in this room");
        }

        participantRepo.delete(me);
        participantRepo.flush();

        RoomLobbyDTO lobby = getRoomLobby(battle.getId());
        realtimePublisher.toTopic("/topic/battle/" + battle.getId() + "/room", lobby);
        return lobby;
    }

    private void closeRoomAsCreatorLeft(Battle battle, String roomCode) {
        // Remove any remaining participants so nobody is considered in this waiting room anymore.
        List<BattleParticipant> remaining = participantRepo.findByBattleId(battle.getId());
        if (!remaining.isEmpty()) {
            participantRepo.deleteAll(remaining);
            participantRepo.flush();
        }

        battle.setState(BattleState.CANCELLED);
        battle.setCompletedAt(LocalDateTime.now());
        battleRepo.saveAndFlush(battle);

        realtimePublisher.toTopic("/topic/battle/" + battle.getId() + "/room",
                Map.of(
                        "state", "CANCELLED",
                        "battleId", battle.getId(),
                        "message", "Room closed: creator left"
                ));

        log.info("🏟️ Room {} closed by creator {}", roomCode, battle.getCreatorId());
    }

    @Transactional
    public RoomLobbyDTO kickFromRoom(String roomCode, Long kickerId, Long targetUserId) {
        Battle battle = battleRepo.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new NoSuchElementException("Room not found: " + roomCode));

        if (!kickerId.equals(battle.getCreatorId())) {
            throw new IllegalStateException("Only the room creator can kick players");
        }
        if (battle.getState() != BattleState.WAITING) {
            throw new IllegalStateException("Cannot kick from an active battle");
        }

        BattleParticipant target = participantRepo.findByBattleIdAndUserId(battle.getId(), targetUserId)
                .orElseThrow(() -> new IllegalStateException("Target user is not in this room"));
        participantRepo.delete(target);
        participantRepo.flush();

        realtimePublisher.toTopic("/topic/battle/" + battle.getId() + "/kicked/" + targetUserId,
                Map.of("kicked", true, "roomCode", roomCode));

        RoomLobbyDTO lobby = getRoomLobby(battle.getId());
        realtimePublisher.toTopic("/topic/battle/" + battle.getId() + "/room", lobby);
        return lobby;
    }

    @Transactional
    public RoomLobbyDTO startGroupBattle(String roomCode, Long userId) {
        Battle battle = battleRepo.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new NoSuchElementException("Room not found: " + roomCode));

        if (!userId.equals(battle.getCreatorId())) {
            throw new IllegalStateException("Only the room creator can start the battle");
        }

        List<BattleParticipant> participants = participantRepo.findByBattleId(battle.getId());
        if (participants.size() < 3) {
            throw new IllegalStateException("Need at least 3 players to start a group battle");
        }
        if (battle.getState() != BattleState.WAITING) {
            throw new IllegalStateException("Battle has already started");
        }

        List<Long> userIds = participants.stream().map(BattleParticipant::getUserId).toList();
        selectProblems(battle.getId(), battle.getDifficulty(), battle.getProblemCount(), userIds);

        battle.setState(BattleState.ACTIVE);
        battle.setStartedAt(LocalDateTime.now());
        battleRepo.saveAndFlush(battle);

        log.info("🏟️ Group battle {} STARTED (room={}, players={})",
                battle.getId(), roomCode, participants.size());

        // Notify all players - broadcast "started" signal + initial group state
        realtimePublisher.toTopic("/topic/battle/" + battle.getId() + "/started",
                Map.of("battleId", battle.getId(), "state", "ACTIVE"));
        for (BattleParticipant p : participants) {
            try {
                GroupBattleStateDTO stateDTO = getGroupBattleState(battle.getId(), p.getUserId());
                realtimePublisher.toTopic("/topic/battle/" + battle.getId() + "/group-state/" + p.getUserId(), stateDTO);
            } catch (Exception e) {
                log.warn("Failed to broadcast start to user {}: {}", p.getUserId(), e.getMessage());
            }
        }

        return getRoomLobby(battle.getId());
    }

    @Transactional(readOnly = true)
    public GroupBattleStateDTO getGroupBattleState(Long battleId, Long userId) {
        return battleViews.getGroupBattleState(battleId, userId);
    }

    @Transactional
    public GroupBattleResultDTO getGroupBattleResult(Long battleId, Long requestingUserId) {
        return battleViews.getGroupBattleResult(battleId, requestingUserId);
    }

    public String resolveJudgeProblemId(String currentJudgeProblemId, Problem springProblem) {
        return judgeIdResolver.resolveJudgeProblemId(currentJudgeProblemId, springProblem);
    }

    private String getJudgeSubmitUrl() {
        return sanitizeJudgeBaseUrl() + "/api/submit";
    }

    private String getJudgeProblemsUrl() {
        return sanitizeJudgeBaseUrl() + "/api/problems";
    }

    private String sanitizeJudgeBaseUrl() {
        String base = judgeBaseUrl == null ? "" : judgeBaseUrl.trim();
        if (base.endsWith("/")) {
            return base.substring(0, base.length() - 1);
        }
        return base;
    }

    record JudgeProblemSummary(String id, String title) {}

    /* ═══════════════════════════════════════════════════════════
     * GROUP BATTLE - HELPERS
     * ═══════════════════════════════════════════════════════════ */

    private String generateRoomCode() {
        StringBuilder code = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            code.append(ROOM_CODE_CHARS.charAt(random.nextInt(ROOM_CODE_CHARS.length())));
        }
        return code.toString();
    }

    private RoomLobbyDTO getRoomLobby(Long battleId) {
        Battle battle = battleRepo.findById(battleId).orElseThrow();
        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        List<RoomLobbyDTO.ParticipantInfo> infos = participants.stream().map(p -> {
            String username = userRepo.findById(p.getUserId()).map(User::getUsername).orElse("Unknown");
            PlayerStats stats = gamificationService.getOrCreateStats(p.getUserId());
            return new RoomLobbyDTO.ParticipantInfo(
                    p.getUserId(), username, p.getRatingBefore(), stats.getLevel());
        }).toList();
        return new RoomLobbyDTO(
                battle.getId(), battle.getRoomCode(), battle.getMode().name(),
                battle.getDifficulty().name(), battle.getProblemCount(),
                battle.getMaxPlayers(), battle.getDurationMinutes(),
                battle.getState().name(), battle.getCreatorId(), infos);
    }

    public Optional<ActiveBattleDTO> checkForActiveBattle(Long userId) {
        return participantRepo.findByUserIdOrderByBattleIdDesc(userId).stream()
                .map(p -> battleRepo.findById(p.getBattleId()).orElse(null))
                .filter(Objects::nonNull)
                .filter(b -> b.getState() == BattleState.WAITING || b.getState() == BattleState.ACTIVE)
                .filter(b -> {
                    // For group battles, skip if this user has already forfeited
                    if (b.getMode() == BattleMode.GROUP_FFA) {
                        var bp = participantRepo.findByBattleIdAndUserId(b.getId(), userId);
                        if (bp.isPresent() && bp.get().isForfeited()) return false;
                    }
                    return true;
                })
                .findFirst()
                .map(b -> new ActiveBattleDTO(b.getId(), b.getState().name(),
                        b.getMode().name(), b.getRoomCode()));
    }
}
