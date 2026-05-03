import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  Award, Trophy, Flame, Swords, Star, Lock,
  Coins, Sparkles, CheckCircle2, ArrowRight,
} from "lucide-react";
import useUserStore from "@/stores/useUserStore";
import useAchievementStore from "@/stores/useAchievementStore";
import CustomCursor from "@/components/common/CustomCursor";
import { MONUMENT_TYPO as T } from "@/components/common/MonumentTypography";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   ACCENT SYSTEM — restrained, not neon
─────────────────────────────────────────────── */
const ACCENT = {
  PROBLEM: { text: "#34d399", dim: "rgba(52,211,153,0.55)",  border: "rgba(52,211,153,0.14)",  bg: "rgba(52,211,153,0.06)",  bar: "linear-gradient(90deg,#065f46,#34d399)", label: "PROBLEM"  },
  STREAK:  { text: "#fbbf24", dim: "rgba(251,191,36,0.55)",  border: "rgba(251,191,36,0.14)",  bg: "rgba(251,191,36,0.06)",  bar: "linear-gradient(90deg,#78350f,#fbbf24)", label: "STREAK"   },
  BATTLE:  { text: "#f87171", dim: "rgba(248,113,113,0.55)", border: "rgba(248,113,113,0.14)", bg: "rgba(248,113,113,0.06)", bar: "linear-gradient(90deg,#7f1d1d,#f87171)", label: "BATTLE"   },
  SPECIAL: { text: "#c4b5fd", dim: "rgba(196,181,253,0.55)", border: "rgba(196,181,253,0.14)", bg: "rgba(196,181,253,0.06)", bar: "linear-gradient(90deg,#3b0764,#c4b5fd)", label: "SPECIAL"  },
};
const getA = (cat) => ACCENT[cat] || ACCENT.SPECIAL;

const CATEGORIES = [
  { key: "ALL",     label: "All",      icon: Award  },
  { key: "PROBLEM", label: "Problems", icon: Star   },
  { key: "STREAK",  label: "Streaks",  icon: Flame  },
  { key: "BATTLE",  label: "Battle",   icon: Swords },
  { key: "SPECIAL", label: "Special",  icon: Trophy },
];

/* ─────────────────────────────────────────────
   BADGE ICON
─────────────────────────────────────────────── */
function BadgeIcon({ badge, size = 18, color }) {
  const n = badge.name.toLowerCase();
  const s = { color, flexShrink: 0 };
  if (n.includes("streak") || n.includes("warrior")) return <Flame    size={size} style={s} />;
  if (n.includes("battle") || n.includes("clash"))   return <Swords   size={size} style={s} />;
  if (n.includes("trophy") || n.includes("century")) return <Trophy   size={size} style={s} />;
  if (n.includes("mastery"))                          return <Star     size={size} style={s} />;
  if (n.includes("sweep"))                            return <Sparkles size={size} style={s} />;
  switch (badge.category) {
    case "STREAK":  return <Flame    size={size} style={s} />;
    case "BATTLE":  return <Swords   size={size} style={s} />;
    case "SPECIAL": return <Trophy   size={size} style={s} />;
    default:        return <Award    size={size} style={s} />;
  }
}

