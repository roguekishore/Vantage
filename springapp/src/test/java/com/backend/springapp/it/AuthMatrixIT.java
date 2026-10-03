package com.backend.springapp.it;

import com.backend.springapp.common.AdminTokenGuard;
import com.backend.springapp.common.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.mock.web.MockHttpServletRequest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Auth matrix. Every route that the auth matrix protects is called four ways: anonymous, user A acting for user B, user A acting
 * for A, and admin (X-Admin-Token only, no JWT). {T} in a path/body is the id being acted for. Fresh users per cell so
 * destructive rows (DELETE) cannot disturb each other. REACH means "got past auth": anything but 401/403.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
		properties = {"vantage.admin.token=matrix-admin-token", "cors.allowed-origins=http://localhost"})
class AuthMatrixIT extends AbstractMysqlIT {

	static final String ADMIN = "matrix-admin-token";
	static final int REACH = -1;
	static final AtomicInteger SEQ = new AtomicInteger();

	@LocalServerPort int port;
	@Autowired JwtUtil jwtUtil;

	final HttpClient http = HttpClient.newHttpClient();

	/** One matrix row. Columns: anonymous, A for B, A for A, admin. */
	record Row(String name, String method, String path, String body, int anon, int aForB, int aForA, int admin) {}

	static final String USER_BODY = "{\"username\":\"%s\",\"email\":\"%s@x.io\",\"password\":\"password123\"}";
	static final String PROBLEM_BODY = "{\"title\":\"P\",\"tag\":\"EASY\",\"hasVisualizer\":false}";

	static List<Row> matrix() {
		List<Row> r = new ArrayList<>();
		// S1
		r.add(new Row("auth me", "GET", "/api/auth/me?userId={T}", null, 401, 200, 200, 401));
		r.add(new Row("auth extension token", "POST", "/api/auth/extension/token?userId={T}", null, 401, 200, 200, 401));
		// S2
		r.add(new Row("users list", "GET", "/api/users", null, 401, 403, 403, 200));
		r.add(new Row("users get", "GET", "/api/users/{T}", null, 401, 403, 200, 200));
		r.add(new Row("users create", "POST", "/api/users", "{USER}", 401, 403, 403, 201));
		r.add(new Row("users update", "PUT", "/api/users/{T}", "{USER}", 401, 403, 200, 200));
		r.add(new Row("users delete", "DELETE", "/api/users/{T}", null, 401, 403, 204, 204));
		r.add(new Row("users stats", "GET", "/api/users/{T}/stats", null, 401, REACH, REACH, 401));
		r.add(new Row("users achievements", "GET", "/api/users/{T}/achievements", null, 401, REACH, REACH, 401));
		// S3
		r.add(new Row("problems create", "POST", "/api/problems", PROBLEM_BODY, 401, 403, 403, 201));
		r.add(new Row("problems update", "PUT", "/api/problems/{P}", PROBLEM_BODY, 401, 403, 403, 200));
		r.add(new Row("problems delete", "DELETE", "/api/problems/{P}", null, 401, 403, 403, 204));
		r.add(new Row("institutions create", "POST", "/api/institutions", "{\"name\":\"Inst {N}\"}", 401, 403, 403, 200));
		// experiments report: admin-token guarded in its own controller, reachable without a JWT
		r.add(new Row("experiments report", "GET", "/api/experiments/first-finisher-ends/report", null, 403, 403, 403, 200));
		// B16 and the rest of BattleController
		r.add(new Row("battle queue join", "POST", "/api/battle/queue",
				"{\"userId\":{T},\"mode\":\"CASUAL_1V1\",\"difficulty\":\"EASY\",\"problemCount\":1}", 401, 403, REACH, 401));
		r.add(new Row("battle queue status", "GET", "/api/battle/queue/status?userId={T}", null, 401, 403, 200, 401));
		r.add(new Row("battle queue leave", "DELETE", "/api/battle/queue?userId={T}", null, 401, 403, 204, 401));
		r.add(new Row("battle get", "GET", "/api/battle/999999?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle ready", "POST", "/api/battle/999999/ready", "{\"userId\":{T},\"language\":\"java\"}", 401, 403, REACH, 401));
		r.add(new Row("battle state", "GET", "/api/battle/999999/state?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle submit", "POST", "/api/battle/999999/submit",
				"{\"userId\":{T},\"problemIndex\":0,\"language\":\"java\",\"code\":\"x\"}", 401, 403, REACH, 401));
		r.add(new Row("battle result", "GET", "/api/battle/999999/result?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle forfeit", "POST", "/api/battle/999999/forfeit?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle abandon", "POST", "/api/battle/999999/abandon?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle history", "GET", "/api/battle/history?userId={T}", null, 401, 403, 200, 401));
		r.add(new Row("battle room create", "POST", "/api/battle/room?userId={T}",
				"{\"mode\":\"GROUP_FFA\",\"difficulty\":\"EASY\",\"problemCount\":1,\"maxPlayers\":3,\"durationMinutes\":0}",
				401, 403, REACH, 401));
		r.add(new Row("battle room join", "POST", "/api/battle/room/ZZZZZZ/join?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle room leave", "POST", "/api/battle/room/ZZZZZZ/leave?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle room kick", "POST", "/api/battle/room/ZZZZZZ/kick/{U}?kickerId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle room start", "POST", "/api/battle/room/ZZZZZZ/start?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle group state", "GET", "/api/battle/999999/group-state?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle group result", "GET", "/api/battle/999999/group-result?userId={T}", null, 401, 403, REACH, 401));
		r.add(new Row("battle active", "GET", "/api/battle/active?userId={T}", null, 401, 204, 204, 401));
		return r;
	}

