# VANTAGE design system (frozen, as shipped)

This is the reference for every Phase 2+ unit. Read it before you build a page or a visualizer. It documents the code as it is, not the plan. Where it differs from POLISH_PLAN §3, this file wins.
Sources: `reactapp/src/styles/{tokens.css,fonts.css,typeScale.json,typeScale.js}`, `reactapp/tailwind.config.js`, `reactapp/src/components/ds/**`, `src/lib/{canvasTheme,monacoThemes}.js`, `src/hooks/{useThemeTokens,useReducedMotion}.js`, `src/components/common/{ThemeProvider,ThemeToggle}.jsx`, `src/pages/visualizer/legacyViz.jsx`, `public/index.html`, `src/pages/ds/**`. All paths below are relative to `reactapp/`.

> **Owner revision, 2026-10-02:** app pages keep their signature visuals (heroes, canvases, the Friends globe, map stage colours, PixelCards) and their old layouts; only the consistency layer is mandatory. `docs/polish/PAGES_PRESERVE.md` defines this and outranks §1 and §10 below for app pages. Everything else in this file (tokens, radius, type, primitives, theming) still applies everywhere. Signature colours must be added here as tokens when they're introduced.

## 1. Principles

- The identity is terminal-brutalist: flat surfaces, 1px hairline borders, mono type, one acid accent and zero radius. The content does the decorating.
- These are banned: gradients, glows, shadows (`box-shadow`, `text-shadow`), blur or glass, tilt, hover scale or translate, decorative infinite loops, custom cursors, spinners and emoji.
- **Accent fills always carry a 1px `--accent-edge` border.** In light mode `#EDFF66` on `#F4F4F0` is about 1.0:1, so a fill without its edge disappears. In dark mode the edge equals the fill and is invisible.
- **Accent text, borders and icons use `--accent-ink`, never `--accent`.** In light mode, `--accent` is used for fills only.
- Status colours (`ok`, `warn`, `err`, `info`) carry meaning only: verdicts, difficulty and success or failure. They are never decoration. Difficulty maps Easy to `ok`, Medium to `warn` and Hard to `err`.
- Depth comes from `--surface` against `--bg` plus a 1px border. Overlays are opaque.

## 2. Tokens (`src/styles/tokens.css`)

Dark values sit on `:root, html.dark` and light values on `html.light`. Solid colours also have an `--*-rgb` triplet (`r g b`), so Tailwind `/<alpha>` modifiers work. Translucent tokens have no triplet and take no opacity modifier.

| Token | Dark | Light | Tailwind | JS (`useThemeTokens()` key / `canvasTheme`) |
|---|---|---|---|---|
| `--bg` | `#09090B` | `#F4F4F0` | `bg-bg` | `bg` / `rgba('bg',a)` |
| `--surface` | `#0F0F12` | `#FFFFFF` | `bg-surface` | `surface` |
| `--elevated` | `#16161A` | `#EBEBE6` | `bg-elevated` (`bg-elevated/50`) | `elevated` |
| `--border` | `rgba(255,255,255,.10)` | `rgba(10,10,11,.14)` | `border-border` | `border` |
| `--border-strong` | `rgba(255,255,255,.22)` | `rgba(10,10,11,.32)` | `border-border-strong` | `borderStrong` |
| `--fg` | `#F5F5F4` | `#0A0A0B` | `text-fg`, `bg-fg` | `fg` / `rgba('fg',a)` |
| `--fg-muted` | `rgba(255,255,255,.66)` | `rgba(10,10,11,.66)` | `text-fg-muted` | `fgMuted` |
| `--fg-dim` | `rgba(255,255,255,.52)` | `rgba(10,10,11,.58)` | `text-fg-dim` | `fgDim` |
| `--accent` | `#EDFF66` | `#EDFF66` | `bg-accent` | `accent` |
| `--on-accent` | `#09090B` | `#09090B` | `text-on-accent`, `bg-on-accent` | `onAccent` |
| `--accent-edge` | `#EDFF66` | `#0A0A0B` | `border-accent-edge` | `accentEdge` |
| `--accent-ink` | `#EDFF66` | `#5C6B00` | `text-accent-ink`, `border-accent-ink`, `bg-accent-ink` | `accentInk` |
| `--accent-soft` | `rgba(237,255,102,.12)` | `rgba(92,107,0,.10)` | `bg-accent-soft` | `accentSoft` |
| `--focus` | `#EDFF66` | `#0A0A0B` | `outline-focus` | `focus` |
| `--ok` | `#34D399` | `#047857` | `text-ok`, `border-ok`, `bg-ok` | `ok` |
| `--warn` | `#FBBF24` | `#AB4F09` | `text-warn`, `border-warn` | `warn` |
| `--err` | `#F87171` | `#B91C1C` | `text-err`, `border-err`, `bg-err` | `err` |
| `--info` | `#67E8F9` | `#0E738F` | `text-info`, `border-info` | `info` |
| `--ok-soft` | `rgba(52,211,153,.14)` | `rgba(4,120,87,.10)` | `bg-ok-soft` | `okSoft` |
| `--warn-soft` | `rgba(251,191,36,.14)` | `rgba(180,83,9,.10)` | `bg-warn-soft` | `warnSoft` |
| `--err-soft` | `rgba(248,113,113,.14)` | `rgba(185,28,28,.10)` | `bg-err-soft` | `errSoft` |
| `--info-soft` | `rgba(103,232,249,.14)` | `rgba(14,116,144,.10)` | `bg-info-soft` | `infoSoft` |
| `--viz-write` | `#C4B5FD` | `#6D28D9` | `text-viz-write`, `bg-viz-write` | `vizWrite` |
| `--backdrop` | `rgba(0,0,0,.6)` | `rgba(10,10,11,.35)` | `bg-[var(--backdrop)]` (no named class) | `backdrop` |

**Nudged from POLISH_PLAN §3.1 so they pass 4.5:1.** These three light values changed. Light `--fg-dim` is `.58` alpha (the plan had `.54`). Light `--warn` is `#AB4F09` (plan: `#B45309`). Light `--info` is `#0E738F` (plan: `#0E7490`). The `*-soft` tints still use the plan's base hues.

