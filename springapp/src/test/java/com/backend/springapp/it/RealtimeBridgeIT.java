package com.backend.springapp.it;

import com.backend.springapp.SpringappApplication;
import com.backend.springapp.common.JwtUtil;
import com.backend.springapp.realtime.RealtimePublisher;
import com.backend.springapp.sse.ProgressEvent;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.testcontainers.containers.GenericContainer;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Three real application contexts: A and B bridge through one Redis (different instance ids), C has the bridge off
 * and gives the reference "local delivery" bytes. Everything shares one MySQL.
 */
class RealtimeBridgeIT extends AbstractMysqlIT {

	static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);
	static ConfigurableApplicationContext a, b, c;
	static int portA, portB, portC;

	/** Own database on the shared container so create-drop here never drops the schema other ITs use. */
	static String bridgeUrl() {
		String base = MYSQL.getJdbcUrl();
		int q = base.indexOf('?');
		String noQuery = q < 0 ? base : base.substring(0, q);
		String query = q < 0 ? "" : base.substring(q + 1);
		String url = noQuery.substring(0, noQuery.lastIndexOf('/') + 1) + "rt_bridge?createDatabaseIfNotExist=true";
		return query.isEmpty() ? url : url + "&" + query;
	}

	static ConfigurableApplicationContext boot(String id, boolean redis, String ddl) {
		return new SpringApplicationBuilder(SpringappApplication.class).run(
				"--spring.profiles.active=test",
				"--server.port=0",
				"--spring.datasource.url=" + bridgeUrl(),
				"--spring.datasource.username=root",
				"--spring.datasource.password=" + MYSQL.getPassword(),
				"--spring.jpa.hibernate.ddl-auto=" + ddl,
				"--spring.main.banner-mode=off",
				"--vantage.instance-id=" + id,
				"--vantage.realtime.redis.enabled=" + redis,
				"--spring.data.redis.host=" + REDIS.getHost(),
				"--spring.data.redis.port=" + REDIS.getMappedPort(6379),
				"--cors.allowed-origins=http://localhost");
	}

	static int port(ConfigurableApplicationContext ctx) {
		return Integer.parseInt(ctx.getEnvironment().getProperty("local.server.port"));
	}

	@BeforeAll
	static void start() {
		REDIS.start();
		a = boot("instance-a", true, "create-drop");
		b = boot("instance-b", true, "none");
		c = boot("instance-c", false, "none");
		portA = port(a);
		portB = port(b);
		portC = port(c);
	}

	@AfterAll
	static void stop() {
		for (ConfigurableApplicationContext ctx : new ConfigurableApplicationContext[] {c, b, a}) {
			if (ctx != null) ctx.close();
		}
		REDIS.stop();
	}

	static StompSession connect(ConfigurableApplicationContext ctx, int port, long uid) throws Exception {
		WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
		// frames are application/json; hand the raw text to the test so bytes can be compared
		client.setMessageConverter(new StringMessageConverter() {
			@Override
			protected boolean supportsMimeType(org.springframework.messaging.MessageHeaders headers) {
				return true;
			}
		});
		StompHeaders connect = new StompHeaders();
		connect.add("Authorization", "Bearer " + ctx.getBean(JwtUtil.class).generateToken(uid, "u" + uid, "u" + uid + "@x.io"));
		WebSocketHttpHeaders ws = new WebSocketHttpHeaders();
		ws.setOrigin("http://localhost");
		return client.connectAsync("ws://localhost:" + port + "/ws/websocket", ws, connect,
				new StompSessionHandlerAdapter() {}).get(20, TimeUnit.SECONDS);
	}

	static BlockingQueue<String> subscribe(StompSession s, String dest) {
		BlockingQueue<String> q = new LinkedBlockingQueue<>();
		s.subscribe(dest, new StompFrameHandler() {
			@Override public Type getPayloadType(StompHeaders h) { return String.class; }
			@Override public void handleFrame(StompHeaders h, Object p) { q.add((String) p); }
		});
		return q;
	}

	record Probe(String name, int n) {}

	@Test
	void topicBridgedFromAReachesSubscriberOnB_byteIdenticalToLocal() throws Exception {
		StompSession onB = connect(b, portB, 1L);
		StompSession onC = connect(c, portC, 1L);
		BlockingQueue<String> viaB = subscribe(onB, "/topic/test/probe");
		BlockingQueue<String> local = subscribe(onC, "/topic/test/probe");
		Thread.sleep(1500); // let the SUBSCRIBE frames and the Redis listener settle

		Probe payload = new Probe("hello é", 7);
		a.getBean(RealtimePublisher.class).toTopic("/topic/test/probe", payload);
		c.getBean(RealtimePublisher.class).toTopic("/topic/test/probe", payload);

		String bridged = viaB.poll(10, TimeUnit.SECONDS);
		String reference = local.poll(10, TimeUnit.SECONDS);
		assertNotNull(reference, "local reference delivery on C got nothing");
		assertNotNull(bridged, "subscriber on B got nothing from A");
		assertEquals(reference, bridged);
		onB.disconnect();
		onC.disconnect();
	}

	/** Opens an SSE stream on the given instance, returns the queue of raw "data:" lines for progress-update events. */
	static BlockingQueue<String> sse(ConfigurableApplicationContext ctx, int port, long uid) throws Exception {
		BlockingQueue<String> q = new LinkedBlockingQueue<>();
		String token = ctx.getBean(JwtUtil.class).generateToken(uid, "u" + uid, "u" + uid + "@x.io");
		HttpResponse<java.io.InputStream> resp = HttpClient.newHttpClient().send(
				HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/progress/stream"))
						.header("Authorization", "Bearer " + token).build(),
				HttpResponse.BodyHandlers.ofInputStream());
		assertEquals(200, resp.statusCode());
		Thread t = new Thread(() -> {
			try (BufferedReader r = new BufferedReader(new InputStreamReader(resp.body()))) {
				String line, event = null;
				while ((line = r.readLine()) != null) {
					if (line.startsWith("event:")) event = line.substring(6).trim();
					else if (line.startsWith("data:") && "progress-update".equals(event)) q.add(line.substring(5).trim());
				}
			} catch (Exception ignored) {
				// stream closed on shutdown
			}
		});
		t.setDaemon(true);
		t.start();
		return q;
	}

	@Test
	void sseBridgedFromAReachesSubscriberOnB_byteIdenticalToLocal() throws Exception {
		long uid = 42L;
		BlockingQueue<String> viaB = sse(b, portB, uid);
		BlockingQueue<String> local = sse(c, portC, uid);
		Thread.sleep(1000);

		ProgressEvent ev = new ProgressEvent(9L, "SOLVED", "two-sum", 3);
		a.getBean(RealtimePublisher.class).toUserSse(uid, ev);
		c.getBean(RealtimePublisher.class).toUserSse(uid, ev);

		String bridged = viaB.poll(10, TimeUnit.SECONDS);
		String reference = local.poll(10, TimeUnit.SECONDS);
		assertNotNull(bridged, "SSE subscriber on B got nothing from A");
		assertNotNull(reference);
		assertEquals(reference, bridged);
	}

	@Test
	void clientSendToTopicIsRejectedAndNeverDelivered() throws Exception {
		StompSession victim = connect(b, portB, 2L);
		BlockingQueue<String> q = subscribe(victim, "/topic/x");
		StompSession attacker = connect(a, portA, 3L);
		Thread.sleep(1000);

		attacker.send("/topic/x", "spoofed");
		Thread.sleep(2000);

		assertTrue(q.isEmpty(), "spoofed client SEND reached a subscriber: " + q);
		assertTrue(!attacker.isConnected(), "server should close the session after rejecting SEND");
		victim.disconnect();
	}
}
