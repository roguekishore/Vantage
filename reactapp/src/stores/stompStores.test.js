jest.mock("@/services/friendsApi", () => ({}), { virtual: true });
jest.mock("../services/stompClient", () => ({
  __esModule: true,
  default: {
    connect: jest.fn(async () => true),
    subscribe: jest.fn(() => jest.fn()),
    unsubscribe: jest.fn(),
    onStatus: jest.fn(() => jest.fn()),
    deactivate: jest.fn(),
  },
}));
jest.mock("../services/api", () => ({ getToken: () => "t", authFetch: jest.fn() }));

import stompClient from "../services/stompClient";
import useUserStore from "./useUserStore";
import useBattleStore from "./useBattleStore";
import useGroupBattleStore from "./useGroupBattleStore";
import useFriendsStore from "./useFriendsStore";

test("repeated subscribe of one destination is tracked once in the battle store", () => {
  const s = useBattleStore.getState();
  for (let i = 0; i < 5; i += 1) s._subscribe("/topic/battle/1/state/2", () => {});
  expect(useBattleStore.getState()._stompSubscriptions).toEqual(["/topic/battle/1/state/2"]);
});

test("logout resets every store and deactivates the shared client", async () => {
  useUserStore.setState({ user: { uid: 2, token: "t" } });
  useBattleStore.setState({ battleId: 5 });
  useGroupBattleStore.setState({ battleId: 6 });
  useFriendsStore.setState({ friends: [{ uid: 1 }] });
  useUserStore.setState({ user: null });
  expect(useBattleStore.getState().battleId).toBeNull();
  expect(useGroupBattleStore.getState().battleId).toBeNull();
  expect(useFriendsStore.getState().friends).toEqual([]);
  expect(stompClient.deactivate).toHaveBeenCalled();
});
