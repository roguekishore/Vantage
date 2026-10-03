// Scenario A: real-time 1v1 battles, no code submissions (docs/scale/K6-SCENARIOS.md).
// Full run:   k6 run --summary-export=battle-summary.json loadtest/k6/battle.js
// Smoke run:  SMOKE=1 k6 run loadtest/k6/battle.js      (10 users, 2 minutes)
// Env: BASE_URL (default http://localhost:8080), ORIGIN (default http://localhost:3000), STEP_MINUTES (default 5)
// Needs users seeded with loadtest/seed-users.mjs: at least peak VUs + 10%.
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE, headers, login, sockjsUrl, stompFrame, parseSockjs } from './common.js';

const SMOKE = __ENV.SMOKE === '1';
const STEP_MIN = Number(__ENV.STEP_MINUTES || 5);

export const wsConnectTime = new Trend('ws_connect_time', true);
export const wsConnectOk = new Rate('ws_connect_ok');
export const timeToMatch = new Trend('time_to_match', true); // join queue -> matched frame; includes the 5 s matchmaking tick
export const unmatched = new Counter('users_left_unmatched');
export const battlesCompleted = new Counter('battles_completed');

// STEPS="50,100" runs just those steps (one clean summary per step); default is the full ladder.
const steps = SMOKE ? [10] : (__ENV.STEPS ? __ENV.STEPS.split(',').map(Number) : [25, 50, 100, 200, 400]);
const stages = [];
steps.forEach((vus) => {
  stages.push({ duration: SMOKE ? '10s' : '30s', target: vus }); // ramp
  stages.push({ duration: SMOKE ? '1m40s' : `${STEP_MIN}m`, target: vus }); // hold
});

export const options = {
  scenarios: {
    battle: { executor: 'ramping-vus', startVUs: 0, stages, gracefulRampDown: '60s', gracefulStop: '90s' },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    ws_connect_ok: ['rate>=0.99'],
    users_left_unmatched: ['count==0'],
  },
};

const expectOk = http.expectedStatuses({ min: 200, max: 399 });
const expectAny = http.expectedStatuses({ min: 200, max: 399 }, 400, 404, 409);

export default function () {
  const me = login(__VU);
  if (!me) {
    wsConnectOk.add(false);
    sleep(5);
    return;
  }
  const uid = me.uid;
  const t0 = Date.now();
  let queuedAt = 0;
  let battleId = null;
  let resultSeen = false;
  let forfeited = false;
  let subscribedBattle = false;

  const res = ws.connect(sockjsUrl(me.token), { headers: { Origin: 'http://localhost:3000' } }, (socket) => {
    socket.on('message', (msg) => {
      if (msg === 'o') {
        socket.send(stompFrame('CONNECT', { 'accept-version': '1.2', 'heart-beat': '10000,10000', Authorization: `Bearer ${me.token}` }));
        return;
      }
      for (const f of parseSockjs(msg)) {
        if (f.command === 'CONNECTED') {
          wsConnectTime.add(Date.now() - t0);
          wsConnectOk.add(true);
          socket.send(stompFrame('SUBSCRIBE', { id: 'sub-m', destination: `/topic/queue/${uid}/matched` }));
          queuedAt = Date.now();
          const r = http.post(
            `${BASE}/api/battle/queue`,
            JSON.stringify({ userId: uid, mode: 'CASUAL_1V1', difficulty: 'EASY', problemCount: 1, durationMinutes: 10 }),
            { headers: headers(me.token), tags: { name: 'queue_join' }, responseCallback: expectOk },
          );
          check(r, { 'queue join ok': (x) => x.status === 200 });
        } else if (f.command === 'MESSAGE' && f.headers.destination === `/topic/queue/${uid}/matched` && !subscribedBattle) {
          let payload = {};
          try { payload = JSON.parse(f.body); } catch (e) { /* ignore */ }
          if (!payload.battleId) continue;
          subscribedBattle = true;
          battleId = payload.battleId;
          timeToMatch.add(Date.now() - queuedAt);
          socket.send(stompFrame('SUBSCRIBE', { id: 'sub-s', destination: `/topic/battle/${battleId}/state/${uid}` }));
          socket.send(stompFrame('SUBSCRIBE', { id: 'sub-r', destination: `/topic/battle/${battleId}/result/${uid}` }));
          socket.send(stompFrame('SUBSCRIBE', { id: 'sub-l', destination: `/topic/battle/${battleId}/lobby/${uid}` }));
          const r = http.post(
            `${BASE}/api/battle/${battleId}/ready`,
            JSON.stringify({ userId: uid, language: 'python' }),
            { headers: headers(me.token), tags: { name: 'ready' }, responseCallback: expectOk },
          );
          check(r, { 'ready ok': (x) => x.status === 200 });
          // Same cadence as the client: lobby poll every 3 s while waiting, state refresh every 5 s once active.
          socket.setInterval(() => {
            if (resultSeen) return;
            http.get(`${BASE}/api/battle/${battleId}/state?userId=${uid}`, {
              headers: headers(me.token), tags: { name: 'state' }, responseCallback: expectAny,
            });
          }, 4000);
          // Half the users forfeit after 8-20 s; the others wait for the result frame, then forfeit as a fallback at 45 s.
          const holdMs = uid % 2 === 0 ? 8000 + Math.random() * 12000 : 45000;
          socket.setTimeout(() => {
            if (resultSeen || forfeited) return;
            forfeited = true;
            http.post(`${BASE}/api/battle/${battleId}/forfeit?userId=${uid}`, null, {
              headers: headers(me.token), tags: { name: 'forfeit' }, responseCallback: expectAny,
            });
          }, holdMs);
        } else if (f.command === 'MESSAGE' && f.headers.destination === `/topic/battle/${battleId}/result/${uid}`) {
          resultSeen = true;
          battlesCompleted.add(1);
          socket.setTimeout(() => socket.close(), 500);
        }
      }
    });
    socket.on('error', () => wsConnectOk.add(false));
    // Match must arrive within 60 s (5 s tick + pairing); otherwise leave the queue and count the miss.
    socket.setTimeout(() => {
      if (!battleId) {
        unmatched.add(1);
        http.del(`${BASE}/api/battle/queue?userId=${uid}`, null, { headers: headers(me.token), tags: { name: 'queue_leave' }, responseCallback: expectAny });
        socket.close();
      }
    }, 60000);
    socket.setTimeout(() => socket.close(), 120000);
  });
  if (!res || res.status !== 101) wsConnectOk.add(false);
  sleep(1);
}