Triplets exist for `bg surface elevated fg accent on-accent accent-edge accent-ink focus ok warn err info viz-write` (`RGB_TOKENS` in `canvasTheme.js`). `useThemeTokens().rgb.<camelKey>` returns `"r,g,b"` strings, for example `` `rgba(${t.rgb.fg},0.4)` ``.

Theme-independent tokens (`:root`):

| Token | Value | Tailwind |
|---|---|---|
| `--nav-h` | `56px` | `top-[var(--nav-h)]` |
| `--container` / `--container-narrow` | `1200px` / `768px` | `max-w-[var(--container)]` (use PageShell) |
| `--gutter` | `clamp(16px, 4vw, 48px)` | `px-[var(--gutter)]` (use PageShell) |
| `--display-weight` | `400` | read by `text-display\|h1\|h2` and `TYPE.*` |
| `--z-base` / `--z-raised` / `--z-sticky` / `--z-nav` | `0` / `10` / `20` / `30` | `z-base` `z-raised` `z-sticky` `z-nav` |
| `--z-overlay` / `--z-modal` / `--z-toast` / `--z-tooltip` | `40` / `50` / `60` / `70` | `z-overlay` `z-modal` `z-toast` `z-tooltip` |
| `--radius` | `0px` | shadcn bridge only |

Any z-index above 70 is a bug. The shadcn bridge at the bottom of `tokens.css` aliases `--background --foreground --card --popover --secondary --muted --accent-foreground --destructive --ring` onto these tokens for the legacy `ui/*` files. Don't use those names in new code.

**Visualizer state map (§3.2).** This is the contract for v2 stages. Pages don't use it.

| State | Look | State | Look |
|---|---|---|---|
| `idle` | `--elevated` fill, `--border` | `success` | `--ok` border + `--ok-soft` |
| `active` | `--accent` fill + `--accent-edge`, `--on-accent` text | `error` | `--err` border + `--err-soft` |
| `compare` | `--warn` border + `--warn-soft` | `window` | `--info-soft` band, `--info` edges |
| `write` | `--viz-write` | `dim` | 35% opacity |
| `done` | `--fg-dim` text, `--surface` fill (never green) | code line | `--accent-soft` + 2px `--accent-ink` left rule |

Pointers are coloured by role, and the variable name is always the label. P1 (`i`, `L`, `curr`, `slow`) uses `--accent-ink`. P2 (`j`, `R`, `next`, `fast`) uses `--info`. P3 (`mid`, `pivot`, `prev`) uses `--viz-write`.

**Layout.**
- Breakpoints are Tailwind defaults only: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. There are no custom `screens` and no ad-hoc `@media` widths.
- Spacing applies to padding, margin, gap and inset. New code uses only steps `1` (4px), `2` (8), `3` (12), `4` (16), `6` (24), `8` (32), `12` (48) and `16` (64), for example `p-4 gap-6 mt-8 px-12`. Off-grid values such as 3, 5, 7, 9, 11, 13, 14 and 22px are banned. Tailwind's full default scale is still compiled so legacy classes keep working.
- Component heights (`h-7`/`h-9`/`h-11` = 28/36/44) are owned by the primitives.

**Radius policy (as shipped).** `tokens.css` zeroes `border-radius` with `!important` on every element and pseudo-element (`::before`, `::after` and, in a separate rule, `::-webkit-scrollbar-thumb`), at zero specificity via `:where()`. It has three exclusions:
1. `[data-shape="round"]`, allowed only on visualizer graph or tree nodes and on radio inputs. In `ds/*` it is used only on `Radio` (the item and its dot).
2. `.monaco-editor` and all its descendants, so Monaco widgets keep their own geometry.
3. `[data-legacy-viz] *`, every descendant of a not-yet-migrated visualizer. `lazyVisualizer()` (`src/pages/visualizer/legacyViz.jsx`) wraps any lazy visualizer whose default export lacks `Component.isVisualizerV2 = true` in `<LegacyVizRoot>` (`<div data-legacy-viz style="display:contents">`). **As shipped, nothing sets `isVisualizerV2` (there is no `defineVisualizer()` yet), so every visualizer is legacy.** The wrapper and this exclusion are deleted when the last visualizer migrates (end of Phase 5).

Avatars, dots, toggles, progress bars, scrollbars, loaders and focus rings are all square and need no exception.

## 3. Typography

Source of truth: `src/styles/typeScale.json`. It is read by `tailwind.config.js` (the `text-*` sizes and `font-mono`/`font-display`) and by `typeScale.js`. Edit the JSON, never the JS objects.

| Step | Tailwind | `TYPE.*` | Font | Size / line-height | Weight | Tracking | Case | Use |
|---|---|---|---|---|---|---|---|---|
| display | `font-display text-display uppercase` | `TYPE.display` | Monument | `clamp(2.75rem, 6vw, 5rem)` / .92 | `var(--display-weight)` | -0.01em | UPPER | home hero, max one per page |
| h1 | `font-display text-h1 uppercase` | `TYPE.h1` | Monument | `clamp(2rem, 3.6vw, 3rem)` / .95 | `var(--display-weight)` | -0.01em | UPPER | page title (PageHeader), exactly one `<h1>` |
| h2 | `font-display text-h2 uppercase` | `TYPE.h2` | Monument | 22px / 1.1 | `var(--display-weight)` | 0 | UPPER | section titles |
| h3 | `font-mono text-h3` | `TYPE.h3` | Mono | 15px / 1.3 | 700 | 0 | Sentence | card, dialog and state titles |
| body | `font-mono text-body` | `TYPE.body` | Mono | 14px / 1.6 | 400 | 0 | Sentence | paragraphs (`<body>` default) |
| small | `font-mono text-small` | `TYPE.small` | Mono | 12px / 1.5 | 400 | 0 | Sentence | meta, table cells, hints |
| label | `font-mono text-label uppercase` | `TYPE.label` | Mono | 11px / 1.2 | 700 | 0.12em | UPPER | eyebrows, buttons, tabs, nav |
| micro | `font-mono text-micro uppercase` | `TYPE.micro` | Mono | 10px / 1.2 | 500 | 0.08em | UPPER | badges, kbd, axis labels (the floor; nothing smaller) |

