package com.backend.springapp.it;

import com.backend.springapp.gamification.battle.BattleMode;
import com.backend.springapp.gamification.battle.BattleParticipant;
import com.backend.springapp.gamification.battle.BattleParticipantRepository;
import com.backend.springapp.gamification.battle.BattleRepository;
import com.backend.springapp.gamification.battle.MatchmakingQueue;
import com.backend.springapp.gamification.battle.MatchmakingQueueRepository;
import com.backend.springapp.gamification.battle.MatchmakingService;
import com.backend.springapp.problem.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Three "instances" (threads) run processMatchmaking over 400 queued users while others leave at random.
 * No user may land in two battles, every battle must pair compatible ratings, no matched user keeps a queue row,
 * and nothing may fail with a deadlock.
 */
@SpringBootTest
class MatchmakingSkipLockedIT extends AbstractMysqlIT {

	@Autowired MatchmakingService matchmaking;
	@Autowired MatchmakingQueueRepository queueRepo;
	@Autowired BattleRepository battleRepo;
	@Autowired BattleParticipantRepository participantRepo;

	@Test
	void threeMatchersAndRandomLeavesNeverDoubleMatch() throws Exception {
		Random rnd = new Random(42);
		List<Long> users = new ArrayList<>();
		Map<Long, Integer> ratings = new HashMap<>();
		for (int i = 0; i < 400; i++) {
			long uid = 5_000_000L + i;
			MatchmakingQueue q = new MatchmakingQueue();
			q.setUserId(uid);
			q.setMode(i % 2 == 0 ? BattleMode.CASUAL_1V1 : BattleMode.RANKED_1V1);
			q.setDifficulty(Tag.EASY);
			q.setProblemCount(1);
			q.setDurationMinutes(15);
			q.setBattleRating(800 + rnd.nextInt(800));
			queueRepo.saveAndFlush(q);
			users.add(uid);
			ratings.put(uid, q.getBattleRating());
		}
		long startedAt = System.currentTimeMillis();

		List<Throwable> errors = new CopyOnWriteArrayList<>();
		AtomicBoolean done = new AtomicBoolean(false);
		ExecutorService pool = Executors.newFixedThreadPool(4);
		CountDownLatch gate = new CountDownLatch(1);
		for (int m = 0; m < 3; m++) {
			pool.submit(() -> {
				try {
					gate.await();
					while (!done.get()) {
						matchmaking.processMatchmakingStrict();
					}
				} catch (Throwable t) {
					errors.add(t);
				}
			});
		}
		pool.submit(() -> {
			try {
				gate.await();
				Random r = new Random(7);
				for (int i = 0; i < 120; i++) {
					matchmaking.leaveQueue(users.get(r.nextInt(users.size())));
					Thread.sleep(2);
				}
			} catch (Throwable t) {
				errors.add(t);
			}
		});
		gate.countDown();

		// run until the queue is drained of matchable users (stable for several passes) or 60 s elapse
		int lastSize = -1, stable = 0;
		for (int i = 0; i < 120 && stable < 6; i++) {
			Thread.sleep(500);
			int size = (int) queueRepo.count();
			stable = size == lastSize ? stable + 1 : 0;
			lastSize = size;
		}
		done.set(true);
		pool.shutdown();
		assertTrue(pool.awaitTermination(30, TimeUnit.SECONDS));
		assertTrue(errors.isEmpty(), "matcher/leaver errors: " + errors);

		long elapsedSec = (System.currentTimeMillis() - startedAt) / 1000;
		Set<Long> seen = new HashSet<>();
		Map<Long, List<BattleParticipant>> byBattle = new HashMap<>();
		for (BattleParticipant p : participantRepo.findAll()) {
			if (!ratings.containsKey(p.getUserId())) continue;
			assertTrue(seen.add(p.getUserId()), "user " + p.getUserId() + " is in two battles");
			byBattle.computeIfAbsent(p.getBattleId(), k -> new ArrayList<>()).add(p);
		}
		assertTrue(byBattle.size() > 50, "expected many battles, got " + byBattle.size());
		for (var e : byBattle.entrySet()) {
			assertEquals(2, e.getValue().size(), "battle " + e.getKey() + " must have exactly 2 players");
			BattleMode mode = battleRepo.findById(e.getKey()).orElseThrow().getMode();
			int diff = Math.abs(e.getValue().get(0).getRatingBefore() - e.getValue().get(1).getRatingBefore());
			int band = mode == BattleMode.CASUAL_1V1 ? 300 : 200 + 50 * (int) (elapsedSec / 30 + 1);
			assertTrue(diff <= band, "battle " + e.getKey() + " pairs incompatible ratings, diff " + diff);
		}
		for (Long uid : seen) {
			assertTrue(queueRepo.findByUserId(uid).isEmpty(), "matched user " + uid + " still queued");
		}
	}
}
