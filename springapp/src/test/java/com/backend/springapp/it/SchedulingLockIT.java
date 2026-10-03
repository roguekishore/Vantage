package com.backend.springapp.it;

import com.backend.springapp.gamification.battle.Battle;
import com.backend.springapp.gamification.battle.BattleLifecycleService;
import com.backend.springapp.gamification.battle.BattleMode;
import com.backend.springapp.gamification.battle.BattleParticipant;
import com.backend.springapp.gamification.battle.BattleParticipantRepository;
import com.backend.springapp.gamification.battle.BattleRepository;
import com.backend.springapp.gamification.battle.BattleState;
import com.backend.springapp.problem.Tag;
import net.javacrumbs.shedlock.core.DefaultLockingTaskExecutor;
import net.javacrumbs.shedlock.core.LockConfiguration;
import net.javacrumbs.shedlock.core.LockingTaskExecutor;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import javax.sql.DataSource;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;

/**
 * Two lock executors (two "instances") against one MySQL: a sleeping job body runs once per window, not twice.
 * Also proves checkExpiredBattles isolates per-battle failures (B15).
 */
@SpringBootTest
class SchedulingLockIT extends AbstractMysqlIT {

	@Autowired LockingTaskExecutor beanExecutor;
	@Autowired DataSource dataSource;
	@Autowired BattleLifecycleService lifecycle;
	@Autowired BattleRepository battleRepo;
	@MockitoSpyBean BattleParticipantRepository participantRepo;

	@Test
	void sleepingJobRunsOnceAcrossTwoInstances() throws Exception {
		LockingTaskExecutor other = new DefaultLockingTaskExecutor(new JdbcTemplateLockProvider(
				JdbcTemplateLockProvider.Configuration.builder()
						.withJdbcTemplate(new JdbcTemplate(dataSource)).usingDbTime().build()));
		AtomicInteger runs = new AtomicInteger();
		CyclicBarrier gate = new CyclicBarrier(2);
		ExecutorService pool = Executors.newFixedThreadPool(2);
		try {
			List<Future<?>> fs = List.of(
					pool.submit(() -> runOnce(beanExecutor, gate, runs)),
					pool.submit(() -> runOnce(other, gate, runs)));
			for (Future<?> f : fs) f.get(30, TimeUnit.SECONDS);
		} finally {
			pool.shutdownNow();
		}
		assertEquals(1, runs.get(), "job body must run once per lock window");
	}

	private static void runOnce(LockingTaskExecutor ex, CyclicBarrier gate, AtomicInteger runs) {
		try {
			gate.await(10, TimeUnit.SECONDS);
		} catch (Exception e) {
			throw new IllegalStateException(e);
		}
		ex.executeWithLock((Runnable) () -> {
			runs.incrementAndGet();
			try {
				Thread.sleep(1500);
			} catch (InterruptedException ignored) {
				Thread.currentThread().interrupt();
			}
		}, new LockConfiguration(Instant.now(), "it-sleeping-job", Duration.ofSeconds(30), Duration.ofSeconds(5)));
	}

	@Test
	void oneFailingBattleDoesNotStopTheOthers() {
		Battle poison = expiredBattle();
		Battle good = expiredBattle();
		doThrow(new IllegalStateException("poison battle")).when(participantRepo).findByBattleId(eq(poison.getId()));

		lifecycle.checkExpiredBattles();

		assertEquals(BattleState.ACTIVE, battleRepo.findById(poison.getId()).orElseThrow().getState(),
				"the failing battle rolled back on its own");
		assertEquals(BattleState.CANCELLED, battleRepo.findById(good.getId()).orElseThrow().getState(),
				"the healthy battle was still processed (one participant -> NO_OPPONENT cancel)");
	}

	/** One-participant battle with an expired timer: completion cancels it as NO_OPPONENT. */
	private Battle expiredBattle() {
		Battle b = new Battle();
		b.setMode(BattleMode.RANKED_1V1);
		b.setState(BattleState.ACTIVE);
		b.setDifficulty(Tag.EASY);
		b.setProblemCount(1);
		b.setDurationMinutes(1);
		b.setStartedAt(LocalDateTime.now().minusHours(24)); // far past: JVM and container clocks may sit in different zones
		b = battleRepo.saveAndFlush(b);
		BattleParticipant p = new BattleParticipant();
		p.setBattleId(b.getId());
		p.setUserId(2_000_000L + b.getId());
		participantRepo.saveAndFlush(p);
		return b;
	}
}
