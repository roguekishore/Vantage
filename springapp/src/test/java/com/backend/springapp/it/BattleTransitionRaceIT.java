package com.backend.springapp.it;

import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import com.backend.springapp.gamification.WeeklyStats;
import com.backend.springapp.gamification.WeeklyStatsRepository;
import com.backend.springapp.gamification.battle.Battle;
import com.backend.springapp.gamification.battle.BattleLifecycleService;
import com.backend.springapp.gamification.battle.BattleMode;
import com.backend.springapp.gamification.battle.BattleParticipant;
import com.backend.springapp.gamification.battle.BattleParticipantRepository;
import com.backend.springapp.gamification.battle.BattleRepository;
import com.backend.springapp.gamification.battle.BattleState;
import com.backend.springapp.gamification.coins.CoinTransaction;
import com.backend.springapp.gamification.coins.CoinTransactionRepository;
import com.backend.springapp.gamification.coins.TransactionSource;
import com.backend.springapp.problem.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * completeBattle, forfeit and timer expiry fired concurrently from 8 threads on one battle, 50 times. The battle must
 * end up COMPLETED exactly once: ratingAfter set once per participant, xp and coins credited exactly once (pre-created stats, exact balances).
 * battleRating is assigned an absolute value, so a double-apply cannot be detected through it; xp/coins/transactions do.
 */
@SpringBootTest
class BattleTransitionRaceIT extends AbstractMysqlIT {

	private static final int INITIAL_XP = 100;
	private static final int INITIAL_COINS = 500;
	private static final LocalDate WEEK_START = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

	@Autowired BattleLifecycleService lifecycle;
	@Autowired BattleRepository battleRepo;
	@Autowired BattleParticipantRepository participantRepo;
	@Autowired PlayerStatsRepository statsRepo;
	@Autowired CoinTransactionRepository coinRepo;
	@Autowired WeeklyStatsRepository weeklyRepo;

