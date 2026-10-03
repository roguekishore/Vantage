package com.backend.springapp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Solve time is "database NOW(3) minus battles.started_at", and started_at is written with the JVM clock, so the two
 * must agree. This compares them once at startup and refuses to boot when they do not: a time-zone mismatch (IST app,
 * UTC database) is hours, and it would silently corrupt solve times, ELO and rewards.
 */
@Slf4j
@Component
public class TimeConsistencyCheck implements ApplicationRunner {

    private final DataSource dataSource;
    private final long maxSkewSeconds;
    private final boolean enforce;

    public TimeConsistencyCheck(DataSource dataSource,
                                @Value("${vantage.time.max-skew-seconds:60}") long maxSkewSeconds,
                                @Value("${vantage.time.enforce:true}") boolean enforce) {
        this.dataSource = dataSource;
        this.maxSkewSeconds = maxSkewSeconds;
        this.enforce = enforce;
    }

    @Override
    public void run(ApplicationArguments args) {
        // DB wall clock as the session sees it, read back as a plain timestamp literal, then compared with the JVM's.
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        Timestamp dbNow = jdbc.queryForObject("SELECT NOW(3)", Timestamp.class);
        LocalDateTime jvmNow = LocalDateTime.now();
        String problem = verify(dbNow == null ? null : dbNow.toLocalDateTime(), jvmNow, Duration.ofSeconds(maxSkewSeconds));
        if (problem == null) {
            log.info("Time check OK: DB and JVM clocks agree (JVM zone {}).", java.util.TimeZone.getDefault().getID());
        } else if (enforce) {
            throw new IllegalStateException(problem);
        } else {
            log.warn("{} (vantage.time.enforce=false, continuing)", problem);
        }
    }

    /** @return null when the clocks agree within {@code max}, otherwise a message that says how to fix it. */
    static String verify(LocalDateTime dbNow, LocalDateTime jvmNow, Duration max) {
        if (dbNow == null) return "Time check failed: the database returned no NOW(3).";
        Duration skew = Duration.between(dbNow, jvmNow).abs();
        if (skew.compareTo(max) <= 0) return null;
        return "Database and JVM clocks differ by " + skew + " (db=" + dbNow + ", jvm=" + jvmNow + ", jvm zone="
                + java.util.TimeZone.getDefault().getID() + "). Solve times would be wrong. Run the JVM with "
                + "-Duser.timezone=UTC (or TZ=UTC) and keep the DB session on UTC (spring.datasource.hikari."
                + "connection-init-sql=SET time_zone = '+00:00'), or fix NTP on the host.";
    }
}
