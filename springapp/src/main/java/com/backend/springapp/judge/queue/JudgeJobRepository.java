package com.backend.springapp.judge.queue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Every state change is a conditional UPDATE whose WHERE clause is the guard, so when two workers race, the database
 * lets exactly one of them see "1 row affected". All times (lease, updated_at, created_at, rate-limit and re-send
 * windows) come from the database clock via NOW(3), never from a JVM, so clock skew between app instances cannot make a
 * live lease look expired. Never mix a Java-written time into these comparisons.
 */
public interface JudgeJobRepository extends JpaRepository<JudgeJob, Long> {

    Optional<JudgeJob> findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);

    @Query(value = "SELECT EXISTS(SELECT 1 FROM judge_jobs WHERE battle_id = :battleId AND user_id = :userId " +
           "AND created_at > NOW(3) - INTERVAL :seconds SECOND AND idempotency_key <> :key)", nativeQuery = true)
    long existsRecentOtherRaw(@Param("battleId") Long battleId, @Param("userId") Long userId,
                              @Param("seconds") int seconds, @Param("key") String key);

    default boolean existsRecentOther(Long battleId, Long userId, int seconds, String key) {
        return existsRecentOtherRaw(battleId, userId, seconds, key) != 0;
    }

    /** Insert with DB-clock created_at/updated_at. A duplicate (user, key) throws DataIntegrityViolationException. */
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT INTO judge_jobs (battle_id, user_id, problem_index, language, code, idempotency_key, status, " +
           "attempts, created_at, updated_at) VALUES (:battleId, :userId, :problemIndex, :language, :code, :key, 'QUEUED', " +
           "0, NOW(3), NOW(3))", nativeQuery = true)
    int insertQueued(@Param("battleId") Long battleId, @Param("userId") Long userId,
                     @Param("problemIndex") int problemIndex, @Param("language") String language,
                     @Param("code") String code, @Param("key") String key);

    /** Claim: QUEUED, or RUNNING with an expired lease (a worker that died). 0 rows = someone else owns it or it is finished. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE judge_jobs SET status = 'RUNNING', attempts = attempts + 1, " +
           "lease_until = NOW(3) + INTERVAL :lease SECOND, updated_at = NOW(3) " +
           "WHERE id = :id AND (status = 'QUEUED' OR (status = 'RUNNING' AND lease_until < NOW(3)))", nativeQuery = true)
    int claim(@Param("id") Long id, @Param("lease") int leaseSeconds);

    /** Finalize guard: only the attempt that holds the claim may mark the job DONE. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE judge_jobs SET status = 'DONE', updated_at = NOW(3) " +
           "WHERE id = :id AND status = 'RUNNING' AND attempts = :attempts", nativeQuery = true)
    int markDone(@Param("id") Long id, @Param("attempts") int attempts);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE JudgeJob j SET j.resultJson = :json WHERE j.id = :id")
    int setResult(@Param("id") Long id, @Param("json") String json);

    /** FAILED by the attempt that holds the claim (status is RUNNING, or DONE when set earlier in the same transaction). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE judge_jobs SET status = 'FAILED', error = :error, result_json = NULL, updated_at = NOW(3) " +
           "WHERE id = :id AND attempts = :attempts AND status IN ('RUNNING', 'DONE')", nativeQuery = true)
    int fail(@Param("id") Long id, @Param("attempts") int attempts, @Param("error") String error);

    /** Jobs still QUEUED whose last touch (creation or last re-send) is older than the stale window. */
    @Query(value = "SELECT id FROM judge_jobs WHERE status = 'QUEUED' AND updated_at < NOW(3) - INTERVAL :seconds SECOND",
           nativeQuery = true)
    List<Long> findRequeueable(@Param("seconds") int staleSeconds);

    /** Re-send ticket: only the instance whose UPDATE hits the row re-sends. */
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE judge_jobs SET updated_at = NOW(3) WHERE id = :id AND status = 'QUEUED' " +
           "AND updated_at < NOW(3) - INTERVAL :seconds SECOND", nativeQuery = true)
    int touchForResend(@Param("id") Long id, @Param("seconds") int staleSeconds);
}