	@Test
	void concurrentTerminalPathsApplyOutcomeExactlyOnce() throws Exception {
		ExecutorService pool = Executors.newFixedThreadPool(8);
		try {
			for (int iter = 0; iter < 50; iter++) {
				long u1 = 1_000_000L + iter * 2L;
				long u2 = u1 + 1;

				for (long u : new long[] {u1, u2}) { // pre-create stats so lazy parallel creation cannot race
					PlayerStats ps = new PlayerStats();
					ps.setUserId(u);
					ps.setXp(INITIAL_XP);
					ps.setCoins(INITIAL_COINS);
					statsRepo.saveAndFlush(ps);
					WeeklyStats ws = new WeeklyStats(); // also pre-created: lazy parallel insert would throw, not assert
					ws.setUserId(u);
					ws.setWeekStart(WEEK_START);
					weeklyRepo.saveAndFlush(ws);
				}

				Battle b = new Battle();
				b.setMode(BattleMode.RANKED_1V1);
				b.setState(BattleState.ACTIVE);
				b.setDifficulty(Tag.EASY);
				b.setProblemCount(1);
				b.setDurationMinutes(1);
				b.setStartedAt(LocalDateTime.now().minusHours(2)); // timer already expired
				b = battleRepo.saveAndFlush(b);
				final long battleId = b.getId();
				participantRepo.saveAndFlush(participant(battleId, u1, 1)); // u1 is ahead -> wins on completion/timeout
				participantRepo.saveAndFlush(participant(battleId, u2, 0));

				CyclicBarrier gate = new CyclicBarrier(8);
				List<Throwable> errors = new CopyOnWriteArrayList<>();
				List<Future<?>> futures = new ArrayList<>();
				for (int t = 0; t < 8; t++) {
					final int kind = t % 3;
					futures.add(pool.submit((Callable<Void>) () -> {
						gate.await(10, TimeUnit.SECONDS);
						try {
							switch (kind) {
								case 0 -> lifecycle.completeBattle(battleId);
								case 1 -> lifecycle.forfeit(battleId, u1);
								default -> lifecycle.checkExpiredBattles();
							}
						} catch (Throwable e) {
							errors.add(e);
						}
						return null;
					}));
				}
				for (Future<?> f : futures) f.get(60, TimeUnit.SECONDS);

				Battle done = battleRepo.findById(battleId).orElseThrow();
				assertEquals(BattleState.COMPLETED, done.getState(), "iteration " + iter + " state");
				assertNotNull(done.getWinnerId());
				long winner = done.getWinnerId();
				boolean forfeit = "FORFEIT".equals(done.getEndedReason());
				assertEquals(forfeit ? u2 : u1, winner, "iteration " + iter + " winner vs reason");

				BattleParticipant p1 = participantRepo.findByBattleIdAndUserId(battleId, u1).orElseThrow();
				BattleParticipant p2 = participantRepo.findByBattleIdAndUserId(battleId, u2).orElseThrow();
				// 1200 vs 1200, K=40: winner 1220, loser 1180, stored on the participant and mirrored on the stats row.
				assertEquals(winner == u1 ? 1220 : 1180, p1.getRatingAfter(), "iteration " + iter + " p1 ratingAfter");
				assertEquals(winner == u2 ? 1220 : 1180, p2.getRatingAfter(), "iteration " + iter + " p2 ratingAfter");
				PlayerStats s1 = statsRepo.findByUserId(u1).orElseThrow();
				PlayerStats s2 = statsRepo.findByUserId(u2).orElseThrow();
				assertEquals(p1.getRatingAfter(), s1.getBattleRating());
				assertEquals(p2.getRatingAfter(), s2.getBattleRating());

				// Ranked rewards exactly once: winner 75xp/60c, loser 15xp/10c, forfeiter nothing (forfeit() is only called for u1).
				// The completion/timeout path also runs achievement checks: the winner's first win pays +100c/+75xp once.
				int xp1 = forfeit ? 0 : (winner == u1 ? 75 : 15), c1 = forfeit ? 0 : (winner == u1 ? 60 : 10);
				int xp2 = winner == u2 ? 75 : 15, c2 = winner == u2 ? 60 : 10;
				int ach1 = !forfeit && winner == u1 ? 1 : 0, ach2 = !forfeit && winner == u2 ? 1 : 0;
				assertEquals(INITIAL_XP + xp1 + 75 * ach1, s1.getXp(), "iteration " + iter + " u1 xp");
				assertEquals(INITIAL_XP + xp2 + 75 * ach2, s2.getXp(), "iteration " + iter + " u2 xp");
				assertEquals(INITIAL_COINS + c1 + 100 * ach1, s1.getCoins(), "iteration " + iter + " u1 coins");
				assertEquals(INITIAL_COINS + c2 + 100 * ach2, s2.getCoins(), "iteration " + iter + " u2 coins");
				WeeklyStats w1 = weeklyRepo.findByUserIdAndWeekStart(u1, WEEK_START).orElseThrow();
				WeeklyStats w2 = weeklyRepo.findByUserIdAndWeekStart(u2, WEEK_START).orElseThrow();
				assertEquals(xp1, w1.getXpEarned(), "iteration " + iter + " u1 weekly xp");
				assertEquals(xp2, w2.getXpEarned(), "iteration " + iter + " u2 weekly xp");
				assertEquals(c1, w1.getCoinsEarned(), "iteration " + iter + " u1 weekly coins");
				assertEquals(c2, w2.getCoinsEarned(), "iteration " + iter + " u2 weekly coins");
				assertEquals(forfeit ? 0 : 1, rewardCount(u1, battleId), "iteration " + iter + " u1 reward credits");
				assertEquals(1, rewardCount(u2, battleId), "iteration " + iter + " u2 reward credits");
				// Checked last so a double-apply surfaces as a failed state/balance assertion above, not as a thrown error.
				assertTrue(errors.isEmpty(), "iteration " + iter + " threw: " + errors);
			}
		} finally {
			pool.shutdownNow();
		}
	}

	private long rewardCount(long userId, long battleId) {
		return coinRepo.findAll().stream()
				.filter((CoinTransaction t) -> t.getUserId().equals(userId) && t.getSource() == TransactionSource.BATTLE_WIN
						&& t.getReferenceId() != null && battleId == t.getReferenceId())
				.count();
	}

	private static BattleParticipant participant(long battleId, long userId, int solved) {
		BattleParticipant p = new BattleParticipant();
		p.setBattleId(battleId);
		p.setUserId(userId);
		p.setProblemsSolved(solved);
		p.setTotalSubmissions(solved);
		p.setTotalSolveTimeMs(solved * 1000L);
		return p;
	}
}