- `text-<step>` sets size, line-height, tracking and weight only. Add the font family and `uppercase` yourself. `labelType` and `microType` from `ds/styles.js` bundle them for `ds/*`.
- `TYPE.<step>` (`import { TYPE, FONT_MONO, FONT_DISPLAY, TYPE_STEPS } from "@/styles/typeScale"`) is a frozen, complete React style object. It includes `fontFamily` and `textTransform`, `fontVariantNumeric: "tabular-nums"`, and `fontSynthesis: "none"` on display steps.
- **Fonts loaded** (`src/styles/fonts.css`, self-hosted from `src/assets/fonts`, `font-display: swap`):
  - JetBrains Mono 400/500/700 normal, latin and latin-ext woff2 (`jetbrains-mono-latin{,-ext}-{400,500,700}-normal.woff2`, OFL).
  - Monument Extended 400 only (`MonumentExtended-Regular.otf`).
  - No Google Fonts. `html` sets `font-synthesis: none` and `font-variant-numeric: tabular-nums` globally.
- **`--display-weight: 400`.** Every Monument step reads it. To ship the Ultrabold later, the owner adds one `@font-face` in `fonts.css` with its real weight and changes `--display-weight` in `tokens.css`. Nothing else changes.
- **Temporary faux-bold shim** (bottom of `fonts.css`). `[style*="Monument" i]`, `[style*="Monument" i] :is(b, strong)`, `.font-display`, `.battle-monument` and `.group-arena-monument` are forced to `font-weight: var(--display-weight) !important`. It exists for the roughly 280 legacy `fontWeight: 900` inline styles. Delete it once Phases 4 and 5 have moved the pages to `TYPE.*` or the `text-display|h1|h2` utilities.
- **Copy:**
  - Use sentence case for prose and UPPER for labels (via `uppercase`, not typed capitals).
  - No emoji and no exclamation marks.
  - Write "Vantage" in prose; "VANTAGE" is only the wordmark.
  - Loaders read `LOADING_`.
- **Numbers:** use tabular figures everywhere. They are already global, and Table, Stat and Badge set `tabular-nums` too.

## 4. Motion

- **GSAP only** (`gsap`, `@gsap/react`). `framer-motion` and `motion` have been removed.
- **Allowed:**
  - One entrance per page: a 200–300ms fade or an 8px rise.
  - Hover as a colour or border change of at most 120ms. Use `colorTransition` = `transition-colors duration-[120ms] ease-out`.
  - Visualizer step transitions (position and fill) of 150–250ms.
  - Functional loaders: `animate-ds-indeterminate` (1.2s linear infinite, a 2px bar). Only `Button loading`, `Progress` without a value and `PageLoader` use it.
- **Banned:**
  - Infinite decorative loops (ticker, XP sweep, glitch re-scramble, pulses, and the legacy `animate-shine`).
  - Tilt, hover scale or translate, and parallax.
  - Text glitch.
  - Entrance animation on overlays: Dialog, Sheet and Toast mount without animation.
- **Reduced motion:**
  - CSS: `tokens.css` zeroes every animation and transition under `prefers-reduced-motion: reduce`.
  - JS: use `useReducedMotion()` (a live boolean hook) in components and `prefersReducedMotion()` in draw loops and GSAP setup, both from `@/hooks/useReducedMotion`. When either is true, skip GSAP timelines, draw one static canvas frame and use 0ms visualizer transitions.

## 5. Icons

- Use `lucide-react` only. `@mui`, `react-icons`, `@tabler` and `@radix-ui/react-icons` are not allowed.
- Sizes come from `ICON_PX = { sm: 14, md: 16, lg: 20 }` and stroke from `ICON_STROKE = 1.5` (`ds/styles.js`). No other sizes are allowed. Buttons size child `svg`s by CSS (`[&_svg]:size-3.5|4|5`) and force stroke 1.5.
- Decorative icons get `aria-hidden="true"`.
- Icon-only controls must be an `IconButton` with an `aria-label`, wrapped in `<Tooltip content>` with the same text. IconButton also falls back to `title={aria-label}`.

## 6. Primitives (`@/components/ds`)

```js
import { Button, IconButton, Panel, toast /* … */ } from "@/components/ds";
```

Pages import from this barrel only. All primitives are built on Radix directly (`@radix-ui/react-*`) and own their classes. Shared rules:
- Radius 0 and no shadows.
- Hover uses the `ds-hover:` variant: `:hover` on an element that is not `:disabled`, `[data-disabled]`, `aria-disabled` or `aria-busy`.
- Focus uses the `ds-focus:` variant (`:focus-visible`) through `focusRing` = a 2px `--focus` outline with 2px offset.
- Both variants also match `data-force="hover"` / `data-force="focus"` (for `/__ds` only).
- Every primitive forwards `className` and `...props` to its root, except `Field`, `Stat` and `Avatar`, which take only their listed props.

Groups follow `/__ds`: Actions, Forms, Containers, Overlays, Navigation, Data, States, and Page shell.

### 6.1 Actions

**`Button`** (`forwardRef`, `<button type="button">` by default).

| Prop | Type | Default |
|---|---|---|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger" \| "link"` | `"secondary"` |
| `size` | `"sm"` (28px) \| `"md"` (36px) \| `"lg"` (44px) | `"md"` |
| `iconOnly` | bool (square; prefer IconButton) | `false` |
| `loading` | bool. Adds a 2px bar on the bottom edge, `aria-busy` and `aria-disabled`, swallows clicks and keeps the label and width. | `false` |
| `asChild` | bool. Renders its only child (for example `<Link>`) with the button look. `disabled` then maps to `aria-disabled`, `data-disabled` and `tabIndex=-1`. | `false` |
| `disabled`, `type`, `onClick` | native | `false`, `"button"` |

Variants:
- `primary` is the accent fill with `border-accent-edge`, and its hover inverts to `bg-on-accent text-accent`.
- `secondary` is a `border-border-strong` outline whose hover fills with `fg`.
- `ghost` is borderless, with the same hover as `secondary`.
- `danger` is `text-err border-err`, and its hover fills with `err`.
- `link` is `text-accent-ink`, underlined, with hover to `fg`.

The type is the label step. `buttonClasses({ variant, size, iconOnly, className })` returns the same class string for non-button elements.

```jsx
<Button variant="primary" loading={saving} onClick={save}>Save</Button>
<Button asChild><Link to="/problems">Problems</Link></Button>
```

