# VANTAGE Polish Plan: UI first

Audience: an Opus orchestrator that dispatches Opus subagents, one per unit of work. Read `HANDOFF.md` first: it defines how the run is executed. Where this plan says "strong" or "cheap", both now mean an Opus subagent. The harness gates and the job prompt still apply unchanged.
Revision 2026-10-02: owner confirmed terminal-brutalist, full redesign of every surface, no cutline, work on branch `polish`. This revision fixes the light-mode accent, the Phase 4/5 ordering contradiction and the radius-reset fallout, adds a test gate, and moves route smoke and demo data into Phase 1.
Companion files:
- `HANDOFF.md`: orchestrator instructions, unit definitions, gates, git rules and stop conditions.
- `VISUALIZER_MIGRATION_PROMPT.md`: the `defineVisualizer` contract plus the per-file job prompt and acceptance checks.
- `visualizer-manifest.json`: all 145 visualizer files, each with track, wave, model, stage kind, aux panels, modes, notes and status.
- `evidence/probe-*.md`: raw evidence (file:line) behind every claim below. Look things up there before re-investigating.
- `DEFERRED_NON_UI.md`: the full non-UI audit (security, backend, realtime, judge, extension, deploy).

Audit date: 2026-09-30, `main` @ `0613347`. Paths are relative to `reactapp/` unless stated otherwise.

Priority, set by the owner: the UI is what gets judged in a 15-minute interview. Everything that isn't UI (security, battle rules, judge, extension, deployment, README) is deferred to Appendix A. It is kept there so nothing is lost.

---

## 0. Guardrails

1. UI work must not change algorithm behaviour, API calls or store logic. When a UI change needs a logic change, note it in Appendix A and move on.
2. Screenshots: viewport only, at most 1280×800 (mobile 390×844), device scale factor 1, never full-page. Budget about 10 per session. The harness has to follow these rules too.
3. Gates, run from `reactapp/` at the end of every unit:
   - Build: `npm run build` (craco, `CI=false`) must pass.
   - Tests: `npm test -- --watchAll=false` must pass. `src/pages/judge/codeflow/**` and `src/services/judgeApi.test.js` already have unit and fast-check property tests; the Judge restyle must not break them.
   - Phase 1 adds `scripts/check-ui.mjs`, the route smoke script and (Phase 2) `scripts/check-visualizer.mjs`. Each becomes a gate as soon as it exists.
4. The frontend build points at the production API unless `REACT_APP_API_URL` is overridden. For screenshots, build with `REACT_APP_API_URL=http://localhost:1` so pages show their offline states instead of hitting prod.
5. Git: all work happens on branch `polish` in the main working tree (no worktree). Commit per unit using conventional commits. Push only `polish`, never force, and only as `HANDOFF.md` allows. Never switch to or commit on `main`, never rewrite history, never skip hooks. `docs/polish/` and `CLAUDE.md` are committed on `polish`.
6. Scope: only `reactapp/` and `docs/polish/` change. `springapp/`, `judge/`, `extension/` and deployment files are out of scope (Appendix A).

---

## 1. What the audit found (UI only)

### 1.1 Verified in the browser (production build, both themes, 1280/1440 and 390)

| Surface | What it looks like |
|---|---|
| Light theme | **Doesn't exist for most of the app.** Home, Login, Leaderboard, Map, Topics and the Sorting visualizers render dark in "light" mode. Store and the legacy visualizers flip to a generic light Tailwind look. The two halves share nothing. |
| Legacy visualizer titles | **Invisible in production on 64 files** (manifest `metrics.titleInvisibleInProd`). They use `bg-clip-text text-transparent` with gradient classes such as `from-orange400`, which don't exist in the compiled CSS. Confirmed on LRUCache, EditDistance and TwoSum. |
| Legacy visualizer colours | **477 of 750** distinct colour classes in `pages/algorithms` are not generated at all: `text-teal300`, `bg-theme-tertiary/50`, `border-success700/50` and so on. A bulk find/replace removed the hyphens, and the custom palettes have no `<alpha-value>`. Large parts of these pages render with no background, border or text colour, which is why they look flat grey or broken. |
| Display type | Monument Extended looks smeared and squished. **Root cause: only `MonumentExtended-Regular.otf` exists**, while weight 900 is requested about 280 times in inline styles (plus `font-black`). Wherever that lands on Monument, the browser synthesises a faux bold. |
| Target visualizer (BubbleSort) | Best of the lot, but not good enough to copy. Pointer arrows overlap the legend. It has three stacked header layers (app nav, VisualizerPage nav, VisualizerHeader). There are macOS traffic-light dots on every panel. Stat blocks use rainbow colours. The layout is fixed at `300px 1fr 220px` and breaks on mobile. The idle state is a blank "AWAITING INPUT" page. |
| TwoSum, AVL, SingleNumber, other legacy pages | A different design system: Inter, rounded purple and green buttons, promo cards, two back buttons. AVL's visualization area renders empty. EditDistance code line numbers are misaligned. |
| Home | Strong in dark. It has visible mojibake (`O(n�)`, `3�8`, `� 2026`) and rainbow per-card canvases where it should use one accent. The features tape clips at the right edge. It showcases only 3 of the 5 product pillars (no Map, no Judge). |
| Topics hub / topic page | Rainbow icons (21 spotlight colours), a purple `#5542FF` hover, and a dead yellow square on the Sorting topic hero. Graphs shows 1 card and Heaps shows 3 (catalog gaps). |
| Map | Rounded HUD and rail, rainbow stage strokes, heavy light-grey "available" fills that dominate the map, a purple CTA, and a "quick tip" that covers the map. On mobile the HUD covers half the screen. Light mode is half-applied. |
| Leaderboard, Achievements, Friends | Faux-bold titles, a glow band behind the H1, a two-tone "YOUR / LEGACY." gimmick, rounded tiles, ring stats. With the API down they show "No data yet", which misleads, with no error state. |
| Store | A completely different language (Tailwind zinc, `rounded-2xl`, amber coins, emoji). |
| Judge (error) | No navbar and a raw "Problem not found". There is no way back except the browser. |

### 1.2 From code (details in `evidence/probe-app-pages-design-quality.md`)

