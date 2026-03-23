package com.backend.springapp.friend.challenge;

import com.backend.springapp.friend.FriendshipRepository;
import com.backend.springapp.friend.challenge.dto.*;
import com.backend.springapp.gamification.battle.Battle;
import com.backend.springapp.gamification.battle.BattleMode;
import com.backend.springapp.gamification.battle.BattleRepository;
import com.backend.springapp.gamification.battle.BattleState;
import com.backend.springapp.gamification.battle.BattleService;
import com.backend.springapp.problem.Tag;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class FriendChallengeService {

    private static final int CHALLENGE_TTL_MINUTES = 5;

    private final FriendChallengeRepository challengeRepository;
    private final FriendChallengeMuteRepository muteRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final BattleRepository battleRepository;
    private final BattleService battleService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public FriendChallengeCreateResponseDTO createChallenge(Long challengerId, FriendChallengeCreateDTO req) {
        boolean isGroupInvite = req.mode() == BattleMode.GROUP_FFA;
        if (!isGroupInvite && req.mode() != BattleMode.CASUAL_1V1 && req.mode() != BattleMode.RANKED_1V1) {
            throw new IllegalArgumentException("Unsupported challenge mode");
        }
        if (req.difficulty() == Tag.BASIC) {
            throw new IllegalArgumentException("Difficulty BASIC is not supported for battle challenges");
        }
        if (challengerId.equals(req.targetUserId())) {
            throw new IllegalArgumentException("You cannot challenge yourself");
        }

        User challenger = userRepository.findById(challengerId)
                .orElseThrow(() -> new NoSuchElementException("Challenger not found"));
        User challengee = userRepository.findById(req.targetUserId())
                .orElseThrow(() -> new NoSuchElementException("Target user not found"));

        long a = Math.min(challengerId, req.targetUserId());
        long b = Math.max(challengerId, req.targetUserId());
        if (!friendshipRepository.existsByUserAIdAndUserBId(a, b)) {
            throw new IllegalStateException("You can challenge only users in your friend list");
        }

        Battle roomBattle = null;
        if (isGroupInvite) {
            String roomCode = req.roomCode() != null ? req.roomCode().trim().toUpperCase() : "";
            if (roomCode.length() != 6) {
                throw new IllegalArgumentException("roomCode is required for group invites");
            }

            roomBattle = battleRepository.findByRoomCode(roomCode)
                    .orElseThrow(() -> new NoSuchElementException("Room not found: " + roomCode));

            if (roomBattle.getMode() != BattleMode.GROUP_FFA) {
                throw new IllegalArgumentException("Room is not a group battle");
            }
            if (roomBattle.getState() != BattleState.WAITING) {
                throw new IllegalStateException("Room is no longer accepting invites");
            }
            if (!challengerId.equals(roomBattle.getCreatorId())) {
                throw new IllegalStateException("Only the room creator can send room invites");
            }
        }

        if (isMuted(req.targetUserId())) {
            LocalDateTime mutedUntil = muteRepository.findByUserId(req.targetUserId()).map(FriendChallengeMute::getMutedUntil).orElse(null);
            String msg = "Challenge closed: friend has muted match requests"
                    + (mutedUntil != null ? " until " + mutedUntil.truncatedTo(ChronoUnit.MINUTES) : "");
            broadcast("/topic/friends/" + challengerId + "/challenges", Map.of(
                    "type", "FRIEND_MATCH_REQUEST_CLOSED",
                    "message", msg,
                    "reason", "MUTED"
            ));
            return new FriendChallengeCreateResponseDTO("MUTED", msg, null, mutedUntil);
        }

        FriendChallenge challenge = new FriendChallenge();
        challenge.setChallengerId(challengerId);
        challenge.setChallengeeId(req.targetUserId());
        challenge.setMode(req.mode());
        challenge.setDifficulty(req.difficulty());
        challenge.setProblemCount(req.problemCount());
        challenge.setStatus(FriendChallengeStatus.PENDING);
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(CHALLENGE_TTL_MINUTES));
        if (isGroupInvite && roomBattle != null) {
            challenge.setBattleId(roomBattle.getId());
            challenge.setRoomCode(roomBattle.getRoomCode());
        }
        challenge = challengeRepository.saveAndFlush(challenge);

        FriendChallengeDTO dto = toDto(challenge, challenger, challengee);

        broadcast("/topic/friends/" + req.targetUserId() + "/challenges", Map.of(
                "type", "FRIEND_MATCH_REQUEST_RECEIVED",
            "message", isGroupInvite
                ? challenger.getUsername() + " invited you to group room " + challenge.getRoomCode()
                : challenger.getUsername() + " challenged you to a match",
                "challenge", dto
        ));
        broadcast("/topic/friends/" + challengerId + "/challenges", Map.of(
                "type", "FRIEND_MATCH_REQUEST_SENT",
                "message", "Challenge sent to " + challengee.getUsername(),
                "challenge", dto
        ));

        return new FriendChallengeCreateResponseDTO("SENT", "Challenge sent", dto, null);
    }

    @Transactional(readOnly = true)
    public List<FriendChallengeDTO> getIncomingChallenges(Long userId) {
        return challengeRepository.findByChallengeeIdAndStatusOrderByCreatedAtDesc(userId, FriendChallengeStatus.PENDING)
                .stream()
                .filter(c -> c.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public FriendChallengeDTO acceptChallenge(Long userId, Long challengeId) {
        FriendChallenge challenge = challengeRepository.findByIdAndChallengeeId(challengeId, userId)
                .orElseThrow(() -> new NoSuchElementException("Challenge not found"));
        ensurePendingAndNotExpired(challenge);

        if (challenge.getMode() == BattleMode.GROUP_FFA) {
            if (challenge.getRoomCode() == null || challenge.getRoomCode().isBlank()) {
            throw new IllegalStateException("Invite has no room code");
            }

            battleService.joinRoom(challenge.getRoomCode(), userId);

            challenge.setStatus(FriendChallengeStatus.ACCEPTED);
            challenge.setRespondedAt(LocalDateTime.now());
            challenge.setCloseReason("Accepted");
            challengeRepository.saveAndFlush(challenge);

            FriendChallengeDTO dto = toDto(challenge);
            broadcast("/topic/friends/" + challenge.getChallengerId() + "/challenges", Map.of(
                "type", "FRIEND_MATCH_REQUEST_ACCEPTED",
                "message", "Your friend joined room " + challenge.getRoomCode(),
                "challenge", dto,
                "battleId", challenge.getBattleId(),
                "roomCode", challenge.getRoomCode()
            ));
            broadcast("/topic/friends/" + challenge.getChallengeeId() + "/challenges", Map.of(
                "type", "FRIEND_MATCH_REQUEST_ACCEPTED",
                "message", "Joined room " + challenge.getRoomCode(),
                "challenge", dto,
                "battleId", challenge.getBattleId(),
                "roomCode", challenge.getRoomCode()
            ));

            return dto;
        }

        if (battleService.hasActiveOrWaitingBattle(challenge.getChallengerId()) ||
                battleService.hasActiveOrWaitingBattle(challenge.getChallengeeId())) {
            challenge.setStatus(FriendChallengeStatus.CANCELLED);
            challenge.setRespondedAt(LocalDateTime.now());
            challenge.setCloseReason("One player is already in another battle");
            challengeRepository.saveAndFlush(challenge);
            notifyClosed(challenge, "ALREADY_IN_BATTLE", challenge.getCloseReason());
            throw new IllegalStateException(challenge.getCloseReason());
        }

        Battle battle = battleService.createDirectChallengeBattle(
                challenge.getChallengerId(),
                challenge.getChallengeeId(),
                challenge.getMode(),
                challenge.getDifficulty(),
                challenge.getProblemCount()
        );

        challenge.setStatus(FriendChallengeStatus.ACCEPTED);
        challenge.setRespondedAt(LocalDateTime.now());
        challenge.setBattleId(battle.getId());
        challenge.setCloseReason("Accepted");
        challengeRepository.saveAndFlush(challenge);

        FriendChallengeDTO dto = toDto(challenge);
        broadcast("/topic/friends/" + challenge.getChallengerId() + "/challenges", Map.of(
                "type", "FRIEND_MATCH_REQUEST_ACCEPTED",
                "message", "Your friend accepted the challenge",
                "challenge", dto,
                "battleId", battle.getId()
        ));
        broadcast("/topic/friends/" + challenge.getChallengeeId() + "/challenges", Map.of(
                "type", "FRIEND_MATCH_REQUEST_ACCEPTED",
                "message", "Challenge accepted. Battle lobby is ready",
                "challenge", dto,
                "battleId", battle.getId()
        ));

        return dto;
    }

    @Transactional
    public FriendChallengeDTO rejectChallenge(Long userId, Long challengeId) {
        FriendChallenge challenge = challengeRepository.findByIdAndChallengeeId(challengeId, userId)
                .orElseThrow(() -> new NoSuchElementException("Challenge not found"));
        ensurePendingAndNotExpired(challenge);

        challenge.setStatus(FriendChallengeStatus.REJECTED);
        challenge.setRespondedAt(LocalDateTime.now());
        challenge.setCloseReason("Rejected by recipient");
        challengeRepository.saveAndFlush(challenge);
        notifyClosed(challenge, "REJECTED", "Challenge was rejected");
        return toDto(challenge);
    }

    @Transactional
    public FriendChallengeDTO cancelChallenge(Long userId, Long challengeId) {
        FriendChallenge challenge = challengeRepository.findByIdAndChallengerId(challengeId, userId)
                .orElseThrow(() -> new NoSuchElementException("Challenge not found"));

        if (challenge.getStatus() != FriendChallengeStatus.PENDING) {
            throw new IllegalStateException("Challenge is already closed");
        }

        challenge.setStatus(FriendChallengeStatus.CANCELLED);
        challenge.setRespondedAt(LocalDateTime.now());
        challenge.setCloseReason("Cancelled by requester");
        challengeRepository.saveAndFlush(challenge);
        notifyClosed(challenge, "CANCELLED", "Challenge request has been closed by requester");
        return toDto(challenge);
    }

    @Transactional
    public ChallengeMuteStatusDTO muteChallenges(Long userId, int minutes) {
        int safeMinutes = Math.max(1, Math.min(minutes, 1440));
        LocalDateTime until = LocalDateTime.now().plusMinutes(safeMinutes);

        FriendChallengeMute mute = muteRepository.findByUserId(userId).orElseGet(FriendChallengeMute::new);
        mute.setUserId(userId);
        mute.setMutedUntil(until);
        muteRepository.saveAndFlush(mute);

        String msg = "Match requests muted until " + until.truncatedTo(ChronoUnit.MINUTES);
        broadcast("/topic/friends/" + userId + "/challenges", Map.of(
                "type", "FRIEND_MATCH_REQUEST_MUTE_SET",
                "message", msg,
                "mutedUntil", until
        ));

        return new ChallengeMuteStatusDTO(true, until);
    }

    @Transactional(readOnly = true)
    public ChallengeMuteStatusDTO getMuteStatus(Long userId) {
        return muteRepository.findByUserId(userId)
                .filter(m -> m.getMutedUntil().isAfter(LocalDateTime.now()))
                .map(m -> new ChallengeMuteStatusDTO(true, m.getMutedUntil()))
                .orElse(new ChallengeMuteStatusDTO(false, null));
    }

    @Transactional
    public ChallengeMuteStatusDTO clearMute(Long userId) {
        muteRepository.deleteByUserId(userId);

        broadcast("/topic/friends/" + userId + "/challenges", Map.of(
                "type", "FRIEND_MATCH_REQUEST_MUTE_CLEARED",
                "message", "Do Not Disturb disabled"
        ));

        return new ChallengeMuteStatusDTO(false, null);
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void expireChallenges() {
        List<FriendChallenge> expired = challengeRepository
                .findByStatusAndExpiresAtBefore(FriendChallengeStatus.PENDING, LocalDateTime.now());
        for (FriendChallenge challenge : expired) {
            challenge.setStatus(FriendChallengeStatus.EXPIRED);
            challenge.setRespondedAt(LocalDateTime.now());
            challenge.setCloseReason("Expired after 5 minutes");
            challengeRepository.save(challenge);
            notifyClosed(challenge, "EXPIRED", "Challenge request has been closed (timeout)");
        }
        if (!expired.isEmpty()) {
            challengeRepository.flush();
            log.info("Expired {} pending friend challenges", expired.size());
        }
    }

    private void ensurePendingAndNotExpired(FriendChallenge challenge) {
        if (challenge.getStatus() != FriendChallengeStatus.PENDING) {
            throw new IllegalStateException("Challenge is already closed");
        }
        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            challenge.setStatus(FriendChallengeStatus.EXPIRED);
            challenge.setRespondedAt(LocalDateTime.now());
            challenge.setCloseReason("Expired after 5 minutes");
            challengeRepository.saveAndFlush(challenge);
            notifyClosed(challenge, "EXPIRED", "Challenge request has been closed (timeout)");
            throw new IllegalStateException("Challenge has expired");
        }
    }

    private boolean isMuted(Long userId) {
        return muteRepository.findByUserId(userId)
                .map(m -> m.getMutedUntil().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    private FriendChallengeDTO toDto(FriendChallenge c) {
        User challenger = userRepository.findById(c.getChallengerId()).orElse(null);
        User challengee = userRepository.findById(c.getChallengeeId()).orElse(null);
        return toDto(c, challenger, challengee);
    }

    private FriendChallengeDTO toDto(FriendChallenge c, User challenger, User challengee) {
        return new FriendChallengeDTO(
                c.getId(),
                c.getChallengerId(), challenger != null ? challenger.getUsername() : "Unknown",
                c.getChallengeeId(), challengee != null ? challengee.getUsername() : "Unknown",
                c.getMode().name(),
                c.getDifficulty().name(),
                c.getProblemCount(),
                c.getStatus().name(),
                c.getBattleId(),
            c.getRoomCode(),
                c.getCloseReason(),
                c.getCreatedAt(),
                c.getExpiresAt(),
                c.getRespondedAt()
        );
    }

    private void notifyClosed(FriendChallenge challenge, String reason, String message) {
        Map<String, Object> payload = Map.of(
                "type", "FRIEND_MATCH_REQUEST_CLOSED",
                "reason", reason,
                "message", message,
                "challenge", toDto(challenge)
        );
        broadcast("/topic/friends/" + challenge.getChallengerId() + "/challenges", payload);
        broadcast("/topic/friends/" + challenge.getChallengeeId() + "/challenges", payload);
    }

    private void broadcast(String destination, Object payload) {
        try {
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception ignored) {
            // no-op
        }
    }
}
