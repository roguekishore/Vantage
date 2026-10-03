package com.backend.springapp.gamification.battle;

import com.backend.springapp.problem.Problem;
import com.backend.springapp.problem.ProblemRepository;
import com.backend.springapp.user.User;
import com.backend.springapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Plain (non-transactional) read/DTO assembly for battle state and results.
 * Deliberately NOT @Transactional: realtime broadcast blocks call these inside
 * try/catch within an outer transaction, and a proxy transaction interceptor
 * would mark that outer transaction rollback-only if one threw. BattleService's
 * public read methods delegate here and keep their own transaction for controllers.
 */
@Component
@RequiredArgsConstructor
public class BattleViews {

    private final BattleRepository battleRepo;
    private final BattleParticipantRepository participantRepo;
    private final BattleProblemRepository battleProblemRepo;
    private final BattleSubmissionRepository submissionRepo;
    private final ProblemRepository problemRepo;
    private final UserRepository userRepo;
    private final JudgeProblemIdResolver judgeIdResolver;

    public BattleStateDTO getBattleState(Long battleId, Long userId) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        BattleParticipant me = participants.stream()
                .filter(p -> p.getUserId().equals(userId)).findFirst()
                .orElseThrow(() -> new IllegalStateException("Not in this battle"));
        BattleParticipant opp = participants.stream()
                .filter(p -> !p.getUserId().equals(userId)).findFirst()
                .orElseThrow();

        long timeRemainingMs = 0;
        if (battle.getState() == BattleState.ACTIVE && battle.getStartedAt() != null) {
            long elapsed = Duration.between(battle.getStartedAt(), LocalDateTime.now()).toMillis();
            long totalMs = (long) battle.getDurationMinutes() * 60_000;
            timeRemainingMs = Math.max(0, totalMs - elapsed);
        }

        // Build problem info
        List<BattleProblem> battleProblems = battleProblemRepo.findByBattleIdOrderByProblemIndex(battleId);
        List<BattleStateDTO.ProblemInfo> problemInfos = battleProblems.stream().map(bp -> {
            Problem p = problemRepo.findById(bp.getProblemId()).orElse(null);
            String resolvedJudgeId = judgeIdResolver.resolveJudgeProblemId(bp.getJudgeProblemId(), p);
            boolean solved = submissionRepo.hasAcceptedSubmission(battleId, userId, bp.getProblemIndex());
            return new BattleStateDTO.ProblemInfo(
                    bp.getProblemIndex(),
                    p != null ? p.getTitle() : "Unknown",
                    p != null ? p.getDescription() : "",
                    "", // examples - frontend fetches from judge
                    "", // constraints
                resolvedJudgeId,
                    solved
            );
        }).toList();