- About 90 font sizes, about 45 letter-spacing values and 11+ distinct H1 treatments. About 210 text instances are at or below 9px.
- About 25 radius values (≈520 declarations). About 20 button variants, 12 card variants, 8 badge variants, 6 modal variants, 2 toast systems and 4 tooltip mechanisms. shadcn `ui/*` is barely used.
- 8 container widths and 5 different offsets under the fixed navbar. Several pages collide with the navbar, and 13 ad-hoc breakpoints are in use.
- Zero responsive handling on Auth, Profile, all Battle pages, the Codeflow panels and VisualizerPage.
- The z-index scale is inverted: shadcn dialogs (z-50) render under the navbar (150), and scroll-top (9999) floats over dialogs.
- Glass and blur, neon glows, infinite loops (navbar ticker canvas, XP sweep, glitch text), tilt cards and hover scale.
- Emoji in the UI, exclamation-heavy copy, 6 icon libraries, and brand spelled 5 ways.
- `index.css` `:root` holds a purple "Clerk" light palette. "Light mode" is an `!important` remap that matches Tailwind zinc classes and inline-style substrings (`index.css:1396-1713`) on a path allow-list (`App.jsx:45-62`).
- JetBrains Mono is never loaded. Inter, Syne, zentry, general, circular and robert are loaded or declared without a plan.
- `CustomCursor` is mounted per page with `cursor:none`, so the native cursor disappears on touch, in screen-share and when JS stalls.
- Offline states: Leaderboard, Store, Inventory, Judge, Problems, Profile and BattleResult either render misleading empty states or raw `err.message`.

---

## 2. Decision: rebuild the visualizer views, don't restyle them

The question was whether to recreate each algorithm's component from scratch or restyle it to match. The answer is neither. **Keep each file's algorithm model and replace its view with one shared, declarative shell.**

Why:
- **Restyling is not feasible.** Each legacy file has 350–700 lines of hand-written JSX, broken class names and bespoke state plumbing. Restyling means 131 full rewrites that each re-decide layout, colour and controls, which is exactly how the drift happened. Visual consistency would depend on prompt discipline across 131 jobs.
- **Recreating from scratch is wasteful and risky.** The step generators (`generateXHistory` → `history[]` with `line`, pointer indices and explanation) are the valuable, correct part. They already exist in about 120 files and most are nearly pure functions (7 of 10 sampled lift verbatim, 3 need parsing extracted).
- **Rebuilding the view means consistency comes from structure.** Pages become `defineVisualizer({...})` configs of about 70–130 new lines plus the lifted generator. The shell owns layout, playback, keyboard, theming, zero radius, responsiveness, idle/error states and the judge embed. A cheap model can't make a page look different, because the page no longer owns its look.

Split (from the manifest):

| Track | Files | What it involves | Model |
|---|---|---|---|
| A | 119 | Lift the existing generator, write the config | Cheap (10 pilots are strong) |
| B | 18 | No step history (imperative timers): write `generate()` first, then the config | Strong |
| C | 4 | Custom stage through the `view.render` escape hatch (AStar, Pathfinding/BFS, NetworkFlow, TowerOfHanoi) | Strong |
| D | 3 | Delete (`Arrays/4Sum`, `Trees/validBST`, `Arrays/VizualiserPointer.tsx`) | – |
| alias | 1 | `Stack/SubarrayRanges` becomes a re-export of `Arrays/SubarrayRanges` | – |

The same principle applies to app pages: **build primitives and page templates first, then pages become assembly**, not styling.

---

## 3. Design system spec (Phase 1 builds this; everything else consumes it)

Identity: terminal-brutalist. That means flat surfaces, hairline borders, mono type, one acid accent, zero radius, no gradients, glows, glass or tilt. The content does the decorating.

### 3.1 Tokens: `src/styles/tokens.css`, CSS custom properties on `html.dark` / `html.light`

Everything reads tokens. The shadcn variables alias them. The visualizer `V` object becomes `var()` strings. Canvas code reads them through `getComputedStyle` (§3.9).

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#09090B` | `#F4F4F0` | page |
| `--surface` | `#0F0F12` | `#FFFFFF` | panels, cards |
| `--elevated` | `#16161A` | `#EBEBE6` | cells, inputs, hover fills |
| `--border` | `rgba(255,255,255,.10)` | `rgba(10,10,11,.14)` | hairlines |
| `--border-strong` | `rgba(255,255,255,.22)` | `rgba(10,10,11,.32)` | emphasis, hover |
| `--fg` | `#F5F5F4` | `#0A0A0B` | body text |
| `--fg-muted` | `rgba(255,255,255,.66)` | `rgba(10,10,11,.66)` | secondary text |
| `--fg-dim` | `rgba(255,255,255,.52)` | `rgba(10,10,11,.54)` | labels (must still pass 4.5:1; measure) |
| `--accent` | `#EDFF66` | `#EDFF66` | **fills only** in light: buttons, active cell, selection |
| `--on-accent` | `#09090B` | `#09090B` | text on accent fills |
| `--accent-edge` | `#EDFF66` | `#0A0A0B` | 1px border drawn on **every** accent fill |
| `--accent-ink` | `#EDFF66` | `#5C6B00` (≈5.3:1 on `--bg`; verify) | accent-coloured **text, borders and icons** |
| `--accent-soft` | `rgba(237,255,102,.12)` | `rgba(92,107,0,.10)` | tinted backgrounds |
| `--focus` | `#EDFF66` | `#0A0A0B` | focus outline |
| `--ok` / `--warn` / `--err` / `--info` | `#34D399` / `#FBBF24` / `#F87171` / `#67E8F9` | `#047857` / `#B45309` / `#B91C1C` / `#0E7490` | status (text-safe values) |
| `--*-soft` | 12–15% alpha of the above | 10% alpha of the above | status backgrounds |
| `--nav-h` | `56px` | same | layout |

Rules:
- **Light-mode accent fills need an edge.** `#EDFF66` and the light `--bg` `#F4F4F0` have almost the same relative luminance (≈0.90 each, contrast ≈1.0:1), so a bare accent fill disappears in light mode. Every accent fill (primary button, active nav item, active visualizer cell, selection, final CTA slab) also draws a 1px `--accent-edge` border. In dark mode the edge matches the fill and is invisible. This black-on-yellow edge is on-brand for brutalist; don't replace it with a darker fill.
- Retire `#5542FF` purple, the Clerk palette, the legacy `--color-*` aliases once they're unused, and the per-topic spotlight colours.
- Status colours carry meaning only (verdicts, difficulty, success and error). They are never decoration.
- Difficulty uses Easy `--ok`, Medium `--warn` and Hard `--err`, shown as text plus a 2px left bar. No gradients.

