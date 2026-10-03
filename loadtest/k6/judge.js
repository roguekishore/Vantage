// Scenario B: judge throughput through the queue at concurrency 1, 5 and 10 (docs/scale/K6-SCENARIOS.md).
// Each VU owns two users (2k-1 and 2k), pairs them in a 1v1 battle over HTTP, and the first user submits
// repeatedly (one submission per 11 s because of the 10 s per-user rate limit).
// Run: k6 run --summary-export=judge-summary.json loadtest/k6/judge.js
// Env: BASE_URL, ORIGIN, STAGE_SECONDS (default 180). Needs 2 * 10 seeded users.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { BASE, headers, login, uuid } from './common.js';

const STAGE = Number(__ENV.STAGE_SECONDS || 180);
export const submitLatency = new Trend('judge_submit_latency', true); // POST /submit round trip
export const jobLatency = new Trend('judge_job_latency', true); // POST -> DONE/FAILED
export const submissionsDone = new Counter('judge_submissions_done');
export const jobFailed = new Rate('judge_job_failed');

const levels = [1, 5, 10];
const scenarios = {};
levels.forEach((c, i) => {
  scenarios[`c${c}`] = {
    executor: 'constant-vus',
    vus: c,
    duration: `${STAGE}s`,
    startTime: `${i * (STAGE + 20)}s`,
    gracefulStop: '30s',
    env: { LEVEL: String(c) },
    tags: { concurrency: String(c) },
  };
});

export const options = {
  scenarios,
  thresholds: {
    'judge_submit_latency{concurrency:1}': ['p(95)<2000'],
    'judge_submit_latency{concurrency:5}': ['p(95)<2000'],
    'judge_submit_latency{concurrency:10}': ['p(95)<2000'],
    judge_job_failed: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

const expectAny = http.expectedStatuses({ min: 200, max: 399 }, 400, 404, 409);
const CODE = 'def solve(*args):\n    return 0\n';

function pairBattle(a, b) {
  for (const p of [a, b]) {
    http.post(
      `${BASE}/api/battle/queue`,
      JSON.stringify({ userId: p.uid, mode: 'CASUAL_1V1', difficulty: 'EASY', problemCount: 1, durationMinutes: 30 }),
      { headers: headers(p.token), tags: { name: 'queue_join' }, responseCallback: expectAny },
    );
  }
  for (let i = 0; i < 40; i++) {
    const r = http.get(`${BASE}/api/battle/queue/status?userId=${a.uid}`, { headers: headers(a.token), tags: { name: 'queue_status' } });
    const body = r.status === 200 ? r.json() : {};
    if (body.status === 'MATCHED' && body.battleId) return body.battleId;
    sleep(2);
  }
  return null;
}

export default function () {
  const a = login(__VU * 2 - 1);
  const b = login(__VU * 2);
  if (!a || !b) { sleep(5); return; }
  const battleId = pairBattle(a, b);
  if (!battleId) { sleep(5); return; }
  for (const p of [a, b]) {
    http.post(`${BASE}/api/battle/${battleId}/ready`, JSON.stringify({ userId: p.uid, language: 'python' }), {
      headers: headers(p.token), tags: { name: 'ready' }, responseCallback: expectAny,
    });
  }
  const st = http.get(`${BASE}/api/battle/${battleId}/state?userId=${a.uid}`, { headers: headers(a.token), tags: { name: 'state' } });
  if (st.status !== 200) { sleep(5); return; }

  const end = Date.now() + 8 * 60 * 1000; // stay in this battle for at most 8 minutes; the scenario duration cuts in first
  while (Date.now() < end) {
    const key = uuid();
    const t0 = Date.now();
    const sub = http.post(
      `${BASE}/api/battle/${battleId}/submit`,
      JSON.stringify({ userId: a.uid, problemIndex: 0, language: 'python', code: CODE }),
      { headers: Object.assign(headers(a.token), { 'Idempotency-Key': key }), tags: { name: 'submit' }, responseCallback: expectAny },
    );
    submitLatency.add(Date.now() - t0);
    if (sub.status === 202) {
      const jobId = sub.json().jobId;
      let status = 'QUEUED';
      const deadline = Date.now() + 130000;
      while (Date.now() < deadline && status !== 'DONE' && status !== 'FAILED') {
        sleep(1);
        const r = http.get(`${BASE}/api/battle/${battleId}/submissions/${jobId}?userId=${a.uid}`, {
          headers: headers(a.token), tags: { name: 'job_poll' },
        });
        if (r.status === 200) status = r.json().status;
      }
      jobLatency.add(Date.now() - t0);
      jobFailed.add(status !== 'DONE');
      if (status === 'DONE') submissionsDone.add(1);
    } else if (sub.status === 200) {
      jobLatency.add(Date.now() - t0);
      submissionsDone.add(1);
      jobFailed.add(false);
    } else {
      check(sub, { 'submit accepted': () => false });
      if (sub.status === 400 || sub.status === 404 || sub.status === 409) break; // battle over or invalid
    }
    sleep(Math.max(0, 11 - (Date.now() - t0) / 1000)); // 10 s per-user rate limit
  }
}
