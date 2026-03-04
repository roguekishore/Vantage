import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
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
} from "../services/battleApi";

const WS_URL = "http://localhost:8080/ws";
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
  activeBattleState: null, // null | "WAITING" | "ACTIVE" — set when joinQueue finds existing battle
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
  _stompClient: null,
  _stompSubscriptions: [],   // active STOMP subscriptions to unsubscribe on cleanup
  _wsConnected: false,

  /* ═══════════════════════════════════════════════════════════
   * STOMP WEBSOCKET HELPERS
   * ═══════════════════════════════════════════════════════════ */

  /**
   * Create & activate a STOMP client. Resolves once connected.
   * If connection fails, sets _wsConnected = false so callers know
   * to start polling fallback.
   */
  _connectStomp: () =>
    new Promise((resolve) => {
      const existing = get()._stompClient;
      if (existing?.connected) {
        set({ _wsConnected: true });
        resolve(true);
        return;
      }

      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => {},          // silence debug logs
        onConnect: () => {
          set({ _stompClient: client, _wsConnected: true });
          resolve(true);
        },
        onStompError: () => {
          set({ _wsConnected: false });
          resolve(false);
        },
        onWebSocketClose: () => {
          set({ _wsConnected: false });
        },
      });

      // If SockJS fails to even open, catch it
      try {
        client.activate();
      } catch {
        set({ _wsConnected: false });
        resolve(false);
      }

      // Timeout — if not connected in 4s, fall back
      setTimeout(() => {
        if (!client.connected) {
          set({ _wsConnected: false });
          resolve(false);
        }
      }, 4000);
    }),

  /** Subscribe to a STOMP destination. Returns the subscription object. */
  _subscribe: (destination, callback) => {
    const client = get()._stompClient;
    if (!client?.connected) return null;
    const sub = client.subscribe(destination, (message) => {
      try {
        callback(JSON.parse(message.body));
      } catch {
        callback(message.body);
      }
    });
    set({ _stompSubscriptions: [...get()._stompSubscriptions, sub] });
    return sub;
  },

  /** Unsubscribe all active STOMP subscriptions. */
  _unsubscribeAll: () => {
    const subs = get()._stompSubscriptions;
    subs.forEach((s) => {
      try { s.unsubscribe(); } catch { /* already closed */ }
    });
    set({ _stompSubscriptions: [] });
  },

  /** Deactivate the STOMP client entirely. */
  _disconnectStomp: () => {
    get()._unsubscribeAll();
    const client = get()._stompClient;
    if (client) {
      try { client.deactivate(); } catch { /* ignore */ }
    }
    set({ _stompClient: null, _wsConnected: false });
  },

  /* ═══════════════════════════════════════════════════════════
   * QUEUE
   * ═══════════════════════════════════════════════════════════ */

  joinQueue: async (userId, mode, difficulty, problemCount) => {
    // Clean up any lingering state / subscriptions from a previous battle
    get().stopPolling();
    get()._disconnectStomp();
    set({
      loading: true, error: null, queueStatus: null,
      battleId: null, lobby: null, battleState: null, result: null,
    });
    try {
      const response = await apiJoinQueue({ userId, mode, difficulty, problemCount });

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
      // Always start polling as fallback (WS will race it — first to fire wins)
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
      // Retry up to 3 times with delay — handles race condition where
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
      .catch(() => {});
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
    set({ battleId: null, activeBattleState: null, battleState: null, lobby: null, error: null });
  },

  /* ── Result ── */
  fetchResult: async (battleId, userId) => {
    set({ loading: true, error: null });
    try {
      const result = await fetchBattleResult(battleId, userId);
      set({ result, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
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
      queueStatus: null, activeBattleState: null, battleId: null, lobby: null,
      battleState: null, result: null, error: null,
      loading: false, submitting: false,
    });
  },
}));

export default useBattleStore;
