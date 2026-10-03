// Creates load-test users through POST /api/auth/signup. Node 18+ (global fetch), no dependencies.
// Usage: node loadtest/seed-users.mjs --count 440 [--base http://localhost:8080] [--origin http://localhost:3000]
//        [--concurrency 5] [--start 1]
// Users: username lt00001.., email lt00001@loadtest.local, password LoadTest!234 (same scheme as the k6 scripts).
// Refuses any base URL that is not local.
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
const base = (args.base || 'http://localhost:8080').replace(/\/$/, '');
const origin = args.origin || 'http://localhost:3000';
const count = Number(args.count || 44);
const start = Number(args.start || 1);
const concurrency = Math.max(1, Number(args.concurrency || 5));

const host = new URL(base).hostname;
if (!['localhost', '127.0.0.1', '::1', 'nginx'].includes(host) && args['allow-remote'] !== 'yes') {
  console.error(`refusing to seed non-local host ${host} (pass --allow-remote yes only for your own spare test stack)`);
  process.exit(2);
}
if (/vantagecode\.tech|themaverick\.tech/.test(base)) {
  console.error('refusing to seed production');
  process.exit(2);
}

const pad = (n) => String(n).padStart(5, '0');
let next = start;
const end = start + count;
let created = 0, existed = 0, failed = 0;

async function signup(n) {
  const body = { username: `lt${pad(n)}`, email: `lt${pad(n)}@loadtest.local`, password: 'LoadTest!234' };
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(`${base}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: origin },
        body: JSON.stringify(body),
      });
      if (res.status === 201) return created++;
      if (res.status === 409) return existed++;
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      console.error(`signup ${body.username}: HTTP ${res.status} ${await res.text()}`);
      return failed++;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  failed++;
}

async function worker() {
  while (next < end) await signup(next++);
}

await Promise.all(Array.from({ length: concurrency }, worker));
console.log(`seed done: created=${created} already-existed=${existed} failed=${failed}`);
process.exit(failed ? 1 : 0);
