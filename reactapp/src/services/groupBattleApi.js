import { authFetch } from "./api";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:8080") + "/api/battle";

/* ── Room management ── */

/**
 * Create a new group battle room.
 * @param {number} userId
 * @param {{ mode, difficulty, problemCount, maxPlayers, durationMinutes }} opts
 */
export async function createRoom(userId, opts) {
  const res = await authFetch(`${API_BASE}/room`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to create room");
  }
  return res.json();
}

/**
 * Get room details by 6-char code.
 * @param {string} code
 */
export async function fetchRoomByCode(code) {
  const res = await authFetch(`${API_BASE}/room/${code.toUpperCase()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Room not found");
  }
  return res.json();
}

/**
 * Join a room by code.
 * @param {string} code
 * @param {number} userId
 */
export async function joinRoom(code, userId) {
  const res = await authFetch(`${API_BASE}/room/${code.toUpperCase()}/join`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to join room");
  }
  return res.json();
}

/**
 * Leave a room.
 * @param {string} code
 * @param {number} userId
 */
export async function leaveRoom(code, userId) {
  const res = await authFetch(`${API_BASE}/room/${code.toUpperCase()}/leave`, {
    method: "POST",
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to leave room");
  }
  return res.json();
}

/**
 * Kick a player from the room (creator only).
 * @param {string} code
 * @param {number} kickerId
 * @param {number} targetUserId
 */
export async function kickFromRoom(code, kickerId, targetUserId) {
  const res = await authFetch(
    `${API_BASE}/room/${code.toUpperCase()}/kick/${targetUserId}`,
    { method: "POST" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to kick player");
  }
  return res.json();
}

/**
 * Start the group battle (creator only).
 * @param {string} code
 * @param {number} userId
 */
export async function startGroupBattle(code, userId) {
  const res = await authFetch(`${API_BASE}/room/${code.toUpperCase()}/start`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to start battle");
  }
  return res.json();
}

/* ── Arena ── */

/**
 * Poll group battle state (scoreboard).
 * @param {number} battleId
 * @param {number} userId
 */
export async function fetchGroupBattleState(battleId, userId) {
  const res = await authFetch(`${API_BASE}/${battleId}/group-state`);
  if (!res.ok) throw new Error("Failed to fetch group battle state");
  return res.json();
}

/**
 * Submit code in a group battle.
 * @param {number} battleId
 * @param {{ userId, problemIndex, language, code }} opts
 */
export async function submitGroupBattleCode(battleId, opts) {
  const res = await authFetch(`${API_BASE}/${battleId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Submission failed");
  }
  return res.json();
}

/**
 * Get group battle result (final placement).
 * @param {number} battleId
 * @param {number} userId
 */
export async function fetchGroupBattleResult(battleId, userId) {
  const res = await authFetch(`${API_BASE}/${battleId}/group-result`);
  if (!res.ok) throw new Error("Failed to fetch group result");
  return res.json();
}