### 3.2 Visualizer state tokens (one semantic map for all 142 visualizers)

| State | Token | Meaning |
|---|---|---|
| `idle` | `--elevated` fill, `--border` | untouched |
| `active` | `--accent` fill, `--on-accent` text | the element the current step is about |
| `compare` | `--warn` border + `--warn-soft` | being compared or probed |
| `write` | `--viz-write` (dark `#C4B5FD`, light `#6D28D9`) | swap, move, assign |
| `done` | `--fg-dim` text, `--surface` fill | processed or visited, **not green** |
| `success` | `--ok` border + `--ok-soft` | final answer, found, valid |
| `error` | `--err` border + `--err-soft` | conflict, evict, invalid |
| `window` | `--info-soft` band behind cells, `--info` edges | range or window |
| `dim` | 35% opacity | discarded or out of range |

Pointers are coloured by role, not by variable name: P1 (i, L, curr, slow) uses `--accent-ink`, P2 (j, R, next, fast) uses `--info`, P3 (mid, pivot, prev) uses `--viz-write`. The variable name is always shown as the label. The code-line highlight is always `--accent-soft` with a 2px `--accent-ink` left rule.

### 3.3 Typography

- **Fonts:** self-host JetBrains Mono (400/500/700, woff2, `font-display: swap`) and Monument Extended.
  - Monument needs a **real heavy weight**. Obtain `MonumentExtended-Ultrabold` (Pangram Pangram; check the licence for a public site).
  - If a heavy weight can't be licensed, use the Regular at weight 400 with `font-synthesis: none`. Never request 900 from a single-weight face.
  - **Decision for the agent run: use the Regular fallback.** An unattended agent can't obtain a licence. Route every display weight through one token (`--display-weight`, currently 400) so the owner can drop in Ultrabold later with one `@font-face` and one token change.
  - Delete Inter, Syne, zentry, general, circular and robert (files, `@font-face` rules, Google imports, and the injected `<style>` in HomePage/Profile/Navbar).
- **Scale.** No text below 10px. Add Tailwind `fontSize` tokens and matching TS constants for inline use.

| Step | Font | Size | Weight | Tracking | Case | Use |
|---|---|---|---|---|---|---|
| display | Monument | clamp(2.75rem, 6vw, 5rem) / .92 | heavy | -0.01em | UPPER | home hero, one per page max |
| h1 | Monument | clamp(2rem, 3.6vw, 3rem) / .95 | heavy | -0.01em | UPPER | every page title, exactly one `<h1>` |
| h2 | Monument | 22px / 1.1 | heavy | 0 | UPPER | section titles |
| h3 | Mono | 15px / 1.3 | 700 | 0 | Sentence | card titles |
| body | Mono | 14px / 1.6 | 400 | 0 | Sentence | paragraphs |
| small | Mono | 12px / 1.5 | 400 | 0 | Sentence | meta, table cells |
| label | Mono | 11px / 1.2 | 700 | 0.12em | UPPER | eyebrows, buttons, tabs, nav |
| micro | Mono | 10px / 1.2 | 500 | 0.08em | UPPER | badges, axis labels (floor) |

- **Copy:** sentence case for prose and UPPERCASE for labels. No exclamation marks and no emoji. Say "Vantage" in prose; "VANTAGE" is the wordmark only.
- **Numbers:** use `font-variant-numeric: tabular-nums` everywhere.

### 3.4 Radius policy

**0 everywhere.** Enforce globally in `tokens.css`: `*, *::before, *::after { border-radius: 0 !important; }`, with an opt-out attribute `[data-shape="round"]`. This zeroes about 520 legacy declarations on day one, while migration is still under way. Set shadcn `--radius: 0`.

The only allowed `data-shape="round"` uses:
1. **Graph and tree nodes in visualizers.** The circle-vs-square difference is semantic: node versus array cell or stack frame.
2. **Radio inputs**, to keep them distinguishable from checkboxes.

Everything else is square and needs no exception:
- avatars
- presence and notification dots (6px squares)
- toggles (square track and thumb)
- progress bars
- scrollbars (styled 8px square thumb)
- loaders: replace spinners with a 2px indeterminate bar, or a blinking block cursor `▮`
- focus rings: use `outline`, not box-shadow

Monaco internals and native select popups are accepted as-is.