Don't:
- Use more than one `primary` per view region.
- Show a spinner, or swap the label for "Loading...".
- Put `link` on a non-navigation action.

**`IconButton`** is a square Button with one icon. Its props are `icon` (a Lucide component), `size` (default `"md"`), `variant` (default `"ghost"`), `title` (default `aria-label`) and every Button prop. **`aria-label` is required**; a dev console warning fires without it. With `asChild`, put the icon inside the child.

```jsx
<Tooltip content="Settings"><IconButton icon={Settings} aria-label="Settings" /></Tooltip>
```

**`ThemeToggle`** (re-exported from `src/components/common/ThemeToggle.jsx`) is a sun/moon IconButton. Props: `size` (default `"md"`) and `variant` (default `"secondary"`). It flips `resolvedTheme` and stores the explicit choice. The label is `Switch to light theme` or `Switch to dark theme`, and it sets the `data-theme-toggle` attribute.

### 6.2 Forms

Every control takes `label`, `hint` and `error` directly. Given any of them, it wraps itself in a `Field`. Inside an explicit `<Field>`, it reads its id and ARIA wiring from context instead. A dev warning fires when a control has no visible label and no `aria-label` or `aria-labelledby`.
- Labels are always visible.
- Errors render as `text-err` small text below the field and set `aria-invalid` and `aria-describedby`. Never use `alert()`.
- `required` adds a red ` *` (`aria-hidden`).
- `fieldClassName` styles the Field wrapper, and `className` styles the control.

| Export | Props (default) | Notes |
|---|---|---|
| `Field` | `label`, `hint`, `error`, `required`, `disabled`, `id` (auto), `layout` `"stack"` \| `"inline"` (`"stack"`), `className` | `stack`: label-step label above the control. `inline`: control left, body-text label right. |
| `useField()` | — | Returns `{ id, labelId, describedBy, invalid, required, disabled }` or `null`. |
| `Input` | `size` `sm\|md\|lg` (`"md"`), `type` (`"text"`), native input props | `--elevated` fill, `--border` (hover `--border-strong`, invalid `--err`), placeholder `--fg-dim`. Read-only uses `--surface`. |
| `Textarea` | `rows` (`4`), native props | `min-h-24`, vertical resize |
| `Select` | `value`, `defaultValue`, `onValueChange`, `open`, `defaultOpen`, `onOpenChange`, `name`, `required`, `disabled`, `placeholder`, `size` (`"md"`), `contentClassName` | Radix Select. The list is opaque `--surface` with `--border-strong` at `z-modal`, so it works inside a Dialog. The highlighted item inverts. |
| `SelectItem` / `SelectGroup` / `SelectLabel` / `SelectSeparator` | `value` (item) | Check indicator 14px. The label uses micro type. |
| `Checkbox` | `checked` (`true\|false\|"indeterminate"`), `onCheckedChange`, Radix props | 20px square. Checked is the accent fill with `--accent-edge` and an `on-accent` check or minus. Inline layout. |
| `RadioGroup` | `value`, `onValueChange`, `orientation` `"vertical"\|"horizontal"` (`"vertical"`), Radix props | Arrow keys move and select. Tab enters and leaves the group. |
| `Radio` | `value`, `label`, `id` (auto), `disabled` | The only `data-shape="round"` in ds. Checked is the accent fill with edge and an `on-accent` dot. |
| `Switch` | `checked`, `onCheckedChange`, Radix props | Square 36×20 track and 14px thumb. On is the accent fill with edge and an `on-accent` thumb. Inline layout. |
| `SegmentedInput` | `length` (`6`), `value`/`defaultValue` (`""`), `onChange(v)`, `onComplete(v)`, `allowed` (`/[A-Za-z0-9]/`), `uppercase` (`true`), `name` (adds a hidden input), `disabled`, `autoFocus`, `inputMode` (`"text"`) | 44px cells and a contiguous value. Typing advances, Backspace steps back, a paste fills, and arrows, Home and End move. The group is one Tab stop. Each cell is labelled `Character n of N`. |

```jsx
<Input label="Room name" hint="Shown to players" error={err} required />
<Select label="Language" value={lang} onValueChange={setLang} placeholder="Pick one">
  <SelectItem value="js">JavaScript</SelectItem>
</Select>
<SegmentedInput label="Room code" value={code} onChange={setCode} onComplete={join} />
```

### 6.3 Containers

**`Panel`** (`forwardRef`) is a flat box with a 1px border and no shadow.

| Prop | Type | Default |
|---|---|---|
| `variant` | `"default"` (`--surface`) \| `"inset"` (`--bg`, a panel inside a panel) \| `"interactive"` (pointer, hover `--border-strong`, focus ring) \| `"accent"` (`--accent-ink` border) | `"default"` |
| `label` | node. A header row with label-step `--fg-muted` text on the left. | — |
| `actions` | node, on the right of the header row | — |
| `padded` | bool. Body padding 16px; use `false` for flush tables. | `true` |
| `as` | element or component (`"section"` adds `aria-labelledby` pointing at the label) | `"div"` |
| `bodyClassName` | string | — |

No traffic-light dots. `interactive` with `as={Link}` or `as="button"` is the clickable-card pattern.

**`Badge`** (`forwardRef`, `<span>`) takes `tone` (alias `variant`): `"neutral"` (default) \| `"accent"` \| `"ok"` \| `"warn"` \| `"err"` \| `"outline"`. It is 20px tall, uses micro type and is square. The status tones are a `*-soft` fill with a status border and text, and the badge sets `data-tone`. There is no `info` tone. Use Badge for difficulty and verdicts, not for decoration.

**`Kbd`** (`forwardRef`, `<kbd>`) is a key-hint chip: `<Kbd>Ctrl</Kbd> <Kbd>K</Kbd>`.

### 6.4 Overlays

All overlays are opaque `--surface` with a 1px `--border-strong`, no blur, no shadow and no animation. They portal to `<body>`. Dialog and Sheet overlays use `bg-[var(--backdrop)]` at `z-overlay`, and their content sits at `z-modal`.