        return new BattleStateDTO(
                battleId,
                battle.getState().name(),
                timeRemainingMs,
                new BattleStateDTO.ProgressInfo(me.getProblemsSolved(), me.getTotalSubmissions()),
                new BattleStateDTO.ProgressInfo(opp.getProblemsSolved(), opp.getTotalSubmissions()),
            problemInfos,
            BattleLifecycleService.determineWinner(me, opp),
            BattleLifecycleService.determineLeaderReason(me, opp)
        );
    }

    public BattleResultDTO getBattleResult(Long battleId, Long userId) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));

        boolean cancelled = battle.getState() == BattleState.CANCELLED;
        if (battle.getState() != BattleState.COMPLETED && !cancelled) {
            throw new IllegalStateException("Battle not yet completed");
        }

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        BattleParticipant me = participants.stream()
                .filter(p -> p.getUserId().equals(userId)).findFirst()
                .orElseThrow(() -> new IllegalStateException("Not in this battle"));
        BattleParticipant opp = participants.stream()
                .filter(p -> !p.getUserId().equals(userId)).findFirst()
                .orElse(null);

        if (cancelled) {
            // 200 with state=CANCELLED (B1): no winner, no rewards, no rating change.
            return new BattleResultDTO(
                    battleId, battle.getMode().name(), battle.getProblemCount(),
                    "CANCELLED", null,
                    toResultStats(me), opp != null ? toResultStats(opp) : null,
                    0, 0, me.getRatingBefore(), me.getRatingBefore(),
                    BattleState.CANCELLED.name());
        }
        if (opp == null) throw new IllegalStateException("Opponent not found");

        String outcome;
        if (battle.getWinnerId() == null) outcome = "DRAW";
        else if (battle.getWinnerId().equals(userId)) outcome = "WIN";
        else outcome = "LOSS";

        boolean isRanked = battle.getMode() == BattleMode.RANKED_1V1;
        int coins, xp;
        if ("DRAW".equals(outcome)) { coins = 15; xp = 25; }
        else if ("WIN".equals(outcome)) { coins = isRanked ? 60 : 30; xp = isRanked ? 75 : 40; }
        else { coins = isRanked ? 10 : 5; xp = isRanked ? 15 : 10; }

        return new BattleResultDTO(
                battleId,
                battle.getMode().name(),
            battle.getProblemCount(),
                outcome,
                battle.getWinnerId(),
                toResultStats(me),
                toResultStats(opp),
                coins, xp,
                me.getRatingBefore(),
                me.getRatingAfter() != null ? me.getRatingAfter() : me.getRatingBefore(),
                BattleState.COMPLETED.name()
        );
    }

    private BattleResultDTO.ResultStats toResultStats(BattleParticipant bp) {
        String username = userRepo.findById(bp.getUserId())
                .map(User::getUsername).orElse("Unknown");
        return new BattleResultDTO.ResultStats(
                bp.getUserId(), username,
                bp.getProblemsSolved(), bp.getTotalSubmissions(),
                bp.getTotalSolveTimeMs(),
                bp.getRatingBefore(), bp.getRatingAfter()
        );
    }

    public GroupBattleStateDTO getGroupBattleState(Long battleId, Long userId) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);

        long timeRemainingMs = 0;
        if (battle.getState() == BattleState.ACTIVE && battle.getStartedAt() != null) {
            long elapsed = Duration.between(battle.getStartedAt(), LocalDateTime.now()).toMillis();
            long totalMs = (long) battle.getDurationMinutes() * 60_000;
            timeRemainingMs = Math.max(0, totalMs - elapsed);
        }

        // Build scoreboard: non-forfeited first, then by score desc
        List<BattleParticipant> sorted = new ArrayList<>(participants);
        sorted.sort(Comparator
            .comparing(BattleParticipant::isForfeited)
            .thenComparingInt(p -> -p.getGroupScore())
            .thenComparingInt(p -> -p.getProblemsSolved())
            .thenComparingInt(BattleParticipant::getTotalSubmissions));

        List<GroupBattleStateDTO.ScoreboardEntry> scoreboard = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            BattleParticipant p = sorted.get(i);
            String username = userRepo.findById(p.getUserId()).map(User::getUsername).orElse("Unknown");
            scoreboard.add(new GroupBattleStateDTO.ScoreboardEntry(
                    p.getUserId(), username,
                    p.getGroupScore(), p.getProblemsSolved(), p.getTotalSubmissions(),
                    i + 1,
                    p.isForfeited()
            ));
        }

        // Build problem info
        List<BattleProblem> battleProblems = battleProblemRepo.findByBattleIdOrderByProblemIndex(battleId);
        List<GroupBattleStateDTO.ProblemInfo> problemInfos = battleProblems.stream().map(bp -> {
            Problem p = problemRepo.findById(bp.getProblemId()).orElse(null);
            String resolvedJudgeId = judgeIdResolver.resolveJudgeProblemId(bp.getJudgeProblemId(), p);
            boolean solved = submissionRepo.hasAcceptedSubmission(battleId, userId, bp.getProblemIndex());
            return new GroupBattleStateDTO.ProblemInfo(
                    bp.getProblemIndex(),
                    p != null ? p.getTitle() : "Unknown",
                    p != null ? p.getDescription() : "",
                "", "", resolvedJudgeId, solved
            );
        }).toList();

        return new GroupBattleStateDTO(battleId, battle.getState().name(),
                timeRemainingMs, scoreboard, problemInfos, userId);
    }

    public GroupBattleResultDTO getGroupBattleResult(Long battleId, Long requestingUserId) {
        Battle battle = battleRepo.findById(battleId)
                .orElseThrow(() -> new NoSuchElementException("Battle not found"));

        if (battle.getState() != BattleState.COMPLETED) {
            throw new IllegalStateException("Battle not yet completed");
        }

        List<BattleParticipant> participants = participantRepo.findByBattleId(battleId);
        participants.sort(Comparator.comparingInt(p -> p.getPlacement() != null ? p.getPlacement() : 99));

        BattleParticipant me = participants.stream()
                .filter(p -> p.getUserId().equals(requestingUserId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Not in this battle"));

        int myPlacement = me.getPlacement() != null ? me.getPlacement() : 99;
        int[] coinsXp = BattleLifecycleService.rewardForGroupParticipant(me);

        List<GroupBattleResultDTO.PlacementEntry> placements = participants.stream().map(p -> {
            int place = p.getPlacement() != null ? p.getPlacement() : 99;
            int[] cxp = BattleLifecycleService.rewardForGroupParticipant(p);
            String username = userRepo.findById(p.getUserId()).map(User::getUsername).orElse("Unknown");
            return new GroupBattleResultDTO.PlacementEntry(
                    place, p.getUserId(), username,
                    p.getGroupScore(), p.getProblemsSolved(), p.getTotalSubmissions(),
                p.isForfeited(),
                    cxp[0], cxp[1]
            );
        }).toList();

        return new GroupBattleResultDTO(
                battleId, battle.getMode().name(),
                placements, coinsXp[0], coinsXp[1], myPlacement,
                battle.getCompletedAt()
        );
    }
}
