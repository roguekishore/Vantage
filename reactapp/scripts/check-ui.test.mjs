import test from "node:test";
import assert from "node:assert/strict";
import { scanText } from "./check-ui.mjs";

const rules = (rel, src) => scanText(rel, src).violations.map((v) => v.rule);

test("flags colour, radius, font size", () => {
  const r = rules("src/pages/x/A.jsx", `const a = <div className="rounded-md text-[9px]" style={{ color: "#fff" }} />;`);
  assert.deepEqual(r.sort(), ["color", "font-size", "radius"]);
});
test("ignores comments and rounded-none", () => {
  assert.deepEqual(rules("src/pages/x/A.jsx", `// #fff rounded-md\nconst a = "rounded-none";`), []);
});
test("effects allowed only in visual modules or marked", () => {
  const src = `const s = { boxShadow: "x" };`;
  assert.deepEqual(rules("src/pages/x/A.jsx", src), ["shadow"]);
  assert.deepEqual(rules("src/components/animations/A.jsx", src), []);
  assert.equal(scanText("src/components/animations/A.jsx", src).allowed.length, 1);
  assert.deepEqual(rules("src/pages/x/A.jsx", src + " /* ui-allow: visual */"), []);
});
test("multiple h1 and banned import", () => {
  assert.deepEqual(rules("src/pages/x/A.jsx", `<h1>a</h1>\n<h1>b</h1>`), ["multiple-h1"]);
  assert.deepEqual(rules("src/a.js", `import { m } from "framer-motion";`), ["banned-import"]);
});
