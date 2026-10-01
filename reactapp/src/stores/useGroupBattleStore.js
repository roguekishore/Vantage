import { create } from "zustand";
import stompClient from "../services/stompClient";
import useUserStore from "./useUserStore";
import {
  createRoom as apiCreateRoom,
  fetchRoomByCode,
  joinRoom as apiJoinRoom,
  leaveRoom as apiLeaveRoom,
  kickFromRoom as apiKickFromRoom,
  startGroupBattle as apiStartGroupBattle,
  fetchGroupBattleState,
  submitGroupBattleCode,
  forfeitGroupBattle,
  fetchGroupBattleResult,
} from "../services/groupBattleApi";

const POLL_INTERVAL = 3000;

/**
 * Zustand store for Group Battle (FFA) system.
 * Mirrors useBattleStore architecture: STOMP primary + HTTP polling fallback.
 */
const useGroupBattleStore = create((set, get) => ({
  /* ── State ── */
  room: null,           // RoomLobbyDTO - room lobby snapshot
  roomCode: null,       // 6-char code
  battleId: null,
  groupState: null,     // GroupBattleStateDTO - live scoreboard
  result: null,         // GroupBattleResultDTO - final placement
  error: null,
  loading: false,
  submitting: false,
  kicked: false,        // set when WS notifies this user was kicked

  /* ── Internal refs ── */
  _pollInterval: null,
  _stompSubscriptions: [],   // destinations this store owns (deduped)
  _stompStatusOff: null,
  _wsConnected: false,

  /* ═══════════════════════════════════════════════════════════
   * STOMP HELPERS
   * ═══════════════════════════════════════════════════════════ */

  /** Connect the shared tab-wide STOMP client; true once connected. */
  _connectStomp: async () => {
    if (!get()._stompStatusOff) {
      const off = stompClient.onStatus((connected) => set({ _wsConnected: connected }));
      set({ _stompStatusOff: off });
    }
    const ok = await stompClient.connect();
    set({ _wsConnected: ok });
    return ok;
  },

  /** Idempotent per destination; re-applied automatically after reconnect. */
  _subscribe: (destination, handler) => {
    stompClient.subscribe(destination, handler);
    if (!get()._stompSubscriptions.includes(destination)) {
      set({ _stompSubscriptions: [...get()._stompSubscriptions, destination] });
    }
  },

  /** Release this store's destinations; the shared client stays up for other stores. */
  _disconnectStomp: () => {
    get()._stompSubscriptions.forEach((dest) => stompClient.unsubscribe(dest));
    const off = get()._stompStatusOff;
    if (off) off();
    set({ _stompSubscriptions: [], _stompStatusOff: null, _wsConnected: false });
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
    // Subscribe even if not yet connected: the shared client applies it on connect.
    await get()._connectStomp();

    // Live scoreboard
    get()._subscribe(
      `/topic/battle/${battleId}/group-state/${userId}`,
      (state) => {
        set({ groupState: state });
        if (state?.state === "COMPLETED") {
          fetchGroupBattleResult(battleId, userId)
            .then((result) => set({ result }))
            .catch(() => {});
        }
      }
    );

    // Final result
    get()._subscribe(
      `/topic/battle/${battleId}/group-result/${userId}`,
      (result) => {
        set({ result });
      }
    );
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

  /**
   * Forfeit an active group battle.
   * @param {number} battleId
   * @param {number} userId
   */
  forfeit: async (battleId, userId) => {
    set({ loading: true, error: null });
    try {
      await forfeitGroupBattle(battleId, userId);
      set({ loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  /* ═══════════════════════════════════════════════════════════
   * INTERNAL - ROOM SUBSCRIPTION
   * ═══════════════════════════════════════════════════════════ */

  _subscribeToRoom: async (battleId, userId) => {
    // Subscribe even if not yet connected: the shared client applies it on connect.
    await get()._connectStomp();

    // Room lobby updates (player join/leave/kick)
    get()._subscribe(`/topic/battle/${battleId}/room`, (payload) => {
      if (payload.state === "CANCELLED") {
        set({
          room: {
            ...get().room,
            state: "CANCELLED",
            cancelMessage: payload.message || "Room was cancelled",
          },
        });
      } else {
        set({ room: payload });
      }
    });

    // Battle started - transition from lobby to arena
    get()._subscribe(`/topic/battle/${battleId}/started`, () => {
      set({ room: { ...get().room, state: "ACTIVE" } });
    });

    // Kicked notification for this specific user
    get()._subscribe(`/topic/battle/${battleId}/kicked/${userId}`, () => {
      set({ kicked: true });
    });
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

// Logout: reset this store and close the shared STOMP connection.
useUserStore.subscribe((state, prev) => {
  if (prev.user && !state.user) {
    useGroupBattleStore.getState().reset();
    stompClient.deactivate();
  }
});

export default useGroupBattleStore;
