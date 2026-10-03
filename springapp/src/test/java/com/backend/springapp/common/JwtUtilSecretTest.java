package com.backend.springapp.common;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class JwtUtilSecretTest {

    @Test
    void blankOrMissingSecretFailsStartup() {
        assertThrows(IllegalStateException.class, () -> new JwtUtil("", 1000L));
        assertThrows(IllegalStateException.class, () -> new JwtUtil("   ", 1000L));
        assertThrows(IllegalStateException.class, () -> new JwtUtil(null, 1000L));
    }

    @Test
    void shortSecretFailsStartup() {
        assertThrows(IllegalStateException.class, () -> new JwtUtil("a".repeat(31), 1000L));
    }

    @Test
    void secretOfExactly32BytesIsAccepted() {
        assertDoesNotThrow(() -> new JwtUtil("a".repeat(32), 1000L));
    }
}
