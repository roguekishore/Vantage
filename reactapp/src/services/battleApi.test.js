import { submitBattleCode } from "./battleApi";
import { submitIdempotent } from "./idempotentSubmit";

jest.mock("./api", () => ({ authFetch: jest.fn() }));
const { authFetch } = require("./api");

const BASE = "http://x/api/battle";
const body = { userId: 7, problemIndex: 0, language: "java", code: "x" };
const fast = { retryDelayMs: 1, pollMs: 5, timeoutMs: 500 };
const json = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

beforeEach(() => authFetch.mockReset());

test("200 returns the body and sends a valid Idempotency-Key", async () => {
  authFetch.mockResolvedValue(json(200, { accepted: true }));
  await expect(submitBattleCode(1, body)).resolves.toEqual({ accepted: true });
  const [url, init] = authFetch.mock.calls[0];
  expect(url).toMatch(/\/1\/submit$/);
  expect(init.headers["Idempotency-Key"]).toMatch(/^[A-Za-z0-9-]{8,64}$/);
  expect(JSON.parse(init.body)).toEqual(body);
});

test("202 then DONE resolves with result", async () => {
  const result = { accepted: true, passed: 3 };
  authFetch
    .mockResolvedValueOnce(json(202, { jobId: 9, status: "QUEUED" }))
    .mockResolvedValueOnce(json(200, { jobId: 9, status: "RUNNING" }))
    .mockResolvedValueOnce(json(200, { jobId: 9, status: "DONE", result }));
  await expect(submitIdempotent(BASE, 1, body, fast)).resolves.toEqual(result);
  expect(authFetch.mock.calls[1][0]).toBe(`${BASE}/1/submissions/9?userId=7`);
});

test("202 then FAILED rejects with error", async () => {
  authFetch
    .mockResolvedValueOnce(json(202, { jobId: 9, status: "QUEUED" }))
    .mockResolvedValueOnce(json(200, { jobId: 9, status: "FAILED", error: "judge down" }));
  await expect(submitIdempotent(BASE, 1, body, fast)).rejects.toThrow("judge down");
});

test("202 that never finishes times out", async () => {
  authFetch.mockImplementation(async (url, init) =>
    init ? json(202, { jobId: 9, status: "QUEUED" }) : json(200, { jobId: 9, status: "RUNNING" }));
  await expect(submitIdempotent(BASE, 1, body, { ...fast, timeoutMs: 30 })).rejects.toThrow(/timed out/);
});

test("network errors retry up to 3 times with the same key", async () => {
  authFetch
    .mockRejectedValueOnce(new TypeError("net"))
    .mockRejectedValueOnce(new TypeError("net"))
    .mockRejectedValueOnce(new TypeError("net"))
    .mockResolvedValueOnce(json(200, { ok: 1 }));
  await expect(submitIdempotent(BASE, 1, body, fast)).resolves.toEqual({ ok: 1 });
  const keys = authFetch.mock.calls.map((c) => c[1].headers["Idempotency-Key"]);
  expect(keys).toHaveLength(4);
  expect(new Set(keys).size).toBe(1);
});

test("gives up after 3 retries", async () => {
  authFetch.mockRejectedValue(new TypeError("net"));
  await expect(submitIdempotent(BASE, 1, body, fast)).rejects.toThrow("net");
  expect(authFetch).toHaveBeenCalledTimes(4);
});

test("non-2xx rejects with server message and is not retried", async () => {
  authFetch.mockResolvedValue(json(429, { message: "slow down" }));
  await expect(submitIdempotent(BASE, 1, body, fast)).rejects.toThrow("slow down");
  expect(authFetch).toHaveBeenCalledTimes(1);
});

test("a new call generates a new key", async () => {
  authFetch.mockResolvedValue(json(200, {}));
  await submitIdempotent(BASE, 1, body, fast);
  await submitIdempotent(BASE, 1, body, fast);
  const [a, b] = authFetch.mock.calls.map((c) => c[1].headers["Idempotency-Key"]);
  expect(a).not.toBe(b);
});
