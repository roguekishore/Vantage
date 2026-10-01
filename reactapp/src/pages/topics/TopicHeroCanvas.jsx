/**
 * TopicHeroCanvas: decorative hero visuals for the Visualizers hub and the
 * topic pages. Colours come from canvasTheme per frame (accent + fg only), so
 * a theme toggle repaints on the next frame. The loop pauses off-screen and
 * is replaced by a single static frame under prefers-reduced-motion.
 *
 *  variant="tree"  breadth-first walk over a binary tree (hub hero)
 *  variant="scan"  accent sweep across bars seeded from `seed` (topic hero)
 */
import React, { useEffect, useRef } from "react";
import { rgba } from "@/lib/canvasTheme";

const DEPTH = 4; // levels in the tree: 1 + 2 + 4 + 8 = 15 nodes
const TREE_STEP_MS = 420;
const BARS = 32;
const SCAN_MS = 70;

const hashSeed = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

const heightsFor = (seed) => {
  let x = hashSeed(String(seed)) || 1;
  return Array.from({ length: BARS }, () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return 0.2 + 0.8 * ((x % 1000) / 1000);
  });
};

export default function TopicHeroCanvas({ variant = "tree", seed = "topic", className, label }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const heights = heightsFor(seed);
    const nodeCount = (1 << DEPTH) - 1;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let tick = reduce ? (variant === "tree" ? 9 : Math.floor(BARS / 2)) : 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawTree = () => {
      const padX = 28;
      const padY = 28;
      const pos = [];
      for (let d = 0; d < DEPTH; d++) {
        const n = 1 << d;
        for (let k = 0; k < n; k++) {
          pos.push({
            x: padX + ((k + 0.5) / n) * (w - padX * 2),
            y: padY + (d / (DEPTH - 1)) * (h - padY * 2),
          });
        }
      }
      const visited = tick % (nodeCount + 6); // BFS order == array order; hold briefly when full
      ctx.lineWidth = 1;
      for (let i = 1; i < nodeCount; i++) {
        const p = pos[(i - 1) >> 1];
        const c = pos[i];
        ctx.strokeStyle = i < visited ? rgba("accent", 0.6) : rgba("fg", 0.22);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      }
      for (let i = 0; i < nodeCount; i++) {
        const { x, y } = pos[i];
        const current = i === visited - 1;
        const done = i < visited;
        const r = current ? 9 : 7;
        ctx.fillStyle = rgba("surface", 1);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.strokeStyle = current ? rgba("accent", 1) : done ? rgba("accent", 0.6) : rgba("fg", 0.35);
        ctx.strokeRect(x - r + 0.5, y - r + 0.5, r * 2 - 1, r * 2 - 1);
        if (done) {
          ctx.fillStyle = current ? rgba("accent", 1) : rgba("accent", 0.4);
          ctx.fillRect(x - r + 3, y - r + 3, r * 2 - 6, r * 2 - 6);
        }
      }
    };

    const drawScan = () => {
      const pad = 16;
      const gap = 3;
      const bw = (w - pad * 2 - gap * (BARS - 1)) / BARS;
      const base = h - pad;
      const maxH = h - pad * 2;
      const head = tick % (BARS + 8);
      ctx.fillStyle = rgba("border", 1);
      ctx.fillRect(pad, base, w - pad * 2, 1);
      for (let k = 0; k < BARS; k++) {
        const bh = heights[k] * maxH;
        const dist = head - k;
        if (dist === 0) ctx.fillStyle = rgba("accent", 1);
        else if (dist > 0 && dist < 6) ctx.fillStyle = rgba("accent", 0.55 - dist * 0.07);
        else ctx.fillStyle = rgba("fg", 0.22);
        ctx.fillRect(pad + k * (bw + gap), base - bh - 2, bw, bh);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (variant === "tree") drawTree();
      else drawScan();
    };

    const interval = variant === "tree" ? TREE_STEP_MS : SCAN_MS;
    const frame = (t) => {
      raf = 0;
      if (!visible) return;
      if (t - last >= interval) { last = t; tick += 1; }
      draw();
      raf = requestAnimationFrame(frame);
    };

    resize();
    draw();

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

    /* repaint the static frame on theme toggle (the loop repaints itself) */
    const mo = new MutationObserver(() => { if (reduce) draw(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io?.disconnect(); mo.disconnect();
    };
  }, [variant, seed]);

  return <canvas ref={ref} role="img" aria-label={label || "Decorative algorithm animation"} className={className} />;
}
