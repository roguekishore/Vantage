package com.backend.springapp.judge.queue;

import com.backend.springapp.gamification.battle.*;
import com.backend.springapp.realtime.RealtimePublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Pushes the updated battle state to every participant. Call it after the recording transaction has committed, never
 * inside it. It calls BattleViews directly and swallows failures: a broken socket must not undo a recorded submission.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BattleStateBroadcaster {

    private final BattleParticipantRepository participantRepo;
    private final BattleViews battleViews;
    private final RealtimePublisher realtimePublisher;

    public void broadcast(Long battleId, BattleMode mode) {
        try {
            for (BattleParticipant p : participantRepo.findByBattleId(battleId)) {
                if (mode == BattleMode.GROUP_FFA) {
                    GroupBattleStateDTO dto = battleViews.getGroupBattleState(battleId, p.getUserId());
                    realtimePublisher.toTopic("/topic/battle/" + battleId + "/group-state/" + p.getUserId(), dto);
                } else {
                    BattleStateDTO dto = battleViews.getBattleState(battleId, p.getUserId());
                    realtimePublisher.toTopic("/topic/battle/" + battleId + "/state/" + p.getUserId(), dto);
                }
            }
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed after submission: {}", e.getMessage());
        }
    }
}
