import { authFetch } from "./api";

export const MAX_NETWORK_RETRIES = 3;
export const RETRY_DELAY_MS = 300;
export const POLL_INTERVAL_MS = 1000;
export const POLL_TIMEOUT_MS = 130000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** One key per submit call; matches the server pattern ^[A-Za-z0-9-]{8,64}$. */
export function newIdempotencyKey() {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const hex = () => Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, "0");
  return `${hex()}-${hex()}-${hex()}-${hex()}`;
}

async function errorFrom(res, fallback) {
  const err = await res.json().catch(() => ({}));
  return new Error(err.message || err.error || fallback);
}

/** POST with the same Idempotency-Key; retry only on network errors (fetch rejects). */
async function postWithRetry(url, body, key, { retries, retryDelayMs }) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await authFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(body),
      });
    } catch (e) {
      lastError = e;
      if (attempt < retries) await sleep(retryDelayMs * (attempt + 1));
    }
  }
  throw lastError;
}

async function pollJob(base, battleId, userId, first, { pollMs, timeoutMs }) {
  const deadline = Date.now() + timeoutMs;
  let job = first;
  for (;;) {
    if (job?.status === "DONE") return job.result;
    if (job?.status === "FAILED") throw new Error(job.error || "Submission failed");
    if (Date.now() >= deadline) throw new Error("Submission timed out");
    await sleep(pollMs);
    try {
      const res = await authFetch(
        `${base}/${battleId}/submissions/${job.jobId}?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          const err = await errorFrom(res, "Submission not found");
          err.fatal = true;
          throw err;
        }
        continue; // transient server error, keep polling until the deadline
      }
      job = await res.json();
    } catch (e) {
      if (e?.fatal) throw e;
      // network blip while polling: keep going until the deadline
    }
  }
}

/**
 * Submit with an Idempotency-Key.
 * 200 -> body (the SubmitResultDTO, as before).
 * 202 -> poll the job until DONE (resolve result) or FAILED/timeout (reject).
 */
export async function submitIdempotent(base, battleId, body, opts = {}) {
  const {
    retries = MAX_NETWORK_RETRIES,
    retryDelayMs = RETRY_DELAY_MS,
    pollMs = POLL_INTERVAL_MS,
    timeoutMs = POLL_TIMEOUT_MS,
  } = opts;
  const key = newIdempotencyKey();
  const res = await postWithRetry(`${base}/${battleId}/submit`, body, key, { retries, retryDelayMs });
  if (res.status === 202) {
    const job = await res.json();
    return pollJob(base, battleId, body.userId, job, { pollMs, timeoutMs });
  }
  if (!res.ok) throw await errorFrom(res, "Submission failed");
  return res.json();
}
