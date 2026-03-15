import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "@/services/api";
import {
  acceptFriendChallenge,
  acceptFriendRequest,
  cancelFriendChallenge,
  cancelFriendRequest,
  clearChallengeMute,
  fetchChallengeMuteStatus,
  fetchFriendsPresence,
  fetchFriendsOverview,
  fetchIncomingChallenges,
  muteFriendChallenges,
  pingFriendPresence,
  rejectFriendChallenge,
  rejectFriendRequest,
  searchFriendsUsers,
  sendFriendChallenge,
  sendFriendRequest,
} from "@/services/friendsApi";

const WS_URL = "http://localhost:8080/ws";

const useFriendsStore = create((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  incomingCount: 0,
  incomingChallenges: [],
  activeIncomingChallenge: null,
  activeOutgoingChallenge: null,
  outgoingChallengeMinimized: false,
  challengeAcceptedBattleId: null,
  challengeMuteUntil: null,
  friendsPresence: {},

  searchQuery: "",
  searchResults: [],
  searchPage: 0,
  searchTotalPages: 0,
  searchTotalElements: 0,

  loadingOverview: false,
  loadingSearch: false,
  actionLoading: false,
  error: null,
  lastNotification: null,

  _stompClient: null,
  _stompSubscriptions: [],
  _wsConnected: false,
  _searchRequestSeq: 0,
  _presenceInterval: null,

  clearNotification: () => set({ lastNotification: null }),
  dismissIncomingChallengeModal: () => set({ activeIncomingChallenge: null }),
  dismissOutgoingChallengeModal: () =>
    set((state) => ({
      outgoingChallengeMinimized: !!state.activeOutgoingChallenge,
    })),
  reopenOutgoingChallengeModal: () => set({ outgoingChallengeMinimized: false }),
  clearChallengeAcceptedBattleId: () => set({ challengeAcceptedBattleId: null }),

  loadOverview: async () => {
    set({ loadingOverview: true, error: null });
    try {
      const data = await fetchFriendsOverview();
      set({
        friends: data?.friends || [],
        incomingRequests: data?.incomingRequests || [],
        outgoingRequests: data?.outgoingRequests || [],
        incomingCount: data?.incomingCount || 0,
        loadingOverview: false,
      });
    } catch (e) {
      set({ loadingOverview: false, error: e.message || "Failed to load friends" });
    }
  },

  loadIncomingChallenges: async () => {
    try {
      const items = await fetchIncomingChallenges();
      set((state) => {
        const muted = state.challengeMuteUntil && new Date(state.challengeMuteUntil).getTime() > Date.now();
        return {
          incomingChallenges: items || [],
          activeIncomingChallenge: muted ? null : (items?.[0] || null),
        };
      });
    } catch {
      // no-op
    }
  },

  loadChallengeMuteStatus: async () => {
    try {
      const data = await fetchChallengeMuteStatus();
      set({ challengeMuteUntil: data?.muted ? data?.mutedUntil || null : null });
    } catch {
      // no-op
    }
  },

  loadFriendsPresence: async () => {
    try {
      const rows = await fetchFriendsPresence();
      const map = {};
      (rows || []).forEach((r) => {
        map[r.uid] = {
          online: !!r.online,
          lastActiveAt: r.lastActiveAt || null,
          username: r.username,
        };
      });
      set({ friendsPresence: map });
    } catch {
      // no-op
    }
  },

  pingPresence: async () => {
    try {
      await pingFriendPresence();
    } catch {
      // no-op
    }
  },

  _startPresenceHeartbeat: () => {
    get()._stopPresenceHeartbeat();
    get().pingPresence();
    get().loadFriendsPresence();
    const id = setInterval(() => {
      get().pingPresence();
      get().loadFriendsPresence();
    }, 20000);
    set({ _presenceInterval: id });
  },

  _stopPresenceHeartbeat: () => {
    const id = get()._presenceInterval;
    if (id) clearInterval(id);
    set({ _presenceInterval: null });
  },

  searchUsers: async (query, page = 0, size = 10) => {
    const reqSeq = get()._searchRequestSeq + 1;
    set({
      loadingSearch: true,
      error: null,
      searchQuery: query || "",
      _searchRequestSeq: reqSeq,
    });
    try {
      const data = await searchFriendsUsers(query, page, size);
      if (reqSeq !== get()._searchRequestSeq) return;
      set({
        searchResults: data?.content || [],
        searchPage: data?.number || 0,
        searchTotalPages: data?.totalPages || 0,
        searchTotalElements: data?.totalElements || 0,
        loadingSearch: false,
      });
    } catch (e) {
      if (reqSeq !== get()._searchRequestSeq) return;
      set({ loadingSearch: false, error: e.message || "Search failed" });
    }
  },

  sendRequest: async (targetUserId) => {
    set({ actionLoading: true, error: null });
    try {
      const response = await sendFriendRequest(targetUserId);

      set((state) => ({
        outgoingRequests: response
          ? [response, ...state.outgoingRequests.filter((r) => r.id !== response.id)]
          : state.outgoingRequests,
        searchResults: state.searchResults.map((u) =>
          u.uid === targetUserId
            ? {
                ...u,
                relationStatus: "REQUEST_SENT",
                pendingRequestId: response?.id ?? u.pendingRequestId,
              }
            : u
        ),
      }));

      set({ actionLoading: false });

      // Keep server state in sync without blocking immediate UI update.
      get().loadOverview();
      if (get().searchQuery.trim()) {
        get().searchUsers(get().searchQuery, get().searchPage, 10);
      }
      return true;
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to send request" });
      return false;
    }
  },

  acceptRequest: async (requestId) => {
    set({ actionLoading: true, error: null });
    try {
      const response = await acceptFriendRequest(requestId);
      const friendUid = response?.requester?.uid;
      const friendUsername = response?.requester?.username;

      set((state) => ({
        incomingRequests: state.incomingRequests.filter((r) => r.id !== requestId),
        incomingCount: Math.max(0, (state.incomingCount || 0) - 1),
        friends:
          friendUid && !state.friends.some((f) => f.uid === friendUid)
            ? [{ uid: friendUid, username: friendUsername }, ...state.friends]
            : state.friends,
        searchResults: state.searchResults.map((u) =>
          (u.pendingRequestId === requestId || u.uid === friendUid)
            ? { ...u, relationStatus: "FRIEND", pendingRequestId: null }
            : u
        ),
      }));

      set({ actionLoading: false });

      get().loadOverview();
      if (get().searchQuery.trim()) {
        get().searchUsers(get().searchQuery, get().searchPage, 10);
      }
      return true;
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to accept request" });
      return false;
    }
  },

  rejectRequest: async (requestId) => {
    set({ actionLoading: true, error: null });
    try {
      await rejectFriendRequest(requestId);

      set((state) => ({
        incomingRequests: state.incomingRequests.filter((r) => r.id !== requestId),
        incomingCount: Math.max(0, (state.incomingCount || 0) - 1),
        searchResults: state.searchResults.map((u) =>
          u.pendingRequestId === requestId
            ? { ...u, relationStatus: "NONE", pendingRequestId: null }
            : u
        ),
      }));

      set({ actionLoading: false });

      get().loadOverview();
      if (get().searchQuery.trim()) {
        get().searchUsers(get().searchQuery, get().searchPage, 10);
      }
      return true;
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to reject request" });
      return false;
    }
  },

  cancelRequest: async (requestId) => {
    set({ actionLoading: true, error: null });
    try {
      const outgoing = get().outgoingRequests.find((r) => r.id === requestId);
      await cancelFriendRequest(requestId);

      set((state) => ({
        outgoingRequests: state.outgoingRequests.filter((r) => r.id !== requestId),
        searchResults: state.searchResults.map((u) =>
          outgoing?.addressee?.uid && u.uid === outgoing.addressee.uid
            ? { ...u, relationStatus: "NONE", pendingRequestId: null }
            : u
        ),
      }));

      set({ actionLoading: false });

      get().loadOverview();
      if (get().searchQuery.trim()) {
        get().searchUsers(get().searchQuery, get().searchPage, 10);
      }
      return true;
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to cancel request" });
      return false;
    }
  },

  sendChallenge: async (payload) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await sendFriendChallenge(payload);
      if (res?.status === "MUTED") {
        set({
          actionLoading: false,
          lastNotification: res.message || "Challenge closed: friend has muted match requests",
        });
        return { ok: false, muted: true, message: res?.message, mutedUntil: res?.mutedUntil || null };
      }

      set({
        actionLoading: false,
        lastNotification: res?.message || "Challenge sent",
        activeOutgoingChallenge: res?.challenge || null,
        outgoingChallengeMinimized: false,
      });
      return { ok: true, challenge: res?.challenge || null };
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to send challenge" });
      return { ok: false, error: e.message };
    }
  },

  acceptChallenge: async (challengeId) => {
    set({ actionLoading: true, error: null });
    try {
      const challenge = await acceptFriendChallenge(challengeId);
      set((state) => ({
        actionLoading: false,
        incomingChallenges: state.incomingChallenges.filter((c) => c.id !== challengeId),
        activeIncomingChallenge:
          state.activeIncomingChallenge?.id === challengeId ? null : state.activeIncomingChallenge,
        lastNotification: "Challenge accepted. Opening battle lobby...",
        challengeAcceptedBattleId: challenge?.battleId || null,
      }));
      return { ok: true, challenge };
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to accept challenge" });
      return { ok: false, error: e.message };
    }
  },

  rejectChallenge: async (challengeId) => {
    set({ actionLoading: true, error: null });
    try {
      await rejectFriendChallenge(challengeId);
      set((state) => ({
        actionLoading: false,
        incomingChallenges: state.incomingChallenges.filter((c) => c.id !== challengeId),
        activeIncomingChallenge:
          state.activeIncomingChallenge?.id === challengeId ? null : state.activeIncomingChallenge,
        lastNotification: "Challenge request closed",
      }));
      return { ok: true };
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to reject challenge" });
      return { ok: false, error: e.message };
    }
  },

  cancelChallenge: async (challengeId) => {
    set({ actionLoading: true, error: null });
    try {
      await cancelFriendChallenge(challengeId);
      set((state) => ({
        actionLoading: false,
        lastNotification: "Challenge request closed",
        activeOutgoingChallenge:
          state.activeOutgoingChallenge?.id === challengeId ? null : state.activeOutgoingChallenge,
      }));
      return { ok: true };
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to cancel challenge" });
      return { ok: false, error: e.message };
    }
  },

  muteChallenges: async (minutes) => {
    set({ actionLoading: true, error: null });
    try {
      const res = await muteFriendChallenges(minutes);
      const msg = res?.mutedUntil
        ? `Match requests muted until ${new Date(res.mutedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "Match requests muted";
      set({
        actionLoading: false,
        challengeMuteUntil: res?.mutedUntil || null,
        activeIncomingChallenge: null,
        lastNotification: msg,
      });
      return { ok: true, mutedUntil: res?.mutedUntil || null };
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to mute challenges" });
      return { ok: false, error: e.message };
    }
  },

  unmuteChallenges: async () => {
    set({ actionLoading: true, error: null });
    try {
      await clearChallengeMute();
      set({
        actionLoading: false,
        challengeMuteUntil: null,
        lastNotification: "Do Not Disturb disabled",
      });
      return { ok: true };
    } catch (e) {
      set({ actionLoading: false, error: e.message || "Failed to disable mute" });
      return { ok: false, error: e.message };
    }
  },

  connectNotifications: async (userId) => {
    get()._startPresenceHeartbeat();
    const existing = get()._stompClient;
    if (existing?.connected) return true;

    return new Promise((resolve) => {
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${getToken() || ""}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => {},
        onConnect: () => {
          const subRequests = client.subscribe(`/topic/friends/${userId}/requests`, (message) => {
            let data = {};
            try {
              data = JSON.parse(message.body);
            } catch {
              data = { message: "New friend activity" };
            }
            const msg = data?.message || "You have a new friend request";
            set((state) => ({
              lastNotification: msg,
              incomingCount: (state.incomingCount || 0) + (data?.type === "FRIEND_REQUEST_RECEIVED" ? 1 : 0),
            }));
            get().loadOverview();
          });

          const subChallenges = client.subscribe(`/topic/friends/${userId}/challenges`, (message) => {
            let data = {};
            try {
              data = JSON.parse(message.body);
            } catch {
              data = { message: "Challenge update received" };
            }

            const type = data?.type;
            const challenge = data?.challenge || null;
            const msg = data?.message || "Challenge update";

            if (type === "FRIEND_MATCH_REQUEST_RECEIVED" && challenge) {
              set((state) => {
                const muted = state.challengeMuteUntil && new Date(state.challengeMuteUntil).getTime() > Date.now();
                const nextIncoming = [
                  challenge,
                  ...state.incomingChallenges.filter((c) => c.id !== challenge.id),
                ];
                return {
                  lastNotification: msg,
                  incomingChallenges: nextIncoming,
                  activeIncomingChallenge: muted ? null : challenge,
                };
              });
              return;
            }

            if (type === "FRIEND_MATCH_REQUEST_CLOSED") {
              const closedId = challenge?.id;
              set((state) => ({
                lastNotification: msg,
                incomingChallenges: closedId
                  ? state.incomingChallenges.filter((c) => c.id !== closedId)
                  : state.incomingChallenges,
                activeIncomingChallenge:
                  closedId && state.activeIncomingChallenge?.id === closedId
                    ? null
                    : state.activeIncomingChallenge,
                activeOutgoingChallenge:
                  closedId && state.activeOutgoingChallenge?.id === closedId
                    ? null
                    : state.activeOutgoingChallenge,
                outgoingChallengeMinimized:
                  closedId && state.activeOutgoingChallenge?.id === closedId
                    ? false
                    : state.outgoingChallengeMinimized,
              }));
              return;
            }

            if (type === "FRIEND_MATCH_REQUEST_ACCEPTED") {
              set((state) => ({
                lastNotification: msg,
                challengeAcceptedBattleId: data?.battleId || state.challengeAcceptedBattleId,
                activeOutgoingChallenge:
                  challenge?.id && state.activeOutgoingChallenge?.id === challenge.id
                    ? null
                    : state.activeOutgoingChallenge,
                outgoingChallengeMinimized:
                  challenge?.id && state.activeOutgoingChallenge?.id === challenge.id
                    ? false
                    : state.outgoingChallengeMinimized,
              }));
              return;
            }

            if (type === "FRIEND_MATCH_REQUEST_MUTE_SET") {
              set({
                challengeMuteUntil: data?.mutedUntil || null,
                activeIncomingChallenge: null,
                lastNotification: msg,
              });
              return;
            }

            if (type === "FRIEND_MATCH_REQUEST_MUTE_CLEARED") {
              set({
                challengeMuteUntil: null,
                lastNotification: msg || "Do Not Disturb disabled",
              });
              return;
            }

            set({ lastNotification: msg });
          });

          set({
            _stompClient: client,
            _stompSubscriptions: [subRequests, subChallenges],
            _wsConnected: true,
          });

          get().loadIncomingChallenges();
          get().loadChallengeMuteStatus();
          get()._startPresenceHeartbeat();
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

      try {
        client.activate();
      } catch {
        set({ _wsConnected: false });
        resolve(false);
      }

      setTimeout(() => {
        if (!client.connected) {
          set({ _wsConnected: false });
          resolve(false);
        }
      }, 4000);
    });
  },

  disconnectNotifications: () => {
    get()._stopPresenceHeartbeat();
    const subs = get()._stompSubscriptions || [];
    subs.forEach((sub) => {
      try { sub.unsubscribe(); } catch { /* no-op */ }
    });
    const client = get()._stompClient;
    if (client) {
      try { client.deactivate(); } catch { /* no-op */ }
    }
    set({
      _stompSubscriptions: [],
      _stompClient: null,
      _wsConnected: false,
    });
  },

  reset: () => {
    get().disconnectNotifications();
    set({
      friends: [],
      incomingRequests: [],
      outgoingRequests: [],
      incomingCount: 0,
      incomingChallenges: [],
      activeIncomingChallenge: null,
      activeOutgoingChallenge: null,
      outgoingChallengeMinimized: false,
      challengeAcceptedBattleId: null,
      challengeMuteUntil: null,
      friendsPresence: {},
      searchQuery: "",
      searchResults: [],
      searchPage: 0,
      searchTotalPages: 0,
      searchTotalElements: 0,
      loadingOverview: false,
      loadingSearch: false,
      actionLoading: false,
      error: null,
      lastNotification: null,
    });
  },
}));

export default useFriendsStore;
