<!-- Recovered from crashed Kiro session sess_35b51775, sub-agent output at 2026-09-30T07:48:54.172Z. -->
# Deep code-level design-quality probe of all non-visualizer app pages to find amateur patterns and inventory UI primitives for a unified redesign.

## Prompt given to the probe

Project: d:\PROJECTS\APPS\VANTAGE\reactapp (React 19, Tailwind 3, shadcn/ui, lots of inline styles). The owner is polishing this for a portfolio/interview demo. UI consistency is the top priority; the design is "amateur in many places". Target identity: terminal-brutalist, STRICT ZERO border radius, bg #09090b / acid-yellow #EDFF66 accent, Monument Extended display + JetBrains Mono, and a full dark + light theme everywhere (including the world map). I already know: tokens are scattered, ~every page hardcodes hex/rgba, fonts are chaotic (Inter/Syne/Monument), CustomCursor per page, an !important light-mode remap hack in index.css. Do NOT re-report those. I need a DESIGN-QUALITY inventory that a redesigning agent can act on. Read-only; do not modify files. Give file:line for claims.

Pages in scope: src/App.jsx overlays, src/components/layout/Navbar.jsx, src/pages/home/HomePage.jsx (+HomePage.css), src/components/problems/ProblemsTable.jsx + AlgoCards.jsx, src/pages/auth/AuthPage.jsx, src/pages/topics/* (TopicsPage, TopicPage, PixelCard, TopicPixelCard), src/pages/visualizer/VisualizerPage.jsx, src/pages/profile/ProfilePage.jsx, src/pages/leaderboard/LeaderboardPage.jsx, src/pages/store/StorePage.jsx, src/pages/inventory/InventoryPage.jsx, src/pages/achievements/AchievementsPage.jsx, src/pages/friends/* , src/pages/battle/*, src/pages/group/*, src/pages/judge/JudgePage.jsx + Judge.css + codeflow panel chrome, src/components/ui/*.

Produce:
1. Typography inventory: every distinct font-size value used (px/rem/clamp/Tailwind text-*) with counts, font-weights, letter-spacing values, text-transform usage. Identify how many distinct "heading" treatments exist for page titles (list each page's H1 treatment side by side: font, size, weight, case, tracking, color, any gradient/glitch effect). Propose a type scale (≤8 steps) that covers real usage.
2. Spacing & layout: distinct padding/margin/gap values (top 30 with counts), page container widths (max-width values per page), page top padding under the fixed navbar per page (does content collide with navbar?), grid systems used, breakpoints used (Tailwind sm/md/lg, @media in CSS, window.innerWidth checks, useMediaQuery). Which pages have NO responsive handling at all?
3. Component-pattern inventory: count distinct visual signatures for Buttons (primary/secondary/ghost/icon — list each distinct style object or className combo, file:line, grouped), Cards/panels, Inputs/selects, Tabs/segmented controls, Badges/pills/chips, Modals/dialogs/overlays, Tables/lists, Avatars, Progress bars, Toasts, Tooltips, Stat tiles. For each category: how many variants exist, which ones use shadcn ui/* vs hand-rolled, and a proposed single primitive (name + variants) to replace them.
4. States: for each page, what is shown while loading, on empty data, on API error, when logged out. Mark pages that show nothing / plain "Loading..." / raw error text / console-only errors. (The backend will often be offline in demos — list which pages would look broken with the API down.)
5. Amateur signals: gradients/glows/neon shadows, glassmorphism, emoji in UI copy, exclamation-heavy or inconsistent copy (Title Case vs UPPERCASE vs sentence case mixing in the same page), inconsistent icon sizes/stroke widths or mixed icon libraries within a page, misaligned/magic-number positioning (absolute top/left px), z-index values (list all distinct values), animation overuse (glitch text, tilt cards, infinite loops), hover effects that scale/translate, placeholder copy ("coming soon", "demo"), leftover debug UI, inconsistent capitalization of the brand ("Vantage"/"VANTAGE"/"AlgoVisualizer" etc — grep all brand spellings), favicon/title/meta in public/index.html and manifest.json.
6. Navigation/IA: Navbar items and their order, active-state styling, what happens on mobile (hamburger?), footer existence per page, back-navigation patterns, breadcrumb usage, how VisualizerPage chrome relates to Navbar (double headers?), routes where Navbar is hidden.
7. Final deliverable: a prioritized "amateur → professional" fix list (top 40), each with file:line, the problem, and the concrete target treatment under the terminal-brutalist zero-radius system. Also list any places where zero radius would harm usability and what exception you'd allow (e.g., avatars circles, graph nodes, focus rings, toggles), with reasoning.

## Findings

=== Context Gathering Summary ===
FOUND: Global counts for font sizes, weights, tracking, uppercase, padding, gap, margin, max-width, z-index, radius, media queries, Tailwind breakpoints, grid templates, icon libraries/sizes/strokes, gradients/glows/blur/infinite/scale/tilt/emoji per file; H1 treatments for 12 pages; container widths and navbar top clearance per page; loading/empty/error handling per page; Navbar structure (links, active state, mobile overlay, hidden paths, toasts, z-index); App.jsx overlays; ProtectedRoute; VisualizerPage double header; public/index.html (no manifest.json exists); brand spellings; demo/debug leftovers.
NOT FOUND: Exact HomePage hero headline (no &lt;h1&gt;; the hero is likely rendered in a canvas or another component). Profile page title element and its error rendering. Store/Inventory entry points in the IA. Whether the mobile overlay has an Escape key handler (none seen in the portion read). Rendered navbar height and 1024–1200px overlap are inferred from styles, not measured in a browser. FriendChallengeModal z-index. Group result error states. Line numbers marked "~" are approximate.
====================================

=== CONTEXT GATHERING COMPLETE ===

ANSWER:
SCOPE NOTE: I measured everything with regex counts across the in-scope folders (pages/home, auth, topics, visualizer, profile, leaderboard, store, inventory, achievements, friends, battle, group, judge incl. codeflow minus ds/ and tests, problems, components/ui, components/problems, components/layout, App.jsx). Counts are regex-derived, so treat them as ±5%. Line numbers marked "~" are approximate (I read the file but didn't pin the exact line). Things you already know about (scattered tokens, hardcoded hex, font chaos, CustomCursor, the index.css !important remap) are left out.

══════════ 1. TYPOGRAPHY ══════════
Font-size values in use: about 90 distinct ones.
- Inline fontSize (px): 9 ×147, 11 ×111, 12 ×84, 10 ×72, 13 ×41, 14 ×32, 8 ×27, 11.5 ×9, 16/18/20 ×8 each, 22 ×6, 12.5/15/17 ×5, 7/9.5/32 ×4, 26/30 ×3, 13.5/24 ×2, and 6, 8.5, 10.5, 19, 21, 25, 40, 48, 52 once each. There are also conditional sizes (compact?13:14, rank===1?21:16, col===2?24:19, Math.round(size*0.38)).
- Inline clamp(): 25+ unique clamps. Examples: clamp(2.2rem..) ×6, clamp(3.2rem..) ×4, clamp(2.4/2.8rem..) ×3, clamp(2.6/4.8/5/6rem..) ×2, plus 3.0, 3.4, 3.5, 4.5, 7rem, 1.1, 1.8, 2.0rem, 14px, 24px, 32px.
- Tailwind: text-sm 66, text-xs 53, text-[9px] 30, text-[10px] 23, text-[11px] 19, text-[12px] 18, text-[13px] 5, text-xl 4, text-3xl 4, text-2xl 3, text-base 3, text-lg 1, text-[15px] 1.
- CSS files: 11px ×6, 0.9rem ×5, 0.875rem ×4, 0.75rem/0.95rem ×3, 0.85rem ×2, 9px ×2, plus 0.7, 0.8, 1, 1.1rem, 12px, 13px and two clamps.
- Legibility: about 210 text instances are at or below 9px (inline 6–9px ≈180, plus text-[9px] ×30). Navbar goes as low as 7.5px (Ticker canvas) and 8px (mobile stat labels). That's the biggest amateur signal in the type.

Font weights:
- Inline: 900 ×282, 700 ×129, 800 ×49, 600 ×16, 500 ×8, 400 ×1.
- Tailwind: font-black 49, font-bold 49, font-medium 24, font-semibold 12.
- CSS: 400–900 all present.
- 900 is the default everywhere, including body copy and buttons, so hierarchy collapses.

Letter-spacing: about 45 distinct values, from -0.04em to +0.3em. Duplicates are written differently (".2em" ×8 vs "0.2em" ×27, ".1em" vs "0.1em"). Per-page constants add more: BATTLE_FONT_LETTER_SPACING ×29, HOME_TYPO.letterSpacing.* ×17, MLS.displayWide, NAV_TYPO.* and T.letterSpacing?.monument||"0.03em". Tailwind adds tracking-widest 18, tracking-[0.2em] 16, tracking-tight 7, tracking-[0.24em], tracking-[0.4em] and tracking-wider.

Text-transform: textTransform:"uppercase" appears 219× inline, and about 39 more as Tailwind `uppercase`. Uppercase is used for eyebrows, buttons and labels. Titles are mostly mixed case, except TopicPage's.

PAGE-TITLE (H1) TREATMENTS — 11+ distinct:
- AuthPage.jsx:413 — Monument (T.fontFamily), 900, clamp(2.2rem,3.8vw,3.2rem), tracking -0.025em, line-height .88, #fff, mixed case.
- TopicsPage.jsx:247 — BATTLE_HEADER_FONT_FAMILY, 900, clamp(2.6rem,5vw,4.8rem), -0.02em, .9.
- TopicPage.jsx:561-570 — Monument, 900, clamp(3rem,8vw,6.5rem), -.035em, UPPERCASE, #fff plus a yellow "." block.
- AlgoCards.jsx:536-541 — var(--font-heading), 700, clamp(32px,4.5vw,54px), -.025em, line-height 1.1, var(--foreground), Title Case "Explore Topics". This is the only token/theme-aware H1.
- ProblemsTable.jsx:821-830 — Monument, 900, clamp(2.8rem,5vw,4.8rem), -0.02em, two lines: white title plus yellow "Arena."
- LeaderboardPage.jsx:658-667 — MF, 900, clamp(3.2rem,5.5vw,5.2rem), ML.monument, #fff, textShadow 0 0 80px glow, animated `title-word`, whiteSpace:nowrap (overflows on narrow screens).
- AchievementsPage.jsx:583 and :588 — TWO <h1> elements (a semantic bug). Monument, 900, clamp(3.2rem,7vw,6.2rem), -0.025em; the second line is rgba(255,255,255,.18). GSAP starts both at opacity 0.
- FriendsPage.jsx:586 — Monument, 900, clamp(2.6rem,5vw,4.8rem), -0.02em, starts at opacity 0.
- BattleLobbyPage.jsx:849-856 — BATTLE_FONT_FAMILY, 900, clamp(2.8rem,5vw,4.8rem), "Battle" white plus "Arena." in RED #f87171. This reuses the "Arena." gimmick from Problems in a different colour. There's a second <h1> at BattleLobbyPage.jsx:315 (the wait screen).
- StorePage.jsx:121-122 — Tailwind text-3xl font-black tracking-tight, with a "Vantage" eyebrow at 10px/0.2em.
- InventoryPage.jsx:66 — text-xl font-semibold with an inline icon. The smallest and plainest title.
- GroupLobbyPage.jsx:197 — .battle-monument text-3xl font-black tracking-tight plus an icon.
- No <h1> at all: HomePage (only h2s at 442, 525, 836/841 with GlitchText, 991, 1027, 1108, plus giant watermark divs at 1018/1104/1154), Profile (canvas hero, 553-570), BattleResult, GroupResult, Judge.

PROPOSED TYPE SCALE (8 steps, covers real usage):
- display: Monument 900, clamp(3rem,6vw,5.5rem), line-height .9, -0.02em, UPPERCASE. Home hero and section heroes only.
- h1: Monument 900, clamp(2.25rem,4vw,3.5rem), -0.02em, UPPERCASE. Every page title, one per page.
- h2: Monument 900, 24px, -0.01em, UPPERCASE.
- h3/title: JetBrains Mono 700, 16px, 0.
- body: Mono 400, 14px, line-height 1.6.
- small: Mono 400, 12px.
- label/eyebrow: Mono 700, 11px, 0.12em, UPPERCASE.
- micro: Mono 500, 10px, 0.08em. This is the floor; ban anything under 10px.

Weights allowed: 400/500/700 for Mono and 900 for Monument only. Tracking allowed: -0.02em, 0, 0.08em, 0.12em.

══════════ 2. SPACING & LAYOUT ══════════
Top values:
- gap: 8 ×69, 6 ×50, 5 ×49, 10 ×45, 14 ×28, 4 ×25, 12 ×22, 7 ×19, 0 ×16, 16 ×13, 3 ×13, 2 ×10, 24 ×9, 20 ×5, 22 ×4, 9 ×3, 48 ×3.
- margin*: 0 ×37, 8 ×24, 4 ×22, 2 ×20, 6 ×19, 14 ×19, 12 ×17, 16 ×15, 3 ×14, "0 auto" ×13, 20 ×12, 10 ×11, 5/24 ×8, 28/18 ×6, 36/22/7 ×5.
- padding: "0 12px" ×17, "8px 12px" ×14, "4px 10px" ×11, "0 10px"/"12px 14px"/"0 14px" ×10, "3px 8px" ×8, "3px 9px" ×6, "8px 14px"/"12px 0"/"10px 0"/"0 8px" ×5, "10px 16px 14px"/"12px 16px"/"80px clamp(24px…"/"32px 0"/"16px 18px"/"0 22px"/"2px 7px"/"1px 6px" ×4.
- Tailwind: gap-2 45, gap-3 32, px-3 30, gap-1.5 25, py-2 20, py-1.5 17, px-4 16, px-2 16, gap-1 14, p-5 11, space-y-3 11.
- Off-grid values (3, 5, 7, 9, 11, 13, 14, 22) make up about 35% of gaps. Proposed scale: 4/8/12/16/24/32/48/64.

Page container widths (8 distinct):
- Home: 1120 (HomePage.jsx:988, 1016)
- TopicPage: 1080 (:500)
- Profile: 1280 (:546)
- Leaderboard: 1300 (:626)
- Store: max-w-5xl = 1024 (:109)
- Inventory: 1024 (:58)
- Achievements: 1080 (:570, 649)
- Friends: 1080 (:575, 631)
- BattleLobby: 1200 (:820)
- BattleResult: 1100 (:375)
- GroupLobby and GroupResult: max-w-3xl = 768 (:190, :104)
- ProblemsTable: 1080 (:789)
- AlgoCards: 1200 (:514)
- TopicsPage search box: max-w-5xl (:36)
- Recommendation: one 1200 shell with a 768 narrow variant for forms and lobbies.

Clearance under the fixed navbar: the Navbar header sets height:44 and padding "30px 16px" (Navbar.jsx ~486). With border-box (Tailwind preflight) it renders at about 62px, sitting below an 8px top offset, so its bottom edge is at roughly 70px.
- Pages that use paddingTop 56: Profile:529, Leaderboard:619, Achievements:557, Friends:564, BattleLobby:796, BattleResult:364, ProblemsTable:699, TopicPage:466. That's about 14px less than the bar needs.
- Most of these hide the shortfall with inner padding: Profile +72 (553), Achievements +44 (570), Friends +40 (575), BattleLobby +40 (825), Problems +40 (789).
- BattleResult (364→375), Leaderboard and TopicPage have no visible compensation and are collision risks. Verify in the browser.
- Tailwind pages use pt-24 (96px): Store:108, GroupLobby:188, GroupResult:102. Inventory:57 and TopicsPage:177 use pt-24 md:pt-28. AlgoCards uses 100px (:514).
- The visualizer shell sets padding-top 5rem / 6.5rem (HomePage.css:432-441). Its comments ("h-16 + top-2") describe an older navbar, so they're stale.
- The result is 5 different top offsets. Fix with a --nav-h token and one <PageShell> wrapper.

Grids: hand-typed gridTemplateColumns throughout — "repeat(3,1fr)" with gaps 7/8/14, "1fr 1fr" with gaps 7/8/10/14/20, "1fr auto" with gaps 30/32, "1fr 320px" (Friends:631), "1fr 60px 1fr", "repeat(4,1fr)", and one auto-fill minmax(240px). Tailwind grid-cols only appears in about 10 places.

Breakpoints: 13 distinct CSS values — 560, 640 (×4), 700, 720, 768 (×2, plus min-768), 820 (×2), 860, 900 (×2), 980, 1024 (min, Navbar), 1100. Tailwind prefixes: sm: 26, md: 10, lg: 3, xl: 0. matchMedia appears 3× (HomePage, PixelCard, JudgePage). There are no innerWidth checks and no useMediaQuery.

NO responsive handling at all (0 media queries, 0 sm/md/lg classes, 0 matchMedia):
- AuthPage
- ProfilePage (865 lines)
- BattleLobbyPage (1174 lines)
- BattleArenaPage
- BattleResultPage
- FriendChallengeModal
- TopicPixelCard
- VisualizerPage.jsx itself
- every codeflow panel (CodeFlowPanel, DryRunPanel, FlowControlBar, InputRibbon, VariablesPanel, FlowBlock)
- GroupResultPage has only 1 token.

Leaderboard (1 media query) and Friends (1) are close to none.

══════════ 3. COMPONENT PATTERNS ══════════
shadcn ui/* usage is almost nil:
- button: only VisualizerDrawer
- card: only Inventory
- input: only TopicsPage
- badge: TopicsPage, Inventory, VisualizerDrawer
- tabs, scroll-area, resizable, tooltip, dropdown-menu: only JudgePage, BattleArena, GroupArena
- separator: GroupArena
- app-toast: Navbar
- globe: Friends
- dialog, select, command, popover, label: no in-scope imports found

Everything else is hand-rolled.

Border radius (the zero-radius target):
- Inline: "50%" ×68, 7 ×54, 8 ×53, 10 ×51, 16 ×24, 11 ×22, 2 ×19, 3 ×18, 6 ×16, 12 ×16, 4 ×14, 14 ×13, 9 ×13, 18 ×10, 20 ×9, 5 ×7, var(--home-radius) ×5, 999 ×5, 7px ×5, 13 ×4, 15 ×3, 9999px ×3, var(--radius) ×3, plus "12px!important"/"18px!important".
- Tailwind: rounded-xl 46, rounded-lg 45, rounded-md 17, rounded-full 14, rounded-2xl 12, rounded-sm 8, rounded-[10px], rounded-[25px].
- That's about 25 distinct radii, and about 520 radius declarations to remove.

BUTTONS — about 20 hand-rolled variants across 5 heights (30/32/36/40/44) and 5 radii (7/8/10/11/50%):
- Acid-yellow primary:
  - App.jsx battle overlay "Rejoin" (h36, r10, ~App.jsx:330-350)
  - Navbar Extension (30×30 r8, yellow, ~Navbar.jsx:594-625)
  - Navbar "Sign in" (h30 r8 plus glow 0 0 18px, ~640-653)
  - AuthPage VButton (AuthPage.jsx:200-210)
  - Friends SearchRow Add (h30 r7, FriendsPage.jsx:286-287)
  - BattleLobby Find Battle (:1104-1115)
- Danger/red:
  - Friends challenge (h32 r8, :225-226)
  - ChallengeModal submit (h44 r11, :418-419)
- Ghost/outline:
  - Friends reject/cancel (h32 r8, :256-265)
  - Profile unmute (padding 8/16 r8, ProfilePage.jsx:731)
  - Navbar ESC (h32 r8, ~Navbar.jsx:295-305)
- Icon buttons:
  - Navbar hamburger/DND/Bell (30 r8)
  - Friends accept (32 r8 green tint, :249-250)
  - Friends search accept (30 r7, :298-299)
  - App scroll-top (40, circle, glass, ~App.jsx:360-390)
- Tailwind buttons: GroupLobby start/create/join (:406-414, :574-584, :616-626) with Loader2.
- Hover effects are done with onMouseEnter/Leave style mutation (dozens of sites), so there's no :focus-visible state anywhere.
- → <Button variant="primary|secondary|ghost|danger|link" size="sm(28)|md(36)|lg(44)" iconOnly loading>. Zero radius, 1px border, hover = invert (bg #EDFF66 → text), focus-visible = 2px acid outline with 2px offset.

CARDS/PANELS — about 12 variants, radii 9–20:
- BattleLobby screen card r18 (:90-94)
- Home extension CTA r18 (:1016)
- TopicsPage search shell rounded-2xl (:36)
- Leaderboard/Achievements empty-icon tiles r14 (:752-756, :659)
- Navbar mobile stats r12
- Navbar stat pill r8
- ui/card (Inventory only)
- TopicPixelCard/PixelCard (blur plus tilt)
- AlgoCards tilt cards (6 rotateX/Y)
- Achievements tilt (6)
- → <Panel variant="default|inset|accent|interactive" padding="sm|md|lg">. 1px border-default, bg-surface, no shadow. The interactive variant gets a border-accent on hover, with no translate or scale.

INPUTS — 4+ variants: ui/input (TopicsPage:12), AuthPage custom fields (~AuthPage.jsx:100-140), Friends search, GroupLobby join code (.battle-monument placeholder styles), ProblemsTable search/filters. → <Input>, <Select>, and <SegmentedInput> for the 6-char room code.

TABS/SEGMENTED — 5+ variants: ui/tabs (Judge/Arenas), Leaderboard activeTab (~:640-700), Achievements category filter (~:600-640), ProblemsTable status filter options (:688), Friends list tabs, and the FriendsPage ChallengeModal mode/difficulty pickers (:310-420). → <Tabs variant="underline|segmented"> built on ui/tabs.

BADGES/PILLS — about 8 variants:
- ui/badge
- Navbar count pill (r7, red tint, ~Navbar.jsx:345-350)
- Navbar notification dot (r50% with glow)
- Store eyebrow tag (text-[10px] tracking-[0.2em])
- Inventory type badges (text-red-500/bg-red-500/10…, InventoryPage.jsx:15)
- ProblemsTable difficulty/status chips (:44, :688)
- BattleLobby rating "⚡" chip (:353, :405)
- → <Badge variant="neutral|accent|success|warning|danger|outline" size="sm|md">, square, Mono 10–11px uppercase 0.08em.

MODALS/OVERLAYS — 6 variants:
- FriendChallengeModal (global; 8 gradients, 4 blurs)
- FriendsPage's own ChallengeModal (:310), a SECOND, different challenge modal
- Navbar MobileOverlay (z200, grain, SVG deco)
- ProblemsTable detail dialog (dialogOpen :567)
- VisualizerDrawer
- App battle overlay bar
- → <Dialog> (ui/dialog restyled) plus <Sheet side="right|full">. Delete one of the two challenge modals.

TABLES/LISTS: ProblemsTable (hand-built rows), Leaderboard rows plus its own Skeleton, Friends FriendRow/RequestRow/SearchRow, BattleLobby history, Achievements grid plus its own Skeleton. → <DataTable> or <ListRow>, and one <Skeleton>.

AVATARS: Navbar square r8 initials (30px, ~Navbar.jsx:630-640). Everywhere else is circular "50%" (Friends, Leaderboard, Lobby). → <Avatar size="sm|md|lg" shape="square">.

PROGRESS: Navbar XPLine (gradient plus glow plus sweep, Navbar.jsx ~150-205), plus profile and achievement bars (gradients). @radix-ui/react-progress is installed but there's no ui/progress. → <Progress> as a 2–4px solid acid fill on a border-muted track, with no glow.

TOASTS — 2 systems: ui/app-toast (Navbar ~689-698, with rounded-xl, backdrop-blur-md and a double shadow in 300-char classNames), and StorePage's showToast (:81, which shows raw err.message). → <Toast variant="info|success|error"> in a single <Toaster> region.

TOOLTIPS — 4 mechanisms: ui/tooltip (Judge/Arenas), components/common/Tooltip.jsx, the Navbar hand-rolled DND tooltip (opacity-toggled div, r10), and native title= (Navbar extension 598, avatar). → ui/tooltip only.

STAT TILES — about 5 variants: Navbar desktop stat pill, Navbar mobile stats footer (textShadow glow `${color}50`), Profile hero stats, Leaderboard podium (rank===1?21:16), and BattleResult. → <Stat label value delta tone>.

══════════ 4. STATES (API down / logged out) ══════════
- Global: the Suspense fallback is a plain "Loading..." in #888 (App.jsx ~262). It shows for the lazy JudgePage and ProblemListPage.
- ProtectedRoute: a hard <Navigate to="/login"> with no message (ProtectedRoute.jsx:10-14). It checks user?.uid synchronously while hydrateSession() is async (App.jsx useAppInit), so a cookie-only session can bounce to /login before hydration finishes. That's inferred from reading the code, not tested.
- Protected routes: /profile, /store, /inventory, /battle*, /achievements, /friends, /group*, and /map. So with the backend off you can't log in, and the WORLD MAP is unreachable in a demo.

Per page:
- Profile: "Loading profile…" at 11px rgba(.2) (ProfilePage.jsx:491-501). The fetch has only try/finally (~:420-427). I didn't verify what renders on error.
- Leaderboard (public): Skeleton rows (:744-745). Errors go to console.error only (:554). With the API down it shows "No data yet" (:760), which is misleading.
- Store: spinner plus "Loading store…" (:93-98). console.warn only (:57), so it then falls through to the empty state (:168). Purchase errors show raw err.message in a toast (:81).
- Inventory: loading at :48. console.warn only (:42), so API down reads as "Your inventory is empty" (:87).
- Achievements: skeleton grid (:653-655) and an empty state (:657-662). No error UI.
- Friends: pulsing text while loading (:661), good Empty states (:663, 676, 688), but a raw {error} banner (:655) and "No users found." (:725).
- BattleLobby: loading/not-logged-in card (:82-99). Raw {error} (:930). History errors are swallowed with .catch(()=>{}) (:621). Empty state "No battles yet" (:1246).
- BattleArena: "Loading battle…" (:251). Description falls back to "Loading…" (:486). Run errors print err.message (:214).
- BattleResult: `{error || "Loading results…"}` in the same slot, gated on `loading || !result` (:323-327). With the API down it's stuck forever or shows a raw error, with no retry.
- GroupLobby: raw {error} in red (:220). GroupArena: "Loading battle…" (:346), "Loading…" (:558).
- Judge: "Loading problem…" (:202). Errors go to .catch(console.error) (:142), then "Problem not found" (:215) with the API down, which is misleading. Run errors show err.message (:162, 170).
- ProblemsTable: raw e.message (:504, 514) displayed in 13px red (:1095-1101). A retryLoad exists (:590), which is good.
- Topics/TopicPage/AlgoCards/Home/Visualizers: no fetch found, so they're static and survive an offline backend.
- Auth: shows loginError from the backend. With the backend off that's likely a raw "Failed to fetch" (not verified).

Pages that look broken with the API down: Leaderboard, Problems, Judge, Store, Inventory, Friends, BattleResult, Profile, and Auth, which in turn blocks every protected page including /map.

══════════ 5. AMATEUR SIGNALS ══════════
Gradients / neon glows / blur (per file):
- Leaderboard: 12 / 12 / 0, textShadow glow on the H1 (:664)
- Profile: 6 / 10 / 10, plus grain (:563-566)
- TopicPage: 13 / 1 / 0
- Achievements: 11 / 0 / 6
- BattleResult: 10 / 4 / 0
- ProblemsTable: 10 / 2 / 0
- FriendChallengeModal: 8 / 0 / 4
- Home: 7 / 3 / 0
- BattleLobby: 7 / 7 / 0
- Friends: 6 / 4 / 2
- Navbar: 4 / 6 / 6
- AlgoCards: 5 / 2 / 0
- Navbar glass: blur(28px) saturate(200%) and a shimmer top edge (~Navbar.jsx:486-500); App overlay blur(12px); scroll-top blur(10px).

Infinite animations: Home 7 (GlitchText re-scrambles every 2.4–6.8s, HomePage.jsx:275-293), Leaderboard 7, BattleLobby 7, Friends 4, BattleArena 4, Profile 3, Achievements 3, AlgoCards 3, ProblemsTable 3. The Navbar adds an infinite canvas Ticker at 4.2% opacity (~:210-250), an infinite bellPulse, an XP sweep that replays on every route change (~:150-200), and a glitch scramble on every link hover (:50-108).

Tilt cards (rotateX/Y/perspective): Achievements 6, AlgoCards 6. Hover scale: Leaderboard 2, Home, TopicPage, TopicPixelCard, AlgoCards. The mobile nav links shift padding-left on hover (~Navbar.jsx:331-332).

Emoji: StorePage.jsx:210 and InventoryPage.jsx:114 ("📦" fallback icon), BattleLobbyPage.jsx:353 and :405 ("⚡" rating), GroupResultPage.jsx:181 ("🪙").

Exclamation copy: GroupResultPage.jsx:42-46 ("You dominated the arena!", "Great performance!", "Solid finish!", "Better luck next time!"), and "Copied!" in JudgePage:583, BattleArena:789, GroupArena:821.

Casing and naming mix:
- Nav labels are Title Case ("Visualize", "Ranks", "Badges") while page H1s say "Explore Topics", "Leaderboard" and Achievements. The nav label and page title don't match.
- "Sign in" (Navbar) vs "Continue →" / "Create Account →" (Auth 441/495).
- "Arena." is used as the second H1 line on both Problems and Battle.
- TopicPage is the only UPPERCASE H1.

Icon libraries:
- Navbar mixes lucide with MUI ExtensionIcon (Navbar.jsx:10, ~616). ProblemsTable mixes react-icons with lucide.
- package.json ships 6 icon libraries (lucide, @mui/icons-material, react-icons, @tabler/icons-react, tabler-icons-react, @radix-ui/react-icons), and pulls in all of @mui/material just for one icon.
- Icon sizes: 25 distinct (8–52). Top ones are 13 ×45, 11 ×40, 12 ×36, 10 ×26, 14 ×20. Navbar uses Shield 8 and stat icons 10.
- Hand-drawn SVG strokes use 0.8/1/1.5/1.75/2/2.5/2.8/5.

z-index:
- Inline: 0, 1, 2, 3, 5, 10, 20, 40, 50, 100, 150 (Navbar), 200 (mobile overlay), 500, 9998 (battle bar), 9999 (scroll-top).
- Tailwind: z-10, z-50 ×8 (shadcn dialog/dropdown/tooltip), z-[100], z-[120] ×3, z-[210]/z-[211] (toasts).
- BUG: shadcn overlays at z-50 sit UNDER the navbar (150), and the scroll-top button (9999) floats over every dialog.
- BUG: on mobile, scroll-top (bottom/right 1.75rem) overlaps the battle bar's Rejoin button (bottom 1.2rem, width calc(100vw-2rem)).
- Proposed scale: base 0 / raised 10 / sticky 20 / nav 30 / overlay 40 / modal 50 / toast 60 / tooltip 70.

Placeholder and debug leftovers:
- Navbar.jsx:32 EXTENSION_ZIP_DEMO_URL; :598 title "Download extension (demo link)"; :460 download name "algovisualizer-extension.zip" (vs the VantageCode.zip in the URL).
- Navbar.jsx:263-264: the wordmark is commented out, so the bar has a logo tile only.
- ProblemListPage.jsx:2 has a mojibake comment ("ï¿½").
- HomePage.jsx:1157: the © glyph read as "�". Check in the browser for a broken copyright.
- "Debug" buttons (JudgePage:478, BattleArena:671, GroupArena:687) are a real feature, but the label reads like dev UI. Rename to "Load failing case".

Brand spellings: "Vantage" (index.html title, Logo alt, Home copy 448/530/1028, Store eyebrow 121), "VANTAGE" (AuthPage.jsx:254), "Vantage LeetCode Sync extension" (Home:1028), "VantageCode.zip", "algovisualizer-extension.zip" (Navbar:460), package name "algo-visualizer", favicon "algo.svg".

public/index.html:
- The meta description is stale ("An interactive algorithm visualizer to understand sorting and pathfinding algorithms easily.").
- The favicon is an SVG only (algo.svg).
- There's no theme-color, no Open Graph/Twitter tags, and no apple-touch-icon.
- The body has class "bg-gray-900" (#111827, not #09090b), which gives a flash of the wrong background.
- There's NO manifest.json (the file doesn't exist).

Theme: ZINC_LIGHT_SCOPE_PATHS (App.jsx ~45-58) leaves out '/', '/visualizers' and the topic routes, and MAP_DARK_LOCK_PATHS force-locks /map to dark (~60-62, 239-240). So the light theme is page-selective today, which conflicts with the "light theme everywhere, including the map" target.

══════════ 6. NAVIGATION / IA ══════════
- LINKS order (Navbar.jsx:21-30): Home, Visualize (/visualizers), Problems, Battle, Friends (with badge), Ranks (/leaderboard), Badges (/achievements), Map.
- Right cluster: coin/level/streak stat pill, DND, a Bell that also links to /friends (a duplicate of the Friends link), a yellow Extension button (a second primary CTA competing with "Sign in"), avatar or Sign in, and the hamburger.
- Store, Inventory, Group and Profile are missing from the nav. Profile is reachable via the avatar only. I found no entry point for Store/Inventory within the files I read.
- Active state: yellow text, weight 600→900, and a glowing 3px dot (:92-103). The weight change plus random glitch glyphs in the proportional Inter font change link widths inside an absolutely centred nav (:510-518), so the whole nav jitters.
- Likely overlap at 1024–1200px: 8 centred links against the right cluster, since the stat pill is shown from 1024. That's estimated, not rendered.
- Mobile (<1024, the .nb-desktop/.nb-mobile CSS at ~700-712): the hamburger opens a full-screen overlay (z200) with giant links (clamp 1.8–3rem Inter 900), grain and a stats footer. The "ESC" label is a click button. I saw no keydown handler, focus trap or aria-modal.
- Navbar hidden on: /map, /login, /signup, /battle/match/*, /group/match/*, /problem/* (App.jsx ~33-39 and the startsWith('/problem/') check). It's transparent only on '/'.
- Footer: HomePage only (:1128, :1189). No other page has one.
- Back navigation: at least 9 different hand-rolled back buttons (TopicPage:507/519, Store:115-118, Inventory:62-63, Judge:217/244, BattleArena:576, GroupArena:622, Leaderboard:487, AlgoCards:530, VisualizerPage:20-23). No breadcrumbs anywhere.
- VisualizerPage renders a second header (.visualizer-nav with a Back button using navigate(-1) plus an icon and title, HomePage.css:445-451) under the fixed global Navbar. That's a DOUBLE HEADER, and navigate(-1) leaves the app on a direct landing.

══════════ 7. TOP 40 FIX LIST (amateur → pro) ══════════
1. index.html body bg-gray-900 → bg #09090b plus a theme-color meta for both themes. Rewrite the meta description, add OG tags, add manifest.json, and rename algo.svg to vantage.svg.
2. Navbar.jsx ~486: header height:44 conflicts with padding 30px. Set a fixed 56px bar with radius 0, a 1px bottom border, a solid bg-surface (no blur/saturate) and a --nav-h token.
3. Replace every paddingTop:56 / pt-24 / 100px / 5rem with <PageShell> (padding-top: var(--nav-h) + 32px). Affected: Profile:529, Leaderboard:619, Achievements:557, Friends:564, BattleLobby:796, BattleResult:364, ProblemsTable:699, TopicPage:466, Store:108, Inventory:57, GroupLobby:188, GroupResult:102, AlgoCards:514, HomePage.css:432-441.
4. Unify H1 into <PageHeader eyebrow title sub actions>: Monument 900 UPPERCASE clamp(2.25–3.5rem), -0.02em, #fff, with one acid-colour word allowed. Apply to all 12 H1 sites listed in §1 and remove textShadow (Leaderboard:664), the red "Arena." (BattleLobby:855) and the "."-block gimmick (TopicPage:569).
5. Fix the duplicate <h1> on AchievementsPage:583/588 (use a span for the second line) and BattleLobby:315/849. Add H1s to Home, Profile, BattleResult and GroupResult.
6. Set a 10px minimum font size. Remove 6/7/7.5/8/8.5/9/9.5px (≈210 sites) and map them to micro (10px) or label (11px).
7. Collapse ~45 letter-spacing values to 4 tokens and ~90 font sizes to the 8-step scale in §1.
8. Weights: only use 900 on Monument display text. Body and buttons use Mono 500/700.
9. Build <Button> (§3) and replace about 20 inline variants, including App.jsx overlay/scroll-top, Navbar ESC/extension/sign-in/hamburger, AuthPage VButton:200, FriendsPage:225/249/256/263/286/298/418, BattleLobby:472/1104/1171, Profile:731 and GroupLobby:406/574/616. Hover = colour inversion, focus-visible outline; delete the onMouseEnter style mutation.
10. Global radius 0: remove about 25 radius values (≈520 declarations) and all rounded-* classes, and set --radius:0 in the shadcn theme so ui/* inherits it.
11. Kill neon: remove glow boxShadow/textShadow (Navbar dots, the "Sign in" glow, XPLine glow, Leaderboard 12, Profile 10, BattleLobby 7). Replace with 1px borders and a solid acid fill.
12. Kill glassmorphism: backdrop blur in Navbar, App overlay, scroll-top, Profile ×10, Achievements ×6, Store ×4, FriendChallengeModal ×4 and app-toast classNames → an opaque surface plus a border.
13. Remove decorative gradients (TopicPage 13, Leaderboard 12, Achievements 11, BattleResult 10, ProblemsTable 10). Allowed: none, or a single hairline accent rule.
14. Remove the infinite loops: the Navbar Ticker canvas, bellPulse, the XPLine sweep on every route (Navbar ~150-250), and HomePage GlitchText auto-rescramble (275-293). Keep at most one hero entrance per page and honour prefers-reduced-motion.
15. Navbar glitch hover (Navbar.jsx:50-108) → a static underline or inverted block for the active item, fixed weight (700 always), and tabular Mono so the width doesn't shift.
16. Remove tilt cards (Achievements, AlgoCards rotateX/Y) and hover scale/translate (Leaderboard, Home, TopicPage, TopicPixelCard, AlgoCards, and the Navbar mobile padding-left shift). Hover becomes a border colour change.
17. Remove the grain/noise overlays (Navbar ~283, Profile:563-566) and the mobile corner SVG deco (~Navbar.jsx:288-294), or turn them into one global subtle scanline token if the brand needs texture.
18. z-index scale (§5). The Navbar must sit below dialogs, scroll-top below toasts and dialogs, and the battle bar (9998) and scroll-top (9999) need to be re-slotted.
19. On mobile, stack or offset the scroll-top button against the battle bar (App.jsx ~292-390). Better: hide scroll-top while the battle bar is visible.
20. Merge the two challenge modals (FriendChallengeModal.jsx vs FriendsPage.jsx:310) into one <Dialog>-based ChallengeDialog.
21. One toast system: restyle ui/app-toast (square, opaque, 1px acid border for info, red border for error) and move StorePage showToast (:81) onto it.
22. One tooltip: ui/tooltip. Replace the Navbar DND tooltip, the native title= attributes and common/Tooltip.jsx.
23. One <Badge> (§3). Replace the Navbar pill, Inventory type badges (:15), ProblemsTable chips (:44/:688), the Store eyebrow and BattleLobby's ⚡ chip.
24. One <Tabs> (underline for page sections, segmented for filters). Replace Leaderboard, Achievements categories, the Problems status filter, Friends tabs and the ChallengeModal pickers.
25. One <Skeleton> (Leaderboard and Achievements each have their own) plus one <EmptyState icon title body action>, taking Friends' Empty component (:461) as the base, and one <ErrorState message onRetry>.
26. Offline and error states: Leaderboard:554, Store:57, Inventory:42, Judge:142 and BattleLobby:621 swallow errors, so misleading empty states appear. Show <ErrorState "Backend unreachable" + Retry>. Stop rendering raw err.message (ProblemsTable:1101, Friends:655, BattleLobby:930, GroupLobby:220, BattleResult:327, Store:81).
27. BattleResult:323-327: separate the loading/error/not-found branches and add Retry and "Back to lobby".
28. App.jsx Suspense fallback "Loading..." #888 → a branded <PageLoader> (Mono label "LOADING_" plus a 2px acid bar), theme-aware.
29. ProtectedRoute: wait for hydrateSession before redirecting (render the PageLoader), and pass a returnTo plus a "Sign in to view X" message. For demos, consider a static demo mode or fixtures so /map, /profile and /leaderboard render with the backend off.
30. Remove emoji: 📦 (Store:210, Inventory:114) → a lucide Package icon. ⚡ (BattleLobby:353/405) → a Zap icon or the label "RTG". 🪙 (GroupResult:181) → a Coins icon.
31. Rewrite exclamation copy (GroupResult:42-46): "1ST PLACE — TOP OF LOBBY", etc. "Copied!" → "COPIED".
32. Align nav labels and page titles: Visualize↔Topics, Ranks↔Leaderboard, Badges↔Achievements. Pick one name each, UPPERCASE Mono 11px/0.12em in the nav, and add Store to the nav or the profile menu.
33. Remove the Bell→/friends duplicate or make it a notifications popover. Demote the Extension button to a ghost icon button so "Sign in" is the only primary CTA.
34. Navbar: restore the wordmark ("VANTAGE" in Monument next to the logo, Navbar.jsx:263-264), fix the download filename (:460) and drop the "(demo link)" title (:598).
35. Brand spelling: use "Vantage" in prose and "VANTAGE" only as the wordmark. Rename package.json "algo-visualizer", the algo.svg favicon and "algovisualizer-extension.zip". Fix the © mojibake (HomePage:1157) and the ProblemListPage:2 comment.
36. Mobile menu: add Escape handling, a focus trap, role="dialog" aria-modal, body scroll lock, and Mono uppercase links at 24–32px instead of Inter 900 at 3rem.
37. Responsive pass for the zero-responsive pages: Profile, BattleLobby, BattleArena, BattleResult, Auth and the codeflow panels. Standardise on the Tailwind breakpoints (sm 640 / md 768 / lg 1024 / xl 1280) and delete the 13 ad-hoc @media values. Remove whiteSpace:nowrap from the Leaderboard H1 (:666).
38. VisualizerPage double header: fold the back and title into a <PageHeader> breadcrumb ("TOPICS / SORTING / MERGE SORT") under the global nav. Replace navigate(-1) with a real parent route, and do the same for the 9 other back buttons.
39. Icons: lucide only, with 3 sizes (14/16/20) and strokeWidth 1.5. Drop MUI (Navbar:10), react-icons (ProblemsTable) and the tabler/radix icon deps.
40. Add a minimal <Footer> (Mono 11px: © Vantage · GitHub · Extension · theme toggle) to all non-arena pages. Only HomePage has one today.

ZERO-RADIUS EXCEPTIONS (allowed, with reasons):
- Status and presence dots, and notification dots (≤8px): a circle reads as a "signal", not a container. Squares are acceptable too; pick one and apply it everywhere.
- Radio buttons: keep them circular so they stay distinct from square checkboxes (an affordance and a11y convention).
- Graph and tree nodes in visualizers and the world-map markers: circle vs square carries meaning (node vs array cell/stack frame). Keep node shapes as they are.
- Spinners and progress rings (Loader2, circular XP rings): they're inherently circular.
- Switch/toggle: a square track and square thumb works in brutalism, but keep the thumb clearly offset with a high-contrast colour change. No exception needed unless it tests poorly.
- Focus rings: use `outline` (which follows the element's rectangular box) with an offset, not box-shadow. No radius needed.
- Monaco editor widgets, native <select> popups and OS scrollbars can't be fully controlled. Accept whatever radius they render with.
- Avatars: make them square (Navbar already is). No exception needed, but if user photos are added later, a square crop with a 1px border reads fine.

RELEVANT FILES (ranked by importance):
  1. src/components/layout/Navbar.jsx — Global chrome: nav IA, active state, glitch/ticker/XP animations, glass, z-index 150/200/210, mobile overlay, demo leftovers, MUI icon mix, toasts
  2. src/App.jsx — Navbar-hidden/transparent/light-scope/map-dark-lock path lists, Suspense "Loading..." fallback, battle overlay and scroll-top z-index conflicts
  3. src/components/problems/ProblemsTable.jsx — Representative hand-rolled page: H1 "Arena." treatment, paddingTop 56, 1080 container, raw error rendering, retry logic, 10 gradients
  4. src/pages/leaderboard/LeaderboardPage.jsx — Glowing nowrap H1, 1300 container, console-only errors producing misleading "No data yet", skeleton/empty patterns
  5. src/pages/home/HomePage.css — Visualizer shell double header and stale navbar clearance offsets (5rem/6.5rem)

NOTE: Line ranges have been extended by ~50 lines to provide additional surrounding context.