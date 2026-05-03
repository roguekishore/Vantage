/**
 * TopicPage — Vantage full aesthetic overhaul.
 * #09090b base · Monument Extended titles · EDFF66 accents
 * Magnetic MagicCard hover effect preserved · GSAP scroll · particle canvas
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import {
  ArrowLeft, Clock, ChevronRight, Hash, Zap,
  Star, TrendingUp, BookOpen,
} from "lucide-react";
import { problems as PROBLEM_CATALOG } from "../../search/catalog";
import CustomCursor from "@/components/common/CustomCursor";
import { MONUMENT_TYPO as T } from "@/components/common/MonumentTypography";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────
   DIFFICULTY CONFIG
───────────────────────────────────────────────────────── */
const DIFF = {
  Easy: {
    color: "#34d399", glow: "rgba(52,211,153,0.18)",
    bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.22)",
    dot: "#34d399", gradFrom: "#10B981", gradTo: "#34D399",
    bar: "linear-gradient(90deg,#10b981,#34d399)",
  },
  Medium: {
    color: "#fbbf24", glow: "rgba(251,191,36,0.18)",
    bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.22)",
    dot: "#fbbf24", gradFrom: "#F59E0B", gradTo: "#FCD34D",
    bar: "linear-gradient(90deg,#f59e0b,#fbbf24)",
  },
  Hard: {
    color: "#f87171", glow: "rgba(248,113,113,0.18)",
    bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.22)",
    dot: "#f87171", gradFrom: "#EF4444", gradTo: "#F87171",
    bar: "linear-gradient(90deg,#ef4444,#f87171)",
  },
};
const D = (d) => DIFF[d] || DIFF.Medium;

/* ─────────────────────────────────────────────────────────
   BACKGROUND CANVAS
───────────────────────────────────────────────────────── */
function BgCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * 1200, y: Math.random() * 900,
      vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .15,
      r: .5 + Math.random() * 1.3, op: .04 + Math.random() * .08,
      ph: Math.random() * Math.PI * 2,
    }));
    let t = 0, id;
    const tick = () => {
      t += .007;
      ctx.clearRect(0, 0, W(), H());
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W(); if (p.x > W()) p.x = 0;
        if (p.y < 0) p.y = H(); if (p.y > H()) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.op * (.7 + .3 * Math.sin(t + p.ph))})`;
        ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 100) * .028})`;
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <canvas ref={ref} style={{
      position: "fixed", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 0, opacity: .5,
    }} />
  );
}

