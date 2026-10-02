# App pages: fixed pieces, free pages, one system (owner direction, 2026-10-02)

This file **supersedes POLISH_PLAN.md §6** and, for app pages only, the effect bans in POLISH_PLAN §3.6 and DESIGN_SYSTEM.md §1 and §10. Where they conflict for an app page, this file wins. Visualizers are not affected: they still get the full redesign in POLISH_PLAN §2 and §5.

## The direction in one paragraph

Run 1 over-simplified the app. It stripped the iconic login and signup pages and the Friends globe, and it left pages bare. The owner wants **one consistent design system** across the app: borders, radius, colour, spacing, type and controls. Inside that system the agent has **creative freedom** over page design and layout, with three exceptions. A few iconic pieces stay exactly as they were. The map is the only place with its own colours. And dark mode gets slightly brighter, because it is currently too dark to read.

The reference for "as it was" is commit `96004b0`, the pre-run-1 tip. Its `reactapp/src` is identical to `main`.

## 1. Fixed: keep these the same

| Piece | Rule |
|---|---|
| Login and signup (`pages/auth/AuthPage.jsx`) | Restore the pre-run-1 design: layout, split composition, NQueens canvas (`components/animations/ComplexAnimations`), typography treatment and motion. Change only what consistency or correctness requires: ds inputs and buttons styled to look as before, tokens instead of raw colours, zero radius, run 1's OfflineState, inline errors and aria-labels, no CustomCursor. Side by side with the old page, it should read as the same page. |
| Friends globe (`components/ui/globe.jsx`, `cobe`) | Restore the globe with the same look, size and placement as before. Re-add `cobe` at the exact version in the `96004b0` lockfile and lazy-load it. Express its colours as `--globe-*` tokens matching the old look, with a light-theme variant. The rest of the Friends page is free (section 2). |
| World map (`pages/map/**`, `WorldMap.css`, `world.svg`) | Keep the stage colours. Each stage keeps its colour for fills and strokes, defined as dual-theme `--wm-stage-*` tokens that stay legible in both themes. The rule in POLISH_PLAN §6.1 that stage colour survives only as a 2px stroke is void. Keep the §6.1 theming mechanics (tokens, light mode, repaint on toggle). Chrome around the map (HUD, rail, popups) follows the system. |
| Home width | Home may occupy the full viewport width, with full-bleed sections and hero. Content inside sections still follows the spacing scale. |

If you're unsure whether something else counts as iconic, keep it and log it in PROGRESS.md under "Owner decisions needed".

## 2. Free: every other page

Home, Topics hub and topic pages, Problems, Judge, Leaderboard, Achievements, Profile, the rest of Friends, Store, Inventory, Battle ×3 and Group ×3 are yours to design. You may restore old elements (PixelCards, AlgoCards, Home sections, podiums, canvas heroes), redesign them or replace them. What matters is the result:
- **Not barren.** Run 1's failure mode was bare minimalism. Every page needs a clear header or hero, real visual hierarchy, and at least the useful content and features the old page had. Drop old content only if it was broken or fake (for example fake ELO numbers or "Avg wait"), and log what you dropped.
- **Professional and consistent.** It's the same product on every page: same controls, borders, spacing rhythm and type.
- **Visual richness is allowed.** Canvases, animated heroes and illustrative graphics are welcome. They take their colours from the system palette in section 3.

## 3. One system everywhere

- **Colour:** tokens only. No raw hex, `rgb()` or `hsl()` in page code.
  - The palette is the neutrals, the single acid accent and the status colours (status still carries meaning only).
  - The only extra palettes are the map's `--wm-stage-*` and the globe's `--globe-*`.
  - Retire the per-topic spotlight colours and the per-algorithm rainbow canvas palettes. Canvases use accent, fg and at most one status colour.
