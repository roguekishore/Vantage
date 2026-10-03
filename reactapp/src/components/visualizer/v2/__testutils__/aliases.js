/* jest does not resolve the `@/` alias (craco maps it for webpack only).
 * Import this FIRST in every v2 test. */
jest.mock("@/lib/utils", () => require("../../../../lib/utils"), { virtual: true });
jest.mock("@/components/ds", () => require("../../../ds"), { virtual: true });
/* jest 27 ignores package `exports` subpaths used by newer Radix packages. */
jest.mock("@radix-ui/primitive/is-development", () => ({ isDevelopment: false }), { virtual: true });
/* react-router 7 needs `exports` subpaths too; the shell only needs these two. */
jest.mock(
  "react-router-dom",
  () => ({ Link: (p) => require("react").createElement("a", { href: p.to, ...p }), useInRouterContext: () => false }),
  { virtual: true }
);
