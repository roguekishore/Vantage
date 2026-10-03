// Shared helpers for the k6 scripts. Users follow the seed-users.mjs scheme.
import http from 'k6/http';
import { check } from 'k6';

export const BASE = __ENV.BASE_URL || 'http://localhost:8080';
export const WS_BASE = __ENV.WS_URL || BASE.replace(/^http/, 'ws');
export const ORIGIN = __ENV.ORIGIN || 'http://localhost:3000';
export const PASSWORD = 'LoadTest!234';

export function pad(n) {
  return String(n).padStart(5, '0');
}
export function emailFor(n) {
  return `lt${pad(n)}@loadtest.local`;
}

export function headers(token) {
  const h = { 'Content-Type': 'application/json', Origin: ORIGIN };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// Returns {uid, token} or null. Each k6 VU has its own cookie jar; the bearer token is used as well.
export function login(n) {
  const res = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: emailFor(n), password: PASSWORD }),
    { headers: headers(), tags: { name: 'login' } },
  );
  const ok = check(res, { 'login 200': (r) => r.status === 200 });
  if (!ok) return null;
  const body = res.json();
  return { uid: body.uid, token: body.token };
}

export function randomSessionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// SockJS raw websocket transport URL: /ws/{server}/{session}/websocket
export function sockjsUrl(token) {
  const server = String(Math.floor(Math.random() * 900) + 100);
  return `${WS_BASE}/ws/${server}/${randomSessionId()}/websocket?token=${encodeURIComponent(token)}`;
}

// STOMP frame wrapped for SockJS: a JSON array of one string.
export function stompFrame(command, hdrs, body) {
  let f = command + '\n';
  for (const k of Object.keys(hdrs || {})) f += `${k}:${hdrs[k]}\n`;
  f += '\n' + (body || '') + '\u0000';
  return JSON.stringify([f]);
}

// Parses an inbound SockJS message ('o', 'h', 'a[...]', 'c[...]') into an array of STOMP frames.
export function parseSockjs(msg) {
  if (!msg || msg[0] !== 'a') return [];
  let arr;
  try {
    arr = JSON.parse(msg.slice(1));
  } catch (e) {
    return [];
  }
  return arr.map((raw) => {
    const text = raw.replace(/\u0000$/, '');
    const split = text.indexOf('\n\n');
    const head = (split >= 0 ? text.slice(0, split) : text).split('\n');
    const body = split >= 0 ? text.slice(split + 2) : '';
    const hdrs = {};
    for (let i = 1; i < head.length; i++) {
      const c = head[i].indexOf(':');
      if (c > 0) hdrs[head[i].slice(0, c)] = head[i].slice(c + 1);
    }
    return { command: head[0], headers: hdrs, body };
  });
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
