jest.mock("sockjs-client", () => jest.fn());
jest.mock("./api", () => ({ getToken: () => "tok" }));

const mockInstances = [];
jest.mock("@stomp/stompjs", () => {
  class Client {
    constructor(cfg) {
      this.cfg = cfg;
      this.connected = false;
      this.active = false;
      this.subscribe = jest.fn((dest, cb) => {
        const sub = { dest, cb, unsubscribe: jest.fn() };
        this.subs.push(sub);
        return sub;
      });
      this.subs = [];
      this.activate = jest.fn(() => { this.active = true; });
      this.deactivate = jest.fn(() => { this.active = false; this.connected = false; });
      mockInstances.push(this);
    }
    simulateConnect() { this.connected = true; this.cfg.onConnect(); }
    simulateClose() { this.connected = false; this.cfg.onWebSocketClose(); }
  }
  return { Client, ReconnectionTimeMode: { LINEAR: 0, EXPONENTIAL: 1 } };
});

let stomp;
beforeEach(() => {
  jest.resetModules();
  mockInstances.length = 0;
  stomp = require("./stompClient");
});

test("subscribe is idempotent per destination and swaps the handler", () => {
  stomp.activate();
  const c = mockInstances[0];
  c.simulateConnect();
  const h1 = jest.fn();
  const h2 = jest.fn();
  stomp.subscribe("/topic/a", h1);
  stomp.subscribe("/topic/a", h2);
  stomp.subscribe("/topic/a", h2);
  expect(c.subscribe).toHaveBeenCalledTimes(1);
  c.subs[0].cb({ body: '{"x":1}' });
  expect(h1).not.toHaveBeenCalled();
  expect(h2).toHaveBeenCalledWith({ x: 1 });
});

test("subscriptions made before connect are applied in onConnect and re-applied after reconnect", () => {
  stomp.subscribe("/topic/early", jest.fn());
  stomp.activate();
  const c = mockInstances[0];
  expect(c.subscribe).not.toHaveBeenCalled();
  c.simulateConnect();
  expect(c.subscribe).toHaveBeenCalledTimes(1);
  c.simulateClose();
  c.simulateConnect();
  expect(c.subscribe).toHaveBeenCalledTimes(2);
});

test("only one Client is created per tab", () => {
  stomp.activate();
  stomp.activate();
  stomp.subscribe("/t", jest.fn());
  expect(mockInstances).toHaveLength(1);
});

test("gives up after 10 failures and activate() starts again", () => {
  stomp.activate();
  const c = mockInstances[0];
  for (let i = 0; i < 9; i += 1) c.simulateClose();
  expect(c.deactivate).not.toHaveBeenCalled();
  c.simulateClose();
  expect(c.deactivate).toHaveBeenCalledTimes(1);
  stomp.activate();
  expect(c.activate).toHaveBeenCalledTimes(2);
});

test("backoff is configured 1s to 30s exponential", () => {
  stomp.activate();
  const cfg = mockInstances[0].cfg;
  expect(cfg.reconnectDelay).toBe(1000);
  expect(cfg.maxReconnectDelay).toBe(30000);
  expect(cfg.reconnectTimeMode).toBe(1);
});

test("deactivate clears destinations and closes the client", () => {
  stomp.activate();
  const c = mockInstances[0];
  c.simulateConnect();
  stomp.subscribe("/t", jest.fn());
  stomp.deactivate();
  expect(c.deactivate).toHaveBeenCalled();
  expect(stomp._registrySize()).toBe(0);
});
