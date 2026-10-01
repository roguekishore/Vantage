package com.backend.springapp.it;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;

/**
 * Shared base for integration tests: one MySQL 8.0 Testcontainer per JVM (started once, reused by every IT),
 * wired into the datasource. Extend it and add @SpringBootTest. Real MySQL is needed because SKIP LOCKED and
 * conditional-UPDATE races cannot be proven on H2.
 */
@ActiveProfiles("test")
public abstract class AbstractMysqlIT {

	static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.0");

	static {
		MYSQL.start();
	}

	@DynamicPropertySource
	static void datasource(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
		registry.add("spring.datasource.username", MYSQL::getUsername);
		registry.add("spring.datasource.password", MYSQL::getPassword);
	}
}