Reset exclusions, so the global rule doesn't cause damage during migration:
- Exclude `.monaco-editor` and its descendants from the reset (Monaco's own widgets, suggest box and scrollbars rely on their radii and layout).
- Exclude legacy visualizers until they're migrated. `VisualizerPage` wraps any visualizer whose manifest `status` isn't `done` in `data-legacy-viz`, and the reset skips `[data-legacy-viz] *`. Otherwise the 13 tree, 5 graph and 8 list visualizers turn their circular nodes into squares before the new stages exist, which breaks the node-vs-cell meaning. The wrapper disappears when the last visualizer is migrated (end of Phase 5).

### 3.5 Space, layout, elevation

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Off-grid values (3, 5, 7, 9, 11, 13, 14, 22) are banned in new code.
- **Containers:** `--container: 1200px` (default) and `--container-narrow: 768px` (forms, lobbies, auth). Side padding is clamp(16px, 4vw, 48px).
- **Breakpoints:** Tailwind defaults only: sm 640, md 768, lg 1024, xl 1280, 2xl 1536. Delete the 13 ad-hoc `@media` values.
- **Elevation:** no shadows. Depth comes from a `--surface` vs `--bg` difference plus a 1px border. Overlays use an opaque `--surface` and a `--border-strong` border, with the backdrop at `rgba(0,0,0,.6)` dark / `rgba(10,10,11,.35)` light. No blur.
- **z-index scale:** base 0 / raised 10 / sticky 20 / nav 30 / overlay 40 / modal 50 / toast 60 / tooltip 70. Everything above 70 is a bug.

### 3.6 Motion

- **One library: GSAP.** Remove `framer-motion` and `motion`.
- **Allowed:**
  - one entrance per page, a 200–300ms fade or 8px rise
  - hover as colour or border change (≤120ms)
  - visualizer step transitions (position and fill, 150–250ms)
- **Banned:** infinite decorative loops (navbar ticker, XP sweep, glitch re-scramble, bell pulse, VS pulse), tilt, hover scale or translate, text glitch on nav hover, parallax.
- **Reduced motion:** `prefers-reduced-motion: reduce` disables all GSAP timelines. Canvases draw one static frame. Visualizer transitions drop to 0ms.
- **Cursor:** remove `CustomCursor` entirely and restore the native cursor. It hurts touch, trackpad demos, screen-share and accessibility.

### 3.7 Iconography

Lucide only, at 14, 16 or 20px with stroke 1.5. Remove `@mui/*` + `@emotion/*` (used for one icon), `react-icons`, both tabler packages and `@radix-ui/react-icons`. Icon-only buttons need an `aria-label` and a tooltip.

### 3.8 Primitives: `src/components/ds/*`, wrapping shadcn where one exists

Decision: **adopt shadcn for behaviour, own the look in `ds/`.** shadcn (Radix underneath) supplies focus traps, keyboard navigation and ARIA for Dialog, Sheet, Select, Tabs, Tooltip, Popover and DropdownMenu. Don't hand-roll these. The 17 existing files in `src/components/ui/` are restyled onto tokens (radius 0, no shadows); `ds/*` wraps them with the variants below. Pages import from `ds/` only, never from `ui/` directly.

Setup facts and constraints:
- Stack: React 19.1, Tailwind 3.4.1, CRA via craco, JS (no TS). Stay on Tailwind 3.4. shadcn states existing Tailwind v3 projects keep working and new components install in v3 style (https://v3.shadcn.com/docs/tailwind-v4). A Tailwind v4 migration under CRA is out of scope.
- Delete the duplicate root `components.json`; keep `reactapp/components.json`.
- Remove the `registries` block from `reactapp/components.json` (aceternity, magic-ui, react-bits, cult-ui, kokonutui, shadcnblocks, v0, jolly-ui, origin-ui). These are effect libraries (glow, tilt, spotlight) and conflict with §3. Only add components from the default shadcn registry.

| Primitive | Variants / notes |
|---|---|
| `Button` | primary (accent fill), secondary (border), ghost, danger, link. Sizes sm 28 / md 36 / lg 44. `iconOnly` and `loading` props. Hover inverts colours. Focus is a 2px `--focus` outline with 2px offset. |
| `IconButton` | wraps Button; requires `aria-label` |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `SegmentedInput` | label always visible; error text below the field, never `alert()` |
| `Panel` | default / inset / interactive (border goes to `--border-strong` on hover) / accent (1px `--accent-ink` border). Optional header row: label + actions. **No traffic-light dots.** |
| `Badge` | neutral / accent / ok / warn / err / outline. Micro type. |
| `Tabs` | underline (page sections) and segmented (filters). Keyboard arrow navigation. |
| `Dialog`, `Sheet` | shadcn restyled; focus trap; Esc closes |
| `Toast` | one Toaster region; info / ok / err. Replaces AppToast and the Store toast. |
| `Tooltip` | shadcn only |
| `Table`, `ListRow` | tabular numbers; zebra via `--elevated` at 50% |
| `Stat` | label + value + optional delta. Mono 700 value. No rings or donuts. |
| `Progress` | 4px solid `--accent` on a `--elevated` track |
| `Avatar` | square, initials fallback |
| `Skeleton`, `EmptyState`, `ErrorState`, `OfflineState` | ErrorState and OfflineState have a Retry button. OfflineState reads "Can't reach the Vantage API", with a short explanation and a link to the visualizers, which work offline. |
| `PageLoader` | 2px indeterminate bar under the nav plus a `LOADING_` label |
| `Kbd` | keyboard hint chips |

### 3.9 Theme mechanics

- `ThemeProvider` stays, with key `vantage-theme` and default `system`. Add a `matchMedia` change listener.
- Put a `ThemeToggle` (sun/moon IconButton) in the Navbar and the footer. It currently exists only on JudgePage.
- In `public/index.html`, add an inline pre-paint script that sets the `html` class from localStorage or `prefers-color-scheme` before React loads. Remove `class="bg-gray-900"` from `<body>`, and add `<meta name="theme-color">` for both schemes.
- `useThemeTokens()` returns the resolved token values and re-renders on theme change. Canvas modules (Home animations, PixelCard, BattleResult canvas, radar), the cobe globe and Monaco use it. For Monaco, define `vantage-dark` and `vantage-light` themes from tokens.
- Canvas colour helpers (`HomePageAnimations ~L18-28`, `ComplexAnimations L5`, `MidAnimations L4`) switch to `canvasTheme.js`. Store tokens as `r,g,b` triplets (`--fg-rgb`, `--bg-rgb`, `--accent-rgb`) and read them inside the draw loop so a theme toggle applies without a remount. Replace `"rgba(255,255,255,"` literals with the fg triplet. Collapse per-algorithm rainbow palettes to accent + fg + one status colour.
- At the end of Phase 5 (not earlier; legacy visualizers depend on it until then), delete the remap layer (`index.css:1396-1713`), `ZINC_LIGHT_SCOPE_PATHS` and `MAP_DARK_LOCK_PATHS` (`App.jsx:45-62`, ~191-205), and the `.battle-page` purple variables (`index.css:872-883`).

### 3.10 Enforcement: `scripts/check-ui.mjs`, run in CI and before every batch

It fails on any of the following in `src/**` (allow-list: `src/styles/tokens.css`, `src/components/ds/**`, `canvasTheme.js`):
- hex, `rgb()` or `hsl()` colour literals
- `borderRadius`, or `rounded-*` other than `rounded-none`
- `bg-gradient`, `linear-gradient`, `radial-gradient` (`src/pages/**` and `src/components/**` except ds)
- `boxShadow`, `shadow-*`, `textShadow`, `backdrop-blur`, `backdropFilter`
- font sizes below 10px
- `cursor: none` / `cursor-none`
- imports of `@mui`, `framer-motion`, `motion/react`, `react-icons`, `@tabler`
- `fontWeight: 900` on a non-Monument font
- more than one `<h1>` per page file
- emoji code points in JSX text

It prints per-file counts, so migration progress is measurable. It starts as a warning, then becomes an error per directory as each phase completes.

---

## 4. App shell spec

- **Navbar**
  - A fixed 56px (`--nav-h`) bar at full width: square, opaque `--surface`, 1px bottom `--border`. No floating pill, blur, grain, ticker canvas, XP sweep or glitch text.
  - Left: logo tile + "VANTAGE" wordmark (restore `Navbar.jsx:263-264`).
  - Centre: nav items in Mono label type at fixed weight, UPPERCASE. The active item gets an inverted block (accent fill, on-accent text).
  - Items: VISUALIZERS, PROBLEMS, BATTLE, MAP, LEADERBOARD, ACHIEVEMENTS, FRIENDS. The labels must match the page H1s (today it's "Visualize"/"Explore Topics", "Ranks"/"Leaderboard", "Badges"/"Achievements").
  - Right: theme toggle, notifications (a popover, not a second link to /friends), the extension as a ghost IconButton, and avatar menu (Profile, Store, Inventory, Sign out) or a primary "SIGN IN".
  - Transparent only over the home hero. It gets its border once scrolled.
- **Mobile nav:** a `Sheet` from the right. Esc closes, focus is trapped, `aria-modal`, body scroll locks. Items at 24px Mono uppercase.
- **PageShell:** `padding-top: calc(var(--nav-h) + 32px)`, a container, and an optional narrow variant. It replaces the 5 different top offsets.
- **PageHeader:** props `eyebrow`, `title` (h1), `description` (body, `--fg-muted`, max 64ch), `actions` and a breadcrumb slot. One acid word is allowed in the title via `<em>`, rendered as `--accent-ink`. Remove the textShadow glow, the red "Arena.", the ".-block" gimmick and the two-tone second line.
- **Footer:** on every non-arena page. Mono 11px: © 2026 Vantage · GitHub · Extension · theme toggle. Fix the `©` mojibake.
- **Visualizer chrome:** remove the `VisualizerPage` second nav (`.visualizer-nav`). The breadcrumb `VISUALIZERS / SORTING / BUBBLE SORT` goes into the visualizer header, and it links to real parent routes, not `navigate(-1)`.
- **Global overlays:**
  - Battle-in-progress bar becomes a square bottom strip on the toast layer. It is hidden on `/` and not stacked with scroll-top.
  - Scroll-top is a square IconButton at the raised z-level.
  - The Suspense fallback becomes `PageLoader`.
- **`public/index.html`:** title "Vantage — DSA visualizers, judge and battles". Rewrite the meta description, add OG and Twitter tags, `theme-color` and `manifest.json`. Rename the favicon `algo.svg` → `vantage.svg`, and set `package.json` name to `vantage-web`.

---

## 5. Visualizer shell spec (`src/components/visualizer/` v2)

Full contract and per-file job: `VISUALIZER_MIGRATION_PROMPT.md`. What the shell renders:

- **Header, one row, about 88px:**
  - Breadcrumb.
  - h1 with the algorithm name, a difficulty badge and a LeetCode link badge if one exists.
  - One-line summary.
  - Right side: ModeTabs (if the page has modes) and "About" (opens a sheet with complexity and notes).
- **Toolbar**, sticky under the header:
  - Input fields, which **stay editable**: Apply regenerates in place, so there's no Reset-to-edit.
  - Example chips and a Random button.
  - Transport: first, prev, play/pause, next, last.
  - A scrubber over all steps.
  - Speed presets 0.5×, 1×, 2×, 4×.
  - Step counter `12 / 48`.
  - A `?` popover listing the keyboard keys.
- **Body, responsive:**
  - At 1440 and above: code (360) | stage | inspector (280: variables, stats, legend).
  - 1024–1440: code | stage, with the inspector as a strip under the stage.
  - Below 1024: stage first, then tabs for code / inspector / log, with a sticky bottom transport.
- **Caption:** directly under the stage, the current step's message at body size. This is the most important line on the page. The log becomes a collapsible panel.
- **Idle:** there isn't one. Load example 0 on mount at step 0, paused, so the page is never blank.
- **Errors:** parse and validation errors appear inline under the field. `alert()` is never used.
- **Stage kinds** (the archetype library; counts from the manifest):
  - `array` 76, used for arrays, strings and scalars; cells scale to fit, and horizontal scroll is the last resort
  - `matrix` 16
  - `tree` 13
  - `list` 8
  - `graph` 5
  - `bits` 5
  - `bars` 3
  - `vars` 3
  - `stack` 3
  - `queue` 2
  - `intervals` 2
  - `callstack` 1

  Aux panels (`stack`, `queue`, `table`, `callstack`, `ops`) sit beside or below the stage. Pointers are rendered by the stage from indices, with no DOM measurement.
- **Code:** one C++ listing per mode as plain strings. The shell tokenises it; nothing is hand-tokenised. In dev, assert that every `step.line` exists in the listing.
- **Keyboard:** `←` `→` step, `Space` play, `Home` `End`. The keys are ignored when focus is in an input, textarea, contentEditable or `.monaco-editor`, and when `embedded`.
- **Embedded (judge drawer, 360px):** stage + caption + mini transport only.
- **Accessibility:**
  - labelled controls
  - `aria-live="polite"` on the caption
  - state conveyed by text and pattern as well as colour (e.g. `active` cells get a 2px inner border, and `done` cells get dim text)
  - at least 4.5:1 contrast for all text in both themes

---

## 6. Page redesign specs

Each page is PageShell + PageHeader + primitives + OfflineState. What follows is only what's specific to each page.

| Page | Route | Target |
|---|---|---|
| **Home** | `/` | 1) Hero: `> vantage` eyebrow, "VISUALIZE / PRACTICE / COMPETE" display, one line naming all 5 pillars, RaceCanvas in a bordered frame (token colours), CTAs "Open visualizers" (primary) → `/visualizers` and "Solve a problem" (secondary). Real counts derived from the catalog (142 visualizers). 2) Visualizers: 8 cards, 2 rows, one accent, "Browse all →". 3) Judge + code-flow: a static editor frame showing verdict + trace (new). 4) Battles: trimmed. Remove the fake ELO numbers and "Avg wait". 5) Map: a read-only `world.svg` preview (new). 6) Extension: a bordered terminal block (not a yellow slab). 7) Final CTA: the only accent slab. 8) Footer. Cut Features tape, HowItWorks, ticker and the "+43 more" row. Fix all mojibake (HomePage.jsx L377, 382, 419-435, 492, 505, ~850-965, ~1165). IO-pause every canvas (`MidAnimations` L599/710/837/975, `MatchSearchRadar`). |
| **Visualizers hub** | `/visualizers` | Grid of topic tiles: Panel interactive, lucide icon in `--fg`, topic name h3, count badge, difficulty mix as three tiny bars. Remove PixelCard canvases, spotlight colours, the 2 fixed background canvases and the "Rate" stat. Search is a full-width Input with a `Kbd /` hint. |
| **Topic page** | `/<topic>` | Compact PageHeader (no 60–80vh hero). Algorithm list as ListRow or Table: name, difficulty, pattern tags, LeetCode #. Remove the yellow square, purple ambient and gradient difficulty bars. |
| **Explore** | `/explore` | Merge into the visualizers hub (same content, different design) and redirect. |
| **Problems** | `/problems` | Table primitive with filters as a segmented Tabs + Select row. Status icons, difficulty text + bar. OfflineState replaces the raw error. Remove the "Arena." H1, gradients and HomePage canvases. |
| **Judge** | `/problem/:id` | Keep the resizable layout. Chrome uses tokens, with the Monaco `vantage-*` themes. Tabs are underline style. The verdict banner is a status-coloured Panel. Add a slim top bar with back-to-problems, the title and the theme toggle, because the global nav is hidden here. Rename "Debug" to "Load failing case". Add ErrorState / not-found / "Sign in to run" states. Codeflow panels use tokens and get responsive rules. |
| **Auth** | `/login`, `/signup` | Narrow container, a single Panel form. Visible labels, inline errors, and OfflineState when the API is unreachable. The right half is a static RaceCanvas frame or nothing (remove the NQueens canvas). Password toggle IconButton gets an aria-label. |
| **Map** | `/map` | Dual theme (checklist §6.1). Square HUD Panel, collapsible on mobile into a bottom sheet. Square tool rail with 44px targets. **Legend** (locked / available / current / completed). A `.country-selected` state. Hover tooltip. Accent-only CTA ("Solve"), with "Visualize" as secondary. Delete the quality tip: auto-pick quality, keep HD/SD as a ghost button. Hide "Content coming soon" problems. The stage colour survives only as a 2px stroke on completed countries, if contrast allows in both themes; otherwise use accent. |
| **Leaderboard** | `/leaderboard` | Tabs (underline) for the boards. Table with rank, avatar, name, value (tabular) and delta. The top 3 get an accent rank cell, not podium gradients. Remove the glow H1, `nowrap` and the empty right panel (or fill it with "Your rank" Stat). OfflineState. |
| **Achievements** | `/achievements` | One h1. Stat row (total / earned / in progress) as Stat primitives. Category Tabs. Badge grid of square Panels: locked ones at `--fg-dim` with a 1px dashed border, earned ones with an accent-ink border and date. No tilt or ring. |
| **Profile** | `/profile` | PageHeader with square Avatar, name and handle. Stat grid (XP, level, streak, rating). Progress by topic as Progress bars. Recent activity ListRows. Remove the canvas hero, grain and Syne. Add responsive rules. |
| **Friends** | `/friends` | Two columns (list | requests and search), collapsing to Tabs on mobile. ListRow for friends with a square presence dot. **One** ChallengeDialog (merge `FriendChallengeModal.jsx` and `FriendsPage.jsx:310`). The cobe globe goes, or gets token colours and moves to a side panel. |
| **Store / Inventory** | `/store`, `/inventory` | Same grid template: Panel items with a lucide icon (no 📦), name, description, price as Mono + Coins icon, and a Button. The inventory adds "Equipped" Badges. Both move onto tokens (currently Tailwind zinc and shadcn). |
| **Battle lobby / arena / result** | `/battle*` | Lobby: narrow container, mode Tabs (Casual / Ranked), config as SegmentedInput and Select, a primary "FIND MATCH", and a history Table. Arena: Judge layout plus an opponent status strip and a timer (Mono, tabular; `--err` under 60s). Result: verdict PageHeader (WIN / LOSS / DRAW), Stat deltas (ELO, XP, coins), a per-problem Table and actions. Remove the ⚡ emoji, red "Arena." and radii. |
| **Group lobby / arena / result** | `/group*` | **Same templates as Battle.** Today it's a different Tailwind system. Room code is a SegmentedInput with 6 square cells. Players ListRows with host controls in a menu. Result standings Table. Rewrite the exclamation copy (`GroupResultPage.jsx:42-46`). |

