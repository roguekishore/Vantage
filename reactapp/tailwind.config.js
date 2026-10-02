/** @type {import('tailwindcss').Config} */
const typeScale = require('./src/styles/typeScale.json');

// Design-system colours (POLISH_PLAN §3.1/§3.2) read src/styles/tokens.css.
// Solid tokens use their `--*-rgb` triplet so opacity modifiers work
// (`bg-accent/50` -> rgb(var(--accent-rgb) / 0.5)). Translucent tokens
// (border, fg-muted, fg-dim, *-soft) are already rgba and take no modifier.
const rgb = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

// Type scale -> Tailwind fontSize ([size, { lineHeight, letterSpacing, fontWeight }]).
// Case (UPPER for display/h1/h2/label/micro) is applied with `uppercase`.
const fontSize = Object.fromEntries(
  Object.entries(typeScale.scale).map(([step, t]) => [
    step,
    [t.fontSize, { lineHeight: t.lineHeight, letterSpacing: t.letterSpacing, fontWeight: t.fontWeight }],
  ])
);

module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // font-mono: JetBrains Mono (body/UI), font-display: Monument Extended.
      // @font-face rules ship with the fonts unit (1.2).
      fontFamily: {
        mono: typeScale.fonts.mono,
        display: typeScale.fonts.display,
        inter: ["Inter", "sans-serif"],
        general: ["general", "sans-serif"],
        zentry: ["zentry", "sans-serif"],
      },
      // Type steps: text-display | text-h1 | text-h2 | text-h3 | text-body |
      // text-small | text-label | text-micro (no text below 10px).
      fontSize,
      // Spacing: Tailwind defaults are kept so legacy classes keep working.
      // New code uses only the §3.5 steps: 1 (4px), 2 (8px), 3 (12px),
      // 4 (16px), 6 (24px), 8 (32px), 12 (48px), 16 (64px).
      // Breakpoints: Tailwind defaults only (sm 640, md 768, lg 1024,
      // xl 1280, 2xl 1536); no custom `screens`.
      // z-index scale (§3.5): z-base … z-tooltip. Above 70 is a bug.
      zIndex: {
        base: 'var(--z-base)',
        raised: 'var(--z-raised)',
        sticky: 'var(--z-sticky)',
        nav: 'var(--z-nav)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
      colors: {
        // ---------------------------------------------------------------
        // Design system (tokens.css). Class names mirror token names:
        //   bg-bg  bg-surface  bg-elevated
        //   text-fg  text-fg-muted  text-fg-dim
        //   border-border  border-border-strong
        //   bg-accent  text-on-accent  border-accent-edge  text-accent-ink
        //   bg-accent-soft  outline-focus
        //   text-ok|warn|err|info  bg-ok-soft|warn-soft|err-soft|info-soft
        //   text-viz-write
        // None of these names were in use before (grep src/, 2026-10-02).
        // `accent` is the acid accent. shadcn's old hover fill (also called
        // accent) is gone: ui/* hover fills use bg-elevated. The legacy
        // accent-primary* (purple) classes live under the same key below.
        // ---------------------------------------------------------------
        bg: rgb('bg'),
        surface: rgb('surface'),
        elevated: rgb('elevated'),
        fg: {
          DEFAULT: rgb('fg'),
          muted: 'var(--fg-muted)',
          dim: 'var(--fg-dim)',
        },
        border: {
          DEFAULT: 'var(--border)', // also shadcn's border colour
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: rgb('accent'),
          foreground: rgb('on-accent'), // shadcn name for text on accent
          edge: rgb('accent-edge'),
          ink: rgb('accent-ink'),
          soft: 'var(--accent-soft)',
          // Legacy purple (index.css --color-accent-primary*); retired in later phases.
          primary: 'var(--color-accent-primary)',
          'primary-hover': 'var(--color-accent-primary-hover)',
          'primary-light': 'var(--color-accent-primary-light)',
        },
        'on-accent': rgb('on-accent'),
        focus: rgb('focus'),
        ok: { DEFAULT: rgb('ok'), soft: 'var(--ok-soft)' },
        warn: { DEFAULT: rgb('warn'), soft: 'var(--warn-soft)' },
        err: { DEFAULT: rgb('err'), soft: 'var(--err-soft)' },
        info: { DEFAULT: rgb('info'), soft: 'var(--info-soft)' },
        brand: {
          primary: "#2563eb", // Electric Blue
          secondary: "#7c3aed", // Purple
        },
        zinc: {
          950: "#09090b",
        },
        // Zentry color palette
        blue: {
          50: "#DFDFF0",
          75: "#DFDFF2",
          100: "#F0F2FA",
          200: "#010101",
          300: "#4FB7DD",
        },
        violet: {
          300: "#5724FF",
        },
        yellow: {
          100: "#8E983F",
          300: "#EDFF66",
        },
        // Shadcn UI color mappings
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        input: 'var(--input)',
        ring: 'var(--ring)',
        // Theme-aware colors using CSS variables
        theme: {
          'bg-primary': 'var(--color-bg-primary)',
          'bg-secondary': 'var(--color-bg-secondary)',
          'bg-tertiary': 'var(--color-bg-tertiary)',
          'bg-elevated': 'var(--color-bg-elevated)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-tertiary': 'var(--color-text-tertiary)',
          'text-muted': 'var(--color-text-muted)',
          'border-primary': 'var(--color-border-primary)',
          'border-secondary': 'var(--color-border-secondary)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          light: 'var(--color-success-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
          light: 'var(--color-warning-light)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
          light: 'var(--color-danger-light)',
        },
        // Additional accent colors
        purple: {
          DEFAULT: 'var(--color-purple)',
          hover: 'var(--color-purple-hover)',
          light: 'var(--color-purple-light)',
        },
        orange: {
          DEFAULT: 'var(--color-orange)',
          hover: 'var(--color-orange-hover)',
          light: 'var(--color-orange-light)',
        },
        teal: {
          DEFAULT: 'var(--color-teal)',
          hover: 'var(--color-teal-hover)',
          light: 'var(--color-teal-light)',
        },
        pink: {
          DEFAULT: 'var(--color-pink)',
          hover: 'var(--color-pink-hover)',
          light: 'var(--color-pink-light)',
        },
        // Visualization colors
        viz: {
          current: 'var(--color-viz-current)',
          found: 'var(--color-viz-found)',
          visited: 'var(--color-viz-visited)',
          comparing: 'var(--color-viz-comparing)',
          sorted: 'var(--color-viz-sorted)',
          default: 'var(--color-viz-default)',
          write: rgb('viz-write'), // §3.2 design-system token
        },
        // Code syntax colors
        code: {
          keyword: 'var(--color-code-keyword)',
          string: 'var(--color-code-string)',
          number: 'var(--color-code-number)',
          comment: 'var(--color-code-comment)',
          function: 'var(--color-code-function)',
          variable: 'var(--color-code-variable)',
          type: 'var(--color-code-type)',
        },
      },
      backgroundColor: {
        'theme-primary': 'var(--color-bg-primary)',
        'theme-secondary': 'var(--color-bg-secondary)',
        'theme-tertiary': 'var(--color-bg-tertiary)',
        'theme-elevated': 'var(--color-bg-elevated)',
      },
      textColor: {
        'theme-primary': 'var(--color-text-primary)',
        'theme-secondary': 'var(--color-text-secondary)',
        'theme-tertiary': 'var(--color-text-tertiary)',
        'theme-muted': 'var(--color-text-muted)',
      },
      borderColor: {
        'theme-primary': 'var(--color-border-primary)',
        'theme-secondary': 'var(--color-border-secondary)',
        'theme-muted': 'var(--color-text-muted)',
      },
      gradientColorStops: {
        'theme-primary': 'var(--color-bg-primary)',
        'theme-secondary': 'var(--color-bg-secondary)',
        'theme-tertiary': 'var(--color-bg-tertiary)',
        'theme-elevated': 'var(--color-bg-elevated)',
        'theme-muted': 'var(--color-text-muted)',
        'success': 'var(--color-success)',
        'success-hover': 'var(--color-success-hover)',
        'warning': 'var(--color-warning)',
        'warning-hover': 'var(--color-warning-hover)',
        'danger': 'var(--color-danger)',
        'danger-hover': 'var(--color-danger-hover)',
        'orange': 'var(--color-orange)',
        'orange-hover': 'var(--color-orange-hover)',
        'purple': 'var(--color-purple)',
        'purple-hover': 'var(--color-purple-hover)',
        'pink': 'var(--color-pink)',
        'pink-hover': 'var(--color-pink-hover)',
        'teal': 'var(--color-teal)',
        'teal-hover': 'var(--color-teal-hover)',
        'accent-primary': 'var(--color-accent-primary)',
        'accent-primary-hover': 'var(--color-accent-primary-hover)',
      },
      ringColor: {
        'accent-primary': 'var(--color-accent-primary)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'danger': 'var(--color-danger)',
        'purple': 'var(--color-purple)',
      },
      boxShadowColor: {
        'accent-primary': 'var(--color-accent-primary)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'danger': 'var(--color-danger)',
        'orange': 'var(--color-orange)',
        'purple': 'var(--color-purple)',
      },
      // Radius: the global reset in tokens.css zeroes everything, and
      // shadcn's --radius is 0, so these resolve to 0 as well.
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
      },
      animation: {
        shine: 'shine var(--duration, 14s) infinite linear',
      },
    },
  },
  plugins: [],
}
