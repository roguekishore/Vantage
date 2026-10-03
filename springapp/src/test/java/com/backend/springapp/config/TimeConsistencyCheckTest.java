package com.backend.springapp.config;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TimeConsistencyCheckTest {

    private static final Duration MAX = Duration.ofSeconds(60);
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 4, 12, 0, 0);

    @Test
    void agreeingClocksPass() {
        assertNull(TimeConsistencyCheck.verify(NOW.plusNanos(40_000_000), NOW, MAX));
        assertNull(TimeConsistencyCheck.verify(NOW.minusSeconds(60), NOW, MAX));
    }

    @Test
    void istDatabaseAgainstUtcJvmIsRefused() {
        // The clock bug: DB session in IST (+5:30), JVM in UTC.
        String msg = TimeConsistencyCheck.verify(NOW.plusHours(5).plusMinutes(30), NOW, MAX);
        assertNotNull(msg);
        assertTrue(msg.contains("PT5H30M") && msg.contains("-Duser.timezone=UTC"), msg);
    }

    @Test
    void skewInEitherDirectionIsRefused() {
        assertNotNull(TimeConsistencyCheck.verify(NOW.minusHours(4), NOW, MAX));
        assertNotNull(TimeConsistencyCheck.verify(NOW.plusSeconds(61), NOW, MAX));
        assertNotNull(TimeConsistencyCheck.verify(null, NOW, MAX));
    }
}
