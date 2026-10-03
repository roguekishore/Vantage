package com.backend.springapp.it;

import com.backend.springapp.common.JwtUtil;
import com.backend.springapp.gamification.battle.*;
import com.backend.springapp.judge.queue.*;
import com.backend.springapp.problem.Tag;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import software.amazon.awssdk.auth.credentials.AnonymousCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.BooleanSupplier;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Judge queue end to end: real MySQL, real SQS protocol (ElasticMQ), and an in-test HTTP server standing in for the
 * judge and catalog. Covers (a) idempotency, (b) redelivery after a dead consumer, (c) judge outage, (d) two consumers
 * on one message, (e) battle ending mid-queue, and (f) the queue-disabled path (in JudgeQueueDisabledIT, which needs its own context with enabled=false).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class JudgeQueueIT extends AbstractMysqlIT {

	static final GenericContainer<?> ELASTICMQ = new GenericContainer<>("softwaremill/elasticmq-native:1.6.11")
			.withExposedPorts(9324).waitingFor(Wait.forListeningPort());
	static final String QUEUE_NAME = "judge-jobs";
	static String endpoint;
	static String queueUrl;
	static SqsClient sqs;

	static HttpServer stub;
	static final AtomicInteger judgeCalls = new AtomicInteger();
	static final AtomicInteger judgeFailuresLeft = new AtomicInteger(); // negative = fail forever
	static volatile int judgeDelayMs = 0;

	static {
		ELASTICMQ.start();
		System.setProperty("aws.accessKeyId", "x"); // ElasticMQ ignores credentials, the SDK still wants some
		System.setProperty("aws.secretAccessKey", "x");
		endpoint = "http://" + ELASTICMQ.getHost() + ":" + ELASTICMQ.getMappedPort(9324);
		sqs = SqsClient.builder().region(Region.of("ap-south-1")).endpointOverride(URI.create(endpoint))
				.httpClientBuilder(UrlConnectionHttpClient.builder()).credentialsProvider(AnonymousCredentialsProvider.create()).build();
		String dlq = sqs.createQueue(CreateQueueRequest.builder().queueName(QUEUE_NAME + "-dlq").build()).queueUrl();
		String dlqArn = sqs.getQueueAttributes(GetQueueAttributesRequest.builder().queueUrl(dlq)
				.attributeNames(QueueAttributeName.QUEUE_ARN).build()).attributes().get(QueueAttributeName.QUEUE_ARN);
		queueUrl = sqs.createQueue(CreateQueueRequest.builder().queueName(QUEUE_NAME).attributes(Map.of(
				QueueAttributeName.REDRIVE_POLICY, "{\"maxReceiveCount\":\"3\",\"deadLetterTargetArn\":\"" + dlqArn + "\"}")).build()).queueUrl();
		try {
			stub = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
			stub.setExecutor(Executors.newCachedThreadPool());
			stub.createContext("/api/problems", ex -> reply(ex, 200, "[]"));
			stub.createContext("/api/internal/problems/", ex -> reply(ex, 200,
					"{\"testCases\":[{\"input\":\"1\",\"expectedOutput\":\"1\"}]}"));
			stub.createContext("/api/submit", ex -> {
				judgeCalls.incrementAndGet();
				sleep(judgeDelayMs);
				if (judgeFailuresLeft.get() < 0 || judgeFailuresLeft.getAndDecrement() > 0) {
					reply(ex, 503, "{\"error\":\"down\"}");
				} else {
					reply(ex, 200, "{\"status\":\"Accepted\",\"time\":12,\"results\":[{\"passed\":true}]}");
				}
			});
			stub.start();
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	@DynamicPropertySource
	static void queueProps(DynamicPropertyRegistry r) {
		String stubUrl = "http://127.0.0.1:" + stub.getAddress().getPort();
		r.add("judge.base-url", () -> stubUrl);
		r.add("catalog.base-url", () -> stubUrl);
		r.add("vantage.judge.queue.enabled", () -> "true");
		r.add("vantage.judge.queue.url", () -> queueUrl);
		r.add("vantage.judge.queue.endpoint", () -> endpoint);
		r.add("vantage.judge.queue.consumers", () -> "2");
		r.add("vantage.judge.queue.visibility-seconds", () -> "3");
		r.add("vantage.judge.queue.lease-seconds", () -> "2");
		r.add("vantage.judge.queue.max-attempts", () -> "3");
	}

	@LocalServerPort int port;
	@Autowired JwtUtil jwtUtil;
	@Autowired ObjectMapper mapper;
	@Autowired BattleRepository battleRepo;
	@Autowired BattleParticipantRepository participantRepo;
	@Autowired BattleProblemRepository battleProblemRepo;
	@Autowired BattleSubmissionRepository submissionRepo;
	@Autowired JudgeJobRepository jobs;
	@Autowired JudgeJobProcessor processor;
	@Autowired JudgeJobClaimer claimer;
	@Autowired JudgeJobProducer producer;
	@Autowired JudgeJobRequeuer requeuer;
	@Autowired JudgeQueueConsumer consumer;
	@Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

	final HttpClient http = HttpClient.newHttpClient();
	static final AtomicLong USERS = new AtomicLong(5_000_000);

	@BeforeEach
	void resetStub() {
		judgeCalls.set(0);
		judgeFailuresLeft.set(0);
		judgeDelayMs = 0;
	}

	// (a) ---------------------------------------------------------------------------------------------------------
	@Test
	void sameIdempotencyKeySentFiveTimesConcurrentlyMakesOneJobAndOneSubmission() throws Exception {
		Fixture f = newBattle();
		String key = "idem-" + UUID.randomUUID();
		ExecutorService pool = Executors.newFixedThreadPool(5);
		CyclicBarrier gate = new CyclicBarrier(5);
		List<Future<HttpResponse<String>>> calls = new ArrayList<>();
		for (int i = 0; i < 5; i++) {
			calls.add(pool.submit(() -> {
				gate.await(10, TimeUnit.SECONDS);
				return post(f, key);
			}));
		}
		Set<Long> jobIds = new HashSet<>();
		for (Future<HttpResponse<String>> c : calls) {
			HttpResponse<String> res = c.get(30, TimeUnit.SECONDS);
			assertEquals(202, res.statusCode(), res.body());
			jobIds.add(mapper.readTree(res.body()).get("jobId").asLong());
		}
		pool.shutdown();
		assertEquals(1, jobIds.size(), "all five answers name the same job");
		assertEquals(1, jobs.findAll().stream().filter(j -> j.getUserId().equals(f.u1) && key.equals(j.getIdempotencyKey())).count());

		long jobId = jobIds.iterator().next();
		await("job DONE", () -> status(f, jobId).equals("DONE"));
		assertEquals(1, submissionRepo.findByBattleIdAndUserId(f.battleId, f.u1).size(), "one submission");
		assertEquals(1, judgeCalls.get(), "judged once");
		JsonNode done = mapper.readTree(get(f, jobId).body());
		assertEquals("ACCEPTED", done.get("result").get("verdict").asString());
	}

	// (b) ---------------------------------------------------------------------------------------------------------
	@Test
	void consumerDyingAfterClaimLeadsToRedeliveryAndExactlyOneFinalize() throws Exception {
		Fixture f = newBattle();
		consumer.stop(); // we play the consumer for the first delivery
		try {
			HttpResponse<String> res = post(f, "idem-" + UUID.randomUUID());
			assertEquals(202, res.statusCode(), res.body());
			long jobId = mapper.readTree(res.body()).get("jobId").asLong();

			Message m = receiveOne(30);
			assertEquals("{\"v\":1,\"jobId\":" + jobId + "}", m.body());
			assertEquals(1, claimer.claim(jobId).getAsInt()); // claimed ... then the "process" is killed: no judge, no delete
		} finally {
			consumer.start();
		}
		long jobId = jobs.findAll().stream().filter(j -> j.getUserId().equals(f.u1)).findFirst().orElseThrow().getId();
		await("redelivered job DONE", () -> status(f, jobId).equals("DONE"));
		assertEquals(2, jobs.findById(jobId).orElseThrow().getAttempts(), "second attempt finished it");
		assertEquals(1, submissionRepo.findByBattleIdAndUserId(f.battleId, f.u1).size());
		assertEquals(1, judgeCalls.get());
	}

	// (c) ---------------------------------------------------------------------------------------------------------
	@Test
	void judgeReturning503ThreeTimesFailsTheJobAndRecordsNothing() throws Exception {
		Fixture f = newBattle();
		judgeFailuresLeft.set(-1); // always 503
		HttpResponse<String> res = post(f, "idem-" + UUID.randomUUID());
		assertEquals(202, res.statusCode(), res.body());
		long jobId = mapper.readTree(res.body()).get("jobId").asLong();

		await("job FAILED", () -> status(f, jobId).equals("FAILED"));
		JsonNode failed = mapper.readTree(get(f, jobId).body());
		assertEquals("judge unavailable", failed.get("error").asString());
		assertEquals(3, jobs.findById(jobId).orElseThrow().getAttempts());
		assertEquals(3, judgeCalls.get());
		assertTrue(submissionRepo.findByBattleIdAndUserId(f.battleId, f.u1).isEmpty(), "no battle_submissions row");
		assertTrue(submissionRepo.findByBattleIdAndUserId(f.battleId, f.u1).stream()
				.noneMatch(s -> s.getVerdict() == Verdict.RUNTIME_ERROR), "no RUNTIME_ERROR");
	}

	// (d) ---------------------------------------------------------------------------------------------------------
	@Test
	void twoConsumersOnOneMessageProduceExactlyOneFinalize() throws Exception {
		Fixture f = newBattle();
		long jobId = insertQueuedJob(f, "idem-" + UUID.randomUUID(), 0);
		judgeDelayMs = 800; // keep both attempts overlapping
		CyclicBarrier gate = new CyclicBarrier(2);
		ExecutorService pool = Executors.newFixedThreadPool(2);
		List<Future<Boolean>> both = new ArrayList<>();
		for (int i = 0; i < 2; i++) {
			both.add(pool.submit(() -> {
				gate.await(10, TimeUnit.SECONDS);
				return processor.process(jobId);
			}));
		}
		for (Future<Boolean> b : both) assertTrue(b.get(30, TimeUnit.SECONDS), "both may delete their message");
		pool.shutdown();
		assertEquals(1, judgeCalls.get(), "only the claim winner judged");
		assertEquals(1, submissionRepo.findByBattleIdAndUserId(f.battleId, f.u1).size(), "one finalize");
		assertEquals("DONE", jobs.findById(jobId).orElseThrow().getStatus());
	}

	// (e) ---------------------------------------------------------------------------------------------------------
	@Test
	void battleEndingWhileJobIsQueuedFailsTheJob() {
		Fixture f = newBattle();
		long jobId = insertQueuedJob(f, "idem-" + UUID.randomUUID(), 0);
		Battle b = battleRepo.findById(f.battleId).orElseThrow();
		b.setState(BattleState.COMPLETED);
		battleRepo.saveAndFlush(b);

		assertTrue(processor.process(jobId));
		JudgeJob job = jobs.findById(jobId).orElseThrow();
		assertEquals("FAILED", job.getStatus());
		assertEquals("battle ended before judging completed", job.getError());
		assertNull(job.getResultJson());
		assertTrue(submissionRepo.findByBattleIdAndUserId(f.battleId, f.u1).isEmpty());
	}

	@Test
	void queueEnabledWithoutIdempotencyKeyIsRejected() throws Exception {
		Fixture f = newBattle();
		HttpResponse<String> res = postNoKey(f);
		assertEquals(400, res.statusCode());
		assertTrue(res.body().contains("Idempotency-Key header required"));
	}

	@Test
	void requeuerResendsAJobWhoseMessageWasLost() throws Exception {
		Fixture f = newBattle();
		long jobId = insertQueuedJob(f, "idem-" + UUID.randomUUID(), 70); // never sent
		requeuer.requeue();
		await("requeued job DONE", () -> status(f, jobId).equals("DONE"));
		assertEquals(1, submissionRepo.findByBattleIdAndUserId(f.battleId, f.u1).size());
	}

	// helpers -----------------------------------------------------------------------------------------------------

	record Fixture(long battleId, long u1, long u2) {}

	Fixture newBattle() {
		long u1 = USERS.incrementAndGet(), u2 = USERS.incrementAndGet();
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
		return new Fixture(b.getId(), u1, u2);
	}

	/** Inserts with the DB clock (NOW(3)), then back-dates created_at/updated_at in SQL so no Java clock is involved. */
	long insertQueuedJob(Fixture f, String key, int ageSeconds) {
		jobs.insertQueued(f.battleId, f.u1, 0, "python", "print(1)", key);
		long id = jobs.findByUserIdAndIdempotencyKey(f.u1, key).orElseThrow().getId();
		jdbc.update("UPDATE judge_jobs SET created_at = NOW(3) - INTERVAL ? SECOND, updated_at = NOW(3) - INTERVAL ? SECOND WHERE id = ?",
				ageSeconds, ageSeconds, id);
		return id;
	}

	HttpResponse<String> post(Fixture f, String key) throws Exception {
		return http.send(request(f).header("Idempotency-Key", key).POST(body(f)).build(), HttpResponse.BodyHandlers.ofString());
	}

	HttpResponse<String> postNoKey(Fixture f) throws Exception {
		return http.send(request(f).POST(body(f)).build(), HttpResponse.BodyHandlers.ofString());
	}

	HttpRequest.Builder request(Fixture f) {
		return HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/battle/" + f.battleId + "/submit"))
				.header("Content-Type", "application/json")
				.header("Authorization", "Bearer " + jwtUtil.generateToken(f.u1, "u" + f.u1, "u" + f.u1 + "@x.io"));
	}

	HttpRequest.BodyPublisher body(Fixture f) {
		return HttpRequest.BodyPublishers.ofString("{\"userId\":" + f.u1 + ",\"problemIndex\":0,\"language\":\"python\",\"code\":\"print(1)\"}");
	}

	HttpResponse<String> get(Fixture f, long jobId) throws Exception {
		return http.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/battle/" + f.battleId
				+ "/submissions/" + jobId + "?userId=" + f.u1))
				.header("Authorization", "Bearer " + jwtUtil.generateToken(f.u1, "u" + f.u1, "u" + f.u1 + "@x.io")).GET().build(),
				HttpResponse.BodyHandlers.ofString());
	}

	String status(Fixture f, long jobId) {
		try {
			return mapper.readTree(get(f, jobId).body()).get("status").asString();
		} catch (Exception e) {
			return "ERR";
		}
	}

	Message receiveOne(int seconds) {
		long end = System.currentTimeMillis() + seconds * 1000L;
		while (System.currentTimeMillis() < end) {
			List<Message> ms = sqs.receiveMessage(ReceiveMessageRequest.builder().queueUrl(queueUrl)
					.maxNumberOfMessages(1).waitTimeSeconds(2).visibilityTimeout(3).build()).messages();
			if (!ms.isEmpty()) return ms.get(0);
		}
		throw new AssertionError("no SQS message arrived");
	}

	static void await(String what, BooleanSupplier cond) {
		long end = System.currentTimeMillis() + 60_000;
		while (System.currentTimeMillis() < end) {
			if (cond.getAsBoolean()) return;
			sleep(200);
		}
		fail("timed out waiting for " + what);
	}

	static void sleep(long ms) {
		if (ms <= 0) return;
		try {
			Thread.sleep(ms);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
	}

	static void reply(HttpExchange ex, int code, String json) throws IOException {
		byte[] b = json.getBytes(StandardCharsets.UTF_8);
		ex.getResponseHeaders().set("Content-Type", "application/json");
		ex.sendResponseHeaders(code, b.length);
		ex.getResponseBody().write(b);
		ex.close();
	}
}
