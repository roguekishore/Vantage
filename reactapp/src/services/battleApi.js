const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:8080") + "/api/battle";

/**
 * Join the matchmaking queue.
 */
export async function joinQueue({ userId, mode, difficulty, problemCount }) {
  const res = await fetch(`${API_BASE}/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, mode, difficulty, problemCount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to join queue");
  }
  return res.json();
}

/**
 * Poll queue status.
 */
export async function fetchQueueStatus(userId) {
  const res = await fetch(`${API_BASE}/queue/status?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch queue status");
  return res.json();
}

/**
 * Leave the matchmaking queue.
 */
export async function leaveQueue(userId) {
  const res = await fetch(`${API_BASE}/queue?userId=${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to leave queue");
}

/**
 * Get battle lobby details.
 */
export async function fetchBattle(battleId, userId) {
  const res = await fetch(`${API_BASE}/${battleId}?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch battle");
  return res.json();
}

/**
 * Ready up in lobby.
 */
export async function readyUp(battleId, { userId, language }) {
  const res = await fetch(`${API_BASE}/${battleId}/ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to ready up");
  }
  return res.json();
}

/**
 * Poll battle state during active battle.
 */
export async function fetchBattleState(battleId, userId) {
  const res = await fetch(`${API_BASE}/${battleId}/state?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch battle state");
  return res.json();
}

/**
 * Submit code in a battle.
 */
export async function submitBattleCode(battleId, { userId, problemIndex, language, code }) {
  const res = await fetch(`${API_BASE}/${battleId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, problemIndex, language, code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Submission failed");
  }
  return res.json();
}

/**
 * Get battle results.
 */
export async function fetchBattleResult(battleId, userId) {
  const res = await fetch(`${API_BASE}/${battleId}/result?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch battle result");
  return res.json();
}

/**
 * Forfeit a battle.
 */
export async function forfeitBattle(battleId, userId) {
  const res = await fetch(`${API_BASE}/${battleId}/forfeit?userId=${userId}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to forfeit");
}

/**
 * Abandon a stuck/stale battle (force-complete it).
 */
export async function abandonBattle(battleId, userId) {
  const res = await fetch(`${API_BASE}/${battleId}/abandon?userId=${userId}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to abandon battle");
}

/**
 * Fetch battle history for a user.
 * @param {number} userId
 * @param {number} page - 0-indexed page
 * @param {number} size - items per page
 */
export async function fetchBattleHistory(userId, page = 0, size = 20) {
  const res = await fetch(`${API_BASE}/history?userId=${userId}&page=${page}&size=${size}`);
  if (!res.ok) throw new Error("Failed to fetch battle history");
  return res.json();
}
