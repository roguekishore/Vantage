import { API_BASE, authFetch } from "./api";

async function parseResponse(res, fallbackMessage) {
  if (res.ok) return res.json();
  let message = fallbackMessage;
  try {
    const body = await res.json();
    message = body?.error || body?.message || fallbackMessage;
  } catch {
    // no-op
  }
  throw new Error(message);
}

export async function fetchFriendsOverview() {
  const res = await authFetch(`${API_BASE}/friends/overview`);
  return parseResponse(res, "Failed to fetch friends overview");
}

export async function searchFriendsUsers(query, page = 0, size = 10) {
  const params = new URLSearchParams({
    q: query || "",
    page: String(Math.max(0, page)),
    size: String(Math.min(Math.max(size, 1), 25)),
  });
  const res = await authFetch(`${API_BASE}/friends/search?${params.toString()}`);
  return parseResponse(res, "Failed to search users");
}

export async function sendFriendRequest(targetUserId) {
  const res = await authFetch(`${API_BASE}/friends/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  return parseResponse(res, "Failed to send friend request");
}

export async function acceptFriendRequest(requestId) {
  const res = await authFetch(`${API_BASE}/friends/requests/${requestId}/accept`, {
    method: "POST",
  });
  return parseResponse(res, "Failed to accept request");
}

export async function rejectFriendRequest(requestId) {
  const res = await authFetch(`${API_BASE}/friends/requests/${requestId}/reject`, {
    method: "POST",
  });
  return parseResponse(res, "Failed to reject request");
}

export async function cancelFriendRequest(requestId) {
  const res = await authFetch(`${API_BASE}/friends/requests/${requestId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to cancel request");
  }
}

export async function sendFriendChallenge({ targetUserId, mode, difficulty, problemCount, roomCode, durationMinutes }) {
  const res = await authFetch(`${API_BASE}/friends/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId, mode, difficulty, problemCount, roomCode, durationMinutes }),
  });
  return parseResponse(res, "Failed to send challenge");
}

export async function fetchIncomingChallenges() {
  const res = await authFetch(`${API_BASE}/friends/challenges/incoming`);
  return parseResponse(res, "Failed to fetch incoming challenges");
}

export async function acceptFriendChallenge(challengeId) {
  const res = await authFetch(`${API_BASE}/friends/challenges/${challengeId}/accept`, {
    method: "POST",
  });
  return parseResponse(res, "Failed to accept challenge");
}

export async function rejectFriendChallenge(challengeId) {
  const res = await authFetch(`${API_BASE}/friends/challenges/${challengeId}/reject`, {
    method: "POST",
  });
  return parseResponse(res, "Failed to reject challenge");
}

export async function cancelFriendChallenge(challengeId) {
  const res = await authFetch(`${API_BASE}/friends/challenges/${challengeId}/cancel`, {
    method: "POST",
  });
  return parseResponse(res, "Failed to cancel challenge");
}

export async function muteFriendChallenges(minutes) {
  const res = await authFetch(`${API_BASE}/friends/challenges/mute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minutes }),
  });
  return parseResponse(res, "Failed to mute challenges");
}

export async function fetchChallengeMuteStatus() {
  const res = await authFetch(`${API_BASE}/friends/challenges/mute`);
  return parseResponse(res, "Failed to get mute status");
}

export async function clearChallengeMute() {
  const res = await authFetch(`${API_BASE}/friends/challenges/mute`, {
    method: "DELETE",
  });
  return parseResponse(res, "Failed to clear mute status");
}

export async function pingFriendPresence() {
  const res = await authFetch(`${API_BASE}/friends/presence/ping`, { method: "POST" });
  return parseResponse(res, "Failed to ping presence");
}

export async function fetchFriendsPresence() {
  const res = await authFetch(`${API_BASE}/friends/presence/friends`);
  return parseResponse(res, "Failed to fetch friends presence");
}
