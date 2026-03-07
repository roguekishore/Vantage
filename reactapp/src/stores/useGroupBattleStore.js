import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "../services/api";
import {
  createRoom as apiCreateRoom,
  fetchRoomByCode,
  joinRoom as apiJoinRoom,
  leaveRoom as apiLeaveRoom,
  kickFromRoom as apiKickFromRoom,
  startGroupBattle as apiStartGroupBattle,
  fetchGroupBattleState,
  submitGroupBattleCode,
  fetchGroupBattleResult,
} from "../services/groupBattleApi";

const WS_URL = "http://localhost:8080/ws";
const POLL_INTERVAL = 3000;

/**
 * Zustand store for Group Battle (FFA) system.
 * Mirrors useBattleStore architecture: STOMP primary + HTTP polling fallback.
 */
const useGroupBattleStore = create((set, get) => ({
  /* ── State ── */
  room: null,           // RoomLobbyDTO — room lobby snapshot
  roomCode: null,       // 6-char code
  battleId: null,
  groupState: null,     // GroupBattleStateDTO — live scoreboard
  result: null,         // GroupBattleResultDTO — final placement
  error: null,
  loading: false,
  submitting: false,
  kicked: false,        // set when WS notifies this user was kicked

  /* ── Internal refs ── */
  _pollInterval: null,
  _stompClient: null,
  _stompSubscriptions: [],
  _wsConnected: false,

  /* ═══════════════════════════════════════════════════════════
   * STOMP HELPERS
   * ═══════════════════════════════════════════════════════════ */

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
        connectHeaders: { Authorization: `Bearer ${getToken() || ''}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => {},
        onConnect: () => {
          set({ _stompClient: client, _wsConnected: true });
          resolve(true);
        },
        onStompError: () => {
          set({ _wsConnected: false });
          resolve(false);
        },
        onWebSocketClose: () => set({ _wsConnected: false }),
      });
      client.activate();
    }),

  _disconnectStomp: () => {
    const { _stompClient, _stompSubscriptions } = get();
    _stompSubscriptions.forEach((sub) => { try { sub.unsubscribe(); } catch (_) {} });
    if (_stompClient?.active) { try { _stompClient.deactivate(); } catch (_) {} }
    set({ _stompClient: null, _stompSubscriptions: [], _wsConnected: false });
  },

  _stopPoll: () => {
    const { _pollInterval } = get();
    if (_pollInterval) { clearInterval(_pollInterval); set({ _pollInterval: null }); }
  },

  /* ═══════════════════════════════════════════════════════════
   * ROOM MANAGEMENT
   * ═══════════════════════════════════════════════════════════ */

  /**
   * Create a new group room.
   * @param {number} userId
   * @param {{ mode, difficulty, problemCount, maxPlayers, durationMinutes }} opts
   */
  createRoom: async (userId, opts) => {
    set({ loading: true, error: null });
    try {
      const room = await apiCreateRoom(userId, opts);
      set({ room, roomCode: room.roomCode, battleId: room.battleId, loading: false });
      // Subscribe to room broadcast
      await get()._subscribeToRoom(room.battleId, userId);
      return room;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  /**
   * Fetch room details by code (for joining flow).
   * @param {string} code
   */
  lookupRoom: async (code) => {
    set({ loading: true, error: null });
    try {
      const room = await fetchRoomByCode(code);
      set({ room, roomCode: room.roomCode, battleId: room.battleId, loading: false });
      return room;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  /**
   * Join a room.
   * @param {string} code
   * @param {number} userId
   */
  joinRoom: async (code, userId) => {
    set({ loading: true, error: null, kicked: false });
    try {
      const room = await apiJoinRoom(code, userId);
      set({ room, roomCode: room.roomCode, battleId: room.battleId, loading: false });
      await get()._subscribeToRoom(room.battleId, userId);
      return room;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  /**
   * Leave a room.
   * @param {string} code
   * @param {number} userId
   */
  leaveRoom: async (code, userId) => {
    get()._stopPoll();
    get()._disconnectStomp();
    try {
      await apiLeaveRoom(code, userId);
    } catch (_) {}
    set({ room: null, roomCode: null, battleId: null, groupState: null, result: null, error: null });
  },

  /**
   * Kick a player (creator only).
   * @param {string} code
   * @param {number} kickerId
   * @param {number} targetUserId
   */
  kickPlayer: async (code, kickerId, targetUserId) => {
    try {
      const room = await apiKickFromRoom(code, kickerId, targetUserId);
      set({ room });
    } catch (e) {
      set({ error: e.message });
    }
  },

  /**
   * Start the battle (creator only).
   * @param {string} code
   * @param {number} userId
   */
  startBattle: async (code, userId) => {
    set({ loading: true, error: null });
    try {
      await apiStartGroupBattle(code, userId);
      set({ loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  /* ═══════════════════════════════════════════════════════════
   * ARENA
   * ═══════════════════════════════════════════════════════════ */

  /**
   * Start polling group battle state.
   * @param {number} battleId
   * @param {number} userId
   */
  startGroupPolling: async (battleId, userId) => {
    get()._stopPoll();
    const fetchState = async () => {
      try {
        const state = await fetchGroupBattleState(battleId, userId);
        set({ groupState: state });
        if (state.state === "COMPLETED") {
          get()._stopPoll();
          try {
            const result = await fetchGroupBattleResult(battleId, userId);
            set({ result });
          } catch (_) {}
        }
      } catch (_) {}
    };
    await fetchState();
    const id = setInterval(fetchState, POLL_INTERVAL);
    set({ _pollInterval: id });
  },

  /**
   * Subscribe to STOMP group-state for live scoreboard updates.
   * @param {number} battleId
   * @param {number} userId
   */
  subscribeGroupState: async (battleId, userId) => {
    const connected = await get()._connectStomp();
    if (!connected) return;
    const client = get()._stompClient;
    const subs = [];

    // Live scoreboard
    subs.push(client.subscribe(
      `/topic/battle/${battleId}/group-state/${userId}`,
      (msg) => {
        const state = JSON.parse(msg.body);
        set({ groupState: state });
        if (state.state === "COMPLETED") {
          fetchGroupBattleResult(battleId, userId)
            .then((result) => set({ result }))
            .catch(() => {});
        }
      }
    ));

    // Final result
    subs.push(client.subscribe(
      `/topic/battle/${battleId}/group-result/${userId}`,
      (msg) => {
        const result = JSON.parse(msg.body);
        set({ result });
      }
    ));

    set({ _stompSubscriptions: [...get()._stompSubscriptions, ...subs] });
  },

  /**
   * Submit code.
   * @param {number} battleId
   * @param {{ userId, problemIndex, language, code }} opts
   */
  submitCode: async (battleId, opts) => {
    set({ submitting: true, error: null });
    try {
      const result = await submitGroupBattleCode(battleId, opts);
      set({ submitting: false });
      return result;
    } catch (e) {
      set({ error: e.message, submitting: false });
      throw e;
    }
  },

  /* ═══════════════════════════════════════════════════════════
   * INTERNAL — ROOM SUBSCRIPTION
   * ═══════════════════════════════════════════════════════════ */

  _subscribeToRoom: async (battleId, userId) => {
    const connected = await get()._connectStomp();
    if (!connected) return;
    const client = get()._stompClient;
    const subs = [];

    // Room lobby updates (player join/leave/kick)
    subs.push(client.subscribe(`/topic/battle/${battleId}/room`, (msg) => {
      const payload = JSON.parse(msg.body);
      if (payload.state === "CANCELLED") {
        set({ room: { ...get().room, state: "CANCELLED" } });
      } else {
        set({ room: payload });
      }
    }));

    // Battle started — transition from lobby to arena
    subs.push(client.subscribe(`/topic/battle/${battleId}/started`, (msg) => {
      const payload = JSON.parse(msg.body);
      set({ room: { ...get().room, state: "ACTIVE" } });
    }));

    // Kicked notification for this specific user
    subs.push(client.subscribe(`/topic/battle/${battleId}/kicked/${userId}`, (msg) => {
      set({ kicked: true });
    }));

    set({ _stompSubscriptions: [...get()._stompSubscriptions, ...subs] });
  },

  /* ═══════════════════════════════════════════════════════════
   * RESET
   * ═══════════════════════════════════════════════════════════ */

  reset: () => {
    get()._stopPoll();
    get()._disconnectStomp();
    set({
      room: null, roomCode: null, battleId: null,
      groupState: null, result: null, error: null,
      loading: false, submitting: false, kicked: false,
    });
  },
}));

export default useGroupBattleStore;
