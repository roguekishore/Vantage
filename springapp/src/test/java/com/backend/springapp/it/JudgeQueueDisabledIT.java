package com.backend.springapp.it;

import com.backend.springapp.common.JwtUtil;
import com.backend.springapp.gamification.battle.*;
import com.backend.springapp.judge.queue.JudgeJobRepository;
import com.backend.springapp.problem.Tag;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

/** With vantage.judge.queue.enabled=false (its own Spring context) a submit judges inline and returns 200. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class JudgeQueueDisabledIT extends AbstractMysqlIT {

	static HttpServer stub;

	static {
		try {
			stub = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
			stub.setExecutor(Executors.newCachedThreadPool());
			stub.createContext("/api/problems", ex -> reply(ex, "[]"));
			stub.createContext("/api/internal/problems/", ex -> reply(ex, "{\"testCases\":[{\"input\":\"1\",\"expectedOutput\":\"1\"}]}"));
			stub.createContext("/api/submit", ex -> reply(ex, "{\"status\":\"Accepted\",\"time\":12,\"results\":[{\"passed\":true}]}"));
			stub.start();
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	@DynamicPropertySource
	static void props(DynamicPropertyRegistry r) {
		String stubUrl = "http://127.0.0.1:" + stub.getAddress().getPort();
		r.add("judge.base-url", () -> stubUrl);
		r.add("catalog.base-url", () -> stubUrl);
		r.add("vantage.judge.queue.enabled", () -> "false");
	}

	@LocalServerPort int port;
	@Autowired JwtUtil jwtUtil;
	@Autowired ObjectMapper mapper;
	@Autowired BattleRepository battleRepo;
	@Autowired BattleParticipantRepository participantRepo;
	@Autowired BattleProblemRepository battleProblemRepo;
	@Autowired BattleSubmissionRepository submissionRepo;
	@Autowired JudgeJobRepository jobs;

	@Test
	void queueDisabledPathStillReturns200WithSubmitResult() throws Exception {
		long u1 = 6_000_001L, u2 = 6_000_002L;
		Battle b = new Battle();
		b.setMode(BattleMode.RANKED_1V1);
		b.setState(BattleState.ACTIVE);
		b.setDifficulty(Tag.EASY);
		b.setProblemCount(1);
		b.setDurationMinutes(30);
		b.setStartedAt(LocalDateTime.now().minusMinutes(1));
		b = battleRepo.saveAndFlush(b);
		for (long u : new long[] {u1, u2}) {
			BattleParticipant p = new BattleParticipant();
			p.setBattleId(b.getId());
			p.setUserId(u);
			participantRepo.saveAndFlush(p);
		}
		BattleProblem bp = new BattleProblem();
		bp.setBattleId(b.getId());
		bp.setProblemId(1L);
		bp.setJudgeProblemId("two-sum");
		bp.setProblemIndex(0);
		battleProblemRepo.saveAndFlush(bp);

		HttpResponse<String> res = HttpClient.newHttpClient().send(HttpRequest.newBuilder(
				URI.create("http://localhost:" + port + "/api/battle/" + b.getId() + "/submit"))
				.header("Content-Type", "application/json")
				.header("Authorization", "Bearer " + jwtUtil.generateToken(u1, "u" + u1, "u" + u1 + "@x.io"))
				.POST(HttpRequest.BodyPublishers.ofString("{\"userId\":" + u1 + ",\"problemIndex\":0,\"language\":\"python\",\"code\":\"print(1)\"}"))
				.build(), HttpResponse.BodyHandlers.ofString());
		assertEquals(200, res.statusCode(), res.body());
		JsonNode body = mapper.readTree(res.body());
		assertEquals("ACCEPTED", body.get("verdict").asString());
		assertEquals(1, body.get("problemsSolved").asInt());
		assertTrue(jobs.findAll().stream().noneMatch(j -> j.getUserId().equals(u1)), "no job created");
		assertEquals(1, submissionRepo.findByBattleIdAndUserId(b.getId(), u1).size());
	}

	static void reply(HttpExchange ex, String json) throws IOException {
		byte[] b = json.getBytes(StandardCharsets.UTF_8);
		ex.getResponseHeaders().set("Content-Type", "application/json");
		ex.sendResponseHeaders(200, b.length);
		ex.getResponseBody().write(b);
		ex.close();
	}
}
