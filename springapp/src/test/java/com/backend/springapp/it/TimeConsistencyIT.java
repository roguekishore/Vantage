package com.backend.springapp.it;

import com.backend.springapp.SpringappApplication;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.MySQLContainer;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The clock bug: the JVM wrote battles.started_at in its zone, MySQL wrote judge_jobs.created_at (NOW(3)) in the
 * server's zone, and solve time subtracted one from the other. Here the MySQL server runs in IST (+05:30) while the
 * JVM is UTC, the worst realistic mismatch for an ap-south-1 deployment.
 */
class TimeConsistencyIT {

	static MySQLContainer MYSQL;

	@BeforeAll
	static void start() {
		TimeZone.setDefault(TimeZone.getTimeZone("UTC")); // what SpringappApplication.main does
		MYSQL = new MySQLContainer("mysql:8.0");
		MYSQL.withCommand("--default-time-zone=+05:30");
		MYSQL.start();
	}

	@AfterAll
	static void stop() {
		MYSQL.stop();
	}

	static String[] args(String... extra) {
		java.util.List<String> a = new java.util.ArrayList<>(java.util.List.of(
				"--spring.datasource.url=" + MYSQL.getJdbcUrl(),
				"--spring.datasource.username=" + MYSQL.getUsername(),
				"--spring.datasource.password=" + MYSQL.getPassword(),
				"--spring.jpa.hibernate.ddl-auto=none",
				"--spring.main.banner-mode=off"));
		a.addAll(java.util.List.of(extra));
		return a.toArray(String[]::new);
	}

	ConfigurableApplicationContext run(String... extra) {
		return new SpringApplicationBuilder(SpringappApplication.class)
				.web(WebApplicationType.NONE).profiles("test").run(args(extra));
	}

	@Test
	void serverInIstButPinnedSessionAgreesWithTheJvm() {
		JdbcTemplate raw = new JdbcTemplate(new org.springframework.jdbc.datasource.DriverManagerDataSource(
				MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword()));
		// without the pin the DB really is 5.5 h ahead of the JVM (this is the bug)
		LocalDateTime unpinned = raw.queryForObject("SELECT NOW(3)", Timestamp.class).toLocalDateTime();
		assertTrue(Duration.between(LocalDateTime.now(), unpinned).toMinutes() >= 300,
				"test setup: the MySQL server should be in IST, got " + unpinned);

		try (ConfigurableApplicationContext ctx = run()) { // the startup guard ran and passed
			JdbcTemplate jdbc = new JdbcTemplate(ctx.getBean(DataSource.class));
			assertEquals("+00:00", jdbc.queryForObject("SELECT @@session.time_zone", String.class));
			LocalDateTime db = jdbc.queryForObject("SELECT NOW(3)", Timestamp.class).toLocalDateTime();
			assertTrue(Duration.between(db, LocalDateTime.now()).abs().getSeconds() < 5,
					"DB NOW(3) and the JVM clock must agree, db=" + db);
		}
	}

	@Test
	void withoutThePinTheAppRefusesToStart() {
		// Override the pin (a harmless init statement) and the IST session clock shows up: the guard stops the boot.
		Throwable t = assertThrows(Throwable.class,
				() -> run("--spring.datasource.hikari.connection-init-sql=SET @unpinned = 1").close());
		String all = String.valueOf(t) + (t.getCause() == null ? "" : " / " + t.getCause());
		assertTrue(all.contains("clocks differ"), all);
	}
}