/* ─────────────────────────────────────────────────────────
   MAGIC HOVER CARD — mouse-tracking radial gradient
   (same mechanic as MagicCard, rewritten in Vantage style)
───────────────────────────────────────────────────────── */
function MagicProblemCard({ algo, onClick, fallbackIcon: FallbackIcon, index }) {
  const Icon = algo.icon || FallbackIcon || Hash;
  const diff = D(algo.difficulty);

  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);

  const reset = useCallback(() => {
    mouseX.set(-300); mouseY.set(-300);
  }, [mouseX, mouseY]);

  const handleMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  // Magnetic border gradient — follows cursor
  const borderGrad = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, ${diff.gradFrom}, ${diff.gradTo}, rgba(255,255,255,0.06) 80%)`;

  // Inner glow — same cursor tracking, softer
  const innerGlow = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, ${diff.glow}, transparent 80%)`;

  const [hov, setHov] = useState(false);

  return (
    <div
      className="tp-card"
      data-cursor="EXPLORE"
      style={{ position: "relative", borderRadius: 16, cursor: "none" }}
      onPointerMove={handleMove}
      onPointerLeave={() => { reset(); setHov(false); }}
      onPointerEnter={() => setHov(true)}
      onClick={onClick}
    >
      {/* Magic magnetic border */}
      <motion.div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        background: borderGrad,
        opacity: hov ? 1 : 0,
        transition: "opacity 0.25s",
        padding: 1,
        zIndex: 0,
      }} />

      {/* Card shell */}
      <div style={{
        position: "relative", zIndex: 1,
        margin: hov ? 1 : 0,
        borderRadius: 15,
        background: "#0d0d10",
        border: hov ? "none" : "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
        transition: "margin 0.25s, border 0.25s",
      }}>
        {/* Inner glow overlay */}
        <motion.div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: innerGlow,
          opacity: hov ? 1 : 0,
          transition: "opacity 0.3s",
          borderRadius: 15,
          zIndex: 0,
        }} />

        {/* Left difficulty bar */}
        <div style={{
          position: "absolute", left: 0, top: 10, bottom: 10,
          width: 3, borderRadius: "0 3px 3px 0",
          background: diff.bar,
          opacity: hov ? 1 : 0.35,
          transition: "opacity 0.25s",
        }} />

        {/* Row content */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", gap: 16,
          padding: "14px 18px 14px 22px",
        }}>

          {/* Icon */}
          <div style={{
            flexShrink: 0, width: 42, height: 42, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: hov ? diff.bg : "rgba(255,255,255,0.04)",
            border: `1px solid ${hov ? diff.border : "rgba(255,255,255,0.07)"}`,
            transform: hov ? "scale(1.08)" : "scale(1)",
            boxShadow: hov ? `0 4px 20px ${diff.glow}` : "none",
            transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <Icon size={18} style={{ color: hov ? diff.color : "rgba(255,255,255,0.35)" }} />
          </div>

          {/* Title + description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: T.fontFamily, fontSize: 14, fontWeight: 900,
              letterSpacing: T.letterSpacing?.monument || "0.03em",
              color: hov ? "#fff" : "rgba(255,255,255,0.75)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              transition: "color 0.2s",
              marginBottom: 4,
            }}>
              {algo.label}
            </div>
            <div style={{
              fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              transition: "color 0.2s",
              color: hov ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.28)",
            }}>
              {algo.description}
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {algo.technique && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 9px", borderRadius: 7,
                background: hov ? "rgba(85,66,255,0.12)" : "rgba(85,66,255,0.06)",
                border: `1px solid ${hov ? "rgba(85,66,255,0.35)" : "rgba(85,66,255,0.15)"}`,
                fontSize: 10, fontWeight: 800, color: "#B28EF2",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}>
                <Zap size={9} />
                {algo.technique}
              </div>
            )}
            {(algo.tags || []).slice(0, 2).map(tag => (
              <div key={tag} style={{
                padding: "3px 9px", borderRadius: 7,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)",
                whiteSpace: "nowrap",
                display: "none", // shown at lg via media query override
              }} className="tp-tag">
                {tag}
              </div>
            ))}
          </div>

          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {algo.number && (
              <span style={{
                fontFamily: "monospace", fontSize: 10,
                color: "rgba(255,255,255,0.2)", fontVariantNumeric: "tabular-nums",
              }}>
                #{algo.number}
              </span>
            )}
            {algo.difficulty && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 999,
                background: hov ? diff.bg : "rgba(255,255,255,0.04)",
                border: `1px solid ${hov ? diff.border : "rgba(255,255,255,0.07)"}`,
                transition: "all 0.2s",
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: diff.dot,
                  boxShadow: hov ? `0 0 6px ${diff.dot}` : "none",
                  transition: "box-shadow 0.2s",
                }} />
                <span style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: ".12em",
                  textTransform: "uppercase", color: hov ? diff.color : "rgba(255,255,255,0.3)",
                  transition: "color 0.2s",
                }}>
                  {algo.difficulty}
                </span>
              </div>
            )}
          </div>

          {/* Time complexity */}
          {algo.timeComplexity && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10, fontFamily: "monospace",
              color: hov ? "rgba(237,255,102,0.65)" : "rgba(255,255,255,0.2)",
              flexShrink: 0, transition: "color 0.2s",
            }}>
              <Clock size={10} />
              {algo.timeComplexity}
            </div>
          )}

          {/* CTA */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            fontSize: 11, fontWeight: 800, letterSpacing: ".06em",
            color: hov ? "#EDFF66" : "rgba(255,255,255,0.2)",
            transition: "color 0.2s",
          }}>
            Explore
            <ChevronRight
              size={13}
              style={{
                transform: hov ? "translateX(2px)" : "translateX(0)",
                transition: "transform 0.2s",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DIFFICULTY BREAKDOWN BAR
───────────────────────────────────────────────────────── */
function DiffBreakdown({ algorithms }) {
  const easy   = algorithms.filter(a => a.difficulty === "Easy").length;
  const medium = algorithms.filter(a => a.difficulty === "Medium").length;
  const hard   = algorithms.filter(a => a.difficulty === "Hard").length;
  const total  = algorithms.length || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        display: "flex", height: 4, borderRadius: 4, overflow: "hidden",
        background: "rgba(255,255,255,0.05)", gap: 2,
      }}>
        {easy   > 0 && <div style={{ flex: easy,   background: "linear-gradient(90deg,#10b981,#34d399)", borderRadius: 4 }} />}
        {medium > 0 && <div style={{ flex: medium, background: "linear-gradient(90deg,#f59e0b,#fbbf24)", borderRadius: 4 }} />}
        {hard   > 0 && <div style={{ flex: hard,   background: "linear-gradient(90deg,#ef4444,#f87171)", borderRadius: 4 }} />}
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        {[
          { label: "Easy",   count: easy,   color: "#34d399" },
          { label: "Medium", count: medium, color: "#fbbf24" },
          { label: "Hard",   count: hard,   color: "#f87171" },
        ].map(({ label, count, color }) => count > 0 && (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
            <span style={{
              fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)",
              letterSpacing: ".1em", textTransform: "uppercase",
              fontVariantNumeric: "tabular-nums",
            }}>
              {count} {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT BLOCK
───────────────────────────────────────────────────────── */
function StatBlock({ value, label, color }) {
  return (
    <div style={{ padding: "14px 20px" }}>
      <div style={{
        fontFamily: T.fontFamily, fontSize: 26, fontWeight: 900,
        color: color || "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: ".2em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: 4,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TOPIC PAGE
═══════════════════════════════════════════════════════ */
const TopicPage = ({
  topicKey,
  title,
  eyebrow,
  description,
  icon: Icon,
  basePath,
}) => {
  const navigate = useNavigate();
  const pageRef  = useRef(null);

  const algorithms = PROBLEM_CATALOG.filter(p => p.topic === topicKey);
  const easy   = algorithms.filter(a => a.difficulty === "Easy").length;
  const medium = algorithms.filter(a => a.difficulty === "Medium").length;
  const hard   = algorithms.filter(a => a.difficulty === "Hard").length;

  /* ── GSAP entrance ── */
  useGSAP(() => {
    gsap.fromTo(".tp-eyebrow",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.55, ease: "expo.out", delay: 0.05 }
    );
    gsap.fromTo(".tp-title",
      { opacity: 0, y: 40, skewY: 1.5 },
      { opacity: 1, y: 0, skewY: 0, duration: 0.85, ease: "expo.out", delay: 0.14 }
    );
    gsap.fromTo(".tp-sub",
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", delay: 0.3 }
    );
    gsap.fromTo(".tp-stats",
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", delay: 0.42 }
    );
    gsap.fromTo(".tp-breakdown",
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.45, ease: "expo.out", delay: 0.52 }
    );
    gsap.fromTo(".tp-divider",
      { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: 0.7, ease: "expo.out", delay: 0.6, transformOrigin: "left" }
    );
  }, { scope: pageRef });

  /* ── ScrollTrigger for cards ── */
  useGSAP(() => {
    gsap.fromTo(".tp-card",
      { opacity: 0, y: 28, x: -8 },
      {
        opacity: 1, y: 0, x: 0,
        duration: 0.55, ease: "expo.out",
        stagger: 0.065,
        scrollTrigger: {
          trigger: ".tp-list",
          start: "top 88%",
        },
      }
    );
  }, { scope: pageRef });

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: "100vh",
        background: "#09090b",
        position: "relative",
        overflowX: "hidden",
        paddingTop: 56,
        paddingBottom: 100,
        cursor: "none",
      }}
    >
      <CustomCursor />
      <BgCanvas />

      {/* Noise */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: .018,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "256px",
      }} />
      {/* Grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: .013,
        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
        backgroundSize: "52px 52px",
      }} />
      {/* Ambient */}
      <div style={{
        position: "fixed", top: "-18%", right: "-12%",
        width: 600, height: 600, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(85,66,255,0.06) 0%, transparent 65%)",
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-8%",
        width: 500, height: 500, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 65%)",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 1080, margin: "0 auto",
        padding: "36px clamp(20px,5vw,52px) 0",
      }}>

        {/* ── BACK NAV ── */}
        <nav style={{ marginBottom: 36 }}>
          <button
            onClick={() => navigate(-1)}
            data-cursor="BACK"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 11, fontWeight: 800, letterSpacing: ".1em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
              background: "none", border: "none", cursor: "none",
              padding: 0, transition: "color .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.28)"}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </nav>

        {/* ══ HERO ════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 48 }}>

          {/* Ghost watermark */}
          <div style={{
            position: "absolute", right: "clamp(20px,5vw,52px)", top: 80,
            fontFamily: T.fontFamily, fontWeight: 900,
            fontSize: "clamp(5rem,14vw,11rem)", letterSpacing: "-.03em",
            color: "rgba(255,255,255,0.022)", lineHeight: .85,
            textTransform: "uppercase", pointerEvents: "none", userSelect: "none",
          }}>
            {topicKey}
          </div>

          {/* Eyebrow */}
          <div className="tp-eyebrow" style={{ marginBottom: 18 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 12px", borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              fontSize: 9, fontWeight: 900, letterSpacing: ".22em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
            }}>
              {Icon && <Icon size={10} style={{ color: "#EDFF66" }} />}
              {eyebrow}
            </span>
          </div>

          {/* Title + stats grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto",
            gap: 40, alignItems: "end",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: 32, marginBottom: 28,
          }}>
            <div>
              <h1 className="tp-title" style={{
                fontFamily: T.fontFamily,
                fontSize: "clamp(3rem,8vw,6.5rem)",
                fontWeight: 900, letterSpacing: "-.035em",
                lineHeight: .88, textTransform: "uppercase",
                color: "#fff", marginBottom: 16,
              }}>
                {title}
                <span style={{ color: "#EDFF66", display: "block" }}>.</span>
              </h1>
              <p className="tp-sub" style={{
                fontSize: 14, color: "rgba(255,255,255,0.3)",
                lineHeight: 1.7, maxWidth: 460,
              }}>
                {description}
              </p>
            </div>

            {/* Right: info card */}
            <div className="tp-stats" style={{
              flexShrink: 0, minWidth: 200,
              background: "#0d0d10",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18, overflow: "hidden",
            }}>
              <div style={{ height: 2, background: "linear-gradient(90deg,#EDFF66,#34d399,#f87171)" }} />
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <StatBlock value={algorithms.length} label="Problems" color="#fff" />
                <div style={{ width: 1, background: "rgba(255,255,255,0.05)", alignSelf: "stretch" }} />
                <StatBlock value={`${hard}`} label="Hard" color="#f87171" />
              </div>
            </div>
          </div>

          {/* Difficulty breakdown */}
          <div className="tp-breakdown">
            <DiffBreakdown algorithms={algorithms} />
          </div>
        </div>

        {/* ── SECTION LABEL ── */}
        <div className="tp-divider" style={{
          display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 900, letterSpacing: ".25em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
            whiteSpace: "nowrap",
          }}>
            All Problems · {algorithms.length}
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* ══ PROBLEM LIST ════════════════════════════════════════ */}
        <div className="tp-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {algorithms.map((algo, i) => (
            <MagicProblemCard
              key={algo.subpage || algo.label}
              algo={algo}
              index={i}
              fallbackIcon={Icon}
              onClick={algo.subpage ? () => navigate(`${basePath}/${algo.subpage}`) : undefined}
            />
          ))}

          {algorithms.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "80px 24px", gap: 14, textAlign: "center",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 4,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <BookOpen size={20} style={{ color: "rgba(255,255,255,0.14)" }} />
              </div>
              <p style={{
                fontFamily: T.fontFamily, fontSize: 16, fontWeight: 900,
                textTransform: "uppercase", letterSpacing: ".06em",
                color: "rgba(255,255,255,0.18)",
              }}>
                No problems yet
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", lineHeight: 1.65 }}>
                Problems for this topic will appear here.
              </p>
            </div>
          )}
        </div>

        {/* ── Bottom count ── */}
        {algorithms.length > 0 && (
          <div style={{
            display: "flex", justifyContent: "center", paddingTop: 40,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 900, letterSpacing: ".22em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.14)",
            }}>
              {algorithms.length} problem{algorithms.length !== 1 ? "s" : ""} · {topicKey}
            </span>
          </div>
        )}
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @media (min-width: 1024px) { .tp-tag { display: flex !important; } }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr auto"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TopicPage;