| Export | Props (default) | Notes |
|---|---|---|
| `Dialog`, `DialogTrigger`, `DialogClose` | Radix Root, Trigger and Close (`open`, `onOpenChange`, `asChild`) | Radix provides the focus trap, Esc, scroll lock, focus return and `aria-modal`. |
| `DialogContent` | `title` (required, h3 Mono), `description`, `size` `sm` 400 \| `md` 560 \| `lg` 768 px (`"md"`), `hideClose` (`false`), `bodyClassName` | Close is an `IconButton` X labelled "Close". The height is capped at `100vh-64px` and the body scrolls. |
| `DialogFooter` | `className` | A right-aligned button row with a top hairline. Place it last inside the content. |
| `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent` | `side` `"right"\|"left"\|"bottom"` (`"right"`), `title`, `description`, `hideClose` | Left and right sheets are `min(100vw,360px)` wide. Bottom sheets are capped at `85vh`. This is the mobile nav pattern. |
| `Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverClose`, `PopoverContent` | `align` (`"start"`), `sideOffset` (`4`) | 288px wide, `p-4`, small type, `z-modal` |
| `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuGroup` | Radix | — |
| `DropdownMenuContent` | `align` (`"start"`), `sideOffset` (`4`) | `min-w-[10rem]`, `z-modal` |
| `DropdownMenuItem` | `tone` (`"danger"` uses `--err`), `onSelect`, `asChild` | 32px, small type. The highlighted item inverts. |
| `DropdownMenuLabel` / `DropdownMenuSeparator` | — | Micro-type label and a hairline separator |
| `Tooltip` | `content` (falsy renders the children alone), `side` (`"top"`), `align` (`"center"`), Radix Root props | An inverted chip (`bg-fg text-bg`, small type) at `z-tooltip`. Its child must accept a ref. |
| `TooltipProvider` | `delayDuration` (`300`) | **Already mounted once in `App.jsx`.** Don't mount it again. |
| `TooltipRoot`, `TooltipTrigger`, `TooltipContent` | `sideOffset` (`6`) | Low-level parts for custom triggers |

```jsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent title="Leave battle?" description="Your progress is lost." size="sm">
    <DialogFooter>
      <DialogClose asChild><Button>Cancel</Button></DialogClose>
      <Button variant="danger" onClick={leave}>Leave</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Toast API.** `<Toaster />` is **already mounted once in `App.jsx`**. Its region is labelled "Notifications" and sits at bottom-right, `z-toast`, `min(100vw-32px, 360px)` wide, and keeps at most 4 toasts.

```js
import { toast } from "@/components/ds";
const id = toast({ tone: "ok", title: "Saved", description: "Your solution was submitted." }); // tone: "info" (default) | "ok" | "err"
toast({ tone: "err", title: "Submit failed", duration: 0 }); // duration ms, default 5000; 0 = sticky
toast.dismiss(id);
```

`err` toasts use `role="alert"`, and the others use `role="status"`. A card shows a label-step tone name (Info, Done or Error), the title in bold small type, the description in muted small type and a "Dismiss notification" IconButton. `ToastCard` (`tone`, `title`, `description`, `onDismiss`) is the static card, for `/__ds` and inline previews. Toast replaces `ui/app-toast` and the Store toast; don't add new uses of those.

### 6.5 Navigation

**`Tabs`** is hand-rolled WAI-ARIA tabs with a roving tabindex. Arrow Left and Right (Up and Down when vertical), Home and End move focus, and the focused tab activates automatically.

| Export | Props (default) |
|---|---|
| `Tabs` | `value`, `defaultValue`, `onValueChange`, `variant` `"underline"\|"segmented"` (`"underline"`), `orientation` `"horizontal"\|"vertical"` (`"horizontal"`) |
| `TabsList` | `aria-label` (give one) |
| `TabsTrigger` | `value`, `disabled` |
| `TabsContent` | `value`, `forceMount` (`false`) |

- `underline` is for page sections. The active tab gets a 2px `--accent-ink` rule, and the list scrolls horizontally on overflow.
- `segmented` is for filters. The active tab is the accent fill with `--accent-edge`, and the triggers are 28px.

**`Breadcrumb`** takes `items: { label, to? }[]` (default `[]`). It renders `<nav aria-label="Breadcrumb">` in label type with `/` separators. The last item carries `aria-current="page"` and `text-fg`. Earlier items with `to` render as `<Link>`s, and those links must point at real parent routes, never `navigate(-1)`.

### 6.6 Data

| Export | Props (default) | Notes |
|---|---|---|
| `Table` | `zebra` (`true`), `wrapperClassName` | A bordered wrapper with `overflow-x-auto`. Small Mono type with tabular nums. Even body rows are `bg-elevated/50`. |
| `TableHead` / `TableBody` | — | The head is `bg-surface`. |
| `TableRow` | `interactive` | Hairline bottom rule. `interactive` adds a pointer and `ds-hover:bg-elevated`. |
| `TableHeaderCell` | `align` `left\|right\|center` (`"left"`) | `scope="col"`, 36px, micro type, `--fg-muted` |
| `TableCell` | `align` (`"left"`) | 40px. Right-align numbers. |
| `ListRow` | `as` (`"div"`), `leading`, `title`, `meta`, `trailing`, `interactive` (`false`), `children` | Minimum height 48px. Body-type title, small muted meta. |
| `Stat` | `label`, `value`, `delta`, `deltaTone` `ok\|err\|neutral` (auto: a leading `-` or `−` gives `err`, otherwise `ok`), `hint`, `size` `md\|lg` (`"md"`) | Mono 700 value at `text-h2` (`lg` uses `text-h1`). No rings or donuts. |
| `Progress` | `value` (omit for indeterminate), `max` (`100`), `label` (becomes `aria-label`; give one) | A 4px `--elevated` track with an `--accent` fill and `--accent-edge`. |
| `Avatar` | `name`, `src`, `alt`, `size` `sm` 28 \| `md` 36 \| `lg` 44 (`"md"`) | Square. Falls back to up to two initials when the image fails to load. |
| `Skeleton` | `className` (set height and width) | A static `--elevated` block, `aria-hidden`, with no shimmer. |

```jsx
<Table><TableHead><TableRow><TableHeaderCell>Player</TableHeaderCell><TableHeaderCell align="right">XP</TableHeaderCell></TableRow></TableHead>
  <TableBody><TableRow><TableCell>Ada</TableCell><TableCell align="right">1,240</TableCell></TableRow></TableBody></Table>