### 6.1 Map dual-theme checklist (from `evidence/probe-home-topics-worldmap.md` §C)

1. Delete the map dark lock: `App.jsx` `MAP_DARK_LOCK_PATHS` + the body class, and `index.css ~L1679-1713`.
2. Tokens on `.skill-tree-wrapper`: `--wm-land`, `--wm-land-stroke`, `--wm-locked`, `--wm-available`, `--wm-current-fill` (accent), `--wm-current-stroke` (`--fg`), `--wm-completed`, `--wm-grid`. Rewrite the country state rules in `WorldMap.css` on top of these; its light rules already exist, so reuse them. Lower the "available" fill weight so it doesn't dominate: use a `--elevated`-ish fill + `--border-strong` stroke.
3. `world.svg` line 30: remove the root `fill="#ececec" stroke="black"`. Paths have no own fills, so no other transform is needed.
4. `WorldMap.jsx` inline styles (wrapper L350, grid L354-367, sidebar L403-468, HUD L471-563, modal ~L632-690, popup ~L697-800, tooltip ~L806-813): move to tokens and primitives. Replace the purple gradients (HUD arc ~L512-527, Visualize button ~L768, marker stroke L392 `#3d2fff`, `--wm-purple`, `STATUS_CFG` L34-39) with accent or fg.
5. The marker SVG gets CSS classes instead of fill attributes.
6. Clear the tooltip timers (L299-306) and stop the popup-follow rAF once it has settled (L240-263).
7. Verify: toggle the theme with the map open. It must repaint without a reload.

