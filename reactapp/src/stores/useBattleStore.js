import { create } from "zustand";
import stompClient from "../services/stompClient";
import useUserStore from "./useUserStore";
import {
  joinQueue as apiJoinQueue,
  fetchQueueStatus,
  leaveQueue as apiLeaveQueue,
  fetchBattle,
  readyUp as apiReadyUp,
  fetchBattleState,
  submitBattleCode,
  fetchBattleResult,
  forfeitBattle,
  abandonBattle as apiAbandonBattle,
  checkActiveBattle as apiCheckActiveBattle,
} from "../services/battleApi";

const POLL_INTERVAL = 3000;

/**
 * Zustand store for 1-v-1 Battle system.
 *
 * Phase 6 upgrade: primary delivery via STOMP WebSocket.
 * HTTP polling is kept as a fallback when WebSocket connection fails.
 */
const useBattleStore = create((set, get) => ({
  /* ── State ── */
  queueStatus: null,       // null | "QUEUED" | "MATCHED"
  activeBattleState: null, // "WAITING" or "ACTIVE" - set on load if user has a battle
  activeBattleMode: null,  // "CASUAL_1V1" | "RANKED_1V1" | "GROUP_FFA"
  activeBattleRoomCode: null, // room code for group battles
  battleId: null,
  lobby: null,             // BattleLobbyDTO
  battleState: null,       // BattleStateDTO
  result: null,            // BattleResultDTO
  error: null,
  loading: false,
  submitting: false,

  /* ── Internal refs (not rendered) ── */
  _queueInterval: null,
  _battleInterval: null,
  _stompSubscriptions: [],   // destinations this store owns (deduped)
  _stompStatusOff: null,
  _wsConnected: false,

  /* ═══════════════════════════════════════════════════════════
   * STOMP WEBSOCKET HELPERS
   * ═══════════════════════════════════════════════════════════ */

  /**
   * Connect the shared tab-wide STOMP client. Resolves true once connected,
   * false if it is not up within a few seconds (callers then rely on polling).
   */
  _connectStomp: async () => {
    if (!get()._stompStatusOff) {
      const off = stompClient.onStatus((connected) => set({ _wsConnected: connected }));
      set({ _stompStatusOff: off });
    }
    const ok = await stompClient.connect();
    set({ _wsConnected: ok });
    return ok;
  },

  /**
   * Subscribe to a destination on the shared client. Idempotent per
   * destination (a repeat call only swaps the handler) and re-applied
   * automatically after a reconnect.
   */
  _subscribe: (destination, callback) => {
    const off = stompClient.subscribe(destination, callback);
    if (!get()._stompSubscriptions.includes(destination)) {
      set({ _stompSubscriptions: [...get()._stompSubscriptions, destination] });
    }
    return off;
  },

  /** Drop every destination this store subscribed to. */
  _unsubscribeAll: () => {
    get()._stompSubscriptions.forEach((dest) => stompClient.unsubscribe(dest));
    set({ _stompSubscriptions: [] });
  },

  /** Release this store's subscriptions; the shared client stays up for other stores. */
  _disconnectStomp: () => {
    get()._unsubscribeAll();
    const off = get()._stompStatusOff;
    if (off) off();
    set({ _stompStatusOff: null, _wsConnected: false });
  },

  /* ═══════════════════════════════════════════════════════════
   * QUEUE
   * ═══════════════════════════════════════════════════════════ */

  joinQueue: async (userId, mode, difficulty, problemCount, durationMinutes) => {
    // Clean up any lingering state / subscriptions from a previous battle
    get().stopPolling();
    get()._disconnectStomp();
    set({
      loading: true, error: null, queueStatus: null,
      battleId: null, lobby: null, battleState: null, result: null,
    });
    try {
      const response = await apiJoinQueue({ userId, mode, difficulty, problemCount, durationMinutes });

      // If user has an active/waiting battle, surface it for rejoin
      if (response.status === "ACTIVE_BATTLE") {
        set({
          loading: false,
          battleId: response.battleId,
          activeBattleState: response.battleState, // "WAITING" or "ACTIVE"
        });
        return;
      }

      set({ queueStatus: "QUEUED", loading: false });

      // Attempt WebSocket for instant match notification
      const wsOk = await get()._connectStomp();
      if (wsOk) {
        get()._subscribe(`/topic/queue/${userId}/matched`, (data) => {
          if (data.status === "MATCHED" && data.battleId) {
            set({ queueStatus: "MATCHED", battleId: data.battleId });
            get().stopQueuePolling();
            get().fetchLobby(data.battleId, userId);
          }
        });
      }
      // Always start polling as fallback (WS will race it - first to fire wins)
      get().startQueuePolling(userId);
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  startQueuePolling: (userId) => {
    get().stopQueuePolling();
    const interval = setInterval(async () => {
      try {
        const res = await fetchQueueStatus(userId);
        if (res.status === "MATCHED" && res.battleId) {
          set({ queueStatus: "MATCHED", battleId: res.battleId });
          get().stopQueuePolling();
          get().fetchLobby(res.battleId, userId);
        } else if (res.status === "NOT_QUEUED") {
          set({ queueStatus: null });
          get().stopQueuePolling();
        }
      } catch {
        // ignore polling errors
      }
    }, POLL_INTERVAL);
    set({ _queueInterval: interval });
  },

  stopQueuePolling: () => {
    const interval = get()._queueInterval;
    if (interval) clearInterval(interval);
    set({ _queueInterval: null });
  },

  leaveQueue: async (userId) => {
    get().stopQueuePolling();
    get()._unsubscribeAll();
    try { await apiLeaveQueue(userId); } catch { /* ignore */ }
    set({ queueStatus: null, battleId: null, error: null });
  },

  /* ═══════════════════════════════════════════════════════════
   * LOBBY
   * ═══════════════════════════════════════════════════════════ */

  fetchLobby: async (battleId, userId, _retries = 0) => {
    try {
      const lobby = await fetchBattle(battleId, userId);
      set({ lobby, battleId });

      // Subscribe to lobby topic for ready-state & cancellation pushes
      const wsOk = get()._wsConnected || (await get()._connectStomp());
      if (wsOk) {
        get()._subscribe(`/topic/battle/${battleId}/lobby/${userId}`, (data) => {
          // Server sends either BattleLobbyDTO or cancellation map
          if (data.state === "CANCELLED") {
            set({ lobby: { ...get().lobby, state: "CANCELLED" }, error: "Lobby was cancelled" });
            get().stopPolling();
            return;
          }
          set({ lobby: data });
          if (data.state === "ACTIVE") {
            get().startBattlePolling(battleId, userId);
          }
        });
      }

      // If battle is already ACTIVE, transition to arena
      if (lobby.state === "ACTIVE") {
        get().startBattlePolling(battleId, userId);
      }
    } catch (e) {
      // Retry up to 3 times with delay - handles race condition where
      // the matchmaking transaction hasn't committed yet
      if (_retries < 3) {
        await new Promise((r) => setTimeout(r, 1000 * (_retries + 1)));
        return get().fetchLobby(battleId, userId, _retries + 1);
      }
      set({ error: e.message });
    }
  },

  readyUp: async (battleId, userId, language) => {
    set({ loading: true, error: null });
    try {
      const lobby = await apiReadyUp(battleId, { userId, language });
      set({ lobby, loading: false });
      // WS will push the lobby update to both; but if ACTIVE already proceed
      if (lobby.state === "ACTIVE") {
        get().startBattlePolling(battleId, userId);
      }
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  /* ═══════════════════════════════════════════════════════════
   * ARENA
   * ═══════════════════════════════════════════════════════════ */

  startBattlePolling: async (battleId, userId) => {
    get().stopBattlePolling();

    // ── WebSocket subscriptions for real-time updates ──
    const wsOk = get()._wsConnected || (await get()._connectStomp());
    if (wsOk) {
      // Per-user state topic (my perspective of the battle)
      get()._subscribe(`/topic/battle/${battleId}/state/${userId}`, (stateDTO) => {
        set({ battleState: stateDTO });
        if (stateDTO.state === "COMPLETED" || stateDTO.state === "CANCELLED") {
          get().stopBattlePolling();
        }
      });

      // Per-user result topic (fires on completion)
      get()._subscribe(`/topic/battle/${battleId}/result/${userId}`, (resultDTO) => {
        set({ result: resultDTO });
      });
    }

    // ── HTTP polling fallback (runs alongside WS, last-write-wins) ──
    const interval = setInterval(async () => {
      try {
        const state = await fetchBattleState(battleId, userId);
        set({ battleState: state });
        if (state.state === "COMPLETED" || state.state === "CANCELLED") {
          get().stopBattlePolling();
        }
      } catch {
        // ignore
      }
    }, POLL_INTERVAL);
    set({ _battleInterval: interval });

    // Fetch once immediately
    fetchBattleState(battleId, userId)
      .then((s) => set({ battleState: s }))
      .catch(() => { });
  },

  stopBattlePolling: () => {
    const interval = get()._battleInterval;
    if (interval) clearInterval(interval);
    set({ _battleInterval: null });
  },

  submitCode: async (battleId, userId, problemIndex, language, code) => {
    set({ submitting: true, error: null });
    try {
      const result = await submitBattleCode(battleId, { userId, problemIndex, language, code });
      set({ submitting: false });
      // Re-fetch state immediately after submit (WS will also push)
      const state = await fetchBattleState(battleId, userId);
      set({ battleState: state });
      // Refresh global gamification stats so navbar coins/XP update instantly
      try {
        const { default: useGamificationStore } = await import("./useGamificationStore");
        useGamificationStore.getState().loadStats(userId);
      } catch { /* non-critical */ }
      return result;
    } catch (e) {
      set({ error: e.message, submitting: false });
      throw e;
    }
  },

  /* ── Forfeit ── */
  forfeit: async (battleId, userId) => {
    get().stopBattlePolling();
    try { await forfeitBattle(battleId, userId); } catch { /* ignore */ }
  },

  /* ── Abandon (force-complete stuck battle so user can re-queue) ── */
  abandon: async (battleId, userId) => {
    get().stopBattlePolling();
    try {
      await apiAbandonBattle(battleId, userId);
    } catch { /* ignore */ }
    set({ battleId: null, activeBattleState: null, activeBattleMode: null, activeBattleRoomCode: null, battleState: null, lobby: null, error: null });
  },

  /* ── Result ── */
  fetchResult: async (battleId, userId) => {
    set({ loading: true, error: null });
    try {
      const result = await fetchBattleResult(battleId, userId);
      set({ result, loading: false });
      return { ok: true, status: 200, result };
    } catch (e) {
      // 409 means battle is not completed yet; resolve current state so caller can route.
      if (e?.status === 409) {
        try {
          const state = await fetchBattleState(battleId, userId);
          set({ battleState: state, loading: false, error: null });
          return { ok: false, status: 409, pendingState: state?.state || null };
        } catch {
          set({ loading: false, error: "Battle is not finished yet." });
          return { ok: false, status: 409, pendingState: null };
        }
      }
      set({ error: e.message, loading: false });
      return { ok: false, status: e?.status || 500 };
    }
  },

  /* ═══════════════════════════════════════════════════════════
   * CLEANUP
   * ═══════════════════════════════════════════════════════════ */

  stopPolling: () => {
    get().stopQueuePolling();
    get().stopBattlePolling();
    get()._unsubscribeAll();
  },

  reset: () => {
    get().stopPolling();
    get()._disconnectStomp();
    set({
      queueStatus: null, activeBattleState: null, activeBattleMode: null, activeBattleRoomCode: null, battleId: null, lobby: null,
      battleState: null, result: null, error: null,
      loading: false, submitting: false,
    });
  },

  checkActiveBattle: async (userId) => {
    try {
      const res = await apiCheckActiveBattle(userId);
      if (res?.battleId) {
        set({
          activeBattleState: res.state,
          battleId: res.battleId,
          activeBattleMode: res.mode || null,
          activeBattleRoomCode: res.roomCode || null,
        });
      } else {
        set({ activeBattleState: null, battleId: null, activeBattleMode: null, activeBattleRoomCode: null });
      }
    } catch (e) {
      console.warn("Failed to check for active battle on load:", e.message);
      set({ activeBattleState: null, battleId: null, activeBattleMode: null, activeBattleRoomCode: null });
    }
  },
}));

// Logout: reset this store and close the shared STOMP connection.
useUserStore.subscribe((state, prev) => {
  if (prev.user && !state.user) {
    useBattleStore.getState().reset();
    stompClient.deactivate();
  }
});

export default useBattleStore;