/* ─────────────────────────────────────────────
   3D TILT — precise, snappy
─────────────────────────────────────────────── */
function TiltCard({ children, style, intensity = 8 }) {
  const ref = useRef(null);
  const raf = useRef(null);
  const onMove = useCallback((e) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) translateZ(6px)`;
    });
  }, [intensity]);
  const onLeave = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    gsap.to(ref.current, { transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)", duration: 0.6, ease: "expo.out" });
  }, []);
  return (
    <div ref={ref} style={{ willChange: "transform", transformStyle: "preserve-3d", cursor: "none", ...style }}
      onMouseMove={onMove} onMouseLeave={onLeave}>{children}</div>
  );
}

/* ─────────────────────────────────────────────
   COUNT-UP
─────────────────────────────────────────────── */
function CountUp({ to, duration = 1.4, delay = 0, style, suffix = "" }) {
  const ref = useRef(null);
  const o   = useRef({ v: 0 });
  useEffect(() => {
    gsap.to(o.current, {
      v: to, duration, delay, ease: "power3.out",
      onUpdate: () => { if (ref.current) ref.current.textContent = Math.round(o.current.v) + suffix; },
    });
  }, [to, duration, delay, suffix]);
  return <span ref={ref} style={style}>0{suffix}</span>;
}

/* ─────────────────────────────────────────────
   SCROLL-TRIGGERED BAR
─────────────────────────────────────────────── */
function AnimBar({ pct, bar, delay = 0, height = 2 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const t = ScrollTrigger.create({
      trigger: ref.current, start: "top 97%",
      onEnter: () => gsap.fromTo(ref.current,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.9, ease: "expo.out", delay }
      ),
    });
    return () => t.kill();
  }, [pct, delay]);
  return (
    <div style={{ height, borderRadius: height, background: "rgba(255,255,255,0.06)", overflow: "hidden", position: "relative" }}>
      <div ref={ref} style={{ height: "100%", width: `${pct}%`, borderRadius: height, background: bar, transformOrigin: "left center", scaleX: 0 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   HORIZONTAL SHOWCASE — earned badges marquee
─────────────────────────────────────────────── */
function EarnedShowcase({ badges }) {
  const trackRef = useRef(null);
  const tlRef    = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || badges.length === 0) return;
    // Clone for seamless loop
    const items = track.querySelectorAll(".showcase-item");
    const totalW = Array.from(items).reduce((s, el) => s + el.offsetWidth + 16, 0);
    tlRef.current = gsap.to(track, {
      x: -totalW / 2, duration: badges.length * 3.5, ease: "none", repeat: -1,
      modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % (totalW / 2)) },
    });
    return () => tlRef.current?.kill();
  }, [badges]);

  if (badges.length === 0) return null;
  const doubled = [...badges, ...badges]; // double for loop

  return (
    <div style={{ overflow: "hidden", position: "relative", marginBottom: 0 }}>
      {/* fade edges */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(90deg,#09090b,transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(270deg,#09090b,transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div ref={trackRef} style={{ display: "flex", gap: 16, paddingBlock: 4, width: "max-content" }}>
        {doubled.map((b, i) => {
          const a = getA(b.category);
          return (
            <div key={i} className="showcase-item" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px 8px 10px", borderRadius: 40,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${a.border}`,
              flexShrink: 0, whiteSpace: "nowrap",
            }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: a.bg, border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BadgeIcon badge={b} size={11} color={a.text} />
              </div>
              <span style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 11, letterSpacing: "0.04em", color: "rgba(255,255,255,0.6)" }}>
                {b.name}
              </span>
              <CheckCircle2 size={10} style={{ color: "#34d399", opacity: 0.7 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STICKY CATEGORY BAR
─────────────────────────────────────────────── */
function StickyTabs({ active, onChange, badges, earnedCount }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ScrollTrigger.create({
      trigger: ref.current, start: "top 72px",
      onToggle: ({ isActive }) => {
        gsap.to(ref.current, {
          background: isActive ? "rgba(9,9,11,0.92)" : "transparent",
          backdropFilter: isActive ? "blur(16px)" : "blur(0px)",
          borderColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
          duration: 0.3, ease: "power2.out",
        });
      },
    });
  }, []);

  return (
    <div ref={ref} style={{
      position: "sticky", top: 64, zIndex: 40,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", marginBottom: 36,
      borderBottom: "1px solid transparent",
      transition: "all 0.3s",
    }}>
      <div style={{ display: "flex", gap: 2 }}>
        {CATEGORIES.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          const count  = key === "ALL" ? badges.length : badges.filter(b => b.category === key).length;
          const earned = key === "ALL" ? earnedCount   : badges.filter(b => b.category === key && b.earned).length;
          const a = key !== "ALL" ? getA(key) : null;
          return (
            <button key={key} onClick={() => onChange(key)} data-cursor={label.toUpperCase()}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 8, border: "none", cursor: "none",
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
                color: isActive ? "#fff" : "rgba(255,255,255,0.28)",
                transition: "all 0.15s", position: "relative",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.28)"; }}
            >
              <Icon size={11} style={{ color: isActive && a ? a.text : "inherit" }} />
              {label}
              {isActive && (
                <span style={{ fontSize: 9, fontWeight: 900, padding: "1px 6px", borderRadius: 4, background: a ? a.bg : "rgba(237,255,102,0.1)", color: a ? a.text : "#EDFF66", border: `1px solid ${a ? a.border : "rgba(237,255,102,0.2)"}` }}>
                  {earned}/{count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* live counter */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", animation: "ach-blink 2s step-end infinite" }} />
        {earnedCount} UNLOCKED
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BADGE CARD — the main event
─────────────────────────────────────────────── */
function BadgeCard({ badge, index, rank }) {
  const a      = getA(badge.category);
  const earned = badge.earned;
  const pct    = badge.target > 0 ? Math.min(100, Math.round((badge.progress / badge.target) * 100)) : 0;
  const hidden = badge.isHidden && !earned;
  const hov    = useRef(null);

  const onEnter = () => {
    if (!hov.current) return;
    gsap.to(hov.current, { opacity: 1, duration: 0.2 });
  };
  const onLeave = () => {
    if (!hov.current) return;
    gsap.to(hov.current, { opacity: 0, duration: 0.25 });
  };

  return (
    <TiltCard intensity={7}
      style={{
        position: "relative", borderRadius: 16, overflow: "hidden",
        background: "#0c0c0f",
        border: `1px solid ${earned ? a.border : "rgba(255,255,255,0.05)"}`,
      }}
    >
      {/* hover fill */}
      <div ref={hov} style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.015)", opacity: 0, pointerEvents: "none", zIndex: 1 }}
        onMouseEnter={onEnter} onMouseLeave={onLeave} />

      {/* earned: top accent + corner rank */}
      {earned && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: a.bar, zIndex: 2 }} />}

      {hidden && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, borderRadius: 16, backdropFilter: "blur(10px)", background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Lock size={16} style={{ color: "rgba(255,255,255,0.15)" }} />
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>Hidden</span>
        </div>
      )}

      <div onMouseEnter={onEnter} onMouseLeave={onLeave}
        style={{ padding: "20px 20px 18px", filter: hidden ? "blur(5px)" : "none", userSelect: hidden ? "none" : undefined, position: "relative", zIndex: 2 }}>

        {/* Top meta row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {/* Icon */}
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: earned ? a.bg : "rgba(255,255,255,0.03)",
            border: `1px solid ${earned ? a.border : "rgba(255,255,255,0.06)"}`,
            position: "relative",
          }}>
            <BadgeIcon badge={badge} size={19} color={earned ? a.text : "rgba(255,255,255,0.15)"} />
            {earned && (
              <div style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: "#34d399", border: "2.5px solid #09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={8} style={{ color: "#fff" }} />
              </div>
            )}
          </div>

          {/* category pill + rank */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: earned ? a.dim : "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: 20, border: `1px solid ${earned ? a.border : "rgba(255,255,255,0.06)"}`, background: earned ? a.bg : "transparent" }}>
              {badge.category}
            </span>
            {rank && (
              <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>
                #{String(rank).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 15, letterSpacing: "0.01em", color: earned ? "#fff" : "rgba(255,255,255,0.3)", lineHeight: 1.15, marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {badge.name}
        </div>

        {/* Desc */}
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.22)", lineHeight: 1.6, marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.8em" }}>
          {badge.description}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 14 }} />

        {/* Bottom row: rewards + pct */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {badge.coinReward > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 800, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.13)", color: "#fbbf24" }}>
                <Coins size={8} /> +{badge.coinReward}
              </span>
            )}
            {badge.xpReward > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 800, background: "rgba(196,181,253,0.07)", border: "1px solid rgba(196,181,253,0.13)", color: "#c4b5fd" }}>
                <Sparkles size={8} /> +{badge.xpReward} XP
              </span>
            )}
            {!badge.coinReward && !badge.xpReward && (
              <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.12)" }}>—</span>
            )}
          </div>
          <span style={{ fontFamily: T.fontFamily, fontSize: 13, fontWeight: 900, color: earned ? a.text : "rgba(255,255,255,0.2)", flexShrink: 0 }}>
            {earned ? "100" : pct}%
          </span>
        </div>

        {/* Progress bar */}
        <AnimBar pct={earned ? 100 : pct} bar={earned ? a.bar : "rgba(255,255,255,0.08)"} delay={index * 0.02} height={2} />
      </div>
    </TiltCard>
  );
}

