package com.backend.springapp.it;

import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import com.backend.springapp.gamification.battle.Battle;
import com.backend.springapp.gamification.battle.BattleMode;
import com.backend.springapp.gamification.battle.BattleParticipant;
import com.backend.springapp.gamification.battle.BattleParticipantRepository;
import com.backend.springapp.gamification.battle.BattleRepository;
import com.backend.springapp.gamification.battle.BattleService;
import com.backend.springapp.gamification.battle.BattleState;
import com.backend.springapp.problem.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

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
 * Found by the first live 2-instance k6 smoke run: both players of a battle ready up at the same instant (the client
 * does it the moment the match frame arrives). Each request ran in its own REPEATABLE READ transaction, read the
 * participants before the other committed, saw "the other player is not ready" and nobody started the battle; it sat
 * in WAITING until the lobby timeout cancelled it. Two players, 40 battles, both ready calls released together.
 */
@SpringBootTest
class ReadyUpRaceIT extends AbstractMysqlIT {

	@Autowired BattleService battleService;
	@Autowired BattleRepository battleRepo;
	@Autowired BattleParticipantRepository participantRepo;
	@Autowired PlayerStatsRepository statsRepo;

	@Test
	void twoPlayersReadyingAtTheSameInstantStartTheBattle() throws Exception {
		ExecutorService pool = Executors.newFixedThreadPool(2);
		List<String> neverStarted = new CopyOnWriteArrayList<>();
		try {
			for (int iter = 0; iter < 40; iter++) {
				long u1 = 2_000_000L + iter * 2L, u2 = u1 + 1;
				Battle b = new Battle();
				b.setMode(BattleMode.CASUAL_1V1);
				b.setState(BattleState.WAITING);
				b.setDifficulty(Tag.EASY);
				b.setProblemCount(1);
				b.setDurationMinutes(10);
				final long battleId = battleRepo.saveAndFlush(b).getId();
				for (long u : new long[] {u1, u2}) {
					PlayerStats ps = new PlayerStats(); // pre-created: first-touch parallel creation is a separate concern
					ps.setUserId(u);
					statsRepo.saveAndFlush(ps);
					BattleParticipant p = new BattleParticipant();
					p.setBattleId(battleId);
					p.setUserId(u);
					participantRepo.saveAndFlush(p);
				}

				CyclicBarrier gate = new CyclicBarrier(2);
				List<Throwable> errors = new CopyOnWriteArrayList<>();
				List<Future<?>> futures = new ArrayList<>();
				for (long u : new long[] {u1, u2}) {
					futures.add(pool.submit((Callable<Void>) () -> {
						gate.await(10, TimeUnit.SECONDS);
						try {
							battleService.readyUp(battleId, u, "python");
						} catch (Throwable e) {
							errors.add(e);
						}
						return null;
					}));
				}
				for (Future<?> f : futures) f.get(60, TimeUnit.SECONDS);

				assertTrue(errors.isEmpty(), "iteration " + iter + " errors: " + errors);
				Battle after = battleRepo.findById(battleId).orElseThrow();
				if (after.getState() != BattleState.ACTIVE) neverStarted.add("battle " + battleId + " is " + after.getState());
				else assertNotNull(after.getStartedAt(), "ACTIVE battle needs a start time");
			}
		} finally {
			pool.shutdownNow();
		}
		assertEquals(List.of(), neverStarted, "battles that both players readied but never started");
	}
}