```

### 6.7 States

All states share one box: `--surface` with a border, `px-6 py-12`, centred, a 20px icon, an h3 Mono `<h2>` title, a body `--fg-muted` description (max 48ch) and a button row.

| Export | Props (default) | Notes |
|---|---|---|
| `EmptyState` | `icon` (`Inbox`), `title`, `description`, `action` (node) | For zero results or no data yet. |
| `ErrorState` | `title` (`"Something went wrong"`), `description`, `onRetry` (shows a secondary "Retry"), `action` | `role="alert"`, `--err` icon |
| `OfflineState` | `title`, `description` (both have the defaults below), `onRetry` (shows a primary "Retry"), `visualizersHref` (`"/visualizers"`) | `role="alert"`, a `WifiOff` icon in `--warn`, and an "Open visualizers" secondary link button |
| `PageLoader` | `label` (`"LOADING_"`) | `role="status"`. A 2px `--accent-ink` indeterminate bar fixed under the nav (`top-[var(--nav-h)]`, `z-nav`), plus the label inside the container. |

OfflineState copy, exactly:
- title: `Can't reach the Vantage API`
- description: `The server is not responding, so this page can't load its data. Check your connection and retry. The visualizers run in your browser and keep working offline.`

### 6.8 Page shell

| Export | Props (default) | Notes |
|---|---|---|
| `PageShell` | `narrow` (`false`; 768px instead of 1200px), `as` (`"main"`), `id` (`"main"`), `containerClassName` | `px-[var(--gutter)] pb-16 pt-[calc(var(--nav-h)+32px)]` with a centred container. Use the narrow variant for forms, lobbies and auth. |
| `PageHeader` | `eyebrow` (label type, `--accent-ink`), `title` (renders **the page's `<h1>`** in `font-display text-h1 uppercase`), `description` (body, `--fg-muted`, max 64ch), `actions`, `breadcrumb` (node, usually `<Breadcrumb>`) | `mb-8 pb-8 border-b`. One `<em>` word in the title renders upright in `--accent-ink`. |

**Navbar** (`src/components/layout/Navbar.jsx`) is app shell. `App.jsx` mounts it (props `allowTransparency`, `controls`) everywhere except `NAVBAR_HIDDEN_PATHS`, which includes `/__ds`. Pages never render it.
**Footer:** not built in this run (no `src/components/layout/Footer.jsx`). When it lands it will be shell too, mounted by `App.jsx`, not by pages.

## 7. Page template

```jsx
import { PageShell, PageHeader, Breadcrumb, Button, OfflineState, ErrorState, EmptyState, PageLoader } from "@/components/ds";

export default function ProblemsPage() {
  const { data, error, offline, loading, reload } = useProblems(); // your data hook
  return (
    <PageShell>
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Problems" }]} />}
        eyebrow="Practice" title={<>Problem <em>set</em></>}
        description="Short sentence-case summary." actions={<Button variant="primary">New</Button>} />
      {loading ? <PageLoader /> : offline ? <OfflineState onRetry={reload} />
        : error ? <ErrorState description={error.message} onRetry={reload} />
        : data.length === 0 ? <EmptyState title="No problems yet" description="…" />
        : <Content items={data} />}
    </PageShell>
  );
}
```

Rules:
- Each page has exactly one `<h1>`, and it comes from `PageHeader`. Inside the page, sections use `font-display text-h2 uppercase` `<h2>`s and cards use `font-mono text-h3` `<h3>`s.
- Every API call has an explicit failure path.
  - A network failure (no response, `TypeError: Failed to fetch`, ECONNREFUSED) gets `OfflineState`.
  - A non-2xx response gets `ErrorState`.
  - An empty array gets `EmptyState`.
  - Never leave a blank page, an `alert()` or a raw stack trace.
- Routes are `React.lazy`. As of this writing, the `<Suspense>` fallback in `App.jsx` is still the legacy inline "Loading...", which App-shell work replaces with `<PageLoader />`. Don't add per-page Suspense spinners.
- Pages don't render a Footer or Navbar, and set no top offsets of their own; `PageShell` owns the nav offset.

**List or table page recipe.** `PageShell` → `PageHeader` (actions: a primary CTA) → a filter row (`Tabs variant="segmented"` and/or `Input` with `Select`, `flex flex-wrap gap-3`, `mb-6`) → `Panel padded={false}` holding a `Table`, or a `ListRow` list → the empty and error states above. Show counts with `Badge` or `Stat`, and align numbers right.

**Marketing page recipe (home, about).**
- Allowed: one `text-display` hero and full-bleed sections that keep the `--gutter` side padding and the `--container` max width.
- Section rhythm: `py-16`, or `py-12` below `md`, with an `h2` per section.
- A final CTA slab may be an accent fill and must carry `border-accent-edge`.
- Use at most one entrance animation (§4) and no decorative loops.

**Responsive rules.**
- Design at 390, 768, 1280 and 1440.
- Grids collapse as `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (or `lg:grid-cols-4` for stat rows).
- Two-pane layouts (sidebar plus content) stack below `lg`.
- PageHeader actions wrap under the title by default.
- Tables scroll inside their wrapper, never the page.
- Underline tab lists scroll horizontally.
- Dialogs are `100vw-32px` wide on phones, and the mobile nav is a right `Sheet`.
- No horizontal page scroll at 390.

**Focus and keyboard.**
- Every interactive element is reachable by Tab and shows the 2px `--focus` outline with 2px offset. Never set `outline: none` without a replacement.
- Never use box-shadow rings.
- Use native `<button>`/`<a>`, not `div onClick`. A clickable card is `Panel variant="interactive" as={Link}`.
- Overlays come from ds, which gives Esc, focus trap and focus return.
- Composite widgets (Tabs, RadioGroup, SegmentedInput) are one Tab stop with arrow-key navigation.

**Known issue.** `public/index.html` renders `<main id="root">`, so `PageShell`'s `<main id="main">` nests a second `main` landmark. Change the root element to `<div id="root">` in the index.html or shell unit; don't work around it in pages.

## 8. Theming mechanics

- `ThemeProvider` (`src/components/common/ThemeProvider.jsx`) is mounted once in `App.jsx`, around `TooltipProvider`.
  - `useTheme()` returns `{ theme, resolvedTheme, setTheme }`.
  - `theme` is `"dark" | "light" | "system"` (default `"system"`), and `resolvedTheme` is `"dark" | "light"`.
  - `setTheme(next)` persists the choice to `localStorage["vantage-theme"]` (`THEME_STORAGE_KEY`).
  - In `"system"` mode it follows `prefers-color-scheme` live (a `matchMedia` listener).
  - It applies the theme in a layout effect: the `dark` or `light` class on `<html>` plus `style.colorScheme`.
- **Pre-paint script** (`public/index.html` `<head>`): it reads `vantage-theme` and, if that is not `dark` or `light`, falls back to `prefers-color-scheme`, then sets the same `<html>` class and `colorScheme` before React loads, so there is no flash. The same `<head>` holds `<meta name="theme-color">` per scheme (`#09090B` / `#F4F4F0`). Keep the script and the provider logic in sync.
- **Never** read the theme from `localStorage` or `prefers-color-scheme` yourself. Never write `dark:` variants for ds tokens either, since the tokens already switch.
- **Canvas and imperative code** use `import { rgba, rgb, cssVar, toRgb, rgbString, getThemeTokens, currentTheme, subscribeTheme } from "@/lib/canvasTheme"`.
  - Read inside the draw loop: `ctx.fillStyle = rgba('fg', 0.4)` or `rgba('accent-ink', 1)`. The cache is keyed on the `<html>` class, so a toggle applies on the next frame without a remount.
  - `subscribeTheme(cb)` returns an unsubscribe function, for redrawing a static canvas on toggle.
  - There are dark fallbacks for jsdom.
- **React-side values:** `useThemeTokens()` (`@/hooks/useThemeTokens`) returns the full snapshot (keys in §2 plus `theme` and `rgb`) and re-renders on toggle. Use it for chart libraries, the cobe globe and similar code. Use the `canvasTheme` helpers for per-frame loops.
- **Monaco** (`@/lib/monacoThemes`): `defineVantageThemes(monaco, tokens)` registers `vantage-dark` and/or `vantage-light` from a snapshot (or `{ dark, light }`) and returns the theme name. `vantageThemeName(theme)` and `buildVantageTheme(t)` are also exported. Keywords use `accentInk`; everything else is mono greys.
  ```jsx
  const tokens = useThemeTokens();
  <Editor beforeMount={(m) => defineVantageThemes(m, tokens)} theme={vantageThemeName(tokens.theme)} />
  useEffect(() => { if (monacoRef.current) monacoRef.current.editor.setTheme(defineVantageThemes(monacoRef.current, tokens)); }, [tokens]);
  ```
- **`/__ds` preview** (`src/pages/ds/DsPage.jsx`, a lazy route that is not linked and has no Navbar):
  - It renders every primitive in the sections Actions, Forms, Containers, Overlays, Navigation, Data and States (`src/pages/ds/sections/*`, with `Section` and `Demo` helpers).
  - Hover and focus states are forced statically with `data-force="hover|focus"`.
  - For screenshots, open `/__ds`, capture, click the header `ThemeToggle` (`[data-theme-toggle]`) and capture again.
  - A new primitive gets a demo here in its design-system unit.

## 9. Enforcement and tooling

- **`scripts/check-ui.mjs`: not built in this run.** The §3.10 rules (colour literals, radius, gradients, shadows and blur, text under 10px, `cursor-none`, banned imports, a 900 weight on non-Monument fonts, more than one `<h1>`, emoji) are still the review checklist. Reviewers grep for them by hand.
- **Demo-data mode (`REACT_APP_DEMO=1`, `BUILD_PATH=build-demo`, `src/demo/`): not built in this run.**
- **`scripts/contrast.mjs`:** `cd reactapp && node scripts/contrast.mjs`.
  - It parses both token blocks in `tokens.css`, composites the rgba text tokens over each background and checks WCAG 2.x against 4.5:1. The pairs are every text token on `bg`, `surface` and `elevated`, `on-accent` on `accent`, and each status colour on its own `-soft` tint over `surface`.
  - It exits 1 on any failure and never edits tokens.
  - Current output, verbatim:

```
Contrast (WCAG 2.x) from src/styles/tokens.css, minimum 4.5:1

theme  pair                          ratio    result
------------------------------------------------------
dark   fg on bg                      18.24    pass
dark   fg-muted on bg                8.70     pass
dark   fg-dim on bg                  5.69     pass
dark   accent-ink on bg              18.09    pass
dark   ok on bg                      10.35    pass
dark   warn on bg                    11.92    pass
dark   err on bg                     7.19     pass
dark   info on bg                    13.73    pass
dark   viz-write on bg               10.78    pass
dark   fg on surface                 17.54    pass
dark   fg-muted on surface           8.57     pass
dark   fg-dim on surface             5.68     pass
dark   accent-ink on surface         17.40    pass
dark   ok on surface                 9.95     pass
dark   warn on surface               11.46    pass
dark   err on surface                6.92     pass
dark   info on surface               13.20    pass
dark   viz-write on surface          10.37    pass
dark   fg on elevated                16.54    pass
dark   fg-muted on elevated          8.31     pass
dark   fg-dim on elevated            5.60     pass
dark   accent-ink on elevated        16.41    pass
dark   ok on elevated                9.39     pass
dark   warn on elevated              10.81    pass
dark   err on elevated               6.52     pass
dark   info on elevated              12.45    pass
dark   viz-write on elevated         9.77     pass
dark   on-accent on accent           18.09    pass
dark   ok on ok-soft/surface         7.84     pass
dark   warn on warn-soft/surface     8.77     pass
dark   err on err-soft/surface       5.76     pass
dark   info on info-soft/surface     9.82     pass
light  fg on bg                      17.95    pass
light  fg-muted on bg                6.30     pass
light  fg-dim on bg                  4.75     pass
light  accent-ink on bg              5.35     pass
light  ok on bg                      4.97     pass
light  warn on bg                    4.94     pass
light  err on bg                     5.87     pass
light  info on bg                    4.92     pass
light  viz-write on bg               6.44     pass
light  fg on surface                 19.79    pass
light  fg-muted on surface           6.55     pass
light  fg-dim on surface             4.88     pass
light  accent-ink on surface         5.90     pass
light  ok on surface                 5.48     pass
light  warn on surface               5.45     pass
light  err on surface                6.47     pass
light  info on surface               5.43     pass
light  viz-write on surface          7.10     pass
light  fg on elevated                16.55    pass
light  fg-muted on elevated          6.10     pass
light  fg-dim on elevated            4.63     pass
light  accent-ink on elevated        4.93     pass
light  ok on elevated                4.59     pass
light  warn on elevated              4.56     pass
light  err on elevated               5.41     pass
light  info on elevated              4.54     pass
light  viz-write on elevated         5.94     pass
light  on-accent on accent           18.09    pass
light  ok on ok-soft/surface         4.76     pass
light  warn on warn-soft/surface     4.76     pass
light  err on err-soft/surface       5.46     pass
light  info on info-soft/surface     4.73     pass

Summary: 64/64 pairs pass; lowest 4.54:1 (light info on elevated).
```

Light-mode status text on `--elevated` (4.54–4.59) sits right at the floor. Don't put status text on `elevated` at reduced opacity, and don't put it on any other fill.

- **`scripts/route-smoke.mjs`** (headless Playwright, no screenshots):
  - It serves a production build with an SPA fallback and derives every route from `src/App.jsx`, `src/routes/index.jsx` and `src/routes/config.js`.
  - It visits each route at 1280×800 in each theme and asserts four things: no `pageerror`, the `dark`/`light` class on `<html>`, a visible `<h1>` with width > 0, and `[data-legacy-viz]` or `[data-viz-stage]` on visualizer routes.
  - Usage: `node scripts/route-smoke.mjs [--build build] [--routes <substring>] [--themes dark,light] [--json <path>] [--concurrency 8]` (`-h` prints the usage). The env var `PLAYWRIGHT_PATH` overrides the `playwright` import.
  - It exits 1 on any failed check, or when fewer than 130 visualizer routes are found. It needs an existing build (`npm run build`).

## 10. Do / Don't

- Do import UI from `@/components/ds` only. Don't import `@/components/ui/*` (legacy shadcn copies) or `ui/app-toast` in pages.
- Do use token classes (`bg-surface`, `text-fg-muted`, `border-border`). Don't write hex, `rgb()` or `hsl()` literals, `bg-gray-*`/`text-white`/`zinc-*`, the `theme-*` classes or the legacy `--color-*` variables.
- Do put `border-accent-edge` on every `bg-accent` fill. Don't use `text-accent` or `border-accent` for text or lines; use `text-accent-ink` and `border-accent-ink`.
- Do keep status colours for meaning. Don't use `ok`/`warn`/`err`/`info` (or `viz-write`) as decoration, section colours or per-topic colours.
- Do use `PageShell` + `PageHeader` on every page. Don't add your own top padding for the nav, your own container widths or a second `<h1>`.
- Do write type as `font-mono text-body` or `font-display text-h2 uppercase` (or `TYPE.*` inline). Don't set raw `fontSize`/`fontWeight` values, sizes below 10px or `fontWeight: 900`.
- Do use spacing steps 1/2/3/4/6/8/12/16. Don't use off-grid values (`p-5`, `gap-[13px]`, `mt-7`).
- Do keep everything square. Don't add `rounded-*` (except `rounded-none`), `borderRadius`, or `data-shape="round"` outside graph or tree nodes and radios.
- Don't use shadows, `text-shadow`, `backdrop-blur`, gradients or glows. Do create depth with `--surface` on `--bg` plus a 1px border.
- Do use `z-raised`…`z-tooltip`. Don't use `z-[999]` or any z-index above 70.
- Do use `IconButton` with `aria-label` and a `Tooltip` for icon-only controls. Don't use a bare `<svg onClick>` or a `div` button.
- Do use Lucide at 14/16/20 with stroke 1.5. Don't use `@mui`, `react-icons` or `@tabler`, or other sizes.
- Do animate with GSAP and check `useReducedMotion()`/`prefersReducedMotion()`. Don't use framer-motion or motion, hover scale, tilt, parallax or infinite decorative loops.
- Do show loading with `PageLoader`, `Button loading`, `Progress` or `Skeleton`. Don't use spinners.
- Do handle failures with `OfflineState`/`ErrorState`/`EmptyState` and confirm with `toast()`. Don't use `alert()`, `confirm()` (use a `Dialog`) or a blank screen.
- Do give every form control a visible `label` and show errors through its `error` prop. Don't use placeholder-only labels.
- Do read colours in canvas code through `canvasTheme` (`rgba('fg', .4)`) inside the draw loop. Don't cache colours at module load or hard-code `"rgba(255,255,255,"`.
- Do use `useTheme()` to read or set the theme. Don't touch `<html>` classes or `localStorage["vantage-theme"]` directly.
- Do write sentence case in prose and UPPER only via `uppercase` on label, micro and display steps, and say "Vantage". Don't use emoji, exclamation marks or Title Case Buttons.
- Do mount nothing global: `TooltipProvider` and `Toaster` are already in `App.jsx`. Don't mount a second provider or toaster.
- Do link breadcrumbs to real parent routes. Don't use `navigate(-1)`.
- Do use tabular numbers and right-aligned numeric columns. Don't use proportional figures in stats or tables.

## 11. Change control

- This file and `src/components/ds/**`, `src/styles/**` and `tailwind.config.js` are **frozen** as of Phase 1. From Phase 2 on, this file outranks POLISH_PLAN §3 wherever they differ.
- A missing primitive, variant or token needs its own design-system unit. That unit adds it to `ds/`, gives it a `/__ds` demo, updates this file and re-runs `contrast.mjs` (if it touches tokens), all before any page uses it. Never build a primitive inline in a page or fork a ds component locally.
- The design-system owner (the human) changes token values; tools report failures but never change values. The planned retirements are:
  - the Monument shim (§3), at the end of Phases 4/5
  - `[data-legacy-viz]` and `LegacyVizRoot`, at the end of Phase 5
  - the legacy `--color-*`, `theme-*`, `ZINC_LIGHT_SCOPE_PATHS` and `MAP_DARK_LOCK_PATHS`, at the end of Phase 5
  - `src/components/ui/*`, when the last importer migrates
