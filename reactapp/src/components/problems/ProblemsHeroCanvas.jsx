/**
 * ProblemsHeroCanvas: decorative hero visual for /problems. An insertion sort
 * runs forever over a row of bars. Colours come from canvasTheme per frame
 * (accent for the sorted run, fg for the rest), so a theme toggle repaints on
 * the next frame. The loop pauses off-screen and under prefers-reduced-motion
 * (a static, half-sorted frame is drawn instead).
 */
import React, { useEffect, useRef } from "react";
import { rgba } from "@/lib/canvasTheme";

const N = 28;
const STEP_MS = 90;

const shuffled = () => {
  const a = Array.from({ length: N }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function ProblemsHeroCanvas({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let arr = shuffled();
    let i = 1;
    let j = 1;
    let hold = 0;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let visible = true;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const pad = 16;
      const gap = 3;
      const bw = (w - pad * 2 - gap * (N - 1)) / N;
      const base = h - pad;
      const maxH = h - pad * 2;
      ctx.fillStyle = rgba("border", 1);
      ctx.fillRect(pad, base, w - pad * 2, 1);
      for (let k = 0; k < N; k++) {
        const bh = (arr[k] / N) * maxH;
        const x = pad + k * (bw + gap);
        if (k === j && i < N) ctx.fillStyle = rgba("accent", 1);
        else if (k < i) ctx.fillStyle = rgba("accent", 0.55);
        else ctx.fillStyle = rgba("fg", 0.28);
        ctx.fillRect(x, base - bh - 2, bw, bh);
      }
    };

    const step = () => {
      if (i >= N) {
        hold += 1;
        if (hold > 14) { arr = shuffled(); i = 1; j = 1; hold = 0; }
        return;
      }
      if (j > 0 && arr[j - 1] > arr[j]) {
        [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
        j -= 1;
      } else {
        i += 1;
        j = i;
      }
    };

    const frame = (t) => {
      raf = 0;
      if (!visible) return;
      if (t - last >= STEP_MS) { last = t; step(); }
      draw();
      raf = requestAnimationFrame(frame);
    };

    resize();
    if (reduce) {
      arr.sort((a, b) => a - b);
      i = Math.floor(N / 2); j = i;
      draw();
    }

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);

    let io;
    if (!reduce) {
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      });
      io.observe(canvas);
    }

    /* repaint reduced-motion frame on theme toggle */
    const mo = new MutationObserver(() => { if (reduce) draw(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io?.disconnect(); mo.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Animation of an insertion sort running over a row of bars"
      className={className}
    />
  );
}
