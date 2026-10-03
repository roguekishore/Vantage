package com.backend.springapp.gamification.battle;

import com.backend.springapp.experiments.ExperimentService;
import com.backend.springapp.judge.JudgeProxyService;
import com.backend.springapp.problem.ProblemRepository;
import com.backend.springapp.realtime.RealtimePublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class BattleJudgingExperimentHookTest {

    private static final long BATTLE_ID = 7L;
    private static final long USER_ID = 11L;

    private BattleRepository battleRepo;
    private BattleParticipantRepository participantRepo;
    private BattleProblemRepository battleProblemRepo;
    private BattleSubmissionRepository submissionRepo;
    private JudgeProxyService judgeProxy;
    private BattleLifecycleService lifecycle;
    private ExperimentService experiments;
    private BattleJudgingService service;

    @BeforeEach
    void setUp() {
        battleRepo = mock(BattleRepository.class);
        participantRepo = mock(BattleParticipantRepository.class);
        battleProblemRepo = mock(BattleProblemRepository.class);
        submissionRepo = mock(BattleSubmissionRepository.class);
        judgeProxy = mock(JudgeProxyService.class);
        lifecycle = mock(BattleLifecycleService.class);
        experiments = mock(ExperimentService.class);
        BattleService battleService = mock(BattleService.class);
        ProblemRepository problemRepo = mock(ProblemRepository.class);

        service = new BattleJudgingService(battleRepo, participantRepo, battleProblemRepo, submissionRepo,
                problemRepo, judgeProxy, battleService, mock(BattleViews.class), lifecycle,
                mock(RealtimePublisher.class), experiments);
        ReflectionTestUtils.setField(service, "continueAfterFirstFinisherEnabled", true);

        when(battleService.resolveJudgeProblemId(any(), any())).thenReturn("two-sum");
        when(problemRepo.findById(any())).thenReturn(Optional.empty());
        when(submissionRepo.hasAcceptedSubmission(anyLong(), anyLong(), org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn(false);
        when(submissionRepo.findTopByBattleIdAndUserIdOrderBySubmittedAtDesc(anyLong(), anyLong()))
                .thenReturn(Optional.empty());
        when(judgeProxy.submit(anyString(), anyString(), anyString()))
                .thenReturn(Map.of("status", "Accepted", "time", 5));
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

        BattleProblem bp = new BattleProblem();
        bp.setProblemIndex(0);
        bp.setProblemId(1L);
        when(battleProblemRepo.findByBattleIdOrderByProblemIndex(BATTLE_ID)).thenReturn(List.of(bp));
    }

    @Test
    void treatment_1v1_completesBattleOnFirstFinisher() {
        arrange(BattleMode.CASUAL_1V1);
        when(experiments.isTreatment(BATTLE_ID)).thenReturn(true);

        service.submitCode(BATTLE_ID, USER_ID, 0, "java", "code");

        verify(lifecycle).completeBattle(BATTLE_ID);
    }

    @Test
    void control_1v1_doesNotCompleteBattle() {
        arrange(BattleMode.CASUAL_1V1);
        when(experiments.isTreatment(BATTLE_ID)).thenReturn(false);

        service.submitCode(BATTLE_ID, USER_ID, 0, "java", "code");

        verify(lifecycle, never()).completeBattle(anyLong());
    }

    @Test
    void groupFfa_neverReachesExperimentHook() {
        arrange(BattleMode.GROUP_FFA);

        service.submitCode(BATTLE_ID, USER_ID, 0, "java", "code");

        verifyNoInteractions(experiments);
        verify(lifecycle, never()).completeBattle(anyLong());
    }
}
