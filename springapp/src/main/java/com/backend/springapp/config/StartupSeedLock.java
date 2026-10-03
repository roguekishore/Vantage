package com.backend.springapp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * The seeders (stages, problems, achievements, store, institutions) are check-then-insert: "if count() == 0, insert".
 * Two instances booting against an empty database both see zero and the loser crashes on a unique key. This takes one
 * MySQL named lock right after the clock check and releases it once every startup runner has finished (ApplicationReady),
 * so on a fresh database exactly one instance seeds and the others see the finished result. A named lock lives on its
 * connection, so the connection is held open between the two points. If the lock cannot be had in time we log and carry
 * on (the old behaviour) instead of blocking startup forever.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1) // right after TimeConsistencyCheck, before every seeder
public class StartupSeedLock implements ApplicationRunner {

    static final String LOCK_NAME = "vantage-startup-seed";
    static final int WAIT_SECONDS = 120;

    private final DataSource dataSource;
    private final boolean enabled;
    private Connection held;

    public StartupSeedLock(DataSource dataSource, @Value("${vantage.startup.seed-lock:true}") boolean enabled) {
        this.dataSource = dataSource;
        this.enabled = enabled;
    }

    @Override
    public synchronized void run(ApplicationArguments args) throws Exception {
        if (!enabled) return;
        Connection c = dataSource.getConnection();
        try (PreparedStatement ps = c.prepareStatement("SELECT GET_LOCK(?, ?)")) {
            ps.setString(1, LOCK_NAME);
            ps.setInt(2, WAIT_SECONDS);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next() && rs.getInt(1) == 1) {
                    held = c;
                    log.info("Startup seed lock acquired.");
                    return;
                }
            }
        } catch (Exception e) {
            log.warn("Startup seed lock failed ({}), continuing without it.", e.getMessage());
        }
        c.close();
        log.warn("Startup seed lock not acquired within {} s, continuing without it.", WAIT_SECONDS);
    }

    @EventListener(ApplicationReadyEvent.class)
    public synchronized void release() {
        releaseHeld();
    }

    @PreDestroy
    synchronized void releaseHeld() {
        if (held == null) return;
        try (PreparedStatement ps = held.prepareStatement("SELECT RELEASE_LOCK(?)")) {
            ps.setString(1, LOCK_NAME);
            ps.executeQuery().close();
            log.info("Startup seed lock released.");
        } catch (Exception e) {
            log.warn("Releasing the startup seed lock failed: {}", e.getMessage());
        } finally {
            try { held.close(); } catch (Exception ignored) { }
            held = null;
        }
    }
}
