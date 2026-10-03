'use strict';
// Stand-in for the Lambda judge. No dependencies.
//   POST /api/submit  -> sleeps STUB_DELAY_MS (default 1500), then {"status":"Accepted","time":12,"results":[]}
//   STUB_FAIL_RATE (0..1) returns 503 for that fraction of submits.
//   GET  /health      -> {"status":"ok"}
const http = require('http');

const PORT = Number(process.env.PORT || 9000);
const DELAY_MS = Number(process.env.STUB_DELAY_MS || 1500);
const FAIL_RATE = Number(process.env.STUB_FAIL_RATE || 0);

function send(res, code, body) {
  const s = JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(s) });
  res.end(s);
}

const server = http.createServer((req, res) => {
  const path = (req.url || '').split('?')[0];
  if (req.method === 'GET' && path === '/health') return send(res, 200, { status: 'ok' });
  if (req.method === 'POST' && path === '/api/submit') {
    req.resume(); // discard the body
    req.on('end', () => {
      setTimeout(() => {
        if (FAIL_RATE > 0 && Math.random() < FAIL_RATE) return send(res, 503, { error: 'stub judge forced failure' });
        send(res, 200, { status: 'Accepted', time: 12, results: [] });
      }, DELAY_MS);
    });
    return;
  }
  send(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => console.log(`stub-judge listening on ${PORT} delay=${DELAY_MS}ms failRate=${FAIL_RATE}`));
