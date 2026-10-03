package com.backend.springapp.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Exists only so ddl-auto creates the {@code shedlock} table that ShedLock's JDBC provider reads and writes.
 * Never loaded or saved through JPA; ShedLock owns the rows.
 */
@Entity
@Table(name = "shedlock")
public class ShedLockRow {

    @Id
    @Column(name = "name", length = 64, nullable = false)
    private String name;

    @Column(name = "lock_until", nullable = false, columnDefinition = "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)")
    private Instant lockUntil;

    @Column(name = "locked_at", nullable = false, columnDefinition = "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)")
    private Instant lockedAt;

    @Column(name = "locked_by", length = 255, nullable = false)
    private String lockedBy;

    protected ShedLockRow() {
    }
}
