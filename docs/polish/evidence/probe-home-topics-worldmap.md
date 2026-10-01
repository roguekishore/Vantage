<!-- Recovered from crashed Kiro session sess_35b51775, sub-agent output at 2026-09-30T07:44:18.614Z. -->
# Deep-dive on the first-impression surfaces (home page, animations, topics hub) and the world map's theming feasibility for dual theme.

## Prompt given to the probe

Project: d:\PROJECTS\APPS\VANTAGE\reactapp. The owner is polishing for a 15-minute portfolio/interview demo where first impression matters most. Target identity: terminal-brutalist, strict zero border radius, #09090b / acid-yellow #EDFF66, Monument Extended + JetBrains Mono, full dark AND light theme everywhere INCLUDING the world map (currently dark-locked via index.css ~L1679-1713 and App.jsx MAP_DARK_LOCK_PATHS). Read-only; give file:line evidence.

A) Home page: src/pages/home/HomePage.jsx (73KB), HomePage.css, src/components/animations/HomePageAnimations.jsx (110KB), ComplexAnimations.jsx, MidAnimations.jsx, public/videos/hero-1..4.mp4 (~28MB), public/audio/music_main.mp3.
 1. Section-by-section outline of the home page in render order: what each section says (copy verbatim for headings/CTAs), layout, which animation/canvas/video it uses, approx height, and CTA targets. Are hero videos/audio actually used and how (autoplay? preload? sizes)? Is there a music toggle?
 2. Judge each section as a designer: does it communicate what Vantage is within 10 seconds? Redundant sections? Copy quality (buzzwords, typos, inconsistent claims vs real features: e.g. "150+ visualizers" when 142 exist)? Performance cost (canvas rAF loops running offscreen? IntersectionObserver pausing? number of simultaneous canvases; video weight).
 3. The canvas animations: list each exported animation component, what it draws, its palette (does it use #EDFF66 at all?), whether it pauses offscreen/respects reduced motion, and how colours could be sourced from CSS variables at runtime (they use rgba(hex,a) helpers — identify them) so they switch with theme. Estimate refactor effort per module.
 4. Recommend a tighter home page structure (sections, order, what to cut) that showcases: visualizers, judge + code-flow, battles, map, extension — with the brutalist system.
B) Topics hub /visualizers (src/pages/topics/TopicsPage.jsx, PixelCard.jsx, TopicPixelCard.jsx, data/topics.js) and topic page (TopicPage.jsx): layout, card design, per-topic spotlight colours (data/topics.js), difficulty colour coding; how to make it consistent with zero radius + single accent + dual theme. Note the Heaps and Graphs topic pages are nearly empty because search/catalog.js lacks entries — confirm what they render.
C) World map (src/map/*: WorldMap.jsx, WorldMap.css, world.svg or equivalent, useProgressStore, any stage/territory components): how the map is drawn (inline SVG? img? react-zoom-pan-pinch), how countries/regions get colours (CSS classes, fill attributes in the SVG, JS style mutation), number of hardcoded colours, the purple CTA, the "quality tip" modal, the "Content coming soon" placeholder (L~774), side panels. Concretely list everything that must change to support a light theme (SVG fills/strokes → CSS vars via currentColor or classes, overlay panels, legend), and whether the SVG file hardcodes fills that would need a one-time transform. Also evaluate map UX polish issues (zoom controls, legend, selected-state, locked/unlocked/completed state colours, tooltip design, mobile).
D) Global chrome touching these pages: Navbar appearance over the home hero vs other pages, scroll-to-top button, battle overlay (App.jsx), toasts. 

Deliver: section outline tables, a prioritized fix list (top 25) with file:line + target treatment, and a map dual-theme implementation checklist.

## Findings

=== Context Gathering Summary ===
FOUND: Home page render order, all section copy and CTAs (HomePage.jsx); hero video and audio are unused (only an unimported config/assets.js VIDEOS entry; file sizes checked); canvas component inventory, rgba helpers, which loops have IO pausing; MatchSearchRadar and Cursor unbounded rAF; mojibake locations; catalog count of 136; Heaps (3) and Graphs (1) catalog entries; TopicsPage, TopicPixelCard and TopicPage styling plus the DIFF config; spotlight colours in data/topics.js; WorldMap SVGR + react-zoom-pan-pinch pipeline, the applyCountryStyles class painter, WorldMap.css with existing light rules; the world.svg root-only fill; the App.jsx dark-lock toggle and the index.css lock block; purple usages, quality tip, "Content coming soon", HUD, stages modal, popup, tooltip; Navbar floated logic; AppToast; battle overlay; scroll-to-top.
NOT FOUND: No HomePage.css read (styles are inline). No PixelCard.jsx internals read. The exact route wiring for the Heaps and Graphs topic pages was not verified. useProgressStore STAGES colour values were not read. The NAVBAR_HIDDEN_PATHS contents (whether the navbar shows on /map) were not read. Line numbers for the later parts of HomePage.jsx and WorldMap.jsx are approximate (±3).
====================================

=== CONTEXT GATHERING COMPLETE ===

ANSWER:
All paths below are relative to d:\PROJECTS\APPS\VANTAGE\reactapp. Line numbers marked "~" come from offset reads and may be off by 1–3 lines. Everything else was grep-confirmed.

## Key findings

- **Hero videos and music are dead assets.** hero-1..4.mp4 (8.4 / 6.5 / 4.1 / 8.8 MB) and music_main.mp3 (1.15 MB) are never referenced. The only mention is `src/config/assets.js:19-22` (`VIDEOS.hero = "videos/hero-1.mp4"`), and `VIDEOS` is never imported. There is no `<video>` or `new Audio`, and no music toggle. Because they sit in /public they cost nothing at runtime, only repo and deploy weight.
- **The home page covers only 3 of your 5 showcase items.** It has no world-map section, no judge/code-flow section, and no light theme (`#09090b` is hardcoded on every section).
- **Most of the map's light theme is already written.** `WorldMap.css` has full `.light .skill-tree-wrapper` country-state rules. It is blocked by the App.jsx/index.css dark lock and by about 100 inline dark styles in WorldMap.jsx.

## A1. Home page outline (render order `HomePage.jsx` ~L1184-1193)

| # | Section (component, lines) | Copy (verbatim) | Layout / visual | Approx. height | CTAs → target |
|---|---|---|---|---|---|
| 0 | `Cursor` L41-101 | – | Fixed dot and ring, `mixBlendMode:difference`. Runs its own endless rAF plus a `MutationObserver(document.body, subtree)` L81-83. `cursor:none` on `<main>` | – | – |
| 1 | `Hero` L293-390 | Eyebrow "Competitive DSA Platform - Est. 2026". Headline "VISUALIZE / PRACTICE. / DOMINATE." (DOMINATE in #EDFF66). Body "The platform that combines live algorithm visualization, an online judge, and real-time 1v1 battles - for developers who actually want to win." Stats "50+ Algorithms / 150+ Problems / 1v1 Live Battles / 8 Streaks" L356. Canvas labels "Live Race", "Same input - sorting race", "O(n�) vs O(n log n)" L377. Ticker L380-387 "50+ Algorithm Visualizations · 150+ Curated Problems · Real-time 1v1 Battles · ELO Ranked System · C++ & Java Support · Daily Streak Rewards" | 2-column grid. Left: text. Right: `RaceCanvas` (bubble #f87171 vs quick #EDFF66, IO-paused L160-167). Noise SVG and diagonal-line SVG. Ticker uses an infinite CSS animation | 100vh | "Start for free" → /problems. "Challenge someone" → /battle (L353-354) |
| 2 | `VizShowcase` L392-497 | "- Visualization First". "Watch algorithms / think in real time." Body "Every algorithm on Vantage runs as a live animation. Not a GIF. Not a diagram. A live execution you can pause, scrub, and study." Button "Explore all 50+ algorithms". Footer row "Floyd-Warshall, Bellman-Ford, AVL Tree, Heaps, Tries, DP, Kruskal's" + "+43 more ?" | 4-column grid of 20 cards (CARDS L410-431), 5 rows. Each card has a 220px canvas, a rainbow per-card colour, and a complexity badge. The comment says "3-row grid of 4 cols = 12 cards" (stale) | ~1,800px | "Explore all 50+" → **/sorting** (L458), not /visualizers |
| 3 | `Features` L499-560 | "- Platform Features". "One platform. / Every tool." "From your first array traversal to dynamic programming - Vantage accelerates your DSA growth at every level." FEAT_CARDS L500-507: Online Judge ("150+ problems"), 1v1 Battle Arena, World Conquest ("Every country = a problem"), Ranks & Achievements, Group Battles ("3�8 player"), Learning Paths | Horizontal scroll tape of six 272px cards, radius 16, per-card accent | ~520px | None. Cards show ArrowUpRight but have no onClick |
| 4 | `BattleSection` ~L700-975 (section L796) | "Battle Arena". "Think you're / fast? Prove it." (GlitchText). "Real-time 1v1 coding duels with ELO ranking. First to submit a passing solution wins. No hints. No mercy. Pure algorithmic speed." Chips "Ranked / Casual / Group 3�8". Fake matchmaking: "You ? 1247 ELO", names maverick/rogue/fushiguro/topg, "Two Sum · Easy", tags "Avg wait: 8s / Global matchmaking / ELO �150 range" | Card with radius 20. Left: copy. Right: `MatchSearchRadar` canvas (~L561-690) plus a GSAP infinite VS pulse | ~700px | "Enter Arena" and "Casual" → /battle. "Find an Opponent" runs a local fake. "Start Battle" → /battle |
| 5 | `ExtensionInstallGuide` L1014-1090 (`id="extension-setup"`) | "- Browser Extension Setup". "Install the Vantage / LeetCode Sync extension." Steps 01 Download / 02 Extract / 03 Load in Chrome / 04 Sync LeetCode | Full #EDFF66 slab, radius 18 (L1017). "EXTENSION" watermark | ~560px | "Download extension zip" → GitHub release zip (L25) |
| 6 | `HowItWorks` ~L975-1012 | "- The Loop". "How Vantage works". 01 Learn visually / 02 Practice hard / 03 Battle opponents / 04 Conquer the world | 4 columns, icon tiles radius 8 | ~450px | None |
| 7 | `FinalCTA` L1094-1122 | "- Start today. Free forever." "Your DSA journey starts here." "No credit card. No fluff. Just a platform built for coders who want to get dangerously good at algorithms." | Second #EDFF66 slab, radius 18 (L1103) | ~560px | "Start for free" → /problems. "Jump into a battle" → /battle |
| 8 | `Footer` ~L1127-1170 | "Master DSA through visualization, practice, and competition." "� 2026 Vantage." "Built for developers who want to win." | Links: Visualizer → /sorting, Problems, Battle, Map, Dashboard, Leaderboard, Achievements, Store | ~350px | – |

## A2. Designer judgment

**10-second test.** It half-passes. "VISUALIZE. PRACTICE. DOMINATE." plus a sorting race says "algorithm tool". The body copy names only visualization, judge and battles. The map and extension are invisible above the fold. "Est. 2026" and "8 Streaks" are filler ("8" means nothing).

**Redundancy.**
- Features (3) and HowItWorks (6) repeat the same four pillars (judge, battle, map, learn).
- The ticker repeats the stats row.
- Two back-to-back full-yellow slabs (5 and 7) dilute the accent.
- The "more" row lists Floyd-Warshall and Kruskal's, which are already cards 04 and 11.

**Inconsistent claims.**
- `src/search/catalog.js` has 136 `subpage:` entries. The page says "50+" (L356, L382, L461), "150+" problems (L356, L382, L501) and "+43 more" (L492).
- Features claims "Every country = a problem", but the map has placeholder countries (`country-placeholder`).
- The matchmaking tags ("Avg wait: 8s", "ELO ±150") are invented.

**Encoding corruption (visible on screen).** Mojibake appears at: L377 "O(n�)", the L382 ticker separator "�", L419 "O(V�)", L420 "Left ? Root ? Right", L431 "O(8^(N�))", L435 "O(n�)", L505 and the battle chips "3�8", "? 1247 ELO" / "? 1198 ELO", "Searching�" and "Matching�", "ELO �150", L492 "+43 more ?", and the footer "� 2026". This is the single most damaging first-impression bug.

**Tone.** "No coddling", "destroy them publicly", "No mercy", "dangerously good", "Document your dominance globally" all push into edgelord territory. Trim it for an interview.

**Performance.**
- There are **22 simultaneous canvases**: RaceCanvas, 20 VizShowcase cards and MatchSearchRadar. The Cursor rAF runs on top of that.
- IO/visibility pausing exists in `AlgoCanvas` (HomePageAnimations L425-431), `MergeSortCanvas` (L2568), all four Complex canvases, `MidAnimatonsCanvas` (A*, Mid L431-436) and RaceCanvas.
- **Missing pausing:**
  - `UnionFindCanvas` (Mid L599), `KmpCanvas` (L710), `PalindromeCanvas` (L975) and `SegmentTreeCanvas` (L837). Their loops start at L626/740/1004/877 with no IO check, so three home cards animate offscreen forever.
  - `MatchSearchRadar` (~L561-690): no IO, no visibility check, uncapped DPR, and it runs while idle.
  - The `Cursor` rAF runs forever.
- Reduced motion is detected in every `getCanvasPerfProfile` but only lowers DPR and glow. Nothing stops. GSAP timelines, the ticker, `blink` and the GlitchText intervals ignore it too.
- The GlitchText cleanup clears only the timeout, not the `setInterval`, so it leaks on unmount.

## A3. Canvas modules

**Colour helpers**
- `HomePageAnimations.jsx`: `hexToRgb` ~L18-23 and `rgba(hex,a)` L24-28.
- `ComplexAnimations.jsx`: `rgba` L5-12.
- `MidAnimations.jsx`: `rgba` L4-10.
- All three parse `#rrggbb` only.
- HomePageAnimations has 29 hex literals, 60 `rgba(255,255,255,…)` literals and **0** uses of EDFF66. Only RaceCanvas and MatchSearchRadar (in HomePage.jsx) use the accent.

| Export | Draws | Palette | Pauses offscreen? | Reduced motion? |
|---|---|---|---|---|
| `AlgoCanvas` (HPA L406, configs `ALGO_CONFIGS` L176-~400) | BFS, DFS, Dijkstra, Floyd-Warshall, Inorder BST, Sliding Window, Binary Search, Two Pointers, Kadane, Kruskal, Heap Sort (one unified renderer, ~2,100 lines) | Per-algo rainbow (#60a5fa, #c4b5fd, #fb923c, #f43f5e, #34d399, #22d3ee, #e879f9, #38bdf8, #a78bfa, #2dd4bf, #f97316) plus white alphas | Yes (IO + visibility) | DPR/glow only |
| `MergeSortCanvas` (HPA L2547) | Merge sort bars | Hardcoded; no props | Yes | DPR only |
| `NQueensCanvas` L252, `SudokuCanvas` L539, `SnakesLaddersCanvas` L858, `KnightsTourCanvas` L1133 (Complex); router `ComplexAlgoCanvas` L1375 | Boards and backtracking | #f59e0b, #22d3ee, #f43f5e, #8b5cf6 (`COMPLEX_ALGO_CONFIGS` L25) | Yes | DPR only |
| `MidAnimatonsCanvas` (A*) Mid L410 | Grid pathfinding | #60a5fa | Yes | DPR only |
| `UnionFindCanvas` L599, `KmpCanvas` L710, `SegmentTreeCanvas` L837, `PalindromeCanvas` L975; router `MidAnimatonsAlgoCanvas` L1095 | DSU forest, LPS table, segment tree, expand-around-center | #34d399, #f59e0b, #a78bfa, #a78bfa | **No** | DPR only |
| `RaceCanvas` (HomePage L106) | Bubble vs quick | #f87171 / **#EDFF66** / white | Yes | DPR only |
| `MatchSearchRadar` (HomePage ~L561) | Radar sweep | **#EDFF66** only | **No** | No |

**Theme-switch approach**
1. Add a shared `canvasTheme.js` that reads `getComputedStyle(document.documentElement)` for `--fg-rgb`, `--bg-rgb` and `--accent-rgb` (store them as "r,g,b" tokens).
2. Cache the values and refresh them from a `MutationObserver` on `<html>` `class`.
3. Change the helpers to `rgba(tokenOrHex, a)`.
4. Globally replace `"rgba(255,255,255,"` with `` `rgba(${T.fg},` ``.
5. Map the `color` props to `var(--accent)` or keep one secondary colour.
6. Read the theme inside the loop, not once in `useEffect`, so a theme toggle applies without a remount.

**Effort estimates**
- HomePageAnimations (2,800 lines, 60+ literals): 4–6h.
- Complex (1,400 lines): 2–3h.
- Mid (1,100 lines): ~2h, plus 30 min to add IO to its 4 loops.
- RaceCanvas and Radar: ~1h.

## A4. Recommended home structure (~5 screens)

1. **Hero (100vh).** Terminal prompt eyebrow `> vantage --dsa`. Headline VISUALIZE / PRACTICE / DOMINATE. One line naming all five pillars. Keep RaceCanvas, with zero radius and a 1px border. CTAs: "Open visualizers" → /visualizers and "Solve a problem" → /problems. Replace the stats with real numbers derived from `catalog.length`.
2. **Visualizers.** Cut to 8 cards (2 rows), use a single accent, and add "Browse all 136 →" /visualizers.
3. **Judge + code-flow (new).** A static editor frame showing submit → verdict → code-flow trace. Its CTA opens one demo problem.
4. **Battles.** Keep, trimmed. Pause the radar with IO.
5. **World map (new).** Render `world.svg` read-only with a few classed countries and link to /map.
6. **Extension.** Convert the yellow slab to a bordered terminal block (`$ chrome://extensions → Load unpacked`).
7. **Final CTA (the only yellow slab)** and a footer.

Cut: Features tape, HowItWorks, ticker, the "+43 more" row, the fake ELO numbers, and the custom cursor (it breaks trackpad and screen-share demos and is an accessibility problem).

## B. Topics hub and topic page

**`TopicsPage.jsx`**
- Uses `bg-background`, which is theme-aware. The hero is inline dark: "Explore / Topics." with Topics in **#34d399**, not the accent (L~236-240).
- Stats card: radius 16, green→yellow gradient, a meaningless "Rate" metric (configured topics ÷ topics).
- Search box: `rounded-2xl`, `bg-[#0d0d10]`, `text-white` (L36-47).
- Background: two full-viewport fixed `ComplexAlgoCanvas` (nqueens, knightstour) at opacity .15 (L~169-210).
- Grid: `TopicPixelCard` for each topic.

**`TopicPixelCard.jsx`**
- `rounded-xl`, hover border **#5542FF**, an off-brand purple (L66).
- PixelCard canvas colours come from `spotlightColor` (L32-35).
- Icon tile, count pill, divider and arrow are all tinted with `spotlightColor`.
- Difficulty uses Tailwind emerald/amber/red with `dark:` variants (L11-27), so it is already dual-theme.
- `data/topics.js` gives 21 topics 21 different spotlight hexes (L66-257), e.g. Sorting #f97316, Arrays #3b82f6, Heaps #ea580c, Graphs #0ea5e9.
- To fix: drop per-topic colour (or keep it as a 2px left bar only), make PixelCard colours `var(--accent)` at 3 alphas, and use radius 0 with a 1px `var(--border)` and accent on hover.

**`TopicPage.jsx`**
- Hardcoded `background:"#09090b"` (~L461), white title, purple ambient `rgba(85,66,255,0.06)` (~L487).
- Eyebrow pill radius 999, stats card radius 18.
- `DIFF` config L26-44 uses gradient bars.
- `BgCanvas` L51 with uncapped DPR.
- Empty state (~L620-650): "No problems yet / Problems for this topic will appear here."

**Heaps and Graphs.** Neither is empty. `catalog.js` has 3 Heaps entries (L1547 Heapify, L1569 TopKFrequent, L1591 TaskScheduler, which has a Portuguese comment at L1593) and exactly 1 Graphs entry (L3392 "Max Flow (Edmonds–Karp, Dinic)"). So the Heaps page shows 3 cards and the Graphs page shows 1, with a 60–80vh hero above them. They look nearly empty, but the empty-state branch never shows. I did not verify which route components pass `topicKey="Heaps"` / `"Graphs"`.

## C. World map

**How it's drawn**
- `world.svg` is imported through SVGR (`ReactComponent as Map`, WorldMap.jsx L11) and rendered inside react-zoom-pan-pinch `TransformWrapper` (L369-398, scale 0.5–10).
- The position marker is a second overlay `<svg>` (L386-395) with fill #EDFF66, **stroke #3d2fff** (blue-purple) and a pulse ring.
- The SVG root hardcodes `fill="#ececec" stroke="black" stroke-width=".2"` (world.svg line 30). No path has its own fill attribute, so CSS class rules win. **No one-time transform is required.** Optionally strip the root fill/stroke so unmapped paths never flash light-grey before `applyCountryStyles` runs.

**How colour is applied**
- `applyCountryStyles` (L201-221) mutates classList to `country-{completed|current|available|locked|placeholder}`.
- It also sets `--topic-color` inline from `STAGES[stage].color` (fallback #6366f1).
- The fills and strokes live in `WorldMap.css`:
  - Dark rules at ~L130-190: placeholder and locked `#27272a` / `#3f3f46`, completed `var(--topic-color)` with stroke `#09090b`, current `var(--wm-yellow)` with stroke `var(--wm-purple)` and a purple drop-shadow, available `#d4d4d8`.
  - **Light rules already exist** at ~L195-250.
  - `--wm-grid` has a light override, but the grid overlay is inline `rgba(255,255,255,0.03)` (L361) and never uses the variable.

**What blocks light mode**
- `App.jsx` L60-62 (`MAP_DARK_LOCK_PATHS`) and L191-198 toggle `body.vantage-map-page` and exclude the zinc scope.
- `index.css` ~L1679-1713 then forces `.text-white` and the `bg-zinc-*` / `border-zinc-*` classes dark.
- Inline dark styles in WorldMap.jsx; the grep for colours capped at 100 matches:
  - wrapper `#07070a` L350
  - noise and grid L354-367
  - sidebar L403, dividers L417/L435
  - HUD L477-563
  - quality tip ~L568-625
  - stages modal ~L632-690
  - popup ~L697-800
  - tooltip ~L806-813
- `WorldMap.css` `.wm-sidebar-btn*` uses white rgba (~L42-90), plus the lavender `--accent` / `--active` variants and `.wm-hud-dot`.

**Off-brand purple and other colour issues**
- HUD arc gradient #7c3aed→#EDFF66 (~L512-516) and the XP bar (~L527).
- "Visualize" button `linear-gradient(135deg,#7c3aed,#a78bfa)` (~L768).
- Current-country stroke `--wm-purple`, marker stroke #3d2fff.
- `STATUS_CFG.available` #c4b5fd (L36), lavender completed-stage tiles in the modal.
- "Solve It" uses a yellow gradient `#c7d93f→#EDFF66`.

**UX issues**
- **No legend.** `STATUS_CFG` (L34-39) defines four states that are never shown as a key. The HUD lists only `STAGE_ORDER.slice(0,4)` (L341).
- **No selected-country state.** It zooms and shows a popup but no path class.
- **Tooltip only on click.** No hover tooltip. Each tooltip uses an uncleared 2s `setTimeout` (L299-306), so timers stack.
- **The quality tip promotes a perf toggle.** It says "Click the HD/SD button…" and the HD/SD button is the loudest control (solid #EDFF66, L463). Better: auto-pick the quality and delete the tip.
- **"Content coming soon" dead end** (~L774) appears when a problem has no judgeId, lcSlug or visualizer. Hide such problems or remap them.
- **The popup-follow rAF (L240-263) never stops** while a country is selected.
- **Mobile:** a 60px sidebar, a 220px HUD and a 320px popup overlap on narrow screens. Buttons shrink to 30px (CSS ~L300), below the 44px touch target.
- **Radii everywhere:** `rounded-2xl`/`xl`/`full`, 10px buttons, 14px tip.

## D. Global chrome

- **Navbar** (`components/layout/Navbar.jsx` L479-497). `floated = !allowTransparency || scrolled`, and only "/" allows transparency (App.jsx L40-42). At the top of the home page it is transparent with radius 0. Everywhere else it is a floating pill: `rgba(9,9,11,0.82)`, blur, radius 12. That is hardcoded dark, so it is not dual-theme. Inner buttons use radius 8, and the active indicator is a glowing circle dot (L98).
- **Scroll-to-top** (App.jsx ~L355-380): 40px circle (`50%`), dark glass, z-index 9999. It sits at the same layer as the home cursor.
- **Battle overlay** (App.jsx L294-360): bottom-centre, radius 14, dark glass, red/amber glowing dot, yellow button radius 10. It shows on the home page for any logged-in user with an active battle and polls every 15s (L205-210). It could pop up mid-demo.
- **Toasts:** a custom `AppToast` in Navbar L689-698, `rounded-xl`, `bg-[#0c0c0f]/95`, yellow border and glow. Hardcoded dark. No toast library.
- **Suspense fallback** (App.jsx ~L267): plain "Loading..." in #888.

## Top 25 fixes (priority order)

1. **HomePage.jsx L377, L382, L419-435, L492, L505, battle ~L850-965, footer ~L1165:** fix the mojibake. Use ² · → ± … © or ASCII, and save as UTF-8.
2. **L356, L382, L461, L492, L501:** derive counts from `catalog.length` (136), or say "130+". Remove "8 Streaks" and "Est. 2026".
3. **L458 and footer:** point visualizer CTAs to /visualizers instead of /sorting.
4. **HomePage ~L1185-1193:** reorder per A4. Delete `Features` and `HowItWorks`, add Judge and Map sections.
5. **HomePage L41-101 and L1184 `cursor:none`:** remove the custom cursor, or restrict it to the hero and honour `(pointer:fine)` and reduced motion.
6. **MidAnimations L599/710/837/975:** add the IO and visibility guard used at L431-436.
7. **HomePage `MatchSearchRadar` ~L561-690:** add IO, cap DPR, and render only when `active` or in view.
8. **HomePage L410-431:** cut to 8 cards to go from 20 canvases to 8.
9. **All `getCanvasPerfProfile` and GSAP:** when reduced motion is on, draw one static frame and skip the timelines, ticker and GlitchText.
10. **All radii** (buttons 10/11, cards 16/18/20, L1017, L1103, battle card, badges 6/8): set them to 0. Use square status dots.
11. **HomePage, every section `background:"#09090b"` plus `#fff` and white-rgba text:** replace with `var(--bg)`, `var(--fg)` and `color-mix`/alpha tokens.
12. **Canvas helpers (HPA ~L18-28, Complex L5, Mid L4):** make them token-aware. Replace 60+ white literals with `T.fg` and map config colours to the accent.
13. **Per-card rainbow (VizShowcase CARDS, FEAT_CARDS, HowItWorks steps):** use a single accent, with neutral fg for tags.
14. **ExtensionInstallGuide L1014-1090:** make it a bordered terminal block so FinalCTA is the only yellow slab.
15. **BattleSection:** remove the fake ELO and "Avg wait: 8s", or label them "demo". Replace the red gradient "Start Battle" with an accent button.
16. **App.jsx L60-62, L191-198 and index.css ~L1679-1713:** remove the map dark lock (see checklist).
17. **WorldMap.jsx purple:** HUD arc and XP bar (~L512-527), Visualize button (~L768), marker stroke #3d2fff (L392), `--wm-purple`, lavender `STATUS_CFG.available` (L36). Move all to accent/fg tokens.
18. **WorldMap.jsx L463 and the quality tip ~L568-625:** demote HD/SD to a neutral button and delete the tip, or auto-select quality.
19. **WorldMap:** add a 4-state legend using `STATUS_CFG`, and a `.country-selected` class that `applyCountryStyles` applies.
20. **WorldMap ~L774:** replace "Content coming soon" with hidden or unmapped handling. Clear the tooltip timers (L299-306) and stop the popup rAF when it has settled (L240-263).
21. **TopicsPage L~236-262:** use accent instead of #34d399, remove "Rate", zero the radii, and remove the two fixed full-viewport background canvases (L~169-210) or make them static.
22. **TopicPixelCard L66 and L32-35, `data/topics.js` spotlightColor:** single accent, remove the #5542FF hover, `rounded-none`.
23. **TopicPage (~L461 bg, ~L487 ambient purple, pills radius 999/18, `DIFF` L26-44):** use tokens and flat difficulty colours without gradients. Give the sparse Heaps (3) and Graphs (1) pages a compact hero, or populate `catalog.js`.
24. **Navbar L489-497, L98:** use `var(--bg)`/`var(--border)` with radius 0 and a square active marker. The toasts at L690/L695 get the same token treatment and `rounded-none`.
25. **App.jsx battle overlay L294-360 and scroll-to-top ~L355:** zero radius and tokens. Consider hiding the overlay on "/".

## Map dual-theme checklist

1. **App.jsx L60-62 and L191-198:** stop adding `vantage-map-page`. Add `/map` to `ZINC_LIGHT_SCOPE_PATHS`, or leave it unscoped and rely on tokens.
2. **index.css ~L1679-1713:** delete the "MAP DARK LOCK" block.
3. **world.svg line 30:** optionally remove the root `fill="#ececec" stroke="black"`, or set `fill="currentColor"`. No per-path transform is needed.
4. **WorldMap.css:** define tokens on `.skill-tree-wrapper` (`--wm-bg`, `--wm-panel`, `--wm-border`, `--wm-fg`, `--wm-fg-muted`, `--wm-land`, `--wm-land-stroke`, `--wm-locked`, `--wm-available`, `--wm-current-fill`, `--wm-current-stroke`, `--wm-accent`). Give each a `.light` override. Rewrite the dark and light country rules to use them. Note that yellow `current` needs a dark stroke (#09090b) in light mode and no purple drop-shadow.
5. **WorldMap.css `.wm-sidebar-btn*` and `.wm-hud-dot`:** replace white rgba and lavender with tokens. Radius 0. Keep a 44px minimum touch target.
6. **WorldMap.jsx L350:** wrapper `background: var(--wm-bg)`.
7. **L354-367:** noise opacity via a token. Change the grid gradient to `var(--wm-grid)`.
8. **L391-392:** marker `fill="var(--wm-accent)"` and `stroke="var(--wm-fg)"`. Use CSS classes, since SVGR/JSX attributes can't take `var()` reliably.
9. **L403-468 sidebar:** panel background, borders, dividers and the HD button all move to tokens.
10. **L471-563 HUD:** panel, text-white, arc track and gradient, XP bar and stage bars move to tokens, with a flat accent fill.
11. **Quality tip ~L568-625:** remove it, or convert it to tokens.
12. **Stages modal ~L632-690:** backdrop, panel, tiles and lavender completed-state tokens.
13. **Country popup ~L697-800:** panel, chips, "Solve It" (flat accent), LeetCode, "Visualize" (outline accent instead of purple), "coming soon", "conquered", and the story `text-zinc-*`.
14. **Tooltip ~L806-813:** tokens and radius 0.
15. **`STATUS_CFG` L34-39:** replace the hex values with `var(--wm-…)` strings, and render them as a legend.
16. **`--topic-color` (L217):** keep it for completed fills, or collapse to one accent. Check light-mode contrast for the stage colours.
17. **Test:** toggle the theme with the map open. All state is CSS-driven, so no repaint through `applyCountryStyles` is needed.

RELEVANT FILES (ranked by importance):
  1. src/pages/home/HomePage.jsx — The whole home page: section order, copy, CTAs, the inline dark-only styles and radii, mojibake, and the RaceCanvas, MatchSearchRadar and Cursor rAF loops
  2. src/map/WorldMap.jsx — Map rendering (SVGR + react-zoom-pan-pinch), class painter, about 100 inline dark and purple styles, quality tip, popup and "Content coming soon"
  3. src/map/WorldMap.css — Country state fills and strokes; the light-theme rules already exist; sidebar button system to tokenize
  4. src/App.jsx — MAP_DARK_LOCK_PATHS body-class toggle, transparent-navbar path list, battle overlay and scroll-to-top chrome
  5. src/pages/topics/TopicPixelCard.jsx — Topic card design: spotlight-colour pixel canvas, off-brand #5542FF hover, rounded-xl, difficulty colour coding

NOTE: Line ranges have been extended by ~50 lines to provide additional surrounding context.