/* ─────────────────────────────────────────────
   SKELETON
─────────────────────────────────────────────── */
function Skeleton({ i }) {
  return (
    <div style={{ borderRadius: 16, padding: "20px 20px 18px", background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.04)", animation: `ach-pulse 1.6s ease-in-out ${i * 0.08}s infinite` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,0.04)" }} />
        <div style={{ width: 60, height: 20, borderRadius: 10, background: "rgba(255,255,255,0.03)" }} />
      </div>
      <div style={{ height: 14, width: "60%", borderRadius: 6, background: "rgba(255,255,255,0.04)", marginBottom: 9 }} />
      <div style={{ height: 10, width: "88%", borderRadius: 5, background: "rgba(255,255,255,0.03)", marginBottom: 6 }} />
      <div style={{ height: 10, width: "70%", borderRadius: 5, background: "rgba(255,255,255,0.03)", marginBottom: 20 }} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 14 }} />
      <div style={{ height: 2, borderRadius: 2, background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION BREAK — editorial big number
─────────────────────────────────────────────── */
function SectionBreak({ num, label, count, color, icon: Icon }) {
  return (
    <div className="ach-break" style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 22, position: "relative" }}>
      {/* Big number watermark */}
      <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: "clamp(3.5rem,8vw,6rem)", lineHeight: 1, color: "rgba(255,255,255,0.025)", letterSpacing: "-0.04em", userSelect: "none", flexShrink: 0, marginRight: 20 }}>
        {String(num).padStart(2, "0")}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon size={11} style={{ color }} />
          <span style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
            {label}
          </span>
          <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "1px 7px", borderRadius: 4 }}>
            {count}
          </span>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO STAT PILL