- **Radius:** zero. `data-shape="round"` only where DESIGN_SYSTEM allows it.
- **Borders:** 1px hairlines from `--border` / `--border-strong`.
- **Spacing and layout:** the spacing scale and z-index scale. Sections may be full-bleed; content uses the container widths.
- **Type:** the shipped fonts and type scale (Monument display behind `--display-weight`, JetBrains Mono). No faux bold, and no text under 10px, canvas labels included.
- **Controls:** everything from `@/components/ds`: buttons, inputs, selects, tabs, dialogs, toasts, tooltips, badges, tables, avatars. One Toaster, one challenge dialog.
- **Shell:** the shared Navbar, mobile sheet, PageShell offsets and Footer.
- **Effects:**
  - Gradients, glows and looping motion are allowed **inside visuals** (heroes, canvases, the globe, the map, illustrations), using token colours. Loops pause off-screen (IntersectionObserver) and stop under `prefers-reduced-motion`.
  - **Banned on chrome and controls** (buttons, inputs, cards, panels, nav, tables, badges, dialogs): rounded corners, shadows, glows, gradients, blur/glass, hover scale, tilt.
  - **Banned everywhere:** custom cursors, emoji in UI, `@mui`, `framer-motion`, `motion`, `react-icons` and tabler. Port animations to GSAP and icons to lucide.
- **Both themes:** every canvas, the globe and the map read colours via `useThemeTokens` / `canvasTheme.js` and repaint on theme toggle without a reload.
- **Keep run 1's real fixes:** OfflineState / ErrorState, mojibake fixes, broken-class fixes, lazy routes, focus and aria-labels, theme mechanics.
- **Dependencies:** re-add a removed package only when a kept or chosen element needs it. Pin it to the exact `96004b0` lockfile version and lazy-load it with its page. Record the main bundle size before and after.

## 4. Dark mode: brighten slightly

Dark mode is too dark: panels blend into the page, hairlines vanish, and secondary text is hard to read. Raise the dark-theme neutrals a little. Hue and character stay the same, and accent and status colours don't change. Starting values in `src/styles/tokens.css` (`html.dark`):

| Token | Now | New |
|---|---|---|
| `--bg` | `#09090B` | `#0E0E11` |
| `--bg-rgb` | `9 9 11` | `14 14 17` |
| `--surface` | `#0F0F12` | `#16161A` |
| `--elevated` | `#16161A` | `#1F1F24` |
| `--border` | `rgba(255,255,255,.10)` | `rgba(255,255,255,.15)` |
| `--border-strong` | `rgba(255,255,255,.22)` | `rgba(255,255,255,.30)` |
| `--fg-muted` | `rgba(255,255,255,.66)` | `rgba(255,255,255,.74)` |
| `--fg-dim` | `rgba(255,255,255,.52)` | `rgba(255,255,255,.62)` |

Rules:
- Update every derived value that hardcodes the old ones: `*-rgb` triplets, the `-soft` tints if they're computed from the bg, `canvasTheme.js`, the Monaco `vantage-dark` theme and the map tokens.
- Run `scripts/contrast.mjs`. It must still pass every pair.
- If a value looks wrong once applied, adjust by small steps in the same direction and record the final values in DESIGN_SYSTEM.md §2.
- Light mode is unchanged.

## 5. Enforcement

- `scripts/check-ui.mjs` allows effects only explicitly. Gradient, glow, shadow and loop exceptions are allowed only in visual modules (`src/components/animations/**`, `src/components/signature/**`, the globe and the map) or on a line marked `/* ui-allow: visual */`. The script prints every exception it allowed.
- Radius, colour literals (outside `tokens.css`), font size, banned imports, cursor, emoji and the `<h1>` count stay enforced everywhere.

## 6. Method and acceptance

1. Build the old app once as a read-only reference, outside the repo and without a worktree:
   - Run `git archive 96004b0 reactapp | tar -x -C ../vantage-old`.
   - In `../vantage-old/reactapp`, run `npm ci` and `npm run build` with `REACT_APP_API_URL=http://localhost:1` and `CI=false`.
   - If that build fails on the `react-hooks/exhaustive-deps` lint error, apply run 1's fix (commit `a01fe9e`) to the copy only.
   - Serve it on its own port.
2. Fixed pieces (section 1): start from the old file (`git show 96004b0:<path>`) and apply only what section 1 allows.
3. Free pages (section 2): use the old page as the content inventory and the current one as the system baseline, then design.
4. Screenshot at 1280×800 in both themes, plus 390×844 for Home, Auth and Map. For fixed pieces, also screenshot the old page. Stay within the screenshot limits.

Acceptance, decided by a reviewer:
- **Fixed pieces:** recognizably the same as the old screenshot.
- **Free pages:** not barren, with no lost content except logged drops, and visibly consistent with the rest of the app.
- **Map:** keeps its stage colours in both themes.
- **Every page:** dark mode readable at a glance, both themes correct, and all gates green.
