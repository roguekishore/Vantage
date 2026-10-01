import * as React from "react";
import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  type CSSProperties,
} from "react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES & INTERFACES
═══════════════════════════════════════════════════════════════════ */

export interface MergeSortStep {
  arr: number[];
  active: number;
  lo: number;
  mid: number;
  hi: number;
}

export interface MergeSortAnimationProps {
  /**
   * Primary accent color for active bars, brackets, and labels.
   * Can be a hex code, rgb/rgba string, or CSS variable name (e.g. "var(--accent-ink)").
   * @default "#EDFF66" (Vantage neon lime)
   */
  accentColor?: string;

  /**
   * Foreground color for baseline, inactive bars, and text.
   * Can be a hex code, rgb/rgba string, or CSS variable.
   * @default "#F5F5F4"
   */
  fgColor?: string;

  /**
   * Optional background fill for the canvas. If "transparent" or omitted,
   * the canvas renders with a transparent background.
   * @default "transparent"
   */
  backgroundColor?: string;

  /**
   * Total number of bars in the generated dataset.
   * Ignored if `initialData` is provided.
   * @default 20
   */
  barCount?: number;

  /**
   * Optional initial array of numbers to sort.
   */
  initialData?: number[];

  /**
   * Delay in milliseconds between algorithm steps (controls sort speed).
   * @default 42 (~24 steps/sec with smooth 60fps height interpolation)
   */
  stepDelayMs?: number;

  /**
   * Delay in milliseconds before restarting after sorting is completed.
   * @default 1600
   */
  restartDelayMs?: number;

  /**
   * Whether the animation automatically restarts in a loop.
   * @default true
   */
  autoRestart?: boolean;

  /**
   * Whether the animation is currently paused.
   * @default false
   */
  paused?: boolean;

  /**
   * Whether to display the bottom "MERGE SORT" label and step counter.
   * @default true
   */
  showLabels?: boolean;

  /**
   * Label text rendered in the bottom-left corner.
   * @default "MERGE SORT"
   */
  label?: string;

  /**
   * Font family for corner labels.
   * @default "'JetBrains Mono', 'Fira Code', ui-monospace, monospace"
   */
  fontFamily?: string;

  /**
   * Optional callback triggered on each sort step.
   */
  onStep?: (stepIndex: number, totalSteps: number, currentArray: number[]) => void;

  /**
   * Optional callback triggered when sorting finishes.
   */
  onComplete?: () => void;

  /**
   * CSS class name for the canvas element.
   */
  className?: string;

  /**
   * Inline style overrides for the canvas element.
   */
  style?: CSSProperties;

  /**
   * Explicit width for the canvas element (e.g. 400, "100%").
   */
  width?: number | string;

  /**
   * Explicit height for the canvas element (e.g. 240, "100%").
   */
  height?: number | string;
}

export interface MergeSortAnimationHandle {
  /** Reset and generate a new sorting sequence */
  reset: () => void;
  /** Pause the animation */
  pause: () => void;
  /** Resume the animation */
  play: () => void;
  /** Step forward one frame/step manually */
  step: () => void;
  /** Get current sorting status */
  getState: () => {
    stepIndex: number;
    totalSteps: number;
    isFinished: boolean;
  };
}

/* ═══════════════════════════════════════════════════════════════════
   SELF-CONTAINED COLOR & MATH UTILITIES
═══════════════════════════════════════════════════════════════════ */

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Resolves any color input (hex, rgb, rgba, css var, or token name) into [r, g, b].
 * Completely self-contained with no external CSS dependencies.
 */
function parseColorToRgb(color: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof window === "undefined" || !color) return fallback;

  let c = color.trim();

  // Handle CSS variable or bare token like "accent-ink" or "var(--accent)"
  if (c.startsWith("var(") || c.startsWith("--") || /^[a-z][a-z-]*$/.test(c)) {
    const varName = c.startsWith("var(")
      ? c.slice(4, -1).trim()
      : c.startsWith("--")
      ? c
      : `--${c}`;

    try {
      const computed = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (computed) {
        c = computed;
      } else {
        // Built-in fallbacks matching Vantage theme tokens
        if (varName.includes("accent")) return [237, 255, 102]; // #EDFF66
        if (varName.includes("fg")) return [245, 245, 244];     // #F5F5F4
        if (varName.includes("bg")) return [9, 9, 11];          // #09090B
      }
    } catch {
      return fallback;
    }
  }

  // Hex: #fff or #ffffff
  if (c.startsWith("#")) {
    let hex = c.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return [r, g, b];
    }
  }

  // RGB/RGBA: "rgb(237, 255, 102)" or "237, 255, 102"
  const nums = c.match(/-?[\d.]+/g);
  if (nums && nums.length >= 3) {
    const r = Math.round(Number(nums[0]));
    const g = Math.round(Number(nums[1]));
    const b = Math.round(Number(nums[2]));
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return [r, g, b];
    }
  }

  return fallback;
}