	@Test
	void everyRouteAsAnonymousAForBAForAAndAdmin() throws Exception {
		List<String> failures = new ArrayList<>();
		List<Row> rows = matrix();
		for (Row row : rows) {
			String[] who = {"anon", "A-for-B", "A-for-A", "admin"};
			int[] want = {row.anon(), row.aForB(), row.aForA(), row.admin()};
			for (int col = 0; col < 4; col++) {
				long[] ids = signup(), ids2 = null;
				long a = ids[0], b = ids[1];
				String tokenA = token(a);
				long target = (col == 2) ? a : b;
				Long problem = row.path().contains("{P}") ? createProblemAsAdmin() : null;
				String path = fill(row.path(), target, b, problem);
				String body = row.body() == null ? null : fill(row.body(), target, b, problem);
				HttpRequest.Builder req = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
						.header("Content-Type", "application/json");
				if (col == 1 || col == 2) req.header("Authorization", "Bearer " + tokenA);
				if (col == 3) req.header("X-Admin-Token", ADMIN);
				req.method(row.method(), body == null ? HttpRequest.BodyPublishers.noBody()
						: HttpRequest.BodyPublishers.ofString(body));
				HttpResponse<String> res = http.send(req.build(), HttpResponse.BodyHandlers.ofString());
				int got = res.statusCode();
				boolean ok = want[col] == REACH ? (got != 401 && got != 403) : got == want[col];
				System.out.println("MATRIX " + row.name() + " / " + who[col] + " -> " + got + (ok ? "" : "   EXPECTED " + want[col]));
				if (!ok) failures.add(row.name() + " / " + who[col] + ": got " + got + " want "
						+ (want[col] == REACH ? "not 401/403" : want[col]) + " body=" + res.body());
			}
		}
		System.out.println("MATRIX rows=" + rows.size() + " cells=" + rows.size() * 4);
		assertTrue(failures.isEmpty(), String.join("\n", failures));
	}

	@Test
	void queryUserIdIsNeverAnIdentity() throws Exception {
		long[] u = signup();
		// anonymous with ?userId= must not read a profile nor mint a token (S1)
		assertEquals(401, send("GET", "/api/auth/me?userId=" + u[1], null, null).statusCode());
		assertEquals(401, send("POST", "/api/auth/extension/token?userId=" + u[1], null, null).statusCode());
		// A passing ?userId=B gets A's own profile and an A token, never B's
		HttpResponse<String> me = send("GET", "/api/auth/me?userId=" + u[1], token(u[0]), null);
		assertEquals(200, me.statusCode());
		assertEquals(u[0], jsonLong(me.body(), "uid"));
		HttpResponse<String> ext = send("POST", "/api/auth/extension/token?userId=" + u[1], token(u[0]), null);
		assertEquals(200, ext.statusCode());
		String minted = jsonString(ext.body(), "token");
		assertEquals(u[0], jwtUtil.extractUserId(minted));
		assertEquals("ext", jwtUtil.extractScope(minted));
	}

