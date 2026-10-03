package com.backend.springapp.judge.queue;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One queued battle submission. The unique (user_id, idempotency_key) pair is what makes retries safe. */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "judge_jobs",
        uniqueConstraints = @UniqueConstraint(name = "uk_judge_job_user_key", columnNames = {"user_id", "idempotency_key"}),
        indexes = @Index(name = "idx_judge_job_battle_user", columnList = "battle_id, user_id"))
public class JudgeJob {

    public static final String QUEUED = "QUEUED";
    public static final String RUNNING = "RUNNING";
    public static final String DONE = "DONE";
    public static final String FAILED = "FAILED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "battle_id", nullable = false)
    private Long battleId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "problem_index", nullable = false)
    private int problemIndex;

    @Column(nullable = false, length = 16)
    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(name = "idempotency_key", nullable = false, length = 64)
    private String idempotencyKey;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int attempts;

    @Column(name = "lease_until", columnDefinition = "DATETIME(3)")
    private LocalDateTime leaseUntil;

    @Column(name = "result_json", columnDefinition = "TEXT")
    private String resultJson;

    @Column(length = 255)
    private String error;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "DATETIME(3)")
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, columnDefinition = "DATETIME(3)")
    private LocalDateTime updatedAt;
}