function toRgba(color: string, alpha: number = 1, fallback: [number, number, number] = [237, 255, 102]): string {
  const [r, g, b] = parseColorToRgb(color, fallback);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Polyfill for roundRect to support older browsers/environments.
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: number | [number, number, number, number] = 0
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radii);
    return;
  }
  const [tl, tr, br, bl] = Array.isArray(radii)
    ? radii
    : [radii, radii, radii, radii];
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

/**
 * Device capability profile to cap DPR and avoid GPU thrashing.
 */
function getDprCap(): number {
  if (typeof window === "undefined") return 1;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const hc = navigator.hardwareConcurrency || 8;
  const dm = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8;
  const lowPower = !!reducedMotion || hc <= 6 || dm <= 4;
  return lowPower ? 1.25 : 1.5;
}

/* ═══════════════════════════════════════════════════════════════════
   MERGE SORT ALGORITHM & STEP GENERATION
═══════════════════════════════════════════════════════════════════ */

const generateRandomArray = (length: number): number[] =>
  Array.from({ length }, () => Math.floor(Math.random() * 80) + 12);

function buildMergeSortSteps(sourceArray: number[]): MergeSortStep[] {
  const steps: MergeSortStep[] = [];
  const arr = [...sourceArray];
  const aux = [...arr];

  const merge = (lo: number, mid: number, hi: number) => {
    let i = lo;
    let j = mid + 1;

    for (let k = lo; k <= hi; k++) {
      aux[k] = arr[k];
    }

    for (let k = lo; k <= hi; k++) {
      if (i > mid) {
        arr[k] = aux[j++];
      } else if (j > hi) {
        arr[k] = aux[i++];
      } else if (aux[j] < aux[i]) {
        arr[k] = aux[j++];
      } else {
        arr[k] = aux[i++];
      }
      steps.push({ arr: [...arr], active: k, lo, mid, hi });
    }
  };

  const sort = (lo: number, hi: number) => {
    if (hi <= lo) return;
    const mid = Math.floor((lo + hi) / 2);
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  };

  sort(0, arr.length - 1);
  return steps;
}

/* ═══════════════════════════════════════════════════════════════════
   PORTABLE MERGE SORT ANIMATION COMPONENT
═══════════════════════════════════════════════════════════════════ */

