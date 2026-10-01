import { useEffect, useRef } from "react";
import createGlobe from "cobe";

import { cn } from "@/lib/utils";
import { useThemeTokens } from "@/hooks/useThemeTokens";
import { cssVar, toRgb } from "@/lib/canvasTheme";

/*
 * Friends globe (restored from 96004b0). cobe is lazy-loaded with its page:
 * import this module through React.lazy. Colours come from the --globe-*
 * tokens (0..255 triplets divided by 255 for cobe) and the globe is recreated
 * on theme toggle. Rotation pauses off-screen and under reduced motion.
 */

const MOVEMENT_DAMPING = 1400;

const MARKERS = [
  { location: [14.5995, 120.9842], size: 0.03 },
  { location: [19.076, 72.8777], size: 0.1 },
  { location: [23.8103, 90.4125], size: 0.05 },
  { location: [30.0444, 31.2357], size: 0.07 },
  { location: [39.9042, 116.4074], size: 0.08 },
  { location: [-23.5505, -46.6333], size: 0.1 },
  { location: [19.4326, -99.1332], size: 0.1 },
  { location: [40.7128, -74.006], size: 0.1 },
  { location: [34.6937, 135.5022], size: 0.05 },
  { location: [41.0082, 28.9784], size: 0.06 },
];

const channel = (token) => toRgb(token).map((v) => v / 255);
const num = (name, fallback) => {
  const n = parseFloat(cssVar(name));
  return Number.isFinite(n) ? n : fallback;
};

export function Globe({ className }) {
  const canvasRef = useRef(null);
  const tokens = useThemeTokens();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reduced = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phi = 0;
    let drag = null;
    let offset = 0;
    let visible = true;
    let width = canvas.offsetWidth;

    const onResize = () => { width = canvas.offsetWidth; };
    window.addEventListener("resize", onResize);

    const io = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
      : null;
    io?.observe(canvas);

    const globe = createGlobe(canvas, {
      width: width * 2,
      height: width * 2,
      devicePixelRatio: 2,
      phi: 0,
      theta: 0.3,
      dark: num("--globe-dark", 0),
      diffuse: num("--globe-diffuse", 0.4),
      mapSamples: 16000,
      mapBrightness: num("--globe-brightness", 1.2),
      baseColor: channel("globe-base"),
      markerColor: channel("globe-marker"),
      glowColor: channel("globe-glow"),
      markers: MARKERS,
      onRender: (state) => {
        if (visible && !reduced && drag === null) phi += 0.005;
        state.phi = phi + offset;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    const down = (e) => { drag = e.clientX; canvas.style.cursor = "grabbing"; };
    const up = () => { drag = null; canvas.style.cursor = "grab"; };
    const move = (x) => {
      if (drag === null) return;
      offset += (x - drag) / MOVEMENT_DAMPING;
      drag = x;
    };
    const onMouse = (e) => move(e.clientX);
    const onTouch = (e) => e.touches[0] && move(e.touches[0].clientX);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointerout", up);
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("touchmove", onTouch);

    const t = setTimeout(() => { canvas.style.opacity = "1"; }, 0);
    return () => {
      clearTimeout(t);
      globe.destroy();
      io?.disconnect();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointerout", up);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("touchmove", onTouch);
    };
    // tokens identity changes on theme toggle -> recreate with new colours
  }, [tokens]);

  return (
    <div className={cn("absolute inset-0 mx-auto aspect-square w-full", className)}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        style={{ cursor: "grab" }}
      />
    </div>
  );
}

export default Globe;
