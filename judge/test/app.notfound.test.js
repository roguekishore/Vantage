const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { createApp } = require("../src/app");

test("unknown route returns JSON 404", async () => {
  const server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, r));
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/does-not-exist`);
    assert.strictEqual(res.status, 404);
    assert.match(res.headers.get("content-type"), /application\/json/);
    assert.deepStrictEqual(await res.json(), { error: "Not found" });
  } finally {
    server.close();
  }
});