export const MergeSortAnimation = forwardRef<MergeSortAnimationHandle, MergeSortAnimationProps>(
  (
    {
      accentColor = "#EDFF66",
      fgColor = "#F5F5F4",
      backgroundColor = "transparent",
      barCount = 20,
      initialData,
      stepDelayMs = 42,
      restartDelayMs = 1600,
      autoRestart = true,
      paused = false,
      showLabels = true,
      label = "MERGE SORT",
      fontFamily = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
      onStep,
      onComplete,
      className,
      style,
      width,
      height,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Keep dynamic callback/config references fresh without restarting the loop
    const accentColorRef = useRef(accentColor);
    const fgColorRef = useRef(fgColor);
    const backgroundColorRef = useRef(backgroundColor);
    const stepDelayMsRef = useRef(stepDelayMs);
    const restartDelayMsRef = useRef(restartDelayMs);
    const autoRestartRef = useRef(autoRestart);
    const pausedRef = useRef(paused);
    const showLabelsRef = useRef(showLabels);
    const labelRef = useRef(label);
    const fontFamilyRef = useRef(fontFamily);
    const onStepRef = useRef(onStep);
    const onCompleteRef = useRef(onComplete);

    accentColorRef.current = accentColor;
    fgColorRef.current = fgColor;
    backgroundColorRef.current = backgroundColor;
    stepDelayMsRef.current = stepDelayMs;
    restartDelayMsRef.current = restartDelayMs;
    autoRestartRef.current = autoRestart;
    pausedRef.current = paused;
    showLabelsRef.current = showLabels;
    labelRef.current = label;
    fontFamilyRef.current = fontFamily;
    onStepRef.current = onStep;
    onCompleteRef.current = onComplete;

    // External imperative actions
    const resetTriggerRef = useRef<(() => void) | null>(null);
    const stepForwardRef = useRef<(() => void) | null>(null);
    const getStateRef = useRef<(() => { stepIndex: number; totalSteps: number; isFinished: boolean }) | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => resetTriggerRef.current?.(),
      play: () => { pausedRef.current = false; },
      pause: () => { pausedRef.current = true; },
      step: () => stepForwardRef.current?.(),
      getState: () => getStateRef.current ? getStateRef.current() : { stepIndex: 0, totalSteps: 0, isFinished: false },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (!ctx) return;

      // DPR handling & Canvas scaling
      const dprCap = getDprCap();
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

      const resizeCanvas = () => {
        const offsetW = canvas.offsetWidth;
        const offsetH = canvas.offsetHeight;
        if (!offsetW || !offsetH) return;
        canvas.width = offsetW * dpr;
        canvas.height = offsetH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      resizeCanvas();

      // Native ResizeObserver with debounce
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          resizeCanvas();
        });
        resizeObserver.observe(canvas);
      }

      // Intersection & Page Visibility checking
      let isInView = true;
      let isPageVisible = typeof document !== "undefined" && document.visibilityState !== "hidden";

      let intersectionObserver: IntersectionObserver | null = null;
      if (typeof IntersectionObserver !== "undefined") {
        intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            isInView = !!entry?.isIntersecting;
          },
          { threshold: 0.01 }
        );
        intersectionObserver.observe(canvas);
      }

      const onVisibilityChange = () => {
        isPageVisible = typeof document !== "undefined" && document.visibilityState !== "hidden";
      };
      document.addEventListener("visibilitychange", onVisibilityChange);

      // Reduced motion gate: allow single frame to draw, then hold
      const prefersReduced = () =>
        typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

      let staticRenderDone = false;

      // Internal State
      let arr: number[] = [];
      let steps: MergeSortStep[] = [];
      let stepIdx = 0;
      let state: MergeSortStep = { arr: [], active: -1, lo: -1, mid: -1, hi: -1 };
      let displayH: number[] = [];
      let targetH: number[] = [];
      let restartTimer: ReturnType<typeof setTimeout> | null = null;
      let animId = 0;
      let lastTs = 0;

      const init = () => {
        if (restartTimer) {
          clearTimeout(restartTimer);
          restartTimer = null;
        }
        arr = initialData ? [...initialData] : generateRandomArray(barCount);
        steps = buildMergeSortSteps(arr);
        stepIdx = 0;
        state = { arr: [...arr], active: -1, lo: -1, mid: -1, hi: -1 };
        displayH = arr.map((v) => v);
        targetH = [...displayH];
      };

      init();

      // Expose controls to ref
      resetTriggerRef.current = () => {
        init();
      };

      stepForwardRef.current = () => {
        if (stepIdx < steps.length) {
          state = steps[stepIdx++];
          targetH = [...state.arr];
          displayH = [...state.arr];
          onStepRef.current?.(stepIdx, steps.length, state.arr);
          if (stepIdx === steps.length) {
            onCompleteRef.current?.();
          }
        }
      };

      getStateRef.current = () => ({
        stepIndex: stepIdx,
        totalSteps: steps.length,
        isFinished: stepIdx >= steps.length,
      });

      // Canvas dimensions helpers
      const getW = () => canvas.offsetWidth;
      const getH = () => canvas.offsetHeight;

      // Animation & Render Loop
      const loop = (ts: number) => {
        animId = requestAnimationFrame(loop);

        if (!isInView || !isPageVisible || pausedRef.current) return;

        if (prefersReduced()) {
          if (staticRenderDone) return;
          staticRenderDone = true;
        }

        const W = getW();
        const H = getH();
        if (W === 0 || H === 0) return;

        const COLOR = accentColorRef.current;
        const FG = fgColorRef.current;
        const BG = backgroundColorRef.current;
        const dt = ts - lastTs;

        // Step logic throttled to stepDelayMs, bar heights smoothly lerped at 60fps
        if (dt > stepDelayMsRef.current) {
          lastTs = ts;
          displayH = displayH.map((v, i) => lerp(v, targetH[i] ?? v, 0.2));

          if (stepIdx < steps.length) {
            state = steps[stepIdx++];
            targetH = [...state.arr];
            onStepRef.current?.(stepIdx, steps.length, state.arr);

            if (stepIdx === steps.length) {
              onCompleteRef.current?.();
            }
          } else if (autoRestartRef.current && !restartTimer) {
            restartTimer = setTimeout(() => {
              init();
              restartTimer = null;
            }, restartDelayMsRef.current);
          }
        } else {
          // Sub-frame smooth height interpolation
          displayH = displayH.map((v, i) => lerp(v, targetH[i] ?? v, 0.06));
        }

        // Clear canvas
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Optional background fill
        if (BG && BG !== "transparent") {
          ctx.save();
          ctx.fillStyle = BG;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }

        const { active, lo, mid, hi } = state;
        const count = displayH.length;
        if (count === 0) return;

        const PAD = 8;
        const bw = Math.max(2, (W - PAD * 2) / count - 2);
        const gap = 2;
        const totalW = count * (bw + gap) - gap;
        const startX = (W - totalW) / 2;

        const BOT_PAD = showLabelsRef.current ? 18 : 8;
        const TOP_PAD = 10;
        const maxBarH = Math.max(10, H - BOT_PAD - TOP_PAD);
        const baseY = H - BOT_PAD;
        const maxVal = Math.max(...arr, 1);

        // Highlight active merge region background
        if (lo >= 0 && hi >= 0) {
          const rx1 = startX + lo * (bw + gap);
          const rx2 = startX + hi * (bw + gap) + bw;
          ctx.save();
          ctx.fillStyle = toRgba(COLOR, 0.05, [237, 255, 102]);
          ctx.fillRect(rx1 - 1, TOP_PAD, rx2 - rx1 + 2, maxBarH);
          ctx.restore();

          // Left half tint
          if (mid >= lo && mid < hi) {
            const lx1 = startX + lo * (bw + gap);
            const lx2 = startX + mid * (bw + gap) + bw;
            ctx.save();
            ctx.fillStyle = toRgba(COLOR, 0.06, [237, 255, 102]);
            ctx.fillRect(lx1, TOP_PAD, lx2 - lx1, maxBarH);
            ctx.restore();
          }
        }

        // Draw sorting bars (growing upward from baseY)
        for (let i = 0; i < count; i++) {
          const v = displayH[i] ?? 0;
          const barH = Math.max(2, (v / maxVal) * maxBarH);
          const bx = startX + i * (bw + gap);
          const by = baseY - barH;

          const isActive = i === active;
          const inLeft = lo >= 0 && i >= lo && i <= mid;
          const inRight = lo >= 0 && mid >= 0 && i > mid && i <= hi;

          ctx.save();
          if (isActive) {
            ctx.shadowColor = COLOR;
            ctx.shadowBlur = 16;
          }

          ctx.fillStyle = isActive
            ? COLOR
            : inLeft
            ? toRgba(COLOR, 0.6, [237, 255, 102])
            : inRight
            ? toRgba(COLOR, 0.32, [237, 255, 102])
            : toRgba(FG, 0.1, [245, 245, 244]);

          const r = Math.min(2, bw / 2);
          drawRoundRect(ctx, bx, by, bw, barH, [r, r, 0, 0]);
          ctx.fill();

          // Bright cap line on active bar
          if (isActive) {
            ctx.fillStyle = toRgba(FG, 0.7, [245, 245, 244]);
            ctx.fillRect(bx, by, bw, 1.5);
          }

          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
          ctx.restore();
        }

        // Baseline separator
        ctx.save();
        ctx.strokeStyle = toRgba(FG, 0.1, [245, 245, 244]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX - 4, baseY);
        ctx.lineTo(startX + totalW + 4, baseY);
        ctx.stroke();
        ctx.restore();

        // Merge range bracket below bars
        if (lo >= 0 && hi >= 0) {
          const lx = startX + lo * (bw + gap);
          const rx = startX + hi * (bw + gap) + bw;

          ctx.save();
          ctx.shadowColor = COLOR;
          ctx.shadowBlur = 5;
          ctx.strokeStyle = toRgba(COLOR, 0.5, [237, 255, 102]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lx, baseY + 4);
          ctx.lineTo(rx, baseY + 4);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
          ctx.restore();

          // Midpoint divider dash
          if (mid >= lo && mid < hi) {
            const mx = startX + mid * (bw + gap) + bw;
            ctx.save();
            ctx.strokeStyle = toRgba(COLOR, 0.22, [237, 255, 102]);
            ctx.lineWidth = 0.8;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(mx, baseY + 2);
            ctx.lineTo(mx, TOP_PAD + 4);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }
        }

        // Corner labels
        if (showLabelsRef.current) {
          ctx.save();
          ctx.fillStyle = toRgba(COLOR, 0.6, [237, 255, 102]);
          ctx.font = `700 8px ${fontFamilyRef.current}`;
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(labelRef.current, startX, H - 4);

          ctx.fillStyle = toRgba(COLOR, 0.28, [237, 255, 102]);
          ctx.textAlign = "right";
          ctx.fillText(`${stepIdx}/${steps.length}`, W - startX, H - 4);
          ctx.restore();
        }
      };

      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        if (restartTimer) {
          clearTimeout(restartTimer);
        }
      };
    }, [barCount, initialData]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          width: width ?? "100%",
          height: height ?? "100%",
          display: "block",
          contain: "strict",
          ...style,
        }}
      />
    );
  }
);

MergeSortAnimation.displayName = "MergeSortAnimation";

export default MergeSortAnimation;