	/** The browser extension popup reads its linked account with the scoped token; it must not need (or get) more. */
	@Test
	void extensionTokenReadsOnlyItsOwnSyncProfile() throws Exception {
		long[] u = signup();
		String ext = jwtUtil.generateToken(u[0], "u" + u[0], "u" + u[0] + "@x.io", "ext", 60_000);
		// anonymous: 401
		assertEquals(401, send("GET", "/api/sync/profile", null, null).statusCode());
		// ext token: own summary only, whatever else the client sends
		HttpResponse<String> own = send("GET", "/api/sync/profile?userId=" + u[1], ext, null);
		assertEquals(200, own.statusCode(), own.body());
		assertEquals(u[0], jsonLong(own.body(), "uid"));
		assertFalse(own.body().contains("email"), "profile summary must not expose the email: " + own.body());
		// the scoped token still cannot read the full profile route, even its own
		assertEquals(403, send("GET", "/api/users/" + u[0], ext, null).statusCode());
		assertEquals(403, send("GET", "/api/auth/me", ext, null).statusCode());
		// a web token works too
		assertEquals(200, send("GET", "/api/sync/profile", token(u[0]), null).statusCode());
		// deleted account: 404 so the extension may clear its saved login
		String gone = jwtUtil.generateToken(987654321L, "ghost", "ghost@x.io", "ext", 60_000);
		assertEquals(404, send("GET", "/api/sync/profile", gone, null).statusCode());
	}

	@Test
	void blankAdminTokenFailsClosed() {
		AdminTokenGuard blank = new AdminTokenGuard("");
		MockHttpServletRequest req = new MockHttpServletRequest();
		assertFalse(blank.isAdmin(req));
		req.addHeader("X-Admin-Token", "");
		assertFalse(blank.isAdmin(req));
		AdminTokenGuard set = new AdminTokenGuard("s3cret");
		assertFalse(set.isAdmin(req));
		MockHttpServletRequest wrong = new MockHttpServletRequest();
		wrong.addHeader("X-Admin-Token", "s3cret!");
		assertFalse(set.isAdmin(wrong));
		MockHttpServletRequest right = new MockHttpServletRequest();
		right.addHeader("X-Admin-Token", "s3cret");
		assertTrue(set.isAdmin(right));
	}

	@Test
	void wrongAdminTokenIsForbiddenNotUnauthorized() throws Exception {
		HttpRequest req = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/users"))
				.header("X-Admin-Token", "nope").GET().build();
		assertEquals(403, http.send(req, HttpResponse.BodyHandlers.ofString()).statusCode());
		HttpRequest exp = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/experiments/first-finisher-ends/report"))
				.header("X-Admin-Token", "nope").GET().build();
		assertEquals(403, http.send(exp, HttpResponse.BodyHandlers.ofString()).statusCode());
	}

	// ---- helpers ----

	String fill(String s, long target, long b, Long problem) {
		String n = String.valueOf(SEQ.incrementAndGet());
		String user = "mx" + System.nanoTime() % 1_000_000_000L + n;
		return s.replace("{T}", String.valueOf(target)).replace("{U}", String.valueOf(b))
				.replace("{P}", String.valueOf(problem)).replace("{N}", user)
				.replace("{USER}", USER_BODY.formatted(user, user));
	}

	HttpResponse<String> send(String method, String path, String bearer, String body) throws Exception {
		HttpRequest.Builder req = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
				.header("Content-Type", "application/json");
		if (bearer != null) req.header("Authorization", "Bearer " + bearer);
		req.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
		return http.send(req.build(), HttpResponse.BodyHandlers.ofString());
	}

	/** Signs up two fresh users, returns {A, B}. */
	long[] signup() throws Exception {
		long[] ids = new long[2];
		for (int i = 0; i < 2; i++) {
			String name = "u" + (System.nanoTime() % 1_000_000_000L) + SEQ.incrementAndGet();
			HttpResponse<String> res = send("POST", "/api/auth/signup", null, USER_BODY.formatted(name, name));
			assertEquals(201, res.statusCode(), res.body());
			ids[i] = jsonLong(res.body(), "uid");
		}
		return ids;
	}

	String token(long uid) {
		return jwtUtil.generateToken(uid, "u" + uid, "u" + uid + "@x.io");
	}

	Long createProblemAsAdmin() throws Exception {
		HttpRequest req = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/problems"))
				.header("Content-Type", "application/json").header("X-Admin-Token", ADMIN)
				.POST(HttpRequest.BodyPublishers.ofString(PROBLEM_BODY)).build();
		HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
		assertEquals(201, res.statusCode(), res.body());
		return jsonLong(res.body(), "pid");
	}

	static long jsonLong(String json, String key) {
		Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*(\\d+)").matcher(json);
		assertTrue(m.find(), key + " not in " + json);
		return Long.parseLong(m.group(1));
	}

	static String jsonString(String json, String key) {
		Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
		assertTrue(m.find(), key + " not in " + json);
		return m.group(1);
	}
}
