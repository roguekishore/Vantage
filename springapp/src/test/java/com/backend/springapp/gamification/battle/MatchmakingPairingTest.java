package com.backend.springapp.gamification.battle;

import com.backend.springapp.problem.Tag;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Band edges of the (unchanged) compatibility rules, and the rating-adjacent pairing walk. */
class MatchmakingPairingTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 4, 12, 0, 0);

    private final MatchmakingService service = new MatchmakingService(null, null, null, null, null);

    private static MatchmakingQueue entry(long uid, BattleMode mode, int rating, long waitSec, int minutes) {
        MatchmakingQueue q = new MatchmakingQueue();
        q.setUserId(uid);
        q.setMode(mode);
        q.setDifficulty(Tag.EASY);
        q.setProblemCount(1);
        q.setDurationMinutes(minutes);
        q.setBattleRating(rating);
        q.setJoinedAt(NOW.minusSeconds(waitSec));
        return q;
    }

    private boolean compat(BattleMode m, int ra, int rb, long waitA, long waitB) {
        return service.isRatingCompatible(entry(1, m, ra, waitA, 15), entry(2, m, rb, waitB, 15), NOW);
    }

    @Test
    void casualBandIs300Inclusive() {
        assertTrue(compat(BattleMode.CASUAL_1V1, 1000, 1300, 0, 0));
        assertFalse(compat(BattleMode.CASUAL_1V1, 1000, 1301, 0, 0));
        assertFalse(compat(BattleMode.CASUAL_1V1, 1000, 1301, 600, 600)); // casual never widens
    }

    @Test
    void rankedBandStartsAt200() {
        assertTrue(compat(BattleMode.RANKED_1V1, 1000, 1200, 0, 0));
        assertFalse(compat(BattleMode.RANKED_1V1, 1000, 1201, 0, 0));
        assertFalse(compat(BattleMode.RANKED_1V1, 1000, 1201, 29, 29));
    }

    @Test
    void rankedWidensBy50AtThirtyAndSixtySeconds() {
        assertTrue(compat(BattleMode.RANKED_1V1, 1000, 1250, 30, 0));
        assertFalse(compat(BattleMode.RANKED_1V1, 1000, 1251, 30, 0));
        assertFalse(compat(BattleMode.RANKED_1V1, 1000, 1251, 59, 0));
        assertTrue(compat(BattleMode.RANKED_1V1, 1000, 1300, 60, 0));
        assertFalse(compat(BattleMode.RANKED_1V1, 1000, 1301, 60, 0));
        // the longer of the two waits decides
        assertTrue(compat(BattleMode.RANKED_1V1, 1000, 1250, 0, 30));
    }

    @Test
    void rankedBandHelper() {
        assertEquals(200, MatchmakingService.rankedBand(29));
        assertEquals(250, MatchmakingService.rankedBand(30));
        assertEquals(300, MatchmakingService.rankedBand(60));
    }

    @Test
    void durationMustMatchWhenCustomTimerEnabled() {
        assertFalse(service.isDurationCompatible(entry(1, BattleMode.CASUAL_1V1, 1000, 0, 15),
                entry(2, BattleMode.CASUAL_1V1, 1000, 0, 30)));
        assertTrue(service.isDurationCompatible(entry(1, BattleMode.CASUAL_1V1, 1000, 0, 15),
                entry(2, BattleMode.CASUAL_1V1, 1000, 0, 15)));
    }

    @Test
    void pairsAdjacentRatingsAndLeavesOutliersUnmatched() {
        List<MatchmakingQueue> claimed = List.of(
                entry(1, BattleMode.CASUAL_1V1, 1000, 0, 15),
                entry(2, BattleMode.CASUAL_1V1, 2000, 0, 15),
                entry(3, BattleMode.CASUAL_1V1, 1100, 0, 15),
                entry(4, BattleMode.CASUAL_1V1, 5000, 0, 15));
        List<MatchmakingQueue[]> pairs = service.findPairs(claimed, NOW);
        assertEquals(1, pairs.size());
        assertEquals(1L, pairs.get(0)[0].getUserId());
        assertEquals(3L, pairs.get(0)[1].getUserId());
    }

    @Test
    void skipsIncompatibleDurationAndPairsNextCandidate() {
        List<MatchmakingQueue> claimed = List.of(
                entry(1, BattleMode.CASUAL_1V1, 1000, 0, 15),
                entry(2, BattleMode.CASUAL_1V1, 1010, 0, 30),
                entry(3, BattleMode.CASUAL_1V1, 1020, 0, 15));
        List<MatchmakingQueue[]> pairs = service.findPairs(claimed, NOW);
        assertEquals(1, pairs.size());
        assertEquals(1L, pairs.get(0)[0].getUserId());
        assertEquals(3L, pairs.get(0)[1].getUserId());
    }

    @Test
    void rankedLongWaitReachesFurtherCandidates() {
        List<MatchmakingQueue> claimed = List.of(
                entry(1, BattleMode.RANKED_1V1, 1000, 0, 15),
                entry(2, BattleMode.RANKED_1V1, 1300, 60, 15));
        assertEquals(1, service.findPairs(claimed, NOW).size());
        assertEquals(0, service.findPairs(List.of(
                entry(1, BattleMode.RANKED_1V1, 1000, 0, 15),
                entry(2, BattleMode.RANKED_1V1, 1300, 59, 15)), NOW).size());
    }
}
