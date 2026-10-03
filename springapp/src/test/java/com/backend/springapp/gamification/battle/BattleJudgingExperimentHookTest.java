package com.backend.springapp.gamification.battle;

import com.backend.springapp.experiments.ExperimentService;
import com.backend.springapp.judge.queue.BattleSubmissionRecorder;
import com.backend.springapp.judge.queue.JudgeResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** The A/B first-finisher hook, now living in the shared recorder that both the sync and queue paths use. */
class BattleJudgingExperimentHookTest {

    private static final long BATTLE_ID = 7L;
    private static final long USER_ID = 11L;

    private BattleRepository battleRepo;
    private BattleParticipantRepository participantRepo;
    private BattleLifecycleService lifecycle;
    private ExperimentService experiments;
    private BattleSubmissionRecorder recorder;

    @BeforeEach
    void setUp() {
        battleRepo = mock(BattleRepository.class);
        participantRepo = mock(BattleParticipantRepository.class);
        lifecycle = mock(BattleLifecycleService.class);
        experiments = mock(ExperimentService.class);
        recorder = new BattleSubmissionRecorder(battleRepo, participantRepo, mock(BattleSubmissionRepository.class),
                lifecycle, experiments);
        ReflectionTestUtils.setField(recorder, "continueAfterFirstFinisherEnabled", true);
    }

    private void arrange(BattleMode mode) {
        Battle battle = new Battle();
        battle.setState(BattleState.ACTIVE);
        battle.setStartedAt(LocalDateTime.now());
        battle.setDurationMinutes(30);
        battle.setMode(mode);
        battle.setProblemCount(1);
        battle.setDifficulty(com.backend.springapp.problem.Tag.MEDIUM);
        when(battleRepo.findById(BATTLE_ID)).thenReturn(Optional.of(battle));

        BattleParticipant me = new BattleParticipant();
        me.setBattleId(BATTLE_ID);
        me.setUserId(USER_ID);
        when(participantRepo.findByBattleIdAndUserId(BATTLE_ID, USER_ID)).thenReturn(Optional.of(me));
        when(participantRepo.findByBattleId(BATTLE_ID)).thenReturn(List.of(me));
    }

    private void submitAccepted() {
        recorder.record(BATTLE_ID, USER_ID, 0, "java", "code",
                new JudgeResult(Verdict.ACCEPTED, 5L, null, null, null, null), LocalDateTime.now());
    }

    @Test
    void treatment_1v1_completesBattleOnFirstFinisher() {
        arrange(BattleMode.CASUAL_1V1);
        when(experiments.isTreatment(BATTLE_ID)).thenReturn(true);

        submitAccepted();

        verify(lifecycle).completeBattle(BATTLE_ID);
    }

    @Test
    void control_1v1_doesNotCompleteBattle() {
        arrange(BattleMode.CASUAL_1V1);
        when(experiments.isTreatment(BATTLE_ID)).thenReturn(false);

        submitAccepted();

        verify(lifecycle, never()).completeBattle(anyLong());
    }

    @Test
    void groupFfa_neverReachesExperimentHook() {
        arrange(BattleMode.GROUP_FFA);

        submitAccepted();

        verifyNoInteractions(experiments);
        verify(lifecycle, never()).completeBattle(anyLong());
    }
}
