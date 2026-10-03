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
import java.util.List;
import java.util.TimeZone;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Two instances booting at the same moment against an EMPTY database (a fresh scale-test bring-up). The seeders are
 * check-then-insert, so without StartupSeedLock one instance dies on "Duplicate entry ... for key stages.UK...".
 */
class StartupSeedRaceIT {

	static MySQLContainer MYSQL;

	@BeforeAll
	static void start() {
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		MYSQL = new MySQLContainer("mysql:8.0");
		MYSQL.start();
	}

	@AfterAll
	static void stop() {
		MYSQL.stop();
	}

	ConfigurableApplicationContext boot(String id) {
		return new SpringApplicationBuilder(SpringappApplication.class).web(WebApplicationType.NONE).profiles("test")
				.run("--spring.datasource.url=" + MYSQL.getJdbcUrl(),
						"--spring.datasource.username=" + MYSQL.getUsername(),
						"--spring.datasource.password=" + MYSQL.getPassword(),
						"--spring.jpa.hibernate.ddl-auto=update", "--spring.main.banner-mode=off",
						"--vantage.instance-id=" + id, "--vantage.startup.seed-lock="
								+ !"false".equals(System.getenv("SEED_LOCK")));
	}

	@Test
	void twoInstancesOnAnEmptyDatabaseBothStartAndSeedOnce() throws Exception {
		CompletableFuture<ConfigurableApplicationContext> a = CompletableFuture.supplyAsync(() -> boot("a"));
		// Two contexts initialising Logback in the same instant collide inside one JVM (a test artefact, not the app);
		// a short stagger still overlaps the two seeding phases, which take several seconds. The two-container
		// compose bring-up is the truly simultaneous version.
		Thread.sleep(Long.parseLong(System.getenv().getOrDefault("STAGGER_MS", "1200")));
		CompletableFuture<ConfigurableApplicationContext> b = CompletableFuture.supplyAsync(() -> boot("b"));
		List<ConfigurableApplicationContext> up = new java.util.ArrayList<>();
		Throwable failure = null;
		for (CompletableFuture<ConfigurableApplicationContext> f : List.of(a, b)) {
			try {
				up.add(f.get());
			} catch (Exception e) {
				failure = e.getCause() == null ? e : e.getCause();
			}
		}
		try {
			assertTrue(failure == null, "an instance failed to start: " + failure);
			JdbcTemplate jdbc = new JdbcTemplate(up.get(0).getBean(DataSource.class));
			Integer stages = jdbc.queryForObject("SELECT COUNT(*) FROM stages", Integer.class);
			Integer distinct = jdbc.queryForObject("SELECT COUNT(DISTINCT name) FROM stages", Integer.class);
			assertTrue(stages > 0);
			assertEquals(stages, distinct, "each stage seeded exactly once");
		} finally {
			up.forEach(ConfigurableApplicationContext::close);
		}
	}
}