---

## 7. Phases

Each phase ends with a passing build, `check-ui.mjs` counts recorded, and at most 6 viewport screenshots reviewed in both themes. The acceptance criteria below are the contract; "looks fine" is not.

### Phase 1: Foundation (strong)

- `tokens.css`, the Tailwind config and the global radius reset:
  - fix the duplicate `accent` key
  - add `<alpha-value>` channels
  - add `fontFamily.mono` / `fontFamily.display`
  - add the `fontSize` scale
  - set the spacing scale, `screens` and the z-index scale
- Fonts: JetBrains Mono self-hosted, and a Monument heavy weight or no-synthesis fallback. Delete the unused fonts.
- Theme: pre-paint script, ThemeToggle in the nav, system listener, `useThemeTokens`, `canvasTheme.js`.
- `ds/*` primitives with a hidden `/__ds` preview route that renders every primitive in both themes, for the screenshot gate.
- App shell: Navbar, mobile Sheet, PageShell, PageHeader, Footer, PageLoader, OfflineState, overlays, `index.html`.
- Remove CustomCursor, MUI, framer-motion/motion and the unused deps (`three`, `@react-three/fiber`, `pixi*`, `lenis`, tabler, radix icons, `@langchain/google-genai`, `shadcn-ui`, `react-markdown`, `react-syntax-highlighter`). Lazy-load every route in `App.jsx`: main bundle is 524 kB gzip today, target under 250 kB.
- `scripts/check-ui.mjs` in warning mode.
- `scripts/route-smoke.mjs` (headless Playwright, no screenshots). It visits every route in both themes, asserting no page errors, a visible `<h1>` with non-zero width, and (for visualizer routes) that a stage or the legacy root exists. Phase 1's global changes touch all 142 visualizer routes, so this runs from here on, not from Phase 3.
- Demo-data mode: `REACT_APP_DEMO=1` serves fixtures for stats, leaderboard, map progress, problems and a fake signed-in user, so protected pages (Profile, Battle, Friends, Store, Inventory) can be built and verified with the backend down. Fixtures live in `src/demo/`; the switch sits in one place in the API layer and must not change behaviour when the flag is off.
- `components.json` cleanup (§3.8).
- Write `docs/polish/DESIGN_SYSTEM.md`: the frozen, as-shipped reference (tokens, type scale, every `ds/*` primitive with its props and variants, layout rules, do/don't). Every later unit reads this file instead of re-deriving the system from §3.

Accept:
- `/__ds` screenshots pass in both themes.
- Body text contrast is at least 4.5:1 in both themes (measured with a script, listed in the phase notes).
- No faux bold: the computed `font-weight` on Monument elements matches a loaded face.
- `rg "@mui|framer-motion|motion/react|CustomCursor" src` is empty.
- The main bundle size is recorded.
- Route smoke passes on every route in both themes, with and without `REACT_APP_DEMO=1`.
- The light-mode accent edge is visible on primary buttons and the active nav item (`/__ds` screenshot).
- `DESIGN_SYSTEM.md` exists and matches the code. After this phase the design system is **frozen**: later units may add a primitive only through a dedicated design-system unit, never inline in a page.

### Phase 2: Visualizer shell + stages + pilots (strong)

- The `defineVisualizer` shell (§5), stage kinds and aux panels, and the `scripts/check-visualizer.mjs` harness (see the prompt doc).
- Migrate the 10 wave-1 pilots, one per stage kind: BubbleSort, EditDistance, ReverseLinkedList, ValidateBST, Dijkstra, LRUCache, NextGreaterElement, SingleNumber, TrappingRainWater, MergeIntervals.
- Freeze the API table in `VISUALIZER_MIGRATION_PROMPT.md` §4 from what actually shipped.
- Judge drawer: FindMax/FindMin embed contract (track B, but do the shell side here).

Accept:
- The pilots pass the harness.
- Screenshots in both themes at 1280 and 390 for 3 of the pilots.
- Step, scrub, play, keyboard and embedded mode all verified by hand in the browser.
- No pilot needs `view.render`.
- The parity harness's legacy-extraction success rate on the 10 pilots is recorded in the manifest. If extraction fails on more than 3 of the 10, improve the extractor before Phase 3 starts, since every failure there becomes a manual review.

### Phase 3: Bulk visualizers (Opus subagents, independent review)

- Waves 2→6 of track A (109 files) in manifest order, one file per job, using the job prompt in `VISUALIZER_MIGRATION_PROMPT.md` §4.
- Harness gate. On failure, one retry with the failure output. On a second failure, mark it `escalated`.
- A separate reviewer subagent reviews every escalation and the first 3 files of each new stage kind, then spot-checks 1 in 5 (no more than 6 screenshots per review session). Resolve escalations in the same phase.
- Wave 0 deletions, wave 9 alias.

Accept:
- The manifest shows track A as `done` or `escalated`, and escalations are resolved.
- `rg -l "className=" src/pages/algorithms` is empty.
- Route smoke (from Phase 1) passes on all 142 visualizer routes in both themes, and every migrated route renders the new stage.

### Phase 4: App pages (one Opus subagent per page, template pages first)

Order:
1. Home
2. Visualizers hub + Topic page (+ `/explore` redirect)
3. Problems
4. Judge + codeflow
5. Map
6. Battle ×3 (template) → Group ×3 (reuse)
7. Leaderboard, Achievements, Profile, Friends
8. Store / Inventory
9. Auth

Each page job gets the page file, the relevant row of §6, `DESIGN_SYSTEM.md` and one finished page as reference (Home for marketing-style pages, Problems for list/table pages, Battle lobby for the Group pages). Do **not** delete the remap layer here; it moves to the end of Phase 5 (§3.9).

Accept:
- `check-ui.mjs` reports 0 violations in `src/pages` and `src/components`, **excluding** `src/pages/algorithms/**` files whose manifest status isn't `done` (the script reads the exclusion list from the manifest). It switches to error mode for everything else.
- Every page renders an OfflineState with the API unreachable.
- Every icon-only button has an aria-label.
- Visible focus on every interactive element (keyboard pass on Home, Problems, one visualizer, Judge).
- Reduced motion is honoured.
- Screenshots: Home, Map, Judge, Leaderboard in both themes plus Home and Map on mobile (spread across sessions to respect the image budget).

### Phase 5: Visualizer track B + C (strong)

- 18 generators to author: imperative files such as TwoSum, 3Sum, the Strings set, TopologicalSort, KnightsTour and ExpressionAddOperators.
- 4 custom stages: AStar, Pathfinding/BFS, NetworkFlow, TowerOfHanoi.
- `SquaresOfSortedArray.tsx` → `.jsx`.

- Then, with every visualizer migrated: delete the remap layer and path lists (§3.9), remove the `data-legacy-viz` wrapper and its reset exclusion (§3.4), and switch `check-ui.mjs` to error mode for `src/pages/algorithms/**` as well.

Accept: the same as Phase 3, plus back-stepping works on every former imperative page, the manifest shows every entry `done`, `check-ui.mjs` reports 0 violations across `src/**` in error mode, and route smoke passes in light mode on every route after the remap layer is gone.

### Phase 6: Demo polish (strong)

- A 15-minute demo path: Home → Visualizers → Dijkstra → Problems → Judge (run + code-flow) → Map → Battle lobby → Leaderboard. It must work with the backend down, using the demo-data mode built in Phase 1 (`REACT_APP_DEMO=1`). Extend the fixtures wherever the demo path still shows an empty state.
- Copy pass: sentence case, no hype, real counts.
- Re-shoot the README screenshots and GIFs in both themes (update the README image references only; the README rewrite is Appendix A).
- Lighthouse accessibility at least 90 on Home, Problems, one visualizer and Judge, in both themes.

Accept: the demo path runs end to end with no console errors, twice in a row, in both themes.

### Execution model

Every unit runs on an Opus subagent dispatched by an Opus orchestrator (`HANDOFF.md`). The Gemini Flash routing in the original audit is dropped. What stays from it:
- one unit per subagent: one visualizer file, one page, or one foundation concern
- a fixed brief: the job prompt or page row, `DESIGN_SYSTEM.md`, one reference file and the frozen API
- visualizer jobs output the whole file or `ESCALATE: <reason>`
- the gates decide pass or fail, not the subagent's self-report
- a separate reviewer subagent renders the final verdict on each unit
- the manifest `status` and `PROGRESS.md` are updated after each unit

---

## Appendix A: deferred (not UI)

Kept from the turn-1 audit. IDs are stable. The full tables with file:line, fix direction and safety notes are in `DEFERRED_NON_UI.md`. **S1–S4 are exploitable on the live site today.** Deferring them is the owner's call, but the owner should know that.

**Security (backend)**
- **S1 Critical:** `CurrentUser.java:35-43` falls back to `?userId=` on public `/api/auth/**`. `POST /api/auth/extension/token?userId=N` mints a token for any user, and `GET /api/auth/me?userId=N` leaks any profile.
- **S2 Critical:** `/api/users/` is public (`JwtAuthFilter.java:140`). Unauthenticated `PUT` / `DELETE /api/users/{id}`.
- **S3 Critical:** public problem and institution writes.
- **S4 Critical:** secret fallback defaults in `application.properties` (gitignored, but baked into images). Rotate the DB password and JWT secret.
- S5: STOMP SEND not authorised.
- S6: JWT accepted as `?token=` everywhere.
- S7: JWT in localStorage.
- S8: plaintext password fallback.
- S9: no rate limits.
- S10: stale cookie causes 401 on public paths.

**Backend correctness**
- **B1:** 1v1 battles almost never complete (default `continueAfterFirstFinisher=true`, timeout → CANCELLED, no ELO).
- B2: judge call inside a DB transaction.
- B3: completion races.
- B4: coin double-spend.
- B5: self-reported solves.
- B6: streak shield broken, and the nightly job rolls back.
- B7: catch-all handler turns 4xx into 500.
- B8: judge proxy error mapping.
- B9: timezone.
- B10: N+1 queries.
- B11: `ddl-auto=update`, no migrations.
- B12: user delete orphans.
- B13–B16: ELO, level, scheduler and kick details.
- Q1–Q3: BattleService god class, leftovers, no meaningful tests (and `contextLoads` hits prod).

**Frontend realtime**
- F1: lobby subscriptions grow every 3s.
- F2/F3: STOMP clients orphaned, and no resubscribe on reconnect.
- F4: stores not reset on logout.
- F5: 3 STOMP connections.
- F6: StrictMode effects.
- F7: judge states. The UI part is covered in Phase 4.
- F8: 5 base-URL builders.
- F9: any 401 logs you out.
- F10–F12: minor.

**Judge**
- J1: empty testCases → Accepted.
- J2: AVL problem has 0 tests.
- J3: host-mode Lambda sandbox leaks the env through `/proc`.
- J4: verify the catalog `JUDGE_TOKEN` in 2gb compose.
- J5: executor gate fails open.
- J6: output comparison.
- J7: duplicate problem id.
- J8–J10: dead worker pool, folder nesting, stale comment.

**Data**
- D1: 11 visualizers crash on Back. **Fixed as a side effect of Phase 3.**
- D2: catalog gaps (Graphs 1 card, Heaps 3, 11 unlisted routes). **Pull into Phase 4 (Topic page) because it is visible.**
- D3: swapped bonusC judge IDs.
- D4: dead map routes.
- D5: duplicates and typos (partly handled by track D).
- D6: stale catalog JSON.

**Extension:**
- E1: forgeable solve events.
- E2: postMessage origin.
- E3: localhost permissions.
- E4: API host mismatch.
- E5: popup styling. UI, so do it after Phase 4 using the same tokens.

**Deploy / repo:**
- X1: nginx lacks WebSocket upgrade and buffering off.
- X2: stale 4gb compose, missing env keys, no healthchecks.
- X3: about 60 MB of tracked media, `VantageCode.zip`, unused hero videos and music (about 29 MB, never referenced).
- X4: no LICENSE, no CI.

**README truthfulness**
- PostgreSQL / Redis / Firebase / Docker worker pool claims are wrong.
- The counts are wrong (142 visualizers, 158 map problems).
- The streak table and battle duration don't match the code.

**Open questions (deferred):**
- 1v1 timeout rule.
- Docker Hub image visibility.
- TLS / Cloudflare.
- Keep the legacy Docker judge?
- Media history rewrite.
- Monument heavy-weight licence. Resolved for the agent run: use the Regular fallback behind `--display-weight` (§3.3). The owner can swap in Ultrabold later.
