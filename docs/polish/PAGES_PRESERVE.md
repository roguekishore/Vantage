# App pages: preserve and harmonize (owner direction, 2026-10-02)

This file **supersedes POLISH_PLAN.md §6** and, for app pages only, the bans in POLISH_PLAN §3.6 and DESIGN_SYSTEM.md §1 and §10. Where they conflict for an app page, this file wins. Visualizers are not affected: they still get the full redesign in POLISH_PLAN §2 and §5.

## What the owner asked for

Run 1 went too far. It stripped the iconic parts of the app: the login and signup pages, the Friends globe, the Home page's full-width layout and the world map's colours. The owner wanted **a consistent design system** (borders, radius, colour, spacing, type and controls) across the app. The owner did **not** want the pages simplified.

- **App pages** (Home, Auth, Friends, Map, Topics, Problems, Judge, Leaderboard, Achievements, Profile, Store, Inventory, Battle ×3, Group ×3): keep most of the old design. Harmonize it onto the design system.
- **Visualizers** (all 145 manifest files): full redesign, unchanged.
- Agents have creative freedom on how to do both, within the rules below.

## Preserve (the page's identity)

Each page keeps its pre-run-1 layout, composition, sections, hero and signature visuals. The reference is the page as it was at commit `96004b0`, which is the pre-run-1 tip; its page code is identical to `main`. Restore at least these:

| Page | Restore |
|---|---|
| Auth (`/login`, `/signup`) | The split layout with the NQueens canvas (`components/animations/ComplexAnimations`), and the old composition and motion |
| Friends | The cobe globe (`components/ui/globe.jsx`; re-add `cobe` at the exact version in the `96004b0` lockfile), placed as before, coloured from tokens |
| Home | Full-width, full-bleed sections; the hero, the canvases and the section rhythm. Restore the sections run 1 cut (features tape, how-it-works and the others) unless a section was actually broken. In that case fix it rather than drop it. |
| Map | The stage colours: each stage keeps its colour as a fill/stroke palette, defined as dual-theme tokens and legible in both themes. The §6.1 rule "stage colour survives only as a 2px stroke" is void. Keep the §6.1 theming mechanics. |
| Topics hub and topic pages | PixelCard / TopicPixelCard and the topic hero, as before |
| Problems | AlgoCards and the old page composition |
| Profile, Leaderboard, Achievements, Battle, Group, Store, Inventory, Judge | The old layout and signature elements (canvas hero, podium, badge treatments, VS screen and so on) |

Run 1 deleted these files; restore them from `96004b0` where needed: `components/problems/AlgoCards.jsx`, `components/ui/globe.jsx`, `pages/topics/PixelCard.jsx`, `pages/topics/TopicPixelCard.jsx`. Bring back any other cut element too if it defined the page. Use your judgment, and record what you restored per page in PROGRESS.md.

## Harmonize (mandatory on every page)

This is the consistency layer. It's what makes the app feel like one product:
- **Colour:** tokens only. No raw hex, `rgb()` or `hsl()` in page code. A page's signature colours (map stage palette, canvas palettes, topic colours) become named tokens in `tokens.css` with dark and light values, and they must pass contrast where text sits on them.
- **Radius:** the radius policy stays (zero radius; `data-shape="round"` only where DESIGN_SYSTEM allows it). Old rounded cards and buttons become square.
- **Borders:** 1px hairlines from `--border` / `--border-strong`.
- **Spacing and layout:** the spacing scale and the z-index scale. Content inside a section uses the container widths, but sections and heroes may be full-bleed. Home is full width.
- **Type:** the shipped fonts and type scale (Monument display behind `--display-weight`, JetBrains Mono). No faux bold, no text under 10px (canvas labels included).
- **Controls:** buttons, inputs, selects, tabs, dialogs, toasts, tooltips, badges, tables and avatars come from `@/components/ds`. One Toaster, one challenge dialog.
- **Shell:** the shared Navbar, mobile sheet, PageShell offsets and Footer. The Navbar may bring back signature details (wordmark, logo treatment) if they don't break consistency.
- **Both themes:** every restored canvas, globe and animation reads its colours from `useThemeTokens` / `canvasTheme.js` and repaints on theme toggle without a reload.
- **Keep run 1's real fixes:** OfflineState / ErrorState, mojibake fixes, the broken-class fixes, lazy routes, focus and aria-labels, theme mechanics and the CustomCursor removal.

## Effects: what's allowed on app pages now

- **Allowed inside signature visuals** (heroes, canvases, the globe, the map, PixelCards, the VS screen): gradients, glows, animated and looping motion, and page-specific colour, as long as it comes from tokens. Loops must pause off-screen (IntersectionObserver) and stop under `prefers-reduced-motion`.
- **Still banned on chrome and controls** (buttons, inputs, cards, panels, nav, tables, badges, dialogs): rounded corners, shadows, glows, gradients, blur/glass, hover scale or tilt.
- **Still banned everywhere:** custom cursors, emoji in UI, faux bold, text under 10px, and `@mui`, `framer-motion`, `motion`, `react-icons` and tabler. Port framer-motion animations to GSAP and icons to lucide.
- **Dependencies:** re-add a removed package only when a restored element needs it (for example `cobe`). Pin it to the exact version in the `96004b0` lockfile, and lazy-load it with its page. Record the main bundle size before and after.

## Enforcement

`scripts/check-ui.mjs` must allow signature visuals explicitly, never silently. Signature exceptions (gradient, glow, shadow or loop) are allowed only in files under `src/components/signature/**` and the canvas animation modules, or on a line marked `/* ui-allow: signature */`. The script prints every exception it allowed, so a reviewer can see them. Radius, colour literals, font size, banned imports, cursor, emoji and `<h1>` count stay enforced everywhere.

## Method, per page

1. Build the old app once: `git worktree add ../vantage-old 96004b0` (outside the repo; read-only reference), `npm ci`, then build into `build-old` with `REACT_APP_API_URL=http://localhost:1`. Remove the worktree at the end of the run.
2. Compare the old file (`git show 96004b0:<path>`) with the current one. For heavily stripped pages, start from the old file and apply the harmonize layer, keeping run 1's states and fixes. For lightly changed pages, restore the missing pieces into the current file. The agent chooses.
3. Screenshot old and new side by side at 1280×800 in both themes, plus 390×844 for Home, Auth and Map. Stay within the screenshot limits.

Acceptance per page, decided by a reviewer comparing the screenshots:
- **Recognizably the same page:** same layout, sections and signature visuals.
- **Visibly consistent with the rest of the app:** radius, borders, colour tokens, spacing, type and ds controls.
- **Both themes are correct.**
- **All gates pass.**
