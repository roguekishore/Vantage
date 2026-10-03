-- Post-run integrity checks. Each prints one row: check name and PASS/FAIL.
-- Run: mysql -h127.0.0.1 -P3307 -uroot -plocal-only-change-me vantage < loadtest/verify.sql
-- Requires MySQL 8 (window functions). Column names follow Spring's default snake_case naming.

-- 1. No user in two simultaneously ACTIVE battles.
SELECT 'check1_no_user_in_two_active_battles' AS check_name,
       IF(COUNT(*) = 0, 'PASS', 'FAIL') AS result,
       COUNT(*) AS violations
FROM (
  SELECT bp.user_id
  FROM battle_participants bp
  JOIN battles b ON b.id = bp.battle_id
  WHERE b.state = 'ACTIVE'
  GROUP BY bp.user_id
  HAVING COUNT(*) > 1
) v;

-- 2. Chained ELO: for each user, each completed battle's rating_before equals the previous
--    completed battle's rating_after (ordered by completion time, then battle id).
SELECT 'check2_elo_chain_consistent' AS check_name,
       IF(COUNT(*) = 0, 'PASS', 'FAIL') AS result,
       COUNT(*) AS violations
FROM (
  SELECT t.user_id, t.battle_id, t.rating_before,
         LAG(t.rating_after) OVER (PARTITION BY t.user_id ORDER BY t.completed_at, t.battle_id) AS prev_after
  FROM (
    SELECT bp.user_id, bp.battle_id, bp.rating_before, bp.rating_after, b.completed_at
    FROM battle_participants bp
    JOIN battles b ON b.id = bp.battle_id
    WHERE b.state = 'COMPLETED' AND bp.rating_after IS NOT NULL
  ) t
) c
WHERE c.prev_after IS NOT NULL AND c.prev_after <> c.rating_before;

-- 3. No duplicate (user_id, idempotency_key) in judge_jobs.
SELECT 'check3_no_duplicate_idempotency_keys' AS check_name,
       IF(COUNT(*) = 0, 'PASS', 'FAIL') AS result,
       COUNT(*) AS violations
FROM (
  SELECT user_id, idempotency_key
  FROM judge_jobs
  GROUP BY user_id, idempotency_key
  HAVING COUNT(*) > 1
) d;

-- 4. DONE jobs and battle_submissions rows are 1:1 per (battle, user, problem).
SELECT 'check4_done_jobs_match_submissions_1to1' AS check_name,
       IF(COUNT(*) = 0, 'PASS', 'FAIL') AS result,
       COUNT(*) AS violations
FROM (
  SELECT k.battle_id, k.user_id, k.problem_index
  FROM (
    SELECT battle_id, user_id, problem_index FROM judge_jobs WHERE status = 'DONE'
    UNION
    SELECT battle_id, user_id, problem_index FROM battle_submissions
  ) k
  LEFT JOIN (
    SELECT battle_id, user_id, problem_index, COUNT(*) AS n
    FROM judge_jobs WHERE status = 'DONE' GROUP BY battle_id, user_id, problem_index
  ) j ON j.battle_id = k.battle_id AND j.user_id = k.user_id AND j.problem_index = k.problem_index
  LEFT JOIN (
    SELECT battle_id, user_id, problem_index, COUNT(*) AS n
    FROM battle_submissions GROUP BY battle_id, user_id, problem_index
  ) s ON s.battle_id = k.battle_id AND s.user_id = k.user_id AND s.problem_index = k.problem_index
  WHERE COALESCE(j.n, 0) <> COALESCE(s.n, 0)
) m;