─────────────────────────────────────────────── */
function StatPill({ value, label, color, delay }) {
  return (
    <div className="ach-stat" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 2, padding: "14px 20px", background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
      <CountUp to={value} delay={delay} style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 26, color, lineHeight: 1, letterSpacing: "-0.02em" }} />
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   OVERALL ARC SVG
─────────────────────────────────────────────── */
function ArcMeter({ pct }) {
  const pathRef = useRef(null);
  const r = 52, cx = 64, cy = 64, stroke = 5;
  const startAngle = -210, sweep = 240;
  const toRad = d => (d * Math.PI) / 180;
  const arcPath = (sa, ea) => {
    const x1 = cx + r * Math.cos(toRad(sa));
    const y1 = cy + r * Math.sin(toRad(sa));
    const x2 = cx + r * Math.cos(toRad(ea));
    const y2 = cy + r * Math.sin(toRad(ea));
    const large = ea - sa > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const totalLen = (sweep / 360) * 2 * Math.PI * r;

  useEffect(() => {
    if (!pathRef.current) return;
    gsap.fromTo(pathRef.current,
      { strokeDashoffset: totalLen },
      { strokeDashoffset: totalLen - (pct / 100) * totalLen, duration: 1.6, ease: "power3.out", delay: 0.6 }
    );
  }, [pct, totalLen]);

  return (
    <svg width={128} height={128} style={{ overflow: "visible" }}>
      {/* track */}
      <path d={arcPath(startAngle, startAngle + sweep)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} strokeLinecap="round" />
      {/* fill */}
      <path ref={pathRef} d={arcPath(startAngle, startAngle + sweep)} fill="none"
        stroke="url(#arc-g)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={totalLen} strokeDashoffset={totalLen} />
      <defs>
        <linearGradient id="arc-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#EDFF66" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#EDFF66" />
        </linearGradient>
      </defs>
      {/* center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily={T.fontFamily} letterSpacing="-1">{pct}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="700" letterSpacing="2">PCT</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function AchievementsPage() {
  const navigate = useNavigate();
  const user     = useUserStore(s => s.user);
  const pageRef  = useRef(null);
  const heroRef  = useRef(null);

  const badges           = useAchievementStore(s => s.achievements);
  const loading          = useAchievementStore(s => s.loading);
  const loadAchievements = useAchievementStore(s => s.loadAchievements);
  const earnedCount      = useAchievementStore(s => s.earnedCount);

  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    if (!user?.uid) return;
    loadAchievements(user.uid);
  }, [user?.uid, loadAchievements]);

  /* Hero + entrance animations */
  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.05 });

    tl.fromTo(".ach-eyebrow",
      { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
      .fromTo(".ach-title-line",
        { opacity: 0, y: 40, skewY: 1 },
        { opacity: 1, y: 0, skewY: 0, duration: 0.75, ease: "expo.out", stagger: 0.07 }, "-=0.2")
      .fromTo(".ach-sub",
        { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.3")
      .fromTo(".ach-stat",
        { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.45, ease: "power3.out" }, "-=0.2")
      .fromTo(".ach-arc",
        { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" }, "-=0.35")
      .fromTo(".ach-showcase",
        { opacity: 0 }, { opacity: 1, duration: 0.5 }, "-=0.2");

  }, { scope: pageRef });

  /* Card scroll reveal */
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      ScrollTrigger.batch("[data-badge]", {
        onEnter: els => gsap.fromTo(els,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.55, ease: "power3.out" }
        ),
        start: "top 94%",
      });
      gsap.utils.toArray(".ach-break").forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.55, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" } }
        );
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [loading, activeCategory]);

  const filtered   = useMemo(() => activeCategory === "ALL" ? badges : badges.filter(b => b.category === activeCategory), [badges, activeCategory]);
  const earned     = useMemo(() => [...filtered].filter(b =>  b.earned).sort((a,b) => (a.earnedAt||0) < (b.earnedAt||0) ? 1 : -1), [filtered]);
  const inProgress = useMemo(() => filtered.filter(b => !b.earned && b.progress > 0).sort((a,b) => (b.progress/b.target) - (a.progress/a.target)), [filtered]);
  const locked     = useMemo(() => filtered.filter(b => !b.earned && b.progress === 0), [filtered]);
  const overallPct = badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0;
  const inProgCt   = useMemo(() => badges.filter(b => !b.earned && b.progress > 0).length, [badges]);

  /* ── not logged in ── */
  if (!user?.uid) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "none" }}>
        <CustomCursor />
        <div style={{ maxWidth: 340, width: "100%", background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(196,181,253,0.5),transparent)" }} />
          <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(196,181,253,0.07)", border: "1px solid rgba(196,181,253,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={20} style={{ color: "#c4b5fd" }} />
            </div>
            <div>
              <div style={{ fontFamily: T.fontFamily, fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "0.02em", marginBottom: 7 }}>Sign in to continue</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>Track your badges and forge your legacy.</p>
            </div>
            <button onClick={() => navigate("/login")} data-cursor="GO"
              style={{ width: "100%", height: 44, borderRadius: 10, border: "none", cursor: "none", background: "#EDFF66", color: "#09090b", fontSize: 11, fontWeight: 900, letterSpacing: "0.09em", textTransform: "uppercase" }}>
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} style={{ minHeight: "100vh", background: "#09090b", paddingTop: 56, paddingBottom: 120, cursor: "none", overflowX: "hidden", position: "relative" }}>
      <CustomCursor />

      {/* ── bg atmosphere ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,181,253,0.04) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "55%", left: "-6%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.025) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.012, backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ══ HERO ══ */}
        <div ref={heroRef} style={{ maxWidth: 1080, margin: "0 auto", padding: "44px clamp(24px,5vw,56px) 0" }}>

          {/* Two-col hero layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 48, alignItems: "center", paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 0 }}>

            {/* Left */}
            <div>
              <div className="ach-eyebrow" style={{ opacity: 0, display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ height: 1, width: 28, background: "rgba(255,255,255,0.2)" }} />
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Badge Collection</span>
              </div>

              <div style={{ overflow: "hidden", marginBottom: 4 }}>
                <h1 className="ach-title-line" style={{ opacity: 0, fontFamily: T.fontFamily, fontWeight: 900, fontSize: "clamp(3.2rem,7vw,6.2rem)", lineHeight: 0.88, letterSpacing: "-0.025em", color: "#fff", margin: 0, display: "block" }}>
                  YOUR
                </h1>
              </div>
              <div style={{ overflow: "hidden", marginBottom: 20 }}>
                <h1 className="ach-title-line" style={{ opacity: 0, fontFamily: T.fontFamily, fontWeight: 900, fontSize: "clamp(3.2rem,7vw,6.2rem)", lineHeight: 0.88, letterSpacing: "-0.025em", color: "rgba(255,255,255,0.18)", margin: 0, display: "block" }}>
                  LEGACY.
                </h1>
              </div>

              <p className="ach-sub" style={{ opacity: 0, fontSize: 14, color: "rgba(255,255,255,0.28)", lineHeight: 1.75, maxWidth: 400, marginBottom: 28 }}>
                Every badge is a milestone. Every streak, a statement. Build a trophy case that speaks before you do.
              </p>

              {/* Stat pills row */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <StatPill value={badges.length}  label="Total Badges" color="#fff"     delay={0.55} />
                <StatPill value={earnedCount}     label="Earned"       color="#34d399"  delay={0.62} />
                <StatPill value={inProgCt}        label="In Progress"  color="#fbbf24"  delay={0.69} />
              </div>
            </div>

            {/* Right — arc meter */}
            <div className="ach-arc" style={{ opacity: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <ArcMeter pct={overallPct} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 3 }}>Completion</div>
                <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 16, color: "#fff" }}>
                  {earnedCount}<span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 12 }}>/{badges.length}</span>
                </div>
              </div>
              {/* Category breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 4 }}>
                {Object.entries(ACCENT).map(([cat, a]) => {
                  const total = badges.filter(b => b.category === cat).length;
                  const done  = badges.filter(b => b.category === cat && b.earned).length;
                  if (total === 0) return null;
                  const p = Math.round((done / total) * 100);
                  return (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: a.dim, width: 52, flexShrink: 0 }}>{cat}</span>
                      <div style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p}%`, background: a.bar, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.2)", width: 22, textAlign: "right", flexShrink: 0 }}>{done}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Earned showcase marquee ── */}
          {!loading && earned.length > 0 && (
            <div className="ach-showcase" style={{ opacity: 0, paddingBlock: 20, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Earned</span>
                <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.04)" }} />
                <ArrowRight size={10} style={{ color: "rgba(255,255,255,0.15)" }} />
              </div>
              <EarnedShowcase badges={earned} />
            </div>
          )}
        </div>

        {/* ══ STICKY TABS + CONTENT ══ */}
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 clamp(24px,5vw,56px)" }}>
          <StickyTabs active={activeCategory} onChange={setActiveCategory} badges={badges} earnedCount={earnedCount} />

          {/* Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} i={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Award size={22} style={{ color: "rgba(255,255,255,0.1)" }} />
              </div>
              <div style={{ fontFamily: T.fontFamily, fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Nothing here yet</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.16)", lineHeight: 1.7 }}>Start solving to unlock badges.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

              {earned.length > 0 && (
                <section>
                  <SectionBreak num={1} label="Earned" count={earned.length} color="#34d399" icon={CheckCircle2} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    {earned.map((b, i) => (
                      <div key={b.id} data-badge style={{ opacity: 0 }}>
                        <BadgeCard badge={b} index={i} rank={i + 1} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {inProgress.length > 0 && (
                <section>
                  <SectionBreak num={2} label="In Progress" count={inProgress.length} color="#fbbf24" icon={Flame} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    {inProgress.map((b, i) => (
                      <div key={b.id} data-badge style={{ opacity: 0 }}>
                        <BadgeCard badge={b} index={i} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {locked.length > 0 && (
                <section>
                  <SectionBreak num={3} label="Locked" count={locked.length} color="rgba(255,255,255,0.2)" icon={Lock} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    {locked.map((b, i) => (
                      <div key={b.id} data-badge style={{ opacity: 0 }}>
                        <BadgeCard badge={b} index={i} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes ach-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes ach-blink { 0%,100%{opacity:1} 50%{opacity:0.1} }
        @media (max-width: 900px) {
          div[style*="1fr 220px"] { grid-template-columns: 1fr !important; }
          div[style*="repeat(3,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 560px) {
          div[style*="repeat(3,1fr)"],
          div[style*="repeat(2,1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}