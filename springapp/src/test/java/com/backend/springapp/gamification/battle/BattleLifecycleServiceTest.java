package com.backend.springapp.gamification.battle;

import com.backend.springapp.gamification.GamificationService;
import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import com.backend.springapp.gamification.achievement.AchievementService;
import com.backend.springapp.realtime.RealtimePublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BattleLifecycleServiceTest {

    private BattleRepository battleRepo;
    private BattleParticipantRepository participantRepo;
    private GamificationService gamification;
    private BattleLifecycleService service;
    private Battle battle;

    @BeforeEach
    void setUp() {
        battleRepo = mock(BattleRepository.class);
        participantRepo = mock(BattleParticipantRepository.class);
        gamification = mock(GamificationService.class);
        PlayerStatsRepository statsRepo = mock(PlayerStatsRepository.class);
        PlatformTransactionManager txManager = mock(PlatformTransactionManager.class);
        when(txManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        service = new BattleLifecycleService(battleRepo, participantRepo, statsRepo, gamification,
                mock(AchievementService.class), mock(BattleService.class), mock(BattleViews.class),
                mock(RealtimePublisher.class), txManager);

        battle = new Battle();
        battle.setMode(BattleMode.RANKED_1V1);
        battle.setState(BattleState.ACTIVE);
        battle.setProblemCount(2);
        when(battleRepo.findById(1L)).thenReturn(Optional.of(battle));
        when(gamification.getOrCreateStats(anyLong())).thenAnswer(i -> {
            PlayerStats s = new PlayerStats();
            s.setUserId(i.getArgument(0));
            return s;
        });
    }

    private static BattleParticipant player(long userId, int rating, int solved, long timeMs, int subs) {
        BattleParticipant p = new BattleParticipant();
        p.setBattleId(1L);
        p.setUserId(userId);
        p.setRatingBefore(rating);
        p.setProblemsSolved(solved);
        p.setTotalSolveTimeMs(timeMs);
        p.setTotalSubmissions(subs);
        return p;
    }

    @Test
    void drawAppliesEloAtHalfScoreEach() {
        BattleParticipant a = player(10, 1400, 1, 5000, 2);
        BattleParticipant b = player(20, 1200, 1, 5000, 2);
        when(participantRepo.findByBattleId(1L)).thenReturn(List.of(a, b));
        when(participantRepo.countCompletedRankedBattles(anyLong())).thenReturn(0L); // K = 40
        when(battleRepo.transition(eq(1L), any(), eq(BattleState.COMPLETED), any(LocalDateTime.class),
                isNull(), anyString())).thenReturn(1);

        service.completeBattle(1L, "TIMEOUT");

        // expected(1400 vs 1200) = 0.7597; score 0.5 each: 1400 + 40*(0.5-0.7597) = 1390, 1200 + 40*(0.5-0.2403) = 1210
        assertEquals(1390, a.getRatingAfter());
        assertEquals(1210, b.getRatingAfter());
    }

    @Test
    void loserOfTheRaceAppliesNothing() {
        BattleParticipant a = player(10, 1200, 2, 5000, 2);
        BattleParticipant b = player(20, 1200, 1, 5000, 2);
        when(participantRepo.findByBattleId(1L)).thenReturn(List.of(a, b));
        when(battleRepo.transition(eq(1L), any(), eq(BattleState.COMPLETED), any(LocalDateTime.class),
                any(), anyString())).thenReturn(0);

        service.completeBattle(1L, "TIMEOUT");

        verify(gamification, never()).getOrCreateStats(anyLong());
        verify(gamification, never()).creditCoins(anyLong(), org.mockito.ArgumentMatchers.anyInt(), any(), any());
        assertEquals(null, a.getRatingAfter());
    }

    @Test
    void bothFinishedCompletesBattleWithWinnerByTime() {
        BattleParticipant a = player(10, 1200, 2, 9000, 3);
        BattleParticipant b = player(20, 1200, 2, 7000, 3); // faster -> winner
        when(participantRepo.findByBattleId(1L)).thenReturn(List.of(a, b));
        when(battleRepo.transition(eq(1L), eq(Set.of(BattleState.ACTIVE)), eq(BattleState.COMPLETED),
                any(LocalDateTime.class), eq(20L), eq("ALL_SOLVED"))).thenReturn(1);

        service.completeIfAllFinished(1L);

        verify(battleRepo).transition(eq(1L), eq(Set.of(BattleState.ACTIVE)), eq(BattleState.COMPLETED),
                any(LocalDateTime.class), eq(20L), eq("ALL_SOLVED"));
    }

    @Test
    void oneFinishedDoesNotComplete() {
        BattleParticipant a = player(10, 1200, 2, 9000, 3);
        BattleParticipant b = player(20, 1200, 1, 7000, 3);
        when(participantRepo.findByBattleId(1L)).thenReturn(List.of(a, b));

        service.completeIfAllFinished(1L);

        verify(battleRepo, never()).transition(anyLong(), any(), any(), any(), any(), any());
    }
}
