import { Client, ReconnectionTimeMode } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "./api";
import { getSockJsUrl, getStompBrokerUrl } from "./realtimeUrls";

/**
 * One shared STOMP client per browser tab.
 *
 * - subscribe(dest, handler) is idempotent per destination: calling it again
 *   for the same destination replaces the handler and never opens a second
 *   broker subscription.
 * - Every registered destination is (re)applied in onConnect, so
 *   subscriptions survive a reconnect.
 * - Reconnect uses exponential backoff (1 s, doubling, capped at 30 s) and
 *   gives up after MAX_FAILURES consecutive failures until connect() or
 *   activate() is called again.
 * - deactivate() (logout) tears the connection down and forgets all
 *   destinations.
 */

export const RECONNECT_MIN_MS = 1000;
export const RECONNECT_MAX_MS = 30000;
export const MAX_FAILURES = 10;
export const CONNECT_TIMEOUT_MS = 4000;

let client = null;
let wanted = false;          // true between activate() and deactivate()/give-up
let failures = 0;
const registry = new Map();  // destination -> { handler, sub }
const statusListeners = new Set();

function emitStatus() {
  const connected = isConnected();
  statusListeners.forEach((fn) => {
    try { fn(connected); } catch { /* listener errors must not break the client */ }
  });
}

function parseBody(body) {
  try { return JSON.parse(body); } catch { return body; }
}

function attach(dest, entry) {
  if (!client?.connected) return;
  if (entry.sub) return;
  entry.sub = client.subscribe(dest, (message) => {
    // Look the entry up again so a replaced handler is always the one called.
    const current = registry.get(dest);
    if (current) current.handler(parseBody(message.body));
  });
}

function buildClient() {
  const c = new Client({
    brokerURL: getStompBrokerUrl(),
    webSocketFactory: () => {
      const base = getSockJsUrl();
      const token = getToken();
      const url = token
        ? `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
        : base;
      return new SockJS(url);
    },
    reconnectDelay: RECONNECT_MIN_MS,
    maxReconnectDelay: RECONNECT_MAX_MS,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
    beforeConnect: () => {
      // Fresh token on every (re)connect attempt.
      c.connectHeaders = { Authorization: `Bearer ${getToken() || ""}` };
    },
    onConnect: () => {
      if (c !== client) return;
      failures = 0;
      registry.forEach((entry, dest) => {
        entry.sub = null; // old subscription died with the old connection
        attach(dest, entry);
      });
      emitStatus();
    },
    onStompError: () => {
      emitStatus();
    },
    onWebSocketClose: () => {
      if (c !== client) return;
      registry.forEach((entry) => { entry.sub = null; });
      if (wanted) {
        failures += 1;
        if (failures >= MAX_FAILURES) {
          wanted = false;
          try { c.deactivate(); } catch { /* ignore */ }
        }
      }
      emitStatus();
    },
  });
  return c;
}

export function isConnected() {
  return !!client?.connected;
}

/** Start (or restart) the connection. Resets the failure counter. */
export function activate() {
  failures = 0;
  wanted = true;
  if (!client) client = buildClient();
  if (!client.active) {
    try { client.activate(); } catch { /* surfaced via onWebSocketClose */ }
  }
}

/**
 * Make sure the client is connecting and resolve true once connected, or false
 * after CONNECT_TIMEOUT_MS (the client keeps retrying in the background).
 */
export function connect() {
  if (isConnected()) return Promise.resolve(true);
  activate();
  return new Promise((resolve) => {
    let done = false;
    let off = () => {};
    let timer = null;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      off();
      resolve(ok);
    };
    off = onStatus((connected) => { if (connected) finish(true); });
    timer = setTimeout(() => finish(isConnected()), CONNECT_TIMEOUT_MS);
  });
}

/**
 * Subscribe to a destination. Idempotent: a repeat call for the same
 * destination swaps the handler and keeps the single broker subscription.
 * Works before the connection is up; it is applied in onConnect.
 * Returns an unsubscribe function.
 */
export function subscribe(dest, handler) {
  let entry = registry.get(dest);
  if (entry) {
    entry.handler = handler;
  } else {
    entry = { handler, sub: null };
    registry.set(dest, entry);
  }
  attach(dest, entry);
  return () => unsubscribe(dest);
}

export function unsubscribe(dest) {
  const entry = registry.get(dest);
  if (!entry) return;
  registry.delete(dest);
  try { entry.sub?.unsubscribe(); } catch { /* connection already closed */ }
}

/** Listen for connected/disconnected transitions. Returns an off function. */
export function onStatus(fn) {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}

/** Logout: close the connection and forget every destination. */
export function deactivate() {
  wanted = false;
  failures = 0;
  registry.clear();
  const c = client;
  client = null;
  if (c) {
    try { c.deactivate(); } catch { /* ignore */ }
  }
  emitStatus();
}

/** Test helper. */
export function _registrySize() {
  return registry.size;
}

const stompClient = { activate, connect, subscribe, unsubscribe, onStatus, deactivate, isConnected };
export default stompClient;
