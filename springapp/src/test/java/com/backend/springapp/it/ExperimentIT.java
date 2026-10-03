package com.backend.springapp.it;

import com.backend.springapp.experiments.BattleExperimentRepository;
import com.backend.springapp.experiments.ExperimentController;
import com.backend.springapp.experiments.ExperimentHasher;
import com.backend.springapp.experiments.ExperimentService;
import com.backend.springapp.gamification.battle.Battle;
import com.backend.springapp.gamification.battle.BattleMode;
import com.backend.springapp.gamification.battle.BattleRepository;
import com.backend.springapp.gamification.battle.BattleState;
import com.backend.springapp.problem.Tag;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Assignment is deterministic and stored once; disabled writes nothing; the report is token-guarded (fail closed)
 * and returns the right counts per variant. The controller is exercised standalone so the JWT servlet filter
 * (owned elsewhere) is out of the picture.
 */
@SpringBootTest
class ExperimentIT extends AbstractMysqlIT {

	@Autowired ExperimentService service;
	@Autowired ExperimentController controller;
	@Autowired BattleExperimentRepository expRepo;
	@Autowired BattleRepository battleRepo;
	@Autowired JdbcTemplate jdbc;

	@BeforeEach
	void clean() {
		jdbc.update("DELETE FROM battle_experiments");
		jdbc.update("DELETE FROM battle_participants");
		jdbc.update("DELETE FROM battles");
		ReflectionTestUtils.setField(service, "enabled", false);
		ReflectionTestUtils.setField(controller, "adminToken", "s3cret");
	}

	private Battle battle(BattleState state, String reason, LocalDateTime start, LocalDateTime end) {
		Battle b = new Battle();
		b.setMode(BattleMode.CASUAL_1V1);
		b.setDifficulty(Tag.EASY);
		b.setProblemCount(2);
		b.setDurationMinutes(15);
		b.setState(state);
		b.setStartedAt(start);
		b.setCompletedAt(end);
		b.setEndedReason(reason);
		return battleRepo.saveAndFlush(b);
	}

	private void participant(long battleId, long userId, int solved) {
		jdbc.update("INSERT INTO battle_participants (battle_id, user_id, is_ready, problems_solved, total_submissions, "
				+ "total_solve_time_ms, rating_before, group_score, forfeited) VALUES (?,?,0,?,0,0,1200,0,0)",
				battleId, userId, solved);
	}

	@Test
	void disabledWritesNothingAndIsControl() {
		Battle b = battle(BattleState.WAITING, null, null, null);
		assertEquals("control", service.assignOnCreate(b.getId(), BattleMode.CASUAL_1V1));
		assertEquals(0, expRepo.count());
		assertEquals(false, service.isTreatment(b.getId()));
	}

	@Test
	void enabledAssignsByHashStoresOnceAndSkipsGroup() {
		ReflectionTestUtils.setField(service, "enabled", true);
		int treatment = 0;
		for (int i = 0; i < 20; i++) {
			Battle b = battle(BattleState.WAITING, null, null, null);
			String v = service.assignOnCreate(b.getId(), BattleMode.RANKED_1V1);
			assertEquals(ExperimentHasher.variant("first-finisher-ends", b.getId(), 5000), v);
			assertEquals("treatment".equals(v), service.isTreatment(b.getId()));
			if (v.equals("treatment")) treatment++;
		}
		assertEquals(20, expRepo.count());
		Battle g = battle(BattleState.WAITING, null, null, null);
		service.assignOnCreate(g.getId(), BattleMode.GROUP_FFA);
		assertEquals(20, expRepo.count());
	}

	@Test
	void reportRequiresTokenAndCountsCorrectly() throws Exception {
		ReflectionTestUtils.setField(service, "enabled", true);
		LocalDateTime t0 = LocalDateTime.of(2026, 1, 1, 10, 0, 0);
		// control: one completed (120s, 2+1 solved), one cancelled; treatment: one completed by forfeit (60s, 1+0)
		Battle c1 = battle(BattleState.COMPLETED, "TIMEOUT", t0, t0.plusSeconds(120));
		Battle c2 = battle(BattleState.CANCELLED, "LOBBY_TIMEOUT", null, t0);
		Battle t1 = battle(BattleState.COMPLETED, "FORFEIT", t0, t0.plusSeconds(60));
		LocalDateTime now = LocalDateTime.now();
		jdbc.update("INSERT INTO battle_experiments (battle_id, experiment_key, variant, assigned_at) VALUES (?,?,?,?)", c1.getId(), "first-finisher-ends", "control", now);
		jdbc.update("INSERT INTO battle_experiments (battle_id, experiment_key, variant, assigned_at) VALUES (?,?,?,?)", c2.getId(), "first-finisher-ends", "control", now);
		jdbc.update("INSERT INTO battle_experiments (battle_id, experiment_key, variant, assigned_at) VALUES (?,?,?,?)", t1.getId(), "first-finisher-ends", "treatment", now);
		participant(c1.getId(), 9001, 2);
		participant(c1.getId(), 9002, 1);
		participant(t1.getId(), 9003, 1);
		participant(t1.getId(), 9004, 0);

		MockMvc mvc = MockMvcBuilders.standaloneSetup(controller).build();
		String url = "/api/experiments/first-finisher-ends/report";
		mvc.perform(get(url)).andExpect(status().isForbidden());
		mvc.perform(get(url).header("X-Admin-Token", "wrong")).andExpect(status().isForbidden());

		mvc.perform(get(url).header("X-Admin-Token", "s3cret"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.experimentKey").value("first-finisher-ends"))
				.andExpect(jsonPath("$.enabled").value(true))
				.andExpect(jsonPath("$.variants[0].variant").value("control"))
				.andExpect(jsonPath("$.variants[0].battles").value(2))
				.andExpect(jsonPath("$.variants[0].completed").value(1))
				.andExpect(jsonPath("$.variants[0].cancelled").value(1))
				.andExpect(jsonPath("$.variants[0].forfeited").value(0))
				.andExpect(jsonPath("$.variants[0].meanDurationSeconds").value(120.0))
				.andExpect(jsonPath("$.variants[0].meanProblemsSolvedPerPlayer").value(1.5))
				.andExpect(jsonPath("$.variants[1].variant").value("treatment"))
				.andExpect(jsonPath("$.variants[1].battles").value(1))
				.andExpect(jsonPath("$.variants[1].forfeited").value(1))
				.andExpect(jsonPath("$.variants[1].meanDurationSeconds").value(60.0))
				.andExpect(jsonPath("$.variants[1].meanProblemsSolvedPerPlayer").value(0.5));

		// blank configured token fails closed even with a blank header
		ReflectionTestUtils.setField(controller, "adminToken", "");
		mvc.perform(get(url).header("X-Admin-Token", "")).andExpect(status().isForbidden());
	}
}
